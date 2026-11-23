import { AuthenticationError, authenticationMessage } from './authentication-errors';
import type { SessionOptions, SessionPort, SessionState, SignInRequest } from './ports';

export interface SessionToken { expirationTime: string; claims?: Readonly<Record<string, unknown>> }
export interface SessionIdentity { uid: string; getIdTokenResult(force?: boolean): Promise<SessionToken> }
export interface SessionDriver {
  currentUser(): SessionIdentity | null;
  observe(next: (user: SessionIdentity | null) => void, error: (cause: unknown) => void): () => void;
  signIn(request: SignInRequest): Promise<void>;
  signOut(): Promise<void>;
  dispose(): Promise<void>;
  ready?: Promise<void>;
  validateToken?(token: SessionToken, user: SessionIdentity): void;
}

// Session lifecycle shared by the isolated adapters; no Firebase imports or tokens in React state.
export function createSessionController(driver: SessionDriver, ownerUid: string, options: SessionOptions): SessionPort {
  let state: SessionState = { status: 'checking', scope: 0 };
  let identity: string | null = null, version = 0, validUntil = 0, disposed = false, first = true, busy = false, loggingOut = false;
  let message: string | undefined, timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: SessionState) => {
    if (disposed) return;
    state = next;
    for (const listener of listeners) listener();
  };
  const clearTimer = () => { clearTimeout(timer); timer = undefined; };
  async function validate(user: SessionIdentity | null, force = false): Promise<void> {
    if (disposed || (loggingOut && user)) return;
    const attempt = ++version;
    clearTimer();
    const scope = state.scope + (identity !== (user?.uid ?? null) ? 1 : 0);
    if (!user && identity && !loggingOut && !message) message = authenticationMessage({ code: 'auth/user-token-expired' });
    identity = user?.uid ?? null;
    if (!user) { publish({ status: 'anonymous', scope, message }); return; }
    // A same-identity background check must not unmount an in-progress form.
    // Initial, changed or expired identities remain hidden until validation.
    if (state.status !== 'authenticated' || state.session.uid !== user.uid || validUntil <= Date.now()) {
      publish({ status: 'checking', scope });
    }
    try {
      if (user.uid !== ownerUid) throw { code: options.mode === 'emulator' ? 'auth/unauthorized-local-user' : 'auth/unauthorized-user' };
      const token = await user.getIdTokenResult(force);
      if (disposed || attempt !== version || driver.currentUser() !== user) return;
      driver.validateToken?.(token, user);
      const remaining = Date.parse(token.expirationTime) - Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0) throw { code: 'auth/user-token-expired' };
      validUntil = Date.parse(token.expirationTime);
      message = undefined;
      publish({ status: 'authenticated', scope, session: { uid: user.uid } });
      timer = setTimeout(() => { void validate(driver.currentUser(), true); }, Math.min(remaining, 2_147_483_647));
    } catch (error) {
      if (disposed || attempt !== version) return;
      message = authenticationMessage(error);
      // Remove all visible state immediately. Network errors retain only the SDK session for retry.
      publish({ status: 'error', scope: state.scope + 1, message });
      const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
      if (['auth/unauthorized-user', 'auth/unauthorized-local-user', 'auth/user-token-expired', 'auth/invalid-user-token', 'auth/user-disabled'].includes(String(code))) {
        try { await driver.signOut(); } catch { /* Access stays closed even if local storage fails. */ }
      }
    }
  }
  let unsubscribe = () => {}, initializationFailed = false;
  const observe = () => { if (disposed) return; initialized = true; unsubscribe = driver.observe(user => {
    const force = first; first = false;
    void validate(user, force);
  }, error => {
    ++version; clearTimer();
    publish({ status: 'error', scope: state.scope + 1, message: authenticationMessage(error) });
  }); };
  let initialized = !driver.ready;
  let recovery: Promise<void> | undefined;
  const recoverInitialization = async () => {
    if (recovery) return recovery;
    recovery = (async () => {
      try { await driver.signOut(); if (!disposed) { initializationFailed = false; observe(); } }
      catch (error) { publish({ status: 'error', scope: state.scope + 1, message: authenticationMessage(error) }); }
    })();
    try { await recovery; } finally { recovery = undefined; }
  };
  if (driver.ready) void driver.ready.then(observe, error => {
    if (disposed) return;
    message = authenticationMessage(error);
    publish({ status: 'error', scope: state.scope + 1, message });
    initializationFailed = true;
    void recoverInitialization();
  });
  else observe();
  const recheck = async () => {
    if (!initialized) { if (initializationFailed) await recoverInitialization(); return; }
    await validate(driver.currentUser(), true);
  };
  const onFocus = () => { if (!busy) void recheck(); };
  const onVisible = () => { if (document.visibilityState === 'visible') onFocus(); };
  window.addEventListener('focus', onFocus);
  window.addEventListener('online', onFocus);
  document.addEventListener('visibilitychange', onVisible);

  return {
    options,
    current: () => state,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async signIn(request) {
      if (disposed || busy || !initialized) throw new AuthenticationError(authenticationMessage(null));
      if (!options.methods.includes(request.method)) throw new AuthenticationError(authenticationMessage({ code: 'auth/method-not-enabled' }));
      busy = true; message = undefined;
      try { await driver.signIn(request); }
      catch (error) { throw new AuthenticationError(authenticationMessage(error)); }
      finally { busy = false; }
    },
    async signOut() {
      if (disposed || busy) throw new AuthenticationError(authenticationMessage(null));
      busy = true; loggingOut = true; ++version; clearTimer(); message = undefined;
      publish({ status: 'checking', scope: state.scope + 1 });
      try { await driver.signOut(); await validate(null); }
      catch (error) {
        publish({ status: 'error', scope: state.scope + 1, message: authenticationMessage(error) });
        throw new AuthenticationError(authenticationMessage(error));
      } finally { busy = false; loggingOut = false; }
    },
    recheck,
    async dispose() {
      if (disposed) return;
      disposed = true; ++version; clearTimer(); unsubscribe(); listeners.clear();
      window.removeEventListener('focus', onFocus); window.removeEventListener('online', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      await driver.dispose();
    },
  };
}
