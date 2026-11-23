import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';
export default defineConfig({...base,testDir:'.',testMatch:'candidate.spec.ts',timeout:60000,use:{...base.use,baseURL:'http://127.0.0.1:5174'},webServer:{command:'npm run dev:emulator',url:'http://127.0.0.1:5174',reuseExistingServer:false,timeout:30000}});
