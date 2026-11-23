import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { owner, other } from '../firebase-auth/fixtures.mjs';
import { inventoryFixture } from './fixtures.mjs';

async function login(page:Page) {
  await page.getByLabel('Correo electrónico').fill(owner.email);
  await page.getByLabel('Contraseña',{exact:true}).fill(owner.password);
  await page.getByRole('button',{name:'Ingresar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Mi inventario',exact:true})).toBeVisible();
}
async function enter(page:Page) { await page.goto('/inventario'); await login(page); await expect(page.getByText('Cargando productos…',{exact:true})).toHaveCount(0); }
async function create(page:Page,name='Arroz ficticio',simple=false) {
  await page.getByRole('button',{name:'Añadir producto',exact:true}).click();
  await page.getByLabel('Nombre del producto').fill(name);
  if(simple) await page.getByLabel('Cómo controlar cuánto queda').selectOption('simple');
  else await page.getByLabel('Cuánto hay ahora',{exact:true}).fill('2');
  await page.getByRole('button',{name:'Guardar producto',exact:true}).click();
  await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
}
const row=(page:Page,name='Arroz ficticio')=>page.locator('.inventory-item').filter({has:page.getByRole('heading',{name,exact:true})});
async function stock(page:Page,action:string,amount:string,name='Arroz ficticio') {
  await row(page,name).getByRole('button',{name:'Actualizar cuánto queda de '+name,exact:true}).click();
  await page.getByLabel('Qué quieres hacer').selectOption(action);
  await page.getByLabel(action==='set'?'Cuánto hay ahora':'Cantidad',{exact:true}).fill(amount);
}
test.beforeEach(async({page,request})=>{
  expect((await request.delete('http://127.0.0.1:8386/emulator/v1/projects/demo-mi-casa-05a/databases/(default)/documents')).ok()).toBe(true);
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(!['localhost','127.0.0.1'].includes(url.hostname)){await route.abort();throw Error('NON_LOCAL_REQUEST');}
    if(url.port==='5205'&&!url.pathname.endsWith('/mutateInventoryExperimental')){await route.abort();throw Error('NON_INVENTORY_CALLABLE');}
    if(url.port==='8386'&&/Write|Commit|:commit|:batchWrite/.test(url.pathname)){await route.abort();throw Error('DIRECT_FIRESTORE_WRITE');}
    await route.continue();
  });
});
test('empty local inventory stays separate from examples; confirmed products survive navigation, reload, new tab and login',async({page,context})=>{
  await enter(page); await expect(page.getByRole('heading',{name:'No hay productos para mostrar'})).toBeVisible();
  await create(page); await expect(row(page)).toContainText('2 unidades');
  await page.goto('/gastos'); await expect(page.getByLabel('Datos de ejemplo')).toBeVisible();
  await page.goto('/inventario'); await expect(row(page)).toContainText('2 unidades');
  await page.reload(); await expect(row(page)).toContainText('2 unidades');
  await page.close();
  const fresh=await context.newPage(); await fresh.goto('/inventario'); await expect(row(fresh)).toContainText('2 unidades');
  await fresh.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
  await expect(fresh).toHaveURL(/\/acceso$/); await expect(fresh.getByText('Arroz ficticio',{exact:true})).toHaveCount(0);
  await login(fresh); await expect(row(fresh)).toContainText('2 unidades');
  await fresh.close();
});
test('edit, category filter, accent-insensitive search, add, consume and set use confirmed local products',async({page})=>{
  await enter(page); await create(page);
  await row(page).getByRole('button',{name:'Editar Arroz ficticio',exact:true}).click();
  await page.getByLabel('Nombre del producto').fill('Arroz integral fictício');
  await page.getByLabel('Categoría del producto').selectOption('Limpieza');
  await expect(page.getByLabel('Unidad del inventario')).toHaveCount(0);
  await page.getByRole('button',{name:'Guardar producto',exact:true}).click();
  const name='Arroz integral fictício'; await expect(row(page,name)).toContainText('Limpieza');
  await page.getByLabel('Buscar un producto').fill('FICTICIO'); await expect(row(page,name)).toBeVisible();
  await page.getByLabel('Categoría',{exact:true}).selectOption('Alimentos'); await expect(row(page,name)).toHaveCount(0);
  await page.getByLabel('Categoría',{exact:true}).selectOption('Limpieza'); await expect(row(page,name)).toBeVisible();
  for(const [action,amount,total] of [['add','3','5 unidades'],['consume','1','4 unidades'],['set','7','7 unidades']]) {
    await stock(page,action,amount,name); await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();
    await expect(row(page,name)).toContainText(total);
  }
  await stock(page,'consume','8',name); await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('No pueden quedar existencias negativas');
  await expect(row(page,name)).toContainText('7 unidades');
});
test('simple statuses are explicit and restored after reload',async({page})=>{
  await enter(page); const name='Jabón ficticio'; await create(page,name,true);
  for(const status of ['low','empty','available']) {
    await row(page,name).getByRole('button',{name:'Actualizar cuánto queda de '+name,exact:true}).click();
    await page.getByLabel('Cuánto queda',{exact:true}).selectOption(status);
    await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();
    await expect(page.getByRole('button',{name:'Guardar existencias',exact:true})).toHaveCount(0);
  }
  await page.reload(); await expect(row(page,name)).toContainText('Hay suficiente');
});
test('two tabs increasing the same version surface a conflict, then a reviewed increment preserves both',async({page,context})=>{
  await enter(page); await create(page); const second=await context.newPage(); await second.goto('/inventario');
  await stock(page,'add','1'); await stock(second,'add','1');
  await page.getByRole('button',{name:'Guardar existencias',exact:true}).click(); await expect(row(page)).toContainText('3 unidades');
  await second.getByRole('button',{name:'Guardar existencias',exact:true}).click();
  await expect(second.getByRole('alert')).toContainText('cambió en otra ventana'); await expect(row(second)).toContainText('2 unidades');
  await second.getByRole('button',{name:'Volver sin cambiar',exact:true}).click();
  await second.getByRole('button',{name:'Actualizar productos',exact:true}).click(); await expect(row(second)).toContainText('3 unidades');
  await stock(second,'add','1'); await second.getByRole('button',{name:'Guardar existencias',exact:true}).click();
  await expect(row(second)).toContainText('4 unidades'); await page.reload(); await expect(row(page)).toContainText('4 unidades'); await second.close();
});
test('a lost successful response retries the same command and produces one stock effect',async({page})=>{
  await enter(page); await create(page); await stock(page,'add','1');
  let requests=0; const bodies:string[]=[];
  const endpoint='**/mutateInventoryExperimental';
  await page.route(endpoint,async route=>{
    requests++; bodies.push(route.request().postData()!);
    if(requests===1){const response=await route.fetch();expect(response.ok()).toBe(true);await route.abort('connectionreset');}
    else await route.continue();
  });
  await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('No pudimos comprobar si se guardó');
  await expect(row(page)).toContainText('2 unidades'); // No optimistic success.
  await expect(page.getByLabel('Cantidad',{exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Reintentar guardado',exact:true}).click();
  await expect(row(page)).toContainText('3 unidades'); expect(requests).toBe(2);expect(bodies[0]).toBe(bodies[1]);
  await page.reload(); await expect(row(page)).toContainText('3 unidades');
});
test('read network error offers retry, with no demo fallback or remote service',async({page})=>{
  await page.route('http://127.0.0.1:8386/**',route=>route.abort('connectionrefused'));
  await page.goto('/inventario'); await login(page);
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar',{timeout:45000});
  await expect(page.locator('.inventory-item')).toHaveCount(0);
  await page.unroute('http://127.0.0.1:8386/**'); await page.getByRole('button',{name:'Reintentar carga',exact:true}).click();
  await expect(page.getByRole('heading',{name:'No hay productos para mostrar'})).toBeVisible({timeout:30000});
});
test('logout clears private inventory in all tabs and rejects a different identity; expiry hides restored products',async({page,context})=>{
  await enter(page); await create(page);
  const second=await context.newPage(); await second.goto('/inventario'); await expect(row(second)).toBeVisible();
  await second.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
  for(const tab of [page,second]) { await expect(tab).toHaveURL(/\/acceso$/); await expect(tab.locator('.inventory-item')).toHaveCount(0); }
  await second.getByLabel('Correo electrónico').fill(other.email); await second.getByLabel('Contraseña',{exact:true}).fill(other.password);
  await second.getByRole('button',{name:'Ingresar',exact:true}).click(); await expect(second.getByRole('alert')).toContainText('no tiene acceso');
  await expect(second.locator('.inventory-item')).toHaveCount(0);
  await login(page); await expect(row(page)).toBeVisible();
  await page.route('**/securetoken.googleapis.com/v1/token**',route=>route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:{message:'TOKEN_EXPIRED'}})}));
  await page.reload(); await expect(page).toHaveURL(/\/acceso$/); await expect(page.locator('.inventory-item')).toHaveCount(0);
  await expect(page.getByRole('alert')).toContainText('Tu sesión terminó'); await second.close();
});
test('late inventory reads cannot refill a private view after logout',async({page})=>{
  await enter(page); await create(page);
  let release!:()=>void; const held=new Promise<void>(r=>{release=r;});
  let started=false;
  await page.route('http://127.0.0.1:8386/**',async route=>{started=true;await held;await route.continue();});
  await page.getByRole('button',{name:'Actualizar productos',exact:true}).click();
  await expect.poll(()=>started).toBe(true);
  await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
  await expect(page).toHaveURL(/\/acceso$/); release();
  await expect(page.locator('.inventory-item')).toHaveCount(0); await expect(page.getByRole('heading',{name:'Arroz ficticio',exact:true})).toHaveCount(0);
});
test('demo inventory never imports the adapter or sends Firebase requests',async({page})=>{
  const seen:string[]=[]; page.on('request',r=>seen.push(r.url()));
  await page.goto('http://127.0.0.1:4175/inventario');
  await expect(page.locator('.inventory-item').first()).toBeVisible();
  await create(page,'Producto solo demo'); await page.reload(); await expect(row(page,'Producto solo demo')).toHaveCount(0);
  expect(seen.every(url=>new URL(url).port==='4175')).toBe(true);
  expect(seen.some(url=>/adapters\/firebase|firebase_(firestore|functions|auth)/.test(url))).toBe(false);
});
for(const count of [100,500,1000])test(`pages ${count} normalized products and does not treat an unfinished substring search as empty`,async({page})=>{
  await inventoryFixture(count); await enter(page);
  await expect(page.locator('.inventory-item')).toHaveCount(100);
  while(await page.getByRole('button',{name:'Ver más productos',exact:true}).count()) {
    await page.getByRole('button',{name:'Ver más productos',exact:true}).click();
    await expect(page.getByText('Cargando productos…',{exact:true})).toHaveCount(0);
  }
  await expect(page.locator('.inventory-item')).toHaveCount(count);
  await page.getByLabel('Buscar un producto').fill('seleccion final');
  if(count>100)await expect(page.getByRole('heading',{name:'La búsqueda continúa'})).toBeVisible();
  for(let step=0;step<count/100;step++) {
    if(await page.getByRole('heading',{name:'Selección final ficticia',exact:true}).count())break;
    await page.getByRole('button',{name:'Ver más productos',exact:true}).click();
    await expect(page.getByText('Cargando productos…',{exact:true})).toHaveCount(0);
  }
  await expect(page.getByRole('heading',{name:'Selección final ficticia',exact:true})).toBeVisible();
  await expect(page.locator('.inventory-item')).toHaveCount(1);
});
for(const width of [360,390,430,768])test(`local inventory keeps keyboard access and no overflow at ${width}px and 200% text`,async({page})=>{
  await page.setViewportSize({width,height:1000}); await enter(page); await create(page);
  for(const percent of [100,200]) {
    await page.addStyleTag({content:`html {font-size:${percent}% !important}`});
    expect(await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.getByRole('button',{name:'Añadir producto',exact:true}).focus(); await page.keyboard.press('Enter');
    await expect(page.getByLabel('Nombre del producto')).toBeFocused();
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
    if(percent===200)await page.screenshot({path:`artifacts/phase-05c-1/inventory-${width}-text200.png`,fullPage:true});
    await page.getByRole('button',{name:'Volver sin cambiar',exact:true}).click();
    await expect(page.getByRole('button',{name:'Añadir producto',exact:true})).toBeFocused();
  }
});
