import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const reports:unknown[]=[];
test.afterAll(async()=>{
  await mkdir('artifacts/phase-03c',{recursive:true});
  await writeFile('artifacts/phase-03c/axe-report.json',JSON.stringify(reports,null,2));
});

async function scan(page: Page, info: TestInfo) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  reports.push({test:info.title,url:page.url(),violations:result.violations.map(r=>({id:r.id,impact:r.impact,targets:r.nodes.map(n=>n.target)})),incomplete:result.incomplete.map(r=>({id:r.id,targets:r.nodes.map(n=>n.target)}))});
  await info.attach('axe', {
    body: JSON.stringify({ violations: result.violations, incomplete: result.incomplete.map(r => ({ id: r.id, targets: r.nodes.map(n => n.target) })) }, null, 2),
    contentType: 'application/json',
  });
  expect(result.violations).toEqual([]);
}

for (const path of ['/', '/inventario', '/compras/nueva', '/compras/revisar', '/lista', '/gastos', '/compras/revisar?ejemplo=grande', '/compras/revisar?ejemplo=grande&vista=pendientes']) {
  test('axe · ' + path, async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(path);await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    if(path.includes('revisar'))await expect(page.locator('.compact-review-item')).toHaveCount(path.includes('grande')?(path.includes('pendientes')?6:50):5);
    await scan(page, info);
  });
}

test('axe · formularios y error de inventario', async ({ page }, info) => {
  await page.goto('/inventario');await page.getByRole('button', { name: 'Añadir producto', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar producto', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();await scan(page, info);
});

test('axe · artículo abierto y confirmación de salida', async ({ page }, info) => {
  await page.goto('/compras/revisar');await page.getByRole('button', { name: 'Añadir producto', exact: true }).first().click();
  await page.getByRole('button', { name: 'Leche entera', exact: true }).click();
  await scan(page, info);
  await page.getByRole('link', { name: 'Volver', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();await scan(page, info);
  await mkdir('artifacts/phase-03c',{recursive:true});await page.getByRole('dialog').screenshot({path:'artifacts/phase-03c/confirmacion-salida.png'});
  const modal=await page.getByRole('dialog').evaluate(el=>({text:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));
  await writeFile('artifacts/phase-03c/modal-colors.json',JSON.stringify(modal,null,2));
});

test('axe · metadatos de compra manual y error',async({page},info)=>{
  await page.goto('/compras/nueva');await page.getByRole('button',{name:'Registrar compra manualmente',exact:true}).click();
  await page.getByRole('button',{name:'Continuar con los productos',exact:true}).click();
  await expect(page.getByRole('alert')).toBeVisible();await scan(page,info);
});

test('axe · actualización sencilla y error de cantidad exacta',async({page},info)=>{
  await page.goto('/inventario');await page.getByRole('button',{name:'Actualizar cuánto queda de Café molido',exact:true}).click();await scan(page,info);
  await page.getByRole('button',{name:'Volver sin cambiar',exact:true}).click();await page.getByRole('button',{name:'Actualizar cuánto queda de Leche entera',exact:true}).click();
  await page.getByRole('textbox',{name:'Cuánto hay ahora',exact:true}).fill('-1');await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();
  await expect(page.getByRole('alert')).toBeVisible();await scan(page,info);
});

test('axe · detalle de gastos y filtros de fechas',async({page},info)=>{
  await page.goto('/gastos');await page.getByRole('link',{name:'Tienda del barrio',exact:true}).click();await expect(page.locator('#purchase-detail')).toBeFocused();
  await page.locator('.date-filters summary').click();await scan(page,info);
});

test('axe · lista vacía y editor de lista', async ({ page }, info) => {
  await page.goto('/lista');await page.getByRole('button', { name: 'Añadir producto a la lista', exact: true }).click();
  await scan(page, info);await page.getByRole('button', { name: 'Volver a mi lista', exact: true }).click();
  await page.getByRole('button', { name: 'Finalizar y descartar lista', exact: true }).click();
  await page.getByRole('button', { name: 'Finalizar y descartar', exact: true }).click();
  await scan(page, info);
});

test('contrastes de los tokens usados para texto y controles',async({page},info)=>{
  await page.goto('/');
  const pairs=await page.evaluate(()=>{
    const css=getComputedStyle(document.documentElement),color=(name:string)=>css.getPropertyValue('--'+name).trim();
    const lum=(hex:string)=>{
      const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
      return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
    };
    return [
      ['ink','canvas',4.5],['ink','surface',4.5],['muted','canvas',4.5],['muted','surface',4.5],
      ['surface','green',4.5],['green','green-soft',4.5],['green-dark','green-soft',4.5],
      ['warning','warning-soft',4.5],['error','error-soft',4.5],['control-line','surface',3],['green-dark','canvas',3],
    ].map(([foreground,background,minimum])=>{
      const a=lum(color(String(foreground))),b=lum(color(String(background)));
      return {foreground,background,minimum:Number(minimum),ratio:(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)};
    });
  });
  await info.attach('contrastes',{body:JSON.stringify(pairs,null,2),contentType:'application/json'});
  await mkdir('artifacts/phase-03c',{recursive:true});await writeFile('artifacts/phase-03c/contrast-report.json',JSON.stringify(pairs,null,2));
  for(const pair of pairs)expect(pair.ratio,`${pair.foreground}/${pair.background}`).toBeGreaterThanOrEqual(pair.minimum);
});
