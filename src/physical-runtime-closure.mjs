import crypto from 'node:crypto';
import {
  validateBootstrapInvocationReceipt,
  validateHostBootstrapBindingReceipt,
  COMMON_COHOST_SHA,
  NATIVE_TRANSCRIPT_SHA,
} from './supersystem-runtime-conformance.mjs';
import {qualifyColdstartCohostRoot} from './cohost-coldstart-qualification.mjs';
import {validateNativeParticipantLease,validateNativeDeliveryReceipt,NATIVE_DELIVERY_RECEIPT_SCHEMA} from './native-transcript-participant.mjs';
import {
  validateRuntimeExecutionReceipt,
  validateHostRouteInterpositionReceipt,
  validateLimitedRuntimeTurnReceipt,
  validatePhysicalRuntimeTurnReceipt,
} from './session-local-service.mjs';

export const PHYSICAL_CLOSURE_SCHEMA='ikant-le-physical-runtime-closure-status/v1';
export const PHYSICAL_CLOSURE_EVIDENCE_SCHEMA='ikant-le-physical-runtime-closure-evidence/v1';
export const COHOST_RELATION_ATTESTATION_SCHEMA='ikant-le-cohost-relation-attestation/v1';
export const NATIVE_TURN_GRANT_SCHEMA='ikant-native-turn-grant/v1';
export const NATIVE_DELIVERY_READBACK_SCHEMA=NATIVE_DELIVERY_RECEIPT_SCHEMA;
const H40=/^[a-f0-9]{40}$/;
const H64=/^[a-f0-9]{64}$/;
const uniq=a=>[...new Set(a)];
const digest=x=>crypto.createHash('sha256').update(Buffer.from(JSON.stringify(x))).digest('hex');
const strip=x=>{const y=structuredClone(x||{});delete y.receipt_sha256;return y;};
const seal=x=>({...x,receipt_sha256:digest(x)});

export function validatePhysicalBootstrapBinding({sourceHead,sessionLocatorSha256=null,bootstrapInvocationReceipt,hostBootstrapBindingReceipt}={}){
  const iv=validateBootstrapInvocationReceipt(bootstrapInvocationReceipt),bv=validateHostBootstrapBindingReceipt(hostBootstrapBindingReceipt,{sourceHead,invocationReceipt:bootstrapInvocationReceipt}),e=[];
  if(!iv.ok)e.push(...iv.errors.map(x=>'invocation:'+x));
  if(!bv.ok)e.push(...bv.errors.map(x=>'binding:'+x));
  if(hostBootstrapBindingReceipt?.result_class!=='OWNER_NEXT')e.push('binding:result_class');
  if(hostBootstrapBindingReceipt?.binding_fresh!==true)e.push('binding:fresh');
  if(!String(hostBootstrapBindingReceipt?.binding_epoch||'').trim()||!String(hostBootstrapBindingReceipt?.binding_nonce||'').trim())e.push('binding:epoch_nonce');
  if(!H40.test(String(sourceHead||''))||hostBootstrapBindingReceipt?.source_head!==sourceHead)e.push('binding:source');
  if(!H64.test(String(hostBootstrapBindingReceipt?.session_locator_sha256||''))||(sessionLocatorSha256&&hostBootstrapBindingReceipt?.session_locator_sha256!==sessionLocatorSha256))e.push('binding:session');
  return{ok:e.length===0,errors:uniq(e)};
}

export function issueCohostRelationAttestation(cohostEvidence={}){
  const q=qualifyColdstartCohostRoot(cohostEvidence);
  if(q.state!=='COHOST_SAME_SESSION'||q.promise_satisfied!==true)throw new Error('cohost relation not closed');
  const refs={bind_nucleus_receipt_sha256:cohostEvidence?.bindNucleus?.receipt_sha256||null,context_receipt_sha256:cohostEvidence?.contextReadback?.manifest_receipt_sha256||cohostEvidence?.contextReadback?.receipt_sha256||null,participation_lease_receipt_sha256:cohostEvidence?.participationLease?.receipt_sha256||null,attributed_delivery_receipt_sha256:cohostEvidence?.attributedDelivery?.receipt_sha256||null,native_delivery_receipt_sha256:cohostEvidence?.nativeReceipt?.receipt_sha256||null,envelope_receipt_sha256:cohostEvidence?.envelope?.receipt_sha256||null};
  for(const k of ['bind_nucleus_receipt_sha256','participation_lease_receipt_sha256','attributed_delivery_receipt_sha256','native_delivery_receipt_sha256'])if(!H64.test(String(refs[k]||'')))throw new Error('cohost proof ref invalid:'+k);
  return seal({schema:COHOST_RELATION_ATTESTATION_SCHEMA,observation_owner:'EXISTING_B0_R0_R1_R2_QUALIFIER',semantic_sha256:COMMON_COHOST_SHA,state:'COHOST_RELATION',session_locator_sha256:q.session_locator_sha256,source_head:q.source_head,runtime_root_sha256:q.runtime_root_sha256,root_spine:q.root_spine,proof_refs:refs,proof_recomputed:true,raw_status_is_proof:false,authority:0});
}

export function validateCohostRelationAttestation(value,{sourceHead=null,runtimeRootSha256=null,sessionLocatorSha256=null}={}){
  const x=value||{},e=[];
  if(x.schema!==COHOST_RELATION_ATTESTATION_SCHEMA)e.push('schema');
  if(x.observation_owner!=='EXISTING_B0_R0_R1_R2_QUALIFIER'||x.proof_recomputed!==true||x.raw_status_is_proof!==false)e.push('owner');
  if(x.semantic_sha256!==COMMON_COHOST_SHA||x.state!=='COHOST_RELATION')e.push('semantic');
  if(!H64.test(String(x.session_locator_sha256||''))||(sessionLocatorSha256&&x.session_locator_sha256!==sessionLocatorSha256))e.push('session');
  if(!H40.test(String(x.source_head||''))||(sourceHead&&x.source_head!==sourceHead))e.push('source');
  if(!H64.test(String(x.runtime_root_sha256||''))||(runtimeRootSha256&&x.runtime_root_sha256!==runtimeRootSha256))e.push('runtime_root');
  if(x.root_spine?.B0_VERIFIED_BIND_NUCLEUS!==true||x.root_spine?.R0_DURABLE_CANONICAL_RUNTIME_CONTEXT!==true||x.root_spine?.R1_PERSISTENT_PARTICIPATION_LEASE!==true||x.root_spine?.R2_EXACT_ATTRIBUTED_DELIVERY_RECEIPT!==true)e.push('root_spine');
  for(const k of ['bind_nucleus_receipt_sha256','participation_lease_receipt_sha256','attributed_delivery_receipt_sha256','native_delivery_receipt_sha256'])if(!H64.test(String(x.proof_refs?.[k]||'')))e.push('proof_refs');
  if(x.authority!==0)e.push('authority');
  if(!H64.test(String(x.receipt_sha256||''))||digest(strip(x))!==x.receipt_sha256)e.push('receipt');
  return{ok:e.length===0,errors:uniq(e)};
}

export function validateNativeTurnGrantReceipt(value,{sessionLocatorSha256,participantLease,sourceHead=null,runtimeRootSha256=null,runtimeInstanceId=null}={}){
 const x=value||{},lease=participantLease||{},e=[];
 if(x.schema!==NATIVE_TURN_GRANT_SCHEMA)e.push('schema');
 if(x.observation_owner!=='HOST_SCHEDULER'||x.external_observation!==true||x.observed!==true)e.push('observation');
 if(!H64.test(String(x.session_locator_sha256||''))||x.session_locator_sha256!==sessionLocatorSha256)e.push('session');
 if(!String(x.participant_id||'').trim()||x.participant_id!==lease.participant_id)e.push('participant');
 if(!H64.test(String(x.participant_lease_receipt_sha256||''))||x.participant_lease_receipt_sha256!==lease.receipt_sha256)e.push('lease_ref');
 if(!String(x.turn_id||'').trim()||!String(x.turn_lease_id||'').trim())e.push('turn');
 if(!String(x.scheduler_epoch||'').trim()||x.grant_fresh!==true||x.current_turn_granted!==true)e.push('grant');
 if(!H40.test(String(x.source_head||''))||(sourceHead&&x.source_head!==sourceHead))e.push('source');
 if(!H64.test(String(x.runtime_root_sha256||''))||(runtimeRootSha256&&x.runtime_root_sha256!==runtimeRootSha256))e.push('runtime_root');
 if(!String(x.runtime_instance_id||'').trim()||(runtimeInstanceId&&x.runtime_instance_id!==runtimeInstanceId))e.push('runtime_instance');
 if(x.authority!==0)e.push('authority');
 if(!H64.test(String(x.receipt_sha256||''))||digest(strip(x))!==x.receipt_sha256)e.push('receipt');
 return{ok:e.length===0,errors:uniq(e)};
}

export function validateNativeDeliveryReadbackReceipt(value,{sessionLocatorSha256,participantLease,turnGrant,runtimeTurnReceipt,physicalRuntimeTurnReceipt,sourceHead=null,runtimeRootSha256=null,runtimeInstanceId=null}={}){
 const x=value||{},lease=participantLease||{},grant=turnGrant||{},turn=runtimeTurnReceipt||{},e=[],base=validateNativeDeliveryReceipt(x,{sessionLocatorSha256,participantLease});
 if(!base.ok)e.push(...base.errors.map(y=>'c50:'+y));
 if(x.schema!==NATIVE_DELIVERY_READBACK_SCHEMA)e.push('schema');
 if(x.observation_owner!=='HOST_NATIVE_CHAT'||x.external_observation!==true||x.observed!==true)e.push('observation');
 if(!H64.test(String(x.session_locator_sha256||''))||x.session_locator_sha256!==sessionLocatorSha256)e.push('session');
 if(!String(x.participant_id||'').trim()||x.participant_id!==lease.participant_id||x.participant_id!==grant.participant_id)e.push('participant');
 if(x.turn_id!==grant.turn_id||x.turn_lease_id!==grant.turn_lease_id)e.push('turn');
 if(!H64.test(String(x.turn_grant_receipt_sha256||''))||x.turn_grant_receipt_sha256!==grant.receipt_sha256)e.push('grant_ref');
 if(!H64.test(String(x.runtime_turn_receipt_sha256||''))||x.runtime_turn_receipt_sha256!==turn.receipt_sha256)e.push('runtime_turn_ref');
 if(!H64.test(String(x.physical_runtime_turn_receipt_sha256||''))||x.physical_runtime_turn_receipt_sha256!==physicalRuntimeTurnReceipt?.receipt_sha256)e.push('physical_turn_ref');
 if(x.role_class!=='NATIVE_NON_USER_ACTOR'||x.host_role_is_user!==false||x.host_role_is_assistant_impersonation!==false)e.push('role');
 if(x.surface!=='NATIVE_TRANSCRIPT'||x.host_readback!==true||x.exact_runtime_bytes!==true)e.push('delivery');
 if(!H64.test(String(x.runtime_output_sha256||''))||x.runtime_output_sha256!==turn.output_sha256||x.visible_output_sha256!==x.runtime_output_sha256)e.push('bytes');
 if(!H40.test(String(x.source_head||''))||(sourceHead&&x.source_head!==sourceHead))e.push('source');
 if(!H64.test(String(x.runtime_root_sha256||''))||(runtimeRootSha256&&x.runtime_root_sha256!==runtimeRootSha256))e.push('runtime_root');
 if(!String(x.runtime_instance_id||'').trim()||(runtimeInstanceId&&x.runtime_instance_id!==runtimeInstanceId))e.push('runtime_instance');
 if(x.delivery_fresh!==true||!String(x.delivery_epoch||'').trim())e.push('freshness');
 if(x.authority!==0)e.push('authority');
 if(!H64.test(String(x.receipt_sha256||''))||digest(strip(x))!==x.receipt_sha256)e.push('receipt');
 return{ok:e.length===0,errors:uniq(e)};
}

function validateCrossBinding({sourceHead,hostBootstrapBindingReceipt,runtimeExecutionReceipt,cohostAttestation,routeReceipt,nativeParticipantLease,nativeTurnGrantReceipt,nativeDeliveryReadbackReceipt,runtimeTurnReceipt,physicalRuntimeTurnReceipt}={}){
  const e=[],session=cohostAttestation?.session_locator_sha256,root=runtimeExecutionReceipt?.runtime_root_sha256,instance=runtimeExecutionReceipt?.runtime_instance_id,participant=nativeParticipantLease?.participant_id,turn=nativeTurnGrantReceipt?.turn_id;
  if(!H40.test(String(sourceHead||'')))e.push('source_shape');
  if(hostBootstrapBindingReceipt?.session_locator_sha256!==session)e.push('bootstrap_session');
  if(runtimeExecutionReceipt?.source_head!==sourceHead||cohostAttestation?.source_head!==sourceHead||routeReceipt?.source_head!==sourceHead||nativeTurnGrantReceipt?.source_head!==sourceHead||nativeDeliveryReadbackReceipt?.source_head!==sourceHead)e.push('source');
  if(!H64.test(String(root||''))||cohostAttestation?.runtime_root_sha256!==root||routeReceipt?.runtime_root_sha256!==root||nativeTurnGrantReceipt?.runtime_root_sha256!==root||nativeDeliveryReadbackReceipt?.runtime_root_sha256!==root)e.push('runtime_root');
  if(!String(instance||'').trim()||routeReceipt?.runtime_instance_id!==instance||nativeTurnGrantReceipt?.runtime_instance_id!==instance||nativeDeliveryReadbackReceipt?.runtime_instance_id!==instance)e.push('runtime_instance');
  if(!H64.test(String(session||''))||routeReceipt?.session_locator_sha256!==session||nativeParticipantLease?.session_locator_sha256!==session||nativeTurnGrantReceipt?.session_locator_sha256!==session||nativeDeliveryReadbackReceipt?.session_locator_sha256!==session)e.push('session');
  if(!String(participant||'').trim()||nativeTurnGrantReceipt?.participant_id!==participant||nativeDeliveryReadbackReceipt?.participant_id!==participant)e.push('participant');
  if(!String(turn||'').trim()||routeReceipt?.turn_id!==turn||nativeDeliveryReadbackReceipt?.turn_id!==turn)e.push('turn');
  if(nativeTurnGrantReceipt?.participant_lease_receipt_sha256!==nativeParticipantLease?.receipt_sha256)e.push('lease_ref');
  if(nativeDeliveryReadbackReceipt?.turn_grant_receipt_sha256!==nativeTurnGrantReceipt?.receipt_sha256)e.push('grant_ref');
  if(nativeDeliveryReadbackReceipt?.runtime_turn_receipt_sha256!==runtimeTurnReceipt?.receipt_sha256)e.push('runtime_turn_ref');
  if(nativeDeliveryReadbackReceipt?.physical_runtime_turn_receipt_sha256!==physicalRuntimeTurnReceipt?.receipt_sha256)e.push('physical_turn_ref');
  if(physicalRuntimeTurnReceipt?.host_turn_id!==turn||physicalRuntimeTurnReceipt?.host_route_receipt_sha256!==routeReceipt?.receipt_sha256||physicalRuntimeTurnReceipt?.limited_runtime_turn_receipt_sha256!==runtimeTurnReceipt?.receipt_sha256)e.push('host_runtime_turn_binding');
  if(nativeDeliveryReadbackReceipt?.runtime_output_sha256!==runtimeTurnReceipt?.output_sha256||physicalRuntimeTurnReceipt?.output_sha256!==runtimeTurnReceipt?.output_sha256)e.push('runtime_output');
  return{ok:e.length===0,errors:uniq(e)};
}

export function qualifyPhysicalRuntimeClosureV1({sourceHead=null,bootstrapInvocationReceipt=null,hostBootstrapBindingReceipt=null,runtimeExecutionReceipt=null,cohostEvidence=null,hostRouteInterpositionReceipt=null,nativeParticipantLease=null,nativeTurnGrantReceipt=null,nativeDeliveryReadbackReceipt=null,runtimeTurnReceipt=null,physicalRuntimeTurnReceipt=null,capabilityAxis='BIND_NUCLEUS',productAxis='CANDIDATE',controlOwnership='HOST_OWNED'}={}){
  const expectedSession=cohostEvidence?.bindNucleus?.session_locator_sha256||null;
  const bootstrap=validatePhysicalBootstrapBinding({sourceHead,sessionLocatorSha256:expectedSession,bootstrapInvocationReceipt,hostBootstrapBindingReceipt});
  let cohostAttestation=null,cohostError=null;
  try{cohostAttestation=issueCohostRelationAttestation(cohostEvidence||{});}catch(e){cohostError=String(e?.message||e);}
  const rv=validateRuntimeExecutionReceipt(runtimeExecutionReceipt,{sourceHead});
  const cv=cohostAttestation?validateCohostRelationAttestation(cohostAttestation,{sourceHead,runtimeRootSha256:runtimeExecutionReceipt?.runtime_root_sha256}):{ok:false,errors:[cohostError||'attestation_missing']};
  if(!bootstrap.ok)return seal({schema:PHYSICAL_CLOSURE_SCHEMA,state:'INTEGRATION_IMPEDIMENT',physical_e2e_proven:false,bootstrap_errors:bootstrap.errors,authority:0});
  if(!rv.ok||!cv.ok)return seal({schema:PHYSICAL_CLOSURE_SCHEMA,state:'NOT_READY',physical_e2e_proven:false,runtime_errors:rv.errors,cohost_errors:cv.errors,authority:0});
  const route=validateHostRouteInterpositionReceipt(hostRouteInterpositionReceipt,{sourceHead,runtimeRootSha256:runtimeExecutionReceipt.runtime_root_sha256,runtimeInstanceId:runtimeExecutionReceipt.runtime_instance_id,sessionLocatorSha256:cohostAttestation.session_locator_sha256});
  if(!route.ok||route.state!=='SAFE')return seal({schema:PHYSICAL_CLOSURE_SCHEMA,state:'SESSION_ROUTE_BLOCKED',physical_e2e_proven:false,relation_axis:'COHOST_RELATION',route_state:route.state,route_errors:route.errors,authority:0});
  const lv=validateNativeParticipantLease(nativeParticipantLease,{sessionLocatorSha256:cohostAttestation.session_locator_sha256});
  const gv=validateNativeTurnGrantReceipt(nativeTurnGrantReceipt,{sessionLocatorSha256:cohostAttestation.session_locator_sha256,participantLease:nativeParticipantLease,sourceHead,runtimeRootSha256:runtimeExecutionReceipt.runtime_root_sha256,runtimeInstanceId:runtimeExecutionReceipt.runtime_instance_id});
  const tv=validateLimitedRuntimeTurnReceipt(runtimeTurnReceipt,{sourceHead,runtimeRootSha256:runtimeExecutionReceipt.runtime_root_sha256});
  const pv=validatePhysicalRuntimeTurnReceipt(physicalRuntimeTurnReceipt,{routeReceipt:hostRouteInterpositionReceipt,runtimeExecutionReceipt,limitedTurnReceipt:runtimeTurnReceipt,sessionLocatorSha256:cohostAttestation.session_locator_sha256,sourceHead,runtimeRootSha256:runtimeExecutionReceipt.runtime_root_sha256});
  const dv=validateNativeDeliveryReadbackReceipt(nativeDeliveryReadbackReceipt,{sessionLocatorSha256:cohostAttestation.session_locator_sha256,participantLease:nativeParticipantLease,turnGrant:nativeTurnGrantReceipt,runtimeTurnReceipt,physicalRuntimeTurnReceipt,sourceHead,runtimeRootSha256:runtimeExecutionReceipt.runtime_root_sha256,runtimeInstanceId:runtimeExecutionReceipt.runtime_instance_id});
  const xb=validateCrossBinding({sourceHead,hostBootstrapBindingReceipt,runtimeExecutionReceipt,cohostAttestation,routeReceipt:hostRouteInterpositionReceipt,nativeParticipantLease,nativeTurnGrantReceipt,nativeDeliveryReadbackReceipt,runtimeTurnReceipt,physicalRuntimeTurnReceipt});
  if(!lv.ok||!gv.ok||!tv.ok||!pv.ok||!dv.ok||!xb.ok)return seal({schema:PHYSICAL_CLOSURE_SCHEMA,state:'COHOST_RELATION_ONLY',physical_e2e_proven:false,relation_axis:'COHOST_RELATION',participant_errors:lv.errors,turn_grant_errors:gv.errors,runtime_turn_errors:tv.errors,physical_turn_errors:pv.errors,delivery_errors:dv.errors,cross_binding_errors:xb.errors,authority:0});
  const material={schema:PHYSICAL_CLOSURE_SCHEMA,state:'NATIVE_TRANSCRIPT_ACTOR_E2E',physical_e2e_proven:true,relation_axis:'NATIVE_TRANSCRIPT_ACTOR',bootstrap_conformance:'CONFORMANT',route_conformance:'SAFE',source_head:sourceHead,runtime_root_sha256:runtimeExecutionReceipt.runtime_root_sha256,runtime_instance_id:runtimeExecutionReceipt.runtime_instance_id,session_locator_sha256:cohostAttestation.session_locator_sha256,participant_id:nativeParticipantLease.participant_id,turn_id:nativeTurnGrantReceipt.turn_id,cohost_semantic_sha256:COMMON_COHOST_SHA,native_semantic_sha256:NATIVE_TRANSCRIPT_SHA,capability_axis:capabilityAxis,product_axis:productAxis,control_ownership_axis:controlOwnership,full_runtime_required:false,control_ownership_required:false,canonical_product_required:false,legacy_active_required:false,live_host_receipts_required:true,synthetic_ci_is_physical_proof:false,authority:0};
  return seal(material);
}

export function validatePhysicalClosureReceipt(value){
 const x=value||{},e=[];
 if(x.schema!==PHYSICAL_CLOSURE_SCHEMA||x.state!=='NATIVE_TRANSCRIPT_ACTOR_E2E'||x.physical_e2e_proven!==true)e.push('state');
 if(x.relation_axis!=='NATIVE_TRANSCRIPT_ACTOR'||x.bootstrap_conformance!=='CONFORMANT'||x.route_conformance!=='SAFE')e.push('projection');
 for(const k of ['runtime_root_sha256','session_locator_sha256'])if(!H64.test(String(x[k]||'')))e.push(k);
 if(!H40.test(String(x.source_head||''))||!String(x.runtime_instance_id||'').trim()||!String(x.participant_id||'').trim()||!String(x.turn_id||'').trim())e.push('binding');
 if(x.live_host_receipts_required!==true||x.synthetic_ci_is_physical_proof!==false||x.authority!==0)e.push('claim_boundary');
 if(!H64.test(String(x.receipt_sha256||''))||digest(strip(x))!==x.receipt_sha256)e.push('receipt');
 return{ok:e.length===0,errors:uniq(e)};
}

export function validatePhysicalClosurePersistenceReceipt(value){
 const x=value||{},e=[];
 if(x.schema!=='ikant-le-physical-runtime-persistence-witness/v1'||x.status!=='PASS'||x.same_session!==true||x.same_runtime_instance!==true||x.same_participant!==true||x.fresh_turn!==true)e.push('state');
 if((x.errors||[]).length)e.push('errors');
 if(x.authority!==0)e.push('authority');
 if(!H64.test(String(x.receipt_sha256||''))||digest(strip(x))!==x.receipt_sha256)e.push('receipt');
 return{ok:e.length===0,errors:uniq(e)};
}

export function validatePhysicalClosurePersistenceWitness({baseClosure,secondRouteReceipt,secondRuntimeTurnReceipt,secondPhysicalRuntimeTurnReceipt,nativeParticipantLease,secondTurnGrantReceipt,secondDeliveryReceipt}={}){
  const e=[],baseValidation=validatePhysicalClosureReceipt(baseClosure);
  if(!baseValidation.ok)e.push('base');
  const route=validateHostRouteInterpositionReceipt(secondRouteReceipt,{sourceHead:baseClosure?.source_head,runtimeRootSha256:baseClosure?.runtime_root_sha256,runtimeInstanceId:baseClosure?.runtime_instance_id,sessionLocatorSha256:baseClosure?.session_locator_sha256});if(!route.ok||route.state!=='SAFE')e.push('route');
  const lv=validateNativeParticipantLease(nativeParticipantLease,{sessionLocatorSha256:baseClosure?.session_locator_sha256});if(!lv.ok||nativeParticipantLease?.participant_id!==baseClosure?.participant_id)e.push('lease');
  const gv=validateNativeTurnGrantReceipt(secondTurnGrantReceipt,{sessionLocatorSha256:baseClosure?.session_locator_sha256,participantLease:nativeParticipantLease,sourceHead:baseClosure?.source_head,runtimeRootSha256:baseClosure?.runtime_root_sha256,runtimeInstanceId:baseClosure?.runtime_instance_id});if(!gv.ok)e.push('grant');
  const tv=validateLimitedRuntimeTurnReceipt(secondRuntimeTurnReceipt,{sourceHead:baseClosure?.source_head,runtimeRootSha256:baseClosure?.runtime_root_sha256});if(!tv.ok)e.push('runtime_turn');
  const pv=validatePhysicalRuntimeTurnReceipt(secondPhysicalRuntimeTurnReceipt,{routeReceipt:secondRouteReceipt,limitedTurnReceipt:secondRuntimeTurnReceipt,sessionLocatorSha256:baseClosure?.session_locator_sha256,sourceHead:baseClosure?.source_head,runtimeRootSha256:baseClosure?.runtime_root_sha256});if(!pv.ok||secondPhysicalRuntimeTurnReceipt?.runtime_instance_id!==baseClosure?.runtime_instance_id)e.push('physical_turn');
  const dv=validateNativeDeliveryReadbackReceipt(secondDeliveryReceipt,{sessionLocatorSha256:baseClosure?.session_locator_sha256,participantLease:nativeParticipantLease,turnGrant:secondTurnGrantReceipt,runtimeTurnReceipt:secondRuntimeTurnReceipt,physicalRuntimeTurnReceipt:secondPhysicalRuntimeTurnReceipt,sourceHead:baseClosure?.source_head,runtimeRootSha256:baseClosure?.runtime_root_sha256,runtimeInstanceId:baseClosure?.runtime_instance_id});if(!dv.ok)e.push('delivery');
  if(secondTurnGrantReceipt?.turn_id===baseClosure?.turn_id)e.push('fresh_turn');
  if(secondRouteReceipt?.turn_id!==secondTurnGrantReceipt?.turn_id)e.push('turn_binding');
  if(secondTurnGrantReceipt?.participant_lease_receipt_sha256!==nativeParticipantLease?.receipt_sha256)e.push('lease_ref');
  const body={schema:'ikant-le-physical-runtime-persistence-witness/v1',status:e.length?'FAIL':'PASS',same_session:true,same_runtime_instance:true,same_participant:true,fresh_turn:e.length===0,errors:uniq(e),authority:0};
  return seal(body);
}

export function buildPhysicalClosureEvidenceBundle({closureInputs=null,persistenceInputs=null}={}){
  const ci=closureInputs||{},pi=persistenceInputs||{},closure=qualifyPhysicalRuntimeClosureV1(ci),cv=validatePhysicalClosureReceipt(closure);
  const persistence=cv.ok?validatePhysicalClosurePersistenceWitness({baseClosure:closure,...pi}):seal({schema:'ikant-le-physical-runtime-persistence-witness/v1',status:'FAIL',same_session:false,same_runtime_instance:false,same_participant:false,fresh_turn:false,errors:['base'],authority:0});
  const pv=validatePhysicalClosurePersistenceReceipt(persistence);
  let cohostAttestation=null;try{cohostAttestation=issueCohostRelationAttestation(ci.cohostEvidence||{});}catch{}
  const refs={
   bootstrap_invocation:ci.bootstrapInvocationReceipt?.receipt_sha256||null,
   host_bootstrap_binding:ci.hostBootstrapBindingReceipt?.receipt_sha256||null,
   runtime_execution:ci.runtimeExecutionReceipt?.receipt_sha256||null,
   cohost_relation_attestation:cohostAttestation?.receipt_sha256||null,
   host_route_interposition:ci.hostRouteInterpositionReceipt?.receipt_sha256||null,
   native_participant_lease:ci.nativeParticipantLease?.receipt_sha256||null,
   native_turn_grant:ci.nativeTurnGrantReceipt?.receipt_sha256||null,
   runtime_turn:ci.runtimeTurnReceipt?.receipt_sha256||null,
   physical_runtime_turn:ci.physicalRuntimeTurnReceipt?.receipt_sha256||null,
   native_delivery:ci.nativeDeliveryReadbackReceipt?.receipt_sha256||null,
   persistence_route:pi.secondRouteReceipt?.receipt_sha256||null,
   persistence_runtime_turn:pi.secondRuntimeTurnReceipt?.receipt_sha256||null,
   persistence_physical_turn:pi.secondPhysicalRuntimeTurnReceipt?.receipt_sha256||null,
   persistence_turn_grant:pi.secondTurnGrantReceipt?.receipt_sha256||null,
   persistence_delivery:pi.secondDeliveryReceipt?.receipt_sha256||null
  };
  const refsComplete=Object.values(refs).every(v=>H64.test(String(v||'')));
  const body={schema:PHYSICAL_CLOSURE_EVIDENCE_SCHEMA,closure_receipt_sha256:closure.receipt_sha256||null,persistence_receipt_sha256:persistence.receipt_sha256||null,receipt_refs:refs,receipt_refs_owner_derived:true,caller_supplied_receipt_refs_accepted:false,closure_owner_recomputed:true,persistence_owner_recomputed:true,direct_derived_inputs_accepted_as_proof:false,closure_valid:cv.ok,persistence_valid:pv.ok,receipt_refs_complete:refsComplete,global_dod_pass:cv.ok&&pv.ok&&refsComplete,live_receipts_external_to_repository:true,authority:0};
  return seal(body);
}
