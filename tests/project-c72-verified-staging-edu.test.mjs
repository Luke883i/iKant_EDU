import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const original=p=>execFileSync('git',['show','HEAD:'+p],{cwd:repo,maxBuffer:500000});
const object=p=>execFileSync('git',['rev-parse','HEAD:'+p],{cwd:repo,encoding:'utf8'}).trim();
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
const paths=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
 'host/project-c72-postaccept-reentry.mjs'];
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const originalObjects=paths.map(p=>({path:p,bytes:original(p),blob_sha1:object(p)}));
const expectedBlobShas=Object.fromEntries(originalObjects.map(o=>[o.path,o.blob_sha1]));
const witness={source_head:head,host_link_displayed:true,distinct_human_message_observed:true,
 terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md',
 pinned_blob_shas:Object.fromEntries(originalObjects.slice(0,5).map(o=>[o.path,o.blob_sha1]))};
const relay=path.join(repo,'scripts/project-c72-verified-staging.mjs');
const seed=path.join(repo,'host/project-c72-coldstart-seed.mjs');
const edu=path.join(repo,'scripts/project-c72-cold-mode-cli.mjs');
function call(script,input){
 const r=spawnSync(process.execPath,[script],{cwd:os.tmpdir(),encoding:'utf8',
  input:JSON.stringify(input),timeout:30000,maxBuffer:3000000});
 assert.equal(r.error,undefined,String(r.error));
 return {code:r.status,output:JSON.parse(r.stdout||'{}'),stderr:r.stderr};
}
const base=q=>({schema:'ikant-host-c72-verified-verify/v1',stageDirectory:q});
test('physical eight-blob Git-object relay -> original C72 receipt/intro -> distinct cold EDU process',()=>{
 const outer=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c72-real-'));fs.chmodSync(outer,0o700);
 const stage=path.join(outer,'stage');
 try{
  for(const o of originalObjects)assert.equal(sha(o.bytes),o.blob_sha1,o.path);
  const init=call(relay,{op:'init',schema:'ikant-host-c72-verified-staging/v1',
   stageDirectory:stage,source_head:head,expectedBlobShas,priorTurnEvidence:witness});
  assert.equal(init.code,0,JSON.stringify(init));
  assert.equal(init.output.phase,'STAGE_INITIALIZED');
  const incomplete=call(relay,{op:'verify',...base(stage)});
  assert.equal(incomplete.code,2);
  assert.equal(incomplete.output.edge,'C72_RELAY_SOURCE_INCOMPLETE');
  for(const o of originalObjects){
   const p=call(relay,{op:'put',schema:'ikant-host-c72-verified-put/v1',
    stageDirectory:stage,path:o.path,contentBase64:o.bytes.toString('base64')});
   assert.equal(p.code,0,o.path+' '+JSON.stringify(p));
   assert.equal(p.output.blob_sha1,o.blob_sha1);
   assert.deepEqual(fs.readFileSync(path.join(stage,o.path)),o.bytes);
  }
  const ready=call(relay,{op:'verify',...base(stage)});
  assert.equal(ready.code,0,JSON.stringify(ready));
  assert.equal(ready.output.phase,'SOURCE_READY_FOR_ORIGINAL_COLD_SEED');
  assert.equal(ready.output.verified_count,8);
  assert.equal(ready.output.original_owner_invoked,false);
  const admitted=call(seed,{schema:'ikant-host-c72-coldstart/v1',humanMessage:'I ACCEPT',
   freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',liveHead:head,
   seedBlobSha1:object('host/project-c72-coldstart-seed.mjs'),
   expectedBlobShas,priorTurnEvidence:witness,stageDirectory:stage});
  assert.equal(admitted.code,0,JSON.stringify(admitted));
  assert.equal(admitted.output.kind,'C72_ORIGINAL_POSTACCEPT_VERIFIED');
  assert.equal(admitted.output.original_owner_invoked,true);
  assert.equal(admitted.output.verified_file_count,8);
  assert.equal(admitted.output.introduction.acceptance_receipt_sha256,
   admitted.output.accepted.receipt_sha256);
  assert.equal(admitted.output.introduction.schema,'ikant-le-c72-public-orientation/v2');
  const later=call(edu,{schema:'ikant-host-c72-later-mode/v1',humanMessage:'EDU',
   freshHumanTurn:true,priorAcceptanceObserved:true,ownerOutcome:'NOT_INVOKED',
   sourceHead:head,liveHead:head,accepted:admitted.output.accepted,
   introduction:admitted.output.introduction,expectedBlobShas,
   sourcePacket:originalObjects.filter(x=>x.path===
    'contracts/c72-public-mode-admission-v2.json'||x.path==='host/c72-public-mode-admission.mjs')
    .map(x=>({path:x.path,contentBase64:x.bytes.toString('base64')}))});
  assert.equal(later.code,0,JSON.stringify(later));
  assert.equal(later.output.status,'C72_ORIGINAL_EDU_MODE_VERIFIED');
  assert.equal(later.output.selection.selected_mode,'EDU');
  assert.equal(later.output.original_owner_invoked,true);
  assert.equal(later.output.selection.acceptance_receipt_sha256,
   admitted.output.accepted.receipt_sha256);
  assert.equal(later.output.selection.orientation_receipt_sha256,
   admitted.output.introduction.receipt_sha256);
  assert.equal(later.output.native_event_attested,false);
  assert.equal(later.output.active,false);
  console.log('C72_PHYSICAL_STAGE_TO_EDU_CI_FIXTURE_PASS',JSON.stringify({
   source_head:head,stage_count:ready.output.verified_count,
   original_C72_receipt_verified:true,original_full_intro_verified:true,
   later_original_EDU_verified:true,separate_node_processes:true,
   github_connector_event_attested:false,native_human_event_attested:false,active:false}));
 }finally{fs.rmSync(outer,{recursive:true,force:true});}
});
