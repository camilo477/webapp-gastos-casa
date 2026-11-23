import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { owner, other } from './fixtures.mjs';

const privatePaths = ['/', '/inventario', '/compras/nueva', '/compras/revisar', '/lista', '/gastos'];
async function login(page: Page, account = owner) {
  await page.getByLabel('Correo electrónico').fill(account.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}
test.beforeEach(async ({ page }) => {
  // A real destination fails the test before any request can leave the browser.
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      await route.abort(); throw new Error('NON_LOCAL_REQUEST_BLOCKED');
    }
    if (['8386', '5205'].includes(url.port)) {
      await route.abort(); throw new Error('FINANCIAL_SERVICE_REQUEST_BLOCKED');
    }
    await route.continue();
  });
});

for (const path of privatePaths) test(`protects ${path} until a session is verified`, async ({ page }) => {
  await page.goto(path);
  await expect(page).toHaveURL(/\/acceso$/);
  await expect(page.getByRole('heading', { name: 'Bienvenida a Mi Casa' })).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /crear cuenta|registrarse/i })).toHaveCount(0);
});

test('successful login restores the requested route; reload keeps only the SDK session', async ({ page, context }) => {
  await page.goto('/lista'); await login(page);
  await expect(page).toHaveURL(/\/lista$/);
  await expect(page.getByLabel('Prueba local de acceso')).toContainText('no pertenecen a esta cuenta');
  await page.getByRole('button', { name: 'Finalizar y descartar lista', exact: true }).click();
  await page.getByRole('button', { name: 'Finalizar y descartar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No tienes una lista activa' })).toBeVisible();
  const storage = await context.storageState();
  const saved = storage.origins.flatMap(origin => origin.localStorage);
  expect(saved.length).toBeGreaterThan(0);
  expect(JSON.stringify(saved)).not.toContain(owner.password);
  expect(saved.every(item => item.name.startsWith('firebase:'))).toBe(true);
  const sdkStorage = await page.evaluate(async () => {
    const databases = await indexedDB.databases();
    const values: unknown[] = [];
    for (const database of databases) {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const open = indexedDB.open(database.name!); open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error);
      });
      for (const store of db.objectStoreNames) values.push(await new Promise(resolve => {
        const read = db.transaction(store).objectStore(store).getAll(); read.onsuccess = () => resolve(read.result);
      }));
      db.close();
    }
    return { session: sessionStorage.length, names: databases.map(db => db.name), values: JSON.stringify(values) };
  });
  expect(sdkStorage.session).toBe(0);
  expect(sdkStorage.names.every(name => name === 'firebase-heartbeat-database')).toBe(true);
  expect(sdkStorage.values).not.toContain(owner.password);
  expect(sdkStorage.values).not.toMatch(/Solo-local|shoppingList|products|purchase|draft/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mi próxima compra', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/lista$/);
});

test('wrong password and missing user have understandable identical errors', async ({ page }) => {
  await page.goto('/acceso');
  for (const account of [{ ...owner, password: 'Incorrecta-local!' }, { ...owner, email: 'inexistente@example.test' }]) {
    await login(page, account);
    await expect(page.getByRole('alert')).toHaveText('No pudimos ingresar con esos datos. Revisa el correo y la contraseña.');
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');
  }
  await login(page); await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
});

test('logout removes the session and example changes, including across tabs', async ({ page, context }) => {
  await page.goto('/lista'); await login(page);
  await page.getByRole('button', { name: 'Finalizar y descartar lista', exact: true }).click();
  await page.getByRole('button', { name: 'Finalizar y descartar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No tienes una lista activa' })).toBeVisible();
  const second = await context.newPage(); await second.goto('/inventario');
  await second.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/acceso$/); await expect(second).toHaveURL(/\/acceso$/);
  await page.reload(); await expect(page.getByRole('heading', { name: 'Bienvenida a Mi Casa' })).toBeVisible();
  await login(page); await expect(page.getByRole('heading', { name: 'Mi próxima compra', exact: true })).toBeVisible();
  await second.close();
});

test('unauthorized account is rejected on login and never exposes examples', async ({ page }) => {
  await page.goto('/inventario'); await login(page, other);
  await expect(page.getByRole('alert')).toContainText('Esta cuenta no tiene acceso');
  await expect(page.getByRole('heading', { name: 'Mi inventario', exact: true })).toHaveCount(0);
  await page.reload(); await expect(page.getByRole('heading', { name: 'Bienvenida a Mi Casa' })).toBeVisible();
});

test('initial restored session waits for token validation without a private-page flash', async ({ page }) => {
  await page.goto('/inventario'); await login(page); await expect(page.getByRole('heading', { name: 'Mi inventario', exact: true })).toBeVisible();
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/securetoken.googleapis.com/v1/token**', async route => { await held; await route.continue(); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status')).toHaveText('Estamos comprobando tu sesión…');
  await expect(page.getByRole('heading', { name: 'Mi inventario', exact: true })).toHaveCount(0);
  release(); await expect(page.getByRole('heading', { name: 'Mi inventario', exact: true })).toBeVisible();
});

test('background verification of the same identity preserves an open example form', async ({ page }) => {
  await page.goto('/inventario'); await login(page);
  await page.getByRole('button', { name: 'Añadir producto', exact: true }).click();
  await page.getByLabel('Nombre del producto').fill('Ejemplo sin guardar');
  let release!: () => void, renewals = 0;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/securetoken.googleapis.com/v1/token**', async route => { renewals++; await held; await route.continue(); });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  try {
    await expect.poll(() => renewals).toBeGreaterThan(0);
    await expect(page.getByLabel('Nombre del producto')).toHaveValue('Ejemplo sin guardar');
  } finally { release(); }
  await expect(page.getByLabel('Nombre del producto')).toHaveValue('Ejemplo sin guardar');
});

test('connection failure closes private access and can be retried without a remote fallback', async ({ page }) => {
  await page.goto('/acceso');
  await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: 'NETWORK_REQUEST_FAILED' } }) }));
  await login(page); await expect(page.getByRole('alert')).toContainText('No pudimos conectar');
  await page.unroute('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**');
  await login(page); await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  await page.route('**/securetoken.googleapis.com/v1/token**', route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: 'NETWORK_REQUEST_FAILED' } }) }));
  await page.reload(); await expect(page.getByRole('alert')).toContainText('No pudimos conectar');
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toHaveCount(0);
  await page.unroute('**/securetoken.googleapis.com/v1/token**');
  await page.getByRole('button', { name: 'Volver a comprobar la sesión' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
});

test('a genuinely refused Auth connection reports an error and permits another attempt', async ({ page }) => {
  await page.goto('/acceso');
  const endpoint = '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**';
  await page.route(endpoint, route => route.abort('connectionrefused'));
  await login(page);
  await expect(page.getByRole('alert')).toContainText('No pudimos conectar', { timeout: 45000 });
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');
  await page.unroute(endpoint); await login(page);
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
});

test('expired/revoked refresh credentials return to access instead of displaying cached identity', async ({ page }) => {
  await page.goto('/inventario'); await login(page); await expect(page.getByRole('heading', { name: 'Mi inventario', exact: true })).toBeVisible();
  await page.route('**/securetoken.googleapis.com/v1/token**', route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: 'TOKEN_EXPIRED' } }) }));
  await page.reload(); await expect(page.getByRole('alert')).toContainText('Tu sesión terminó');
  await expect(page.getByRole('heading', { name: 'Mi inventario', exact: true })).toHaveCount(0);
});

test('identity replacement from another tab discards previous state and rejects the new UID', async ({ page, context, request }) => {
  await page.goto('/lista'); await login(page); await expect(page.getByRole('heading', { name: 'Mi próxima compra', exact: true })).toBeVisible();
  const response = await request.post('http://127.0.0.1:9299/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-only-05b-1', { data: { email: other.email, password: other.password, returnSecureToken: true } });
  expect(response.ok()).toBe(true); const credentials = await response.json();
  const second = await context.newPage(); await second.goto('/inventario');
  await expect(second.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  await second.evaluate(({ uid, email, accessToken, refreshToken }) => {
    const key = Object.keys(localStorage).find(key => key.startsWith('firebase:authUser:'))!;
    const saved = JSON.parse(localStorage.getItem(key)!);
    localStorage.setItem(key, JSON.stringify({ ...saved, uid, email, stsTokenManager: { accessToken, refreshToken, expirationTime: Date.now() + 3600000 } }));
  }, { uid: credentials.localId, email: other.email, accessToken: credentials.idToken, refreshToken: credentials.refreshToken });
  await expect(page).toHaveURL(/\/acceso$/); await expect(page.getByRole('alert')).toContainText('no tiene acceso');
  await expect(page.getByRole('heading', { name: 'Mi próxima compra', exact: true })).toHaveCount(0);
  await second.close();
});

test('signup API remains possible but its UID cannot access UI or read/write protected data', async ({ page, request }) => {
  const created = await request.post('http://127.0.0.1:9299/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-only-05b-1', { data: { email: `api-${Date.now()}@example.test`, password: 'Solo-API-ficticia!', returnSecureToken: true } });
  expect(created.ok()).toBe(true); const account = await created.json();
  const target = 'http://127.0.0.1:8386/v1/projects/demo-mi-casa-05a/databases/(default)/documents/users/demo-owner-05a/products/denied';
  for (const method of ['GET', 'PATCH']) {
    const response = await request.fetch(target, { method, headers: { Authorization: `Bearer ${account.idToken}` }, ...(method === 'PATCH' ? { data: { fields: {} } } : {}) });
    expect(response.status()).toBe(403);
  }
  await page.goto('/acceso'); await login(page, { uid: account.localId, email: account.email, password: 'Solo-API-ficticia!' });
  await expect(page.getByRole('alert')).toContainText('Esta cuenta no tiene acceso');
});

test('demo works independently even with an emulator session and failed Auth network', async ({ page, context }) => {
  await page.goto('/acceso'); await login(page); await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  const demo = await context.newPage();
  await demo.route('**/*', route => {
    expect(new URL(route.request().url()).port).toBe('4175'); return route.continue();
  });
  await demo.goto('http://127.0.0.1:4175/lista');
  await expect(demo.getByRole('heading', { name: 'Mi próxima compra', exact: true })).toBeVisible();
  await expect(demo.getByRole('button', { name: 'Cerrar sesión' })).toHaveCount(0);
  expect(await demo.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await demo.getByRole('button', { name: 'Finalizar y descartar lista', exact: true }).click();
  await demo.getByRole('button', { name: 'Finalizar y descartar', exact: true }).click();
  await expect(demo.getByRole('heading', { name: 'No tienes una lista activa' })).toBeVisible();
  await page.goto('/lista'); await expect(page.getByRole('heading', { name: 'Mi próxima compra', exact: true })).toBeVisible();
  await demo.close();
});

for (const width of [360, 390, 430, 768]) test(`access and authenticated examples fit ${width}px with 200% text`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 }); await page.goto('/acceso');
  await noOverflow(page);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await noOverflow(page);
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ingresar', exact: true })).toBeVisible();
  await page.screenshot({ path: `artifacts/phase-05b-1/access-${width}-text200.png`, fullPage: true });
  await login(page); await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible(); await noOverflow(page);
});

test('keyboard access, focus, labels and automated accessibility checks', async ({ page }) => {
  await page.goto('/acceso'); await expect(page.getByRole('heading', { name: 'Bienvenida a Mi Casa' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel('Correo electrónico').focus(); await page.keyboard.type(owner.email);
  await page.keyboard.press('Tab'); await expect(page.getByLabel('Contraseña', { exact: true })).toBeFocused();
  await page.keyboard.type(owner.password); await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Ingresar', exact: true })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
