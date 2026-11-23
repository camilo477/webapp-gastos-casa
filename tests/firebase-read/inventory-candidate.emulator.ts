import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { initializeApp,deleteApp } from 'firebase/app';
import { getAuth,connectAuthEmulator,signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore,connectFirestoreEmulator } from 'firebase/firestore/lite';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc,setDoc,Timestamp } from 'firebase/firestore';
import { applyCommand,toDocument } from '@mi-casa/inventory-contract';
import { createCandidateReader } from '../../src/adapters/firebase/inventory-candidate-reader';
import { EMULATOR_CONFIG,LOCAL_AUTH_UID } from '../../src/application/configuration';
import { owner } from '../firebase-auth/fixtures.mjs';
if(process.env.FIRESTORE_EMULATOR_HOST!==EMULATOR_CONFIG.firestoreHost||process.env.FIREBASE_AUTH_EMULATOR_HOST!==EMULATOR_CONFIG.authHost||process.env.GCLOUD_PROJECT!==EMULATOR_CONFIG.projectId)throw Error('EMULATOR_ONLY');
const environment=await initializeTestEnvironment({projectId:EMULATOR_CONFIG.projectId,firestore:{host:'127.0.0.1',port:8386,rules:await readFile('security/inventory-read.firestore.rules','utf8')}});
const app=initializeApp({projectId:EMULATOR_CONFIG.projectId,apiKey:'demo-only-candidate-reader'},'candidate-reader-test');
const auth=getAuth(app);connectAuthEmulator(auth,'http://'+EMULATOR_CONFIG.authHost,{disableWarnings:true});const db=initializeFirestore(app,{});connectFirestoreEmulator(db,'127.0.0.1',8386);const reader=createCandidateReader(db,auth,LOCAL_AUTH_UID);
beforeAll(async()=>{
 await environment.clearFirestore();await environment.withSecurityRulesDisabled(async context=>{
  const store=context.firestore();await setDoc(doc(store,'_access/inventory'),{schemaVersion:1,enabled:true,ownerUid:LOCAL_AUTH_UID});
  const p=applyCommand({schemaVersion:2,kind:'create',operationId:'o',productId:'p',definition:{name:'Jabón ficticio',presentation:'Barra',categoryId:'personal-hygiene',control:'simple',baseUnit:'unidad'},opening:{status:'low'},duplicateDecision:'reviewed-new'},null,Date.now());await setDoc(doc(store,`users/${LOCAL_AUTH_UID}/products/p`),toDocument(p,n=>Timestamp.fromMillis(n)));
 });await signInWithEmailAndPassword(auth,owner.email,owner.password);
});
afterAll(async()=>{await reader.dispose();await deleteApp(app);await environment.cleanup();});
describe('candidate SDK reader against the future read-only rules locally',()=>{
 it('reads candidate data and suggestions under the authorized UID without numeric simple stock',async()=>{
  const result=await reader.page({cursor:null,category:'Higiene personal',search:'JABON'});expect(result.items[0]).toMatchObject({presentation:'Barra',category:'Higiene personal',status:'low',version:1});expect('quantityMilli'in result.items[0]).toBe(false);
  expect((await reader.suggest({name:'Jabón ficticio',presentation:'Barra',categoryId:'personal-hygiene',control:'simple',baseUnit:'unidad'})).items[0].reason).toBe('same');expect('mutate'in reader).toBe(false);
 });
 it('rejects legacy documents without migration and honors administrative revocation',async()=>{
  await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),`users/${LOCAL_AUTH_UID}/products/old`),{name:'Legacy ficticio',control:'exact',categoryId:'cleaning',unit:'kg',quantityMilli:1000,version:0,updatedAt:Timestamp.now()}));
  await expect(reader.byId('old')).rejects.toMatchObject({reason:'contract'});
  await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'_access/inventory'),{schemaVersion:1,enabled:false,ownerUid:LOCAL_AUTH_UID}));
  await expect(reader.byId('p')).rejects.toMatchObject({reason:'access'});
 });
});
