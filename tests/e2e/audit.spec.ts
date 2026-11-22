import { expect, test, type Page } from '@playwright/test';

async function resolveSmall(page: Page) {
  await page.goto('/compras/revisar?vista=pendientes');
  await expect(page.locator('.compact-review-item')).toHaveCount(1);
  await page.locator('.compact-review-item summary').click();
  await page.getByRole('button', { name: 'Marcar revisado Leche entera', exact: true }).click();
  await page.getByRole('button', { name: 'Todos (5)', exact: true }).click();
  await expect(page.locator('.compact-review-item')).toHaveCount(5);
}

test('no permite confirmar la compra mientras un artículo tiene su editor abierto', async ({ page }) => {
  await resolveSmall(page);
  await page.locator('.compact-review-item summary').first().click();
  await page.getByRole('button', { name: 'Editar Arroz', exact: true }).click();
  await page.getByRole('textbox', { name: 'Precio total de esta cantidad (COP)', exact: true }).fill('9800');
  await expect(page.getByRole('button', { name: 'Guardar compra', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Guardar artículo en la compra', exact: true }).click();
  await expect(page.locator('#confirmar-compra')).toContainText('63.100');
  await page.getByRole('button', { name: 'He revisado y acepto este total', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar compra', exact: true }).click();
  await expect(page.locator('.monthly')).toContainText('349.500');
});

test('añadir otro artículo no borra el formulario que se está editando', async ({ page }) => {
  await resolveSmall(page);
  await page.locator('.compact-review-item summary').first().click();
  await page.getByRole('button', { name: 'Editar Arroz', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nombre en esta compra', exact: true }).fill('Arroz corregido');
  await page.getByRole('button', { name: 'Añadir producto', exact: true }).first().click();
  await expect(page.getByRole('textbox', { name: 'Nombre en esta compra', exact: true })).toHaveValue('Arroz corregido');
  await page.getByRole('button',{name:'Guardar artículo en la compra',exact:true}).click();
  await expect(page.locator('.compact-review-item').first()).toContainText('Arroz corregido');
});

test('los enlaces del historial ofrecen un objetivo de al menos 48 px', async ({page})=>{
  await page.goto('/gastos');
  for(const link of await page.getByRole('region',{name:'Historial de compras'}).getByRole('link').all()) {
    const box=await link.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(48);expect(box!.width).toBeGreaterThanOrEqual(48);
  }
});

test('precio y cantidad inválidos identifican el campo sin perder el resto del artículo',async({page})=>{
  await page.goto('/compras/revisar');await page.getByRole('button',{name:'Añadir producto',exact:true}).first().click();
  await page.getByRole('button',{name:'Leche entera',exact:true}).click();
  const quantity=page.getByRole('textbox',{name:'Cantidad comprada',exact:true}),price=page.getByRole('textbox',{name:'Precio por unidad (COP)',exact:true});
  await quantity.fill('-2');await price.fill('4200');await page.getByRole('button',{name:'Guardar artículo en la compra',exact:true}).click();
  await expect(quantity).toHaveAttribute('aria-invalid','true');await expect(quantity).toHaveAccessibleDescription(/cantidad válida/);
  await expect(page.getByRole('alert')).toBeFocused();await expect(price).toHaveValue('4200');
  await quantity.fill('2');await price.fill('abc');await page.getByRole('button',{name:'Guardar artículo en la compra',exact:true}).click();
  await expect(price).toHaveAttribute('aria-invalid','true');await expect(price).toHaveAccessibleDescription(/pesos enteros/);
  await expect(quantity).toHaveValue('2');await expect(page.locator('.compact-review-item')).toHaveCount(5);
});

test('inventario insuficiente muestra un error y el cambio válido anuncia su resultado',async({page})=>{
  await page.goto('/inventario');const milk=page.locator('[data-product-id="milk"]');
  await milk.getByRole('button',{name:'Actualizar cuánto queda de Leche entera',exact:true}).click();
  await page.getByRole('combobox',{name:'Qué quieres hacer',exact:true}).selectOption('consume');
  const quantity=page.getByRole('textbox',{name:'Cantidad',exact:true});await quantity.fill('4');
  await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('No puedes consumir más de lo que hay');await expect(quantity).toHaveAttribute('aria-invalid','true');
  await expect(milk).toContainText('3 unidades');await quantity.fill('1');await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'existencias actualizadas'})).toBeVisible();await expect(milk).toContainText('2 unidades');
  await page.getByRole('navigation',{name:'Secciones principales'}).getByRole('link',{name:'Gastos',exact:true}).click();await expect(page.locator('.monthly')).toContainText('286.400');
});

test('el detalle del historial recibe foco y un rango inválido no se presenta como gasto cero',async({page})=>{
  await page.goto('/gastos');await page.getByRole('link',{name:'Tienda del barrio',exact:true}).click();
  await expect(page.locator('#purchase-detail')).toBeFocused();await expect(page.locator('#purchase-detail')).toBeInViewport();
  await page.getByRole('link',{name:'Volver al resumen de gastos',exact:true}).click();
  await expect(page.locator('#contenido')).toBeFocused();
  await page.locator('.date-filters summary').click();await page.getByLabel('Desde',{exact:true}).fill('2026-11-25');await page.getByLabel('Hasta',{exact:true}).fill('2026-11-01');
  await expect(page.getByRole('alert')).toContainText('Corrige las fechas');await expect(page.locator('.monthly')).toHaveCount(0);
  await page.getByLabel('Hasta',{exact:true}).fill('2026-11-30');await expect(page.locator('.monthly')).toBeVisible();
});

test('saltar al total mantiene el filtro y la advertencia al volver con cambios',async({page})=>{
  const warnings:string[]=[];page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')warnings.push(m.text());});
  await page.goto('/');await page.getByRole('link',{name:'Registrar compra',exact:true}).click();
  await page.getByRole('button',{name:'Simular recibo de 50 productos',exact:true}).click();
  await page.getByRole('button',{name:'Por revisar (6)',exact:true}).click();await expect(page.locator('.compact-review-item')).toHaveCount(6);
  await page.getByRole('link',{name:'Ir al total y guardar',exact:true}).click();
  await expect(page.locator('#confirmar-compra')).toBeFocused();await expect(page).toHaveURL(/vista=pendientes#confirmar-compra/);
  await page.goBack();await expect(page.getByRole('dialog',{name:'¿Descartar esta compra?',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Seguir revisando',exact:true}).click();await expect(page.locator('.compact-review-item')).toHaveCount(6);expect(warnings).toEqual([]);
});

test('una compra vacía explica por qué no se puede guardar',async({page})=>{
  await page.goto('/compras/nueva');await page.getByRole('button',{name:'Registrar compra manualmente',exact:true}).click();
  await page.getByRole('textbox',{name:'Establecimiento',exact:true}).fill('Tienda sin artículos');
  await page.getByRole('button',{name:'Continuar con los productos',exact:true}).click();
  await expect(page.getByRole('button',{name:'Guardar compra',exact:true})).toBeDisabled();
  await expect(page.locator('#confirmar-compra')).toContainText('Añade al menos un artículo');
});

test('los tres estados sencillos se pueden cambiar sin generar gastos',async({page})=>{
  await page.goto('/inventario');const coffee=page.locator('[data-product-id="coffee"]');
  for(const [value,label] of [['available','Hay suficiente'],['empty','Agotado'],['low','Queda poco']]) {
    await coffee.getByRole('button',{name:'Actualizar cuánto queda de Café molido',exact:true}).click();
    await page.getByRole('combobox',{name:'Cuánto queda',exact:true}).selectOption(value);await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();
    await expect(coffee).toContainText(label);await expect(page.getByRole('status').filter({hasText:'existencias actualizadas'})).toBeVisible();
  }
  await page.getByRole('navigation',{name:'Secciones principales'}).getByRole('link',{name:'Gastos',exact:true}).click();await expect(page.locator('.monthly')).toContainText('286.400');
});

test('quitar una línea pide confirmación y recalcula sin tocar aún el inventario',async({page})=>{
  await page.goto('/compras/revisar');await page.locator('.compact-review-item summary').first().click();
  await page.getByRole('button',{name:'Quitar Arroz de esta compra',exact:true}).click();
  await page.getByRole('button',{name:'Conservar artículo',exact:true}).click();await expect(page.locator('.compact-review-item')).toHaveCount(5);
  await page.getByRole('button',{name:'Quitar Arroz de esta compra',exact:true}).click();
  await page.getByRole('button',{name:'Quitar de esta compra',exact:true}).last().click();
  await expect(page.locator('.compact-review-item')).toHaveCount(4);await expect(page.locator('#confirmar-compra')).toContainText('53.300');
  await expect(page.getByRole('button',{name:'Guardar compra',exact:true})).toBeDisabled();
});

test('la preparación y corrección de las tareas 4 y 5 de usabilidad concilian sus importes',async({page})=>{
  await page.goto('/compras/revisar');
  await page.locator('.compact-review-item summary').first().click();await page.getByRole('button',{name:'Editar Arroz',exact:true}).click();
  await page.getByRole('textbox',{name:'Precio total de esta cantidad (COP)',exact:true}).fill('9800');await page.getByRole('button',{name:'Guardar artículo en la compra',exact:true}).click();
  await expect(page.locator('#confirmar-compra')).toContainText('63.100');
  await page.getByRole('button',{name:'Editar Arroz',exact:true}).click();await page.getByRole('textbox',{name:'Precio total de esta cantidad (COP)',exact:true}).fill('7800');
  await page.getByRole('button',{name:'Guardar artículo en la compra',exact:true}).click();
  await page.getByRole('button',{name:'Por revisar (1)',exact:true}).click();await expect(page.locator('.compact-review-item')).toHaveCount(1);await page.locator('.compact-review-item summary').click();
  await page.getByRole('button',{name:'Marcar revisado Leche entera',exact:true}).click();
  await page.getByRole('button',{name:'Añadir producto',exact:true}).first().click();await page.getByRole('button',{name:'Café molido',exact:true}).click();
  await page.getByRole('textbox',{name:'Precio por unidad (COP)',exact:true}).fill('9000');await page.getByRole('button',{name:'Guardar artículo en la compra',exact:true}).click();
  await expect(page.locator('#confirmar-compra')).toContainText('70.100');await page.getByRole('button',{name:'He revisado y acepto este total',exact:true}).click();
  await page.getByRole('button',{name:'Guardar compra',exact:true}).click();await expect(page.locator('.monthly')).toContainText('356.500');
  await page.getByRole('link',{name:'Ver mi inventario',exact:true}).click();await expect(page.locator('[data-product-id="milk"]')).toContainText('6 unidades');await expect(page.locator('[data-product-id="coffee"]')).toContainText('Hay suficiente');
});
