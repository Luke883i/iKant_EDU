import crypto from 'node:crypto';
import {validateC79ChatSurface} from './c79-native-chat-surface.mjs';

const H40=/^[0-9a-f]{40}$/,H64=/^[0-9a-f]{64}$/;
const sha=b=>crypto.createHash('sha256').update(Buffer.from(b,'utf8')).digest('hex');
const FLAGS={authority:0,active:false,canonical_runtime:false,persistent:false,
 native_chat_delivery_attested:false,source_origin_attested:false,
 native_event_attested:false,owner_receipt_issued:false};
const stop=(first)=>({schema:'ikant-le-c81-runtime-projection/v1',
 status:'C81_RUNTIME_NOT_EXECUTED_OR_UNVERIFIED',first_unclosed_edge:first,
 mode:'EXPERIMENTAL',runtime_computed_answer:null,host_action:'DIAGNOSTIC_ONLY',
 ...FLAGS});
/**
 * A model is a display projector, never a replacement for the C70/71/73
 * computation. Requires genuinely executed C78 and valid C79 packet upstream;
 * this shape-check does not independently authenticate a host event or GitHub.
 */
export function projectC81RuntimeTurn({sourceReadback,surfacePacket,
 sourceHead,manifestSha,currentHumanInput,uiMode='PER_REPLY_TOP',
 failurePolicy='STOP_DIAGNOSTIC_ONLY'}={}){
 if(uiMode!=='PER_REPLY_TOP'||failurePolicy!=='STOP_DIAGNOSTIC_ONLY')
  return stop('UNSUPPORTED_UI_OR_FALLBACK');
 if(!H40.test(String(sourceHead||''))||!H64.test(String(manifestSha||'')))
  return stop('SOURCE_HEAD_AND_C77_MANIFEST');
 if(!sourceReadback||
  sourceReadback.schema!=='ikant-le-c81-source-reachability/v1'||
  sourceReadback.status!=='C81_GIT_REACHABILITY_VERIFIED'||
  sourceReadback.expected_source_head!==sourceHead||
  sourceReadback.manifest_sha256!==manifestSha||
  sourceReadback.git_object_hashes_matched!==true||
  sourceReadback.git_paths_reachable!==true||
  !Number.isInteger(sourceReadback.reachable_original_git_blobs)||
  sourceReadback.reachable_original_git_blobs<25||
  sourceReadback.first_unclosed_edge!=='HOST_PINNED_GITHUB_REF_ORIGIN'||
  sourceReadback.origin_independently_attested!==false||
  sourceReadback.native_chat_delivery_attested!==false||
  sourceReadback.active!==false)
  return stop('C81_GIT_SOURCE_REACHABILITY');
 if(typeof currentHumanInput!=='string'||!currentHumanInput.trim()||
    Buffer.byteLength(currentHumanInput,'utf8')>600)
  return stop('CURRENT_HUMAN_INPUT');
 if(!validateC79ChatSurface(surfacePacket)||
    surfacePacket.status!=='C79_CHAT_PACKET_READY_NOT_DELIVERED'||
    surfacePacket.source_head!==sourceHead||
    surfacePacket.manifest_sha256!==manifestSha||
    surfacePacket.bound_input_sha256!==sha(currentHumanInput)||
    surfacePacket.first_unclosed_edge!=='HOST_GITHUB_ORIGIN_AUTHENTICATION'||
    surfacePacket.next_unverified_edge!=='HOST_NATIVE_CHAT_SURFACE_A_DELIVERY'||
    surfacePacket.child_process_executed!==true||
    surfacePacket.actual_runtime_claim_requires_external_witness!==true||
    !['C70_REPOSITORY_FALLBACK','C70_REPOSITORY_GUARD'].includes(surfacePacket.surface_a_chat?.voice_source)||
    surfacePacket.native_chat_delivery_attested!==false||
    surfacePacket.active!==false)
  return stop('C79_EXACT_RUNTIME_READBACK');
 const voice=surfacePacket.surface_a_chat.text;
 if(typeof voice!=='string'||!voice.length||
    surfacePacket.bound_output_sha256!==sha(voice))
  return stop('SURFACE_A_EXACT_OUTPUT');
 return {schema:'ikant-le-c81-runtime-projection/v1',
  status:'C81_RUNTIME_SURFACE_A_READY_NOT_NATIVE_DELIVERED',
  mode:'EXPERIMENTAL',source_head:sourceHead,
  manifest_sha256:manifestSha,
  bound_input_sha256:surfacePacket.bound_input_sha256,
  bound_output_sha256:surfacePacket.bound_output_sha256,
  runtime_computed_answer:voice,
  title:'iKant',ui_placement:'PER_REPLY_TOP_NOT_STICKY_OVERLAY',
  display_contract:'COPY_EXACT_RUNTIME_TEXT_NO_MODEL_REWRITING',
  host_action:'PRESENT_IN_ORDINARY_ASSISTANT_REPLY',
  first_unclosed_edge:'HOST_PINNED_GITHUB_REF_ORIGIN',
  downstream_unverified_edge:'HOST_NATIVE_CHAT_SURFACE_A_DELIVERY',
  native_sticky_overlay_installed:false,voice_word_budget_applied:false,
  requires_per_user_turn_fresh_dispatch:true,
  ...FLAGS};
}
