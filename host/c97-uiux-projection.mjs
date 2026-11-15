import crypto from 'node:crypto';
import {projectC81RuntimeTurn} from './c81-runtime-projection.mjs';
import {buildC73ProjectCapsule} from './c73-project-capsule.mjs';

/**
 * C97: pure, authority-zero, deterministic Project UI intermediate representation.
 * No host hook, no activation, no persistence, no model-generated voice.
 * The upstream C81/C73 structural validators are reused, not reimplemented.
 * A shape-valid repository packet cannot attest an external native event.
 */
export const C97_SCHEMA='ikant-le-c97-uiux-frame/v1';
export const C97_ORDER=Object.freeze(['HEADER','SURFACE_A','STATUS','EVIDENCE','ARTIFACTS','DETAILS']);
export const C97_ICONS=Object.freeze({
 IDENTITY:'shield-check',MODE:'layers',STATUS:'activity',
 BLOCKER:'alert-triangle',EVIDENCE:'file-check-2',
 ARTIFACT:'file-text',LIMITS:'info',TELEMETRY:'chart-no-axes-combined'
});
export const C97_PHASES=Object.freeze([
 'FIRST_CONTACT','TERMS_PENDING','AWAIT_ACCEPTANCE','ACCEPTED_AWAIT_MODE',
 'MODE_EXPERIMENTAL','MODE_CANONICAL','SOURCE_FETCH','COMPUTE_READY',
 'BLOCKED_CAPABILITY','BLOCKED_INTEGRITY','OUTPUT_EXPERIMENTAL',
 'OUTPUT_CANONICAL','LONG_INPUT','ARTIFACT_MISSING','REENTRY','EXITED',
 'HOST_UI_UNAVAILABLE','ACCESSIBILITY','SOURCE_EPOCH_DRIFT','UNKNOWN_HOST_CAPABILITY'
]);
const H40=/^[0-9a-f]{40}$/,H64=/^[0-9a-f]{64}$/;
const sha=x=>crypto.createHash('sha256').update(Buffer.from(x,'utf8')).digest('hex');
const diag={
 FIRST_CONTACT:'TERMS_VERBATIM_PRESENTATION',TERMS_PENDING:'TERMS_PRESENTATION_NOT_ATTESTED',
 AWAIT_ACCEPTANCE:'LATER_EXACT_HUMAN_CONSENT',ACCEPTED_AWAIT_MODE:'LATER_EXPLICIT_C72_SELECTION',
 MODE_EXPERIMENTAL:'C81_SAME_INPUT_OWNER_READBACK',MODE_CANONICAL:'C59_ACTIVE_OWNER_READBACK',
 SOURCE_FETCH:'SOURCE_BYTES_AND_ORIGIN',COMPUTE_READY:'SAME_INPUT_OWNER_READBACK',
 BLOCKED_CAPABILITY:'HOST_CAPABILITY_UNAVAILABLE',BLOCKED_INTEGRITY:'BLOCKED_INTEGRITY',
 LONG_INPUT:'LOSSLESS_INPUT_DISPATCH',ARTIFACT_MISSING:'REQUIRED_ARTIFACT_READBACK',
 REENTRY:'DURABLE_NEXT_TURN_READBACK',EXITED:'OWNER_VALIDATED_EXIT',
 HOST_UI_UNAVAILABLE:'NATIVE_UI_RENDERER_UNAVAILABLE',
 ACCESSIBILITY:'ACCESSIBLE_HOST_RENDERER_WITNESS',SOURCE_EPOCH_DRIFT:'SOURCE_HEAD_MISMATCH',
 UNKNOWN_HOST_CAPABILITY:'HOST_CAPABILITY_UNKNOWN'
};
function makeFrame({phase,mode,sourceHead,voice=null,voiceSource=null,artifactRequirements=[],
 firstEdge,ownerShapeValidated=false}){
 const head=H40.test(String(sourceHead||''))?sourceHead:null;
 const content=typeof voice==='string'&&voice.length?voice:null;
 const data={
  schema:C97_SCHEMA,ui_version:'C97_V1',phase,mode,authority:0,
  shell_identity:'iKant',layout:'SINGLE_COLUMN_COMPACT',
  component_order:[...C97_ORDER],icon_tokens:{...C97_ICONS},
  source_head:head,short_head:head?head.slice(0,7):'UNKNOWN',
  surface_a_exact_utf8:content,surface_a_sha256:content!==null?sha(content):null,
  voice_source:content!==null?voiceSource:null,
  status:content!==null?'OWNER_PACKET_SHAPE_VALID_NOT_NATIVE_DELIVERED':'DIAGNOSTIC_ONLY',
  first_unclosed_edge:firstEdge,
  evidence_level:ownerShapeValidated?'SOURCE_PACKET_SHAPE_VALID_ONLY':'UNVERIFIED_OR_BLOCKED',
  owner_packet_shape_valid:ownerShapeValidated,
  source_origin_attested:false,native_event_attested:false,
  native_chat_delivery_attested:false,inter_turn_persistence_attested:false,
  // Descriptor != real host download link. Link presentation is a separate host action.
  artifact_requirements:artifactRequirements,
  artifact_download_links:[],interactive_actions:[],
  native_sticky_overlay_installed:false,apps_sdk_widget_installed:false,
  phenomelogical_claim:'UNKNOWN',host_action:'RENDER_PER_REPLY_IF_SUPPORTED_ELSE_ASCII',
  compression:'L1_EXACT_SEMANTIC_IR_L2_ACCESSIBLE_TEXT_L3_OPTIONAL_HOST_DECORATION'
 };
 return Object.freeze({...data,frame_sha256:sha(JSON.stringify(data))});
}
/** Always constructs diagnostics, not a fabricated iKant response. */
export function projectC97Diagnostic({phase='FIRST_CONTACT',sourceHead=null,mode='UNSELECTED',
 first_unclosed_edge=null}={}){
 if(!C97_PHASES.includes(phase))throw new TypeError('unknown C97 phase');
 if(!['UNSELECTED','EXPERIMENTAL','CANONICAL'].includes(mode))throw new TypeError('unknown mode');
 const edge=typeof first_unclosed_edge==='string'&&first_unclosed_edge.length<200?
  first_unclosed_edge:(diag[phase]||'RUNTIME_OWNER_READBACK_REQUIRED');
 return makeFrame({phase,mode,sourceHead,firstEdge:edge});
}
/**
 * Connects to actual C81 computation checks, not a caller-authored "voice" field.
 * C81 can validate source/packet internal consistency, not physical host origin.
 */
export function projectC97Experimental({c81Inputs}={}){
 const x=projectC81RuntimeTurn(c81Inputs||{});
 if(x.status!=='C81_RUNTIME_SURFACE_A_READY_NOT_NATIVE_DELIVERED')
  return projectC97Diagnostic({phase:'BLOCKED_CAPABILITY',mode:'EXPERIMENTAL',
   sourceHead:c81Inputs?.sourceHead,first_unclosed_edge:x.first_unclosed_edge});
 if(x.mode!=='EXPERIMENTAL'||x.native_chat_delivery_attested!==false||
    x.active!==false||!H40.test(String(x.source_head||''))||
    !H64.test(String(x.bound_output_sha256||''))||
    sha(x.runtime_computed_answer)!==x.bound_output_sha256)
  return projectC97Diagnostic({phase:'BLOCKED_INTEGRITY',mode:'EXPERIMENTAL',
   first_unclosed_edge:'C81_RUNTIME_OUTPUT_INTEGRITY'});
 return makeFrame({phase:'OUTPUT_EXPERIMENTAL',mode:'EXPERIMENTAL',sourceHead:x.source_head,
  voice:x.runtime_computed_answer,voiceSource:'C81_EXACT_RUNTIME_PROJECTION',
  firstEdge:x.first_unclosed_edge,ownerShapeValidated:true});
}
/**
 * Canonical readback gate delegates to existing C73 which validates C72/C59/C32.
 * Even successful C73 is NOT evidence of independent ChatGPT native delivery.
 */
export function projectC97Canonical({selection,ownerResult,hostFrame,canonicalActiveReadback}={}){
 const x=buildC73ProjectCapsule({selection,ownerResult,hostFrame,canonicalActiveReadback});
 if(x.status!=='C73_CANONICAL_FRAME_READY_NOT_HOST_DELIVERED')
  return projectC97Diagnostic({phase:'BLOCKED_CAPABILITY',mode:'CANONICAL',
   sourceHead:selection?.source_head,first_unclosed_edge:x.first_unclosed_edge});
 const voice=x.surface_a_chat?.text;
 if(typeof voice!=='string'||!voice.length||x.native_delivery_attested!==false||
    x.active!==false||!Array.isArray(x.artifact_requirements)||
    x.artifact_requirements.length!==1)
  return projectC97Diagnostic({phase:'BLOCKED_INTEGRITY',mode:'CANONICAL',
   first_unclosed_edge:'C73_OWNER_FRAME_INTEGRITY'});
 const artifact=x.artifact_requirements[0];
 if(!H64.test(String(artifact.sha256||''))||artifact.checked_against_runtime_readback!==true||
    artifact.host_download_url!==null)
  return projectC97Diagnostic({phase:'BLOCKED_INTEGRITY',mode:'CANONICAL',
   first_unclosed_edge:'C73_DOCX_READBACK'});
 return makeFrame({phase:'OUTPUT_CANONICAL',mode:'CANONICAL',sourceHead:selection.source_head,
  voice,voiceSource:'C73_C59_OWNER_SHELL_EXACT',
  artifactRequirements:[{name:artifact.name,sha256:artifact.sha256,
   bytes:artifact.bytes,host_download_url:null}],
  firstEdge:x.first_unclosed_edge,ownerShapeValidated:true});
}
export function validateC97Frame(frame){
 if(!frame||frame.schema!==C97_SCHEMA||!H64.test(String(frame.frame_sha256||'')))return false;
 const {frame_sha256,...data}=frame;
 if(sha(JSON.stringify(data))!==frame_sha256)return false;
 if(data.authority!==0||data.source_origin_attested!==false||
    data.native_event_attested!==false||data.native_chat_delivery_attested!==false||
    data.inter_turn_persistence_attested!==false||data.native_sticky_overlay_installed!==false||
    data.apps_sdk_widget_installed!==false||data.phenomelogical_claim!=='UNKNOWN'||
    !C97_PHASES.includes(data.phase)||!['UNSELECTED','EXPERIMENTAL','CANONICAL'].includes(data.mode)||
    JSON.stringify(data.component_order)!==JSON.stringify(C97_ORDER)||
    JSON.stringify(data.icon_tokens)!==JSON.stringify(C97_ICONS)||
    !Array.isArray(data.interactive_actions)||data.interactive_actions.length!==0||
    !Array.isArray(data.artifact_download_links)||data.artifact_download_links.length!==0)return false;
 const voice=data.surface_a_exact_utf8;
 if(voice===null)return data.surface_a_sha256===null&&data.owner_packet_shape_valid===false&&
     data.status==='DIAGNOSTIC_ONLY';
 if(typeof voice!=='string'||!voice.length||sha(voice)!==data.surface_a_sha256||
    data.owner_packet_shape_valid!==true)return false;
 return (data.phase==='OUTPUT_EXPERIMENTAL'&&data.mode==='EXPERIMENTAL')||
        (data.phase==='OUTPUT_CANONICAL'&&data.mode==='CANONICAL'&&
          data.artifact_requirements.length===1);
}
/** Fixed ASCII structure. This is not a sticky native UI or a host delivery receipt. */
export function renderC97Ascii(frame){
 if(!validateC97Frame(frame))return 'iKant | DIAGNOSTIC_ONLY | INVALID_C97_FRAME';
 const line='iKant | '+frame.mode+' | '+frame.status+' | HEAD '+frame.short_head;
 const voice=frame.surface_a_exact_utf8===null?
  '(nessuna Surface A: proof non disponibile)':frame.surface_a_exact_utf8;
 return [line,'--- SURFACE A ---',voice,'--- STATO ---',
  'phase='+frame.phase,'first_unclosed_edge='+frame.first_unclosed_edge,
  'native_delivery=NOT_ATTESTED','persistence=NOT_ATTESTED',
  '--- ARTIFACTS ---',frame.artifact_requirements.length?
    '1 descriptor owner-validated; host download NOT_ATTESTED':'none verified for host download',
  '--- DETAILS ---','UI semantic IR '+frame.frame_sha256].join('\n');
}
