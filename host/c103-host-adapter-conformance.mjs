import crypto from 'node:crypto';
import {isC98JSONDataTree} from './c98-c82-connector-port.mjs';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';

// Data-plane verifier only. It cannot attest a provider, host, or native event.
const S='ikant-le-c103-host-adapter-conformance/v1';
const H40=/^[a-f0-9]{40}$/;
const H64=/^[a-f0-9]{64}$/;
const NONCE=/^[A-Za-z0-9_-]{12,96}$/;
const sha=s=>crypto.createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const stop=e=>Object.freeze({schema:S,status:'C103_STOP',first_unclosed_edge:e,
 authority:0,active:false,canonical_runtime:false,persistent:false,
 native_event_attested:false,native_delivery_attested:false,
 host_runtime_execution_attested:false,source_origin_attested:false});

/** Host-supplied C102 receipt + independent C87 inspection: structural only. */
export function verifyC103HostAdapterWitness({request,nonce,receipt,inspection}={}){
 if(!isC98JSONDataTree(request)||!isC98JSONDataTree(receipt)||
  !isC98JSONDataTree(inspection))return stop('C103_JSON_DESCRIPTOR_BOUNDARY');
 const h=request.sourceHead,raw=request.humanInput;
 if(!H40.test(h||'')||!NONCE.test(nonce||'')||
  !validateC72ModeSelection(request.selection,{mode:'EXPERIMENTAL',sourceHead:h})||
  request.optIn!==true||typeof raw!=='string'||!raw.trim()||
  Buffer.byteLength(raw,'utf8')>600||Buffer.from(raw,'utf8').toString('utf8')!==raw)
  return stop('C103_EXACT_SELECTION_INPUT_AND_OPTIN');
 if(receipt.schema!=='ikant-le-c102-soft-host-bridge/v1'||
  receipt.status!=='C102_ORIGINAL_C101_C87_LOCAL_READBACK'||
  receipt.source_head!==h||receipt.input_sha256!==sha(raw)||
  typeof receipt.voice_utf8!=='string'||!receipt.voice_utf8.trim()||
  Buffer.byteLength(receipt.voice_utf8,'utf8')>16000||
  Buffer.from(receipt.voice_utf8,'utf8').toString('utf8')!==receipt.voice_utf8||
  receipt.output_sha256!==sha(receipt.voice_utf8)||
  receipt.actual_local_c101_c87_invoked!==true||
  receipt.c70_status!=='EXPERIMENTAL_COMPUTE_PREVIEW'||
  receipt.c71_status!=='EXPERIMENTAL_HOST_DRAFT'||
  receipt.c100_status!=='C100_MODEL_DRAFT_UNATTESTED_NOT_OWNER'||
  receipt.ledger_status!=='C87_LOCAL_DURABLE_READBACK_NOT_NATIVE_SESSION'||
  !Number.isSafeInteger(receipt.ledger_entries)||receipt.ledger_entries<1||
  !H64.test(receipt.ledger_event_sha256||'')||
  receipt.active!==false||receipt.authority!==0||receipt.persistent!==false||
  receipt.native_event_attested!==false||receipt.native_delivery_attested!==false||
  receipt.source_origin_attested!==false||
  receipt.cognitive_cross_turn_continuity_attested!==false)
  return stop('C103_C102_SAME_INPUT_OUTPUT_OR_OVERCLAIM');
 if(inspection.schema!=='ikant-le-c102-inspection/v1'||
  inspection.status!=='C102_LEDGER_REOPENED'||
  inspection.count!==receipt.ledger_entries||
  inspection.last_hash!==receipt.ledger_event_sha256||
  inspection.active!==false||inspection.authority!==0||
  inspection.native_session_persistence_attested!==false||
  inspection.source_origin_attested!==false)
  return stop('C103_C87_READBACK_MISMATCH');
 const state=inspection.latest_state;
 if(!state||state.schema!=='ikant-le-c102-observation/v1'||
  state.nonce!==nonce||
  state.c101_status!=='C101_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED'||
  state.c70_status!==receipt.c70_status||
  state.c71_status!==receipt.c71_status||
  state.c100_status!==receipt.c100_status||
  state.voice_source!==receipt.voice_source||
  state.active!==false||state.native_host_dispatch_attested!==false||
  state.cognitive_cross_turn_continuity_attested!==false)
  return stop('C103_NONCE_OR_OBSERVATION_MISMATCH');
 return Object.freeze({schema:S,status:'C103_ENVELOPE_CONFORMANT_NOT_HOST_ATTESTED',
  source_head:h,input_sha256:receipt.input_sha256,
  output_sha256:receipt.output_sha256,ledger_event_sha256:receipt.ledger_event_sha256,
  ledger_entries:receipt.ledger_entries,voice_utf8:receipt.voice_utf8,
  authority:0,active:false,canonical_runtime:false,persistent:false,
  host_runtime_execution_attested:false,source_origin_attested:false,
  native_event_attested:false,native_delivery_attested:false,
  first_unclosed_edge:'HOST_CALLBACK_ORIGIN_AND_NATIVE_DELIVERY_NOT_ATTESTED'});
}
