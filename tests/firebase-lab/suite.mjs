import { spawn } from 'node:child_process';
import { requireEmulators } from './guard.mjs';
requireEmulators();
async function run(args) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, args, { stdio: 'inherit', env: process.env });
    child.on('error', error => { console.error(error); resolve(1); });
    child.on('exit', code => resolve(code ?? 1));
  });
}
// Run browser recovery even when capability tests fail. Never mask a failed suite.
const rules = await run(['--test', '--test-concurrency=1', 'tests/firebase-lab/emulator.test.mjs']);
const browser = await run(['node_modules/@playwright/test/cli.js', 'test', '--config', 'tests/firebase-lab/playwright.config.mjs']);
console.log(JSON.stringify({ rulesExit: rules, browserRecoveryExit: browser }));
process.exitCode = rules || browser ? 1 : 0;
