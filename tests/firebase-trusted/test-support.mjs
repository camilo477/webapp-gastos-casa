import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFile } from 'node:fs/promises';
import { doc, setDoc, getDocFromServer, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { PROJECT, UID, requireLab } from './functions/guard.mjs';
import { product } from './fixtures.mjs';
requireLab();
export async function environment() {
  return initializeTestEnvironment({ projectId: PROJECT, firestore: { host: '127.0.0.1', port: 8286,
    rules: await readFile(new URL('./firestore.rules', import.meta.url), 'utf8') } });
}
export const productRef = (db, id = 'p0') => doc(db, `users/${UID}/products/${id}`);
export const operationRef = (db, id = 'purchase-demo') => doc(db, `users/${UID}/operations/${id}`);
export async function seed(env, count = 1, overrides = {}) {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (let start = 0; start < count; start += 100) {
      await Promise.all(Array.from({ length: Math.min(100, count - start) }, (_, j) => {
        const i = start + j; return setDoc(productRef(db, `p${i}`), { ...product(i, overrides), updatedAt: serverTimestamp() });
      }));
    }
  });
}
export const readProduct = async (db, id = 'p0') => (await getDocFromServer(productRef(db, id))).data();
export const readOperation = async (db, id = 'purchase-demo') => (await getDocFromServer(operationRef(db, id))).data();
export async function snapshot(db) {
  const result = {};
  for (const c of ['products', 'operations']) result[c] = (await getDocs(collection(db, `users/${UID}/${c}`))).docs.map(d => ({ id: d.id, data: d.data() }));
  return JSON.stringify(result);
}
