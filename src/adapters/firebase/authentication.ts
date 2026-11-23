import { deleteApp, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence, connectAuthEmulator, initializeAuth, onIdTokenChanged,
  signInWithEmailAndPassword, signOut, type User,
} from 'firebase/auth';
import { LOCAL_AUTH_UID, requireLocalAuthentication, type Configuration } from '../../application/configuration';
import { AuthenticationError, authenticationMessage } from '../../application/authentication-errors';
import type { SessionPort, SessionState } from '../../application/ports';

// Imported dynamically only after configuration validation. No Firestore, Functions or Admin.
export function createEmulatorSession(configuration: Configuration, hostname: string): SessionPort {
  requireLocalAuthentication(configuration, hostname);
  if (configuration.mode !== 'emulator') throw new Error('LOCAL_AUTHENTICATION_ONLY');
  const app = initializeApp({ projectId: configuration.projectId, apiKey: 'demo-only-05b-1' }, 'mi-casa-auth-local-05b-1');
  const auth = initializeAuth(app, { persistence: browserLocalPersistence });
  // Must run synchronously after initializeAuth, before any asynchronous SDK operation.
  connectAuthEmulator(auth, `http://${configuration.authHost}`, { disableWarnings: true });

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
  async function validate(user: User | null, force = false): Promise<void> {
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
      if (user.uid !== LOCAL_AUTH_UID) throw { code: 'auth/unauthorized-local-user' };
      const token = await user.getIdTokenResult(force);
      if (disposed || attempt !== version || auth.currentUser !== user) return;
      const remaining = Date.parse(token.expirationTime) - Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0) throw { code: 'auth/user-token-expired' };
      validUntil = Date.parse(token.expirationTime);
      message = undefined;
      publish({ status: 'authenticated', scope, session: { uid: user.uid } });
      timer = setTimeout(() => { void validate(auth.currentUser, true); }, Math.min(remaining, 2_147_483_647));
    } catch (error) {
      if (disposed || attempt !== version) return;
      message = authenticationMessage(error);
      // Remove all visible state immediately. Network errors retain only the SDK session for retry.
      publish({ status: 'error', scope: state.scope + 1, message });
      const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
      if (['auth/unauthorized-local-user', 'auth/user-token-expired', 'auth/invalid-user-token', 'auth/user-disabled'].includes(String(code))) {
        try { await signOut(auth); } catch { /* Access stays closed even if local storage fails. */ }
      }
    }
  }
  const unsubscribe = onIdTokenChanged(auth, user => {
    const force = first; first = false;
    void validate(user, force);
  }, () => {
    ++version; clearTimer();
    publish({ status: 'error', scope: state.scope + 1, message: authenticationMessage(null) });
  });
  const recheck = async () => { await validate(auth.currentUser, true); };
  const onFocus = () => { if (!busy) void recheck(); };
  const onVisible = () => { if (document.visibilityState === 'visible') onFocus(); };
  window.addEventListener('focus', onFocus);
  window.addEventListener('online', onFocus);
  document.addEventListener('visibilitychange', onVisible);

  return {
    current: () => state,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async signIn(request) {
      if (disposed || busy || request.method !== 'password') throw new AuthenticationError(authenticationMessage(null));
      if (!request.email.trim().toLowerCase().endsWith('@example.test')) {
        throw new AuthenticationError(authenticationMessage({ code: 'auth/local-fixture-required' }));
      }
      busy = true; message = undefined;
      try { await signInWithEmailAndPassword(auth, request.email.trim(), request.password); }
      catch (error) { throw new AuthenticationError(authenticationMessage(error)); }
      finally { busy = false; }
    },
    async signOut() {
      if (disposed || busy) throw new AuthenticationError(authenticationMessage(null));
      busy = true; loggingOut = true; ++version; clearTimer(); message = undefined;
      publish({ status: 'checking', scope: state.scope + 1 });
      try { await signOut(auth); await validate(null); }
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
      await deleteApp(app);
    },
  };
}
