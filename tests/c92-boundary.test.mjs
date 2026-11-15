import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {inspectC92ProviderConfiguration} from '../host/c92-live-provider.mjs';
import {checkC92Request,executeC92ProductionTurn} from '../host/c92-owner-surface.mjs';
import {C93_TEST_HEAD,makeC93Fixture} from './c93-fixture.mjs';
import {validateC92IndependentEnvelope} from '../host/c92-independent-check.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const sample=makeC93Fixture();
test('production rejects unconfigured real model and never invents a positive surface',async()=>{
 const r=await executeC92ProductionTurn(sample);
 assert.equal(r.status,'C92_STOP');
 assert.equal(r.first_unclosed_edge,'REAL_PROVIDER_CONFIGURATION_MISSING');
 assert.equal(r.surface_a,null);assert.equal(r.active,false);
 assert.equal(r.actual_model_provider_attested,false);
});
test('same message SHA and frozen main are obligatory',()=>{
 assert.equal(checkC92Request(sample),null);
 assert.equal(checkC92Request({...sample,inputSha256:'a'.repeat(64)}),'CURRENT_INPUT_IDENTITY');
 assert.equal(checkC92Request({...sample,sourceHead:'c'.repeat(40)}),'C93_SOURCE_EPOCH_INVALID');
 assert.equal(checkC92Request({...sample,voice:'forged'}),'FORGED_OUTPUT_INPUT');
 assert.equal(checkC92Request({...sample,runtimeReceipt:{status:'READY'}}),'FORGED_OUTPUT_INPUT');
});
test('two distinct configured models/keys are required, no actual provider call',()=>{
 const a='A'.repeat(40),b='B'.repeat(40);
 const env={IKANT_C92_GENERATOR_MODEL:'model-one',IKANT_C92_REVIEWER_MODEL:'model-two',
 IKANT_C92_GENERATOR_KEY:a,IKANT_C92_REVIEWER_KEY:b};
 assert.equal(inspectC92ProviderConfiguration(env).ok,true);
 assert.equal(inspectC92ProviderConfiguration({...env,IKANT_C92_REVIEWER_KEY:a}).ok,false);
 assert.equal(inspectC92ProviderConfiguration({...env,IKANT_C92_REVIEWER_MODEL:'model-one'}).ok,false);
 assert.equal(inspectC92ProviderConfiguration({}).ok,false);
});
const TOPICS=['ORIGIN','IDENTITY','BOUNDARIES','WORLD_EVIDENCE','MEMORY','AGENCY','EMBODIMENT','UNCERTAINTY','CONTINUITY','REVISION'];
function fixture(){
 const input='c'.repeat(64),head=C93_TEST_HEAD;
 const candidate={input_sha256:input,source_head:head,authority:0,active:false,
  phenomenal_claim:false,model_origin_attested:false,native_delivery_attested:false,
  task_kind:'SELF_ONTOLOGY',synthesis_evidence_ids:['SRC_01','SRC_02'],
  identity_definition:'Repository bounded computational identity',
  world_relation:'External evidence requires source attribution',epistemic_limits:'Phenomenology remains unknown',
  questions:TOPICS.map((topic,i)=>({topic,question:'Question '+i,answer:'Answer '+i,evidence_ids:['SRC_01']}))};
 const rh=sha('review');
 const traces=[{phase:'GENERATOR',response_id:'resp_12345678',requested_model:'model-one',response_model:'model-one',
  provider_receipt_signature_verified:false,native_host_event_attested:false,
  transport:'ACTUAL_NODE_HTTPS_REQUEST_TLS_VERIFICATION',input_sha256:input,
  raw_response_sha256:sha('g'),request_sha256:sha('request-g'),output_sha256:sha(JSON.stringify(candidate))},
 {phase:'REVIEWER',response_id:'resp_12345679',requested_model:'model-two',response_model:'model-two',
  provider_receipt_signature_verified:false,native_host_event_attested:false,
  transport:'ACTUAL_NODE_HTTPS_REQUEST_TLS_VERIFICATION',input_sha256:input,
  raw_response_sha256:sha('r'),request_sha256:sha('request-r'),output_sha256:rh}];
 return {candidate,input_sha256:input,review_sha256:rh,source_head:head,traces,
  claims:{active:false,native_chat_delivery:false,semantic_truth_verified:false,
   actual_provider_signed_provenance:false}};
}
test('separate checker returns only BOUNDED_STRUCTURE, not provider or semantic truth proof',()=>{
 const r=validateC92IndependentEnvelope(fixture());
 assert.equal(r.status,'BOUNDED_STRUCTURE_VALID');
 assert.equal(r.human_factual_truth_established,false);
});
test('independent checker rejects shape-valid but mismatched readbacks',()=>{
 const x=fixture();x.candidate.questions[0].topic='INVENTED';
 assert.equal(validateC92IndependentEnvelope(x).status,'DENY');
});
test('independent checker denies reviewer drift and fake native origin',()=>{
 const x=fixture();x.review_sha256=sha('wrong');
 assert.equal(validateC92IndependentEnvelope(x).status,'DENY');
 const y=fixture();y.claims.native_chat_delivery=true;
 assert.equal(validateC92IndependentEnvelope(y).status,'DENY');
});
test('independent checker rejects duplicated topics, provider IDs, models and forged fields',()=>{
 for(const mutate of [
  x=>x.candidate.questions[1].topic=x.candidate.questions[0].topic,
  x=>x.traces[1].response_id=x.traces[0].response_id,
  x=>x.traces[1].requested_model=x.traces[0].requested_model,
  x=>x.source_head='a'.repeat(40),
  x=>x.candidate.active=true,
  x=>x.extraneous='model_forged']){
  const x=fixture();mutate(x);assert.equal(validateC92IndependentEnvelope(x).status,'DENY');
 }
});
test('independent checker rejects a phenomenal first-person claim',()=>{
 const x=fixture();x.candidate.identity_definition='I am conscious';
 assert.equal(validateC92IndependentEnvelope(x).status,'DENY');
});

test('actual independent child Node executes and returns same-input bound bytes',()=>{
 const q=fixture();
 const child=spawnSync(process.execPath,[new URL('../host/c92-independent-check.mjs',import.meta.url).pathname],{
  input:JSON.stringify(q),encoding:'utf8',timeout:5000,maxBuffer:128000,
  env:{LANG:'C',PATH:process.env.PATH||'/usr/bin:/bin',NODE_OPTIONS:''}});
 assert.equal(child.status,0,child.stderr);
 const readback=JSON.parse(child.stdout.trim());
 assert.equal(readback.status,'BOUNDED_STRUCTURE_VALID');
 assert.equal(readback.input_sha256,q.input_sha256);
 assert.equal(readback.candidate_sha256,sha(JSON.stringify(q.candidate)));
 assert.equal(readback.human_factual_truth_established,false);
});
