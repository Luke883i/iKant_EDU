import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PE_LEAVES,PE_CONTRACT,validatePEReticle,assessPE,minimalPENext,
 requiredPEMessages} from '../host/project-pe-retrograde.mjs';
import {stressPE} from '../scripts/project-pe-retrograde-falsify.mjs';
import {preparePEC72Stage,preparePEPostEdu} from '../scripts/project-pe-original-bridge.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8'}).trim();
const HEAD=git('rev-parse','HEAD'),TREE=git('rev-parse','HEAD^{tree}');
const FILES=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
 'host/project-c72-postaccept-reentry.mjs'];
const sha=(p)=>git('rev-parse','HEAD:'+p);
const source=(p)=>execFileSync('git',['show',HEAD+':'+p],{cwd:ROOT,maxBuffer:1000000});
const expected=Object.fromEntries(FILES.map(p=>[p,sha(p)]));
const witness=Object.freeze({source_head:HEAD,host_link_displayed:true,
 terms_link:'https://github.com/Luke883i/iKant_LE/blob/'+HEAD+'/TERMS.md',
 pinned_blob_shas:Object.fromEntries(FILES.slice(0,5).map(p=>[p,expected[p]]))});
const treeEntries=execFileSync('git',['ls-tree','-r','-z','HEAD'],{cwd:ROOT})
 .toString('utf8').split('\0').filter(Boolean).map(line=>{
  const m=line.match(/^([0-7]{6}) (blob|commit) ([a-f0-9]{40})\t(.+)$/u);
  assert.ok(m);return {path:m[4],mode:m[1],type:m[2],sha:m[3]};});
const port={readMain:async()=>HEAD,readCommit:async()=>({tree:{sha:TREE}}),
 readTree:async()=>({sha:TREE,truncated:false,tree:treeEntries}),
 readPinned:async(p)=>source(p)};
function privateRoot(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-pe-original-'));fs.chmodSync(dir,0o700);
 const cacheRoot=path.join(dir,'cache');fs.mkdirSync(cacheRoot,{mode:0o700});
 return {dir,cacheRoot,close:()=>fs.rmSync(dir,{force:true,recursive:true})};
}
function params(root,stage){return {humanMessage:'I ACCEPT',freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',
 sourceHead:HEAD,sourceTree:TREE,liveHead:HEAD,expectedBlobShas:expected,
 priorTurnEvidence:witness,stageDirectory:path.join(root.dir,stage),cacheRoot:root.cacheRoot};}
test('contract: 31 independent leaves and 10 conjunctive gates, zero owner authority',()=>{
 const info=validatePEReticle();assert.deepEqual(info,{nodes:41,leaves:31,and_gates:10});
 assert.equal(PE_CONTRACT.authority,0);assert.equal(PE_CONTRACT.active,false);
 assert.equal(PE_CONTRACT.cost_objective.min_human_messages,3);
 assert.equal(PE_CONTRACT.cost_objective.unnecessary_technical_human_messages,0);
});
test('no Host claim can be promoted to original evidence',()=>{
 const bare=assessPE();assert.equal(bare.outcome,'NOT_ATTESTED');
 assert.equal(bare.open_gates.length,31);
 const fake=Object.fromEntries(PE_CONTRACT.nodes.filter(n=>n.kind==='LEAF').map(n=>
  [n.id,{state:'PASS',level:n.level,source:'HOST_ASSERTION',reopened:true,originalBound:true,holdoutObserved:true}]));
 assert.equal(assessPE(fake).outcome,'NOT_ATTESTED');
 const witnessOnly=Object.fromEntries(PE_CONTRACT.nodes.filter(n=>n.kind==='LEAF').map(n=>
  [n.id,{state:'PASS',level:n.level,source:'EXTERNAL_OBSERVED',reopened:true,originalBound:true,holdoutObserved:true}]));
 const scoped=assessPE(witnessOnly);assert.equal(scoped.outcome,'MODEL_PASS_SCOPED');
 assert.equal(scoped.active,false);assert.equal(scoped.original_owner_invoked,false);
 assert.equal(scoped.native_delivery_attested,false);
 for(const n of PE_LEAVES){const v={...witnessOnly,[n]:{state:'UNKNOWN'}};
  assert.notEqual(assessPE(v).outcome,'MODEL_PASS_SCOPED','UNKNOWN is never PASS: '+n);}
});
test('invalid contract: cycles and missing witnesses fail closed',()=>{
 const cycle=structuredClone(PE_CONTRACT);
 cycle.nodes.find(n=>n.id==='I_IDENTITY').requires.push('G_PE');
 assert.throws(()=>validatePEReticle(cycle),/PE_GRAPH_CYCLE/);
 const absent=structuredClone(PE_CONTRACT);absent.nodes.pop();
 assert.throws(()=>validatePEReticle(absent),/PE_UNKNOWN_NODE|PE_INCOMPLETE_RETICLE/);
});
test('end user: three distinct human events, no technical user turn',()=>{
 assert.equal(requiredPEMessages({events:['iniziamo']}).phase,'ORIENTATION');
 assert.equal(requiredPEMessages({events:['I ACCEPT']}).phase,'ORIENTATION');
 assert.equal(requiredPEMessages({events:['iniziamo','I ACCEPT'],termsDisplayed:true}).phase,'POST_ACCEPT_PENDING');
 assert.equal(requiredPEMessages({events:['iniziamo','I ACCEPT'],termsDisplayed:true,acceptReopened:true}).phase,'ACCEPTED');
 const selected=requiredPEMessages({events:['iniziamo','I ACCEPT','EDU'],termsDisplayed:true,
  acceptReopened:true,eduReopened:true});
 assert.equal(selected.phase,'EDU_SELECTED_NOT_RUNNING');assert.equal(selected.technical_user_actions,0);
 assert.equal(requiredPEMessages({events:['iniziamo','EDU'],termsDisplayed:true}).phase,'STOP');
 assert.equal(minimalPENext('C72_OWNER').user_action_required,false);
 assert.equal(minimalPENext('EXACT_EDU',{originalGateReopened:false}).user_action_required,false);
});
test('C72 cache→original stager: cold eight fetches then zero on warm source',async()=>{
 const r=privateRoot();try{
  const a=await preparePEC72Stage(params(r,'stage-first'),port);
  assert.equal(a.ok,true,JSON.stringify(a));assert.equal(a.original_stager_readback,true);
  assert.equal(a.fetched,8);assert.equal(a.reused,0);assert.equal(a.original_owner_invoked,false);
  let fetches=0;const warm={...port,readPinned:async()=>{fetches++;throw Error('UNNECESSARY_FETCH');}};
  const b=await preparePEC72Stage(params(r,'stage-second'),warm);
  assert.equal(b.ok,true,JSON.stringify(b));assert.equal(b.fetched,0);
  assert.equal(b.reused,8);assert.equal(fetches,0);
  for(const p of FILES){const f=path.join(r.dir,'stage-second',p);
   assert.equal(fs.readFileSync(f).equals(source(p)),true);
   assert.equal(fs.statSync(f).mode&0o077,0);}
 }finally{r.close();}
});
test('cache tamper is terminal: no overwrite, no new staging, no owner',async()=>{
 const r=privateRoot();try{
  assert.equal((await preparePEC72Stage(params(r,'stage-good'),port)).ok,true);
  const p=path.join(r.cacheRoot,fs.readdirSync(r.cacheRoot).find(x=>x.endsWith('.json')));
  fs.appendFileSync(p,'corrupt');
  const s=await preparePEC72Stage(params(r,'stage-corrupt'),port);
  assert.equal(s.ok,false);assert.match(s.edge,/PE_PREOWNER_STAGE_OR_CACHE_UNKNOWN_NO_REPLAY/);
  assert.equal(fs.existsSync(path.join(r.dir,'stage-corrupt')),false);
  assert.equal(s.original_owner_invoked,false);
 }finally{r.close();}
});
test('stale HEAD, unknown owner and missing source preflight never write stage',async()=>{
 const r=privateRoot();try{
  for(const [name,patch] of [
   ['stale',{liveHead:'f'.repeat(40)}],
   ['owner',{ownerOutcome:'UNKNOWN'}],
   ['unbound',{sourceTree:'bad'}],
   ['source',{expectedBlobShas:{...expected,'TERMS.md':'a'.repeat(40)}}]
  ]){
   const q={...params(r,'stage-'+name),...patch},s=await preparePEC72Stage(q,port);
   assert.equal(s.ok,false,name);assert.equal(fs.existsSync(q.stageDirectory),false,name);
  }
 }finally{r.close();}
});
test('EDU source cannot bypass original C72 selected receipt readback',async()=>{
 const r=privateRoot();try{
  const s=await preparePEPostEdu({sourceHead:HEAD,sourceTree:TREE,liveHead:HEAD,
   cacheRoot:r.cacheRoot,transitDirectory:r.dir},port);
  assert.equal(s.ok,false);assert.equal(s.original_owner_invoked,false);
 }finally{r.close();}
});
test('finite mutation fast fixture: seeded and independent oracle',()=>{
 const a=stressPE({cases:15000,seed:883}),b=stressPE({cases:15000,seed:883});
 assert.equal(a.stream_sha256,b.stream_sha256);
 assert.equal(a.independent_oracle_disagreements,0);
 assert.equal(a.monotonicity_violations,0);
 assert.equal(a.cases_executed,15000);
 assert.equal(a.families,40);
});
