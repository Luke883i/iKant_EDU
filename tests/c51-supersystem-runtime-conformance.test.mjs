import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {qualifyNativeTranscriptActor,NATIVE_PARTICIPANT_LEASE_SCHEMA,NATIVE_DELIVERY_RECEIPT_SCHEMA} from '../src/native-transcript-participant.mjs';
import {BOOTSTRAP_BINDING_SCHEMA,ROUTE_RECEIPT_SCHEMA,COMMON_COHOST_SHA,NATIVE_TRANSCRIPT_SHA,supersystemDigest,invokeCanonicalBootstrapOwner,validateBootstrapInvocationReceipt,validateHostBootstrapBindingReceipt,validateSessionRouteReceipt,projectSessionRouteConformance,qualifySupersystemRuntimeV11} from '../src/supersystem-runtime-conformance.mjs';

const HEAD='f'.repeat(40),SESSION='a'.repeat(64),ROOT='c'.repeat(64);
const sign=x=>({...x,receipt_sha256:supersystemDigest(x)});
const cohost=({tier='BIND_NUCLEUS'}={})=>({schema:'ikant-le-coldstart-cohost-root-status/v1',common_semantic_sha256:COMMON_COHOST_SHA,session_locator_sha256:SESSION,source_head:HEAD,runtime_root_sha256:ROOT,state:'COHOST_SAME_SESSION',promise_satisfied:true,runtime_capability_tier:tier,full_runtime_hydration_required_for_relation:false,authority:0,physical_host_capability_created:false});
const route=overrides=>sign({schema:ROUTE_RECEIPT_SCHEMA,observation_owner:'HOST_SESSION_ROUTER',external_observation:true,observed:true,session_locator_sha256:SESSION,source_head:HEAD,runtime_root_sha256:ROOT,canonical_route:'src/runtime.mjs#runCommand',runtime_turn_offered:true,host_visible_turn_ordinal:8,runtime_turn_ordinal:8,canonical_turn_pending:false,next_turn_requested:false,host_bypass_observed:false,model_direct_reply_observed:false,pending_turn_id:null,authority:0,...overrides});
const bootstrapBinding=inv=>sign({schema:BOOTSTRAP_BINDING_SCHEMA,observation_owner:'HOST_INTEGRATION',external_observation:true,observed:true,source_head:HEAD,entrypoint:'src/supersystem-runtime-conformance.mjs#invokeCanonicalBootstrapOwner',callable:true,invoked:true,model_inferred_next:false,caller_retry_memory_used:false,owner_returned_next:true,one_next:true,one_executor:true,result_class:'OWNER_NEXT',owner_invocation_receipt_sha256:inv.receipt_sha256,authority:0});
const nativeLease=()=>{const m={schema:NATIVE_PARTICIPANT_LEASE_SCHEMA,observation_owner:'HOST_NATIVE_CHAT',external_observation:true,observed:true,session_locator_sha256:SESSION,participant_id:'ikant-native-1',actor:'IKANT',role_class:'NATIVE_NON_USER_ACTOR',scheduler:'PERSISTENT',current_turn_entitlement:true,future_turn_entitlement:true,no_manual_reselection:true,bypass_guard:true,lease_epoch:'epoch-1',lease_fresh:true,authority:0};return sign(m)};
const nativeDelivery=l=>{const m={schema:NATIVE_DELIVERY_RECEIPT_SCHEMA,observation_owner:'HOST_NATIVE_CHAT',external_observation:true,observed:true,session_locator_sha256:SESSION,participant_id:l.participant_id,turn_id:'turn-1',turn_lease_id:'lease-turn-1',role_class:'NATIVE_NON_USER_ACTOR',host_role_is_user:false,host_role_is_assistant_impersonation:false,surface:'NATIVE_TRANSCRIPT',host_readback:true,exact_runtime_bytes:true,runtime_output_sha256:'b'.repeat(64),visible_output_sha256:'b'.repeat(64),authority:0};return sign(m)};

test('C51 bootstrap adapter executes existing canonical owner rather than predicting NEXT',()=>{
 const x=invokeCanonicalBootstrapOwner({human_input:'inizializza'});
 assert.equal(validateBootstrapInvocationReceipt(x.receipt).ok,true);
 assert.equal(x.receipt.entrypoint,'src/local-host-meta-prompt.mjs#for_ai_agent_first_entrypoint');
 assert.equal(x.receipt.owner_invoked,true);assert.equal(x.receipt.model_inferred_next,false);assert.equal(x.receipt.model_is_retry_memory,false);
});

test('C51 external bootstrap binding is typed and caller/model authority is rejected',()=>{
 const inv=invokeCanonicalBootstrapOwner({human_input:'inizializza'}).receipt,b=bootstrapBinding(inv);
 assert.equal(validateHostBootstrapBindingReceipt(b,{sourceHead:HEAD,invocationReceipt:inv}).ok,true);
 const inferred=sign({...b,model_inferred_next:true,receipt_sha256:undefined});
 assert.equal(validateHostBootstrapBindingReceipt(inferred,{sourceHead:HEAD,invocationReceipt:inv}).ok,false);
 const retry=sign({...b,caller_retry_memory_used:true,receipt_sha256:undefined});
 assert.equal(validateHostBootstrapBindingReceipt(retry,{sourceHead:HEAD,invocationReceipt:inv}).ok,false);
});

test('C51 route conformance is orthogonal to COHOST_RELATION and same-session/source/runtime bound',()=>{
 const c=cohost(),missing=projectSessionRouteConformance({cohostStatus:c,routeReceipt:null});
 assert.equal(missing.state,'EXTERNAL_ROUTE_GAP');
 const safe=route();
 assert.equal(validateSessionRouteReceipt(safe,{sessionLocatorSha256:SESSION,sourceHead:HEAD,runtimeRootSha256:ROOT}).ok,true);
 assert.equal(projectSessionRouteConformance({cohostStatus:c,routeReceipt:safe}).state,'SAFE');
 const drift=route({source_head:'e'.repeat(40)});
 assert.equal(projectSessionRouteConformance({cohostStatus:c,routeReceipt:drift}).state,'EXTERNAL_ROUTE_GAP');
});

test('C51 unresolved canonical turn and host/model bypass are fail-closed',()=>{
 const c=cohost();
 assert.equal(projectSessionRouteConformance({cohostStatus:c,routeReceipt:route({canonical_turn_pending:true,next_turn_requested:true,pending_turn_id:'TURN-PENDING'})}).state,'PENDING_CANONICAL_TURN');
 assert.equal(projectSessionRouteConformance({cohostStatus:c,routeReceipt:route({host_bypass_observed:true})}).state,'BLOCKED_BYPASS');
 assert.equal(projectSessionRouteConformance({cohostStatus:c,routeReceipt:route({model_direct_reply_observed:true})}).state,'BLOCKED_BYPASS');
 assert.equal(projectSessionRouteConformance({cohostStatus:c,routeReceipt:route({runtime_turn_ordinal:7})}).state,'STALE_UNSYNCED');
});

test('C51 native actor reuses C50 receipts and remains orthogonal to hydration/product/control',()=>{
 const c=cohost(),l=nativeLease(),d=nativeDelivery(l),n=qualifyNativeTranscriptActor({cohostStatus:c,sessionLocatorSha256:SESSION,nativeParticipantLease:l,nativeDeliveryReceipt:d});
 assert.equal(n.semantic_sha256,NATIVE_TRANSCRIPT_SHA);assert.equal(n.session_locator_sha256,SESSION);assert.equal(n.state,'NATIVE_TRANSCRIPT_ACTOR');
 const inv=invokeCanonicalBootstrapOwner({human_input:'inizializza'}).receipt,b=bootstrapBinding(inv),q=qualifySupersystemRuntimeV11({sourceHead:HEAD,bootstrapInvocationReceipt:inv,hostBootstrapBindingReceipt:b,cohostStatus:c,routeReceipt:route(),nativeStatus:n,capabilityAxis:'BIND_NUCLEUS',productAxis:'CANDIDATE'});
 assert.equal(q.relation_axis,'NATIVE_TRANSCRIPT_ACTOR');assert.equal(q.system_state,'NATIVE_TRANSCRIPT_ACTOR');assert.equal(q.system_progress_allowed,true);assert.equal(q.capability_axis,'BIND_NUCLEUS');assert.equal(q.product_axis,'CANDIDATE');assert.equal(q.native_actor_requires_full_runtime,false);assert.equal(q.native_actor_requires_control_ownership,false);
});

test('C51 missing native host proof declassifies only to COHOST_RELATION and missing bootstrap binding to impediment',()=>{
 const c=cohost(),n=qualifyNativeTranscriptActor({cohostStatus:c,sessionLocatorSha256:SESSION,nativeParticipantLease:{},nativeDeliveryReceipt:{}}),q=qualifySupersystemRuntimeV11({sourceHead:HEAD,cohostStatus:c,routeReceipt:route(),nativeStatus:n});
 assert.equal(n.state,'COHOST_RELATION_ONLY');assert.equal(q.relation_axis,'COHOST_RELATION');assert.equal(q.external_native_host_gap,true);assert.equal(q.bootstrap_conformance,'INTEGRATION_IMPEDIMENT');assert.equal(q.system_state,'INTEGRATION_IMPEDIMENT');assert.equal(q.system_progress_allowed,false);
});

test('C51 overlay creates no authority owner or turn engine',()=>{
 const c=cohost(),n=qualifyNativeTranscriptActor({cohostStatus:c,sessionLocatorSha256:SESSION,nativeParticipantLease:{},nativeDeliveryReceipt:{}}),q=qualifySupersystemRuntimeV11({sourceHead:HEAD,cohostStatus:c,routeReceipt:route(),nativeStatus:n});
 for(const k of ['new_lifecycle','new_planner','new_retry_memory_owner','new_state_writer','new_truth_owner','new_turn_engine'])assert.equal(q[k],false);
 assert.equal(q.authority,0);assert.equal(q.native_host_capability_created,false);assert.equal(q.cohost_relation_requires_route_conformance,false);
});

test('C51 global projection blocks route gaps without changing relation ontology',()=>{const inv=invokeCanonicalBootstrapOwner({human_input:'inizializza'}).receipt,b=bootstrapBinding(inv),c=cohost(),n=qualifyNativeTranscriptActor({cohostStatus:c,sessionLocatorSha256:SESSION,nativeParticipantLease:{},nativeDeliveryReceipt:{}}),q=qualifySupersystemRuntimeV11({sourceHead:HEAD,bootstrapInvocationReceipt:inv,hostBootstrapBindingReceipt:b,cohostStatus:c,routeReceipt:route({canonical_turn_pending:true,next_turn_requested:true,pending_turn_id:'TURN-PENDING'}),nativeStatus:n});assert.equal(q.relation_axis,'COHOST_RELATION');assert.equal(q.route_conformance,'PENDING_CANONICAL_TURN');assert.equal(q.system_state,'SESSION_ROUTE_BLOCKED');assert.equal(q.system_progress_allowed,false);});
