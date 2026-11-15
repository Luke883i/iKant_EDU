import fs from 'node:fs';
import crypto from 'node:crypto';
import {executeC92ProductionTurn} from './c92-owner-surface.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const stop=edge=>({schema:'ikant-le-c93-host-projection/v1',status:'C93_PROJECTION_STOP',first_unclosed_edge:edge,active:false,native_delivery_attested:false,surface_a_exact:null,authority:0});
/** Invokes the actual C92 production owner on THIS input. No supplied C92 receipt accepted. */
export async function executeC93HostProjection(q){
 let r;try{r=await executeC92ProductionTurn(q);}catch{return stop('C92_REAL_OWNER_EXCEPTION');}
 if(r?.status!=='C92_EXPERIMENTAL_OWNER_ACCEPTED_SURFACE_A_STAGED_NOT_NATIVE_DELIVERED')
  return stop(r?.first_unclosed_edge||'C92_OWNER_NOT_READY');
 if(r.source_head!==q.sourceHead||r.input_sha256!==q.inputSha256||r.active!==false||
   r.native_chat_delivery_attested!==false||r.actual_model_provider_transport_executed!==true||
   r.provider_http_calls_observed!==2||r.independent_validator_separate_node_process!==true)
  return stop('OWNER_CAUSAL_PROOF_MISMATCH');
 const output=r.surface_a_text;
 if(typeof output!=='string'||!output.trim()||Buffer.byteLength(output,'utf8')>32000||
   r.surface_a_sha256!==sha(Buffer.from(output,'utf8'))||r.surface_a?.sha256!==r.surface_a_sha256||
   r.surface_a?.write_reopen_verified!==true)return stop('OWNER_SURFACE_DIGEST');
 let reopened;try{
  if(fs.lstatSync(r.surface_a.path).isSymbolicLink())return stop('SURFACE_SYMLINK');
  reopened=fs.readFileSync(r.surface_a.path);
 }catch{return stop('SURFACE_FILE_UNAVAILABLE');}
 if(!reopened.equals(Buffer.from(output,'utf8')))return stop('SURFACE_REOPEN_DRIFT');
 return {schema:'ikant-le-c93-host-projection/v1',status:'C93_HOST_SURFACE_READY_NOT_NATIVE_DELIVERED',
  source_head:q.sourceHead,input_sha256:q.inputSha256,surface_a_exact:output,
  surface_a_sha256:r.surface_a_sha256,provider_http_calls_observed:2,
  owner_receipt_status:r.status,semantic_truth_independently_proved:false,
  c81_c86_language_adoption_attested:false,github_ref_origin_attested:false,
  native_delivery_attested:false,canonical_active:false,active:false,authority:0,
  first_unclosed_edge:'HOST_NATIVE_CHAT_SURFACE_A_DELIVERY'};
}
