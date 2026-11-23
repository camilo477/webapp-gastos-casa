import { spawn } from 'node:child_process';
import { requireLab } from './functions/guard.mjs';
requireLab();
async function run(args) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, args, { stdio: 'inherit', env: process.env });
    child.on('error', () => resolve(1)); child.on('exit', code => resolve(code ?? 1));
  });
}
const integration = await run(['--test', '--test-concurrency=1', 'tests/firebase-trusted/emulator.test.mjs']);
const browser = await run(['node_modules/@playwright/test/cli.js', 'test', '--config', 'tests/firebase-trusted/playwright.config.mjs']);
console.log(JSON.stringify({ integrationExit: integration, browserExit: browser }));
process.exitCode = integration || browser ? 1 : 0;
