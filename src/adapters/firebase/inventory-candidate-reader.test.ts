import { beforeEach,describe,expect,it,vi } from 'vitest';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore/lite';
import { applyCommand,toDocument,CATEGORIES } from '@mi-casa/inventory-contract';
import { createCandidateReader } from './inventory-candidate-reader';
const sdk=vi.hoisted(()=>({getDocs:vi.fn(),getDoc:vi.fn(),terminate:vi.fn(),query:vi.fn((...v:unknown[])=>v),collection:vi.fn((...v:unknown[])=>v),doc:vi.fn((...v:unknown[])=>v),where:vi.fn((...v:unknown[])=>v),orderBy:vi.fn((...v:unknown[])=>v),limit:vi.fn((v:number)=>v),startAfter:vi.fn((v:string)=>v)}));
vi.mock('firebase/firestore/lite',()=>({...sdk,documentId:()=> '__name__'}));
const app={options:{projectId:'demo-candidate-reader'}},db={app} as Firestore;let auth:Auth;
const request={cursor:null,category:'all',search:''};
function item(id='p'){
 const p=applyCommand({schemaVersion:2,kind:'create',operationId:'o',productId:id,definition:{name:'Jabón ficticio',presentation:'Barra 100 g',categoryId:'personal-hygiene',control:'simple',baseUnit:'unidad'},opening:{status:'low'},duplicateDecision:'reviewed-new'},null,1);
 return{id,data:()=>toDocument(p,n=>({toMillis:()=>n}))};
}
beforeEach(()=>{vi.clearAllMocks();auth={app,currentUser:{uid:'candidate-reader-owner'}} as Auth;sdk.getDocs.mockResolvedValue({docs:[item()],size:1});sdk.terminate.mockResolvedValue(undefined);});
const reader=()=>createCandidateReader(db,auth,'candidate-reader-owner');
describe('one candidate reader for local and future blocked entry',()=>{
 it('projects new categories/presentation and searches them, without approximate quantities or history',async()=>{
  const result=await reader().page({...request,category:'Higiene personal',search:'BARRA 100'});
  expect(result.items[0]).toMatchObject({category:'Higiene personal',presentation:'Barra 100 g',status:'low'});expect('quantityMilli'in result.items[0]).toBe(false);
  expect(sdk.where).toHaveBeenCalledWith('categoryId','==','personal-hygiene');expect(sdk.collection).toHaveBeenCalledWith(db,'users','candidate-reader-owner','products');expect(sdk.limit).toHaveBeenCalledWith(100);
 });
 it('rejects old schemas and never turns them into candidate records',async()=>{
  sdk.getDocs.mockResolvedValue({docs:[{id:'old',data:()=>({name:'Legacy',categoryId:'food',control:'exact',quantityMilli:1000})}],size:1});
  await expect(reader().page(request)).rejects.toMatchObject({reason:'contract'});
 });
 it('refuses unauthorized identities and rejects late data from a replacement login',async()=>{
  Object.assign(auth,{currentUser:null});await expect(reader().page(request)).rejects.toMatchObject({reason:'access'});expect(sdk.getDocs).not.toHaveBeenCalled();
  Object.assign(auth,{currentUser:{uid:'candidate-reader-owner'}});sdk.getDocs.mockImplementationOnce(async()=>{Object.assign(auth,{currentUser:{uid:'candidate-reader-owner'}});return{docs:[item()],size:1};});await expect(reader().page(request)).rejects.toMatchObject({reason:'access'});
 });
 it('bounds suggestion reads and reports incomplete scanning instead of promising uniqueness',async()=>{
  sdk.getDocs.mockResolvedValue({docs:Array.from({length:100},(_,i)=>item('p'+i)),size:100});
  const result=await reader().suggest({name:'Jabón ficticio',presentation:'Barra 100 g',categoryId:'personal-hygiene',control:'simple',baseUnit:'unidad'});
  expect(sdk.getDocs).toHaveBeenCalledTimes(10);expect(result.incomplete).toBe(true);expect(result.items).toHaveLength(8);expect('mutate'in reader()).toBe(false);
 });
 it('disposal prevents further reads and no invalid product path is requested',async()=>{
  const service=reader();await expect(service.byId('../other')).rejects.toMatchObject({reason:'query'});expect(sdk.getDoc).not.toHaveBeenCalled();
  await service.dispose();await expect(service.page(request)).rejects.toMatchObject({reason:'access'});expect(sdk.terminate).toHaveBeenCalledOnce();
 });
 it('recognizes all seven approved category IDs and preserves exact fractional stock',async()=>{
  const service=reader();
  for(const [categoryId,label] of Object.entries(CATEGORIES)){
   const row=item(categoryId);sdk.getDocs.mockResolvedValueOnce({docs:[{id:row.id,data:()=>({...row.data(),categoryId,control:'exact',baseUnit:'kg',stock:{quantityMilli:1250}})}],size:1});
   const result=await service.page({...request,category:label});
   expect(result.items[0]).toMatchObject({category:label,control:'exact',unit:'kg',quantityMilli:1250,version:1});
   expect(sdk.where).toHaveBeenLastCalledWith('categoryId','==',categoryId);
  }
 });
 it('returns an empty inventory and absent product without demo data or a write capability',async()=>{
  sdk.getDocs.mockResolvedValueOnce({docs:[],size:0});sdk.getDoc.mockResolvedValueOnce({exists:()=>false});const service=reader();
  expect(await service.page(request)).toEqual({items:[],nextCursor:null});expect(await service.byId('missing')).toBeNull();expect('mutate'in service).toBe(false);
 });
 it('translates permissions, expired-session and network errors without exposing SDK messages',async()=>{
  for(const [code,reason] of [['permission-denied','access'],['unauthenticated','access'],['unavailable','connection'],['deadline-exceeded','connection']]){
   sdk.getDocs.mockRejectedValueOnce({code,message:'internal-fixture-message'});
   const failure=await reader().page(request).catch(error=>error);
   expect(failure).toMatchObject({reason});expect(failure.message).not.toContain('internal-fixture-message');
  }
 });
 it('discards an in-flight response when the reader is disposed during the request',async()=>{
  let finish!:(value:unknown)=>void;sdk.getDocs.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));const service=reader();
  const pending=service.page(request);const rejected=expect(pending).rejects.toMatchObject({reason:'access'});
  await service.dispose();finish({docs:[item()],size:1});await rejected;
 });
});
