import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import type { SessionPort } from '../../application/ports';
import { EMULATOR_CONFIG, LOCAL_AUTH_UID } from '../../application/configuration';
import { createEmulatorSession } from './authentication';

const sdk = vi.hoisted(() => ({
  auth: { currentUser: null as unknown }, listener: (_user: unknown) => {}, failed: () => {},
  initializeApp: vi.fn(() => ({})), initializeAuth: vi.fn(), connect: vi.fn(), unsubscribe: vi.fn(),
  signIn: vi.fn(), signOut: vi.fn(), deleteApp: vi.fn(),
}));
vi.mock('firebase/app', () => ({ initializeApp: sdk.initializeApp, deleteApp: sdk.deleteApp }));
vi.mock('firebase/auth', () => ({
  initializeAuth: sdk.initializeAuth, browserLocalPersistence: 'official-browser-local', connectAuthEmulator: sdk.connect,
  onIdTokenChanged: vi.fn((_auth, listener, failed) => { sdk.listener = listener; sdk.failed = failed; return sdk.unsubscribe; }),
  signInWithEmailAndPassword: sdk.signIn, signOut: sdk.signOut,
}));
const tick = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
function user(uid = LOCAL_AUTH_UID) {
  return { uid, getIdTokenResult: vi.fn(async () => ({ expirationTime: new Date(Date.now() + 3600000).toISOString() })) } as unknown as User;
}
function emit(value: User | null) { sdk.auth.currentUser = value; sdk.listener(value); }
let service: SessionPort;
beforeEach(() => {
  vi.clearAllMocks(); sdk.auth.currentUser = null;
  sdk.initializeAuth.mockReturnValue(sdk.auth);
  sdk.signOut.mockImplementation(async () => { emit(null); });
  sdk.signIn.mockImplementation(async () => { emit(user()); });
});
afterEach(async () => { await service?.dispose(); vi.useRealTimers(); });
describe('emulator authentication adapter', () => {
  it('fails before SDK initialization for unauthorized configuration or host', () => {
    expect(() => createEmulatorSession({ mode: 'demo' }, 'localhost')).toThrow();
    expect(() => createEmulatorSession(EMULATOR_CONFIG, 'remote.example')).toThrow();
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });
  it('connects synchronously to the emulator, starts checking, and releases observers', async () => {
    service = createEmulatorSession(EMULATOR_CONFIG, 'localhost');
    expect(service.current().status).toBe('checking');
    expect(sdk.connect).toHaveBeenCalledWith(sdk.auth, 'http://127.0.0.1:9299', { disableWarnings: true });
    expect(sdk.initializeAuth).toHaveBeenCalledWith({}, { persistence: 'official-browser-local' });
    const changed = vi.fn(), stop = service.subscribe(changed);
    emit(null); expect(service.current().status).toBe('anonymous'); expect(changed).toHaveBeenCalledOnce();
    stop(); emit(null); expect(changed).toHaveBeenCalledOnce();
    await service.dispose(); expect(sdk.unsubscribe).toHaveBeenCalled();
    const prior = service.current(); emit(user()); expect(service.current()).toBe(prior);
  });
  it('signs in with the SDK and exposes only its UID, never a password or token', async () => {
    service = createEmulatorSession(EMULATOR_CONFIG, 'localhost'); emit(null);
    await service.signIn({ method: 'password', email: ' duena@example.test ', password: 'fixture-only' }); await tick();
    expect(sdk.signIn).toHaveBeenCalledWith(sdk.auth, 'duena@example.test', 'fixture-only');
    expect(service.current()).toMatchObject({ status: 'authenticated', session: { uid: LOCAL_AUTH_UID } });
    expect(JSON.stringify(service.current())).not.toMatch(/fixture-only|token|email/);
  });
  it('rejects non-fixture email addresses before sending credentials to the emulator', async () => {
    service = createEmulatorSession(EMULATOR_CONFIG, 'localhost'); emit(null);
    await expect(service.signIn({ method: 'password', email: 'someone@gmail.com', password: 'do-not-send' })).rejects.toThrow('@example.test');
    expect(sdk.signIn).not.toHaveBeenCalled();
  });
  it.each(['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-email'])(
    'translates %s without exposing SDK errors or enumerating accounts', async code => {
      service = createEmulatorSession(EMULATOR_CONFIG, 'localhost'); emit(null);
      sdk.signIn.mockRejectedValueOnce({ code, message: 'private-sdk-detail' });
      await expect(service.signIn({ method: 'password', email: 'nobody@example.test', password: 'fixture' })).rejects.toThrow('Revisa el correo y la contraseña');
      expect(service.current().status).toBe('anonymous');
    });
  it('restores only after token verification and retains scope on renewal of the same identity', async () => {
    service = createEmulatorSession(EMULATOR_CONFIG, 'localhost'); const owner = user();
    let finish!: (value: { expirationTime: string }) => void;
    vi.mocked(owner.getIdTokenResult).mockImplementationOnce(() => new Promise(resolve => { finish = resolve as typeof finish; }));
    emit(owner); expect(service.current().status).toBe('checking');
    finish({ expirationTime: new Date(Date.now() + 3600000).toISOString() }); await tick();
    expect(owner.getIdTokenResult).toHaveBeenCalledWith(true);
    const scope = service.current().scope;
    await service.recheck(); expect(service.current()).toMatchObject({ status: 'authenticated', scope });
  });
  it('does not unmount a current form during background verification of an unexpired identity', async () => {
    service = createEmulatorSession(EMULATOR_CONFIG, 'localhost'); const owner = user(); emit(owner); await tick();
    let finish!: (value: unknown) => void;
    vi.mocked(owner.getIdTokenResult).mockImplementationOnce(() => new Promise(resolve => { finish = resolve as typeof finish; }));
    const checking = service.recheck(); expect(service.current().status).toBe('authenticated');
    finish({ expirationTime: new Date(Date.now() + 3600000).toISOString() }); await checking;
    expect(service.current().status).toBe('authenticated');
  });
  it('rejects other UIDs from both sign-in and restored session, even with a valid token', async () => {
    service = createEmulatorSession(EMULATOR_CONFIG, 'localhost'); const other = user('not-owner');
    emit(other); await tick();
    expect(other.getIdTokenResult).not.toHaveBeenCalled(); expect(sdk.signOut).toHaveBeenCalledOnce();
    expect(service.current()).toMatchObject({ status: 'anonymous', message: expect.stringContaining('no tiene acceso') });
  });
  it('clears visible data on connection failure and can revalidate the retained SDK session', async () => {
    service = createEmulatorSession(EMULATOR_CONFIG, 'localhost'); const owner = user(); emit(owner); await tick();
    const oldScope = service.current().scope;
    vi.mocked(owner.getIdTokenResult).mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    await service.recheck(); expect(service.current()).toMatchObject({ status: 'error', message: expect.stringContaining('conectar') });
    expect(service.current().scope).toBeGreaterThan(oldScope); expect(sdk.signOut).not.toHaveBeenCalled();
    await service.recheck(); expect(service.current().status).toBe('authenticated');
  });
  it('renews expired tokens and closes access if renewal rejects the session', async () => {
    vi.useFakeTimers(); service = createEmulatorSession(EMULATOR_CONFIG, 'localhost'); const owner = user();
    vi.mocked(owner.getIdTokenResult).mockResolvedValueOnce({ expirationTime: new Date(Date.now() + 1000).toISOString() } as Awaited<ReturnType<User['getIdTokenResult']>>);
    emit(owner); await tick();
    vi.mocked(owner.getIdTokenResult).mockRejectedValueOnce({ code: 'auth/user-token-expired' });
    await vi.advanceTimersByTimeAsync(1001);
    expect(sdk.signOut).toHaveBeenCalledOnce();
    expect(service.current()).toMatchObject({ status: 'anonymous', message: expect.stringContaining('sesión terminó') });
  });
  it('ignores late verification from a previous identity', async () => {
    service = createEmulatorSession(EMULATOR_CONFIG, 'localhost'); const owner = user();
    let finish!: (value: unknown) => void;
    vi.mocked(owner.getIdTokenResult).mockImplementationOnce(() => new Promise(resolve => { finish = resolve as typeof finish; }));
    emit(owner); const priorScope = service.current().scope;
    emit(user('other')); await tick();
    finish({ expirationTime: new Date(Date.now() + 3600000).toISOString() }); await tick();
    expect(service.current().status).not.toBe('authenticated'); expect(service.current().scope).toBeGreaterThan(priorScope);
  });
  it('hides private routes immediately on logout, even before SDK storage finishes', async () => {
    service = createEmulatorSession(EMULATOR_CONFIG, 'localhost'); const owner = user(); emit(owner); await tick();
    let finish!: () => void;
    sdk.signOut.mockImplementationOnce(() => new Promise<void>(resolve => { finish = () => { emit(null); resolve(); }; }));
    const oldScope = service.current().scope, leaving = service.signOut();
    expect(service.current().status).toBe('checking'); expect(service.current().scope).toBeGreaterThan(oldScope);
    window.dispatchEvent(new Event('focus')); emit(owner); await tick();
    expect(service.current().status).toBe('checking');
    finish(); await leaving; expect(service.current().status).toBe('anonymous');
  });
  it('keeps access closed when observation or logout fails', async () => {
    service = createEmulatorSession(EMULATOR_CONFIG, 'localhost'); emit(user()); await tick();
    sdk.failed(); expect(service.current().status).toBe('error');
    sdk.signOut.mockRejectedValueOnce({ code: 'auth/web-storage-unsupported' });
    await expect(service.signOut()).rejects.toThrow('almacenamiento'); expect(service.current().status).toBe('error');
  });
});
