import crypto from 'node:crypto';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const H40=/^[a-f0-9]{40}$/;const H64=/^[a-f0-9]{64}$/;
const stopped=edge=>({status:'C86_STOP',first_unclosed_edge:edge,active:false,native_chat_delivery_attested:false});
/** Verify the current-input/output binding, not authorship or native presentation. */
export function prepareC86Surface({runtimeReceipt,currentHumanInput,sourceHead,manifestSha256}={}){
 const r=runtimeReceipt;
 if(typeof currentHumanInput!=='string'||!currentHumanInput.trim()||
  Buffer.byteLength(currentHumanInput,'utf8')>600||Buffer.from(currentHumanInput,'utf8').toString('utf8')!==currentHumanInput)return stopped('C86_CURRENT_INPUT_BOUNDS');
 if(!H40.test(sourceHead||'')||!H64.test(manifestSha256||''))return stopped('C86_SOURCE_NOT_PINNED');
 if(!r||r.status!=='C84_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED'||
  r.source_head!==sourceHead||r.manifest_sha256!==manifestSha256||
  r.runtime_projection!=='C81_RUNTIME_SURFACE_A_READY_NOT_NATIVE_DELIVERED'||
  r.source_reachability!=='C81_GIT_REACHABILITY_VERIFIED'||
  r.active!==false||r.native_chat_delivery_attested!==false||
  r.source_origin_attested!==false||r.owner_receipt_issued!==false||
  r.canonical_runtime!==false)return stopped('C86_RUNTIME_RECEIPT_INCOMPATIBLE');
 if(r.input_sha256!==sha(Buffer.from(currentHumanInput,'utf8')))
  return stopped('C86_SAME_INPUT_BINDING');
 const voice=r.runtime_computed_answer;
 if(typeof voice!=='string'||!voice.trim()||Buffer.byteLength(voice,'utf8')>32000||Buffer.from(voice,'utf8').toString('utf8')!==voice||
  r.output_sha256!==sha(Buffer.from(voice,'utf8')))
  return stopped('C86_EXACT_OUTPUT_BYTES');
 return {status:'C86_SURFACE_A_READY_NOT_NATIVE_DELIVERED',surface_a_text:voice,
  input_sha256:r.input_sha256,output_sha256:r.output_sha256,
  source_head:sourceHead,manifest_sha256:manifestSha256,
  output_provenance_claim:'C84_RECEIPT_VALIDATED_NOT_INDEPENDENTLY_AUTHENTICATED',
  first_unclosed_edge:'HOST_NATIVE_CHAT_SURFACE_A_DELIVERY',
  active:false,native_chat_delivery_attested:false,authority:0};
}
/** A text echo can confirm bytes but cannot generate a native host event ID. */
export function compareC86Echo({surfaceReceipt,displayedText}={}){
 if(surfaceReceipt?.status!=='C86_SURFACE_A_READY_NOT_NATIVE_DELIVERED'||
  typeof displayedText!=='string')return stopped('C86_ECHO_ENVELOPE');
 const matched=sha(Buffer.from(displayedText,'utf8'))===surfaceReceipt.output_sha256&&
  displayedText===surfaceReceipt.surface_a_text;
 return {status:matched?'C86_ECHO_BYTES_MATCH_NO_NATIVE_RECEIPT':'C86_ECHO_MISMATCH',
  matched,output_sha256:surfaceReceipt.output_sha256,
  native_chat_delivery_attested:false,active:false};
}
