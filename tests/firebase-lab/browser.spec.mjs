import { test, expect } from '@playwright/test';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { setDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { readFile } from 'node:fs/promises';
import { fixtureState } from './model.mjs';
import { refs } from './client.mjs';
import { PROJECT, UID, requireEmulators } from './guard.mjs';

requireEmulators();
let env;
test.beforeAll(async () => { env = await initializeTestEnvironment({ projectId: PROJECT,
  firestore: { host: '127.0.0.1', port: 8186, rules: await readFile(new URL('./firestore.rules', import.meta.url), 'utf8') } }); });
test.afterAll(async () => { await env?.cleanup(); });
test.beforeEach(async ({ page }) => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(context => setDoc(refs(context.firestore(), 'seed').state,
    { ...fixtureState(), updatedAt: serverTimestamp() }));
  await page.goto('/'); await page.waitForFunction(() => window.lab?.phase === 'ready');
});
async function assertOnce() {
  const db = env.authenticatedContext(UID).firestore();
  const r = refs(db, 'browser-demo');
  expect((await getDocFromServer(r.state)).data().products.p0.quantityMilli).toBe(3000);
  expect((await getDocFromServer(r.operation)).exists()).toBe(true);
}
test('offline before sending: no false success; reconnect and retry same ID', async ({ page, context }) => {
  await context.setOffline(true); await page.evaluate(() => window.lab.start());
  await expect.poll(() => page.evaluate(() => window.lab.phase), { timeout: 30000 }).toBe('uncertain');
  await context.setOffline(false);
  expect(await page.evaluate(() => window.lab.recover())).toBe('absent-at-server');
  await page.evaluate(() => window.lab.retry()); await assertOnce();
});
test('disconnect during commit request: no partial state; same-ID retry', async ({ page }) => {
  let hit = false;
  await page.route('**/documents:commit**', route => { if (route.request().method() !== 'POST') return route.continue(); hit = true; return route.abort('internetdisconnected'); });
  await page.evaluate(() => window.lab.start());
  await expect.poll(() => hit, { timeout: 15000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => window.lab.phase), { timeout: 30000 }).toBe('uncertain');
  expect(await page.evaluate(() => window.lab.recover())).toBe('absent-at-server');
  await page.unroute('**/documents:commit**'); await page.evaluate(() => window.lab.retry()); await assertOnce();
});
test('close tab after starting but before write: receipt survives; reconcile from server', async ({ page, context }) => {
  await page.evaluate(() => window.lab.start({ pauseBeforeWrite: true }));
  await expect.poll(() => page.evaluate(() => window.lab.phase)).toBe('before-write');
  await page.close(); const fresh = await context.newPage(); await fresh.goto('/');
  await fresh.waitForFunction(() => window.lab?.phase === 'ready');
  expect(await fresh.evaluate(() => window.lab.receipt().confirmation)).toBe('uncertain');
  expect(await fresh.evaluate(() => window.lab.recover())).toBe('absent-at-server');
  await fresh.evaluate(() => window.lab.retry()); await assertOnce();
});
test('server committed but response lost and tab closed: reconcile and retry without duplicates', async ({ page, context }) => {
  let responseStatus;
  await page.route('**/documents:commit**', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch(); responseStatus = response.status();
    await route.abort('internetdisconnected'); // Real server response discarded, not a cache read.
  });
  await page.evaluate(() => window.lab.start());
  await expect.poll(() => responseStatus !== undefined, { timeout: 15000 }).toBe(true);
  expect(responseStatus, 'precondition: the server must commit before its response can be lost').toBe(200);
  await page.close(); const fresh = await context.newPage(); await fresh.goto('/');
  await fresh.waitForFunction(() => window.lab?.phase === 'ready');
  expect(await fresh.evaluate(() => window.lab.recover())).toBe('confirmed-at-server');
  expect(await fresh.evaluate(() => window.lab.retry())).toBe('already-confirmed'); await assertOnce();
});
