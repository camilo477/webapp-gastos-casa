import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// An explicit command selects the mode; it never supplies real-project approval or SDK values.
const mode = process.argv[2];
if (mode !== undefined && mode !== 'auth-test') throw new Error('UNSUPPORTED_AUTH_WEB_MODE');
const test = mode === 'auth-test';
const env = test ? { ...process.env, VITE_APP_MODE: 'auth-test' } : { ...process.env, VITE_APP_MODE: 'emulator', VITE_FIREBASE_PROJECT_ID: 'demo-mi-casa-05a',
  VITE_AUTH_EMULATOR_HOST: '127.0.0.1:9299', VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1:8386',
  VITE_FUNCTIONS_EMULATOR_HOST: '127.0.0.1:5205' };
const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
  '--mode', test ? 'auth-test' : 'development', '--host', test ? 'localhost' : '127.0.0.1', '--port', test ? '5175' : '5174', '--strictPort'], { stdio: 'inherit', env });
child.on('error', () => { console.error('LOCAL_AUTH_WEB_START_FAILED'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
