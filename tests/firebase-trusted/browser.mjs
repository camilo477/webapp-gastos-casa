import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithCustomToken } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { PROJECT, UID } from './functions/guard.mjs';
import { stable } from './functions/contract.mjs';
import { purchase } from './fixtures.mjs';
const app = initializeApp({ projectId: PROJECT, apiKey: 'demo-only-04c' });
const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings: true });
const part = o => btoa(JSON.stringify(o)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
await signInWithCustomToken(auth, `${part({ alg: 'none', typ: 'JWT' })}.${part({ uid: UID,
  aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit' })}.`);
const functions = getFunctions(app, 'us-central1'); connectFunctionsEmulator(functions, '127.0.0.1', 5104);
const call = async (name, data) => (await httpsCallable(functions, name)(data)).data;
const key = 'mi-casa-04c-fictional-attempt';
async function fingerprint(intent) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stable(intent)));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}
globalThis.lab = {
  phase: 'ready', result: null,
  async start() {
    const intent = purchase('browser-demo');
    const receipt = { uid: auth.currentUser.uid, operationId: intent.operationId, confirmation: 'uncertain', intent,
      intentHash: await fingerprint(intent) };
    localStorage.setItem(key, JSON.stringify(receipt)); this.phase = 'sending';
    this.pending = call('confirmPurchase', intent).then(result => {
      this.result = result; receipt.confirmation = 'confirmed'; localStorage.setItem(key, JSON.stringify(receipt)); this.phase = 'confirmed';
    }).catch(() => { this.phase = 'uncertain'; });
  },
  receipt() { return JSON.parse(localStorage.getItem(key)); },
  async recover() {
    const receipt = this.receipt();
    if (receipt.uid !== auth.currentUser.uid || receipt.operationId !== receipt.intent.operationId ||
      receipt.intentHash !== await fingerprint(receipt.intent)) throw new Error('INVALID_RECEIPT');
    const result = await call('lookupOperation', { operationId: receipt.operationId });
    if (result.status === 'confirmed' && result.intentHash !== receipt.intentHash) throw new Error('IDEMPOTENCY_CONFLICT');
    return result.status;
  },
  async retry() { await this.recover(); return call('confirmPurchase', this.receipt().intent); },
};
