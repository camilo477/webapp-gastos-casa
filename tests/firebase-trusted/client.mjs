import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, terminate } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { PROJECT, UID, requireLab } from './functions/guard.mjs';
export async function client(uid = UID) {
  requireLab();
  const app = initializeApp({ projectId: PROJECT, apiKey: 'demo-only-04c' }, crypto.randomUUID());
  const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings: true });
  const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8286);
  const functions = getFunctions(app, 'us-central1'); connectFunctionsEmulator(functions, '127.0.0.1', 5104);
  if (uid) {
    const part = v => Buffer.from(JSON.stringify(v)).toString('base64url');
    const token = `${part({ alg: 'none', typ: 'JWT' })}.${part({ uid,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit' })}.`;
    await signInWithCustomToken(auth, token);
  }
  return { db, auth, call: async (name, input) => (await httpsCallable(functions, name)(input)).data,
    close: async () => { await terminate(db); await deleteApp(app); } };
}
