import { expect, test, type Page } from '@playwright/test';

async function noOverflow(page:Page) {
  const overflow=await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

for(const width of [360,390,430,768]) for(const scale of [100,200]) {
  test(`formularios y confirmación a ${width}px con texto ${scale}%`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width,height:900});await page.goto('/inventario');
    await page.evaluate(size=>{document.documentElement.style.fontSize=size+'%';},scale);
    await page.getByRole('button',{name:'Añadir producto',exact:true}).click();
    await page.getByRole('textbox',{name:'Nombre del producto',exact:true}).fill('Avena integral para el desayuno familiar');
    await page.getByRole('combobox',{name:'Unidad del inventario',exact:true}).selectOption('kg');
    await page.getByRole('textbox',{name:'Cuánto hay ahora',exact:true}).fill('1,5');await noOverflow(page);
    await page.getByRole('button',{name:'Guardar producto',exact:true}).click();
    await expect(page.getByRole('button',{name:'Añadir producto',exact:true})).toBeFocused();
    await expect(page.getByRole('heading',{name:'Avena integral para el desayuno familiar',exact:true})).toBeVisible();await noOverflow(page);
    await page.getByRole('navigation',{name:'Secciones principales'}).getByRole('link',{name:'Inicio',exact:true}).click();
    await page.getByRole('link',{name:'Registrar compra',exact:true}).click();
    await page.getByRole('button',{name:'Registrar compra manualmente',exact:true}).click();
    await page.getByRole('textbox',{name:'Establecimiento',exact:true}).fill('Tienda de productos para el hogar');await noOverflow(page);
    await page.getByRole('button',{name:'Continuar con los productos',exact:true}).click();
    await page.getByRole('button',{name:'Añadir producto',exact:true}).first().click();
    await page.getByRole('textbox',{name:'Buscar un producto existente',exact:true}).fill('Arroz');
    await page.getByRole('button',{name:'Arroz',exact:true}).click();
    await page.getByRole('textbox',{name:'Cantidad comprada',exact:true}).fill('1,5');
    await page.getByRole('textbox',{name:'Precio por kg (COP)',exact:true}).fill('7800');await noOverflow(page);
    if(width===360&&scale===200)await page.screenshot({path:'artifacts/phase-03c/360-200-formulario-articulo.png',fullPage:true});
    await page.getByRole('button',{name:'Guardar artículo en la compra',exact:true}).click();
    await expect(page.locator('#confirmar-compra')).toContainText('11.700');await noOverflow(page);
    await page.getByRole('button',{name:'Guardar compra',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Detalle de la compra',exact:true})).toBeVisible();
    await expect(page.locator('.monthly')).toContainText('298.100');await noOverflow(page);expect(errors).toEqual([]);
  });
}

test('Atrás del navegador conserva el borrador al cancelar y lo descarta al aceptar',async({page})=>{
  await page.goto('/');await page.getByRole('link',{name:'Registrar compra',exact:true}).click();
  await page.getByRole('button',{name:'Registrar compra manualmente',exact:true}).click();
  await page.getByRole('textbox',{name:'Establecimiento',exact:true}).fill('Tienda para volver');
  await page.getByRole('button',{name:'Continuar con los productos',exact:true}).click();
  await page.goBack();await expect(page.getByRole('dialog',{name:'¿Descartar esta compra?',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Seguir revisando',exact:true}).click();await expect(page).toHaveURL(/\/compras\/revisar$/);
  await page.goBack();await page.getByRole('button',{name:'Descartar y salir',exact:true}).click();
  await expect(page).toHaveURL(/\/compras\/nueva$/);await page.getByRole('link',{name:'Volver',exact:true}).click();
  await expect(page.locator('.monthly')).toContainText('286.400');
});

test('los filtros de gastos concilian categoría, establecimiento y fechas',async({page})=>{
  await page.goto('/gastos');await page.getByRole('combobox',{name:'Categoría',exact:true}).selectOption('Cuidado personal');
  await expect(page.locator('.monthly')).toContainText('40.000');await expect(page.getByRole('region',{name:'Historial de compras'}).locator('.record')).toHaveCount(3);
  await page.getByRole('combobox',{name:'Establecimiento',exact:true}).selectOption('Tienda del barrio');await expect(page.locator('.monthly')).toContainText('0');
  await expect(page.getByRole('heading',{name:'No hay compras en estas fechas',exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:'Establecimiento',exact:true}).selectOption('');await page.getByRole('combobox',{name:'Categoría',exact:true}).selectOption('');
  await page.locator('.date-filters summary').click();await page.getByLabel('Desde',{exact:true}).fill('2026-11-18');await page.getByLabel('Hasta',{exact:true}).fill('2026-11-18');
  await expect(page.locator('.monthly')).toContainText('54.100');await expect(page.getByRole('region',{name:'Historial de compras'}).locator('.record')).toHaveCount(1);
});

test('la lista conserva el foco al marcar con teclado y al cerrar su editor',async({page})=>{
  await page.goto('/lista');const item=page.getByRole('checkbox',{name:/Café molido/});
  await item.focus();await page.keyboard.press('Space');await expect(item).toBeChecked();await expect(item).toBeFocused();
  await page.keyboard.press('Space');await expect(item).not.toBeChecked();await expect(item).toBeFocused();
  const edit=page.getByRole('button',{name:'Cambiar cantidad de Café molido',exact:true});
  await edit.click();await expect(page.getByRole('textbox',{name:'Producto de la lista',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Volver a mi lista',exact:true}).click();await expect(edit).toBeFocused();
});
