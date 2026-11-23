import { before, after, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, collectionGroup, doc, getDoc, getDocs, setDoc, deleteDoc, query, limit, where, orderBy, documentId } from 'firebase/firestore';
import { LOCAL, requireLocal, requireRuntime } from '../lib/config/local.js';

requireRuntime(); requireLocal();
const owner='read-owner-fixture', other='read-other-fixture';
let environment;
before(async()=>{
  environment=await initializeTestEnvironment({projectId:LOCAL.projectId,firestore:{host:'127.0.0.1',port:8386,rules:await readFile(new URL('../../security/inventory-read.firestore.rules',import.meta.url),'utf8')}});
});
beforeEach(async()=>{
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,'_access/inventory'),{schemaVersion:1,enabled:true,ownerUid:owner});
    for(const uid of [owner,other])await setDoc(doc(db,`users/${uid}/products/p`),{name:'Ficticio',categoryId:'food'});
  });
});
after(async()=>{await environment?.cleanup();});
const dbFor=(uid)=>uid?environment.authenticatedContext(uid).firestore():environment.unauthenticatedContext().firestore();
const products=(db,uid=owner)=>collection(db,`users/${uid}/products`);
test('future read rules authorize only owner products and bounded category/name-cursor-compatible queries',async()=>{
  const db=dbFor(owner);
  await assertSucceeds(getDoc(doc(db,`users/${owner}/products/p`)));
  const result=await assertSucceeds(getDocs(query(products(db),where('categoryId','==','food'),orderBy(documentId()),limit(100))));
  assert.equal(result.size,1);
  await assertFails(getDocs(products(db)));await assertFails(getDocs(query(products(db),limit(101))));
  await assertFails(getDocs(query(collectionGroup(db,'products'),limit(100))));
});
for(const uid of [null,other])test(`future read rules reject ${uid??'anonymous'} even on its own path or with a supplied email/claim`,async()=>{
  const db=uid?environment.authenticatedContext(uid,{email:'owner@example.test',ownerUid:owner,admin:true}).firestore():dbFor(null);
  for(const target of [owner,other]){
    await assertFails(getDoc(doc(db,`users/${target}/products/p`)));
    await assertFails(getDocs(query(products(db,target),limit(100))));
  }
});
test('owner cannot read ACL, financial history, unknown/nested routes or any other account',async()=>{
  const db=dbFor(owner);
  for(const path of ['_access/inventory',`users/${owner}/operations/p`,`users/${owner}/products/p/private/nested`,`users/${other}/products/p`,'unknown/p'])await assertFails(getDoc(doc(db,path)));
});
for(const uid of [owner,other,null])test(`all direct create/update/delete and ACL tampering are denied: ${uid??'anonymous'}`,async()=>{
  const db=dbFor(uid);
  for(const path of [`users/${owner}/products/p`,`users/${owner}/products/new`,`users/${other}/products/p`,'_access/inventory',`users/${owner}/operations/op`,'unknown/p']){
    await assertFails(setDoc(doc(db,path),{ownerUid:uid??owner,enabled:true}));
    await assertFails(deleteDoc(doc(db,path)));
  }
});
for(const acl of [null,{}, {schemaVersion:1,enabled:false,ownerUid:owner},{schemaVersion:2,enabled:true,ownerUid:owner},{schemaVersion:1,enabled:true,ownerUid:[owner]},{schemaVersion:1,enabled:'true',ownerUid:owner},{schemaVersion:1,enabled:true,ownerUid:other},{schemaVersion:1,enabled:true,ownerUid:owner,extra:'unsupported'}])test('missing or malformed administrative authorization fails closed: '+JSON.stringify(acl),async()=>{
  await environment.withSecurityRulesDisabled(async context=>{
    const ref=doc(context.firestore(),'_access/inventory');
    if(acl===null)await deleteDoc(ref);else await setDoc(ref,acl);
  });
  await assertFails(getDoc(doc(dbFor(owner),`users/${owner}/products/p`)));
});
test('administrative revocation takes effect on the next server read',async()=>{
  const db=dbFor(owner);await assertSucceeds(getDoc(doc(db,`users/${owner}/products/p`)));
  await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'_access/inventory'),{schemaVersion:1,enabled:false,ownerUid:owner}));
  // Force a fresh bounded query rather than relying on any previous SDK snapshot.
  await assertFails(getDocs(query(products(db),limit(100))));
});
