import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LOCAL } from '../lib/config/local.js';

export async function checkLocalConfig(value) {
  const config = value ?? JSON.parse(await readFile(new URL('../../firebase.local.json', import.meta.url), 'utf8'));
  assert.deepEqual(config, {
    functions: [{ source: 'functions', codebase: 'mi-casa-local-05a', runtime: 'nodejs24' }],
    firestore: { rules: 'functions/firestore.rules', indexes: 'functions/firestore.indexes.json' },
    emulators: {
      auth: { host: '127.0.0.1', port: 9299 },
      firestore: { host: '127.0.0.1', port: 8386, websocketPort: 9350 },
      functions: { host: '127.0.0.1', port: 5205 },
      hub: { host: '127.0.0.1', port: 4406 }, logging: { host: '127.0.0.1', port: 4506 },
      eventarc: { host: '127.0.0.1', port: 9400 }, tasks: { host: '127.0.0.1', port: 9500 },
      ui: { enabled: false }, singleProjectMode: true,
    },
  }, 'LOCAL_CONFIG_CHANGED: review guards before changing endpoints or sources');
  return LOCAL;
}
export function runnerEnvironment(env) {
  for (const key of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_CONFIG', 'FIREBASE_TOKEN', 'GOOGLE_OAUTH_ACCESS_TOKEN', 'FIREBASE_SERVICE_ACCOUNT']) {
    if (env[key]) throw new Error('REMOVE_CREDENTIALS_OR_EXTERNAL_CONFIG');
  }
  const required = { MI_CASA_ENV: 'emulator', FUNCTIONS_EMULATOR: 'true', GCLOUD_PROJECT: LOCAL.projectId, GOOGLE_CLOUD_PROJECT: LOCAL.projectId,
    FIRESTORE_EMULATOR_HOST: LOCAL.firestoreHost, FIREBASE_AUTH_EMULATOR_HOST: LOCAL.authHost };
  for (const [key, expected] of Object.entries(required)) if (env[key] && env[key] !== expected) throw new Error('CONFLICTING_LOCAL_ENVIRONMENT');
  return { ...env, ...required, FIREBASE_FUNCTIONS_DISCOVERY_OUTPUT_PATH: 'true',
    CI: 'true', FIREBASE_CLI_DISABLE_TELEMETRY: 'true' };
}
