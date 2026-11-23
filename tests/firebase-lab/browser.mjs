import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { PROJECT, UID } from './guard.mjs';
import { confirm, reconcile } from './client.mjs';
import { intent } from './model.mjs';

globalThis.__FIREBASE_LAB_ENV__ = { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8186', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', GCLOUD_PROJECT: PROJECT };
const app = initializeApp({ projectId: PROJECT, apiKey: 'demo-only-not-a-key' });
const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const part = object => btoa(JSON.stringify(object)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = `${part({ alg: 'none', typ: 'JWT' })}.${part({ uid: UID, aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit' })}.`;
await signInWithCustomToken(auth, token);
const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8186);
const key = 'mi-casa-04b-fictional-attempt';
globalThis.lab = {
  phase: 'ready', error: null,
  start({ pauseBeforeWrite = false } = {}) {
    const receipt = { uid: UID, operationId: 'browser-demo', confirmation: 'uncertain', intent: intent('browser-demo') };
    localStorage.setItem(key, JSON.stringify(receipt));
    this.phase = 'sending';
    this.pending = confirm(db, receipt.intent, { beforeWrite: async () => {
      if (pauseBeforeWrite) { this.phase = 'before-write'; await new Promise(() => {}); }
    } }).then(result => {
      receipt.confirmation = 'confirmed'; localStorage.setItem(key, JSON.stringify(receipt)); this.phase = result;
    }).catch(error => { this.error = error.message; this.phase = 'uncertain'; });
  },
  async recover() { return reconcile(db, JSON.parse(localStorage.getItem(key))); },
  async retry() { return confirm(db, JSON.parse(localStorage.getItem(key)).intent); },
  receipt() { return JSON.parse(localStorage.getItem(key)); },
};
