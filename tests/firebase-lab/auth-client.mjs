import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithCustomToken } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, terminate } from 'firebase/firestore';
import { PROJECT, UID, requireEmulators } from './guard.mjs';

// Auth Emulator accepts unsigned custom tokens. These have no validity in production.
function demoCustomToken(uid) {
  const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'none', typ: 'JWT' })}.${part({ uid, aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600, iss: 'demo@example.invalid', sub: 'demo@example.invalid' })}.`;
}
export async function authClient(uid = UID) {
  requireEmulators();
  const app = initializeApp({ projectId: PROJECT, apiKey: 'demo-only-not-a-key' }, `lab-${crypto.randomUUID()}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8186);
  try {
    const credential = await signInWithCustomToken(auth, demoCustomToken(uid));
    return { db, uid: credential.user.uid, token: await credential.user.getIdToken(),
      close: async () => { await terminate(db); await deleteApp(app); } };
  } catch (error) { await terminate(db); await deleteApp(app); throw error; }
}
