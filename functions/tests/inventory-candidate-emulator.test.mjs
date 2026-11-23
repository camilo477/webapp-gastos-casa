import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, getDocFromServer, getDocs, collection, doc, setDoc, terminate } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { fromDocument } from '@mi-casa/inventory-contract';
import { LOCAL, requireRuntime, requireLocal } from '../lib/config/local.js';
import { purchase } from './fixtures.mjs';
requireRuntime();requireLocal();
let environment,owner,other,anonymous;
async function client(uid){
 const app=initializeApp({projectId:LOCAL.projectId,apiKey:'demo-only-candidate'},crypto.randomUUID());
 const auth=getAuth(app);connectAuthEmulator(auth,'http://'+LOCAL.authHost,{disableWarnings:true});
 const db=getFirestore(app);connectFirestoreEmulator(db,'127.0.0.1',8386);
 const fn=getFunctions(app,LOCAL.region);connectFunctionsEmulator(fn,'127.0.0.1',5205);
 if(uid){const part=v=>Buffer.from(JSON.stringify(v)).toString('base64url');await signInWithCustomToken(auth,`${part({alg:'none',typ:'JWT'})}.${part({uid,aud:'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit'})}.`);}
 return{db,call:async(input,name='mutateInventoryCandidate')=>(await httpsCallable(fn,name)(input)).data,close:async()=>{await terminate(db);await deleteApp(app);}};
}
const opening=(op='open',productId='p',patch={})=>({schemaVersion:2,kind:'create',operationId:op,productId,definition:{name:'Arroz ficticio',presentation:'Bolsa 500 g',categoryId:'food',control:'exact',baseUnit:'kg'},opening:{quantity:{unit:'g',amountMilli:250000}},duplicateDecision:'reviewed-new',...patch});
const change=(op,expectedVersion=1,action='add',quantity={unit:'g',amountMilli:750000})=>({schemaVersion:2,kind:'adjust',operationId:op,productId:'p',expectedVersion,action,change:{quantity}});
const ref=(kind,id)=>doc(owner.db,`users/${LOCAL.uid}/${kind}/${id}`);
const read=async(kind,id)=>(await getDocFromServer(ref(kind,id))).data();
before(async()=>{environment=await initializeTestEnvironment({projectId:LOCAL.projectId,firestore:{host:'127.0.0.1',port:8386,rules:await readFile(new URL('../firestore.rules',import.meta.url),'utf8')}});[owner,other,anonymous]=await Promise.all([client(LOCAL.uid),client('candidate-other-fixture'),client(null)]);});
beforeEach(async()=>environment.clearFirestore());
after(async()=>{await Promise.all([owner?.close(),other?.close(),anonymous?.close()]);await environment?.cleanup();});
test('candidate callable commits one normalized opening with real Timestamp and idempotent concurrent retries',async()=>{
 const results=await Promise.all([owner.call(opening()),owner.call(opening())]);assert.deepEqual(results.map(r=>r.status).sort(),['already-confirmed','confirmed']);
 const p=fromDocument('p',await read('products','p'),t=>t.toMillis());assert.equal(p.stock.quantityMilli,250);assert.equal(p.version,1);assert.equal(p.schemaVersion,2);assert.equal(p.presentation,'Bolsa 500 g');
 const journal=await read('operations','open');assert.equal(journal.movements[0].before,null);assert.equal('totalPaidCOP'in journal,false);
 await assert.rejects(owner.call(opening('open','p',{definition:{...opening().definition,presentation:'Otra'}})),{code:'functions/already-exists'});
});
test('fractional quantities and explicit package content apply without inferred amounts or negative stock',async()=>{
 await owner.call(opening());await owner.call(change('add'));
 assert.equal((await read('products','p')).stock.quantityMilli,1000);
 await owner.call(change('package',2,'set',{unit:'package',count:3,content:{unit:'g',amountMilli:500000}}));
 assert.equal((await read('products','p')).stock.quantityMilli,1500);
 for(const [id,q] of [['subgram',{unit:'g',amountMilli:500}],['wrong-unit',{unit:'L',amountMilli:1000}],['unknown-content',{unit:'package',count:2}]])await assert.rejects(owner.call(change(id,3,'add',q)),{code:'functions/invalid-argument'});
 await assert.rejects(owner.call(change('negative',3,'consume',{unit:'kg',amountMilli:2000})),{code:'functions/invalid-argument'});
 assert.equal((await read('products','p')).stock.quantityMilli,1500);assert.equal((await read('products','p')).version,3);
});
test('two concurrent changes produce a reviewed conflict, not a lost increment',async()=>{
 await owner.call(opening());const results=await Promise.allSettled([owner.call(change('a')),owner.call(change('b'))]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'functions/failed-precondition');
 await owner.call(change('reviewed',2));assert.equal((await read('products','p')).stock.quantityMilli,1750);
});
test('concurrent ID reservations conflict while similar names under different IDs remain independent',async()=>{
 const same=await Promise.allSettled([owner.call(opening('first')),owner.call(opening('second'))]);
 assert.equal(same.filter(r=>r.status==='fulfilled').length,1);assert.equal(same.find(r=>r.status==='rejected').reason.code,'functions/failed-precondition');
 assert.equal((await read('products','p')).version,1);assert.equal((await getDocs(collection(owner.db,`users/${LOCAL.uid}/operations`))).size,1);
 await environment.clearFirestore();await Promise.all([owner.call(opening('a','a')),owner.call(opening('b','b'))]);
 assert.equal((await getDocs(collection(owner.db,`users/${LOCAL.uid}/products`))).size,2);assert.equal((await read('products','a')).stock.quantityMilli,250);assert.equal((await read('products','b')).stock.quantityMilli,250);
});
test('presentation/category edits do not change stock or rewrite earlier journal snapshots',async()=>{
 await owner.call(opening());await owner.call({schemaVersion:2,kind:'edit',operationId:'edit',productId:'p',expectedVersion:1,name:'Arroz cambiado',presentation:'Bolsa 1 kg',categoryId:'other'});
 const p=await read('products','p');assert.equal(p.categoryId,'other');assert.equal(p.stock.quantityMilli,250);assert.equal(p.id,'p');assert.equal(p.baseUnit,'kg');
 assert.equal((await read('operations','open')).command.definition.categoryId,'food');assert.deepEqual((await read('operations','edit')).movements,[]);
 const edit={schemaVersion:2,kind:'edit',operationId:'bad',productId:'p',expectedVersion:2,name:'Ficticio',presentation:null,categoryId:'unclassified'};
 await assert.rejects(owner.call({...edit,baseUnit:'L'}),{code:'functions/invalid-argument'});
 await owner.call(edit);assert.equal((await read('products','p')).categoryId,'unclassified');
});
test('simple control contains only reviewed status; duplicate names/presentations remain independent IDs',async()=>{
 const base=opening();await owner.call(base);
 await owner.call(opening('second','other-id',{definition:{...base.definition,presentation:'Bolsa 1 kg'}}));
 const simple=opening('simple','simple',{definition:{...base.definition,control:'simple',baseUnit:'unidad'},opening:{status:'low'}});await owner.call(simple);
 const op=await read('operations','simple');assert.equal(op.movements[0].before,null);assert.deepEqual((await read('products','simple')).stock,{status:'low'});
 await owner.call({schemaVersion:2,kind:'adjust',operationId:'empty',productId:'simple',expectedVersion:1,action:'set',change:{status:'empty'}});
 assert.deepEqual((await read('products','simple')).stock,{status:'empty'});
 assert.equal((await getDocs(collection(owner.db,`users/${LOCAL.uid}/products`))).size,3);
});
test('legacy documents and 04D wrappers are rejected without writes; old financial executor cannot alter a candidate',async()=>{
 const legacy={name:'Legacy ficticio',categoryId:'cleaning',control:'exact',unit:'kg',quantityMilli:1500,version:0,updatedAt:new Date()};
 await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),`users/${LOCAL.uid}/products/p`),legacy));
 await assert.rejects(owner.call(change('legacy')),{code:'functions/failed-precondition'});assert.equal((await read('products','p')).schemaVersion,undefined);assert.equal(await read('operations','legacy'),undefined);
 await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),`users/${LOCAL.uid}/products/p`),{schemaVersion:1,product:{id:'p'},stock:{quantityMilli:1500}}));
 await assert.rejects(owner.call(change('wrapper')),{code:'functions/failed-precondition'});assert.equal((await read('products','p')).schemaVersion,1);assert.equal(await read('operations','wrapper'),undefined);
 await environment.clearFirestore();await owner.call(opening('open','p0'));
 await assert.rejects(owner.call(purchase('old-financial'),'confirmPurchaseExperimental'),{code:'functions/invalid-argument'});
 assert.equal((await read('products','p0')).stock.quantityMilli,250);assert.equal(await read('operations','old-financial'),undefined);
});
test('candidate authentication, strict fields and closed client writes remain server-enforced',async()=>{
 for(const actor of [other,anonymous])await assert.rejects(actor.call(opening()),e=>['functions/unauthenticated','functions/permission-denied'].includes(e.code));
 await assert.rejects(owner.call({...opening(),uid:LOCAL.uid}),{code:'functions/invalid-argument'});
 await owner.call(opening());for(const actor of [owner,other,anonymous])await assertFails(setDoc(doc(actor.db,`users/${LOCAL.uid}/products/p`),{stock:{quantityMilli:9999}}));
 assert.equal((await read('products','p')).stock.quantityMilli,250);
});
test('a malformed stored candidate requires review and cannot be silently repaired by an adjustment',async()=>{
 await owner.call(opening());
 await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),`users/${LOCAL.uid}/products/p`),{stock:{quantityMilli:-1}},{merge:true}));
 await assert.rejects(owner.call(change('malformed')),e=>e.code==='functions/failed-precondition'&&/^INCOMPATIBLE_DOCUMENT(?: \[400\])?$/.test(e.message));
 assert.equal((await read('products','p')).stock.quantityMilli,-1);assert.equal(await read('operations','malformed'),undefined);
});
