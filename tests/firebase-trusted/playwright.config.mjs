import { defineConfig } from '@playwright/test';
import base from '../../playwright.config.ts';
export default defineConfig({ testDir: '.', testMatch: 'browser.spec.mjs', workers: 1, fullyParallel: false, retries: 0,
  timeout: 60000, reporter: 'list', outputDir: '../../test-results/firebase-trusted',
  use: { ...base.use, baseURL: 'http://127.0.0.1:4187' },
  webServer: { command: 'node tests/firebase-trusted/browser-server.mjs', cwd: '../..',
    url: 'http://127.0.0.1:4187', reuseExistingServer: false, timeout: 60000 },
});
