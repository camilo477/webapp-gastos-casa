import { deleteApp, initializeApp } from 'firebase/app';
import { browserLocalPersistence, browserPopupRedirectResolver, getRedirectResult, GoogleAuthProvider,
  initializeAuth, onIdTokenChanged, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { ConfigurationError, requireTestAuthentication, type Configuration } from '../../application/configuration';
import { createSessionController } from '../../application/session-controller';

// Prepared for an owner-authorized test project. Never called by demo/emulator.
// No Admin, Firestore, Functions, account registration or OAuth token extraction.
export function createAuthTestSession(configuration: Configuration, origin: string) {
  if (configuration.mode !== 'auth-test') throw new ConfigurationError('AUTH_TEST_ONLY');
  requireTestAuthentication(configuration, origin);
  const { projectId, apiKey, authDomain, appId, ownerUid, methods, googleFlow } = configuration;
  const app = initializeApp({ projectId, apiKey, authDomain, appId }, `mi-casa-auth-test:${projectId}`);
  const auth = initializeAuth(app, { persistence: browserLocalPersistence, popupRedirectResolver: browserPopupRedirectResolver });
  auth.languageCode = 'es';
  // No auto-detection or fallback. Redirect is allowed only with a same-origin helper.
  const ready = methods.includes('google') && googleFlow === 'redirect'
    ? getRedirectResult(auth).then(() => {}) : undefined;
  return createSessionController({
    currentUser: () => auth.currentUser,
    observe: (next, error) => onIdTokenChanged(auth, next, error),
    ready,
    validateToken(token, user) {
      if (token.claims?.aud !== projectId || token.claims?.iss !== `https://securetoken.google.com/${projectId}` || token.claims?.sub !== user.uid) {
        throw { code: 'auth/invalid-user-token' };
      }
    },
    async signIn(request) {
      if (request.method === 'password') {
        await signInWithEmailAndPassword(auth, request.email.trim(), request.password);
      } else {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        // Default identity scopes only. Never request Gmail, Drive or Contacts.
        if (googleFlow === 'redirect') await signInWithRedirect(auth, provider);
        else await signInWithPopup(auth, provider);
      }
    },
    signOut: () => signOut(auth), dispose: () => deleteApp(app),
  }, ownerUid, { mode: 'auth-test', methods });
}
