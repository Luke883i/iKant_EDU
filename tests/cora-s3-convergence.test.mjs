import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chooseEDUSourceTransport,chooseC72HostTransport}
 from '../host/project-c72-transport-frontier.mjs';
import {validateS3Profile,evaluateS3,classifyS3Sources,observeS3Source}
 from '../scripts/cora-s3-convergence.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PROFILE=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/cora-s3-source-convergence-v1.json'),'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x));
const sourceClaims=Object.fromEntries(PROFILE.nodes.filter(n=>n.scope==='SOURCE').map(n=>[n.id,true]));
const allClaims=Object.fromEntries(PROFILE.nodes.filter(n=>n.scope==='SOURCE'||n.scope==='EXTERNAL').map(n=>[n.id,true]));
test('CORA S3 retrograde DoD imports original owners and has 13 noncompensatory nodes',()=>{
 const r=validateS3Profile(PROFILE);
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(PROFILE.nodes.length,13);
 assert.deepEqual(PROFILE.nodes.at(-1).needs,
 ['I_S3_SOURCE','S3E1','S3E2','S3E3','S3E4']);
 assert.equal(PROFILE.source.original,'contracts/cora-three-streams-retrograde-v1.json');
 assert.equal(PROFILE.source.pr_f,'contracts/cora-pr-f-integrated-qualification-v1.json');
 assert.equal(PROFILE.boundaries.owner_invoke_allowed,false);
 assert.equal(PROFILE.boundaries.archive_allowed,false);
});
test('source-only S3 remains blocked externally, even with all source witnesses true',()=>{
 const r=evaluateS3(PROFILE,sourceClaims);
 assert.equal(r.ok,true);
 assert.equal(r.source_model_complete,true);
 assert.equal(r.complete_model,false);
 assert.equal(r.statuses.S3E1,'UNKNOWN_NOT_ATTESTED');
 assert.equal(r.statuses.I_S3_COMPLETE,'BLOCKED_DEPENDENCY');
 assert.equal(r.s3_complete,false);
 assert.equal(r.product_go,false);
 assert.equal(r.provider,'NOT_ATTESTED');
});
test('even forged all-true booleans cannot mint an original owner, provider, review or ACTIVE',()=>{
 const r=evaluateS3(PROFILE,allClaims);
 assert.equal(r.complete_model,true);
 assert.equal(r.s3_complete,false);
 assert.equal(r.owner_invoked,false);
 assert.equal(r.active,false);
 assert.equal(r.standardized,false);
 assert.equal(r.product_go,false);
 assert.equal(r.archive_allowed,false);
 assert.equal(r.provider,'NOT_ATTESTED');
 assert.equal(r.human_review,'NOT_ATTESTED');
});
test('remove any individual conjunct and full S3 model fails closed',()=>{
 for(const n of PROFILE.nodes.filter(x=>x.scope==='SOURCE'||x.scope==='EXTERNAL')){
  const r=evaluateS3(PROFILE,{...allClaims,[n.id]:false});
  assert.equal(r.complete_model,false,n.id);
  assert.equal(r.s3_complete,false,n.id);
 }
});
test('original post-EDU selector points to canonical repo and never grants admission or C135',()=>{
 const sha='a'.repeat(40);
 const q={phase:'POST_EDU',originalEduSelectionVerified:true,sourceHead:sha,
 liveHead:sha,node:'AVAILABLE',source:'ABSENT',manualRoute:'EXPLICIT_MANUAL_POST_EDU'};
 const r=chooseEDUSourceTransport(q);
 assert.equal(r.kind,'HUMAN_GATE');
 assert.equal(r.source_zip_url,'https://github.com/Luke883i/iKant_EDU/archive/'+sha+'.zip');
 assert.equal(r.owner_invoked,false);
 assert.equal(r.active,false);
 for(const bad of [
  {...q,phase:'POST_ACCEPT'}, {...q,originalEduSelectionVerified:false},
  {...q,sourceHead:'invalid'}, {...q,liveHead:'b'.repeat(40)},
  {...q,node:'UNKNOWN'}, {...q,manualRoute:'AUTOMATIC'},
 ]){
  const x=chooseEDUSourceTransport(bad);
  assert.equal(x.kind,'STOP',JSON.stringify(bad));
  assert.equal(x.owner_invoked,false);
 }
 const entry=chooseC72HostTransport({phase:'POST_EDU'});
 assert.equal(entry.kind,'STOP');
});
test('semantic classification requires exact canonical source and leaves ranking/delegation external',()=>{
 const prompt='iKant EDU ulteriore turno esatto EDU⇒selezione. '+'P'.repeat(400);
 const q={
  abi:JSON.stringify({authority:0,carrier_priority:[
   {id:'HOST_TOOL_ARG_RELAY'},{id:'SAME_NODE_CALLBACKS'},
   {id:'HOST_SOURCE_PACKET'},{id:'NODE_GITHUB_HTTPS'}]}),
  frontier:"const C72_TRANSPORT_ORDER=['CALLBACKS','NODE_HTTPS','HOST_PACKET','HOST_FILE']; https://github.com/Luke883i/iKant_EDU/archive/",
  prompt,derived:prompt+'\nPROJECT_SOURCE=project/session-chat/PROMPT.txt; NOT_INSTALLED',
  legacy:'iKant_LE',v7:'iKant_LE',
  continuous:"from './project-oneshell-edu.mjs'; from './c72-public-mode-admission.mjs'",
  c72:JSON.stringify({mode_choices:['EDU'],authoritative_claims:{selection_is_active:false},
   status:{EDU:'EDU_SELECTED_NOT_RUNNING'}})
 };
 const r=classifyS3Sources(q);
 assert.equal(r.S3R2,true);
 assert.equal(r.S3R3,true);
 assert.equal(r.S3R4,true);
 assert.equal(r.S3R5,true);
 assert.equal(r.S3R6,true);
 // Future EDU-only source rejects a mixed legacy mode offer, not just a renamed label.
 const dual=classifyS3Sources({...q,c72:JSON.stringify({
  mode_choices:['EDU','CANONICAL'],authoritative_claims:{selection_is_active:false},
  status:{EDU:'EDU_SELECTED_NOT_RUNNING'}
 })});
 assert.equal(dual.S3R6,false);
 const early=classifyS3Sources({...q,prompt:prompt.replace('ulteriore turno esatto EDU⇒selezione.','EDU/CANONICAL')});
 assert.equal(early.S3R6,false);
 // Historical source classifications remain distinguishable, never migrated into the new epoch.
 const legacyPrompt='iKant EDU CANONICAL legacy '+'P'.repeat(400);
 const pinnedLegacy=classifyS3Sources({...q,prompt:legacyPrompt,
  c72:JSON.stringify({mode_choices:['EDU','CANONICAL'],
   authoritative_claims:{selection_is_active:false},
   status:{EDU:'EDU_SELECTED_NOT_RUNNING'}})});
 assert.equal(pinnedLegacy.S3R6,true);
 assert.equal(r.owner_concurrency_proven,false);
 assert.equal(r.provider_attested,false);
 const old=classifyS3Sources({...q,frontier:q.frontier.replace('iKant_EDU','iKant_LE')});
 assert.equal(old.S3R2,false);
 assert.equal(old.old_zip_detected,true);
 const forged=classifyS3Sources({...q,derived:'COMPETING PROMPT'});
 assert.equal(forged.S3R4,false);
 const missing=classifyS3Sources({});
 assert.equal(missing.S3R2,false);
 assert.equal(missing.S3R3,false);
 assert.equal(missing.S3R4,false);
});
test('read Git blobs independently at current HEAD, then classify only SOURCE S3',()=>{
 const r=observeS3Source();
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.source_status,'S3_SOURCE_MODEL_QUALIFIED');
 assert.equal(r.observations.length,13);
 assert.equal(r.model.source_model_complete,true);
 assert.equal(r.model.complete_model,false);
 assert.equal(r.negative_admission_gate,true);
 assert.equal(r.first_edge,'S3E1_DYNAMIC_AND_EXTERNAL_CONSUMERS_NOT_ATTESTED');
 assert.equal(r.classifications.C2,'CANONICAL_ZIP_PATH_SOURCE_ONLY');
 assert.equal(r.classifications.C5,'SOURCE_DELEGATION_OWNER_RUNTIME_UNKNOWN');
 assert.equal(r.owner_receipt,'NOT_INVOKED');
 assert.equal(r.provider,'NOT_ATTESTED');
 assert.equal(r.product_go,false);
 assert.equal(r.archive_allowed,false);
});
test('50,000 deterministic falsifiers reject contract drift, fake owner/review and early cleanup',()=>{
 const faults=[
  p=>p.authority=1,p=>p.owner=true,p=>p.active=true,p=>p.release='GO',
  p=>p.abstract.logic='OR',p=>p.abstract.unknown_is_not_pass=false,
  p=>p.abstract.source_is_not_runtime=false,p=>p.abstract.model_is_not_approval=false,
  p=>p.source.repo='Luke883i/iKant_LE',p=>p.source.base_head='a'.repeat(40),
  p=>p.source.base_tree='a'.repeat(40),
  p=>p.source.frontier_base_sha='b'.repeat(40),
  p=>p.source.frontier_after_sha='c'.repeat(40),
  p=>p.source.pr_f='new_owner',p=>p.source.original='new_reticulum',
  p=>p.owners['host/c87-durable-ledger.mjs']='a'.repeat(40),
  p=>p.stable['project/session-chat/PROMPT.txt']='a'.repeat(40),
  p=>p.boundaries.archive_allowed=true,p=>p.boundaries.delete_allowed=true,
  p=>p.boundaries.workflow_retirement_allowed=true,
  p=>p.boundaries.prompt_install_allowed=true,p=>p.boundaries.owner_invoke_allowed=true,
  p=>p.boundaries.product_go=true,p=>p.boundaries.standardized=true,
  p=>p.boundaries.provider='PASS',p=>p.boundaries.independent_review='APPROVED',
  p=>p.nodes.pop(),p=>p.nodes[0].id='FAKE',
  p=>p.nodes[7].needs=[],p=>p.nodes[8].scope='SOURCE',
  p=>p.cases.pop(),p=>p.cases[0].owner_change=true
 ];
 function run(){
  const digest=createHash('sha256');
  const covered=new Set();let seed=20261105>>>0,rejected=0,survivors=0,unsafe=0;
  for(let i=0;i<50000;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const k=i<faults.length?i:seed%faults.length;
   covered.add(k);const p=clone(PROFILE);faults[k](p);
   const r=validateS3Profile(p);
   if(r.ok)survivors++;else rejected++;
   if(r.s3_complete!==false||r.archive_allowed!==false||r.authority!==0)unsafe++;
   digest.update(i+':'+k+':'+(r.first_edge||'NONE')+';');
  }
  return {seed:20261105,rejected,survivors,unsafe,families:faults.length,
    covered:covered.size,sha256:digest.digest('hex')};
 }
 const a=run(),b=run();
 assert.deepEqual(a,b);
 assert.equal(a.rejected,50000);
 assert.equal(a.survivors,0);
 assert.equal(a.unsafe,0);
 assert.equal(a.covered,a.families);
});
