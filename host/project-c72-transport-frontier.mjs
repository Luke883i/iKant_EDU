/** HOST-only transport-selection advisory (authority=0). This code installs
 * no bridge, mode, consent, receipt, owner, UI or persistent worker. */
export const C72_TRANSPORT_ORDER=Object.freeze(['CALLBACKS','NODE_HTTPS','HOST_PACKET','HOST_FILE']);
const STATES=new Set(['OBSERVED','CALLABLE_UNTESTED','UNAVAILABLE_VERIFIED','UNKNOWN']);
// Normative dimensions for a bounded model, NOT measured latency or cost.
// [Host blob copies, sequential effects, external dependency burden].
export const C72_MODEL_COSTS=Object.freeze({CALLBACKS:[0,2,0],NODE_HTTPS:[0,1,1],
 HOST_PACKET:[1,2,0],HOST_FILE:[10,10,0]});
const dominates=(a,b)=>a.every((v,i)=>v<=b[i])&&a.some((v,i)=>v<b[i]);
export function c72ParetoFrontier(carriers={}){
 const available=C72_TRANSPORT_ORDER.filter(n=>carriers[n]==='OBSERVED');
 return available.filter(n=>!available.some(other=>other!==n&&
   dominates(C72_MODEL_COSTS[other],C72_MODEL_COSTS[n])));
}
const SHA=/^[a-f0-9]{40}$/u;
const stop=edge=>Object.freeze({kind:'STOP',action:'STOP',edge,authority:0,owner_invoked:false,active:false});
const pending=(action,carrier,edge)=>Object.freeze({kind:'PROBE',action,carrier,edge,authority:0,owner_invoked:false,active:false});
const ACTIONS=Object.freeze({
 CALLBACKS:'BIND_CALLBACKS_THEN_RUN_ORIGINAL_C72',
 NODE_HTTPS:'FETCH_PINNED_NODE_HTTPS_THEN_RUN_ORIGINAL_C72',
 HOST_PACKET:'TRANSFER_EIGHT_SOURCE_PACKET_THEN_RUN_ORIGINAL_COLD_SEED',
 HOST_FILE:'STAGE_EIGHT_PRIVATE_FILES_THEN_RUN_ORIGINAL_COLD_SEED'
});
const chosen=(carrier)=>Object.freeze({kind:'EXECUTE',action:ACTIONS[carrier],carrier,
 required:'REOPEN_PINNED_SOURCE_AND_VERIFIED_ORIGINAL_OWNER_RECEIPT_AND_FULL_INTRODUCTION',
 authority:0,owner_invoked:false,active:false});
/** Bounded first-best policy, never a guarantee of platform capability.
 * OBSERVED = a real, validated, callable physical carrier in THIS Host.
 * CALLABLE_UNTESTED => only a non-owner probe, never an owner call. */
export function chooseC72HostTransport(input={}){
 const q=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 if(q.phase!=='POST_ACCEPT')return stop('C72_TRANSPORT_WRONG_PHASE');
 if(q.humanMessage!=='I ACCEPT'||q.freshHumanTurn!==true)return stop('C72_EXACT_NEW_CONSENT_REQUIRED');
 if(q.ownerOutcome!=='NOT_INVOKED')return stop('C72_OWNER_OUTCOME_UNKNOWN_NO_REPLAY');
 if(!SHA.test(q.sourceHead||'')||q.liveHead!==q.sourceHead)return stop('STOP_SOURCE_LOCK_STALE');
 if(q.firstTurnWitnessVerified!==true)return stop('C72_FIRST_TURN_WITNESS_UNVERIFIED');
 if(q.node!=='AVAILABLE')return stop('C72_NODE_NOT_ATTESTED');
 const carriers=q.carriers;
 if(!carriers||typeof carriers!=='object'||Array.isArray(carriers)||
    C72_TRANSPORT_ORDER.some(c=>!STATES.has(carriers[c])))
  return stop('C72_CARRIER_EVIDENCE_INVALID');
 // Require actually observed independent GitHub transport when Node HTTPS
 // is not the selected carrier. Neither API nor Node presence is a bridge.
 const available=C72_TRANSPORT_ORDER.filter(c=>carriers[c]==='OBSERVED'&&
   (c==='NODE_HTTPS'||q.githubApi==='AVAILABLE'));
 if(available.length){
  const frontier=c72ParetoFrontier(Object.fromEntries(available.map(n=>[n,'OBSERVED'])));
  return chosen(frontier[0]);
 }
 const possibilities=C72_TRANSPORT_ORDER.filter(c=>carriers[c]==='CALLABLE_UNTESTED'&&
   (c==='NODE_HTTPS'||q.githubApi==='AVAILABLE'));
 if(possibilities.length)return pending('PROBE_PHYSICAL_'+possibilities[0],possibilities[0],
  'C72_TRANSFER_UNVERIFIED_NO_OWNER');
 return stop('C72_SOURCE_BRIDGE_UNBOUND');
}
/** Read-only policy after a separate original EDU selection; the manual ZIP
 * cannot be used to mint acceptance, select EDU, or bypass source validation. */
export function chooseEDUSourceTransport(input={}){
 const q=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 if(q.phase!=='POST_EDU'||q.originalEduSelectionVerified!==true||
    !SHA.test(q.sourceHead||'')||q.liveHead!==q.sourceHead)
  return stop('EDU_ORIGINAL_SELECTION_AND_HEAD_REQUIRED');
 if(q.node!=='AVAILABLE')return stop('EDU_NODE_NOT_ATTESTED');
 if(q.source==='FULL_VERIFIED')return Object.freeze({kind:'EXECUTE',
   action:'START_ORIGINAL_C135_WITH_SAME_INSTANCE_READBACK',authority:0,
   owner_invoked:false,active:false});
 if(q.source==='SOURCE_UNKNOWN')return pending('VERIFY_SOURCE','SOURCE','EDU_SOURCE_NOT_OBSERVED');
 if(!['ABSENT','PARTIAL'].includes(q.source))return stop('EDU_SOURCE_EVIDENCE_INVALID');
 if(q.manualRoute==='EXPLICIT_MANUAL_POST_EDU')
  return Object.freeze({kind:'HUMAN_GATE',action:'REQUEST_ORIGINAL_PINNED_ZIP',
   source_zip_url:'https://github.com/Luke883i/iKant_EDU/archive/'+q.sourceHead+'.zip',
   require:'INDEPENDENT_TREE_BLOB_EXTRACTION_AND_ORIGINAL_LOADER',authority:0,
   owner_invoked:false,active:false});
 if(q.hostBridge==='OBSERVED')return pending('MATERIALIZE_AND_REOPEN_SOURCE','SOURCE',
   'EDU_POSTMODE_SOURCE_TRANSFER_REQUIRED');
 return stop('EDU_NO_VERIFIED_SOURCE_ROUTE');
}
