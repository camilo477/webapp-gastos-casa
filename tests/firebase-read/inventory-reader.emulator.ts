import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore/lite';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { readFile } from 'node:fs/promises';
import { createFirestoreInventoryReader } from '../../src/adapters/firebase/inventory-reader';
import { EMULATOR_CONFIG, LOCAL_AUTH_UID } from '../../src/application/configuration';
import { owner } from '../firebase-auth/fixtures.mjs';

if(process.env.FIRESTORE_EMULATOR_HOST!==EMULATOR_CONFIG.firestoreHost||process.env.FIREBASE_AUTH_EMULATOR_HOST!==EMULATOR_CONFIG.authHost||process.env.GCLOUD_PROJECT!==EMULATOR_CONFIG.projectId)throw Error('EMULATOR_READ_TEST_ONLY');
const environment=await initializeTestEnvironment({projectId:EMULATOR_CONFIG.projectId,firestore:{host:'127.0.0.1',port:8386,rules:await readFile('security/inventory-read.firestore.rules','utf8')}});
const app=initializeApp({projectId:EMULATOR_CONFIG.projectId,apiKey:'demo-only-05c2'},'read-integration-05c2');
const auth=getAuth(app);connectAuthEmulator(auth,'http://'+EMULATOR_CONFIG.authHost,{disableWarnings:true});
const db=initializeFirestore(app,{});connectFirestoreEmulator(db,'127.0.0.1',8386);
const reader=createFirestoreInventoryReader(db,auth,LOCAL_AUTH_UID);
const request={cursor:null,category:'all',search:''};
beforeAll(async()=>{
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context=>{
    const store=context.firestore();
    await setDoc(doc(store,'_access/inventory'),{schemaVersion:1,enabled:true,ownerUid:LOCAL_AUTH_UID});
    for(let offset=0;offset<205;offset+=100){const batch=writeBatch(store);
      for(let i=offset;i<Math.min(offset+100,205);i++)batch.set(doc(store,`users/${LOCAL_AUTH_UID}/products/p${String(i).padStart(4,'0')}`),{name:`Producto fictício ${i}`,categoryId:i%2?'cleaning':'food',control:'exact',unit:'kg',quantityMilli:1250,version:0,updatedAt:Timestamp.now()});
      await batch.commit();
    }
  });
  await signInWithEmailAndPassword(auth,owner.email,owner.password);
});
afterAll(async()=>{await reader.dispose();await deleteApp(app);await environment.cleanup();});
describe('read-only adapter: actual local Auth/Firestore SDK, never real Firestore',()=>{
  it('paginates normalized products, applies categories/search and reads by stable ID',async()=>{
    const first=await reader.page(request);expect(first.items).toHaveLength(100);expect(first.nextCursor).toBe('p0099');
    const second=await reader.page({...request,cursor:first.nextCursor});expect(second.items).toHaveLength(100);
    const last=await reader.page({...request,cursor:second.nextCursor});expect(last.items).toHaveLength(5);expect(last.nextCursor).toBeNull();
    const category=await reader.page({...request,category:'Limpieza'});expect(category.items.every(p=>p.category==='Limpieza')).toBe(true);
    const search=await reader.page({...request,search:'FICTICIO 99'});expect(search.items.map(p=>p.id)).toEqual(['p0099']);
    expect(await reader.byId('p0000')).toMatchObject({version:0,quantityMilli:1250,unit:'kg'});expect(await reader.byId('missing')).toBeNull();
  });
  it('survives a new reader and logout/login without storing products locally',async()=>{
    await signOut(auth);await expect(reader.page(request)).rejects.toMatchObject({reason:'access'});
    await signInWithEmailAndPassword(auth,owner.email,owner.password);
    const freshApp=initializeApp({projectId:EMULATOR_CONFIG.projectId,apiKey:'demo-only-05c2'},'read-reopened-client-05c2');
    const freshAuth=getAuth(freshApp);connectAuthEmulator(freshAuth,'http://'+EMULATOR_CONFIG.authHost,{disableWarnings:true});
    const freshDb=initializeFirestore(freshApp,{});connectFirestoreEmulator(freshDb,'127.0.0.1',8386);
    const restored=createFirestoreInventoryReader(freshDb,freshAuth,LOCAL_AUTH_UID);
    try {
      await signInWithEmailAndPassword(freshAuth,owner.email,owner.password);
      expect((await restored.page(request)).items).toHaveLength(100);
      expect('mutate' in restored).toBe(false);
    } finally { await restored.dispose();await deleteApp(freshApp); }
  });
  it('detects incompatible documents and revoked server authorization',async()=>{
    await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),`users/${LOCAL_AUTH_UID}/products/p0000`),{schemaVersion:1,product:{name:'unapproved'},stock:{}}));
    await expect(reader.byId('p0000')).rejects.toMatchObject({reason:'contract'});
    await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'_access/inventory'),{schemaVersion:1,enabled:false,ownerUid:LOCAL_AUTH_UID}));
    await expect(reader.page(request)).rejects.toMatchObject({reason:'access'});
  });
});
