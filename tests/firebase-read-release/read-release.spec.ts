import { expect,test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { emptyInventory,login,mockReadServices,fixture } from './fixtures';
test('explicit reader reuses authenticated identity, reads an empty account and restores after reload',async({page})=>{
 const state=await mockReadServices(page);await page.goto('/inventario');await expect(page).toHaveURL(/\/acceso$/);expect(state.reads).toBe(0);
 await login(page);await emptyInventory(page);await expect(page.getByLabel('Consulta de inventario autorizada')).not.toContainText('emulador');expect(state.reads).toBeGreaterThan(0);
 const before=state.reads;await page.reload();await emptyInventory(page);expect(state.reads).toBeGreaterThan(before);expect(state.refreshes).toBeGreaterThan(0);
});
test('logout removes the inventory and protects the requested route without new reads',async({page})=>{
 const state=await mockReadServices(page);await page.goto('/inventario');await login(page);await emptyInventory(page);
 await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await expect(page).toHaveURL(/\/acceso$/);const before=state.reads;
 await page.goto('/inventario');await expect(page.getByRole('heading',{name:'Bienvenida a Mi Casa'})).toBeVisible();expect(state.reads).toBe(before);await expect(page.getByRole('heading',{name:'Mi inventario',exact:true})).toHaveCount(0);
});
test('permission and network failures show no seed and can be retried as read-only',async({page})=>{
 const messages:string[]=[];page.on('console',message=>messages.push(message.text()));
 const state=await mockReadServices(page);state.denied=true;await page.goto('/inventario');await login(page);
 await expect(page.getByRole('alert')).toContainText('no tiene permiso');await expect(page.locator('.inventory-item')).toHaveCount(0);
 state.denied=false;state.unavailable=true;await page.getByRole('button',{name:'Reintentar carga',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Comprueba la conexión');
 state.unavailable=false;await page.getByRole('button',{name:'Reintentar carga',exact:true}).click();await emptyInventory(page);
 expect(messages.some(message=>message.includes(fixture.uid)||message.includes('fictitious-public-web-key-not-valid'))).toBe(false);
});
test('expired restored credentials never trigger an inventory read or reveal a private screen',async({page})=>{
 const state=await mockReadServices(page);await page.goto('/inventario');await login(page);await emptyInventory(page);const before=state.reads;
 state.expired=true;await page.reload();await expect(page.getByRole('heading',{name:'Bienvenida a Mi Casa'})).toBeVisible();await expect(page.getByRole('alert')).toContainText('Tu sesión terminó');expect(state.reads).toBe(before);
});
for(const width of [360,390,430,768])test(`empty read-only inventory stays accessible at ${width}px and 200% text`,async({page})=>{
 await mockReadServices(page);await page.setViewportSize({width,height:1000});await page.goto('/inventario');await login(page);await emptyInventory(page);
 await page.addStyleTag({content:'html {font-size:200% !important}'});expect(await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);await page.getByRole('button',{name:'Actualizar productos',exact:true}).focus();await expect(page.getByRole('button',{name:'Actualizar productos',exact:true})).toBeFocused();await page.keyboard.press('Enter');await emptyInventory(page);
});
