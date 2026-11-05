import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {expectedM2HardenedSource,modelM3Reticulum,qualifyM3Delta,observeM3Source}
 from '../scripts/cora-m3-reversible-slice.mjs';
import {validateM2Profile} from '../scripts/cora-m2-owner-provider-metrics.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PROFILE=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/cora-m2-owner-provider-metrics-v1.json'),'utf8'));
const AFTER=fs.readFileSync(path.join(ROOT,'scripts/cora-m2-owner-provider-metrics.mjs'),'utf8');
const BASE='40d1fe252aab05b028cb82b80dd4818b977d5e2a';
const TREE='0a76acb3d1b799b9d62c4442f3db8e8a0f85c57a';
const ORIGINAL_BLOB='57d07b7977d505a8fe85773ff11d56c54e82773d';
const HARDENED_BLOB='78cfc6a1472a1832afefa6f58b385176a5b037be';
const gitSha=s=>{const b=Buffer.from(s,'utf8');return crypto.createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex')};
const copy=x=>JSON.parse(JSON.stringify(x));
function reconstructBaseline(){
 const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,'rollback unique anchor');return s.replace(a,b)};
 let s=AFTER;
 s=replace(s,'const ORIGINAL_PROOFS='+JSON.stringify(PROFILE.nodes.map(n=>n.proof))+';\n'+
  'const NONPROMOTION_KEYS='+JSON.stringify(Object.keys(PROFILE.nonpromotion).sort())+';\n'+
  'const METRIC_POLICY_KEYS='+JSON.stringify(Object.keys(PROFILE.metric_policy).sort())+';\n','');
 s=replace(s,'JSON.stringify(Object.keys(p.nonpromotion||{}).sort())!==JSON.stringify(NONPROMOTION_KEYS)||\n'+
  '  Object.values(p.nonpromotion||{}).some(x=>x!==false)||\n'+
  '  JSON.stringify(Object.keys(p.metric_policy||{}).sort())!==JSON.stringify(METRIC_POLICY_KEYS)||',
  'p.nonpromotion&&Object.values(p.nonpromotion).some(x=>x!==false)||');
 s=replace(s,'n.proof!==ORIGINAL_PROOFS[i]||',"typeof n.proof!=='string'||n.proof.length<25||");
 s=replace(s,"import path from 'node:path';\n","import path from 'node:path';\nimport fs from 'node:fs';\n");
 return s;
}
function fixture(){
 const before=reconstructBaseline(),head='a'.repeat(40),tree='b'.repeat(40);
 const delta=[
  {path:'scripts/cora-m2-owner-provider-metrics.mjs',status:'M'},
  {path:'tests/cora-m2-owner-provider-metrics.test.mjs',status:'M'},
  {path:'scripts/cora-m3-reversible-slice.mjs',status:'A'},
  {path:'tests/cora-m3-reversible-slice.test.mjs',status:'A'},
  {path:'governance/changes/zzzzzzzzzzzzzzzzzzzzzzz-cora-m3-reversible-slice.json',status:'A'}
 ];
 return {baseHead:BASE,baseTree:TREE,head,tree,before,after:AFTER,profile:PROFILE,
  delta,ownerPins:copy(PROFILE.pinned_original_blobs),
  f:{ok:true,witnesses:{F08:false,F09:false,F11:false},repo_standardized:false},
  m1:{ok:true,head,tree,m1_complete:false,archive_allowed:false},
  m2:{ok:true,source:{head,tree},m2_complete:false,provider:'NOT_ATTESTED'},
  prA:{ok:true,source_head:head,source_tree:tree,delete_authorized:false,
   workflow_retirement_authorized:false,
   unresolved:{dynamic_and_external_consumers:true},
   rows:[{path:'project-baseline/PROJECT_PROMPT.txt',delete_authorized:false,consumer_closure:'UNKNOWN'}]}};
}
test('original Git blob and hardened blob reconstruct byte-exact before and after',()=>{
 const before=reconstructBaseline();
 assert.equal(gitSha(before),ORIGINAL_BLOB);
 assert.equal(gitSha(AFTER),HARDENED_BLOB);
 assert.equal(expectedM2HardenedSource(before,PROFILE),AFTER);
 assert.equal(validateM2Profile(PROFILE).ok,true);
 assert.equal(AFTER.includes("import fs from 'node:fs';"),false);
});
test('one bounded source effect can be qualified without claiming archival or runtime equivalence',()=>{
 const p=qualifyM3Delta(fixture());
 assert.equal(p.ok,true,JSON.stringify(p));
 assert.equal(p.changed_paths,5);
 assert.equal(p.archived_paths,0);
 assert.equal(p.archive_allowed,false);
 assert.equal(p.m3_complete,false);
 assert.equal(p.rollback_proven,false);
 assert.equal(p.independent_equivalence_proven,false);
 assert.equal(p.first_edge,'M3E1_EXTERNAL_CONSUMER_AND_BEHAVIOR_CLOSURE_NOT_ATTESTED');
});
test('source-only and synthetic all-true model never become original external approval',()=>{
 const leaves=['M3S1','M3S2','M3S3','M3S4','M3S5'];
 const source=Object.fromEntries(leaves.map(x=>[x,true]));
 const r=modelM3Reticulum(source);
 assert.equal(r.nodes,11);
 assert.equal(r.source_model,true);
 assert.equal(r.full_model,false);
 const all=modelM3Reticulum({...source,M3E1:true,M3E2:true,M3E3:true,M3E4:true});
 assert.equal(all.full_model,true);
 assert.equal(all.m3_complete,false);
 assert.equal(all.archive_allowed,false);
 assert.equal(all.rollback_proven,false);
 assert.equal(all.review_completed,false);
});
test('24 adversarial source, provenance, consumer and evidence mutations fail closed',()=>{
 const attacks=[
  x=>x.baseHead='c'.repeat(40),x=>x.baseTree='d'.repeat(40),
  x=>x.head=BASE,x=>x.head='BAD',
  x=>x.after+='// unauthorized',
  x=>x.before='bad',x=>x.profile.nodes[0].proof='ALTERED PROOF TEXT WITHOUT OWNER',
  x=>x.profile.nonpromotion.forged=false,
  x=>x.profile.metric_policy.forged=false,
  x=>x.delta.pop(),x=>x.delta[0].status='D',
  x=>x.delta[0].path='host/c87-durable-ledger.mjs',
  x=>x.delta[4].path=x.delta[0].path,
  x=>x.ownerPins['host/c87-durable-ledger.mjs']='e'.repeat(40),
  x=>x.f.ok=false,x=>x.f.witnesses.F08=true,
  x=>x.f.witnesses.F09=true,x=>x.f.witnesses.F11=true,
  x=>x.m1.m1_complete=true,x=>x.m1.archive_allowed=true,
  x=>x.m2.provider='ACK',x=>x.prA.delete_authorized=true,
  x=>x.prA.unresolved.dynamic_and_external_consumers=false,
  x=>x.prA.rows[0].consumer_closure='PASS'
 ];
 assert.equal(attacks.length,24);
 for(const [i,attack] of attacks.entries()){
  const q=fixture();attack(q);
  const r=qualifyM3Delta(q);
  assert.equal(r.ok,false,'mutation '+i+': '+JSON.stringify(r));
  assert.equal(r.archive_allowed,false);
  assert.equal(r.m3_complete,false);
 }
});
test('20k deterministic AND-cut falsifiers cannot compensate missing independent evidence',()=>{
 let seed=20261105>>>0,impossible=0,sourceOnlyBlocked=0;
 const ids=['M3S1','M3S2','M3S3','M3S4','M3S5','M3E1','M3E2','M3E3','M3E4'];
 const all=Object.fromEntries(ids.map(id=>[id,true]));
 for(let i=0;i<20000;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const q=modelM3Reticulum({...all,[ids[seed%ids.length]]:false});
  if(q.full_model||q.m3_complete||q.archive_allowed||q.rollback_proven||q.authority!==0)impossible++;
  if(!q.full_model)sourceOnlyBlocked++;
 }
 assert.equal(sourceOnlyBlocked,20000);
 assert.equal(impossible,0);
});
test('physical private-file rollback rehearsal is byte exact in a second Node readback process',()=>{
 const before=reconstructBaseline(),root=fs.mkdtempSync(path.join(os.tmpdir(),'cora-m3-'));
 const target=path.join(root,'selected-slice.mjs');
 const independentSha=()=>{
  const script="const fs=require('node:fs');const c=require('node:crypto');const b=fs.readFileSync(process.argv[1]);console.log(c.createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex'));";
  const p=spawnSync(process.execPath,['-e',script,target],{encoding:'utf8',timeout:10000});
  assert.equal(p.status,0,p.stderr);return p.stdout.trim();
 };
 try{
  fs.chmodSync(root,0o700);
  const fd=fs.openSync(target,'wx',0o600);
  fs.writeSync(fd,AFTER);fs.fsyncSync(fd);fs.closeSync(fd);
  assert.equal(independentSha(),HARDENED_BLOB);
  const reopen=fs.openSync(target,'r+');
  fs.ftruncateSync(reopen,0);fs.writeSync(reopen,before);fs.fsyncSync(reopen);fs.closeSync(reopen);
  assert.equal(independentSha(),ORIGINAL_BLOB);
  assert.equal(fs.statSync(target).mode&0o077,0);
  assert.equal(fs.statSync(root).mode&0o077,0);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('real Git replay either qualifies exact HEAD slice or fails closed on shallow checkout',()=>{
 const r=observeM3Source();
 if(r.ok){
  assert.equal(r.status,'M3_BOUNDED_GIT_SOURCE_CHANGE_ONLY');
  assert.equal(r.original_blob,ORIGINAL_BLOB);
  assert.equal(r.hardened_blob,HARDENED_BLOB);
  assert.equal(r.archived_paths,0);
  assert.equal(r.source_slice_qualified,true);
 }else{
  // Any technical source-readback failure stays a typed BLOCK, never approval.
  assert.match(r.edge,/^M3_[A-Z0-9_]+$/,JSON.stringify(r));
  assert.equal(r.source_slice_qualified,false);
 }
 assert.equal(r.m3_complete,false);
 assert.equal(r.archive_allowed,false);
 assert.equal(r.rollback_proven,false);
});
