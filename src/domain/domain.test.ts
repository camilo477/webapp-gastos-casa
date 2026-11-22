import { describe, expect, it } from 'vitest';
import { createDraft, createInitialState } from '../data/seed';
import { reduceDomain } from './reducer';
import { existingProduct } from './inventory';
import { lineTotal, purchaseTotal, spending } from './finance';
import { parseMoney, parseQuantity, stockQuantity } from './validation';
import type { Command, DomainState, PurchaseLine } from './types';

function quantity(state:DomainState,id='milk'){const p=state.products.find(p=>p.id===id)!;if(p.control!=='exact')throw Error('Se esperaba cantidad');return p.quantityMilli;}
function manual(){const initial=createInitialState();return reduceDomain(initial,{type:'startDraft',draft:{...createDraft(initial,'purchase-test','manual'),store:'Mi tienda'}});}
function line(overrides:Partial<PurchaseLine>={}):PurchaseLine{return {id:'line-1',kind:'product',name:'Leche entera',category:'Alimentos',productId:'milk',quantityMilli:6000,unit:'unidad',priceCOP:4200,priceMode:'unit',discountCOP:0,source:'manual',stockStatus:'available',...overrides};}
function add(state:DomainState,overrides:Partial<PurchaseLine>={}){return reduceDomain(state,{type:'putLine',line:line(overrides)});}
function confirm(state:DomainState){return reduceDomain(state,{type:'confirm',id:state.draft!.id});}

describe('Validación exacta de cantidades e importes',()=>{
  it.each([['1,5',1500],['0.001',1],['12',12000],['2.125',2125]])('convierte %s sin coma flotante', (input,expected)=>expect(parseQuantity(input)).toBe(expected));
  it.each(['','-1','1,2345','NaN','1e3','1.234,5'])('rechaza cantidad %s',value=>expect(()=>parseQuantity(value)).toThrow());
  it('acepta cero solo para saldos y distingue cero verificado de vacío',()=>{expect(parseQuantity('0',true)).toBe(0);expect(()=>parseQuantity('0')).toThrow();expect(parseMoney('0')).toBe(0);expect(()=>parseMoney('')).toThrow();expect(parseMoney('4.200')).toBe(4200);expect(()=>parseMoney('4,2')).toThrow();});
  it('convierte unidades compatibles y rechaza conversiones inventadas',()=>{expect(stockQuantity(500000,'g','kg')).toBe(500);expect(stockQuantity(250000,'ml','L')).toBe(250);expect(()=>stockQuantity(1000,'L','kg')).toThrow();expect(()=>stockQuantity(500,'unidad','unidad')).toThrow();expect(()=>stockQuantity(500,'g','kg')).toThrow();});
  it('redondea por política aislada y aplica un descuento una sola vez',()=>{expect(lineTotal(line({quantityMilli:333,unit:'kg',priceCOP:1001}))).toBe(333);expect(lineTotal(line({quantityMilli:500,unit:'kg',priceCOP:1001,discountCOP:1}))).toBe(500);expect(()=>lineTotal(line({priceMode:'total',priceCOP:100,discountCOP:101}))).toThrow();});
  it('rechaza totales que superan los enteros seguros',()=>expect(()=>lineTotal(line({priceCOP:Number.MAX_SAFE_INTEGER}))).toThrow());
});

describe('Inventario y movimientos',()=>{
  it('suma, consume y establece cantidades generando movimientos',()=>{
    let s=createInitialState();const before=s.movements.length;
    s=reduceDomain(s,{type:'adjust',id:'a',productId:'milk',operation:'add',quantityMilli:6000});expect(quantity(s)).toBe(9000);
    s=reduceDomain(s,{type:'adjust',id:'b',productId:'milk',operation:'consume',quantityMilli:2000});expect(quantity(s)).toBe(7000);
    s=reduceDomain(s,{type:'adjust',id:'c',productId:'milk',operation:'set',quantityMilli:1000});expect(quantity(s)).toBe(1000);
    expect(s.movements).toHaveLength(before+3);expect(s.movements.find(m=>m.id==='b')?.kind).toBe('consumption');expect(spending(s).totalCOP).toBe(286400);
  });
  it('no permite negativos ni actualizaciones repetidas con la misma identidad',()=>{
    const initial=createInitialState();expect(()=>reduceDomain(initial,{type:'adjust',id:'a',productId:'milk',operation:'consume',quantityMilli:4000})).toThrow(/más de lo que hay/);expect(quantity(initial)).toBe(3000);
    const action:Command={type:'adjust',id:'once',productId:'milk',operation:'add',quantityMilli:1000};const first=reduceDomain(initial,action);expect(reduceDomain(first,action)).toEqual(first);
  });
  it('resta decimales sin residuos binarios',()=>{
    let s=createInitialState();for(let i=0;i<10;i++)s=reduceDomain(s,{type:'adjust',id:'decimal-'+i,productId:'rice',operation:'consume',quantityMilli:100});expect(quantity(s,'rice')).toBe(1000);
  });
  it('cambia estados sin inventar cantidades ni gastos',()=>{
    const s=reduceDomain(createInitialState(),{type:'stockStatus',id:'state',productId:'coffee',status:'empty'});
    expect(s.products.find(p=>p.id==='coffee')).toMatchObject({control:'simple',status:'empty'});expect(spending(s).totalCOP).toBe(286400);
  });
  it('crea y edita productos y detecta nombres normalizados existentes',()=>{
    let s=createInitialState();expect(existingProduct(s.products,'  LÉCHE  ENTERA ')?.id).toBe('milk');
    const input={name:'Avena',category:'Alimentos',control:'exact' as const,unit:'kg' as const,initialQuantityMilli:500,initialStatus:'empty' as const};
    s=reduceDomain(s,{type:'createProduct',id:'oats',input});expect(quantity(s,'oats')).toBe(500);
    expect(()=>reduceDomain(s,{type:'createProduct',id:'duplicate',input:{...input,name:' ÁVENA '}})).toThrow(/Ya hay/);
    s=reduceDomain(s,{type:'editProduct',id:'oats',operationId:'rename',name:'Avena integral',category:'Alimentos'});expect(s.products.find(p=>p.id==='oats')?.name).toBe('Avena integral');
  });
});

describe('Borradores y confirmación central',()=>{
  it('añade, edita, quita y recalcula sin cambiar inventario o gastos',()=>{
    let s=manual();s=add(s);expect(purchaseTotal(s.draft!)).toBe(25200);expect(quantity(s)).toBe(3000);expect(spending(s).totalCOP).toBe(286400);
    s=add(s,{quantityMilli:2000,priceCOP:4500});expect(purchaseTotal(s.draft!)).toBe(9000);
    s=reduceDomain(s,{type:'removeLine',id:'line-1'});expect(purchaseTotal(s.draft!)).toBe(0);expect(()=>confirm(s)).toThrow(/al menos un artículo/);
  });
  it('registra una entrada de 6 unidades sobre 3 y un solo desembolso',()=>{
    const initial=add(manual());const s=confirm(initial);expect(quantity(s)).toBe(9000);expect(s.draft).toBeNull();expect(s.purchases).toHaveLength(5);expect(spending(s).totalCOP).toBe(311600);
    expect(s.movements.filter(m=>m.purchaseId==='purchase-test')).toHaveLength(1);expect(initial.draft).not.toBeNull();expect(quantity(initial)).toBe(3000);
    const duplicate=reduceDomain(s,{type:'confirm',id:'purchase-test'});expect(duplicate).toBe(s);
  });
  it('no permite confirmar pendientes, metadatos incompletos o fechas inválidas',()=>{
    const pending=add(manual(),{reviewReason:'Revisa la cantidad'});expect(()=>confirm(pending)).toThrow(/Todavía hay/);
    const empty=reduceDomain(add(manual()),{type:'metadata',store:'',date:'2026-11-21'});expect(()=>confirm(empty)).toThrow(/establecimiento/);
    expect(()=>confirm(reduceDomain(add(manual()),{type:'metadata',store:'Tienda',date:'2026-02-30'}))).toThrow(/fecha válida/);
  });
  it('crea un producto solo al confirmar y revierte todo ante un error tardío',()=>{
    const input={name:'Avena',category:'Alimentos',control:'exact' as const,unit:'kg' as const,initialQuantityMilli:500,initialStatus:'empty' as const};
    let s=add(manual(),{productId:undefined,newProduct:input,name:'Avena',unit:'kg',quantityMilli:1000,priceCOP:8000});expect(s.products.some(p=>p.name==='Avena')).toBe(false);
    const final=confirm(s);expect(final.products.find(p=>p.name==='Avena')).toMatchObject({quantityMilli:1500});expect(final.movements.filter(m=>m.productName==='Avena')).toHaveLength(2);
    s=add(s,{id:'overflow',quantityMilli:Number.MAX_SAFE_INTEGER-991,priceCOP:0});const original=structuredClone(s);expect(()=>confirm(s)).toThrow();expect(s).toEqual(original);expect(s.products.some(p=>p.name==='Avena')).toBe(false);
  });
  it('conserva cantidad comprada de productos sencillos',()=>{
    const s=confirm(add(manual(),{productId:'coffee',name:'Café molido',quantityMilli:2000,stockStatus:'available'}));
    expect(s.products.find(p=>p.id==='coffee')).toMatchObject({control:'simple',status:'available'});expect(s.purchases[0].lines[0].quantityMilli).toBe(2000);
  });
  it('rechaza un desbordamiento del gasto acumulado sin publicar cambios parciales',()=>{
    const s=add(manual(),{quantityMilli:1000,priceMode:'total',priceCOP:Number.MAX_SAFE_INTEGER});
    const before=structuredClone(s);expect(()=>confirm(s)).toThrow();expect(s).toEqual(before);
  });
  it('reutiliza un producto nuevo repetido y rechaza definiciones contradictorias',()=>{
    const input={name:'Avena',category:'Alimentos',control:'exact' as const,unit:'kg' as const,initialQuantityMilli:500,initialStatus:'empty' as const};
    let s=add(manual(),{productId:undefined,newProduct:input,name:'Avena',unit:'kg',quantityMilli:1000});
    s=add(s,{id:'second',productId:undefined,newProduct:input,name:'Avena',unit:'kg',quantityMilli:2000});
    const final=confirm(s);expect(final.products.filter(p=>p.name==='Avena')).toHaveLength(1);expect(final.products.find(p=>p.name==='Avena')).toMatchObject({quantityMilli:3500});
    const conflict=add(s,{id:'second',productId:undefined,newProduct:{...input,initialQuantityMilli:1000},name:'Avena',unit:'kg',quantityMilli:2000});
    expect(()=>confirm(conflict)).toThrow(/datos distintos/);
  });
  it('permite gastos sin inventario y artículos gratuitos verificados',()=>{
    let s=add(manual(),{kind:'expense',productId:undefined,name:'Servicio',quantityMilli:1000,priceMode:'total',priceCOP:5000});s=add(s,{id:'free',priceCOP:0,quantityMilli:1000});
    const final=confirm(s);expect(final.products).toHaveLength(6);expect(quantity(final)).toBe(4000);expect(purchaseTotal(final.purchases[0])).toBe(5000);expect(final.movements.filter(m=>m.purchaseId==='purchase-test')).toHaveLength(1);
  });
  it('resuelve 6 pendientes de 50 sin obligar a editar las otras líneas',()=>{
    let s=createInitialState();s=reduceDomain(s,{type:'startDraft',draft:createDraft(s,'large','large')});expect(s.draft!.lines).toHaveLength(50);
    expect(()=>confirm(s)).toThrow();for(const item of s.draft!.lines.filter(l=>l.reviewReason))s=reduceDomain(s,{type:'resolveLine',id:item.id});
    const final=confirm(s);expect(final.products).toHaveLength(50);expect(purchaseTotal(final.purchases[0])).toBe(435600);expect(final.movements.filter(m=>m.purchaseId==='large')).toHaveLength(50);expect(spending(final).totalCOP).toBe(722000);
  });
  it('exige aceptar un cambio de total de recibo, sin inventar ajustes',()=>{
    let s=createInitialState();s=reduceDomain(s,{type:'startDraft',draft:createDraft(s,'small','small')});
    for(const item of s.draft!.lines.filter(l=>l.reviewReason))s=reduceDomain(s,{type:'resolveLine',id:item.id});
    s=reduceDomain(s,{type:'putLine',line:{...s.draft!.lines[0],priceCOP:8000}});expect(()=>confirm(s)).toThrow(/total cambió/);
    s=reduceDomain(s,{type:'acceptTotal'});expect(purchaseTotal(confirm(s).purchases[0])).toBe(61300);
  });
  it('descarta sin productos, movimientos o importes nuevos',()=>{
    const seed=createInitialState();const s=reduceDomain(add(manual()),{type:'discardDraft'});expect(s.products).toEqual(seed.products);expect(s.movements).toEqual(seed.movements);expect(spending(s).totalCOP).toBe(286400);
  });
});

describe('Finanzas derivadas y lista temporal',()=>{
  it('concilia una compra mixta con descuentos individuales, estados y consumo posterior',()=>{
    let s=add(manual(),{id:'rice-line',productId:'rice',name:'Arroz',unit:'kg',quantityMilli:500,priceCOP:7800,discountCOP:100});
    s=add(s,{id:'milk-line',quantityMilli:2000});
    s=add(s,{id:'detergent-line',productId:'detergent',name:'Detergente líquido',category:'Limpieza',unit:'L',quantityMilli:1000,priceCOP:14800,priceMode:'total',discountCOP:800});
    s=add(s,{id:'service-line',kind:'expense',productId:undefined,name:'Servicio',category:'Sin clasificar',quantityMilli:1000,priceCOP:5000,priceMode:'total'});
    s=confirm(s);const financial=spending(s);
    expect(purchaseTotal(s.purchases[0])).toBe(31200);expect(financial.totalCOP).toBe(317600);
    expect(financial.stores['Mi tienda']).toBe(31200);expect(financial.categories).toMatchObject({Alimentos:194600,Limpieza:78000,'Sin clasificar':5000});
    expect(Object.values(financial.categories).reduce((a,b)=>a+b,0)).toBe(financial.totalCOP);
    expect(Object.values(financial.stores).reduce((a,b)=>a+b,0)).toBe(financial.totalCOP);
    expect(quantity(s,'rice')).toBe(2500);expect(quantity(s)).toBe(5000);expect(s.products.find(p=>p.id==='detergent')).toMatchObject({control:'simple',status:'available'});
    expect(s.movements.filter(m=>m.purchaseId==='purchase-test')).toHaveLength(3);
    const consumed=reduceDomain(s,{type:'adjust',id:'after-mixed',productId:'rice',operation:'consume',quantityMilli:100});
    expect(spending(consumed)).toEqual(financial);expect(consumed.purchases).toEqual(s.purchases);
  });
  it('concilia fecha, categorías y establecimientos desde las mismas compras',()=>{
    const seed=createInitialState(),result=spending(seed,{month:'2026-11'});
    expect(result.totalCOP).toBe(286400);expect(result.categories).toMatchObject({Alimentos:182400,Limpieza:64000,'Cuidado personal':40000});
    expect(spending(seed,{store:'Mercado Central'}).totalCOP).toBe(169100);expect(spending(seed,{category:'Limpieza'}).totalCOP).toBe(64000);
    expect(spending(seed,{category:'Cuidado personal'}).stores).not.toHaveProperty('Tienda del barrio');
    expect(spending(seed,{from:'2026-11-18',to:'2026-11-18'}).totalCOP).toBe(54100);expect(Object.values(result.stores).reduce((a,b)=>a+b,0)).toBe(result.totalCOP);
  });
  it('preserva categorías y precios históricos al renombrar el catálogo',()=>{
    const seed=confirm(add(manual()));const changed=reduceDomain(seed,{type:'editProduct',id:'milk',operationId:'edit',name:'Leche de casa',category:'Sin clasificar'});
    expect(changed.purchases[0].lines[0].name).toBe('Leche entera');expect(changed.purchases[0].lines[0].category).toBe('Alimentos');expect(spending(changed)).toEqual(spending(seed));
  });
  it('agrupa nombres reservados sin contaminar objetos',()=>{const s=reduceDomain(add(manual()),{type:'metadata',store:'__proto__',date:'2026-11-21'});expect(spending(confirm(s)).stores['__proto__']).toBe(25200);});
  it('crea, cambia cantidades, marca, desmarca, elimina y finaliza sin efectos externos',()=>{
    let s=reduceDomain(createInitialState(),{type:'finishList'});s=reduceDomain(s,{type:'createList',id:'list',name:'Para hoy'});
    const before=structuredClone(s);s=reduceDomain(s,{type:'putListItem',item:{id:'x',name:'Leche',quantityMilli:2000,unit:'unidad',purchased:false}});
    s=reduceDomain(s,{type:'putListItem',item:{...s.list!.items[0],quantityMilli:6000}});expect(s.list!.items[0].quantityMilli).toBe(6000);
    s=reduceDomain(s,{type:'toggleListItem',id:'x'});expect(s.list!.items[0].purchased).toBe(true);s=reduceDomain(s,{type:'toggleListItem',id:'x'});expect(s.list!.items[0].purchased).toBe(false);
    s=reduceDomain(s,{type:'removeListItem',id:'x'});expect(s.list!.items).toHaveLength(0);s=reduceDomain(s,{type:'finishList'});expect(s.list).toBeNull();expect(s.products).toEqual(before.products);expect(s.movements).toEqual(before.movements);expect(s.purchases).toEqual(before.purchases);
  });
});
