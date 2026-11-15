import crypto from 'node:crypto';

export const NATIVE_PARTICIPANT_LEASE_SCHEMA='ikant-native-participant-lease/v1';
export const NATIVE_DELIVERY_RECEIPT_SCHEMA='ikant-native-delivery-receipt/v1';
export const NATIVE_TRANSCRIPT_STATUS_SCHEMA='ikant-native-transcript-actor-status/v1';
export const NATIVE_TRANSCRIPT_SEMANTIC_SHA='0fe2ca72875f9782d474fadf022b746c253f755244bfa39cb2dd66d361a2cb56';
const H64=/^[a-f0-9]{64}$/;
const digest=x=>crypto.createHash('sha256').update(Buffer.from(JSON.stringify(x))).digest('hex');
const strip=x=>{const y=structuredClone(x||{});delete y.receipt_sha256;return y;};

export function validateNativeParticipantLease(value,{sessionLocatorSha256}={}){
 const x=value||{},e=[];
 if(x.schema!==NATIVE_PARTICIPANT_LEASE_SCHEMA)e.push('schema');
 if(x.observation_owner!=='HOST_NATIVE_CHAT'||x.external_observation!==true||x.observed!==true)e.push('observation');
 if(!H64.test(String(x.session_locator_sha256||''))||x.session_locator_sha256!==sessionLocatorSha256)e.push('session');
 if(!String(x.participant_id||'').trim()||x.actor!=='IKANT'||x.role_class!=='NATIVE_NON_USER_ACTOR')e.push('participant');
 if(x.scheduler!=='PERSISTENT'||x.current_turn_entitlement!==true||x.future_turn_entitlement!==true||x.no_manual_reselection!==true||x.bypass_guard!==true)e.push('scheduler');
 if(!String(x.lease_epoch||'').trim()||x.lease_fresh!==true)e.push('lease');
 if(x.authority!==0)e.push('authority');
 if(!H64.test(String(x.receipt_sha256||''))||digest(strip(x))!==x.receipt_sha256)e.push('receipt');
 return{ok:e.length===0,errors:[...new Set(e)]};
}

export function validateNativeDeliveryReceipt(value,{sessionLocatorSha256,participantLease}={}){
 const x=value||{},e=[],lease=participantLease||{};
 if(x.schema!==NATIVE_DELIVERY_RECEIPT_SCHEMA)e.push('schema');
 if(x.observation_owner!=='HOST_NATIVE_CHAT'||x.external_observation!==true||x.observed!==true)e.push('observation');
 if(!H64.test(String(x.session_locator_sha256||''))||x.session_locator_sha256!==sessionLocatorSha256)e.push('session');
 if(!String(x.participant_id||'').trim()||x.participant_id!==lease.participant_id)e.push('participant');
 if(!String(x.turn_id||'').trim()||!String(x.turn_lease_id||'').trim())e.push('turn');
 if(x.role_class!=='NATIVE_NON_USER_ACTOR'||x.host_role_is_user!==false||x.host_role_is_assistant_impersonation!==false)e.push('role');
 if(x.surface!=='NATIVE_TRANSCRIPT'||x.host_readback!==true||x.exact_runtime_bytes!==true)e.push('delivery');
 if(!H64.test(String(x.runtime_output_sha256||''))||x.visible_output_sha256!==x.runtime_output_sha256)e.push('bytes');
 if(x.authority!==0)e.push('authority');
 if(!H64.test(String(x.receipt_sha256||''))||digest(strip(x))!==x.receipt_sha256)e.push('receipt');
 return{ok:e.length===0,errors:[...new Set(e)]};
}

export function qualifyNativeTranscriptActor({cohostStatus,sessionLocatorSha256,nativeParticipantLease,nativeDeliveryReceipt}={}){
 const relation=cohostStatus?.promise_satisfied===true&&cohostStatus?.state==='COHOST_SAME_SESSION';
 const lv=validateNativeParticipantLease(nativeParticipantLease,{sessionLocatorSha256});
 const dv=validateNativeDeliveryReceipt(nativeDeliveryReceipt,{sessionLocatorSha256,participantLease:nativeParticipantLease});
 const native=relation&&lv.ok&&dv.ok;
 return{
  schema:NATIVE_TRANSCRIPT_STATUS_SCHEMA,
  semantic_sha256:NATIVE_TRANSCRIPT_SEMANTIC_SHA,
  state:native?'NATIVE_TRANSCRIPT_ACTOR':(relation?'COHOST_RELATION_ONLY':'NOT_READY'),
  relation_axis:native?'NATIVE_TRANSCRIPT_ACTOR':(relation?'COHOST_RELATION':'NONE'),
  capability_axis:cohostStatus?.runtime_capability_tier||'UNKNOWN',
  session_locator_sha256:sessionLocatorSha256||null,
  native_transcript_proven:native,
  participant_lease_valid:lv.ok,
  native_delivery_valid:dv.ok,
  full_runtime_required_for_native_actor:false,
  control_plane_ownership_required:false,
  app_panel_is_native_actor:false,
  ui_message_user_role_is_native_actor:false,
  physical_host_capability_created:false,
  authority:0
 };
}
