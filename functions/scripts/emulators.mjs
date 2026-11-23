import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { requireRuntime } from '../lib/config/local.js';
import { checkLocalConfig, runnerEnvironment } from './local-config.mjs';

requireRuntime();
const mode = process.argv[2];
if (!['start', 'test'].includes(mode) || process.argv.length !== 3) throw new Error('ONLY_START_OR_TEST_SUPPORTED');
const local = await checkLocalConfig(), env = runnerEnvironment(process.env);
const root = fileURLToPath(new URL('../../', import.meta.url));
const cli = fileURLToPath(new URL('../node_modules/firebase-tools/lib/bin/firebase.js', import.meta.url));
const args = [cli, '--config', 'firebase.local.json', '--project', local.projectId,
  mode === 'test' ? 'emulators:exec' : 'emulators:start', '--only', 'auth,firestore,functions'];
if (mode === 'test') args.push('node --test --test-concurrency=1 functions/tests/emulator.test.mjs');
const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit', env });
let stopSignal;
child.on('error', () => { console.error('LOCAL_EMULATOR_START_FAILED'); process.exitCode = 1; });
child.on('exit', (code, signal) => {
  const interrupted = stopSignal ?? signal;
  process.exitCode = interrupted === 'SIGINT' ? 130 : interrupted === 'SIGTERM' ? 143 : code ?? 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { stopSignal = signal; child.kill(signal); });
