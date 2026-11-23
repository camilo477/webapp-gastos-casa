import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPreparedInventoryRead } from './inventory-read-test';
import { authTestFixture } from '../../test/auth-test-fixture';
import { INVENTORY_READ_PROJECT } from '../../application/inventory-read-configuration';

const sdk=vi.hoisted(()=>({app:vi.fn(),auth:vi.fn(),db:vi.fn(),reader:vi.fn(),logLevel:vi.fn()}));
vi.mock('firebase/app',()=>({getApp:sdk.app}));
vi.mock('firebase/auth',()=>({getAuth:sdk.auth}));
vi.mock('firebase/firestore/lite',()=>({initializeFirestore:sdk.db,setLogLevel:sdk.logLevel}));
vi.mock('./inventory-candidate-reader',()=>({createCandidateReader:sdk.reader}));
beforeEach(()=>vi.clearAllMocks());
describe('authorized read-only factory reuses Auth without implicit activation',()=>{
  it('never obtains an SDK service without explicit selection, despite complete approval and unrelated flags',()=>{
    const auth={...authTestFixture,projectId:INVENTORY_READ_PROJECT,authDomain:INVENTORY_READ_PROJECT+'.firebaseapp.com',approval:'owner-approved-auth-only:'+INVENTORY_READ_PROJECT};
    const env={VITE_FIRESTORE_READ_DATABASE:'(default)',VITE_FIRESTORE_READ_CONTRACT:'inventory-candidate-v1',VITE_FIRESTORE_READ_APPROVAL:`owner-approved-firestore-read-only:${INVENTORY_READ_PROJECT}:(default)`,VITE_ENABLE_FIRESTORE:'true',VITE_RULES_VERIFIED:'true'};
    expect(()=>createPreparedInventoryRead(auth,env,auth.authorizedOrigin)).toThrow('REAL_INVENTORY_READ_NOT_ENABLED');
    expect(sdk.app).not.toHaveBeenCalled();expect(sdk.auth).not.toHaveBeenCalled();expect(sdk.db).not.toHaveBeenCalled();
  });
  it('Auth approval alone cannot initialize Firestore',()=>{
    expect(()=>createPreparedInventoryRead(authTestFixture,{},authTestFixture.authorizedOrigin)).toThrow();
    expect(sdk.db).not.toHaveBeenCalled();
  });
  it('uses only the existing Auth app and returns a reader with no mutation capability',()=>{
    const auth={...authTestFixture,projectId:INVENTORY_READ_PROJECT,authDomain:INVENTORY_READ_PROJECT+'.firebaseapp.com',approval:'owner-approved-auth-only:'+INVENTORY_READ_PROJECT};
    const env={VITE_FIRESTORE_READ_ENABLED:'true',VITE_FIRESTORE_READ_DATABASE:'(default)',VITE_FIRESTORE_READ_CONTRACT:'inventory-candidate-v1',VITE_FIRESTORE_READ_APPROVAL:`owner-approved-firestore-read-only:${INVENTORY_READ_PROJECT}:(default)`};
    const app={options:{projectId:auth.projectId,apiKey:auth.apiKey,appId:auth.appId}},session={app,emulatorConfig:null},db={app},reader={page:vi.fn(),byId:vi.fn(),dispose:vi.fn()};
    sdk.app.mockReturnValue(app);sdk.auth.mockReturnValue(session);sdk.db.mockReturnValue(db);sdk.reader.mockReturnValue(reader);
    expect(createPreparedInventoryRead(auth,env,auth.authorizedOrigin)).toBe(reader);
    expect(sdk.app).toHaveBeenCalledWith('mi-casa-auth-test:'+INVENTORY_READ_PROJECT);expect(sdk.auth).toHaveBeenCalledWith(app);expect(sdk.db).toHaveBeenCalledWith(app,{},'(default)');expect(sdk.reader).toHaveBeenCalledWith(db,session,auth.ownerUid);expect('mutate'in reader).toBe(false);
    expect(sdk.logLevel).toHaveBeenCalledWith('silent');expect(sdk.logLevel.mock.invocationCallOrder[0]).toBeLessThan(sdk.db.mock.invocationCallOrder[0]!);
    for(const patch of [{projectId:'another-test'},{apiKey:'another-public-fixture-key'},{appId:'another-fixture-app'}]){
      sdk.app.mockReturnValue({options:{...app.options,...patch}});sdk.db.mockClear();expect(()=>createPreparedInventoryRead(auth,env,auth.authorizedOrigin)).toThrow('MIXED_INVENTORY_ENVIRONMENT');expect(sdk.db).not.toHaveBeenCalled();
    }
    sdk.app.mockReturnValue(app);sdk.auth.mockReturnValue({...session,emulatorConfig:{host:'127.0.0.1',port:9299}});sdk.db.mockClear();expect(()=>createPreparedInventoryRead(auth,env,auth.authorizedOrigin)).toThrow('MIXED_INVENTORY_ENVIRONMENT');expect(sdk.db).not.toHaveBeenCalled();
  });
});
