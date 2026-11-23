import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixtureState, intent, physicalLine, serviceLine, transition, storedIntent, stable, product } from './model.mjs';
import { requireEmulators } from './guard.mjs';
import { documentBytes, valueBytes, measure } from './measure.mjs';
import { readFileSync } from 'node:fs';

for (const count of [5, 50, 100]) test(`pure: ${count} distinct lines have complete stock/money/movements`, () => {
  const old = fixtureState(count), input = intent('pure', count), r = transition(old, input);
  assert.equal(r.operation.lines.length, count); assert.equal(Object.keys(r.operation.movements).length, count);
  assert.equal(r.operation.totalPaidCOP, 4200 * count); assert.equal(r.operation.frames.length, count + 1);
  for (let i = 0; i < count; i++) { assert.equal(r.next.products[`p${i}`].quantityMilli, 3000); assert.equal(old.products[`p${i}`].quantityMilli, 2000); }
  assert.equal(stable(storedIntent(r.operation)), stable(input));
});
test('pure: 50 repeats preserve legitimate lines and chain stock', () => {
  const input = intent('repeat', 50); input.lines = input.lines.map((_, i) => physicalLine(i, 'p0', product(0)));
  const r = transition(fixtureState(), input);
  assert.equal(r.next.products.p0.quantityMilli, 52000); assert.equal(r.operation.lines.length, 50);
  assert.equal(Object.keys(r.operation.movements).length, 50); assert.equal(r.operation.totalPaidCOP, 210000);
  assert.equal(r.operation.physicalCounts.at(-1), 50);
  assert.equal(r.operation.movements['line-49'].before, 51000);
});
test('pure: new exact product repeated with a service preserve their separate effects', () => {
  const p = product(0, { unit: 'kg' });
  const input = intent('mixed'); input.lines = [physicalLine(0, 'new', p, { newProduct: true, quantityMilli: 1500 }), serviceLine(1),
    physicalLine(2, 'new', p, { newProduct: true, quantityMilli: 500 })];
  const r = transition(fixtureState(), input); assert.equal(r.next.products.new.quantityMilli, 2000);
  assert.equal(r.operation.totalPaidCOP, 15400); assert.equal(Object.keys(r.operation.movements).length, 2);
});
test('pure: arithmetic invalidity fails without touching the input state', () => {
  const old = fixtureState(), saved = stable(old);
  for (const patch of [{ quantityMilli: -1 }, { priceCOP: -1 }, { discountCOP: 999999 }, { quantityMilli: 1500 }, { unit: 'L' }]) {
    const input = intent(); Object.assign(input.lines[0], patch); assert.throws(() => transition(old, input));
  }
  assert.equal(stable(old), saved);
});
test('pure: stale absolute adjustments conflict', () => {
  assert.throws(() => transition(fixtureState(), { kind: 'stockAdjust', operationId: 'adjust', expectedRevision: 1, productId: 'p0', after: 1000 }), /STALE/);
});
test('guard refuses missing/remote endpoints and credentials', () => {
  assert.throws(() => requireEmulators({}));
  const valid = { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8186', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099' };
  assert.doesNotThrow(() => requireEmulators(valid));
  assert.doesNotThrow(() => requireEmulators({ ...valid, FIREBASE_CONFIG: JSON.stringify({
    projectId: 'demo-mi-casa-04b', storageBucket: 'demo-mi-casa-04b.appspot.com', databaseURL: 'https://demo-mi-casa-04b.firebaseio.com',
  }) }));
  assert.throws(() => requireEmulators({ ...valid, FIREBASE_CONFIG: JSON.stringify({ projectId: 'real-project' }) }));
  for (const patch of [{ GCLOUD_PROJECT: 'real-project' }, { FIRESTORE_EMULATOR_HOST: 'example.com:8186' }, { GOOGLE_APPLICATION_CREDENTIALS: 'not-allowed' }]) assert.throws(() => requireEmulators({ ...valid, ...patch }));
});
test('size formula matches official document worked example (147 bytes)', () => {
  assert.equal(documentBytes('users/jeff/tasks/my_task_id', { type: 'Personal', done: false, priority: 1, description: 'Learn Cloud Firestore' }), 147);
  assert.equal(valueBytes('Á'), 3);
});
test('size: full-map witnesses cross 1 MiB even when final catalog fits', () => {
  const m = measure(1000, 100); assert.equal(m.stateWithin1MiB, true); assert.equal(m.operationWithin1MiB, false);
  assert.ok(m.restCommitBodyBytes > m.operationBytes);
});
test('configuration has only demo emulators on loopback, no hosting or deploy target', () => {
  const config = JSON.parse(readFileSync(new URL('./firebase.json', import.meta.url)));
  assert.deepEqual(Object.keys(config).sort(), ['emulators', 'firestore']);
  for (const name of ['auth', 'firestore', 'hub', 'logging']) assert.equal(config.emulators[name].host, '127.0.0.1');
});
