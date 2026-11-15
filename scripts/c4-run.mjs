import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../src/contract.mjs';
const work=path.join(ROOT,'artifacts','qualification','.c4-work');
fs.rmSync(work,{recursive:true,force:true});fs.mkdirSync(work,{recursive:true});
const base=0xC4A00000>>>0;
for(let i=0;i<10;i++){
 const out=path.join('artifacts','qualification','.c4-work',`runtime-${String(i).padStart(2,'0')}.json`);
 const seed=(base+i*0x9E3779B1)>>>0;
 const r=spawnSync(process.execPath,['scripts/c4-runtime-falsify.mjs','--cases','1000000','--seed',String(seed),'--output',out],{cwd:ROOT,stdio:'inherit'});
 if(r.status!==0)process.exit(r.status??1);
}
let r=spawnSync(process.execPath,['scripts/c4-session-falsify.mjs','--cases','1000000','--seed',String(0xC4B00000>>>0),'--output','artifacts/qualification/.c4-work/session.json'],{cwd:ROOT,stdio:'inherit'});
if(r.status!==0)process.exit(r.status??1);
r=spawnSync(process.execPath,['scripts/c4-combine.mjs','--dir','artifacts/qualification/.c4-work','--output','artifacts/qualification/c4-runtime.json'],{cwd:ROOT,stdio:'inherit'});
process.exit(r.status??1);
