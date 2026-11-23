import { spawn } from 'node:child_process';
// SDK browser routes are fulfilled by Playwright, never by a live Firebase endpoint.
for(const profile of ['read','auth-only']){
 const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test','--config','tests/firebase-read-release/playwright.config.ts'],{stdio:'inherit',env:{...process.env,MI_CASA_READ_BROWSER_PROFILE:profile}});child.once('error',reject);child.once('exit',resolve);for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>child.kill(signal));});
 if(code!==0){process.exitCode=typeof code==='number'?code:1;break;}
}
