/** HOST presentation-only thread snapshot. Not a writer, owner, transport receipt or native UI proof.
 * This normalizer cannot make a voice that P1 rejected. It does not persist state.
 */
import {createHash} from 'node:crypto';
import {projectP1AppExclusiveShell,P1_APP_SLOTS} from './p1-app-exclusive-shell.mjs';
import {validateHostConsumptionFrame} from '../src/host-consumption-frame.mjs';
const H64=/^[a-f0-9]{64}$/u;
const sha=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const deny=first_edge=>Object.freeze({schema:'ikant-le-oneshell-thread-snapshot/v1',ok:false,
 first_edge,authority:0,provider_thread_persistence_attested:false,active:false});
export function projectOneShellThreadSnapshot({result,frame,sessionRef,presentationSequence=0}={}){
 try{
  // A verified gateway-bound session reference is required. Never accept a client-provided ID.
  if(typeof sessionRef!=='string'||!sessionRef||Buffer.byteLength(sessionRef)>256)
   return deny('THREAD_SESSION_BINDING_UNAVAILABLE');
  if(!validateHostConsumptionFrame(frame).ok)return deny('THREAD_FRAME_UNVERIFIED');
  const p=projectP1AppExclusiveShell({result,frame});
  if(!p.ok||JSON.stringify(p.slot_order)!==JSON.stringify(P1_APP_SLOTS))
   return deny(p.first_edge||'THREAD_PROJECTION_UNVERIFIED');
  if(p.voice_attested&&(!H64.test(p.voice_sha256)||sha(p.slots.A)!==p.voice_sha256))
   return deny('THREAD_ORIGINAL_VOICE_MISMATCH');
  if(!p.voice_attested&&p.slots.A!=='NO_VOICE')return deny('THREAD_FALSE_VOICE');
  // Host-local frame delivery order, not the native provider or original owner turn index.
  if(!Number.isSafeInteger(presentationSequence)||presentationSequence<0)
   return deny('THREAD_PRESENTATION_SEQUENCE_INVALID');
  const view={schema:'ikant-le-oneshell-thread-snapshot/v1',ok:true,authority:0,
   session_binding_sha256:sha('ikant-oneshell-session-v1\0'+sessionRef),
   original_frame_receipt_sha256:frame.receipt_sha256,
   source_projection_sha256:p.projection_sha256,
   presentation_sequence:presentationSequence,
   slot_order:[...P1_APP_SLOTS],slots:p.slots,
   original_voice_sha256:p.voice_attested?p.voice_sha256:null,
   original_voice_attested:p.voice_attested,
   provider_thread_persistence_attested:false,native_event_attested:false,
   active:false,semantic_retention_attested:false};
  return Object.freeze({...view,snapshot_sha256:sha(JSON.stringify(view))});
 }catch{return deny('THREAD_SNAPSHOT_EXCEPTION');}
}
/** Presentation only: duplicate snapshot idempotent, divergent same turn or backtracking denied.
 * A new thread/session requires an explicit reset by the host, never a client-provided event.
 */
export function acceptOneShellThreadSnapshot({previous=null,next}={}){
 if(!next||next.ok!==true||next.schema!=='ikant-le-oneshell-thread-snapshot/v1'||
    !H64.test(next.session_binding_sha256)||!H64.test(next.snapshot_sha256)||
    !H64.test(next.original_frame_receipt_sha256)||!H64.test(next.source_projection_sha256)||
    JSON.stringify(next.slot_order)!==JSON.stringify(P1_APP_SLOTS)||
    next.active!==false||next.provider_thread_persistence_attested!==false)
  return deny('THREAD_NEXT_UNVERIFIED');
 const {snapshot_sha256,...raw}=next;
 if(sha(JSON.stringify(raw))!==snapshot_sha256)return deny('THREAD_SNAPSHOT_TAMPERED');
 if(!previous)return Object.freeze({ok:true,kind:'INITIAL',snapshot:next});
 if(previous.session_binding_sha256!==next.session_binding_sha256)
  return deny('THREAD_SESSION_CROSS_BINDING');
 if(!Number.isSafeInteger(previous.presentation_sequence)||
    next.presentation_sequence<previous.presentation_sequence)
  return deny('THREAD_STALE_TURN_COUNT');
 if(previous.snapshot_sha256===next.snapshot_sha256)return Object.freeze({ok:true,kind:'IDEMPOTENT',snapshot:previous});
 if(next.presentation_sequence===previous.presentation_sequence&&
    previous.original_voice_attested&&next.original_voice_attested)
  return deny('THREAD_SAME_TURN_CONFLICT');
 return Object.freeze({ok:true,kind:'UPDATE',snapshot:next});
}
