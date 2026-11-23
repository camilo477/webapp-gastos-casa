import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { LOCAL, requireLocal, requireRuntime } from '../lib/config/local.js';
import { parsePurchase, parseAdjustment, net, delta, stable, documentBytes } from '../lib/experimental/validation.js';
import { plan } from '../lib/experimental/plan.js';
import { createExecutor } from '../lib/application/executor.js';
import { callableResult } from '../lib/adapters/callable-errors.js';
import { checkLocalConfig, runnerEnvironment } from '../scripts/local-config.mjs';
import { purchase, product, line, time } from './fixtures.mjs';
import { validatePurchase as legacyValidate, stable as legacyStable } from '../../tests/firebase-trusted/functions/contract.mjs';

for (const n of [5, 50, 100]) test(`typed planning preserves 04C results for ${n} physical lines`, () => {
  const p = purchase(`size-${n}`, n), before = new Map(p.lines.map((l, i) => [l.productId, product(i)]));
  assert.equal(legacyValidate(p), p.reviewedTotalCOP);
  assert.deepEqual(parsePurchase(p), p); assert.equal(stable(p), legacyStable(p));
  const result = plan(p, before, time);
  assert.equal(result.changed.size, n); assert.equal(result.movements.length, n);
  assert.equal(result.lines.reduce((sum, l) => sum + l.netCOP, 0), 4200 * n);
  for (const [key, value] of result.changed) { assert.equal(value.quantityMilli, 3000); assert.equal(before.get(key).quantityMilli, 2000); }
});
test('fractions, explicit conversions, repeated lines, simple stock and services retain experimental behavior', () => {
  const p = purchase(); p.lines = [line(0), line(1, { productId: 'p0', name: 'Producto ficticio 0' })]; p.reviewedTotalCOP = 8400;
  assert.equal(plan(parsePurchase(p), new Map([['p0', product()]]), time).changed.get('p0').quantityMilli, 4000);
  const fractional = line(0, { baseUnit: 'kg', unit: 'kg', quantityMilli: 1500, priceCOP: 4201, discountCOP: 100 });
  assert.equal(net(fractional), 6202); assert.equal(delta({ ...fractional, unit: 'g', quantityMilli: 250000 }, { unit: 'kg' }), 250);
  const simple = purchase(); simple.lines = [line(0, { control: 'simple', newProduct: true })];
  assert.equal(plan(parsePurchase(simple), new Map([['p0', null]]), time).changed.get('p0').status, 'available');
  const service = purchase(); service.lines = [{ id: 'service', kind: 'expense', name: 'Servicio ficticio', categoryId: 'service', priceCOP: 8000, discountCOP: 1000 }]; service.reviewedTotalCOP = 7000;
  assert.equal(plan(parsePurchase(service), new Map(), time).changed.size, 0);
});
test('strict validation rejects malformed, unapproved and non-JSON contract extensions', () => {
  for (const mutate of [p => p.uid = 'other', p => p.generalDiscountCOP = 0, p => p.lines = [],
    p => p.lines[0].priceCOP = -1, p => p.lines[0].quantityMilli = -1, p => p.lines[0].quantityMilli = 1500,
    p => p.lines[0].discountCOP = 4201, p => p.lines[0].priceCOP = 0.5, p => p.lines[0].priceCOP = NaN,
    p => p.lines[0].movements = [], p => p.date = '2026-02-30', p => p.reviewedTotalCOP = 1,
    p => p.lines.push(p.lines[0]), p => p.lines[0].unit = 'L']) {
    const input = purchase(); mutate(input); assert.throws(() => parsePurchase(input));
  }
  assert.throws(() => parsePurchase(purchase('too-big', 101)));
  assert.throws(() => parseAdjustment({ schemaVersion: 1, operationId: 'x', kind: 'stockAdjust', productId: 'p0', expectedVersion: 0, after: -1 }));
});
test('authorization runs before repository access for every operation', async () => {
  let accesses = 0; const executor = createExecutor(() => { accesses++; throw Error('NOT_REACHED'); }, LOCAL.uid);
  for (const method of ['confirmPurchase', 'adjustStock', 'lookupOperation']) {
    await assert.rejects(executor[method](null, {}), { code: 'unauthenticated' });
    await assert.rejects(executor[method]({ uid: 'other' }, {}), { code: 'permission-denied' });
  }
  assert.equal(accesses, 0);
});
test('application port reads before writes, owns the transaction and sanitizes unknown errors', async () => {
  const events = []; const repo = {
    transaction: work => work({ findOperation: async () => { events.push('readOperation'); return null; },
      readProducts: async () => { events.push('readProducts'); return new Map([['p0', product()]]); }, now: () => time,
      writeProduct: () => events.push('writeProduct'), createOperation: () => events.push('createOperation') }),
  };
  const result = await createExecutor(() => repo, LOCAL.uid).confirmPurchase({ uid: LOCAL.uid }, purchase());
  assert.equal(result.totalPaidCOP, 4200);
  assert.deepEqual(events, ['readOperation', 'readProducts', 'writeProduct', 'createOperation']);
  await assert.rejects(callableResult(async () => { throw Error('PRIVATE_PAYLOAD_DO_NOT_ECHO'); }), e => e.code === 'aborted' && e.message === 'OPERATION_RESULT_UNCERTAIN');
});
test('configuration checks project, loopback, credentials, runtime and emulator config before startup', async () => {
  const env = runnerEnvironment({}); requireLocal(env); requireRuntime('24.22.3');
  for (const version of ['20.19.5', '22.20.0', '24.11.0', '25.0.0']) assert.throws(() => requireRuntime(version));
  for (const patch of [{ MI_CASA_ENV: 'production' }, { FUNCTIONS_EMULATOR: undefined }, { GCLOUD_PROJECT: 'real' }, { GOOGLE_CLOUD_PROJECT: 'real' },
    { FIRESTORE_EMULATOR_HOST: '0.0.0.0:8386' }, { FIREBASE_AUTH_EMULATOR_HOST: undefined },
    { GOOGLE_APPLICATION_CREDENTIALS: 'forbidden' }, { FIREBASE_TOKEN: 'forbidden' },
    { FIREBASE_CONFIG: '{"projectId":"real"}' }]) assert.throws(() => requireLocal({ ...env, ...patch }));
  assert.throws(() => runnerEnvironment({ GCLOUD_PROJECT: 'real' }));
  assert.throws(() => runnerEnvironment({ FIREBASE_CONFIG: '{}' }));
  await checkLocalConfig();
  const config = JSON.parse(await readFile(new URL('../../firebase.local.json', import.meta.url), 'utf8'));
  config.emulators.firestore.host = '0.0.0.0'; await assert.rejects(checkLocalConfig(config));
});
test('entry cannot initialize without local guards; production-looking configuration is rejected', () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', 'import("./lib/index.js")'],
    { cwd: new URL('../', import.meta.url), encoding: 'utf8', env: { ...process.env, MI_CASA_ENV: 'production', GCLOUD_PROJECT: 'real' } });
  assert.notEqual(r.status, 0); assert.match(r.stderr, /LOCAL_ONLY_CONFIG_REQUIRED/);
});
test('document sizing retains the official worked example', () => {
  assert.equal(documentBytes('users/jeff/tasks/my_task_id', { type: 'Personal', done: false, priority: 1, description: 'Learn Cloud Firestore' }), 147);
});
