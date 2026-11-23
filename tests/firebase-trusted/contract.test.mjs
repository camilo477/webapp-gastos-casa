import { test } from 'node:test';
import assert from 'node:assert/strict';
import { purchase, physical, service, product } from './fixtures.mjs';
import { validatePurchase, stable, net, documentBytes, delta, keys } from './functions/contract.mjs';
import { requireLab, PROJECT } from './functions/guard.mjs';
for (const n of [5, 50, 100]) test(`contract accepts ${n} physical lines`, () => assert.equal(validatePurchase(purchase('demo', n)), 4200*n));
test('rounding and discounts use exact integer arithmetic', () => {
  const l = physical(0, 'p0', product(0, { unit: 'kg' }), { quantityMilli: 1500, priceCOP: 4201, discountCOP: 100 });
  assert.equal(net(l), 6202); assert.equal(delta({ ...l, unit: 'g', quantityMilli: 250000 }, { unit: 'kg' }), 250);
});
test('service does not require fictional physical quantities', () => {
  const p = purchase(); p.lines = [service(0)]; p.reviewedTotalCOP = 7000; assert.equal(validatePurchase(p), 7000);
});
test('contract rejects incomplete and oversized requests, duplicate lines and unknown fields', () => {
  for (const mutate of [p => p.extra = true, p => p.lines = [], p => p.lines.push(p.lines[0]), p => p.date = '2026-02-30', p => p.lines[0].quantityMilli = -1, p => p.lines[0].priceCOP = 0.5]) {
    const input = purchase(); mutate(input); assert.throws(() => validatePurchase(input));
  }
  assert.throws(() => validatePurchase(purchase('large', 101)));
});
test('canonical intent is independent of map key order and includes money', () => {
  assert.equal(stable({ a: 1, b: 2 }), stable({ b: 2, a: 1 }));
  assert.notEqual(stable(purchase()), stable({ ...purchase(), reviewedTotalCOP: 1 }));
});
test('schema validation cannot be bypassed by comma-containing field names', () => {
  assert.throws(() => keys({ 'a,b': 1 }, ['a', 'b']));
  assert.throws(() => keys({ a: 1, b: 2, extra: 3 }, ['a', 'b']));
  assert.doesNotThrow(() => keys({ b: 2, a: 1 }, ['a', 'b']));
});
test('storage formula matches official worked example', () => assert.equal(documentBytes('users/jeff/tasks/my_task_id', { type: 'Personal', done: false, priority: 1, description: 'Learn Cloud Firestore' }), 147));
test('guard rejects missing endpoints, real projects or credentials', () => {
  const env = { GCLOUD_PROJECT: PROJECT, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8286', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199' };
  assert.doesNotThrow(() => requireLab(env)); assert.throws(() => requireLab({}));
  for (const patch of [{ GCLOUD_PROJECT: 'real' }, { FIRESTORE_EMULATOR_HOST: 'example.com:8286' }, { GOOGLE_APPLICATION_CREDENTIALS: 'forbidden' }]) assert.throws(() => requireLab({ ...env, ...patch }));
});
