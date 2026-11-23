import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PROJECT } from './functions/guard.mjs';
if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG || process.env.FIREBASE_TOKEN) throw new Error('REMOVE_CREDENTIALS');
const mode = process.argv[2]; if (!['test', 'start'].includes(mode)) throw new Error('Use test or start');
const root = fileURLToPath(new URL('../../', import.meta.url));
const args = ['--config', 'tests/firebase-trusted/firebase.json', '--project', PROJECT,
  mode === 'test' ? 'emulators:exec' : 'emulators:start', '--only', 'auth,firestore,functions'];
if (mode === 'test') args.push('node tests/firebase-trusted/suite.mjs');
const child = spawn(process.execPath, [root + 'node_modules/firebase-tools/lib/bin/firebase.js', ...args], {
  cwd: root, stdio: 'inherit', env: { ...process.env, GCLOUD_PROJECT: PROJECT, GOOGLE_CLOUD_PROJECT: PROJECT,
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8286', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199',
    // File-based discovery avoids the SDK's transient HTTP discovery listener.
    FIREBASE_FUNCTIONS_DISCOVERY_OUTPUT_PATH: 'true',
    CI: 'true', FIREBASE_CLI_DISABLE_TELEMETRY: 'true' },
});
child.on('error', e => { console.error(e.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
