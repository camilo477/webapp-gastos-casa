import { describe, expect, it } from 'vitest';
import { authTestFixture } from '../test/auth-test-fixture';
import { INVENTORY_READ_PROJECT, prepareInventoryReadConfiguration, requireRealInventoryReadRelease, inventoryReadRequested } from './inventory-read-configuration';
import { EMULATOR_CONFIG } from './configuration';

const auth = { ...authTestFixture, projectId: INVENTORY_READ_PROJECT, authDomain: `${INVENTORY_READ_PROJECT}.firebaseapp.com`, approval: `owner-approved-auth-only:${INVENTORY_READ_PROJECT}` };
const env = { VITE_FIRESTORE_READ_DATABASE: '(default)', VITE_FIRESTORE_READ_CONTRACT: 'inventory-candidate-v1', VITE_FIRESTORE_READ_APPROVAL: `owner-approved-firestore-read-only:${INVENTORY_READ_PROJECT}:(default)` };
describe('offline preparation of future inventory reads',()=>{
  it('requires a separate project-bound approval and the explicit candidate schema/database',()=>{
    expect(prepareInventoryReadConfiguration(auth,env,auth.authorizedOrigin)).toEqual({projectId:INVENTORY_READ_PROJECT,databaseId:'(default)',ownerUid:authTestFixture.ownerUid,contract:'inventory-candidate-v1'});
    for(const patch of [{VITE_FIRESTORE_READ_APPROVAL:''},{VITE_FIRESTORE_READ_DATABASE:'another'},{VITE_FIRESTORE_READ_CONTRACT:'proposed-04d'},{VITE_FIRESTORE_READ_CONTRACT:'experimental-05c1'},{VITE_FIRESTORE_READ_APPROVAL:'owner-approved-auth-only:'+INVENTORY_READ_PROJECT},{VITE_AUTH_EMULATOR_HOST:'127.0.0.1:9299'},{FIRESTORE_EMULATOR_HOST:'127.0.0.1:8386'}])expect(()=>prepareInventoryReadConfiguration(auth,{...env,...patch},auth.authorizedOrigin)).toThrow();
  });
  it('rejects another project, invalid origin, fake emulator owner and missing Auth approval',()=>{
    expect(()=>prepareInventoryReadConfiguration(authTestFixture,env,auth.authorizedOrigin)).toThrow();
    expect(()=>prepareInventoryReadConfiguration(auth,env,'https://unapproved.example.test')).toThrow();
    for(const patch of [{approval:''},{ownerUid:'demo-owner-05a'}])expect(()=>prepareInventoryReadConfiguration({...auth,...patch},env,auth.authorizedOrigin)).toThrow();
  });
  it('keeps default and Auth-only composition disabled despite unrelated flags',()=>{
    expect(()=>requireRealInventoryReadRelease()).toThrow('REAL_INVENTORY_READ_NOT_ENABLED');
    expect(inventoryReadRequested(auth,{...env,VITE_ENABLE_FIRESTORE:'true',VITE_RULES_VERIFIED:'true'},auth.authorizedOrigin)).toBe(false);
    expect(inventoryReadRequested(auth,{...env,VITE_FIRESTORE_READ_ENABLED:'false'},auth.authorizedOrigin)).toBe(false);
  });
  it('requires explicit selection and full independent authorization, only in Auth-test',()=>{
    const selected={...env,VITE_FIRESTORE_READ_ENABLED:'true'};
    expect(inventoryReadRequested(auth,selected,auth.authorizedOrigin)).toBe(true);
    for(const config of [{mode:'demo' as const},EMULATOR_CONFIG])expect(()=>inventoryReadRequested(config,selected,auth.authorizedOrigin)).toThrow('REAL_INVENTORY_READ_AUTH_TEST_ONLY');
    for(const patch of [{VITE_FIRESTORE_READ_ENABLED:'yes'},{VITE_FIRESTORE_READ_ENABLED:true},{VITE_FIRESTORE_READ_APPROVAL:''},{VITE_FIRESTORE_READ_DATABASE:'other'},{VITE_FUNCTIONS_EMULATOR_HOST:'127.0.0.1:5205'}])expect(()=>inventoryReadRequested(auth,{...selected,...patch},auth.authorizedOrigin)).toThrow();
  });
});
