import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDocFromServer, getDocs, collection, terminate, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { LOCAL, requireLocal, requireRuntime } from '../lib/config/local.js';
import { product, line, purchase } from './fixtures.mjs';

requireRuntime(); requireLocal();
let environment, owner, other, anonymous;
async function client(uid) {
  const app = initializeApp({ projectId: LOCAL.projectId, apiKey: 'demo-only-05a' }, crypto.randomUUID());
  const auth = getAuth(app); connectAuthEmulator(auth, `http://${LOCAL.authHost}`, { disableWarnings: true });
  const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8386);
  const fn = getFunctions(app, LOCAL.region); connectFunctionsEmulator(fn, '127.0.0.1', 5205);
  if (uid) {
    const part = v => Buffer.from(JSON.stringify(v)).toString('base64url');
    const token = `${part({ alg: 'none', typ: 'JWT' })}.${part({ uid,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit' })}.`;
    await signInWithCustomToken(auth, token);
  }
  return { db, call: async (name, input) => (await httpsCallable(fn, `${name}Experimental`)(input)).data,
    close: async () => { await terminate(db); await deleteApp(app); } };
}
const ref = (db, kind, id, uid = LOCAL.uid) => doc(db, `users/${uid}/${kind}/${id}`);
async function read(kind, id) { return (await getDocFromServer(ref(owner.db, kind, id))).data(); }
async function seed(count = 1, overrides = {}) {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (let start = 0; start < count; start += 100) {
      await Promise.all(Array.from({ length: Math.min(100, count - start) }, (_, j) => {
        const i = start + j; return setDoc(ref(db, 'products', `p${i}`), { ...product(i, overrides), updatedAt: serverTimestamp() });
      }));
    }
  });
}
async function snapshot() {
  const result = {};
  for (const name of ['products', 'operations']) result[name] = (await getDocs(collection(owner.db, `users/${LOCAL.uid}/${name}`))).docs.map(d => ({ id: d.id, data: d.data() }));
  return JSON.stringify(result);
}
before(async () => {
  environment = await initializeTestEnvironment({ projectId: LOCAL.projectId, firestore: { host: '127.0.0.1', port: 8386,
    rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
  [owner, other, anonymous] = await Promise.all([client(LOCAL.uid), client('demo-other-05a'), client(null)]);
  // A missing function / HTTP 404 must never count as a business-rule rejection.
  assert.equal((await owner.call('lookupOperation', { operationId: 'availability-probe' })).status, 'absent-at-server');
});
after(async () => {
  await Promise.all([owner?.close(), other?.close(), anonymous?.close()]); await environment?.cleanup();
});
for (const count of [5, 50, 100]) test(`local typed executor confirms ${count} existing products atomically`, async () => {
  await seed(count);
  const intent = purchase(`size-${count}`, count), result = await owner.call('confirmPurchase', intent);
  assert.equal(result.status, 'confirmed'); assert.equal(result.totalPaidCOP, 4200 * count);
  const op = await read('operations', intent.operationId);
  assert.equal(op.lines.length, count); assert.equal(op.movements.length, count); assert.equal(op.totalPaidCOP, 4200 * count);
  for (let i = 0; i < count; i++) assert.equal((await read('products', `p${i}`)).quantityMilli, 3000);
});
for (const count of [5, 50, 100]) test(`local typed executor creates ${count} new products exactly once`, async () => {
  await seed(0); const intent = purchase(`new-${count}`, count); intent.lines.forEach(l => l.newProduct = true);
  await owner.call('confirmPurchase', intent);
  assert.equal((await owner.call('confirmPurchase', intent)).status, 'already-confirmed');
  for (let i = 0; i < count; i++) assert.equal((await read('products', `p${i}`)).quantityMilli, 1000);
  assert.equal((await read('operations', intent.operationId)).movements.length, count);
});
test('mixed repeated, fractional, simple and service lines preserve every physical effect and one financial total', async () => {
  await seed(0); const intent = purchase('mixed');
  intent.lines = [line(0, { newProduct: true }), line(1, { newProduct: true, productId: 'p0', name: 'Producto ficticio 0' }),
    line(2, { newProduct: true, baseUnit: 'kg', unit: 'g', quantityMilli: 250000, priceMode: 'total', priceCOP: 1000 }),
    line(3, { newProduct: true, control: 'simple' }),
    { id: 'service', kind: 'expense', name: 'Servicio ficticio', categoryId: 'service', priceCOP: 2000, discountCOP: 0 }];
  intent.reviewedTotalCOP = 15600; await owner.call('confirmPurchase', intent);
  const op = await read('operations', intent.operationId);
  assert.equal(op.lines.length, 5); assert.equal(op.movements.length, 4); assert.equal(op.totalPaidCOP, 15600);
  assert.equal((await read('products', 'p0')).quantityMilli, 2000);
  assert.equal((await read('products', 'p2')).quantityMilli, 250);
  assert.equal((await read('products', 'p3')).status, 'available');
});
for (const [name, modify] of [
  ['total altered', p => p.reviewedTotalCOP++], ['price changed without reviewed total', p => p.lines[0].priceCOP++],
  ['negative quantity', p => p.lines[0].quantityMilli = -1], ['invalid price', p => p.lines[0].priceCOP = 0.5],
  ['discount exceeds gross', p => p.lines[0].discountCOP = 5000], ['incompatible unit', p => p.lines[0].unit = 'kg'],
  ['fractional count', p => p.lines[0].quantityMilli = 1500], ['extra UID', p => p.uid = LOCAL.uid],
  ['client-supplied incomplete movements', p => p.movements = []], ['unexpected image', p => p.photo = 'forbidden-fixture'],
  ['unapproved general discount', p => p.generalDiscountCOP = 0], ['missing physical product', p => p.lines[0].productId = 'absent'],
  ['category changed', p => p.lines[0].categoryId = 'cleaning'], ['identity changed', p => p.lines[0].name = 'Another fixture'],
]) test(`modified client rejected without partial effects: ${name}`, async () => {
  await seed(); const before = await snapshot(); const intent = purchase(); modify(intent);
  await assert.rejects(owner.call('confirmPurchase', intent), e =>
    ['functions/invalid-argument', 'functions/failed-precondition'].includes(e.code));
  assert.equal(await snapshot(), before);
});
test('all callables reject unauthenticated and other UIDs, without trusting body identity', async () => {
  await seed(); const before = await snapshot();
  for (const actor of [anonymous, other]) for (const name of ['confirmPurchase', 'adjustStock', 'lookupOperation']) {
    await assert.rejects(actor.call(name, name === 'lookupOperation' ? { operationId: 'purchase-demo' } : purchase()),
      e => ['functions/unauthenticated', 'functions/permission-denied'].includes(e.code));
  }
  assert.equal(await snapshot(), before);
});
test('client rules deny direct stock, financial, unknown and cross-UID writes and unauthorized reads', async () => {
  await seed(); const before = await snapshot();
  for (const actor of [owner, other, anonymous]) {
    for (const [kind, id] of [['products', 'p0'], ['operations', 'fake'], ['movements', 'fake'], ['unknown', 'fake']]) {
      await assertFails(setDoc(ref(actor.db, kind, id), { value: 'fixture' }));
    }
    await assertFails(setDoc(ref(actor.db, 'products', 'p0', 'demo-other-05a'), { value: 'fixture' }));
  }
  for (const actor of [other, anonymous]) await assertFails(getDocFromServer(ref(actor.db, 'products', 'p0')));
  await assertFails(getDocFromServer(ref(owner.db, 'products', 'p0', 'demo-other-05a')));
  assert.equal(await snapshot(), before);
});
test('confirmed history cannot be edited/deleted and reused IDs with different contents conflict', async () => {
  await seed(); const intent = purchase(); await owner.call('confirmPurchase', intent); const before = await snapshot();
  await assertFails(setDoc(ref(owner.db, 'operations', intent.operationId), { totalPaidCOP: 0 }, { merge: true }));
  await assertFails(deleteDoc(ref(owner.db, 'operations', intent.operationId)));
  intent.store = 'Otro comercio ficticio'; await assert.rejects(owner.call('confirmPurchase', intent), { code: 'functions/already-exists' });
  assert.equal(await snapshot(), before);
});
test('a later-line failure rolls back all candidate product changes', async () => {
  await seed(2); const before = await snapshot(); const intent = purchase('atomic-failure', 2); intent.lines[1].newProduct = true;
  await assert.rejects(owner.call('confirmPurchase', intent), { code: 'functions/failed-precondition' });
  assert.equal(await snapshot(), before);
});
test('two simultaneous requests with the same ID commit one operation and one increment', async () => {
  await seed(); const intent = purchase('same-id'); const results = await Promise.all([owner.call('confirmPurchase', intent), owner.call('confirmPurchase', intent)]);
  assert.deepEqual(results.map(r => r.status).sort(), ['already-confirmed', 'confirmed']);
  assert.equal((await read('products', 'p0')).quantityMilli, 3000);
  assert.equal((await getDocs(collection(owner.db, `users/${LOCAL.uid}/operations`))).size, 1);
});
test('different simultaneous purchases preserve both same-product updates', async () => {
  await seed(); await Promise.all(['a', 'b'].map(id => owner.call('confirmPurchase', purchase(id))));
  assert.equal((await read('products', 'p0')).quantityMilli, 4000);
  const operations = await getDocs(collection(owner.db, `users/${LOCAL.uid}/operations`));
  assert.equal(operations.size, 2); assert.equal(operations.docs.reduce((sum, d) => sum + d.data().totalPaidCOP, 0), 8400);
});
test('different simultaneous products remain independent', async () => {
  await seed(2); const second = purchase('b'); second.lines = [line(1)];
  await Promise.all([owner.call('confirmPurchase', purchase('a')), owner.call('confirmPurchase', second)]);
  assert.equal((await read('products', 'p0')).quantityMilli, 3000); assert.equal((await read('products', 'p1')).quantityMilli, 3000);
});
test('concurrent absolute adjustment either commits before purchase or rejects stale version', async () => {
  await seed(); const adjustment = { schemaVersion: 1, kind: 'stockAdjust', operationId: 'adjust', productId: 'p0', expectedVersion: 0, after: 9000 };
  const [purchaseResult, adjustmentResult] = await Promise.allSettled([
    owner.call('confirmPurchase', purchase('buy')), owner.call('adjustStock', adjustment)]);
  assert.equal(purchaseResult.status, 'fulfilled');
  assert.equal((await read('products', 'p0')).quantityMilli, adjustmentResult.status === 'fulfilled' ? 10000 : 3000);
  if (adjustmentResult.status === 'rejected') assert.equal(adjustmentResult.reason.code, 'functions/failed-precondition');
});
test('lookup after a truly successful confirmation and a fresh client reconciles by ID/hash', async () => {
  await seed(); const intent = purchase('reconcile'), confirmed = await owner.call('confirmPurchase', intent);
  assert.equal(confirmed.status, 'confirmed'); // Successful commit prerequisite, not a 403 simulation.
  const fresh = await client(LOCAL.uid);
  try {
    const result = await fresh.call('lookupOperation', { operationId: intent.operationId });
    assert.equal(result.status, 'confirmed'); assert.equal(result.intentHash, confirmed.intentHash);
    assert.equal((await fresh.call('confirmPurchase', intent)).status, 'already-confirmed');
    assert.equal((await read('products', 'p0')).quantityMilli, 3000);
    assert.equal((await fresh.call('lookupOperation', { operationId: 'not-submitted' })).status, 'absent-at-server');
  } finally { await fresh.close(); }
});
