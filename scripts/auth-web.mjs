import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Explicit opt-in, independent of local .env files. No remote configuration accepted.
const env = { ...process.env, VITE_APP_MODE: 'emulator', VITE_FIREBASE_PROJECT_ID: 'demo-mi-casa-05a',
  VITE_AUTH_EMULATOR_HOST: '127.0.0.1:9299', VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1:8386',
  VITE_FUNCTIONS_EMULATOR_HOST: '127.0.0.1:5205' };
const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
  '--host', '127.0.0.1', '--port', '5174', '--strictPort'], { stdio: 'inherit', env });
child.on('error', () => { console.error('LOCAL_AUTH_WEB_START_FAILED'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
