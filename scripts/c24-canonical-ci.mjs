/**
 * C24 exact canonical CI partition. All 36 original commands must run once,
 * with separate source- and plan-bound receipts. No ACTIVE implication.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const SHARDS=Object.freeze([
 {name:'foundation',from:0,to:3},
 {name:'boundaries',from:3,to:14},
 {name:'activation',from:14,to:22},
 {name:'semantics',from:22,to:29},
 {name:'recovery-c42',from:29,to:30},
 {name:'recovery-c43',from:30,to:31},
 {name:'final',from:31,to:36}
]);
export const PINNED_PLAN_SHA256='def96fb82a6cb55e096c212c57aa6b8b62d2e2d00d19fd386e48efcc71768947';
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
export function canonicalPlan(root=ROOT) {
 const p=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const original=p.scripts['qualify:canonical'];
 if(typeof original!=='string')throw Error('Missing canonical plan');
 const commands=original.split(' && ');
 if(commands.length!==36 || !commands.every(x=>/^npm (?:test|run [a-z0-9:._-]+)$/.test(x)))
  throw Error('Canonical command inventory changed');
 if(commands[0]!=='npm run runtime-root:verify'||commands[1]!=='npm test'||
    commands[2]!=='npm run check'||commands[29]!=='npm run falsify:c42'||
    commands[30]!=='npm run falsify:c43'||commands[35]!=='npm run falsify:c58')
  throw Error('Canonical ordering changed');
 const sha=digest(JSON.stringify(commands));
 if(sha!==PINNED_PLAN_SHA256)throw Error('Canonical plan digest changed');
 const indexes=SHARDS.flatMap(s=>Array.from({length:s.to-s.from},(_,i)=>s.from+i));
 if(indexes.length!==36||indexes.some((n,i)=>n!==i)||
   new Set(SHARDS.map(s=>s.name)).size!==SHARDS.length)
  throw Error('Canonical shards are incomplete or overlapping');
 return {commands,plan_sha256:sha,shards:SHARDS.map(s=>({...s,commands:commands.slice(s.from,s.to)}))};
}
export function receiptFor(name,sha,plan=canonicalPlan()) {
 if(!/^[0-9a-f]{40}$/.test(sha))throw Error('Invalid SHA');
 const s=plan.shards.find(x=>x.name===name);
 if(!s)throw Error('Unknown shard');
 return {schema:'ikant-c24-canonical-ci-receipt/v1',status:'PASS',source_sha:sha,
  plan_sha256:plan.plan_sha256,shard:s.name,from:s.from,to:s.to,commands:s.commands};
}
export function verifyReceipts(dir,sha,plan=canonicalPlan()) {
 const seen=new Set();
 for(const s of plan.shards){
  const file=path.join(dir,'c24-'+s.name+'.json');
  const actual=JSON.parse(fs.readFileSync(file,'utf8'));
  const expected=receiptFor(s.name,sha,plan);
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Receipt changed or wrong SHA: '+s.name);
  seen.add(s.name);
 }
 const extra=fs.readdirSync(dir).filter(x=>/^c24-.*\.json$/.test(x)&&!seen.has(x.slice(4,-5)));
 if(extra.length)throw Error('Unexpected receipt(s): '+extra.join(','));
 return {status:'PASS',source_sha:sha,plan_sha256:plan.plan_sha256,
  shards:seen.size,canonical_commands:plan.commands.length,claim:'CI_COVERAGE_NOT_NATIVE_ACTIVE'};
}
function checkedSha(){
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
 if(!/^[a-f0-9]{40}$/.test(sha)||(process.env.GITHUB_SHA&&sha!==process.env.GITHUB_SHA))
  throw Error('Git checkout does not match event SHA');
 return sha;
}
function runShard(name,dir) {
 const plan=canonicalPlan(),s=plan.shards.find(x=>x.name===name);
 if(!s)throw Error('Unknown shard');
 const sha=checkedSha();
 for(const [i,cmd] of s.commands.entries()){
  console.log('C24 '+name+' '+(i+1)+'/'+s.commands.length+' '+cmd);
  const args=cmd.split(' ').slice(1);
  const r=spawnSync('npm',args,{cwd:ROOT,stdio:'inherit',shell:false});
  if(r.error||r.status!==0||r.signal)throw Error('Canonical command failed: '+cmd);
 }
 fs.mkdirSync(dir,{recursive:true});
 const f=path.join(dir,'c24-'+name+'.json');
 fs.writeFileSync(f,JSON.stringify(receiptFor(name,sha,plan))+'\n',{flag:'wx',mode:0o600});
 console.log('Receipt:',f);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try{
  const [op,id]=process.argv.slice(2);
  if(op==='audit'){
   const p=canonicalPlan();console.log(JSON.stringify({status:'PASS',commands:p.commands.length,shards:p.shards.length,plan_sha256:p.plan_sha256}));
  } else if(op==='run')runShard(id,process.argv[4]||process.env.RUNNER_TEMP||'/tmp');
  else if(op==='verify-receipts')console.log(JSON.stringify(verifyReceipts(id,checkedSha())));
  else throw Error('Usage: audit | run SHARD DIRECTORY | verify-receipts DIRECTORY');
 }catch(e){console.error('C24 FAIL:',e.message);process.exitCode=1;}
}
