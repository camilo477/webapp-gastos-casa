import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { LOCAL, requireRuntime, requireLocal } from '../lib/config/local.js';

// Evaluate the future deny-all artifact locally; never create/deploy a real database.
requireRuntime(); requireLocal();
let environment;
before(async () => {
  environment = await initializeTestEnvironment({ projectId: LOCAL.projectId, firestore: { host: '127.0.0.1', port: 8386,
    rules: await readFile(new URL('../../security/auth-test.firestore.rules', import.meta.url), 'utf8') } });
});
after(async () => { await environment?.cleanup(); });
for (const uid of [null, 'unit-authorized-owner', LOCAL.uid, 'different-owner']) {
  test(`real-test data boundary denies all access even with client identity: ${uid ?? 'anonymous'}`, async () => {
    const actor = uid ? environment.authenticatedContext(uid) : environment.unauthenticatedContext();
    const db = actor.firestore();
    for (const path of ['users/unit-authorized-owner/products/example', 'users/unit-authorized-owner/operations/example', 'unknown/example']) {
      const ref = doc(db, path);
      await assertFails(getDoc(ref)); await assertFails(setDoc(ref, { fictitious: true }));
    }
  });
}
