import { describe, expect, it, vi } from 'vitest';
import { EMULATOR_CONFIG, LOCAL_AUTH_UID, readConfiguration, requireLocalAuthentication, requireTestAuthentication, type AuthTestConfiguration } from './configuration';
import { authTestFixture as fixture } from '../test/auth-test-fixture';
const env = {
  VITE_APP_MODE: 'auth-test', VITE_FIREBASE_PROJECT_ID: fixture.projectId, VITE_FIREBASE_API_KEY: fixture.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: fixture.authDomain, VITE_FIREBASE_APP_ID: fixture.appId, VITE_AUTH_TEST_OWNER_UID: fixture.ownerUid,
  VITE_AUTH_TEST_PROVIDERS: 'google,password', VITE_AUTH_TEST_GOOGLE_FLOW: fixture.googleFlow,
  VITE_AUTH_TEST_ORIGIN: fixture.authorizedOrigin, VITE_AUTH_TEST_APPROVAL: fixture.approval,
};
describe('explicit, inactive by default real-test preparation', () => {
  it('keeps demo disconnected even when test project variables exist', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(readConfiguration({ ...env, VITE_APP_MODE: undefined })).toEqual({ mode: 'demo' });
    expect(fetchSpy).not.toHaveBeenCalled(); fetchSpy.mockRestore();
  });
  it('requires every setting and exact project-bound approval; never discovers defaults', () => {
    expect(readConfiguration(env)).toEqual(fixture);
    for (const key of Object.keys(env).filter(key => key !== 'VITE_APP_MODE')) {
      expect(() => readConfiguration({ ...env, [key]: '' })).toThrow();
      expect(() => readConfiguration({ ...env, [key]: undefined })).toThrow();
    }
    expect(() => readConfiguration({ ...env, VITE_AUTH_TEST_APPROVAL: 'true' })).toThrow();
    expect(() => readConfiguration({ ...env, VITE_AUTH_TEST_APPROVAL: 'owner-approved-auth-only:other-test' })).toThrow();
  });
  it.each([
    { projectId: 'demo-mi-casa-05a' }, { projectId: 'production-project' }, { projectId: 'example-auth-test' },
    { authDomain: 'other-test.firebaseapp.com' }, { authDomain: 'https://mi-casa-unit-test.firebaseapp.com' },
    { authDomain: 'mi-casa-unit-test.firebaseapp.com.evil.test' }, { appId: 'not-a-web-app' }, { apiKey: '' },
    { ownerUid: LOCAL_AUTH_UID }, { ownerUid: 'REPLACE_WITH_AUTHORIZED_UID' }, { ownerUid: 'user@email.test' },
    { methods: ['google', 'google'] }, { methods: ['anonymous'] }, { methods: [] }, { googleFlow: 'auto' },
    { authorizedOrigin: 'http://localhost:5175/route' }, { authorizedOrigin: 'https://foreign.test' },
    { authorizedOrigin: 'http://localhost:5174' }, { googleFlow: 'redirect' }, { authHost: '127.0.0.1:9299' },
  ])('rejects incompatible configuration %j before initialization', change => {
    expect(() => requireTestAuthentication({ ...fixture, ...change } as AuthTestConfiguration, fixture.authorizedOrigin)).toThrow();
  });
  it('binds the actual browser origin and keeps mobile redirects behind a same-origin helper', () => {
    expect(() => requireTestAuthentication(fixture, 'http://localhost:5174')).toThrow();
    const hosted = { ...fixture, googleFlow: 'redirect' as const, authorizedOrigin: `https://${fixture.authDomain}` };
    expect(() => requireTestAuthentication(hosted, hosted.authorizedOrigin)).not.toThrow();
  });
  it('rejects both directions of emulator/test mixing and blocks production modes', () => {
    for (const key of ['VITE_AUTH_EMULATOR_HOST', 'VITE_FIRESTORE_EMULATOR_HOST', 'VITE_FUNCTIONS_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST', 'FIRESTORE_EMULATOR_HOST']) {
      expect(() => readConfiguration({ ...env, [key]: '127.0.0.1:9299' })).toThrow('MIXED');
    }
    expect(() => readConfiguration({ VITE_APP_MODE: 'emulator', VITE_AUTH_TEST_APPROVAL: fixture.approval })).toThrow('MIXED');
    expect(() => requireLocalAuthentication(fixture, 'localhost')).toThrow();
    expect(() => requireTestAuthentication(EMULATOR_CONFIG as unknown as AuthTestConfiguration, fixture.authorizedOrigin)).toThrow();
    for (const mode of ['production', 'staging', 'remote']) expect(() => readConfiguration({ ...env, VITE_APP_MODE: mode })).toThrow('DISABLED');
  });
});
