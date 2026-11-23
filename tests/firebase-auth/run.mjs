import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { requireRuntime } from '../../functions/lib/config/local.js';
import { checkLocalConfig, runnerEnvironment } from '../../functions/scripts/local-config.mjs';

requireRuntime();
const local = await checkLocalConfig(), env = runnerEnvironment(process.env);
const root = fileURLToPath(new URL('../../', import.meta.url));
const child = spawn(process.execPath, [root + 'functions/node_modules/firebase-tools/lib/bin/firebase.js',
  '--config', 'firebase.local.json', '--project', local.projectId, 'emulators:exec', '--only', 'auth,firestore',
  'node functions/scripts/seed-auth.mjs && node node_modules/@playwright/test/cli.js test --config tests/firebase-auth/playwright.config.ts && node --test functions/tests/auth-boundary.test.mjs'],
{ cwd: root, stdio: 'inherit', env });
child.on('error', () => { console.error('LOCAL_AUTH_TEST_START_FAILED'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
