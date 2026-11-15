import crypto from 'node:crypto';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';

const H40=/^[0-9a-f]{40}$/,H64=/^[0-9a-f]{64}$/;
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const seal=obj=>Object.freeze({...obj,packet_sha256:hash(JSON.stringify(obj))});
const MAX_INPUT=600,MAX_OUTPUT=12000;
const base={schema:'ikant-le-c79-chat-surface/v1',authority:0,active:false,
 canonical_runtime:false,persistent:false,native_event_attested:false,
 source_origin_attested:false,native_chat_delivery_attested:false,
 native_docx_delivery_attested:false,owner_receipt_issued:false,
 inter_turn_persistence_attested:false};
const stop=(edge)=>seal({...base,status:'C79_STOP',first_unclosed_edge:edge,
 mode:'EXPERIMENTAL',surface_a_chat:null,source_head:null,manifest_sha256:null,
 bound_input_sha256:null,bound_output_sha256:null});

function validateRelay(r,selection,currentHumanInput,sourceHead,manifestSha){
 if(!r||r.schema!=='ikant-le-c78-bridge-readback/v1'||
 r.status!=='C78_NODE_RESPONSE_READY_HOST_DELIVERY_PENDING'||
 r.source_head!==sourceHead||r.manifest_sha256!==manifestSha||
 r.child_process_executed!==true||r.executed_kernel!==true||
 r.child_process_exit_code!==0||
 r.c70_status!=='EXPERIMENTAL_COMPUTE_PREVIEW'||
 r.c71_status!=='EXPERIMENTAL_HOST_DRAFT'||
 r.c73_status!=='C73_EXPERIMENTAL_DRAFT_PRESENTATION_PLAN'||
 !Number.isInteger(r.turn_dispatched_count)||r.turn_dispatched_count<1||
 r.active!==false||r.canonical_runtime!==false||r.persistent!==false||
 r.native_event_attested!==false||r.owner_receipt_issued!==false||
 r.source_origin_attested!==false||
 r.host_native_chat_delivery_attested!==false||
 r.host_docx_delivery_attested!==false||
 r.inter_turn_persistence_attested!==false||
 r.first_unclosed_edge!=='HOST_GITHUB_ORIGIN_AUTHENTICATION'||
 r.downstream_unverified_edge!=='HOST_NATIVE_CHAT_SURFACE_A_DELIVERY'||
 !Array.isArray(r.surface_b_links)||r.surface_b_links.length!==0||
 r.surface_a_chat?.kind!=='ORDINARY_CHAT_UNSEALED_DRAFT'||
 typeof r.surface_a_chat?.source!=='string'||!r.surface_a_chat.source||
 typeof r.surface_a_chat?.text!=='string'||
 !r.surface_a_chat.text.length||r.surface_a_chat.text.length>MAX_OUTPUT||
 !H64.test(String(r.input_sha256||''))||!H64.test(String(r.output_sha256||''))||
 r.input_sha256!==hash(Buffer.from(currentHumanInput,'utf8'))||
 r.output_sha256!==hash(Buffer.from(r.surface_a_chat.text,'utf8'))||
 !validateC72ModeSelection(selection,{mode:'EXPERIMENTAL',sourceHead})
 )return false;
 return true;
}
/**
 * Post-C78, owner-free host display packet. This function never calls a UI,
 * obtains message event IDs, or creates an iKant session.
 * A model-written relay-shaped object can satisfy these checks: provenance
 * MUST be separately witnessed by a real callable connector/Node carrier.
 */
export function prepareC79ChatSurface({
 selection,sourceHead,expectedManifestSha256,currentHumanInput,relayReadback
}={}){
 if(!H40.test(String(sourceHead||''))||!H64.test(String(expectedManifestSha256||'')))
  return stop('SOURCE_HEAD_OR_CAPSULE_MANIFEST');
 if(!validateC72ModeSelection(selection,{mode:'EXPERIMENTAL',sourceHead}))
  return stop('C72_EXPERIMENTAL_SELECTION');
 if(typeof currentHumanInput!=='string'||!currentHumanInput.trim()||
 Buffer.byteLength(currentHumanInput,'utf8')>MAX_INPUT)
  return stop('CURRENT_HUMAN_INPUT');
 if(!validateRelay(relayReadback,selection,currentHumanInput,sourceHead,expectedManifestSha256))
  return stop('C78_SAME_INPUT_RUNTIME_READBACK');
 return seal({...base,status:'C79_CHAT_PACKET_READY_NOT_DELIVERED',
  mode:'EXPERIMENTAL',source_head:sourceHead,
  manifest_sha256:expectedManifestSha256,
  bound_input_sha256:relayReadback.input_sha256,
  bound_output_sha256:relayReadback.output_sha256,
  child_process_executed:true,actual_runtime_claim_requires_external_witness:true,
  runtime_stages:['C70','C71','C73'],
  brand:{title:'iKant',subtitle:'Sistema conversazionale costituzionale - stato attestato',
   light:'assets/brand/ikant-light.svg',dark:'assets/brand/ikant-dark.svg',
   symbol_is_not_active_receipt:true},
  surface_a_chat:{kind:'HOST_OWNED_UNSEALED_DRAFT',text:relayReadback.surface_a_chat.text,
   voice_source:relayReadback.surface_a_chat.source,
   required_channel:'ORDINARY_CHAT_ASSISTANT_MESSAGE',
   native_delivery_attested:false},
  surface_b_links:[],
  first_unclosed_edge:'HOST_GITHUB_ORIGIN_AUTHENTICATION',
  next_unverified_edge:'HOST_NATIVE_CHAT_SURFACE_A_DELIVERY',
  host_required_action:'PRESENT_EXACT_SURFACE_A_TEXT_IN_ORDINARY_CHAT',
  first_turn_only:true,source_witness_supplied_by_repo_code:false});
}
export function validateC79ChatSurface(packet){
 if(!packet||packet.schema!=='ikant-le-c79-chat-surface/v1'||
 !H64.test(String(packet.packet_sha256||'')))return false;
 const {packet_sha256,...data}=packet;
 if(hash(JSON.stringify(data))!==packet_sha256)return false;
 if(data.authority!==0||data.active!==false||data.canonical_runtime!==false||
 data.persistent!==false||data.native_event_attested!==false||
 data.native_chat_delivery_attested!==false||
 data.native_docx_delivery_attested!==false||data.source_origin_attested!==false||
 data.owner_receipt_issued!==false||data.inter_turn_persistence_attested!==false)
 return false;
 if(data.status==='C79_STOP')
  return typeof data.first_unclosed_edge==='string'&&data.surface_a_chat===null;
 return data.status==='C79_CHAT_PACKET_READY_NOT_DELIVERED'&&
 data.mode==='EXPERIMENTAL'&&H40.test(String(data.source_head||''))&&
 H64.test(String(data.manifest_sha256||''))&&
 H64.test(String(data.bound_input_sha256||''))&&
 H64.test(String(data.bound_output_sha256||''))&&
 data.first_unclosed_edge==='HOST_GITHUB_ORIGIN_AUTHENTICATION'&&
 data.next_unverified_edge==='HOST_NATIVE_CHAT_SURFACE_A_DELIVERY'&&
 data.child_process_executed===true&&
 data.actual_runtime_claim_requires_external_witness===true&&
 data.surface_a_chat?.kind==='HOST_OWNED_UNSEALED_DRAFT'&&
 data.surface_a_chat?.required_channel==='ORDINARY_CHAT_ASSISTANT_MESSAGE'&&
 data.surface_a_chat?.native_delivery_attested===false&&
 typeof data.surface_a_chat?.text==='string'&&
 data.surface_a_chat.text.length>0&&data.surface_a_chat.text.length<=MAX_OUTPUT&&
 hash(Buffer.from(data.surface_a_chat.text,'utf8'))===data.bound_output_sha256&&
 Array.isArray(data.surface_b_links)&&data.surface_b_links.length===0&&
 data.host_required_action==='PRESENT_EXACT_SURFACE_A_TEXT_IN_ORDINARY_CHAT';
}
/**
 * Mechanically checks a candidate chat text echo. This is an equality check,
 * NOT a native UI receipt or transcript participation proof.
 */
export function compareC79SurfaceAEcho({packet,displayedText}={}){
 if(!validateC79ChatSurface(packet)||packet.status!=='C79_CHAT_PACKET_READY_NOT_DELIVERED')
  return {matched:false,first_unclosed_edge:'C79_VALIDATED_PACKET',native_chat_delivery_attested:false};
 const matched=typeof displayedText==='string'&&
  Buffer.from(displayedText,'utf8').equals(Buffer.from(packet.surface_a_chat.text,'utf8'));
 return {matched,source_sha256:packet.bound_output_sha256,
  echo_sha256:typeof displayedText==='string'?hash(Buffer.from(displayedText,'utf8')):null,
  evidence_scope:'BYTES_ECHOED_NO_HOST_EVENT_ID',
  first_unclosed_edge:matched?'HOST_NATIVE_CHAT_SURFACE_A_DELIVERY':'SURFACE_A_BYTES_MISMATCH',
  native_chat_delivery_attested:false,authority:0,active:false};
}
