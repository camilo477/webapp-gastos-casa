import { expect,test,type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { owner } from '../firebase-auth/fixtures.mjs';
import { seedCandidate } from './fixtures.mjs';
const row=(page:Page,name='Arroz ficticio')=>page.locator('.inventory-item').filter({has:page.getByRole('heading',{name,exact:true})});
async function enter(page:Page){
 await page.goto('/inventario');await page.getByLabel('Correo electrónico').fill(owner.email);await page.getByLabel('Contraseña',{exact:true}).fill(owner.password);await page.getByRole('button',{name:'Ingresar',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Mi inventario',exact:true})).toBeVisible();await expect(page.getByText('Cargando productos…',{exact:true})).toHaveCount(0);
}
async function begin(page:Page,name='Arroz ficticio',presentation='Bolsa 500 g'){
 await page.getByRole('button',{name:'Añadir producto',exact:true}).click();await page.getByLabel('Nombre del producto').fill(name);await page.getByLabel('Presentación (opcional)').fill(presentation);
 await page.getByLabel('Categoría del producto').selectOption('Alimentos');
}
async function finish(page:Page){
 await expect(page.getByText('Buscando productos parecidos…',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Guardar producto',exact:true}).click();await expect(page.getByRole('heading',{name:'Añadir producto al inventario',exact:true})).toHaveCount(0);
}
async function create(page:Page){await begin(page);await page.getByLabel('Cuánto hay ahora',{exact:true}).fill('2');await finish(page);await expect(row(page)).toContainText('2 unidades');}
async function stock(page:Page,action:string,amount:string){
 await row(page).getByRole('button',{name:'Actualizar cuánto queda de Arroz ficticio',exact:true}).click();await page.getByLabel('Qué quieres hacer').selectOption(action);await page.getByLabel(action==='set'?'Cuánto hay ahora':'Cantidad',{exact:true}).fill(amount);
}
test.beforeEach(async({page,request})=>{
 expect((await request.delete('http://127.0.0.1:8386/emulator/v1/projects/demo-mi-casa-05a/databases/(default)/documents')).ok()).toBe(true);
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(!['localhost','127.0.0.1'].includes(url.hostname)){await route.abort();throw Error('NON_LOCAL_REQUEST');}
 if(url.port==='5205'&&!url.pathname.endsWith('/mutateInventoryCandidate')){await route.abort();throw Error('NON_CANDIDATE_CALLABLE');}
 if(url.port==='8386'&&/Write|Commit|:commit|:batchWrite/.test(url.pathname)){await route.abort();throw Error('DIRECT_CLIENT_WRITE');}await route.continue();});
});
test('candidate opening, presentation and stable identity survive reload and metadata/category changes',async({page})=>{
 await enter(page);await create(page);const id=await row(page).getAttribute('data-product-id');
 await page.reload();await expect(row(page)).toContainText('Bolsa 500 g');await expect(row(page)).toContainText('2 unidades');
 await row(page).getByRole('button',{name:'Editar Arroz ficticio',exact:true}).click();await page.getByLabel('Presentación (opcional)').fill('Bolsa 1 kg');await page.getByLabel('Categoría del producto').selectOption('Otros');await page.getByRole('button',{name:'Guardar producto',exact:true}).click();
 await expect(row(page)).toContainText('Otros');await expect(row(page)).toContainText('Bolsa 1 kg');await expect(row(page)).toHaveAttribute('data-product-id',id!);await expect(row(page)).toContainText('2 unidades');
 await page.getByLabel('Categoría',{exact:true}).selectOption('Sin clasificar');await expect(row(page)).toHaveCount(0);
 await page.getByLabel('Categoría',{exact:true}).selectOption('Otros');await expect(row(page)).toBeVisible();
});
test('grams and explicit package content convert to kg; names do not supply quantities',async({page})=>{
 await enter(page);await begin(page);await page.getByLabel('Unidad del inventario',{exact:true}).selectOption('kg');await page.getByLabel('Unidad de la cantidad',{exact:true}).selectOption('g');await page.getByLabel('Cuánto hay ahora',{exact:true}).fill('250');await finish(page);
 await expect(row(page)).toContainText('0,25 kg');
 await row(page).getByRole('button',{name:'Actualizar cuánto queda de Arroz ficticio',exact:true}).click();await page.getByLabel('Qué quieres hacer').selectOption('add');await page.getByLabel('Unidad de la cantidad',{exact:true}).selectOption('g');await page.getByLabel('Cantidad',{exact:true}).fill('750');await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();await expect(row(page)).toContainText('1 kg');
 await row(page).getByRole('button',{name:'Actualizar cuánto queda de Arroz ficticio',exact:true}).click();await page.getByLabel('Unidad de la cantidad',{exact:true}).selectOption('package');
 await page.getByLabel('Cuántos envases hay').fill('3');await page.getByLabel('Unidad del contenido',{exact:true}).selectOption('g');await page.getByLabel('Contenido de cada envase').fill('500');await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();await expect(row(page)).toContainText('1,5 kg');
 await stock(page,'consume','2');await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();await expect(page.getByRole('alert')).toContainText('No pueden quedar existencias negativas');await expect(row(page)).toContainText('1,5 kg');
});
test('litres/millilitres are compatible and fractional individual units are rejected',async({page})=>{
 await enter(page);await begin(page,'Aceite ficticio','Botella 1 L');await page.getByLabel('Unidad del inventario',{exact:true}).selectOption('L');await page.getByLabel('Unidad de la cantidad',{exact:true}).selectOption('ml');await page.getByLabel('Cuánto hay ahora',{exact:true}).fill('750');await finish(page);await expect(row(page,'Aceite ficticio')).toContainText('0,75 litros');
 await begin(page,'Unidad ficticia','');await page.getByLabel('Cuánto hay ahora',{exact:true}).fill('1,5');await expect(page.getByText('Buscando productos parecidos…')).toHaveCount(0);await page.getByRole('button',{name:'Guardar producto',exact:true}).click();await expect(page.getByRole('alert')).toContainText('unidades');await expect(row(page,'Unidad ficticia')).toHaveCount(0);
});
test('approximate products use states without hidden numeric inventory',async({page})=>{
 await enter(page);await begin(page,'Jabón ficticio','Barra');await page.getByLabel('Cómo controlar cuánto queda').selectOption('simple');await page.getByLabel('Estado inicial').selectOption('low');await expect(page.getByLabel('Cuánto hay ahora',{exact:true})).toHaveCount(0);await finish(page);await expect(row(page,'Jabón ficticio')).toContainText('Queda poco');
 await row(page,'Jabón ficticio').getByRole('button',{name:'Actualizar cuánto queda de Jabón ficticio',exact:true}).click();await page.getByLabel('Cuánto queda',{exact:true}).selectOption('empty');await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();await page.reload();await expect(row(page,'Jabón ficticio')).toContainText('Agotado');
});
test('duplicate suggestions require human choice and keep different presentations as independent products',async({page})=>{
 await enter(page);await create(page);await begin(page,'ARROZ FICTÍCIO','Bolsa 1 kg');await page.getByLabel('Cuánto hay ahora',{exact:true}).fill('4');
 await expect(page.getByText('Puede que este producto ya esté en casa.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Guardar producto',exact:true}).click();await expect(page.getByRole('alert')).toContainText('confirma que es un producto distinto');
 await page.getByLabel('Es un producto distinto; quiero añadirlo').check();await finish(page);await expect(page.locator('.inventory-item')).toHaveCount(2);await expect(row(page)).toContainText('2 unidades');
 await begin(page);await expect(page.getByRole('button',{name:'Usar Arroz ficticio',exact:true})).toBeVisible();await page.getByRole('button',{name:'Usar Arroz ficticio',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Actualizar Arroz ficticio',exact:true})).toBeVisible();await expect(page.getByLabel('Qué quieres hacer')).toBeFocused();await expect(page.locator('.inventory-item')).toHaveCount(2);
});
test('two tabs preserve versions and successful-response retry applies one effect',async({page,context})=>{
 await enter(page);await create(page);const second=await context.newPage();await second.goto('/inventario');await stock(page,'add','1');await stock(second,'add','1');
 await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();await expect(row(page)).toContainText('3 unidades');
 await second.getByRole('button',{name:'Guardar existencias',exact:true}).click();await expect(second.getByRole('alert')).toContainText('cambió en otra ventana');await second.close();
 await stock(page,'add','1');let calls=0;const bodies:string[]=[];
 await page.route('**/mutateInventoryCandidate',async route=>{calls++;bodies.push(route.request().postData()!);if(calls===1){const response=await route.fetch();expect(response.ok()).toBe(true);await route.abort('connectionreset');}else await route.continue();});
 await page.getByRole('button',{name:'Guardar existencias',exact:true}).click();await expect(page.getByRole('button',{name:'Reintentar guardado',exact:true})).toBeVisible();await expect(row(page)).toContainText('3 unidades');await page.getByRole('button',{name:'Reintentar guardado',exact:true}).click();await expect(row(page)).toContainText('4 unidades');expect(bodies[0]).toBe(bodies[1]);expect(calls).toBe(2);
});
test('legacy documents remain untouched and cannot masquerade as the candidate',async({page})=>{
 await seedCandidate(1,true);await enter(page);await expect(page.getByRole('alert')).toContainText('necesitan una revisión');await expect(page.locator('.inventory-item')).toHaveCount(0);await expect(page.getByRole('button',{name:'Añadir producto',exact:true})).toBeDisabled();
});
for(const count of [100,500,1000])test(`candidate paginates ${count} products and searches presentations/names without operation history`,async({page})=>{
 await seedCandidate(count);await enter(page);await expect(page.locator('.inventory-item')).toHaveCount(100);
 while(await page.getByRole('button',{name:'Ver más productos',exact:true}).count()){await page.getByRole('button',{name:'Ver más productos',exact:true}).click();await expect(page.getByText('Cargando productos…',{exact:true})).toHaveCount(0);}
 await expect(page.locator('.inventory-item')).toHaveCount(count);await page.getByLabel('Buscar un producto').fill('CAFE FINAL');
 if(count>100)await expect(page.getByRole('heading',{name:'La búsqueda continúa'})).toBeVisible();
 for(let i=0;i<count/100;i++){if(await page.getByRole('heading',{name:'Café final ficticio',exact:true}).count())break;await page.getByRole('button',{name:'Ver más productos',exact:true}).click();await expect(page.getByText('Cargando productos…',{exact:true})).toHaveCount(0);}
 await expect(page.getByRole('heading',{name:'Café final ficticio',exact:true})).toBeVisible();await expect(page.locator('.inventory-item')).toHaveCount(1);
});
for(const width of [360,390,430,768])test(`candidate forms and duplicate choices fit ${width}px, keyboard and 200% text`,async({page})=>{
 await page.setViewportSize({width,height:1000});await enter(page);await create(page);await page.addStyleTag({content:'html {font-size:200% !important}'});
 await page.getByRole('button',{name:'Añadir producto',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByLabel('Nombre del producto')).toBeFocused();await page.getByLabel('Nombre del producto').fill('Arroz ficticio');await page.getByLabel('Presentación (opcional)').fill('Bolsa 1 kg');await expect(page.getByText('Puede que este producto ya esté en casa.',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.screenshot({path:`artifacts/phase-05c-3/candidate-${width}-text200.png`,fullPage:true});
 await page.getByRole('button',{name:'Volver sin cambiar',exact:true}).click();await expect(page.getByRole('button',{name:'Añadir producto',exact:true})).toBeFocused();
 await begin(page,'P'.repeat(160),'E'.repeat(240));await finish(page);
 expect(await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
