import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';

export default defineConfig({
  ...base,
  testDir: '.',
  testMatch: 'authentication.spec.ts',
  timeout: 60000,
  use: { ...base.use, baseURL: 'http://127.0.0.1:5174' },
  webServer: [
    { command: 'npm run dev:emulator', url: 'http://127.0.0.1:5174', reuseExistingServer: false, timeout: 20000 },
    { command: 'npm run dev -- --port 4175 --strictPort', url: 'http://127.0.0.1:4175', reuseExistingServer: false, timeout: 20000, env: { VITE_APP_MODE: 'demo' } },
    { command: 'npm run dev:auth-test', url: 'http://localhost:5175', reuseExistingServer: false, timeout: 20000,
      env: { VITE_APP_MODE: 'auth-test', VITE_AUTH_TEST_APPROVAL: '', VITE_FIREBASE_PROJECT_ID: 'example-auth-test' } },
  ],
});
