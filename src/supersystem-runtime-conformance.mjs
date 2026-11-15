import crypto from 'node:crypto';
import {for_ai_agent_first_entrypoint} from './local-host-meta-prompt.mjs';

export const SUPERSESSION_SCHEMA='ikant-le-supersystem-runtime-conformance/v1.1';
export const BOOTSTRAP_INVOCATION_SCHEMA='ikant-le-supersystem-bootstrap-owner-invocation/v1';
export const BOOTSTRAP_BINDING_SCHEMA='ikant-le-supersystem-host-bootstrap-binding/v1';
export const ROUTE_RECEIPT_SCHEMA='ikant-le-supersystem-session-route-receipt/v1';
export const COMMON_COHOST_SHA='fa4ccab342d14b7e2a1f4d6505374045d282d51e488557f5fd8f9c23c88158da';
export const CLOSURE_PROFILE_SHA='07df3f7726e00586900e83726a8cbd5b45e243f476160783c7c770bb75c63fe9';
export const NATIVE_TRANSCRIPT_SHA='0fe2ca72875f9782d474fadf022b746c253f755244bfa39cb2dd66d361a2cb56';
const H40=/^[a-f0-9]{40}$/;const H64=/^[a-f0-9]{64}$/;
const uniq=a=>[...new Set(a)];
export const supersystemDigest=value=>crypto.createHash('sha256').update(Buffer.from(JSON.stringify(value))).digest('hex');
const sealed=value=>{const x={...(value||{})},actual=x.receipt_sha256;delete x.receipt_sha256;return H64.test(String(actual||''))&&actual===supersystemDigest(x);};

export function invokeCanonicalBootstrapOwner(entrypointArgs={}){
 const result=for_ai_agent_first_entrypoint(entrypointArgs);
 const material={schema:BOOTSTRAP_INVOCATION_SCHEMA,entrypoint:'src/local-host-meta-prompt.mjs#for_ai_agent_first_entrypoint',owner_invoked:true,owner_output_sha256:supersystemDigest(result),model_inferred_next:false,model_is_retry_memory:false,authority:0};
 return{result,receipt:{...material,receipt_sha256:supersystemDigest(material)}};
}

export function validateBootstrapInvocationReceipt(value){
 const x=value||{},e=[];
 if(x.schema!==BOOTSTRAP_INVOCATION_SCHEMA)e.push('schema');
 if(x.entrypoint!=='src/local-host-meta-prompt.mjs#for_ai_agent_first_entrypoint'||x.owner_invoked!==true)e.push('owner');
 if(!H64.test(String(x.owner_output_sha256||'')))e.push('output');
 if(x.model_inferred_next!==false||x.model_is_retry_memory!==false||x.authority!==0)e.push('authority');
 if(!sealed(x))e.push('receipt');
 return{ok:e.length===0,errors:uniq(e)};
}

export function validateHostBootstrapBindingReceipt(value,{sourceHead=null,invocationReceipt=null}={}){
 const x=value||{},e=[];
 if(x.schema!==BOOTSTRAP_BINDING_SCHEMA)e.push('schema');
 if(x.observation_owner!=='HOST_INTEGRATION'||x.external_observation!==true||x.observed!==true)e.push('observation');
 if(!H40.test(String(x.source_head||''))||(sourceHead&&x.source_head!==sourceHead))e.push('source_head');
 if(x.entrypoint!=='src/supersystem-runtime-conformance.mjs#invokeCanonicalBootstrapOwner')e.push('entrypoint');
 if(x.callable!==true||x.invoked!==true)e.push('binding');
 if(x.model_inferred_next!==false||x.caller_retry_memory_used!==false||x.owner_returned_next!==true||x.one_next!==true||x.one_executor!==true)e.push('owner_cycle');
 if(!['OWNER_NEXT','INTEGRATION_IMPEDIMENT'].includes(x.result_class))e.push('result_class');
 if(x.result_class==='OWNER_NEXT'&&!H64.test(String(x.owner_invocation_receipt_sha256||'')))e.push('invocation_ref');
 if(invocationReceipt){const v=validateBootstrapInvocationReceipt(invocationReceipt);if(!v.ok||x.owner_invocation_receipt_sha256!==invocationReceipt.receipt_sha256)e.push('invocation_binding');}
 if(x.authority!==0)e.push('authority');
 if(!sealed(x))e.push('receipt');
 return{ok:e.length===0,errors:uniq(e)};
}

export function validateSessionRouteReceipt(value,{sessionLocatorSha256=null,sourceHead=null,runtimeRootSha256=null}={}){
 const x=value||{},e=[];
 if(x.schema!==ROUTE_RECEIPT_SCHEMA)e.push('schema');
 if(x.observation_owner!=='HOST_SESSION_ROUTER'||x.external_observation!==true||x.observed!==true)e.push('observation');
 if(!H64.test(String(x.session_locator_sha256||''))||(sessionLocatorSha256&&x.session_locator_sha256!==sessionLocatorSha256))e.push('session');
 if(!H40.test(String(x.source_head||''))||(sourceHead&&x.source_head!==sourceHead))e.push('source_head');
 if(!H64.test(String(x.runtime_root_sha256||''))||(runtimeRootSha256&&x.runtime_root_sha256!==runtimeRootSha256))e.push('runtime_root');
 if(x.canonical_route!=='src/runtime.mjs#runCommand'||x.runtime_turn_offered!==true)e.push('route');
 if(!Number.isInteger(x.host_visible_turn_ordinal)||x.host_visible_turn_ordinal<0||!Number.isInteger(x.runtime_turn_ordinal)||x.runtime_turn_ordinal<0)e.push('ordinal');
 if(typeof x.canonical_turn_pending!=='boolean'||typeof x.next_turn_requested!=='boolean'||typeof x.host_bypass_observed!=='boolean'||typeof x.model_direct_reply_observed!=='boolean')e.push('flags');
 if(x.canonical_turn_pending&&!String(x.pending_turn_id||'').trim())e.push('pending_turn');
 if(!x.canonical_turn_pending&&x.pending_turn_id!=null)e.push('pending_turn');
 if(x.authority!==0)e.push('authority');
 if(!sealed(x))e.push('receipt');
 return{ok:e.length===0,errors:uniq(e)};
}

export function projectSessionRouteConformance({cohostStatus=null,routeReceipt=null}={}){
 const relation=cohostStatus?.state==='COHOST_SAME_SESSION'&&cohostStatus?.promise_satisfied===true&&cohostStatus?.common_semantic_sha256===COMMON_COHOST_SHA;
 if(!relation)return{state:'NOT_BOUND',allow_next_turn:false,relation_required:true,authority:0};
 const locator=cohostStatus?.session_locator_sha256||null,sourceHead=cohostStatus?.source_head||null,runtimeRootSha256=cohostStatus?.runtime_root_sha256||null;
 const v=validateSessionRouteReceipt(routeReceipt,{sessionLocatorSha256:locator,sourceHead,runtimeRootSha256});
 if(!v.ok)return{state:'EXTERNAL_ROUTE_GAP',allow_next_turn:false,errors:v.errors,authority:0};
 if(routeReceipt.host_bypass_observed||routeReceipt.model_direct_reply_observed)return{state:'BLOCKED_BYPASS',allow_next_turn:false,authority:0};
 if(routeReceipt.canonical_turn_pending)return{state:'PENDING_CANONICAL_TURN',allow_next_turn:false,pending_turn_id:routeReceipt.pending_turn_id,authority:0};
 if(routeReceipt.host_visible_turn_ordinal!==routeReceipt.runtime_turn_ordinal)return{state:'STALE_UNSYNCED',allow_next_turn:false,authority:0};
 return{state:'SAFE',allow_next_turn:true,authority:0};
}

export function validateNativeStatusProjection(value,{cohostStatus=null}={}){
 const x=value||{},e=[];
 if(x.semantic_sha256!==NATIVE_TRANSCRIPT_SHA)e.push('semantic_sha');
 if(cohostStatus?.state==='COHOST_SAME_SESSION'&&x.session_locator_sha256!==cohostStatus?.session_locator_sha256)e.push('session_binding');
 if(!['NOT_READY','COHOST_RELATION_ONLY','NATIVE_TRANSCRIPT_ACTOR'].includes(x.state))e.push('state');
 if(!['NONE','COHOST_RELATION','NATIVE_TRANSCRIPT_ACTOR'].includes(x.relation_axis))e.push('relation_axis');
 if(x.state==='NATIVE_TRANSCRIPT_ACTOR'&&x.native_transcript_proven!==true)e.push('native_proof');
 if(x.state!=='NATIVE_TRANSCRIPT_ACTOR'&&x.native_transcript_proven===true)e.push('native_proof');
 if(x.physical_host_capability_created!==false)e.push('host_boundary');
 if(x.full_runtime_required_for_native_actor!==false||x.control_plane_ownership_required!==false)e.push('orthogonality');
 if(x.authority!==0)e.push('authority');
 return{ok:e.length===0,errors:uniq(e)};
}

export function qualifySupersystemRuntimeV11({sourceHead=null,bootstrapInvocationReceipt=null,hostBootstrapBindingReceipt=null,cohostStatus=null,routeReceipt=null,nativeStatus=null,capabilityAxis='BIND_NUCLEUS',productAxis='CANDIDATE'}={}){
 const iv=validateBootstrapInvocationReceipt(bootstrapInvocationReceipt),bv=validateHostBootstrapBindingReceipt(hostBootstrapBindingReceipt,{sourceHead,invocationReceipt:bootstrapInvocationReceipt});
 const bootstrap=iv.ok&&bv.ok&&hostBootstrapBindingReceipt?.result_class==='OWNER_NEXT'?'CONFORMANT':'INTEGRATION_IMPEDIMENT';
 const cohost=cohostStatus?.state==='COHOST_SAME_SESSION'&&cohostStatus?.promise_satisfied===true&&cohostStatus?.common_semantic_sha256===COMMON_COHOST_SHA;
 const route=projectSessionRouteConformance({cohostStatus,routeReceipt});
 const nv=validateNativeStatusProjection(nativeStatus,{cohostStatus});
 let relation='NONE';
 if(cohost)relation='COHOST_RELATION';
 if(cohost&&nv.ok&&nativeStatus.state==='NATIVE_TRANSCRIPT_ACTOR')relation='NATIVE_TRANSCRIPT_ACTOR';
 const externalNativeGap=cohost&&relation!=='NATIVE_TRANSCRIPT_ACTOR';
 const systemState=bootstrap!=='CONFORMANT'?'INTEGRATION_IMPEDIMENT':(!cohost?'NOT_READY':(route.state!=='SAFE'?'SESSION_ROUTE_BLOCKED':(relation==='NATIVE_TRANSCRIPT_ACTOR'?'NATIVE_TRANSCRIPT_ACTOR':'COHOST_RELATION_ONLY')));
 const systemProgressAllowed=bootstrap==='CONFORMANT'&&cohost&&route.state==='SAFE';
 const output={schema:SUPERSESSION_SCHEMA,system_state:systemState,system_progress_allowed:systemProgressAllowed,common_roots:{cohost:COMMON_COHOST_SHA,closure:CLOSURE_PROFILE_SHA,native:NATIVE_TRANSCRIPT_SHA},bootstrap_conformance:bootstrap,relation_axis:relation,route_conformance:route.state,route_allows_next_turn:route.allow_next_turn===true,capability_axis:capabilityAxis,product_axis:productAxis,external_native_host_gap:externalNativeGap,native_host_capability_created:false,cohost_relation_requires_route_conformance:false,native_actor_requires_full_runtime:false,native_actor_requires_control_ownership:false,new_lifecycle:false,new_planner:false,new_retry_memory_owner:false,new_state_writer:false,new_truth_owner:false,new_turn_engine:false,authority:0};
 return{...output,receipt_sha256:supersystemDigest(output)};
}
