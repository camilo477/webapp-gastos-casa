import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyCommand, parseCommand, validateProduct, fromDocument, toDocument, toBase, suggestions, previewLegacyMigration, CATEGORIES, stable } from '@mi-casa/inventory-contract';
import { createCandidateExecutor } from '../lib/application/inventory-candidate.js';

const open=(patch={})=>({schemaVersion:2,operationId:'opening',productId:'rice',kind:'create',definition:{name:'Arroz ficticio',presentation:'Bolsa 500 g',categoryId:'food',control:'exact',baseUnit:'kg'},opening:{quantity:{unit:'g',amountMilli:250000}},duplicateDecision:'reviewed-new',...patch});
const product=()=>applyCommand(open(),null,1234);
const adjust=(patch={})=>({schemaVersion:2,kind:'adjust',operationId:'adjustment',productId:'rice',expectedVersion:1,action:'add',change:{quantity:{unit:'g',amountMilli:750000}},...patch});
function lab(){
 const products=new Map(),operations=new Map();const events=[];
 const repo={transaction:async work=>{const writes=[];const result=await work({findOperation:async id=>{events.push('read-op');return operations.get(id);},readProducts:async ids=>{events.push('read-products');return new Map(ids.map(id=>[id,products.get(id)]));},now:()=>({toMillis:()=>5678}),writeProduct:(id,p)=>writes.push(()=>products.set(id,p)),createOperation:op=>writes.push(()=>operations.set(op.operationId,op))});for(const write of writes)write();return result;}};
 return{products,operations,events,execute:createCandidateExecutor(()=>repo,'candidate-fixture-owner')};
}
const auth={uid:'candidate-fixture-owner'};
test('shared candidate has seven explicit stable categories and one versioned normalized document',()=>{
 assert.equal(Object.keys(CATEGORIES).length,7);assert.notEqual(CATEGORIES.other,CATEGORIES.unclassified);
 const p=product();assert.deepEqual(p,{schemaVersion:2,id:'rice',name:'Arroz ficticio',presentation:'Bolsa 500 g',categoryId:'food',control:'exact',baseUnit:'kg',stock:{quantityMilli:250},version:1,updatedAt:1234});
 const doc=toDocument(p,millis=>({toMillis:()=>millis}));assert.deepEqual(fromDocument('rice',doc,t=>t.toMillis()),p);
 assert.throws(()=>fromDocument('other',doc,t=>t.toMillis()),/IDENTITY_MISMATCH/);
});
test('compatible conversions preserve fractional kg/L and explicit containers, not names',()=>{
 for(const [quantity,base,expected] of [[{unit:'kg',amountMilli:1250},'kg',1250],[{unit:'g',amountMilli:250000},'kg',250],[{unit:'L',amountMilli:1500},'L',1500],[{unit:'ml',amountMilli:500000},'L',500],[{unit:'unidad',amountMilli:2000},'unidad',2000],[{unit:'package',count:3,content:{unit:'ml',amountMilli:500000}},'L',1500]])assert.equal(toBase(quantity,base),expected);
 for(const [quantity,base] of [[{unit:'g',amountMilli:500},'kg'],[{unit:'unidad',amountMilli:1500},'unidad'],[{unit:'kg',amountMilli:1000},'L'],[{unit:'package',count:1.5,content:{unit:'g',amountMilli:500000}},'kg'],[{unit:'package',count:2},'kg'],[{unit:'package',count:2,content:{unit:'g',amountMilli:1000}},'L']])assert.throws(()=>toBase(quantity,base));
 assert.equal(product().stock.quantityMilli,250); // Presentation says 500g; the entered opening is 250g.
});
test('quantities/versions/timestamps and schema validation reject malformed or incompatible records',()=>{
 for(const patch of [{schemaVersion:1},{id:'../rice'},{categoryId:'cleaning'},{categoryId:['food']},{presentation:''},{presentation:'x'.repeat(241)},{stock:{quantityMilli:-1}},{stock:{quantityMilli:1.5}},{stock:{quantityMilli:1e9+1}},{stock:{quantityMilli:250,status:'low'}},{version:0},{updatedAt:NaN},{unit:'g'},{metadataVersion:1}])assert.throws(()=>validateProduct({...product(),...patch}));
 assert.throws(()=>fromDocument('rice',{name:'legacy'},()=>0),/INCOMPATIBLE_SCHEMA/);
 assert.throws(()=>fromDocument('rice',{schemaVersion:1,product:{},stock:{}},()=>0),/INCOMPATIBLE_SCHEMA/);
 assert.throws(()=>fromDocument('rice',{...product(),updatedAt:null},t=>t.toMillis()),/INVALID_TIMESTAMP/);
});
test('simple products store only observed state and preserve it while future purchase quantities are converted',()=>{
 const p=applyCommand(open({definition:{...open().definition,control:'simple',baseUnit:'unidad'},opening:{status:'low'}}),null,1234);
 assert.deepEqual(p.stock,{status:'low'});assert.equal(toBase({unit:'unidad',amountMilli:3000},p.baseUnit),3000);assert.deepEqual(p.stock,{status:'low'});
 const changed=applyCommand(adjust({action:'set',change:{status:'empty'}}),p,2345);assert.deepEqual(changed.stock,{status:'empty'});
 assert.throws(()=>applyCommand(adjust({change:{quantity:{unit:'unidad',amountMilli:1000}}}),p,2345),/INCOMPATIBLE_CONTROL/);
 assert.throws(()=>validateProduct({...p,stock:{status:'low',quantityMilli:1000}}));
});
test('metadata/category edits preserve identity, base/control, stock and original product snapshot',()=>{
 const p=product(),changed=applyCommand({schemaVersion:2,kind:'edit',operationId:'e',productId:'rice',expectedVersion:1,name:'Arroz editado',presentation:null,categoryId:'unclassified'},p,2345);
 assert.equal(changed.id,p.id);assert.equal(changed.baseUnit,p.baseUnit);assert.deepEqual(changed.stock,p.stock);assert.equal(changed.version,2);assert.equal(p.categoryId,'food');
 assert.throws(()=>parseCommand({schemaVersion:2,kind:'edit',operationId:'e',productId:'rice',expectedVersion:1,name:'Otro',presentation:null,categoryId:'other',baseUnit:'L'}));
});
test('duplicates consider presentation/unit/control, preserve IDs and never merge products',()=>{
 const a=product(),b={...product(),id:'second',presentation:'Bolsa 1 kg'},c={...product(),id:'third',control:'simple',stock:{status:'low'}};
 const results=suggestions(open().definition,[a,b,c]);assert.deepEqual(results.map(v=>v.reason),['same','presentation','incompatible']);
 assert.deepEqual(results.map(v=>v.product.id),['rice','second','third']);assert.equal(a.stock.quantityMilli,250);
 assert.equal(suggestions({...open().definition,presentation:null},[{...a,presentation:null}])[0].reason,'possible');
 assert.equal(suggestions({...open().definition,name:'ARROZ FICTÍCIO'},[a])[0].reason,'same');
});
test('migration is a read-only preview requiring an explicit per-product category review',()=>{
 const legacy={name:'Ficticio',categoryId:'cleaning',control:'exact',unit:'kg',quantityMilli:1500,version:0,updatedAt:{toMillis:()=>1234}};
 const before={...legacy};const result=previewLegacyMigration('stable-id',legacy,{confirmed:true,categoryId:'household-care',presentation:null},t=>t.toMillis());
 assert.equal(result.candidate.id,'stable-id');assert.equal(result.candidate.version,1);assert.equal(result.candidate.stock.quantityMilli,1500);assert.deepEqual(legacy,before);
 assert.throws(()=>previewLegacyMigration('stable-id',legacy,{confirmed:false,categoryId:'household-care',presentation:null},t=>t.toMillis()),/REVIEW_REQUIRED/);
 assert.throws(()=>previewLegacyMigration('stable-id',legacy,{confirmed:true,presentation:null},t=>t.toMillis()));
 assert.throws(()=>previewLegacyMigration('stable-id',{...legacy,quantityMilli:-1},{confirmed:true,categoryId:'household-care',presentation:null},t=>t.toMillis()));
});
test('trusted executor authenticates before repository and never trusts body UID',async()=>{
 const execute=createCandidateExecutor(()=>{throw Error('REPOSITORY_REACHED');},auth.uid);
 await assert.rejects(execute(null,{}),{code:'unauthenticated'});await assert.rejects(execute({uid:'other'},{}),{code:'permission-denied'});
 const l=lab();await assert.rejects(l.execute(auth,{...open(),uid:auth.uid}));assert.equal(l.operations.size,0);
});
test('opening is idempotent and nonfinancial; lost-response retries do not repeat later stock',async()=>{
 const l=lab();await l.execute(auth,open());assert.equal((await l.execute(auth,open())).status,'already-confirmed');
 await l.execute(auth,adjust());await l.execute(auth,open());
 assert.equal(l.products.get('rice').stock.quantityMilli,1000);assert.equal(l.products.get('rice').version,2);assert.equal(l.operations.size,2);
 assert.equal('totalPaidCOP'in l.operations.get('opening'),false);assert.equal(l.operations.get('opening').movements.length,1);assert.equal(l.operations.get('opening').movements[0].before,null);
 await assert.rejects(l.execute(auth,open({definition:{...open().definition,name:'Changed'}})),/IDEMPOTENCY_CONFLICT/);
 assert.deepEqual(l.events.slice(0,2),['read-op','read-products']);
});
test('stale or negative adjustments have no partial effects and old formats are never rewritten',async()=>{
 const l=lab();await l.execute(auth,open());await l.execute(auth,adjust());
 await assert.rejects(l.execute(auth,adjust({operationId:'stale'})),/VERSION_CONFLICT/);
 await assert.rejects(l.execute(auth,adjust({operationId:'negative',expectedVersion:2,action:'consume',change:{quantity:{unit:'kg',amountMilli:2000}}})),/INVALID_QUANTITY/);
 assert.equal(l.products.get('rice').stock.quantityMilli,1000);assert.equal(l.operations.size,2);
 const legacy={name:'Legacy',categoryId:'food',control:'exact',unit:'kg',quantityMilli:500,version:0,updatedAt:{toMillis:()=>1}};l.products.set('rice',legacy);
 await assert.rejects(l.execute(auth,adjust({operationId:'legacy'})),/INCOMPATIBLE_SCHEMA/);assert.equal(l.products.get('rice'),legacy);assert.equal(l.operations.size,2);
});
test('canonical hashing is independent of property order and includes presentation, units and review choice',()=>{
 const a=open(),b=Object.fromEntries(Object.entries(a).reverse());assert.equal(stable(a),stable(b));
 assert.notEqual(stable(a),stable({...a,definition:{...a.definition,presentation:'Another'}}));
 assert.throws(()=>parseCommand({...a,duplicateDecision:'auto-merged'}));
});
