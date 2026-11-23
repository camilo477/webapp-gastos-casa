import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import type { SessionPort } from '../../application/ports';
import { EMULATOR_CONFIG } from '../../application/configuration';
import { authTestFixture as fixture } from '../../test/auth-test-fixture';
import { createAuthTestSession } from './auth-test';

const sdk = vi.hoisted(() => ({
  auth: { currentUser: null as unknown, languageCode: '' }, listener: (_user: unknown) => {},
  initializeApp: vi.fn(() => ({})), initializeAuth: vi.fn(), unsubscribe: vi.fn(), deleteApp: vi.fn(),
  password: vi.fn(), popup: vi.fn(), redirect: vi.fn(), result: vi.fn(), signOut: vi.fn(), parameters: vi.fn(), scopes: vi.fn(),
}));
vi.mock('firebase/app', () => ({ initializeApp: sdk.initializeApp, deleteApp: sdk.deleteApp }));
vi.mock('firebase/auth', () => ({
  initializeAuth: sdk.initializeAuth, browserLocalPersistence: 'official-browser-local', browserPopupRedirectResolver: 'official-resolver',
  GoogleAuthProvider: class { setCustomParameters = sdk.parameters; addScope = sdk.scopes; },
  onIdTokenChanged: vi.fn((_auth, listener) => { sdk.listener = listener; return sdk.unsubscribe; }),
  signInWithEmailAndPassword: sdk.password, signInWithPopup: sdk.popup, signInWithRedirect: sdk.redirect,
  getRedirectResult: sdk.result, signOut: sdk.signOut,
}));
const tick = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
function emit(uid: string | null) {
  const user = uid ? { uid, getIdTokenResult: vi.fn(async () => ({ expirationTime: new Date(Date.now() + 3600000).toISOString(),
    claims: { aud: fixture.projectId, iss: `https://securetoken.google.com/${fixture.projectId}`, sub: uid } })) } : null;
  sdk.auth.currentUser = user; sdk.listener(user); return user as unknown as User | null;
}
let service: SessionPort | undefined;
const create = () => (service = createAuthTestSession(fixture, fixture.authorizedOrigin));
const redirectConfig = () => ({ ...fixture, googleFlow: 'redirect' as const, authorizedOrigin: `https://${fixture.authDomain}` });
beforeEach(() => {
  vi.clearAllMocks(); service = undefined; sdk.auth.currentUser = null; sdk.listener = () => {};
  sdk.initializeAuth.mockReturnValue(sdk.auth);
  sdk.result.mockResolvedValue(null); sdk.popup.mockImplementation(async () => { emit(fixture.ownerUid); });
  sdk.password.mockImplementation(async () => { emit(fixture.ownerUid); }); sdk.signOut.mockImplementation(async () => { emit(null); });
});
afterEach(async () => { await service?.dispose(); });
describe('prepared Auth test adapter, mocked SDK only; no real Google sign-in', () => {
  it('rejects incomplete approval, demo/emulator or wrong origin before any SDK initialization', () => {
    for (const config of [EMULATOR_CONFIG, { mode: 'demo' as const }, { ...fixture, approval: '' }]) {
      expect(() => createAuthTestSession(config, fixture.authorizedOrigin)).toThrow();
    }
    expect(() => createAuthTestSession(fixture, 'http://localhost:5174')).toThrow();
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });
  it('uses an isolated app, official persistence and resolver, never the emulator UID/config', async () => {
    create(); expect(service!.current().status).toBe('checking');
    expect(sdk.initializeApp).toHaveBeenCalledWith({ projectId: fixture.projectId, apiKey: fixture.apiKey, authDomain: fixture.authDomain, appId: fixture.appId }, `mi-casa-auth-test:${fixture.projectId}`);
    expect(sdk.initializeAuth).toHaveBeenCalledWith({}, { persistence: 'official-browser-local', popupRedirectResolver: 'official-resolver' });
    expect(sdk.auth.languageCode).toBe('es'); expect(sdk.result).not.toHaveBeenCalled();
    const owner = emit(fixture.ownerUid); await tick();
    expect(owner!.getIdTokenResult).toHaveBeenCalledWith(true);
    expect(service!.current()).toMatchObject({ status: 'authenticated', session: { uid: fixture.ownerUid } });
  });
  it('uses only identity scopes and account selection; never extracts Google tokens', async () => {
    create(); emit(null); await service!.signIn({ method: 'google' }); await tick();
    expect(sdk.parameters).toHaveBeenCalledWith({ prompt: 'select_account' }); expect(sdk.scopes).not.toHaveBeenCalled();
    expect(sdk.popup).toHaveBeenCalledOnce(); expect(sdk.redirect).not.toHaveBeenCalled();
    expect(JSON.stringify(service!.current())).not.toMatch(/accessToken|refreshToken|credential|email/);
  });
  it('retains email/password only when explicitly configured and gets identity from Auth', async () => {
    create(); emit(null); await service!.signIn({ method: 'password', email: ' prueba@example.test ', password: 'Ficticia-only' }); await tick();
    expect(sdk.password).toHaveBeenCalledWith(sdk.auth, 'prueba@example.test', 'Ficticia-only');
    expect(service!.current()).toMatchObject({ status: 'authenticated', session: { uid: fixture.ownerUid } });
    await service!.signOut(); expect(service!.current().status).toBe('anonymous');
    expect(sdk.signOut).toHaveBeenCalledOnce();
  });
  it('does not silently enable the other provider', async () => {
    service = createAuthTestSession({ ...fixture, methods: ['password'] }, fixture.authorizedOrigin); emit(null);
    await expect(service.signIn({ method: 'google' })).rejects.toThrow('no está disponible'); expect(sdk.popup).not.toHaveBeenCalled();
  });
  it.each([
    ['auth/popup-closed-by-user', 'se canceló'], ['auth/cancelled-popup-request', 'se canceló'],
    ['auth/popup-blocked', 'ventanas emergentes'], ['auth/network-request-failed', 'conectar'],
    ['auth/unauthorized-domain', 'no está disponible'], ['auth/operation-not-supported-in-this-environment', 'navegador habitual'],
    ['auth/account-exists-with-different-credential', 'otra forma de ingreso'],
  ])('handles %s without redirect fallback or exposing provider errors', async (code, message) => {
    create(); emit(null); sdk.popup.mockRejectedValueOnce({ code, message: 'sensitive-provider-details' });
    await expect(service!.signIn({ method: 'google' })).rejects.toThrow(message);
    expect(sdk.redirect).not.toHaveBeenCalled(); expect(service!.current().status).toBe('anonymous');
    await service!.signIn({ method: 'google' }); await tick(); expect(service!.current().status).toBe('authenticated');
  });
  it.each(['demo-owner-05a', 'different-owner'])('rejects restored or signed-in UID %s', async uid => {
    create(); emit(uid); await tick(); expect(sdk.signOut).toHaveBeenCalledOnce();
    expect(service!.current()).toMatchObject({ status: 'anonymous', message: expect.stringContaining('no tiene acceso') });
  });
  it.each([{ aud: 'other-project' }, { iss: 'https://securetoken.google.com/other-project' }, { sub: 'different-owner' }, {}])(
    'rejects mixed-project or mismatched token claims %j', async change => {
      create(); const owner = emit(fixture.ownerUid)!; await tick();
      vi.mocked(owner.getIdTokenResult).mockResolvedValueOnce({ expirationTime: new Date(Date.now() + 3600000).toISOString(),
        claims: Object.keys(change).length ? { aud: fixture.projectId, iss: `https://securetoken.google.com/${fixture.projectId}`, sub: fixture.ownerUid, ...change } : {},
      } as Awaited<ReturnType<User['getIdTokenResult']>>);
      await service!.recheck(); expect(sdk.signOut).toHaveBeenCalledOnce(); expect(service!.current().status).toBe('anonymous');
    });
  it('prepares redirect explicitly for same-origin helpers and waits before exposing restored identity', async () => {
    const config = redirectConfig(); let finish!: () => void;
    sdk.result.mockImplementationOnce(() => new Promise(resolve => { finish = () => resolve(null); }));
    service = createAuthTestSession(config, config.authorizedOrigin);
    await service.recheck(); expect(service.current().status).toBe('checking');
    expect(sdk.listener).not.toBeUndefined(); finish(); await tick();
    emit(fixture.ownerUid); await tick(); expect(service.current().status).toBe('authenticated');
    await service.signOut(); await service.signIn({ method: 'google' });
    expect(sdk.redirect).toHaveBeenCalledOnce(); expect(sdk.popup).not.toHaveBeenCalled();
  });
  it('handles a cancelled redirect, clears any partial identity and permits retry', async () => {
    const config = redirectConfig(); sdk.auth.currentUser = { uid: fixture.ownerUid };
    sdk.result.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
    service = createAuthTestSession(config, config.authorizedOrigin); await tick(); emit(null); await tick();
    expect(sdk.signOut).toHaveBeenCalledOnce(); expect(service.current()).toMatchObject({ status: 'anonymous', message: expect.stringContaining('se canceló') });
    await service.signIn({ method: 'google' }); expect(sdk.redirect).toHaveBeenCalledOnce();
  });
  it('cannot authorize a partial restored identity when redirect cleanup fails', async () => {
    const config = redirectConfig(); sdk.auth.currentUser = { uid: fixture.ownerUid };
    sdk.result.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    sdk.signOut.mockRejectedValueOnce({ code: 'auth/web-storage-unsupported' });
    service = createAuthTestSession(config, config.authorizedOrigin); await tick();
    expect(service.current().status).toBe('error');
    await expect(service.signIn({ method: 'google' })).rejects.toThrow();
    await service.recheck(); emit(null); expect(service.current().status).toBe('anonymous');
  });
  it('keeps access closed on network failure or expired session renewal', async () => {
    create(); const owner = emit(fixture.ownerUid)!; await tick();
    vi.mocked(owner.getIdTokenResult).mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    await service!.recheck(); expect(service!.current().status).toBe('error');
    await service!.recheck(); expect(service!.current().status).toBe('authenticated');
    vi.mocked(owner.getIdTokenResult).mockRejectedValueOnce({ code: 'auth/user-token-expired' });
    await service!.recheck(); expect(service!.current().status).toBe('anonymous');
  });
  it('releases listeners and ignores pending redirect completion after disposal', async () => {
    const config = redirectConfig(); let finish!: () => void;
    sdk.result.mockImplementationOnce(() => new Promise(resolve => { finish = () => resolve(null); }));
    service = createAuthTestSession(config, config.authorizedOrigin); const old = service.current();
    await service.dispose(); finish(); await tick(); expect(service.current()).toBe(old); expect(sdk.deleteApp).toHaveBeenCalledOnce();
  });
});
