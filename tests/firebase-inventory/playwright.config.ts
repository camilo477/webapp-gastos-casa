import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';
export default defineConfig({ ...base, testDir:'.', testMatch:'inventory.spec.ts', timeout:60000,
  use:{...base.use,baseURL:'http://127.0.0.1:5174'},
  webServer:[{command:'npm run dev:emulator:legacy',url:'http://127.0.0.1:5174',reuseExistingServer:false,timeout:30000},
    {command:'npm run dev -- --port 4175 --strictPort',url:'http://127.0.0.1:4175',reuseExistingServer:false,timeout:30000,env:{VITE_APP_MODE:'demo'}}],
});
