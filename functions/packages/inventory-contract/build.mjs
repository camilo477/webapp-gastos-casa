import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Repeated preflights must not rewrite identical modules while a local browser is open.
const root=fileURLToPath(new URL('.',import.meta.url)),require=createRequire(import.meta.url);
const hash=createHash('sha256').update(['src/index.ts','tsconfig.json','package.json','build.mjs'].map(name=>readFileSync(join(root,name))).join('\0')).update(require('typescript/package.json').version).digest('hex');
const output=join(root,'lib'),stamp=join(output,'.build-hash');
if(existsSync(stamp)&&readFileSync(stamp,'utf8')===hash&&['index.js','index.d.ts'].every(name=>existsSync(join(output,name))))process.exit(0);
mkdirSync(output,{recursive:true});
const temporary=join(output,'.compile-'+process.pid);
try {
 const result=spawnSync(process.execPath,[require.resolve('typescript/bin/tsc'),'-p',join(root,'tsconfig.json'),'--outDir',temporary],{stdio:'inherit'});
 if(result.status!==0)process.exitCode=result.status??1;
 else {
  for(const name of ['index.js','index.d.ts']){
   const target=join(output,name),source=join(temporary,name);
   if(!existsSync(target)||!readFileSync(target).equals(readFileSync(source)))renameSync(source,target);
  }
  const {writeFileSync}=await import('node:fs');
  const next=stamp+'.'+process.pid;writeFileSync(next,hash);renameSync(next,stamp);
 }
} finally {rmSync(temporary,{recursive:true,force:true});}
