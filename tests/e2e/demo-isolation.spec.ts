import { expect, test } from '@playwright/test';

test('confirmar en demostración no inicia sesiones Firebase ni escribe datos remotos o durables', async ({ page }) => {
  const external: string[] = [];
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== 'http://127.0.0.1:4173') {
      external.push(`${url.origin}${url.pathname}`); await route.abort();
    } else await route.continue();
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Registrar compra', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar compra manualmente', exact: true }).click();
  await page.getByRole('textbox', { name: 'Establecimiento', exact: true }).fill('Comercio ficticio local');
  await page.getByRole('button', { name: 'Continuar con los productos', exact: true }).click();
  await page.getByRole('button', { name: 'Añadir producto', exact: true }).first().click();
  await page.getByRole('textbox', { name: 'Buscar un producto existente', exact: true }).fill('Arroz');
  await page.getByRole('button', { name: 'Arroz', exact: true }).click();
  await page.getByRole('textbox', { name: 'Cantidad comprada', exact: true }).fill('1');
  await page.getByRole('textbox', { name: 'Precio por kg (COP)', exact: true }).fill('4200');
  await page.getByRole('button', { name: 'Guardar artículo en la compra', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar compra', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Detalle de la compra', exact: true })).toBeVisible();
  expect(external).toEqual([]);
  expect(await page.evaluate(async () => ({ local: localStorage.length, databases: (await indexedDB.databases()).length })))
    .toEqual({ local: 0, databases: 0 });
  await page.goto('/gastos');
  await expect(page.locator('.monthly')).toContainText('286.400'); // Reload restores demo seed, not persisted purchases.
  expect(external).toEqual([]);
});
