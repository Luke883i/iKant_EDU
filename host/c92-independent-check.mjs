import fs from 'node:fs';
import crypto from 'node:crypto';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const hex=/^[0-9a-f]{64}$/;
const deny=edge=>({schema:'ikant-le-c92-independent-check/v1',status:'DENY',edge,
 human_factual_truth_established:false,authority:0});
export function validateC92IndependentEnvelope(x){
 if(!x||typeof x!=='object'||Array.isArray(x)||
  Object.keys(x).sort().join(',')!=='candidate,claims,input_sha256,review_sha256,source_head,traces')return deny('BAD_ENVELOPE');
 if(!x.claims||typeof x.claims!=='object'||Array.isArray(x.claims)||
   Object.keys(x.claims).sort().join(',')!==['active','native_chat_delivery','semantic_truth_verified','actual_provider_signed_provenance'].sort().join(',')||
   Object.values(x.claims).some(v=>v!==false))return deny('CLAIM_SET_INVALID');
 if(!hex.test(x.input_sha256)||!hex.test(x.review_sha256)||
   !/^[a-f0-9]{40}$/.test(x.source_head))return deny('IDENTITY');
 const c=x.candidate;
 if(!c||c.input_sha256!==x.input_sha256||c.source_head!==x.source_head||
  c.authority!==0||c.active!==false||c.phenomenal_claim!==false||
  c.model_origin_attested!==false||c.native_delivery_attested!==false)return deny('CANDIDATE_CLAIMS');
 if(!Array.isArray(x.traces)||x.traces.length!==2||
   x.traces[0].phase!=='GENERATOR'||x.traces[1].phase!=='REVIEWER'||
   x.traces[0].response_id===x.traces[1].response_id||
   x.traces[0].requested_model===x.traces[1].requested_model||
   !x.traces.every(t=>t&&typeof t==='object'&&!Array.isArray(t)&&
     Object.keys(t).sort().join(',')===['phase','response_id','requested_model','response_model',
       'raw_response_sha256','request_sha256','output_sha256','input_sha256',
       'transport','provider_receipt_signature_verified','native_host_event_attested'].sort().join(',')&&
     t.response_model===t.requested_model&&
     t.provider_receipt_signature_verified===false&&t.native_host_event_attested===false&&
     t.transport==='ACTUAL_NODE_HTTPS_REQUEST_TLS_VERIFICATION'&&
     t.input_sha256===x.input_sha256&&hex.test(t.raw_response_sha256)&&
     hex.test(t.request_sha256)&&hex.test(t.output_sha256)))return deny('TRANSPORT_AND_BOUND_INPUT');
 if(sha(JSON.stringify(c))!==x.traces[0].output_sha256||
    x.review_sha256!==x.traces[1].output_sha256)return deny('RAW_RESPONSE_OUTPUT_BINDING');
 if(!Array.isArray(c.synthesis_evidence_ids)||new Set(c.synthesis_evidence_ids).size<2||
  !Array.isArray(c.questions))return deny('EVIDENCE_BREADTH');
 if(c.task_kind==='SELF_ONTOLOGY'){
   const expected=['ORIGIN','IDENTITY','BOUNDARIES','WORLD_EVIDENCE','MEMORY','AGENCY','EMBODIMENT','UNCERTAINTY','CONTINUITY','REVISION'];
   if(c.questions.length!==10||new Set(c.questions.map(q=>q.topic)).size!==10||
    !expected.every(t=>c.questions.some(q=>q.topic===t)))return deny('TOPICS');
 }
 const all=[c.identity_definition,c.world_relation,c.epistemic_limits,
  ...c.questions.map(q=>q.question+' '+q.answer)].join(' ');
 if(/\b(?:i\s+am\s+conscious|i\s+feel\s+sentient|sono\s+cosciente|sono\s+senziente|canonical\s+active|native\s+event\s+attested)\b/i.test(all))
  return deny('FORBIDDEN_CLAIMS');
 if(x.claims?.actual_provider_signed_provenance===true||x.claims?.semantic_truth_verified===true||
   x.claims?.native_chat_delivery===true||x.claims?.active===true)return deny('CLAIM_LAUNDERING');
 return {schema:'ikant-le-c92-independent-check/v1',status:'BOUNDED_STRUCTURE_VALID',
  input_sha256:x.input_sha256,candidate_sha256:sha(JSON.stringify(c)),
  reviewer_sha256:x.review_sha256,human_factual_truth_established:false,
  scope:'SEPARATE_NODE_PROCESS_STRUCTURAL_NOT_SEMANTIC_ENTAILMENT',authority:0};
}
if(process.argv[1]?.endsWith('/c92-independent-check.mjs')){
 let out;
 try{
  const bytes=fs.readFileSync(0);
  if(bytes.length>85000||!bytes.length)throw Error('INPUT_SIZE');
  out=validateC92IndependentEnvelope(JSON.parse(bytes.toString('utf8')));
 }catch{out=deny('MALFORMED_INPUT');}
 process.stdout.write(JSON.stringify(out)+'\n');
 if(out.status!=='BOUNDED_STRUCTURE_VALID')process.exitCode=2;
}
