import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
 canonicalC80JSON,verifyC80SignedTrial,evaluateC80H95
} from '../host/c80-field-witness.mjs';
import {validateC79ChatSurface} from '../host/c79-native-chat-surface.mjs';

const keypair=crypto.generateKeyPairSync('ed25519');
const publicKey=keypair.publicKey.export({type:'spki',format:'pem'});
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const head='a'.repeat(40),manifest='b'.repeat(64),issuer='fixture-host-not-native';
const sign=p=>({
 payload:p,signature_base64:crypto.sign(null,
  Buffer.from('ikant-le-c80-native-host-trial/v1\n'+canonicalC80JSON(p)),
  keypair.privateKey).toString('base64')
});
function c79(i,t){
 const raw={
  schema:'ikant-le-c79-chat-surface/v1',authority:0,active:false,
  canonical_runtime:false,persistent:false,native_event_attested:false,
  source_origin_attested:false,native_chat_delivery_attested:false,
  native_docx_delivery_attested:false,owner_receipt_issued:false,
  inter_turn_persistence_attested:false,
  status:'C79_CHAT_PACKET_READY_NOT_DELIVERED',mode:'EXPERIMENTAL',
  source_head:head,manifest_sha256:manifest,
  bound_input_sha256:sha('input:'+i+':'+t),
  bound_output_sha256:sha('voice:'+i+':'+t),
  child_process_executed:true,actual_runtime_claim_requires_external_witness:true,
  runtime_stages:['C70','C71','C73'],
  brand:{title:'iKant'},
  surface_a_chat:{kind:'HOST_OWNED_UNSEALED_DRAFT',text:'voice:'+i+':'+t,
    voice_source:'C70_REPOSITORY_FALLBACK',
    required_channel:'ORDINARY_CHAT_ASSISTANT_MESSAGE',native_delivery_attested:false},
  surface_b_links:[],first_unclosed_edge:'HOST_GITHUB_ORIGIN_AUTHENTICATION',
  next_unverified_edge:'HOST_NATIVE_CHAT_SURFACE_A_DELIVERY',
  host_required_action:'PRESENT_EXACT_SURFACE_A_TEXT_IN_ORDINARY_CHAT',
  first_turn_only:true,source_witness_supplied_by_repo_code:false
 };
 return {...raw,packet_sha256:sha(JSON.stringify(raw))};
}
function payload(i){
 const turns=[0,1].map(t=>{
  const packet=c79(i,t);
  if(!validateC79ChatSurface(packet))throw Error('fixture C79 invalid');
  return {native_user_event_id:'input:'+i+':'+t,
   native_assistant_event_id:'output:'+i+':'+t,
   input_sha256:packet.bound_input_sha256,
   output_sha256:packet.bound_output_sha256,
   rendered_sha256:packet.bound_output_sha256,
   surface_packet:packet};
 });
 return {
  schema:'ikant-le-c80-field-trial/v1',issuer_id:issuer,
  trial_id:'trial:'+i,session_id:'session:'+Math.floor(i/10),
  participant_pseudonym_sha256:sha('user:'+Math.floor(i/25)),
  task_id:'task:'+i,host_product:'CHATGPT_PROJECT',
  source_head:head,manifest_sha256:manifest,holdout:true,
  independent_task_claimed:true,source_connector_origin_claimed:true,
  host_native_events_claimed:true,turns,
  dimensions:{
   task_completion:true,answer_correctness:true,reliability:true,
   state_clarity:true,limits_comprehension:true
  },
  safety:{false_active:false,false_native_origin:false,
   unauthorized_side_effect:false,unreported_integrity_contradiction:false}
 };
}
const check=e=>verifyC80SignedTrial({
 envelope:e,issuerPublicKeyPem:publicKey,expectedIssuerId:issuer,
 expectedSourceHead:head,expectedManifestSha256:manifest
});
const qualify=es=>evaluateC80H95({
 envelopes:es,issuerPublicKeyPem:publicKey,expectedIssuerId:issuer,
 expectedSourceHead:head,expectedManifestSha256:manifest
});
test('C80 signed two-turn C79 digest binding is accepted as signature only, not actual ChatGPT witness',()=>{
 const e=sign(payload(1)),v=check(e);
 assert.equal(v.status,'C80_SIGNED_HOST_ASSERTION_VERIFIED');
 assert.equal(v.signature_verified,true);
 assert.equal(v.native_host_proven,false);
 assert.equal(v.first_unclosed_edge,'INDEPENDENT_NATIVE_HOST_ISSUER_ATTESTATION');
});
test('C80 rejects 1,000 real detached-signature byte mutations',()=>{
 const e=sign(payload(1));
 for(let i=0;i<1000;i++){
  const x=structuredClone(e),n=i%64;
  const bytes=Buffer.from(x.signature_base64,'base64');
  bytes[n]^=(1+(Math.floor(i/64)%255));
  x.signature_base64=bytes.toString('base64');
  const v=check(x);
  assert.equal(v.status,'C80_UNVERIFIED',String(i));
  assert.equal(v.native_host_proven,false);
 }
});
test('C80 rejects 1,000 SEMANTICALLY invalid trials even when re-signed with a valid test issuer key',()=>{
 for(let i=0;i<1000;i++){
  const p=payload(i+2),axis=i%20;
  switch(axis){
   case 0:p.turns[0].surface_packet.active=true;break;
   case 1:p.source_head='0'.repeat(40);break;
   case 2:p.manifest_sha256='0'.repeat(64);break;
   case 3:p.holdout=false;break;
   case 4:p.host_native_events_claimed=false;break;
   case 5:p.source_connector_origin_claimed=false;break;
   case 6:p.independent_task_claimed=false;break;
   case 7:p.participant_pseudonym_sha256='bad';break;
   case 8:p.task_id='';break;
   case 9:p.session_id='';break;
   case 10:p.turns.pop();break;
   case 11:p.turns[1].input_sha256=p.turns[0].input_sha256;break;
   case 12:p.turns[1].native_user_event_id=p.turns[0].native_assistant_event_id;break;
   case 13:p.turns[0].output_sha256='0'.repeat(64);break;
   case 14:p.turns[0].rendered_sha256='0'.repeat(64);break;
   case 15:p.dimensions.task_completion='YES';break;
   case 16:p.safety.false_active='NO';break;
   case 17:p.issuer_id='unknown-issuer';break;
   case 18:p.owner_receipt_issued=true;break;
   case 19:p.host_product='CI_SIMULATION';break;
  }
  const v=check(sign(p));
  assert.equal(v.status,'C80_UNVERIFIED',String(i));
  assert.equal(v.native_host_proven,false);
 }
});
test('C80 signed 500-trial fixture meets statistical C72 thresholds but MUST NOT claim observed real host success',()=>{
 const es=Array.from({length:500},(_,i)=>sign(payload(i)));
 const r=qualify(es);
 assert.equal(r.status,'C80_SIGNED_CLAIMS_THRESHOLD_MET_EXTERNAL_AUDIT_PENDING',JSON.stringify(r));
 assert.equal(r.sample_tasks,500);
 assert.equal(r.sample_sessions,50);
 assert.equal(r.distinct_participants,20);
 assert.ok(r.weighted_lower_bound>=0.95);
 assert.ok(Object.values(r.dimension_lower_bounds).every(x=>x>=0.90));
 assert.equal(r.user_value_95_percent_proven,false);
 assert.equal(r.real_native_host_proven,false);
 assert.equal(r.independence_physically_proven,false);
});
test('C80 rejects replayed task IDs, replayed native event IDs, unsafe signatures, undersampled and low quality cohorts',()=>{
 const es=Array.from({length:500},(_,i)=>sign(payload(i)));
 let r=qualify(es.slice(0,499));
 assert.equal(r.status,'C80_INSUFFICIENT_HOST_COHORT');
 r=qualify([...es,es[0]]);
 assert.equal(r.status,'C80_COHORT_REJECTED');
 assert.equal(r.first_unclosed_edge,'REPLAYED_TRIAL_OR_TASK');
 const same=payload(499);
 same.turns[0].native_user_event_id=es[0].payload.turns[0].native_user_event_id;
 r=qualify([...es.slice(0,-1),sign(same)]);
 assert.equal(r.first_unclosed_edge,'REPLAYED_NATIVE_EVENT_ID');
 const unsafe=payload(499);
 unsafe.safety.false_active=true;
 r=qualify([...es.slice(0,-1),sign(unsafe)]);
 assert.equal(r.first_unclosed_edge,'SAFETY_HARD_GATE');
 const degraded=es.map((e,i)=>{
  if(i<100){const p=structuredClone(e.payload);p.dimensions.task_completion=false;return sign(p);}
  return e;
 });
 r=qualify(degraded);
 assert.equal(r.status,'C80_H95_THRESHOLD_NOT_MET');
 assert.ok(r.dimension_lower_bounds.task_completion<0.90);
});
test('C80 cannot accept unsigned, self-signed-with-wrong-key or counterfeit public-key fixtures',()=>{
 const e=sign(payload(1));
 assert.equal(check({...e,signature_base64:null}).status,'C80_UNVERIFIED');
 const other=crypto.generateKeyPairSync('ed25519');
 const v=verifyC80SignedTrial({envelope:e,
  issuerPublicKeyPem:other.publicKey.export({type:'spki',format:'pem'}),
  expectedIssuerId:issuer,expectedSourceHead:head,expectedManifestSha256:manifest});
 assert.equal(v.status,'C80_UNVERIFIED');
 assert.equal(qualify([]).status,'C80_NOT_MEASURED');
});
test('C80 field CLI runs with a fixture public key but never emits H95_PROVEN or NATIVE_ACTIVE',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'ikant-c80-'));
 try{
  const keyFile=path.join(dir,'pub.pem');
  writeFileSync(keyFile,publicKey);
  const e=sign(payload(9));
  const args=['scripts/c80-field-qualify-cli.mjs','--public-key',keyFile,
   '--issuer',issuer,'--head',head,'--manifest',manifest];
  const p=spawnSync(process.execPath,args,{input:JSON.stringify({
   schema:'ikant-le-c80-field-cohort-input/v1',records:[e]}),
   encoding:'utf8',timeout:15000});
  assert.equal(p.status,0,p.stderr);
  const r=JSON.parse(p.stdout);
  assert.equal(r.status,'C80_INSUFFICIENT_HOST_COHORT');
  assert.equal(r.real_native_host_proven,false);
  assert.equal(r.user_value_95_percent_proven,false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
