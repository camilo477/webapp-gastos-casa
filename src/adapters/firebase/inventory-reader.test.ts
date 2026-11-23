import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore/lite';
import { createFirestoreInventoryReader } from './inventory-reader';

const sdk=vi.hoisted(()=>({getDocs:vi.fn(),getDoc:vi.fn(),terminate:vi.fn(),query:vi.fn((...args:unknown[])=>args),collection:vi.fn((...args:unknown[])=>args),doc:vi.fn((...args:unknown[])=>args),where:vi.fn((...args:unknown[])=>args),orderBy:vi.fn((...args:unknown[])=>args),limit:vi.fn((n:number)=>n),startAfter:vi.fn((id:string)=>id)}));
vi.mock('firebase/firestore/lite',()=>({...sdk,documentId:()=> '__name__'}));
const app={options:{projectId:'demo-read-unit'}};
const db={app} as Firestore;
let auth:Auth;
const request={cursor:null,category:'all',search:''};
const data={name:'Arroz fictício',categoryId:'food',control:'exact',unit:'unidad',quantityMilli:1000,version:0,updatedAt:{toMillis:()=>1}};
const item=(id='p',value=data)=>({id,data:()=>value});
beforeEach(()=>{vi.clearAllMocks();auth={app,currentUser:{uid:'read-fixture-owner'}} as Auth;sdk.getDocs.mockResolvedValue({docs:[item()],size:1});sdk.terminate.mockResolvedValue(undefined);});
const reader=()=>createFirestoreInventoryReader(db,auth,'read-fixture-owner');
describe('prepared read-only adapter with mocked SDK, not a real connection',()=>{
  it('reads products only, bounds the page, filters category and applies compatible name search',async()=>{
    const result=await reader().page({...request,category:'Alimentos',search:'FICTICIO'});
    expect(result.items).toHaveLength(1);expect(result.items[0]).toMatchObject({name:data.name,version:0,quantityMilli:1000});
    expect(sdk.collection).toHaveBeenCalledWith(db,'users','read-fixture-owner','products');
    expect(sdk.where).toHaveBeenCalledWith('categoryId','==','food');expect(sdk.limit).toHaveBeenCalledWith(100);
    expect(result.nextCursor).toBeNull();expect('mutate' in reader()).toBe(false);
  });
  it('continues an unmatched full page instead of claiming a complete empty inventory',async()=>{
    sdk.getDocs.mockResolvedValue({docs:Array.from({length:100},(_,i)=>item('p'+i)),size:100});
    const result=await reader().page({...request,cursor:'before',search:'no-match'});
    expect(result.items).toEqual([]);expect(result.nextCursor).toBe('p99');expect(sdk.startAfter).toHaveBeenCalledWith('before');
  });
  it('returns empty/missing product and obtains a fresh page on subsequent reads',async()=>{
    const service=reader();sdk.getDocs.mockResolvedValueOnce({docs:[],size:0});
    expect(await service.page(request)).toEqual({items:[],nextCursor:null});expect((await service.page(request)).items).toHaveLength(1);
    sdk.getDoc.mockResolvedValueOnce({exists:()=>false});expect(await service.byId('absent')).toBeNull();
    sdk.getDoc.mockResolvedValueOnce({...item(),exists:()=>true});expect(await service.byId('p')).toMatchObject({id:'p'});
  });
  it('rejects missing/different identities before querying and mismatched apps before constructing a reader',async()=>{
    for(const currentUser of [null,{uid:'different-owner'}]){Object.assign(auth,{currentUser});await expect(reader().page(request)).rejects.toMatchObject({reason:'access'});}
    expect(sdk.getDocs).not.toHaveBeenCalled();expect(()=>createFirestoreInventoryReader({app:{options:{projectId:'other'}}} as Firestore,auth,'read-fixture-owner')).toThrow('MIXED');
  });
  it('discards a read from a replaced identity, even when the new login has the same UID',async()=>{
    sdk.getDocs.mockImplementationOnce(async()=>{Object.assign(auth,{currentUser:{uid:'read-fixture-owner'}});return{docs:[item()],size:1};});
    await expect(reader().page(request)).rejects.toMatchObject({reason:'access'});
  });
  it('rejects incompatible and proposed schemas instead of coercing values or substituting demo data',async()=>{
    for(const patch of [{categoryId:['food']},{unit:['kg']},{schemaVersion:1},{quantityMilli:-1},{version:'0'},{categoryId:'pharmacy'},{updatedAt:{toMillis:'invalid'}}]){
      sdk.getDocs.mockResolvedValueOnce({docs:[item('p',{...data,...patch} as typeof data)],size:1});
      await expect(reader().page(request)).rejects.toMatchObject({reason:'contract'});
    }
  });
  it('translates permission/network failures without exposing tokens or internal details',async()=>{
    for(const [code,reason] of [['permission-denied','access'],['unavailable','connection']]){
      sdk.getDocs.mockRejectedValueOnce({code,message:'private-provider-payload'});
      await expect(reader().page(request)).rejects.toMatchObject({reason});
    }
  });
  it('rejects invalid filters/IDs and disposal prevents further or late data delivery',async()=>{
    const service=reader();await expect(service.page({...request,cursor:'../other'})).rejects.toMatchObject({reason:'query'});
    await expect(service.page({...request,category:'Unapproved'})).rejects.toMatchObject({reason:'query'});
    await expect(service.byId('../other')).rejects.toMatchObject({reason:'query'});expect(sdk.getDocs).not.toHaveBeenCalled();
    sdk.getDocs.mockImplementationOnce(async()=>{await service.dispose();return{docs:[item()],size:1};});
    await expect(service.page(request)).rejects.toMatchObject({reason:'access'});expect(sdk.terminate).toHaveBeenCalledOnce();
    await expect(service.page(request)).rejects.toMatchObject({reason:'access'});
  });
});
