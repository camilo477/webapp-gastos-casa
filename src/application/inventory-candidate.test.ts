import { describe,expect,it } from 'vitest';
import { applyCommand } from '@mi-casa/inventory-contract';
import { candidateView,inventoryProfile } from './inventory-candidate';
import { EMULATOR_CONFIG } from './configuration';
import { authTestFixture } from '../test/auth-test-fixture';
describe('candidate boundary and view projection',()=>{
 it('activates only as a local emulator profile; real and demo never switch silently',()=>{
  expect(inventoryProfile(EMULATOR_CONFIG,{})).toBe('candidate');expect(inventoryProfile(EMULATOR_CONFIG,{VITE_INVENTORY_CONTRACT:'experimental-05c1'})).toBe('legacy');
  for(const config of [{mode:'demo' as const},authTestFixture]){expect(inventoryProfile(config,{})).toBeNull();expect(()=>inventoryProfile(config,{VITE_INVENTORY_CONTRACT:'inventory-candidate-v1'})).toThrow('LOCAL_INVENTORY_PROFILE_ONLY');}
  expect(()=>inventoryProfile(EMULATOR_CONFIG,{VITE_INVENTORY_CONTRACT:'unknown'})).toThrow();
 });
 it('projects exact/simple records without creating numeric approximate stock or losing presentation/version',()=>{
  const command={schemaVersion:2 as const,kind:'create' as const,operationId:'o',productId:'p',definition:{name:'Jabón ficticio',presentation:'Barra',categoryId:'personal-hygiene' as const,control:'simple' as const,baseUnit:'unidad' as const},opening:{status:'low' as const},duplicateDecision:'reviewed-new' as const};
  const view=candidateView(applyCommand(command,null,1234));expect(view).toMatchObject({category:'Higiene personal',presentation:'Barra',version:1,status:'low',updatedAtMillis:1234});expect('quantityMilli'in view).toBe(false);
 });
});
