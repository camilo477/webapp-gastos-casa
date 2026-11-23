import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { doc, collection, query, where, orderBy, getDocs, getDocFromServer, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { assertFails } from '@firebase/rules-unit-testing';
import { client } from './client.mjs';
import { UID } from './functions/guard.mjs';
import { environment, seed, productRef, operationRef, readProduct, readOperation, snapshot } from './test-support.mjs';
import { product, physical, service, purchase } from './fixtures.mjs';
let env, owner;
before(async () => { env = await environment(); owner = await client(); });
after(async () => { await owner?.close(); await env?.cleanup(); });
beforeEach(async () => { await seed(env); });

for (const count of [5, 50, 100]) test(`confirm ${count} existing distinct products atomically`, async t => {
  await seed(env, count); const start = performance.now();
  const result = await owner.call('confirmPurchase', purchase(`size-${count}`, count));
  assert.equal(result.status, 'confirmed'); const op = await readOperation(owner.db, `size-${count}`);
  assert.equal(op.lines.length, count); assert.equal(op.movements.length, count); assert.equal(op.totalPaidCOP, count * 4200);
  for (let i = 0; i < count; i++) {
    assert.equal((await readProduct(owner.db, `p${i}`)).quantityMilli, 3000);
    assert.equal(op.lines[i].netCOP, 4200);
    assert.deepEqual(op.movements[i], { id: `purchase:size-${count}:line-${i}`, lineId: `line-${i}`,
      productId: `p${i}`, kind: 'purchase', before: 2000, after: 3000, unit: 'unidad' });
  }
  assert.equal(result.metrics.documentReads, count + 1); assert.equal(result.metrics.committedWrites, count + 1);
  t.diagnostic(JSON.stringify({ scenario: `size-${count}`, roundTripMs: Math.round(performance.now() - start), ...result.metrics }));
});
for (const count of [5, 50, 100]) test(`confirm ${count} new distinct products`, async () => {
  await seed(env, 0); const input = purchase(`new-${count}`, count); input.lines.forEach(l => { l.newProduct = true; });
  await owner.call('confirmPurchase', input); const op = await readOperation(owner.db, input.operationId);
  assert.equal(op.lines.length, count); assert.equal(op.movements.length, count);
  for (let i = 0; i < count; i++) {
    assert.equal((await readProduct(owner.db, `p${i}`)).quantityMilli, 1000);
    assert.equal(op.movements[i].productId, `p${i}`); assert.equal(op.movements[i].before, 0); assert.equal(op.movements[i].after, 1000);
  }
});
test('50 repeated legitimate lines retain money, movements and chained stock', async t => {
  const input = purchase('repeated', 50); input.lines = input.lines.map((_, i) => physical(i, 'p0', product(0)));
  const r = await owner.call('confirmPurchase', input); const op = await readOperation(owner.db, 'repeated');
  assert.equal(op.lines.length, 50); assert.equal(op.movements.length, 50); assert.equal(op.totalPaidCOP, 210000);
  assert.equal(op.movements[49].before, 51000); assert.equal((await readProduct(owner.db)).quantityMilli, 52000);
  for (let i = 0; i < 50; i++) {
    assert.equal(op.movements[i].lineId, `line-${i}`); assert.equal(op.movements[i].productId, 'p0');
    assert.equal(op.movements[i].before, 2000 + 1000*i); assert.equal(op.movements[i].after, 3000 + 1000*i);
  }
  assert.equal(r.metrics.documentReads, 2); assert.equal(r.metrics.committedWrites, 2); t.diagnostic(JSON.stringify({ scenario: 'repeated', ...r.metrics }));
});
test('mixed exact, simple, fractional, converted, new and service lines', async () => {
  const p = product(0, { unit: 'kg' }); await seed(env, 1, { unit: 'kg' });
  const input = purchase('mixed'); input.lines = [
    physical(0, 'p0', p, { quantityMilli: 1500, priceCOP: 1000, discountCOP: 100 }),
    physical(1, 'p0', p, { unit: 'g', quantityMilli: 250000, priceMode: 'total', priceCOP: 1000 }),
    physical(2, 'simple-new', product(2, { control: 'simple' }), { newProduct: true, priceCOP: 800 }), service(3),
    physical(4, 'liquid-new', product(4, { unit: 'L' }), { newProduct: true, unit: 'ml', quantityMilli: 500000, priceMode: 'total', priceCOP: 2000 }),
  ]; input.reviewedTotalCOP = 12200;
  await owner.call('confirmPurchase', input); const op = await readOperation(owner.db, 'mixed');
  assert.equal(op.totalPaidCOP, 12200); assert.equal(op.movements.length, 4); assert.equal(op.lines.length, 5);
  assert.deepEqual(op.lines.map(l => l.netCOP), [1400, 1000, 800, 7000, 2000]);
  assert.deepEqual(op.movements.map(m => [m.lineId, m.before, m.after]), [
    ['line-0', 2000, 3500], ['line-1', 3500, 3750], ['line-2', 'empty', 'available'], ['line-4', 0, 500],
  ]);
  assert.equal((await readProduct(owner.db)).quantityMilli, 3750);
  const simple = await readProduct(owner.db, 'simple-new'); assert.equal(simple.status, 'available'); assert.equal('quantityMilli' in simple, false);
  assert.equal((await readProduct(owner.db, 'liquid-new')).quantityMilli, 500);
});
test('service-only operation has one financial write and no stock writes', async () => {
  const input = purchase('service'); input.lines = [service(0)]; input.reviewedTotalCOP = 7000;
  const r = await owner.call('confirmPurchase', input); assert.equal(r.metrics.committedWrites, 1);
  assert.equal((await readOperation(owner.db, 'service')).movements.length, 0);
  assert.equal((await readProduct(owner.db)).quantityMilli, 2000);
});
for (const catalog of [100, 500, 1000]) test(`catalog ${catalog}: only five referenced products read/written`, async t => {
  await seed(env, catalog); const unrelated = await readProduct(owner.db, `p${catalog - 1}`);
  const r = await owner.call('confirmPurchase', purchase(`catalog-${catalog}`, 5));
  assert.equal(r.metrics.documentReads, 6); assert.equal(r.metrics.committedWrites, 6);
  assert.deepEqual(await readProduct(owner.db, `p${catalog - 1}`), unrelated);
  t.diagnostic(JSON.stringify({ scenario: `catalog-${catalog}`, ...r.metrics }));
});
test('price history comes from the canonical purchases', async () => {
  await owner.call('confirmPurchase', purchase('price-one')); const second = purchase('price-two'); second.lines[0].priceCOP = 5000; second.reviewedTotalCOP = 5000;
  await owner.call('confirmPurchase', second);
  const q = query(collection(owner.db, `users/${UID}/operations`), where('kind', '==', 'purchase'), where('productIds', 'array-contains', 'p0'), orderBy('date', 'desc'));
  const result = await getDocs(q); assert.equal(result.size, 2); assert.equal(result.docs.reduce((sum, d) => sum + d.data().totalPaidCOP, 0), 9200);
});

const attacks = {
  'forged price without changing reviewed total': x => x.lines[0].priceCOP++,
  'incorrect total': x => x.reviewedTotalCOP++,
  'negative price': x => x.lines[0].priceCOP = -1,
  'price as string': x => x.lines[0].priceCOP = '4200',
  'negative quantity': x => x.lines[0].quantityMilli = -1,
  'fractional encoding': x => x.lines[0].quantityMilli = 1000.5,
  'fractional countable unit': x => x.lines[0].quantityMilli = 1500,
  'incompatible unit': x => x.lines[0].unit = 'L',
  'discount tampering': x => x.lines[0].discountCOP++,
  'excessive discount': x => x.lines[0].discountCOP = 5000,
  'client omits generated movements': x => x.movements = [],
  'unexpected uid': x => x.uid = UID,
  'unexpected image': x => x.image = 'forbidden',
  'unexpected line field': x => x.lines[0].netCOP = 1,
  'unknown product': x => x.lines[0].productId = 'missing',
  'existing masquerades as new': x => x.lines[0].newProduct = true,
  'identity changed': x => x.lines[0].name = 'Alterado',
  'category changed': x => x.lines[0].categoryId = 'cleaning',
  'empty purchase': x => x.lines = [],
  'invalid calendar': x => x.date = '2026-02-30',
  'path traversal': x => x.operationId = '../other',
  'overflow': x => x.lines[0].priceCOP = Number.MAX_SAFE_INTEGER,
  'duplicate line identity': x => { x.lines.push({ ...x.lines[0] }); x.reviewedTotalCOP *= 2; },
  'oversized payload': x => x.extra = 'x'.repeat(270000),
  'more than 100 lines': x => { Object.assign(x, purchase('too-many', 101)); },
  'malformed product flag': x => x.lines[0].newProduct = {},
};
for (const [name, mutate] of Object.entries(attacks)) test(`ATTACK: ${name}`, async () => {
  const before = await snapshot(owner.db), input = purchase(); mutate(input);
  await assert.rejects(owner.call('confirmPurchase', input), e => ['functions/invalid-argument','functions/failed-precondition'].includes(e.code));
  assert.equal(await snapshot(owner.db), before);
});
test('a late invalid product leaves earlier valid/new lines untouched', async () => {
  const input = purchase('late-invalid', 3); input.lines[1].newProduct = true; // p1 is absent, but final p2 is not declared new.
  const before = await snapshot(owner.db); await assert.rejects(owner.call('confirmPurchase', input)); assert.equal(await snapshot(owner.db), before);
});
for (const uid of [null, 'intruder']) test(`unauthorized callable/read/direct writes: ${uid}`, async () => {
  const c = await client(uid); const before = await snapshot(owner.db);
  try {
    for (const name of ['confirmPurchase', 'adjustStock', 'lookupOperation']) await assert.rejects(c.call(name, purchase()), e => ['functions/unauthenticated','functions/permission-denied'].includes(e.code));
    await assertFails(getDocFromServer(productRef(c.db)));
    await assertFails(setDoc(productRef(c.db), product()));
  } finally { await c.close(); }
  assert.equal(await snapshot(owner.db), before);
});
test('owner cannot write products, purchases, movements, inventory or historical fields directly', async () => {
  await owner.call('confirmPurchase', purchase()); const before = await snapshot(owner.db);
  for (const path of [`users/${UID}/products/p0`, `users/${UID}/operations/purchase-demo`, `users/${UID}/movements/m`, `users/${UID}/stock/p0`]) {
    const ref = doc(owner.db, path); await assertFails(setDoc(ref, { forged: true })); await assertFails(deleteDoc(ref));
  }
  await assertFails(updateDoc(operationRef(owner.db), { 'lines.0.categoryId': 'cleaning' }));
  await assertFails(getDocFromServer(doc(owner.db, 'users/intruder/products/p0')));
  assert.equal(await snapshot(owner.db), before);
});
test('same ID replays once; changed content conflicts without modifying history', async () => {
  const input = purchase(); await owner.call('confirmPurchase', input); const before = await snapshot(owner.db);
  const r = await owner.call('confirmPurchase', { ...input }); assert.equal(r.status, 'already-confirmed'); assert.equal(r.metrics.committedWrites, 0);
  const changed = purchase(); changed.lines[0].priceCOP++; changed.reviewedTotalCOP++;
  await assert.rejects(owner.call('confirmPurchase', changed), e => e.code === 'functions/already-exists');
  assert.equal(await snapshot(owner.db), before);
});
for (const scenario of ['same-id', 'same-product', 'different-products']) test(`CONCURRENCY: ${scenario}`, async t => {
  await seed(env, 2); const other = await client();
  const a = purchase('concurrent-a'), b = purchase(scenario === 'same-id' ? 'concurrent-a' : 'concurrent-b');
  if (scenario === 'different-products') b.lines = [physical(0, 'p1', product(1))];
  try {
    const results = await Promise.all([owner.call('confirmPurchase', a), other.call('confirmPurchase', b)]);
    assert.deepEqual(results.map(r => r.status).sort(), scenario === 'same-id' ? ['already-confirmed','confirmed'] : ['confirmed','confirmed']);
    assert.equal((await readProduct(owner.db)).quantityMilli, scenario === 'same-product' ? 4000 : 3000);
    assert.equal((await readProduct(owner.db, 'p1')).quantityMilli, scenario === 'different-products' ? 3000 : 2000);
    const ops = await getDocs(collection(owner.db, `users/${UID}/operations`)); assert.equal(ops.size, scenario === 'same-id' ? 1 : 2);
    assert.equal(ops.docs.reduce((sum, d) => sum + d.data().totalPaidCOP, 0), scenario === 'same-id' ? 4200 : 8400);
    t.diagnostic(JSON.stringify({ scenario, metrics: results.map(r => r.metrics) }));
  } finally { await other.close(); }
});
test('concurrent same ID with all-new products creates one catalog entry per ID', async () => {
  await seed(env, 0); const input = purchase('new-parallel', 5); input.lines.forEach(l => { l.newProduct = true; });
  await Promise.all([owner.call('confirmPurchase', input), owner.call('confirmPurchase', input)]);
  assert.equal((await getDocs(collection(owner.db, `users/${UID}/products`))).size, 5);
  assert.equal((await getDocs(collection(owner.db, `users/${UID}/operations`))).size, 1);
  assert.equal((await readProduct(owner.db)).quantityMilli, 1000);
});
test('two different operations reserving the same new product ID conflict atomically', async () => {
  await seed(env, 0); const a = purchase('reserve-a'); a.lines[0].newProduct = true;
  const results = await Promise.allSettled([owner.call('confirmPurchase', a), owner.call('confirmPurchase', { ...a, operationId: 'reserve-b' })]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.code, 'functions/failed-precondition');
  assert.equal((await readProduct(owner.db)).quantityMilli, 1000);
  assert.equal((await getDocs(collection(owner.db, `users/${UID}/products`))).size, 1);
  assert.equal((await getDocs(collection(owner.db, `users/${UID}/operations`))).size, 1);
});
test('concurrent absolute adjustment versus purchase has no silent lost update', async () => {
  const adjustment = { schemaVersion: 1, operationId: 'adjust', kind: 'stockAdjust', productId: 'p0', expectedVersion: 0, after: 5000 };
  const [buy, adjust] = await Promise.allSettled([owner.call('confirmPurchase', purchase()), owner.call('adjustStock', adjustment)]);
  assert.equal(buy.status, 'fulfilled');
  if (adjust.status === 'fulfilled') assert.equal((await readProduct(owner.db)).quantityMilli, 6000);
  else { assert.equal(adjust.reason.code, 'functions/failed-precondition'); assert.equal((await readProduct(owner.db)).quantityMilli, 3000); }
  assert.equal((await readOperation(owner.db)).totalPaidCOP, 4200);
});
test('two absolute adjustments based on the same version cannot overwrite one another', async () => {
  const a = { schemaVersion: 1, operationId: 'adjust-a', kind: 'stockAdjust', productId: 'p0', expectedVersion: 0, after: 5000 };
  const results = await Promise.allSettled([owner.call('adjustStock', a), owner.call('adjustStock', { ...a, operationId: 'adjust-b', after: 7000 })]);
  assert.equal(results.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(results.find(x => x.status === 'rejected').reason.code, 'functions/failed-precondition');
  assert.equal((await readProduct(owner.db)).version, 1);
  assert.equal((await getDocs(collection(owner.db, `users/${UID}/operations`))).size, 1);
});
test('adjustment rejects malformed stored balance without silently repairing history', async () => {
  await seed(env, 1, { quantityMilli: 'invalid-fixture' });
  const before = await snapshot(owner.db);
  await assert.rejects(owner.call('adjustStock', { schemaVersion: 1, operationId: 'corrupt-state', kind: 'stockAdjust',
    productId: 'p0', expectedVersion: 0, after: 5000 }), e => e.code === 'functions/invalid-argument');
  assert.equal(await snapshot(owner.db), before);
});
test('server lookup after real confirmation and retry reconcile without duplicates', async () => {
  const input = purchase(); const first = await owner.call('confirmPurchase', input); assert.equal(first.status, 'confirmed');
  const fresh = await client();
  try {
    const result = await fresh.call('lookupOperation', { operationId: input.operationId }); assert.equal(result.status, 'confirmed'); assert.equal(result.intentHash, first.intentHash);
    assert.equal((await fresh.call('confirmPurchase', input)).status, 'already-confirmed'); assert.equal((await readProduct(fresh.db)).quantityMilli, 3000);
    assert.equal((await fresh.call('lookupOperation', { operationId: 'absent' })).status, 'absent-at-server');
  } finally { await fresh.close(); }
});
