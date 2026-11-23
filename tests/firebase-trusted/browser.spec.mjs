import { test, expect } from '@playwright/test';
import { collection, getDocs } from 'firebase/firestore';
import { environment, seed, readProduct, readOperation } from './test-support.mjs';
import { UID } from './functions/guard.mjs';
let env;
test.beforeAll(async () => { env = await environment(); });
test.afterAll(async () => { await env?.cleanup(); });
test.beforeEach(async ({ page }) => {
  await seed(env); await page.goto('/'); await page.waitForFunction(() => window.lab?.phase === 'ready');
});
async function assertOnce() {
  const db = env.authenticatedContext(UID).firestore();
  expect((await readProduct(db)).quantityMilli).toBe(3000);
  const op = await readOperation(db, 'browser-demo'); expect(op.totalPaidCOP).toBe(4200); expect(op.movements).toHaveLength(1);
  expect((await getDocs(collection(db, `users/${UID}/operations`))).size).toBe(1);
}
test('offline before sending: absent result and same-ID retry after reconnect', async ({ page, context }) => {
  await context.setOffline(true); await page.evaluate(() => window.lab.start());
  await expect.poll(() => page.evaluate(() => window.lab.phase)).toBe('uncertain');
  await context.setOffline(false); expect(await page.evaluate(() => window.lab.recover())).toBe('absent-at-server');
  expect((await page.evaluate(() => window.lab.retry())).status).toBe('confirmed'); await assertOnce();
});
test('successful confirmation can be queried from a new page and retried', async ({ page, context }) => {
  await page.evaluate(() => window.lab.start()); await expect.poll(() => page.evaluate(() => window.lab.phase)).toBe('confirmed');
  await page.close(); const fresh = await context.newPage(); await fresh.goto('/'); await fresh.waitForFunction(() => window.lab?.phase === 'ready');
  expect(await fresh.evaluate(() => window.lab.recover())).toBe('confirmed');
  expect((await fresh.evaluate(() => window.lab.retry())).status).toBe('already-confirmed'); await assertOnce();
});
test('close pending tab before request reaches function; durable receipt permits reconciliation', async ({ page, context }) => {
  let intercepted = false;
  await page.route('**/confirmPurchase**', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.abort('internetdisconnected'); intercepted = true;
  });
  await page.evaluate(() => window.lab.start()); await expect.poll(() => intercepted).toBe(true);
  await page.close();
  const fresh = await context.newPage(); await fresh.goto('/'); await fresh.waitForFunction(() => window.lab?.phase === 'ready');
  expect(await fresh.evaluate(() => window.lab.receipt().confirmation)).toBe('uncertain');
  expect(await fresh.evaluate(() => window.lab.recover())).toBe('absent-at-server');
  expect((await fresh.evaluate(() => window.lab.retry())).status).toBe('confirmed'); await assertOnce();
});
test('lose a real successful response, close tab, reconcile and retry without duplicate effects', async ({ page, context }) => {
  let committed;
  await page.route('**/confirmPurchase**', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch(); const body = await response.json();
    committed = { status: response.status(), result: body.result?.status };
    await route.abort('internetdisconnected');
  });
  await page.evaluate(() => window.lab.start()); await expect.poll(() => committed).toEqual({ status: 200, result: 'confirmed' });
  await assertOnce(); // Proves a real commit before simulating loss; a 403 never satisfies this precondition.
  await expect.poll(() => page.evaluate(() => window.lab.phase)).toBe('uncertain');
  await page.close(); const fresh = await context.newPage(); await fresh.goto('/'); await fresh.waitForFunction(() => window.lab?.phase === 'ready');
  expect(await fresh.evaluate(() => window.lab.receipt().confirmation)).toBe('uncertain');
  expect(await fresh.evaluate(() => window.lab.recover())).toBe('confirmed');
  expect((await fresh.evaluate(() => window.lab.retry())).status).toBe('already-confirmed'); await assertOnce();
});
