import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {buildSessionShell,renderSessionShell} from '../src/session-shell.mjs';
import {buildHostConsumptionFrame} from '../src/host-consumption-frame.mjs';
import {buildC73ProjectCapsule} from '../host/c73-project-capsule.mjs';
const HEAD='a'.repeat(40),H64='b'.repeat(64);
const modes=()=>{
 const offer=issueC72TermsOffer({sourceHead:HEAD,termsDigest:'c'.repeat(64)});
 const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const orientation=presentC72Introduction(accepted);
 return {canonical:selectC72Mode({accepted,orientation,humanMessage:'CANONICAL'}),
 experimental:selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'})};
};
const activeFixture=()=>{
 const state={status:'ACTIVE',accepted:true,probed:true,
  admission:{terms_presented:true,source_head:HEAD,source_head_locked:true,orientation_objects:Array(5).fill({})},
  bootstrap:{terminal:'ACTIVE',probe:{ok:true,executed_provenance_receipt_sha256:H64}},
  experience:{turns:2,maturity_mode:'ESTABLISHED'},psyche:{last_runtime_outcome:'ANSWER'}};
 const artifact={name:'iKant_backlog.docx',sha256:'d'.repeat(64),bytes:32,readback_verified:true,
  required_presentation:true,media_type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
 const session_shell=buildSessionShell({surfaceText:'Risposta canonica autenticata solo come fixture del repository.',state,artifacts:[artifact],release:{surface_b_required:true,release_sha256:'e'.repeat(64)}});
 const ownerResult={state:'ACTIVE',claim_class:'IKANT_ACTIVE',session_shell,stdout:renderSessionShell(session_shell),
  artifacts:[artifact],release:{release_sha256:'e'.repeat(64)},node_dispatch_receipt_sha256:'f'.repeat(64)};
 const hostFrame=buildHostConsumptionFrame({result:ownerResult,sourceHead:HEAD,runtimeRootSha256:H64,sessionRef:'fixture'});
 const canonicalActiveReadback={schema:'ikant-le-c59-canonical-active-readback/v1',
 ok:true,state:'ACTIVE',terminal:'ACTIVE',composition_authority:'C59_CANONICAL',
 canonical_composition_receipt_sha256:'9'.repeat(64),source_head:HEAD,
 runtime_root_sha256:H64,authority:0};
 return {ownerResult,hostFrame,canonicalActiveReadback};
};
const experimentalResult=()=>({schema:'ikant-le-c71-experimental-host-draft/v1',
 status:'EXPERIMENTAL_HOST_DRAFT',authority:0,active:false,canonical_runtime:false,
 native_event_attested:false,persistent:false,owner_receipt_issued:false,host_delivery_attested:false,
 routed_turns:[{index:1,input_sha256:'d'.repeat(64),output_sha256:'e'.repeat(64),
  text:'Bozza utile, ma prodotta dalla modalità sperimentale e non sigillata.',authority:0,action_executed:false}]});
test('C73 branded shell uses both user-derived logo assets and never acts as the owner',()=>{
 for(const p of ['assets/brand/ikant-light.svg','assets/brand/ikant-dark.svg']){
  const s=fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
  assert.match(s,/aria-label="iKant logo"/);
  assert.match(s,/<svg /);
 }
 const x=buildC73ProjectCapsule({selection:modes().experimental,experimentalResult:experimentalResult()});
 assert.equal(x.status,'C73_EXPERIMENTAL_DRAFT_PRESENTATION_PLAN');
 assert.equal(x.active,false);assert.equal(x.host_runtime_control,false);
 assert.equal(x.native_delivery_attested,false);
 assert.equal(x.surface_a_chat.kind,'ORDINARY_HOST_CHAT_BODY');
 assert.equal(x.surface_a_chat.source,'C71_HOST_OWNED_DRAFT');
 assert.deepEqual(x.surface_b_links,[]);
 assert.equal(x.brand.appearance_is_not_runtime_evidence,true);
});
test('C73 active fixture: owner shell voice in normal chat, verified DOCX needs real host delivery',()=>{
 const x=buildC73ProjectCapsule({selection:modes().canonical,...activeFixture()});
 assert.equal(x.status,'C73_CANONICAL_FRAME_READY_NOT_HOST_DELIVERED');
 assert.equal(x.surface_a_chat.source,'OWNER_SHELL_VOICE_TEXT');
 assert.equal(x.surface_b_required,true);
 assert.equal(x.artifact_requirements.length,1);
 assert.equal(x.artifact_requirements[0].host_download_url,null);
 assert.equal(x.required_host_actions[1].url_must_not_be_invented,true);
 assert.equal(x.native_delivery_attested,false);
 assert.equal(x.canonical_active_readback_shape_valid,true);
 assert.equal(x.owner_origin_independently_attested,false);
 assert.equal(x.active,false);
 assert.equal(x.causal_order[0],'RUNTIME_DOCX_WRITE_AND_REOPEN');
 assert.equal(x.visual_order[2],'SURFACE_B_DOWNLOAD_REFERENCES');
 assert.equal(x.visual_order[3],'SURFACE_A_NATIVE_CHAT');
 assert.match(x.owner_shell_exact_text,/Active answer|Risposta canonica/);
});
test('C73 canonical selection alone cannot produce active chat or invented link',()=>{
 const x=buildC73ProjectCapsule({selection:modes().canonical});
 assert.equal(x.status,'CANONICAL_REQUESTED_NOT_ACTIVE');
 assert.equal(x.surface_a_chat,null);
 assert.deepEqual(x.surface_b_links,[]);
 const y=buildC73ProjectCapsule({selection:modes().canonical,hostUrls:['sandbox:/mnt/data/fake.docx'],...activeFixture()});
 assert.equal(y.status,'C73_PRESENTATION_BLOCKED');
 assert.equal(y.first_unclosed_edge,'HOST_URLS_MUST_BE_NATIVE_DELIVERY_ACTIONS');
});
test('C74 C73 refuses a structural ACTIVE frame without separate C59 ACTIVE readback',()=>{
 const m=modes().canonical,f=activeFixture();
 const missing=buildC73ProjectCapsule({selection:m,ownerResult:f.ownerResult,hostFrame:f.hostFrame});
 assert.equal(missing.status,'CANONICAL_REQUESTED_NOT_ACTIVE');
 assert.equal(missing.first_unclosed_edge,'CANONICAL_OWNER_ACTIVE_READBACK_REQUIRED');
 for(const change of [
  {ok:false},{composition_authority:'MODEL_AUTHORED'},
  {source_head:'0'.repeat(40)},{runtime_root_sha256:'0'.repeat(64)},
  {canonical_composition_receipt_sha256:null},{state:'ORIENTING'}
 ]){
  const x=buildC73ProjectCapsule({selection:m,...f,canonicalActiveReadback:{...f.canonicalActiveReadback,...change}});
  assert.equal(x.status,'CANONICAL_REQUESTED_NOT_ACTIVE');
  assert.equal(x.active,false);
 }
});
test('C73 rejects 100 presentation mutants without generating ACTIVE or fake DOCX URLs',()=>{
 let rejects=0;
 for(let n=0;n<100;n++){
  const m=modes(),f=activeFixture(),exp=experimentalResult();
  const group=Math.floor(n/20),k=n%20;
  let x;
  switch(group){
   case 0:x=buildC73ProjectCapsule({selection:{...m.canonical,status:'ACTIVE'},...f});break;
   case 1:{
    const z=structuredClone(f);
    z.hostFrame.artifacts[0].sha256=(k%2?'0':'1').repeat(64);
    x=buildC73ProjectCapsule({selection:m.canonical,...z});break;
   }
   case 2:{
    const z=structuredClone(f);
    z.ownerResult.session_shell.status.active=false;
    x=buildC73ProjectCapsule({selection:m.canonical,...z});break;
   }
   case 3:{
    exp.routed_turns[0][k%2?'action_executed':'authority']=k%2?true:1;
    x=buildC73ProjectCapsule({selection:m.experimental,experimentalResult:exp});break;
   }
   case 4:x=buildC73ProjectCapsule({selection:m.experimental,experimentalResult:exp,hostUrls:['https://invalid.example/fake-'+k+'.docx']});break;
  }
  assert.notEqual(x.status,'C73_CANONICAL_FRAME_READY_NOT_HOST_DELIVERED',String(n));
  assert.notEqual(x.status,'C73_EXPERIMENTAL_DRAFT_PRESENTATION_PLAN',String(n));
  assert.equal(x.active,false);
  assert.equal(x.native_delivery_attested,false);
  assert.deepEqual(x.surface_b_links,[]);
  rejects++;
 }
 assert.equal(rejects,100);
});
