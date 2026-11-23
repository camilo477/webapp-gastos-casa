import { expect,test } from '@playwright/test';
import { login,mockReadServices } from './fixtures';
test('Auth-only command overrides leftover read flags and never obtains the Firestore adapter',async({page})=>{
 const state=await mockReadServices(page),requests:string[]=[];page.on('request',request=>requests.push(request.url()));
 await page.goto('/inventario');await login(page);await expect(page.getByRole('heading',{name:'Mi inventario',exact:true})).toBeVisible();
 await expect(page.getByLabel('Prueba de acceso autorizada')).toContainText('no pertenecen a esta cuenta');await expect(page.getByRole('button',{name:'Añadir producto',exact:true})).toBeVisible();
 expect(state.reads).toBe(0);expect(requests.some(url=>url.includes('/inventory-read-test')||url.includes('/inventory-candidate-reader'))).toBe(false);
});
