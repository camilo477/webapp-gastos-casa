import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';
const profile=process.env.MI_CASA_READ_BROWSER_PROFILE;
if(profile!=='read'&&profile!=='auth-only')throw Error('READ_BROWSER_PROFILE_REQUIRED');
const project='mi-casa-camilo-test';
export default defineConfig({...base,testDir:'.',testMatch:profile==='read'?'read-release.spec.ts':'auth-only.spec.ts',timeout:45000,
 use:{...base.use,baseURL:'http://localhost:5175'},
 webServer:{command:profile==='read'?'npm run dev:inventory-read':'npm run dev:auth-test',url:'http://localhost:5175',reuseExistingServer:false,timeout:30000,
 env:{VITE_APP_MODE:'auth-test',VITE_FIREBASE_PROJECT_ID:project,VITE_FIREBASE_API_KEY:'fictitious-public-web-key-not-valid',VITE_FIREBASE_AUTH_DOMAIN:project+'.firebaseapp.com',VITE_FIREBASE_APP_ID:'1:1234567890:web:0123456789abcdef',VITE_AUTH_TEST_OWNER_UID:'release-owner-fixture',VITE_AUTH_TEST_PROVIDERS:'password',VITE_AUTH_TEST_GOOGLE_FLOW:'popup',VITE_AUTH_TEST_ORIGIN:'http://localhost:5175',VITE_AUTH_TEST_APPROVAL:'owner-approved-auth-only:'+project,VITE_FIRESTORE_READ_ENABLED:'true',VITE_FIRESTORE_READ_DATABASE:'(default)',VITE_FIRESTORE_READ_CONTRACT:'inventory-candidate-v1',VITE_FIRESTORE_READ_APPROVAL:'owner-approved-firestore-read-only:'+project+':(default)'}}});
