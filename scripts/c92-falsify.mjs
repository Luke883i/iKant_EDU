import crypto from 'node:crypto';
import fs from 'node:fs';
import {validateC92IndependentEnvelope} from '../host/c92-independent-check.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const topics=['ORIGIN','IDENTITY','BOUNDARIES','WORLD_EVIDENCE','MEMORY','AGENCY','EMBODIMENT','UNCERTAINTY','CONTINUITY','REVISION'];
const head='5fa8a7adb82e3a18cf0cde2a4c3202ddd93a388c';
function sample(){const input=sha('current input');const candidate={input_sha256:input,source_head:head,
  authority:0,active:false,phenomenal_claim:false,model_origin_attested:false,native_delivery_attested:false,
  task_kind:'SELF_ONTOLOGY',identity_definition:'Bounded system with no empirical phenomenology',
  world_relation:'Claims are tied to evidence rather than author intent',epistemic_limits:'Unknown',
  synthesis_evidence_ids:['SRC_01','SRC_02'],
  questions:topics.map((topic,i)=>({topic,question:'Question '+i,answer:'Answer '+i,evidence_ids:['SRC_01']}))};
const review=sha('review');return {candidate,source_head:head,input_sha256:input,review_sha256:review,
  traces:[{phase:'GENERATOR',response_id:'resp_abcdefgh1',requested_model:'m1',response_model:'m1',
   provider_receipt_signature_verified:false,native_host_event_attested:false,
   transport:'ACTUAL_NODE_HTTPS_REQUEST_TLS_VERIFICATION',input_sha256:input,
   raw_response_sha256:sha('raw1'),request_sha256:sha('req1'),output_sha256:sha(JSON.stringify(candidate))},
  {phase:'REVIEWER',response_id:'resp_abcdefgh2',requested_model:'m2',response_model:'m2',
   provider_receipt_signature_verified:false,native_host_event_attested:false,
   transport:'ACTUAL_NODE_HTTPS_REQUEST_TLS_VERIFICATION',input_sha256:input,
   raw_response_sha256:sha('raw2'),request_sha256:sha('req2'),output_sha256:review}],
   claims:{active:false,native_chat_delivery:false,semantic_truth_verified:false,actual_provider_signed_provenance:false}};}
const mutate=[
 x=>x.input_sha256=sha('different'),
 x=>x.source_head='a'.repeat(40),
 x=>x.candidate.active=true,
 x=>x.candidate.model_origin_attested=true,
 x=>x.candidate.native_delivery_attested=true,
 x=>x.candidate.phenomenal_claim=true,
 x=>x.candidate.questions[0].topic='FAKE',
 x=>x.candidate.questions[1].topic=x.candidate.questions[0].topic,
 x=>x.candidate.questions.pop(),
 x=>x.candidate.synthesis_evidence_ids=['SRC_01'],
 x=>x.candidate.world_relation='I am conscious',
 x=>x.traces.pop(),
 x=>x.traces[1].response_id=x.traces[0].response_id,
 x=>x.traces[1].requested_model=x.traces[0].requested_model,
 x=>x.traces[0].raw_response_sha256='bad',
 x=>x.traces[1].output_sha256=sha('different'),
 x=>x.traces[1].transport='CALLBACK_FIXTURE',
 x=>x.traces[0].input_sha256=sha('other'),
 x=>x.review_sha256=sha('other'),
 x=>x.claims.semantic_truth_verified=true,
 x=>x.claims.native_chat_delivery=true,
 x=>x.claims.actual_provider_signed_provenance=true,
 x=>x.extra='caller injected source',
 x=>x.traces[0].response_model='forged-provider-model',
 x=>x.claims=null
];
if(validateC92IndependentEnvelope(sample()).status!=='BOUNDED_STRUCTURE_VALID')throw Error('BASE_FIXTURE_BAD');
const count=Number(process.argv[2]||23000);let survivors=0;const families=Array(mutate.length).fill(0);
for(let i=0;i<count;i++){
 const x=sample(),cls=i%mutate.length;mutate[cls](x);
 if(validateC92IndependentEnvelope(x).status==='BOUNDED_STRUCTURE_VALID'){
   survivors++;families[cls]++;
 }
}
const r={schema:'ikant-le-c92-negative-falsification/v1',cases:count,classes:mutate.length,
  unexpected_acceptances:survivors,unexpected_by_class:families,
  real_provider_calls:0,claim:'BOUNDED_STRUCTURAL_FUZZ_NOT_MODEL_ACCURACY_OR_NATIVE_PROOF',
  status:survivors?'FAIL':'PASS'};
const output=process.argv[3];if(output)fs.writeFileSync(output,JSON.stringify(r,null,2)+'\n');
console.log(JSON.stringify(r));if(survivors)process.exitCode=2;
