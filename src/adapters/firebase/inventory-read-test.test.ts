import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPreparedInventoryRead } from './inventory-read-test';
import { authTestFixture } from '../../test/auth-test-fixture';
import { INVENTORY_READ_PROJECT } from '../../application/inventory-read-configuration';

const sdk=vi.hoisted(()=>({app:vi.fn(),auth:vi.fn(),db:vi.fn()}));
vi.mock('firebase/app',()=>({getApp:sdk.app}));
vi.mock('firebase/auth',()=>({getAuth:sdk.auth}));
vi.mock('firebase/firestore/lite',()=>({initializeFirestore:sdk.db}));
vi.mock('./inventory-candidate-reader',()=>({createCandidateReader:vi.fn()}));
beforeEach(()=>vi.clearAllMocks());
describe('real connection factory remains unconditionally disabled',()=>{
  it('never obtains an SDK service even with complete separately approved fictitious configuration',()=>{
    const auth={...authTestFixture,projectId:INVENTORY_READ_PROJECT,authDomain:INVENTORY_READ_PROJECT+'.firebaseapp.com',approval:'owner-approved-auth-only:'+INVENTORY_READ_PROJECT};
    const env={VITE_FIRESTORE_READ_DATABASE:'(default)',VITE_FIRESTORE_READ_CONTRACT:'inventory-candidate-v1',VITE_FIRESTORE_READ_APPROVAL:`owner-approved-firestore-read-only:${INVENTORY_READ_PROJECT}:(default)`,VITE_ENABLE_FIRESTORE:'true',VITE_RULES_VERIFIED:'true'};
    expect(()=>createPreparedInventoryRead(auth,env,auth.authorizedOrigin)).toThrow('REAL_INVENTORY_READ_DISABLED_05C2');
    expect(sdk.app).not.toHaveBeenCalled();expect(sdk.auth).not.toHaveBeenCalled();expect(sdk.db).not.toHaveBeenCalled();
  });
  it('Auth approval alone cannot initialize Firestore',()=>{
    expect(()=>createPreparedInventoryRead(authTestFixture,{},authTestFixture.authorizedOrigin)).toThrow();
    expect(sdk.db).not.toHaveBeenCalled();
  });
});
