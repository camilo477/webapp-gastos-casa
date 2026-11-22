import { expect, test } from '@playwright/test';

const pages = [
  ['/', 'Tu casa, en orden.'],
  ['/inventario', 'Mi inventario'],
  ['/compras/nueva', 'Registrar compra'],
  ['/compras/revisar', 'Revisar compra'],
  ['/lista', 'Mi lista'],
  ['/gastos', 'Mis gastos'],
  ['/compras/revisar?ejemplo=grande', 'Revisar compra'],
  ['/compras/revisar?ejemplo=grande&vista=pendientes', 'Revisar compra'],
] as const;

for (const width of [320, 360, 390, 430, 768, 1280]) {
  for (const scale of [100, 200]) {
    test.describe(`${width}px, texto ${scale}%`, () => {
      test.use({ viewport: { width, height: 900 } });
      for (const [path, title] of pages) {
        test(`${path} conserva contenido y evita desbordamiento`, async ({ page }, info) => {
          const errors: string[] = [];
          page.on('pageerror', error => errors.push(error.message));
          page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
          await page.goto(path);
          await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
          await page.evaluate(size => { document.documentElement.style.fontSize = `${size}%`; }, scale);
          await page.evaluate(() => document.fonts.ready);
          const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth);
          expect(overflow).toBeLessThanOrEqual(1);
          const bodySize = await page.locator('body').evaluate(element => parseFloat(getComputedStyle(element).fontSize));
          expect(bodySize).toBe(18 * scale / 100);
          const navigation = page.getByRole('navigation', { name: 'Secciones principales' });
          if (await navigation.count()) {
            const position = await navigation.evaluate(element => getComputedStyle(element).position);
            if (scale === 200 && width <= 430) expect(position).toBe('static');
            if (position === 'fixed') {
              const box = await navigation.boundingBox();
              expect(box?.height).toBeLessThan(225);
              const lastLink = page.locator('main a').last();
              if (await lastLink.count()) {
                await lastLink.focus();
                const control = await lastLink.boundingBox();
                expect(control!.y + control!.height).toBeLessThanOrEqual(box!.y);
              }
            }
          } else {
            await expect(page.getByRole('navigation', { name: 'Registro de compra' })).toBeVisible();
          }
          if (path.includes('ejemplo=grande')) {
            await expect(page.locator('.compact-review-item')).toHaveCount(path.includes('pendientes') ? 6 : 50);
            await expect(page.getByText('435.600', { exact: true })).toHaveCount(2);
          }
          expect(errors).toEqual([]);
          await page.evaluate(() => window.scrollTo(0, 0));
          if ((width === 390 && scale === 100) || (width === 360 && scale === 200 && path === '/') || (width === 320 && scale === 200 && path === '/inventario')) {
            const name = path === '/' ? 'inicio' : path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
            const file = `artifacts/phase-03c/${width}-${scale}-${name}.png`;
            await page.screenshot({ path: file, fullPage: !path.includes('ejemplo=grande') });
            await info.attach('pantalla', { path: file, contentType: 'image/png' });
          }
        });
      }
    });
  }
}

test('navegación por teclado y cancelación con Escape', async ({ page }) => {
  await page.goto('/');
  const register=page.getByRole('link',{name:'Registrar compra',exact:true});
  for(let i=0;i<30&&!(await register.evaluate(el=>document.activeElement===el));i++)await page.keyboard.press('Tab');
  await expect(register).toBeFocused();await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Simular recibo de 5 productos',exact:true}).click();
  await expect(page.locator('.compact-review-item')).toHaveCount(5);
  const summary=page.locator('.compact-review-item summary').first();await summary.focus();await page.keyboard.press('Enter');
  await expect(page.locator('.compact-review-item details').first()).toHaveAttribute('open','');
  const back=page.getByRole('link',{name:'Volver',exact:true});await back.click();
  await expect(page.getByRole('dialog',{name:'¿Descartar esta compra?'})).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(back).toBeFocused();
});
