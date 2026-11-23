import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { requireLocal, requireRuntime } from '../lib/config/local.js';
import { checkLocalConfig, runnerEnvironment } from './local-config.mjs';
import { owner, other } from '../../tests/firebase-auth/fixtures.mjs';

requireRuntime();
const local = await checkLocalConfig();
// emulators:exec supplies its own public FIREBASE_CONFIG. Validate it with the
// same server guard; do not confuse it with credentials or silently discard it.
const { FIREBASE_CONFIG: firebaseConfig, ...parent } = process.env;
const checked = runnerEnvironment(parent);
requireLocal({ ...checked, FIREBASE_CONFIG: firebaseConfig });
Object.assign(process.env, checked);
const app = initializeApp({ projectId: local.projectId }, 'seed-local-auth-05b1');
try {
  const auth = getAuth(app);
  for (const fixture of [owner, other]) {
    const existing = await auth.getUser(fixture.uid).catch(error => {
      if (error.code !== 'auth/user-not-found') throw error;
      return null;
    });
    if (existing && existing.email !== fixture.email) throw new Error('FIXTURE_IDENTITY_CONFLICT');
    if (existing) await auth.updateUser(fixture.uid, { password: fixture.password, disabled: false });
    else await auth.createUser(fixture);
  }
  console.log('Fictitious local Auth accounts ready. No real accounts or financial data created.');
} finally { await deleteApp(app); }
