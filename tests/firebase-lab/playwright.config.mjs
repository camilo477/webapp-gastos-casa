import base from '../../playwright.config.ts';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: 'browser.spec.mjs', workers: 1, fullyParallel: false, retries: 0,
  timeout: 60000, reporter: 'list', outputDir: '../../test-results/firebase-lab',
  use: { ...base.use, baseURL: 'http://127.0.0.1:4186' },
  webServer: { command: 'node tests/firebase-lab/browser-server.mjs', url: 'http://127.0.0.1:4186',
    reuseExistingServer: false, timeout: 60000, cwd: '../..' },
});
