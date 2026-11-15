import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {makeC92LivePorts} from './c92-live-provider.mjs';
import {checkC93SourceEpoch} from './c93-source-epoch.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const H40=/^[0-9a-f]{40}$/,H64=/^[0-9a-f]{64}$/;
const STOP=edge=>({schema:'ikant-le-c92-owner-surface/v1',status:'C92_STOP',
 first_unclosed_edge:edge,actual_model_provider_attested:false,
 native_chat_delivery_attested:false,active:false,authority:0,
 surface_a:null});
const prohibited=new Set(['voice','hostCandidate','runtimeReceipt','ownerReceipt',
 'runtime_computed_answer','providerReceipt','modelOutput','reviewResult','active']);
// No compile-time main SHA. The C84 bytes freeze the epoch per request; C90 verifies C85/C81.
export const C92_MAIN_BASE=null;
export function checkC92Request(q){
 if(!q||typeof q!=='object'||Array.isArray(q)||
  (Object.keys(q).some(k=>prohibited.has(k))||
   Object.keys(q).sort().join(',')!==['sourceHead','humanInput','inputSha256',
     'manifestSha256','packageSha256','packageBase64','selection'].sort().join(',')))return 'FORGED_OUTPUT_INPUT';
 if(!H40.test(q.sourceHead||''))return 'FROZEN_HEAD_REQUIRED';
 if(typeof q.humanInput!=='string'||!q.humanInput.trim()||
  Buffer.byteLength(q.humanInput,'utf8')>600||!H64.test(q.inputSha256)||
  sha(Buffer.from(q.humanInput,'utf8'))!==q.inputSha256)return 'CURRENT_INPUT_IDENTITY';
 if(checkC93SourceEpoch(q).status!=='C93_SOURCE_BYTES_BOUND_C81_STILL_REQUIRED')return 'C93_SOURCE_EPOCH_INVALID';
 if(q.selection?.selected_mode!=='EXPERIMENTAL'||
  q.selection?.status!=='EXPERIMENTAL_SELECTED_NOT_RUNNING')return 'VALID_C72_SELECTION_REQUIRED';
 return null;
}
function independentlyCheckC92(q,draft,traces,ports){
 if(!draft||draft.status!=='C91_STRUCTURALLY_VALIDATED_HOST_LANGUAGE_DRAFT_NOT_IKANT_SURFACE_A'||
   draft.bound_input_sha256!==q.inputSha256||draft.owner_input_sha256!==q.inputSha256||
   draft.source_head!==q.sourceHead||draft.source_package_sha256!==q.packageSha256||
   draft.actual_model_provider_attested!==false||draft.native_chat_delivery_attested!==false||
   draft.active!==false)return 'C91_SAME_INPUT_OWNER_READBACK';
 if(!ports.config.ok||traces.length!==2||
   traces[0].phase!=='GENERATOR'||traces[1].phase!=='REVIEWER'||
   traces[0].response_id===traces[1].response_id||
   traces[0].requested_model===traces[1].requested_model||
   !traces.every(x=>x.transport==='ACTUAL_NODE_HTTPS_REQUEST_TLS_VERIFICATION'&&
     x.input_sha256===q.inputSha256&&
     /^resp_[A-Za-z0-9_-]{8,150}$/.test(x.response_id)&&
     H64.test(x.raw_response_sha256)&&H64.test(x.request_sha256)&&H64.test(x.output_sha256)))
   return 'TWO_ACTUAL_PROVIDER_READBACKS';
 if(traces[0].output_sha256!==draft.candidate_sha256||
   traces[1].output_sha256!==draft.review_sha256)
   return 'PROVIDER_OUTPUT_TO_C91_BINDING';
 const d=draft.candidate;
 if(!d||d.input_sha256!==q.inputSha256||d.source_head!==q.sourceHead||
   d.phenomenal_claim!==false||d.biological_equivalence_claim!==false||
   d.active!==false||d.native_delivery_attested!==false||
   d.model_origin_attested!==false)return 'CANDIDATE_CLAIM_DRIFT';
 if(d.task_kind==='SELF_ONTOLOGY'){
  if(d.questions.length!==10||new Set(d.questions.map(x=>x.topic)).size!==10)
    return 'ONTOLOGY_BREADTH';
 }
 if(!Array.isArray(d.synthesis_evidence_ids)||new Set(d.synthesis_evidence_ids).size<2)
   return 'INSUFFICIENT_SOURCE_DIVERSITY';
 if(/\b(?:i am conscious|i feel sentient|sono cosciente|sono senziente|canonical active|native event attested)\b/i.test(
   [d.identity_definition,d.world_relation,d.epistemic_limits,...d.questions.map(x=>x.answer)].join(' ')))
   return 'BANNED_HUMAN_OR_STATUS_ASSERTION';
 return null;
}
function createSurfaceA(d){
 const sections=[d.identity_definition,d.world_relation];
 if(d.questions.length)sections.push(d.questions.map((x,i)=>
  `${i+1}. ${x.question}\n${x.answer}`).join('\n\n'));
 sections.push(d.epistemic_limits);
 return sections.join('\n\n');
}
function fsyncExact(bytes,baseDir){
 const dir=fs.mkdtempSync(path.join(baseDir,'ikant-c92-'));
 fs.chmodSync(dir,0o700);
 const p=path.join(dir,'surface-a.txt');
 let fd;try{
  fd=fs.openSync(p,'wx',0o600);
  if(fs.writeSync(fd,bytes)!==bytes.length)throw new Error('SHORT_WRITE');
  fs.fsyncSync(fd);
 }finally{if(fd!==undefined)fs.closeSync(fd);}
 if(!fs.readFileSync(p).equals(bytes))throw new Error('REOPEN_NOT_IDENTICAL');
 return {path:p,sha256:sha(bytes),bytes:bytes.length,write_reopen_verified:true};
}
/** Only this entry can produce the C92 experimental host-owned surface.
 * C91 itself invokes real C90 owner on this exact input. No callback or receipt
 * can be supplied by the outer caller. This is NOT C81 or canonical Surface A. */
export async function executeC92ProductionTurn(q,{evidenceDir=os.tmpdir()}={}){
 const inputEdge=checkC92Request(q);if(inputEdge)return STOP(inputEdge);
 if(typeof evidenceDir!=='string'||!path.isAbsolute(evidenceDir))return STOP('EVIDENCE_PARENT_INVALID');
 const ports=makeC92LivePorts();
 if(!ports.config.ok)return STOP(ports.config.first_unclosed_edge);
 let draft;
 try{
   const {executeC91FromRealC90}=await import('./c91-causal-turn.mjs');
   draft=await executeC91FromRealC90(q,{languagePort:ports.languagePort,reviewPort:ports.reviewPort});
 }catch{return STOP('REAL_C90_C91_CALL_FAILED');}
 if(draft?.status!=='C91_STRUCTURALLY_VALIDATED_HOST_LANGUAGE_DRAFT_NOT_IKANT_SURFACE_A')
   return STOP(draft?.first_unclosed_edge||'REAL_C90_C91_NOT_READY');
 const traces=ports.verifiedTraces();
 const edge=independentlyCheckC92(q,draft,traces,ports);
 if(edge)return STOP(edge);
 const independent=spawnSync(process.execPath,[new URL('./c92-independent-check.mjs',import.meta.url).pathname],{
  input:JSON.stringify({candidate:draft.candidate,input_sha256:q.inputSha256,
   source_head:q.sourceHead,review_sha256:draft.review_sha256,traces,
   claims:{active:false,native_chat_delivery:false,semantic_truth_verified:false,
    actual_provider_signed_provenance:false}}),encoding:'utf8',timeout:12000,
  maxBuffer:128000,env:{LANG:'C',PATH:process.env.PATH||'/usr/bin:/bin',NODE_OPTIONS:''}});
 let witness;try{witness=JSON.parse(independent.stdout.trim());}catch{return STOP('INDEPENDENT_CHILD_READBACK_MALFORMED');}
 if(independent.status!==0||witness.status!=='BOUNDED_STRUCTURE_VALID'||
   witness.input_sha256!==q.inputSha256||
   witness.candidate_sha256!==draft.candidate_sha256||
   witness.reviewer_sha256!==draft.review_sha256)return STOP('INDEPENDENT_CHILD_REJECTED');
 const surface=createSurfaceA(draft.candidate);
 const raw=Buffer.from(surface,'utf8');
 if(raw.length<100||raw.length>32000)return STOP('SURFACE_A_BOUNDS');
 let evidence;
 try{evidence=fsyncExact(raw,evidenceDir);}catch{return STOP('SURFACE_A_WRITE_REOPEN');}
 if(evidence.sha256!==sha(raw))return STOP('SURFACE_A_DIGEST');
 return {schema:'ikant-le-c92-owner-surface/v1',
  status:'C92_EXPERIMENTAL_OWNER_ACCEPTED_SURFACE_A_STAGED_NOT_NATIVE_DELIVERED',
  mode:'EXPERIMENTAL',source_head:q.sourceHead,input_sha256:q.inputSha256,
  surface_a_text:surface,surface_a_sha256:evidence.sha256,
  surface_a:evidence,source_package_sha256:q.packageSha256,
  generator_response_id:traces[0].response_id,reviewer_response_id:traces[1].response_id,
  provider_readbacks:traces,provider_http_calls_observed:2,
  provider_configuration_distinct:true,independent_deterministic_checker_passed:true,
  independent_validator_separate_node_process:true,
  actual_model_provider_transport_executed:true,
  semantic_entailment_independently_proved:false,
  independently_operated_provider_organizations_attested:false,
  same_turn_c90_c91_execution_required:true,
  native_chat_delivery_attested:false,source_origin_attested:false,
  canonical_runtime:false,persistent:false,active:false,authority:0,
  next_unverified_edge:'C81_C86_OWNER_LANGUAGE_ADMISSION_AND_NATIVE_DELIVERY'};
}
