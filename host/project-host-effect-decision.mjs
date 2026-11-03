/** K0 / Host WHAT-HOW decision. Pure pre-effect planner; authority=0.
 * It DOES NOT invoke probes, GitHub, E16, H1, C72, C87 or C135.
 * It never treats booleans, digest fields or host narration as physical receipts.
 * The K1 deployment runner owns physical binding/probe/independent readback.
 */
import {isProxy} from 'node:util/types';
export const K0_SCHEMA = 'ikant-host-what-how-effect/v2';
export const FIRST_FILES=Object.freeze(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
export const CARRIER_ORDER=Object.freeze(['SAME_NODE_CALLBACKS','NODE_GITHUB_HTTPS','HOST_PACKET','HOST_FILE']);
const SHA=/^[a-f0-9]{40}$/u;
const ROUTES=Object.freeze({
 SAME_NODE_CALLBACKS:'host/project-edu-h1-bound-port.mjs#runH1OriginalAdmission',
 NODE_GITHUB_HTTPS:'host/project-edu-h1-bound-port.mjs#runH1OriginalAdmission',
 HOST_PACKET:'host/project-c72-e16-unified-ingress.mjs#runC72ProjectE16Ingress',
 HOST_FILE:'host/project-c72-e16-unified-ingress.mjs#runC72ProjectE16Ingress'
});
const plain=x=>{try{return x!==null&&typeof x==='object'&&!Array.isArray(x)&&!isProxy(x)&&Object.getPrototypeOf(x)===Object.prototype&&Reflect.ownKeys(x).every(k=>typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));}catch{return false;}};
const base=()=>({schema:K0_SCHEMA,authority:0,active:false,original_owner_invoked:false,
 native_event_attested:false,native_delivery_attested:false,source_origin_attested:false,
 deployment_attested:false,voice:'NO_VOICE'});
const stop=edge=>Object.freeze({...base(),kind:'STOP',first_edge:edge});
const plan=(kind,fields={})=>Object.freeze({...base(),kind,...fields});
function witnessOK(w,head){
 if(!plain(w)||!plain(w.pinned_blob_shas)||w.source_head!==head||
 !SHA.test(w.source_head||'')||w.host_link_displayed!==true||
 w.distinct_human_message_observed!==true||
 w.terms_link!=='https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md')return false;
 return Reflect.ownKeys(w.pinned_blob_shas).length===5&&FIRST_FILES.every(p=>SHA.test(w.pinned_blob_shas[p]||''));
}
function shapeOK(q){
 return plain(q)&&q.schema===K0_SCHEMA&&typeof q.phase==='string'&&
 (q.projectProfile===undefined||q.projectProfile==='PROJECT_EDU_E15')&&
 (q.engineeringHead===undefined||SHA.test(q.engineeringHead||''));
}
/** K0 only tests that functions are bound. Caller-provided OBSERVED and
 * probeOK flags have no value. No function is executed by this planner. */
function callable(d){return plain(d)&&typeof d.probe==='function'&&typeof d.invoke==='function';}
/** This is an ABI proposal for the future K1 Host-installed binding.
 * Never expose PROBE_REQUIRED as READY/ACCEPTED/ACTIVE or as an owner receipt.
 * E16 packet/file normalization stays with the original E16 owner path. */
export function decideK0Effect(q,bindings={}){
 if(!shapeOK(q))return stop('K0_REQUEST_INVALID');
 if(q.phase==='ORIENTATION'){
  if(q.firstHumanTurn!==true)return stop('K0_FIRST_CONTACT_REQUIRED');
  return plan('ORIENTATION_PLAN',{action:'READ_ONLY_HEAD_AND_FIVE_PINNED_FILES',
    ordered_paths:FIRST_FILES,preaccept_tree_allowed:false});
 }
 if(q.phase==='ENGINEERING')return plan('ENGINEERING_ONLY',{action:'NO_IKANT_RUNTIME_EFFECT'});
 if(q.phase==='AWAIT_MODE')return plan('WAIT_ORIGINAL_MODE',{action:'WAIT_NEW_DISTINCT_EXACT_EDU_OR_CANONICAL',
   original_owner:'host/c72-public-mode-admission.mjs#selectC72V2Mode',required_receipt:'ORIGINAL_C72_ACCEPTED_AND_INTRODUCTION'});
 if(['POST_EDU','EDU_TURN','EXIT_PENDING'].includes(q.phase))
  return plan('DEFER_TO_ORIGINAL_OWNER',{action:'K0_NOT_AUTHORIZED_TO_DISPATCH_DOWNSTREAM'});
 if(q.phase!=='POST_ACCEPT')return stop('K0_PHASE_INVALID');
 if(q.projectProfile!=='PROJECT_EDU_E15')return stop('K0_PROJECT_PROFILE_REQUIRED');
 if(q.humanMessage!=='I ACCEPT'||q.freshHumanTurn!==true)return stop('C72_EXACT_NEW_CONSENT_REQUIRED');
 if(q.ownerOutcome!=='NOT_INVOKED')return stop('C72_OWNER_OUTCOME_UNKNOWN_NO_REPLAY');
 if(!SHA.test(q.sourceHead||'')||q.liveHead!==q.sourceHead)return stop('STOP_SOURCE_LOCK_STALE');
 if(!witnessOK(q.priorTurnEvidence,q.sourceHead))return stop('K0_FIRST_TURN_WITNESS_INVALID');
 // Incompatible or unknown callability never authorizes an owner call.
 if(!plain(bindings))return stop('K0_CAPABILITY_PORT_UNBOUND');
 const offered=CARRIER_ORDER.filter(k=>callable(bindings[k]));
 if(q.requestedCarrier!==undefined&&!CARRIER_ORDER.includes(q.requestedCarrier))
   return stop('K0_CARRIER_INVALID');
 if(q.requestedCarrier!==undefined&&!offered.includes(q.requestedCarrier))
   return stop('K0_REQUESTED_CARRIER_UNBOUND');
 if(offered.length===0)return stop('K0_CAPABILITY_PORT_UNBOUND');
 const carrier=q.requestedCarrier??offered[0];
 return plan('PROBE_REQUIRED',{carrier,action:'K1_PHYSICAL_NONOWNER_PROBE_THEN_ORIGINAL_ROUTE',
   route:ROUTES[carrier],source_head:q.sourceHead,
   required_physical_evidence:Object.freeze(['SAME_TARGET_CALLABILITY','INDEPENDENT_BYTE_READBACK',
      'GIT_HEAD_TREE_PATH_BLOB','E16_8_PLUS_1_AND_SEED','ORIGINAL_OWNER_OUTCOME']),
   fallback_after_owner_unknown:false,capability_epoch:'UNATTESTED_BY_K0'});
}
export function k0SafePlan(q,bindings={}){
 try{return decideK0Effect(q,bindings);}catch{return stop('K0_INPUT_EVALUATION_FAILED');}
}
