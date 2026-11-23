import { deleteApp, initializeApp } from 'firebase/app';
import { browserLocalPersistence, connectAuthEmulator, initializeAuth, onIdTokenChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { LOCAL_AUTH_UID, requireLocalAuthentication, type Configuration } from '../../application/configuration';
import { createSessionController } from '../../application/session-controller';

// Emulator only. No provider popup, real configuration, Firestore, Functions or Admin.
export function createEmulatorSession(configuration: Configuration, hostname: string) {
  requireLocalAuthentication(configuration, hostname);
  if (configuration.mode !== 'emulator') throw new Error('LOCAL_AUTHENTICATION_ONLY');
  const app = initializeApp({ projectId: configuration.projectId, apiKey: 'demo-only-05b-1' }, 'mi-casa-auth-local-05b-1');
  const auth = initializeAuth(app, { persistence: browserLocalPersistence });
  connectAuthEmulator(auth, `http://${configuration.authHost}`, { disableWarnings: true });
  return createSessionController({
    currentUser: () => auth.currentUser,
    observe: (next, error) => onIdTokenChanged(auth, next, error),
    async signIn(request) {
      if (request.method !== 'password') throw { code: 'auth/method-not-enabled' };
      if (!request.email.trim().toLowerCase().endsWith('@example.test')) throw { code: 'auth/local-fixture-required' };
      await signInWithEmailAndPassword(auth, request.email.trim(), request.password);
    },
    signOut: () => signOut(auth), dispose: () => deleteApp(app),
  }, LOCAL_AUTH_UID, { mode: 'emulator', methods: ['password'] });
}
