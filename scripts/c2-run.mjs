import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=3339841538;
function run(args){const p=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});if(p.status!==0)process.exit(p.status??1);}
for(let i=0;i<10;i++){const seed=(base+Math.imul(i,7919))>>>0;run(['scripts/c2-falsify.mjs','--cases','1000000','--tail','0','--compression','0','--seed',String(seed),'--output',`artifacts/qualification/c2-shard-${String(i).padStart(2,'0')}.json`]);}
run(['scripts/c2-falsify.mjs','--cases','1000000','--tail','1000000','--compression','1000000','--seed',String((base^0x5a7c02de)>>>0),'--output','artifacts/qualification/c2-saturation.json']);
run(['scripts/c2-combine.mjs']);
