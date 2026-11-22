import { expect, test, type Page } from '@playwright/test';

async function manual(page:Page,store='Tienda de prueba') {
  await page.goto('/compras/nueva');
  await page.getByRole('button',{name:'Registrar compra manualmente',exact:true}).click();
  await page.getByRole('textbox',{name:'Establecimiento',exact:true}).fill(store);
  await page.getByRole('button',{name:'Continuar con los productos',exact:true}).click();
  await expect(page.getByRole('heading',{level:1,name:'Revisar compra'})).toBeVisible();
}
async function addMilk(page:Page,quantity='6',price='4200') {
  await page.getByRole('button',{name:'Añadir producto',exact:true}).first().click();
  await page.getByRole('textbox',{name:'Buscar un producto existente',exact:true}).fill('Leche');
  await page.getByRole('button',{name:'Leche entera',exact:true}).click();
  await page.getByRole('textbox',{name:'Cantidad comprada',exact:true}).fill(quantity);
  await page.getByRole('textbox',{name:'Precio por unidad (COP)',exact:true}).fill(price);
  await page.getByRole('button',{name:'Guardar artículo en la compra',exact:true}).click();
  await expect(page.locator('.compact-review-item')).toHaveCount(1);
}
async function nav(page:Page,name:string){await page.getByRole('navigation',{name:'Secciones principales'}).getByRole('link',{name,exact:true}).click();}

test('compra manual completa: edición, doble confirmación, inventario y gasto único',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await manual(page);await addMilk(page,'2','4000');
  const item=page.locator('.compact-review-item').first();await item.locator('summary').click();await page.getByRole('button',{name:'Editar Leche entera',exact:true}).click();
  await page.getByRole('textbox',{name:'Cantidad comprada',exact:true}).fill('6');await page.getByRole('textbox',{name:'Precio por unidad (COP)',exact:true}).fill('4200');
  await page.getByRole('button',{name:'Guardar artículo en la compra',exact:true}).click();
  await expect(page.locator('#confirmar-compra')).toContainText('25.200');
  await page.getByRole('button',{name:'Guardar compra',exact:true}).dblclick();
  // El segundo clic puede alcanzar Gastos tras navegar; debe existir una sola compra.
  await expect(page.getByRole('region',{name:'Historial de compras'}).locator('.record')).toHaveCount(5);
  await page.getByRole('link',{name:'Tienda de prueba',exact:true}).click();
  await expect(page.getByText('Compra registrada en esta sesión.',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Detalle de la compra'})).toBeVisible();
  await expect(page.getByRole('region',{name:'Historial de compras'}).locator('.record')).toHaveCount(5);
  await expect(page.locator('.monthly')).toContainText('311.600');
  await nav(page,'Inventario');const milk=page.locator('[data-product-id="milk"]');await expect(milk).toContainText('9 unidades');
  await milk.getByRole('button',{name:'Actualizar cuánto queda de Leche entera',exact:true}).click();
  await page.getByRole('combobox',{name:'Qué quieres hacer',exact:true}).selectOption('consume');await page.getByRole('textbox',{name:'Cantidad',exact:true}).fill('2');await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();
  await expect(milk).toContainText('7 unidades');await nav(page,'Gastos');await expect(page.locator('.monthly')).toContainText('311.600');expect(errors).toEqual([]);
});

test('añade un artículo manual tras reconocimiento y registra producto nuevo al confirmar',async({page})=>{
  await page.goto('/compras/revisar');await expect(page.locator('.compact-review-item')).toHaveCount(5);
  await page.getByRole('button',{name:'Por revisar (1)',exact:true}).click();await expect(page.locator('.compact-review-item')).toHaveCount(1);await page.locator('.compact-review-item summary').click();await page.getByRole('button',{name:'Marcar revisado Leche entera',exact:true}).click();
  await expect(page.getByRole('heading',{name:'No quedan artículos pendientes'})).toBeVisible();
  await page.getByRole('button',{name:'Añadir producto',exact:true}).first().click();await page.getByRole('textbox',{name:'Buscar un producto existente',exact:true}).fill('Yogur de prueba');
  await page.getByRole('button',{name:'Crear producto nuevo',exact:true}).click();await page.getByRole('textbox',{name:'Cantidad comprada',exact:true}).fill('2');await page.getByRole('textbox',{name:'Precio por unidad (COP)',exact:true}).fill('3200');
  await page.getByRole('button',{name:'Guardar artículo en la compra',exact:true}).click();
  await page.getByRole('button',{name:'Todos (6)',exact:true}).click();await expect(page.locator('.compact-review-item')).toHaveCount(6);
  await expect(page.locator('#confirmar-compra')).toContainText('67.500');await page.getByRole('button',{name:'He revisado y acepto este total',exact:true}).click();await page.getByRole('button',{name:'Guardar compra',exact:true}).click();
  await expect(page.locator('.monthly')).toContainText('353.900');await nav(page,'Inventario');await page.getByRole('searchbox',{name:'Buscar un producto',exact:true}).fill('Yogur de prueba');
  await expect(page.locator('.inventory-item')).toHaveCount(1);await expect(page.locator('.inventory-item')).toContainText('2 unidades');
});

test('cancela una compra editada sin crear productos ni cambiar gastos',async({page})=>{
  await manual(page,'Compra que se descarta');await addMilk(page);
  await page.getByRole('link',{name:'Volver',exact:true}).click();await page.getByRole('button',{name:'Seguir revisando',exact:true}).click();await expect(page.locator('.compact-review-item')).toHaveCount(1);
  await page.getByRole('link',{name:'Volver',exact:true}).click();await page.getByRole('button',{name:'Descartar y salir',exact:true}).click();
  await page.getByRole('link',{name:'Volver',exact:true}).click();await expect(page.locator('.monthly')).toContainText('286.400');await nav(page,'Inventario');await expect(page.locator('[data-product-id="milk"]')).toContainText('3 unidades');
});

test('crear, marcar, cambiar cantidades y finalizar una lista no modifica inventario ni gastos',async({page})=>{
  await page.goto('/lista');await page.getByRole('button',{name:'Finalizar y descartar lista',exact:true}).click();await page.getByRole('button',{name:'Finalizar y descartar',exact:true}).click();
  await page.getByRole('textbox',{name:'Nombre de la lista',exact:true}).fill('Para el paseo');await page.getByRole('button',{name:'Crear mi lista',exact:true}).click();
  await page.getByRole('button',{name:'Añadir producto a la lista',exact:true}).click();await page.getByRole('textbox',{name:'Producto de la lista',exact:true}).fill('Servilletas');await page.getByRole('textbox',{name:'Cantidad deseada',exact:true}).fill('2');await page.getByRole('button',{name:'Guardar artículo de la lista',exact:true}).click();
  await page.getByRole('checkbox',{name:/Servilletas/}).check();await expect(page.getByRole('checkbox',{name:/Servilletas/})).toBeChecked();
  await page.getByRole('button',{name:'Cambiar cantidad de Servilletas',exact:true}).click();await page.getByRole('textbox',{name:'Cantidad deseada',exact:true}).fill('3');await page.getByRole('button',{name:'Guardar artículo de la lista',exact:true}).click();await expect(page.getByRole('checkbox',{name:/Servilletas/})).toBeChecked();
  await page.getByRole('checkbox',{name:/Servilletas/}).uncheck();await page.getByRole('button',{name:'Finalizar y descartar lista',exact:true}).click();await page.getByRole('button',{name:'Finalizar y descartar',exact:true}).click();await expect(page.getByRole('heading',{name:'No tienes una lista activa'})).toBeVisible();
  await nav(page,'Inventario');await expect(page.locator('[data-product-id="milk"]')).toContainText('3 unidades');await nav(page,'Gastos');await expect(page.locator('.monthly')).toContainText('286.400');
});

test('cincuenta productos: impide pendientes, resuelve seis y confirma todo junto',async({page})=>{
  await page.goto('/compras/revisar?ejemplo=grande&vista=pendientes');await expect(page.locator('.compact-review-item')).toHaveCount(6);await expect(page.getByRole('button',{name:'Guardar compra',exact:true})).toBeDisabled();
  for(let i=0;i<6;i++){await page.locator('.compact-review-item summary').first().click();await page.getByRole('button',{name:/^Marcar revisado /}).first().click();}
  await expect(page.getByRole('heading',{name:'No quedan artículos pendientes'})).toBeVisible();await page.getByRole('button',{name:'Guardar compra',exact:true}).click();
  await expect(page.locator('.monthly')).toContainText('722.000');await expect(page.locator('#purchase-detail .record')).toHaveCount(50);
});

test('restablecer retorna al estado inicial y requiere confirmación',async({page})=>{
  await manual(page);await addMilk(page,'1','4200');await page.getByRole('button',{name:'Guardar compra',exact:true}).click();await expect(page.locator('.monthly')).toContainText('290.600');
  await page.getByRole('button',{name:'Restablecer datos de ejemplo',exact:true}).click();await page.getByRole('button',{name:'Conservar mis cambios',exact:true}).click();await expect(page.locator('.monthly')).toContainText('290.600');
  await page.getByRole('button',{name:'Restablecer datos de ejemplo',exact:true}).click();await page.getByRole('button',{name:'Restablecer ejemplos',exact:true}).click();await expect(page.locator('.monthly')).toContainText('286.400');
});
