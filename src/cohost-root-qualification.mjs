import crypto from 'node:crypto';
import {validateCohostNativeDeliveryReceipt} from './cohost-context-root.mjs';

export const COHOST_ROOT_COMMON_SHA='1d5360e5d1df2babb743c83cfee0d64158f35966580d3118f9bc2383dfb38692';
export const PARTICIPATION_LEASE_SCHEMA='ikant-cohost-persistent-participation-lease/v1';
export const ATTRIBUTED_DELIVERY_SCHEMA='ikant-cohost-exact-attributed-delivery-receipt/v1';
export const ROOT_STATUS_SCHEMA='ikant-cohost-root-status/v1';
const H64=/^[a-f0-9]{64}$/;
const sha=x=>crypto.createHash('sha256').update(Buffer.from(JSON.stringify(x))).digest('hex');
const strip=x=>{const y=structuredClone(x||{});delete y.receipt_sha256;return y;};

export function validatePersistentParticipationLease(value){
 const x=value||{},e=[];
 if(x.schema!==PARTICIPATION_LEASE_SCHEMA)e.push('schema');
 if(x.observation_owner!=='HOST_NATIVE_CHAT'||x.external_observation!==true||x.observed!==true)e.push('observation');
 if(!H64.test(String(x.session_locator_sha256||'')))e.push('session');
 if(x.actor!=='IKANT'||x.current_turn_entitlement!==true||x.persistent_route!==true||x.no_manual_reselection!==true||x.host_route_guard!==true)e.push('participation');
 if(x.authority!==0)e.push('authority');
 if(!H64.test(String(x.receipt_sha256||''))||sha(strip(x))!==x.receipt_sha256)e.push('receipt');
 return{ok:e.length===0,errors:[...new Set(e)]};
}

export function validateExactAttributedDeliveryReceipt(value,{envelope,nativeReceipt}={}){
 const x=value||{},e=[];
 if(x.schema!==ATTRIBUTED_DELIVERY_SCHEMA)e.push('schema');
 if(x.observation_owner!=='HOST_NATIVE_CHAT'||x.external_observation!==true||x.observed!==true)e.push('observation');
 if(!H64.test(String(x.session_locator_sha256||''))||!String(x.turn_id||'').trim())e.push('binding');
 if(x.actor!=='IKANT'||x.exact_runtime_bytes!==true)e.push('attribution');
 if(!H64.test(String(x.native_delivery_receipt_sha256||'')))e.push('native_receipt');
 if(nativeReceipt){
   const v=validateCohostNativeDeliveryReceipt(nativeReceipt,{envelope});
   if(!v.ok)e.push('native_delivery');
   if(x.native_delivery_receipt_sha256!==nativeReceipt.receipt_sha256)e.push('native_binding');
 }
 if(envelope&&x.session_locator_sha256!==envelope.session_locator_sha256)e.push('session_binding');
 if(x.authority!==0)e.push('authority');
 if(!H64.test(String(x.receipt_sha256||''))||sha(strip(x))!==x.receipt_sha256)e.push('receipt');
 return{ok:e.length===0,errors:[...new Set(e)]};
}

export function qualifyCohostRoot({contextReadback,participationLease,attributedDelivery,envelope,nativeReceipt}={}){
 const c=contextReadback||{};
 const r0=!!(c.routable&&H64.test(String(c.session_locator_sha256||''))&&H64.test(String(c.runtime_root_sha256||''))&&H64.test(String(c.manifest_receipt_sha256||'')));
 const lv=validatePersistentParticipationLease(participationLease);
 const r1=lv.ok&&participationLease.session_locator_sha256===c.session_locator_sha256;
 const dv=validateExactAttributedDeliveryReceipt(attributedDelivery,{envelope,nativeReceipt});
 const r2=dv.ok&&attributedDelivery.session_locator_sha256===c.session_locator_sha256;
 return{
   schema:ROOT_STATUS_SCHEMA,
   common_semantic_sha256:COHOST_ROOT_COMMON_SHA,
   state:r0&&r1&&r2?'COHOST_SAME_SESSION':(r0?'RUNTIME_CONTEXT_READY':'NOT_READY'),
   promise_satisfied:r0&&r1&&r2,
   root_spine:{R0_DURABLE_CANONICAL_RUNTIME_CONTEXT:r0,R1_PERSISTENT_PARTICIPATION_LEASE:r1,R2_EXACT_ATTRIBUTED_DELIVERY_RECEIPT:r2},
   authority:0,
   physical_host_capability_created:false
 };
}
