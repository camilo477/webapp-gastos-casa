import { expect, test, type Page } from '@playwright/test';

async function overflow(page:Page) {
  return page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-document.documentElement.clientWidth);
}

test('escritorio 1440 px mantiene el resumen y la compra grande legibles',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/compras/revisar?ejemplo=grande');
  await expect(page.locator('.compact-review-item')).toHaveCount(50);expect(await overflow(page)).toBeLessThanOrEqual(1);
  await page.screenshot({path:'artifacts/phase-03c/1440-compra-grande.png'});
  await page.getByRole('link',{name:'Ir al total y guardar',exact:true}).first().click();await expect(page.locator('#confirmar-compra')).toBeFocused();
  await expect(page.getByRole('button',{name:'Añadir producto',exact:true}).last()).toBeInViewport();
});

test('espaciado personalizado y movimiento reducido conservan lectura y controles',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:360,height:900});
  for(const path of ['/inventario','/compras/revisar?ejemplo=grande&vista=pendientes','/lista','/gastos']) {
    await page.goto(path);await expect(page.getByRole('heading',{level:1})).toBeVisible();
    await page.addStyleTag({content:'* { line-height:1.5 !important; letter-spacing:0.12em !important; word-spacing:0.16em !important; } p { margin-bottom:2em !important; }'});
    expect(await overflow(page)).toBeLessThanOrEqual(1);
    const moving=await page.locator('body *').evaluateAll(elements=>elements.filter(el=>{const s=getComputedStyle(el);return s.animationName!=='none'||parseFloat(s.transitionDuration)>0;}).length);
    expect(moving).toBe(0);
  }
});

test('comprueba si el navegador disponible permite zoom real por teclado',async({page},info)=>{
  await page.setViewportSize({width:1280,height:960});await page.goto('/');
  const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio}));
  await page.keyboard.press('Control+Equal');await page.keyboard.press('Control+Equal');
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio}));
  await info.attach('intento-zoom-real',{body:JSON.stringify({before,after}),contentType:'application/json'});
  test.skip(after.width===before.width&&after.dpr===before.dpr,'Chromium headless no aplicó zoom de navegador mediante el atajo. No equivale a zoom CSS ni a emulación de viewport.');
  expect(after.width).toBeLessThan(before.width);expect(await overflow(page)).toBeLessThanOrEqual(1);
});

test('el modo demostración no escribe datos persistentes ni contacta servicios externos',async({page,context})=>{
  const external:string[]=[];page.on('request',request=>{if(!['127.0.0.1','localhost'].includes(new URL(request.url()).hostname))external.push(request.url());});
  await page.goto('/lista');await page.getByRole('button',{name:'Finalizar y descartar lista',exact:true}).click();
  await page.getByRole('button',{name:'Finalizar y descartar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'No tienes una lista activa',exact:true})).toBeVisible();
  expect((await context.storageState()).origins.flatMap(o=>o.localStorage)).toEqual([]);
  expect(await page.evaluate(async()=>({session:sessionStorage.length,databases:(await indexedDB.databases()).length,caches:(await caches.keys()).length}))).toEqual({session:0,databases:0,caches:0});
  await page.reload();await expect(page.getByRole('heading',{name:'Mi próxima compra',exact:true})).toBeVisible();expect(external).toEqual([]);
});
