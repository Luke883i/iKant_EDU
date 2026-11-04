import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {initializeRelay,putRelayBlob,verifyRelay,validateRelayManifest} from '../scripts/project-c72-verified-staging.mjs';
const NAMES=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
 'host/project-c72-postaccept-reentry.mjs'];
const SHA='a'.repeat(40);
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const bytes=NAMES.map((p,i)=>Buffer.from('original fixture byte-path '+i+' '+p+'\n'));
const expectedBlobShas=Object.fromEntries(NAMES.map((p,i)=>[p,blob(bytes[i])]));
function manifest(dir){return {op:'init',schema:'ikant-host-c72-verified-staging/v1',
 source_head:SHA,expectedBlobShas,stageDirectory:dir,priorTurnEvidence:{source_head:SHA,
 host_link_displayed:true,terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+SHA+'/TERMS.md',
 pinned_blob_shas:Object.fromEntries(NAMES.slice(0,5).map(p=>[p,expectedBlobShas[p]]))}};}
const put=(dir,i,data=bytes[i])=>({op:'put',schema:'ikant-host-c72-verified-put/v1',
 stageDirectory:dir,path:NAMES[i],contentBase64:data.toString('base64')});
const verify=dir=>({op:'verify',schema:'ikant-host-c72-verified-verify/v1',stageDirectory:dir});
function setup(){const outer=fs.mkdtempSync(path.join(os.tmpdir(),'c72-relay-test-'));
 const dir=path.join(outer,'source');return {outer,dir};}
test('fixture: 8 separate actual stdin subprocesses and independent file readback',()=>{
 const {outer,dir}=setup();try{
  const cli=new URL('../scripts/project-c72-verified-staging.mjs',import.meta.url).pathname;
  const run=q=>{const r=spawnSync(process.execPath,[cli],{input:JSON.stringify(q),encoding:'utf8'});
   assert.equal(r.status,0,r.stdout+r.stderr);return JSON.parse(r.stdout);};
  assert.equal(run(manifest(dir)).phase,'STAGE_INITIALIZED');
  for(let i=0;i<8;i++)assert.equal(run(put(dir,i)).blob_sha1,expectedBlobShas[NAMES[i]]);
  const done=run(verify(dir));assert.equal(done.ok,true);assert.equal(done.verified_count,8);
  assert.equal(done.native_event_attested,false);assert.equal(done.original_owner_invoked,false);
  for(let i=0;i<8;i++)assert.deepEqual(fs.readFileSync(path.join(dir,NAMES[i])),bytes[i]);
 }finally{fs.rmSync(outer,{recursive:true,force:true});}
});
test('missing file cannot become a C72-ready stage; duplicates, tampering, stale witness fail closed',()=>{
 const {outer,dir}=setup();try{
  initializeRelay(manifest(dir));assert.equal(verifyRelay(verify(dir)).edge,'C72_RELAY_SOURCE_INCOMPLETE');
  assert.equal(putRelayBlob(put(dir,0)).ok,true);
  assert.throws(()=>putRelayBlob(put(dir,0)),/EEXIST/);
  assert.throws(()=>putRelayBlob(put(dir,1,Buffer.from('bad'))),/BLOB_DRIFT/);
  for(let i=1;i<8;i++)putRelayBlob(put(dir,i));
  assert.equal(verifyRelay(verify(dir)).verified_count,8);
  fs.appendFileSync(path.join(dir,'TERMS.md'),'tamper');
  assert.throws(()=>verifyRelay(verify(dir)),/BLOB_DRIFT/);
 }finally{fs.rmSync(outer,{recursive:true,force:true});}
 const m=manifest('/tmp/not-created');m.priorTurnEvidence.source_head='b'.repeat(40);
 assert.equal(validateRelayManifest(m),'C72_RELAY_MANIFEST_INVALID');
});
test('seeded 10000 reproducible adversarial envelopes preserve identity and fail closed',()=>{
 let seed=174052;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const count=10000;let rejected=0;
 for(let i=0;i<count;i++){
  const q=manifest('/tmp/c72-semantics');const j=Math.floor(rnd()*10);
  if(j===0)q.source_head='0'.repeat(40);
  if(j===1)q.expectedBlobShas={...q.expectedBlobShas,['TERMS.md']:'1'.repeat(40)};
  if(j===2)q.priorTurnEvidence={...q.priorTurnEvidence,host_link_displayed:false};
  if(j===3)q.priorTurnEvidence={...q.priorTurnEvidence,source_head:'2'.repeat(40)};
  if(j===4)q.priorTurnEvidence={...q.priorTurnEvidence,terms_link:'https://evil.example'};
  if(j===5)q.expectedBlobShas={...q.expectedBlobShas,extra:'3'.repeat(40)};
  if(j===6)q.priorTurnEvidence={...q.priorTurnEvidence,pinned_blob_shas:{}};
  if(j===7)q.expectedBlobShas={...q.expectedBlobShas,['README.md']:'not-a-sha'};
  if(j===8)q.schema='ikant-host-c72-verified-staging/v0';
  if(j===9)q.priorTurnEvidence={...q.priorTurnEvidence,pinned_blob_shas:{...q.priorTurnEvidence.pinned_blob_shas,extra:'3'.repeat(40)}};
  if(validateRelayManifest(q)!==null)rejected++;
 }
 assert.equal(rejected,count);assert.equal(seed,2028386356);
});
