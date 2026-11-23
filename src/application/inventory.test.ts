import { describe, expect, it } from 'vitest';
import { createProductCommand, inventoryError } from './inventory';
import { decodeInventoryProduct, createEmulatorInventory } from '../adapters/firebase/inventory';
import { authTestFixture } from '../test/auth-test-fixture';

describe('local inventory boundary',()=>{
  it('rejects demo, real-test and external hosts before obtaining an SDK app',()=>{
    expect(()=>createEmulatorInventory({mode:'demo'},'localhost')).toThrow('LOCAL_AUTHENTICATION_ONLY');
    expect(()=>createEmulatorInventory(authTestFixture,'localhost')).toThrow('LOCAL_AUTHENTICATION_ONLY');
    expect(()=>createEmulatorInventory({mode:'demo'},'example.com')).toThrow();
  });
  it('maps only normalized product documents with version and server timestamp',()=>{
    const p={name:'Arroz ficticio',categoryId:'food',control:'exact',unit:'unidad',quantityMilli:2000,version:0,updatedAt:{toMillis:()=>12}};
    expect(decodeInventoryProduct('p',p)).toMatchObject({id:'p',category:'Alimentos',quantityMilli:2000,version:0,updatedAtMillis:12});
    for(const patch of [{version:-1},{quantityMilli:1500},{categoryId:'unknown'},{control:'mixed'},{updatedAt:null},{uid:'other'}])expect(()=>decodeInventoryProduct('p',{...p,...patch})).toThrow();
  });
  it('separates creation and initial stock from any financial command',()=>{
    const command=createProductCommand('o','p',{name:'Ficticio',category:'Alimentos',unit:'kg',control:'exact',initialQuantityMilli:1250,initialStatus:'available'});
    expect(command).toEqual({schemaVersion:1,kind:'inventoryCreate',operationId:'o',productId:'p',product:{name:'Ficticio',categoryId:'food',unit:'kg',control:'exact',quantityMilli:1250}});
  });
  it('distinguishes uncertainty, stale versions, denied sessions and invalid amounts without raw errors',()=>{
    expect(inventoryError({code:'functions/unavailable',message:'sensitive'},true).uncertain).toBe(true);
    expect(inventoryError({code:'functions/failed-precondition'},true).message).toContain('otra ventana');
    expect(inventoryError({code:'functions/unauthenticated'}).message).toContain('sesión');
    expect(inventoryError({code:'functions/invalid-argument'},true).uncertain).toBe(false);
    expect(inventoryError({message:'sensitive'}).message).not.toContain('sensitive');
  });
});
