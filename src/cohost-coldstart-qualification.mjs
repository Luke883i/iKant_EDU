import {validatePreRuntimeBindNucleusReceipt} from './runtime-root-verified.mjs';
import {validatePersistentParticipationLease,validateExactAttributedDeliveryReceipt} from './cohost-root-qualification.mjs';
export const COHOST_COLDSTART_COMMON_SHA='fa4ccab342d14b7e2a1f4d6505374045d282d51e488557f5fd8f9c23c88158da';
export function qualifyColdstartCohostRoot({bindNucleus,contextReadback=null,participationLease,attributedDelivery,envelope=null,nativeReceipt=null}={}){
 const bv=validatePreRuntimeBindNucleusReceipt(bindNucleus),b0=bv.ok,locator=b0?bindNucleus.session_locator_sha256:null;
 const hydrated=!!(contextReadback?.routable&&contextReadback?.session_locator_sha256===locator&&contextReadback?.source_head===bindNucleus?.source_head&&contextReadback?.runtime_root_sha256===bindNucleus?.runtime_root_sha256);
 const r0=b0&&bindNucleus.persisted===true&&bindNucleus.reopened===true&&(!contextReadback||hydrated);
 const lv=validatePersistentParticipationLease(participationLease),r1=r0&&lv.ok&&participationLease?.session_locator_sha256===locator;
 const dv=validateExactAttributedDeliveryReceipt(attributedDelivery,{envelope,nativeReceipt}),r2=r0&&dv.ok&&attributedDelivery?.session_locator_sha256===locator;
 const closed=b0&&r0&&r1&&r2;
 return{schema:'ikant-le-coldstart-cohost-root-status/v1',common_semantic_sha256:COHOST_COLDSTART_COMMON_SHA,session_locator_sha256:locator,source_head:b0?bindNucleus.source_head:null,runtime_root_sha256:b0?bindNucleus.runtime_root_sha256:null,state:closed?'COHOST_SAME_SESSION':(b0&&r0?'BIND_NUCLEUS_READY':'NOT_READY'),promise_satisfied:closed,root_spine:{B0_VERIFIED_BIND_NUCLEUS:b0,R0_DURABLE_CANONICAL_RUNTIME_CONTEXT:r0,R1_PERSISTENT_PARTICIPATION_LEASE:r1,R2_EXACT_ATTRIBUTED_DELIVERY_RECEIPT:r2},runtime_capability_tier:hydrated?'FULL_OR_LIMITED_RUNTIME':(b0&&r0?'BIND_NUCLEUS':'NONE'),full_runtime_hydration_required_for_relation:false,full_runtime_hydration_required_for_full_turns:true,authority:0,physical_host_capability_created:false};
}
