import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PROJECT } from './guard.mjs';

if (['GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_CONFIG', 'FIREBASE_TOKEN'].some(key => process.env[key])) {
  throw new Error('LAB_ONLY: remove credentials from the lab environment');
}
const mode = process.argv[2];
if (!['test', 'start'].includes(mode)) throw new Error('Use test or start');
const root = fileURLToPath(new URL('../../', import.meta.url));
const args = ['--config', 'tests/firebase-lab/firebase.json', '--project', PROJECT,
  mode === 'test' ? 'emulators:exec' : 'emulators:start', '--only', 'auth,firestore'];
if (mode === 'test') args.push('node tests/firebase-lab/suite.mjs');
const child = spawn(process.execPath, [root + 'node_modules/firebase-tools/lib/bin/firebase.js', ...args], {
  cwd: root, stdio: 'inherit', env: { ...process.env, GCLOUD_PROJECT: PROJECT,
    GOOGLE_CLOUD_PROJECT: PROJECT, CI: 'true', FIREBASE_CLI_DISABLE_TELEMETRY: 'true' },
});
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', (code, signal) => { process.exitCode = signal ? 1 : (code ?? 1); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
