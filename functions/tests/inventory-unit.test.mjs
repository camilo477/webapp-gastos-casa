import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInventoryExecutor, parseInventoryCommand } from '../lib/application/inventory.js';
import { time } from './fixtures.mjs';

const create = (patch = {}) => ({ schemaVersion: 1, operationId: 'create', productId: 'p', kind: 'inventoryCreate',
  product: { name: 'Arroz ficticio', categoryId: 'food', control: 'exact', unit: 'unidad', quantityMilli: 2000 }, ...patch });
function laboratory() {
  const products = new Map(), operations = new Map();
  const repo = { transaction: async work => {
    const writes = [];
    const result = await work({ findOperation: async id => operations.get(id), readProducts: async ids => new Map(ids.map(id=>[id,products.get(id)])), now:()=>time,
      writeProduct: (id,p)=>writes.push(()=>products.set(id,p)), createOperation: op=>writes.push(()=>operations.set(op.operationId,op)) });
    writes.forEach(write=>write()); return result;
  } };
  return { products, operations, execute: createInventoryExecutor(()=>repo,'fixture-owner') };
}
const auth = { uid:'fixture-owner' };
test('inventory authorizes before touching the repository, and rejects UID in the command', async()=>{
  const execute = createInventoryExecutor(()=>{throw Error('REPOSITORY_REACHED');},auth.uid);
  await assert.rejects(execute(null,{}),{code:'unauthenticated'});
  await assert.rejects(execute({uid:'other'},{}),{code:'permission-denied'});
  assert.throws(()=>parseInventoryCommand({...create(),uid:auth.uid}));
});
test('opening stock is nonfinancial, versioned and idempotent; changed intent cannot reuse an ID', async()=>{
  const lab=laboratory(); await lab.execute(auth,create());
  assert.equal((await lab.execute(auth,create())).status,'already-confirmed');
  assert.equal(lab.products.get('p').quantityMilli,2000); assert.equal(lab.products.get('p').version,0);
  assert.equal(lab.operations.size,1); assert.equal('totalPaidCOP' in lab.operations.get('create'),false);
  await assert.rejects(lab.execute(auth,create({product:{...create().product,name:'Otro ficticio'}})),/IDEMPOTENCY_CONFLICT/);
  await assert.rejects(lab.execute(auth,create({operationId:'another'})),/PRODUCT_EXISTS/);
});
test('inventory edits preserve stock, control and unit; adjustments validate final stock and versions',async()=>{
  const lab=laboratory(); await lab.execute(auth,create());
  const adjust={schemaVersion:1,operationId:'add',productId:'p',kind:'inventoryAdjust',expectedVersion:0,action:'add',value:1000};
  await lab.execute(auth,adjust); assert.equal(lab.products.get('p').quantityMilli,3000);
  await assert.rejects(lab.execute(auth,{...adjust,operationId:'stale'}),/VERSION_CONFLICT/);
  await assert.rejects(lab.execute(auth,{...adjust,expectedVersion:1,operationId:'negative',action:'consume',value:4000}));
  assert.equal(lab.products.get('p').quantityMilli,3000); assert.equal(lab.operations.size,2);
  await lab.execute(auth,{schemaVersion:1,kind:'inventoryEdit',operationId:'edit',productId:'p',expectedVersion:1,name:'Arroz de prueba',categoryId:'cleaning'});
  assert.equal(lab.products.get('p').quantityMilli,3000); assert.equal(lab.products.get('p').unit,'unidad');
  assert.equal(lab.products.get('p').version,2); assert.deepEqual(lab.operations.get('edit').movements,[]);
});
test('strict schemas reject arbitrary controls, invalid quantities, metadata changes and non-string enums',()=>{
  for(const p of [{quantityMilli:-1},{quantityMilli:1.5},{quantityMilli:1500},{quantityMilli:1e9+1},{categoryId:'unknown'},{unit:'g'},{control:'mixed'},{version:1}])
    assert.throws(()=>parseInventoryCommand(create({product:{...create().product,...p}})));
  for(const patch of [{kind:['inventoryCreate']},{productId:'../p'},{schemaVersion:2}]) assert.throws(()=>parseInventoryCommand(create(patch)));
  const edit={schemaVersion:1,kind:'inventoryEdit',operationId:'e',productId:'p',expectedVersion:0,name:'Ficticio',categoryId:'food'};
  for(const patch of [{unit:'kg'},{control:'simple'},{categoryId:['food']},{expectedVersion:-1},{name:''}])assert.throws(()=>parseInventoryCommand({...edit,...patch}));
});
test('simple inventory permits only explicit states and no numeric conversions',async()=>{
  const lab=laboratory(); await lab.execute(auth,create({product:{name:'Jabón ficticio',categoryId:'cleaning',control:'simple',unit:'unidad',status:'available'}}));
  const change={schemaVersion:1,kind:'inventoryAdjust',operationId:'status',productId:'p',expectedVersion:0,action:'set',value:'low'};
  await lab.execute(auth,change); assert.equal(lab.products.get('p').status,'low');
  await assert.rejects(lab.execute(auth,{...change,operationId:'bad',expectedVersion:1,value:1000}),/INCOMPATIBLE_CONTROL/);
});
