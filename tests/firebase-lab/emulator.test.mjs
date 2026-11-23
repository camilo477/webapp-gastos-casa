import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, getDocFromServer, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { PROJECT, UID, requireEmulators } from './guard.mjs';
import { emptyState, fixtureState, intent, physicalLine, product, serviceLine, transition, stable } from './model.mjs';
import { confirm, reconcile, refs, wire } from './client.mjs';
import { authClient } from './auth-client.mjs';
import { restCommit } from './measure.mjs';

requireEmulators();
let env, db;
const denialReasons = { otherDenial: 0, technicalBudget: 0 };
before(async () => {
  env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { host: '127.0.0.1', port: 8186,
    rules: await readFile(new URL('./firestore.rules', import.meta.url), 'utf8') } });
  db = env.authenticatedContext(UID).firestore();
});
after(async () => { console.log('DENIAL_REASONS', JSON.stringify(denialReasons)); await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); await seed(fixtureState()); });
async function seed(state) {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(refs(context.firestore(), 'seed').state, { ...state, updatedAt: serverTimestamp() });
  });
}
async function current() { return (await getDocFromServer(refs(db, 'unused').state)).data(); }
async function seedConfirmed(input) {
  const result = wire(transition(fixtureState(), input));
  await env.withSecurityRulesDisabled(async context => {
    const r = refs(context.firestore(), input.operationId);
    await setDoc(r.state, result.next); await setDoc(r.operation, result.operation);
  });
}
async function operations() { return (await getDocs(collection(db, `users/${UID}/operations`))).docs.map(d => d.data()); }
async function attack(result, context = db, { state = true, operation = true } = {}) {
  const r = refs(context, result.operation.operationId);
  const batch = writeBatch(context), data = wire(result);
  if (state) batch.set(r.state, data.next);
  if (operation) batch.set(r.operation, data.operation);
  return batch.commit();
}
async function denied(result, options) {
  const old = await current(), ops = await operations();
  const error = await assertFails(attack(result, db, options));
  denialReasons[/maximum|1000 expressions/.test(error.message) ? 'technicalBudget' : 'otherDenial']++;
  assert.equal(stable(await current()), stable(old));
  assert.equal(stable(await operations()), stable(ops));
}

test('valid single physical line crosses real rules and updates exactly once', async () => {
  await confirm(db, intent());
  assert.equal((await current()).products.p0.quantityMilli, 3000);
  const [op] = await operations(); assert.equal(op.totalPaidCOP, 4200);
  assert.equal(Object.keys(op.movements).length, 1);
});

test('initialization permits only an empty closed state', async () => {
  await env.clearFirestore();
  await setDoc(refs(db, 'init').state, { ...emptyState(), updatedAt: serverTimestamp() });
  assert.equal((await current()).revision, 0);
});

test('explicit stock adjustment is paired, non-financial and rejects a stale revision', async () => {
  const input = { operationId: 'adjust-only', kind: 'stockAdjust', expectedRevision: 0, productId: 'p0', after: 5000 };
  await confirm(db, input);
  assert.equal((await current()).products.p0.quantityMilli, 5000);
  assert.equal((await current()).revision, 1);
  const [op] = await operations(); assert.equal(op.kind, 'stockAdjust'); assert.equal(Object.hasOwn(op, 'totalPaidCOP'), false);
  await assert.rejects(confirm(db, { ...input, operationId: 'stale' }), /STALE_ADJUSTMENT/);
  assert.equal((await operations()).length, 1);
});

// A valid rejected purchase fails its test after verifying zero partial effects.
for (const count of [5, 50, 100]) test(`CAPABILITY: ${count} distinct physical products`, async t => {
  await seed(fixtureState(count));
  const old = await current(), start = performance.now();
  try {
    await confirm(db, intent(`size-${count}`, count));
    const s = await current(), [op] = await operations();
    assert.equal(op.lines.length, count); assert.equal(Object.keys(op.movements).length, count);
    assert.equal(op.totalPaidCOP, 4200 * count);
    for (let i = 0; i < count; i++) assert.equal(s.products[`p${i}`].quantityMilli, 3000);
    t.diagnostic(JSON.stringify({ capability: count, result: 'ACCEPTED', ms: Math.round(performance.now() - start) }));
  } catch (e) {
    if (!['permission-denied', 'invalid-argument', 'resource-exhausted'].includes(e.code)) throw e;
    assert.equal(stable(await current()), stable(old)); assert.equal((await operations()).length, 0);
    t.diagnostic(JSON.stringify({ capability: count, result: 'REJECTED_VALID_PURCHASE', code: e.code, message: e.message, ms: Math.round(performance.now() - start) }));
    throw e;
  }
});

for (const count of [2, 50]) test(`CAPABILITY: ${count} legitimate repeated lines`, async t => {
  const input = intent(`repeat-${count}`, count); input.lines = input.lines.map((_, i) => physicalLine(i, 'p0', product(0)));
  const old = await current();
  try {
    await confirm(db, input);
    assert.equal((await current()).products.p0.quantityMilli, 2000 + count * 1000);
    const [o] = await operations(); assert.equal(o.lines.length, count); assert.equal(Object.keys(o.movements).length, count);
    assert.equal(o.totalPaidCOP, count * 4200); t.diagnostic(`${count} repeated lines ACCEPTED`);
  } catch (e) {
    if (!['permission-denied','invalid-argument','resource-exhausted'].includes(e.code)) throw e;
    assert.equal(stable(await current()), stable(old)); assert.equal((await operations()).length, 0);
    t.diagnostic(`${count} repeated lines REJECTED_VALID_PURCHASE: ${e.code}`);
    throw e;
  }
});

test('mixed physical and service lines retain all money and physical movements', async () => {
  const input = intent(); input.lines.push(serviceLine(1));
  await confirm(db, input); const [o] = await operations();
  assert.equal(o.lines.length, 2); assert.equal(o.totalPaidCOP, 11200); assert.equal(Object.keys(o.movements).length, 1);
  assert.equal((await current()).products.p0.quantityMilli, 3000);
});

test('new product starts from zero', async () => {
  const input = intent(); input.lines = [physicalLine(0, 'new', product(0), { newProduct: true })];
  await confirm(db, input); assert.equal((await current()).products.new.quantityMilli, 1000);
});

for (const [unit, base, amount, expected] of [['kg','kg',1500,3500], ['g','kg',250000,2250], ['ml','L',250000,2250]]) {
  test(`fraction/conversion ${unit} to ${base}`, async () => {
    const p = product(0, { unit: base }); const s = fixtureState(); s.products.p0 = p; await seed(s);
    const input = intent(); input.lines = [physicalLine(0, 'p0', p, { unit, quantityMilli: amount, discountCOP: 100 })];
    await confirm(db, input); assert.equal((await current()).products.p0.quantityMilli, expected);
  });
}
test('simple control stores a status, not an invented balance', async () => {
  const p = { name: 'Jabón ficticio', categoryId: 'cleaning', control: 'simple', unit: 'unidad', status: 'low' };
  const s = fixtureState(); s.products.p0 = p; await seed(s);
  const input = intent(); input.lines = [physicalLine(0, 'p0', p)]; await confirm(db, input);
  assert.equal((await current()).products.p0.status, 'available');
  assert.equal(Object.hasOwn((await current()).products.p0, 'quantityMilli'), false);
});

const mutations = {
  'incorrect total': r => r.operation.totalPaidCOP++,
  'product without stock': r => { r.next.products.p0.quantityMilli = 2000; r.operation.frames[1] = structuredClone(r.next.products); },
  'arbitrary inventory': r => { r.next.products.extra = product(4); r.operation.frames[1] = structuredClone(r.next.products); },
  'negative quantity': r => r.operation.lines[0].quantityMilli = -1000,
  'fractional quantity encoding': r => r.operation.lines[0].quantityMilli = 0.5,
  'invalid price': r => r.operation.lines[0].priceCOP = -1,
  'discount altered': r => r.operation.lines[0].discountCOP++,
  'incompatible unit': r => r.operation.lines[0].unit = 'L',
  'fractional countable units': r => r.operation.lines[0].quantityMilli = 1500,
  'unexpected operation field': r => r.operation.photo = 'forbidden',
  'unexpected product field': r => { r.next.products.p0.photo = 'forbidden'; r.operation.frames[1] = structuredClone(r.next.products); },
  'unexpected line field': r => r.operation.lines[0].ocr = 'forbidden',
  'category changed': r => { r.operation.lines[0].categoryId = 'cleaning'; r.next.products.p0.categoryId = 'cleaning'; r.operation.frames[1] = structuredClone(r.next.products); },
  'identity changed': r => { r.next.products.p0.name = 'Alterado'; r.operation.lines[0].name = 'Alterado'; r.operation.frames[1] = structuredClone(r.next.products); },
  'missing movement': r => { delete r.operation.movements['line-0']; },
  'extra movement': r => { r.operation.movements.extra = r.operation.movements['line-0']; },
  'incorrect physical count': r => r.operation.physicalCounts[1]++,
  'incorrect movement before': r => r.operation.movements['line-0'].before = 0,
  'incorrect revision': r => r.next.revision++,
  'incorrect prefix': r => r.operation.prefixCOP[1]++,
  'overflow': r => r.operation.lines[0].priceCOP = Number.MAX_SAFE_INTEGER,
  'missing lines': r => r.operation.lines = [],
  'wrong field type': r => r.operation.lines[0].priceCOP = '4200',
};
for (const [name, mutate] of Object.entries(mutations)) test(`ATTACK rejected atomically: ${name}`, async () => {
  const result = transition(fixtureState(), intent()); mutate(result); await denied(result);
});
test('ATTACK: two physical lines with only one movement', async () => {
  const s = fixtureState(2); await seed(s); const r = transition(s, intent('missing-second', 2));
  delete r.operation.movements['line-1']; await denied(r);
});
test('ATTACK: operation without state', async () => { await denied(transition(fixtureState(), intent()), { state: false }); });
test('ATTACK: state without operation', async () => { await denied(transition(fixtureState(), intent()), { operation: false }); });

for (const uid of [null, 'intruder']) test(`authorization matrix ${uid ?? 'unauthenticated'}`, async () => {
  const other = uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();
  const r = refs(other, 'attack');
  await assertFails(getDocFromServer(r.state));
  await assertFails(getDocs(collection(other, `users/${UID}/operations`)));
  await assertFails(attack(transition(fixtureState(), intent('attack')), other));
  await assertFails(setDoc(r.state, { ...emptyState(), updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(r.state));
});
test('owner cannot access another UID or unmatched paths', async () => {
  await assertFails(getDocFromServer(refs(db, 'x', 'intruder').state));
  await assertFails(setDoc(refs(db, 'x', 'intruder').state, emptyState()));
});
test('historical fixture cannot be updated/deleted or reused to change state', async () => {
  await seedConfirmed(intent()); const r = refs(db, 'purchase-demo'); const op = (await getDocFromServer(r.operation)).data();
  await assertFails(setDoc(r.operation, { ...op, totalPaidCOP: 1 })); await assertFails(deleteDoc(r.operation));
  const s = await current(); await assertFails(setDoc(r.state, { ...s, revision: 2, updatedAt: serverTimestamp() }));
  assert.equal((await current()).revision, 1);
});

test('concurrency: same ID from two independent clients applies once', async () => {
  const second = env.authenticatedContext(UID).firestore();
  await Promise.all([confirm(db, intent()), confirm(second, intent())]);
  assert.equal((await current()).products.p0.quantityMilli, 3000); assert.equal((await operations()).length, 1);
});
test('concurrency: two purchases of the same product preserve both increments', async () => {
  const second = env.authenticatedContext(UID).firestore();
  await Promise.all([confirm(db, intent('one')), confirm(second, intent('two'))]);
  assert.equal((await current()).products.p0.quantityMilli, 4000); assert.equal((await operations()).length, 2);
});
test('existing-ID fixture: canonical conflict and hostile content reuse are rejected', async () => {
  await seedConfirmed(intent()); const old = await current(); const changed = intent(); changed.lines[0].priceCOP++;
  assert.equal(await confirm(db, intent()), 'already-confirmed');
  await assert.rejects(confirm(db, changed), /IDEMPOTENCY_CONFLICT/);
  await denied(transition(old, changed));
  assert.equal(stable(await current()), stable(old)); assert.equal((await operations()).length, 1);
});
test('concurrent absolute adjustment never overwrites a more recent revision', async () => {
  const second = env.authenticatedContext(UID).firestore();
  const adjustment = { operationId: 'adjust', kind: 'stockAdjust', expectedRevision: 0, productId: 'p0', after: 5000 };
  const [buy, adjust] = await Promise.allSettled([confirm(db, intent()), confirm(second, adjustment)]);
  assert.equal(buy.status, 'fulfilled');
  if (adjust.status === 'fulfilled') assert.equal((await current()).products.p0.quantityMilli, 6000);
  else { assert.match(adjust.reason.message, /STALE_ADJUSTMENT/); assert.equal((await current()).products.p0.quantityMilli, 3000); }
});

test('reconciliation uses a fresh client and server read after a lost application response', async () => {
  const receipt = JSON.parse(JSON.stringify({ uid: UID, operationId: 'purchase-demo', confirmation: 'uncertain', intent: intent() }));
  await confirm(db, receipt.intent); // Commit succeeded; deliberately discard the result at the application boundary.
  const fresh = env.authenticatedContext(UID).firestore();
  assert.equal(await reconcile(fresh, receipt), 'confirmed-at-server');
  assert.equal(await confirm(fresh, receipt.intent), 'already-confirmed');
  assert.equal((await current()).products.p0.quantityMilli, 3000); assert.equal((await operations()).length, 1);
});
test('interruption before write leaves no commit and can be retried with the same ID', async () => {
  await assert.rejects(confirm(db, intent(), { beforeWrite: () => { throw new Error('SIMULATED_CLOSE_BEFORE_SEND'); } }), /SIMULATED_CLOSE/);
  const receipt = { uid: UID, operationId: 'purchase-demo', confirmation: 'uncertain', intent: intent() };
  assert.equal(await reconcile(env.authenticatedContext(UID).firestore(), receipt), 'absent-at-server');
  assert.equal((await current()).revision, 0); await confirm(db, receipt.intent);
  assert.equal((await current()).products.p0.quantityMilli, 3000);
});

test('Authentication Emulator token is subject to owner rules', async () => {
  const owner = await authClient(), intruder = await authClient('intruder');
  try {
    assert.equal(owner.uid, UID);
    assert.equal((await getDocFromServer(refs(owner.db, 'none').state)).exists(), true);
    await assertFails(getDocFromServer(refs(intruder.db, 'none').state));
    await assertFails(attack(transition(fixtureState(), intent()), intruder.db));
  } finally { await Promise.all([owner.close(), intruder.close()]); }
});

for (const count of [5, 50, 100]) test(`REST CAPABILITY: actual JSON commit body for ${count} products`, async t => {
  const s = fixtureState(count); await seed(s); const old = await current();
  const r = transition(s, intent(`rest-${count}`, count));
  const body = JSON.stringify(restCommit(r)); const client = await authClient();
  try {
    const response = await fetch(`http://127.0.0.1:8186/v1/projects/${PROJECT}/databases/(default)/documents:commit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${client.token}` }, body,
    });
    const outcome = await response.json();
    t.diagnostic(JSON.stringify({ count, actualRestBodyBytes: Buffer.byteLength(body), status: response.status,
      result: response.ok ? 'ACCEPTED' : outcome.error?.message }));
    if (!response.ok) { assert.equal(stable(await current()), stable(old)); assert.equal((await operations()).length, 0); }
    assert.equal(response.status, 200, 'valid REST purchase must be accepted to demonstrate capability');
  } finally { await client.close(); }
});

for (const catalog of [100, 500, 1000]) test(`CATALOG CAPABILITY: ${catalog} products and 5-line purchase`, async t => {
  const s = fixtureState(catalog); await seed(s); const before = await current();
  try { await confirm(db, intent(`catalog-${catalog}`, 5)); }
  catch (e) {
    assert.equal(stable(await current()), stable(before)); assert.equal((await operations()).length, 0);
    t.diagnostic(`${catalog}-product catalog: ${e.code}: ${e.message}`); throw e;
  }
});
