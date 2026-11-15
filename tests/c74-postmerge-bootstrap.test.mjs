import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,
 selectC72Mode,validateC72ModeSelection} from '../host/c72-unified-mode-admission.mjs';
import {issueC69ExperimentalOffer,qualifyC69ExperimentalPreview} from '../host/c69-capability-first-preview.mjs';
import {runC70ExperimentalComputePreview} from '../src/c70-experimental-compute-preview.mjs';
import {routeC71HostDraft} from '../src/c71-experimental-host-draft.mjs';
import {buildC73ProjectCapsule} from '../host/c73-project-capsule.mjs';
import {runCanonicalSessionChat} from '../src/runtime-command.mjs';

const ROOT=new URL('../',import.meta.url);
const repoHead=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const terms=fs.readFileSync(new URL('../TERMS.md',import.meta.url));
const README=fs.readFileSync(new URL('../README.md',import.meta.url));
const termsDigest=crypto.createHash('sha256').update(terms).digest('hex');
const blob=gitBlob(README);
const gitReadme=execFileSync('git',['hash-object','README.md'],{cwd:ROOT,encoding:'utf8'}).trim();
const frozen=()=>{
 const offer=issueC72TermsOffer({sourceHead:repoHead,termsDigest});
 const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const introduction=presentC72Introduction(accepted);
 return {offer,accepted,introduction};
};
const selection=(mode)=>{
 const {accepted,introduction}=frozen();
 return selectC72Mode({accepted,orientation:introduction,humanMessage:mode});
};
const fixture=(mode='EXPERIMENTAL')=>({
 sourceHead:repoHead,offer:issueC69ExperimentalOffer({sourceHead:repoHead}),
 unifiedSelection:selection(mode),
 sourceObject:{path:'README.md',blob_sha1:blob,content_base64:README.toString('base64')},
 messages:['Esamina alternative pratiche e dichiara i limiti verificabili.']
});
test('C74 actual Git checkout source and Terms match local original bytes',()=>{
 assert.match(repoHead,/^[0-9a-f]{40}$/);
 assert.equal(blob,gitReadme);
 assert.match(terms.toString('utf8'),/I ACCEPT/);
 assert.equal(termsDigest.length,64);
 const {accepted,introduction}=frozen();
 assert.equal(accepted.native_event_attested,false);
 assert.equal(introduction.candidates_evaluated,100);
 assert.equal(introduction.default_recommendation,'EXPERIMENTAL');
});
test('C74 real Node test: C72 -> C69 sink reopen -> C70 -> C71 -> C73, still not native iKant',()=>{
 const x={...fixture(),sessionRoot:os.tmpdir()};
 const c69=qualifyC69ExperimentalPreview(x);
 assert.equal(c69.status,'EXPERIMENTAL_LOCAL_PREVIEW');
 assert.equal(c69.local_samehash_verified,true);
 assert.equal(c69.github_host_origin_attested,false);
 const c70=runC70ExperimentalComputePreview(x);
 assert.equal(c70.status,'EXPERIMENTAL_COMPUTE_PREVIEW');
 assert.equal(c70.executed_repository_kernel,true);
 assert.equal(c70.active,false);
 const c71=routeC71HostDraft(x);
 assert.equal(c71.status,'EXPERIMENTAL_HOST_DRAFT');
 assert.equal(c71.routed_turns.length,1);
 assert.equal(c71.routed_turns[0].action_executed,false);
 const c73=buildC73ProjectCapsule({selection:x.unifiedSelection,experimentalResult:c71});
 assert.equal(c73.status,'C73_EXPERIMENTAL_DRAFT_PRESENTATION_PLAN');
 assert.equal(c73.surface_a_chat.kind,'ORDINARY_HOST_CHAT_BODY');
 assert.equal(c73.surface_a_chat.source,'C71_HOST_OWNED_DRAFT');
 assert.equal(c73.surface_b_links.length,0);
 assert.equal(c73.active,false);
 assert.equal(c73.native_delivery_attested,false);
 assert.equal(c73.inter_turn_persistence_attested,false);
 assert.equal(c73.first_unclosed_edge,'HOST_E2E_ORIGIN_AND_FUTURE_TURN_EVIDENCE');
});
test('C74 canonical attempts MUST stop without a real owner handoff or ACTIVE readback',()=>{
 const c=selection('CANONICAL');
 assert.equal(validateC72ModeSelection(c,{mode:'CANONICAL',sourceHead:repoHead}),true);
 assert.equal(c.status,'CANONICAL_REQUESTED_NOT_ACTIVE');
 assert.throws(()=>runCanonicalSessionChat('I ACCEPT'),/canonical composition handoff required/);
 assert.throws(()=>runCanonicalSessionChat('EXPERIMENTAL'),/requires exact I ACCEPT/);
 const capsule=buildC73ProjectCapsule({selection:c});
 assert.equal(capsule.status,'CANONICAL_REQUESTED_NOT_ACTIVE');
 assert.deepEqual(capsule.surface_b_links,[]);
 assert.equal(capsule.active,false);
});
test('C74 1,000 adversarial variants cannot promote common consent to canonical or produce invented URLs',()=>{
 let rejected=0;
 for(let i=0;i<1000;i++){
  const n=i%10,f=Math.floor(i/10)%10,g=Math.floor(i/100)%10;
  const t=frozen();
  let denied;
  if(g===0){
   denied=acceptC72Terms({offer:t.offer,humanMessage:'I ACCEPT'+String(i),termsPresented:true});
   assert.equal(denied.status,'INVALID_ACCEPTANCE');
  }else if(g===1){
   denied=selectC72Mode({accepted:t.accepted,orientation:t.introduction,humanMessage:'EXPERIMENTAL '+n});
   assert.equal(denied.status,'INVALID_SELECTION');
  }else if(g===2){
   const x=fixture();x.sourceObject.blob_sha1=String(n).repeat(40);
   denied=qualifyC69ExperimentalPreview(x);
   assert.notEqual(denied.status,'EXPERIMENTAL_SOURCE_PREVIEW');
  }else if(g===3){
   const x=fixture();x.unifiedSelection=selection('CANONICAL');
   denied=qualifyC69ExperimentalPreview(x);
   assert.equal(denied.status,'EXPERIMENTAL_UNIFIED_SELECTION_INVALID');
  }else if(g===4){
   denied=buildC73ProjectCapsule({selection:selection('CANONICAL'),
     hostUrls:['sandbox:/mnt/data/never-created-'+i+'.docx']});
   assert.equal(denied.first_unclosed_edge,'HOST_URLS_MUST_BE_NATIVE_DELIVERY_ACTIONS');
  }else if(g===5){
   denied=buildC73ProjectCapsule({selection:selection('CANONICAL'),
     ownerResult:{state:'ACTIVE'},hostFrame:{state:'ACTIVE'}});
   assert.equal(denied.first_unclosed_edge,'CANONICAL_OWNER_ACTIVE_READBACK_REQUIRED');
  }else if(g===6){
   const x=fixture();x.claimActive=true;
   denied=qualifyC69ExperimentalPreview(x);
   assert.equal(denied.status,'EXPERIMENTAL_SCOPE_REJECTED');
  }else if(g===7){
   const x=fixture();x.requestCanonicalRuntime=true;
   denied=runC70ExperimentalComputePreview(x);
   assert.notEqual(denied.status,'EXPERIMENTAL_COMPUTE_PREVIEW');
  }else if(g===8){
   denied=buildC73ProjectCapsule({selection:selection('EXPERIMENTAL'),
     experimentalResult:{status:'EXPERIMENTAL_HOST_DRAFT',active:true}});
   assert.equal(denied.status,'EXPERIMENTAL_SELECTED_NOT_RUNNING');
  }else {
   const x=fixture();x.sourceHead=String(n).repeat(40);
   denied=qualifyC69ExperimentalPreview(x);
   assert.notEqual(denied.status,'EXPERIMENTAL_SOURCE_PREVIEW');
  }
  assert.equal(denied.active,false);
  assert.notEqual(denied.status,'ACTIVE');
  if(denied.surface_b_links)assert.deepEqual(denied.surface_b_links,[]);
  rejected++;
 }
 assert.equal(rejected,1000);
});
