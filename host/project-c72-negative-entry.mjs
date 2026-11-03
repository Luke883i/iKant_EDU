/** R3: denial-only before physical C72 transport. No owner or receipt. */
import {isProxy} from 'node:util/types';
const SHA=/^[0-9a-f]{40}$/u;
const FILES=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const plain=x=>{try{return x!==null&&typeof x==='object'&&!Array.isArray(x)&&!isProxy(x)&&
 Object.getPrototypeOf(x)===Object.prototype&&Reflect.ownKeys(x).every(k=>typeof k==='string'&&
 Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'))}catch{return false}};
const stop=edge=>Object.freeze({disposition:'STOP',first_edge:edge,permission_granted:false,
 owner_receipt_issued:false,authority:0});
const pass=()=>Object.freeze({disposition:'PASS_TO_ORIGINAL_CHECK',first_edge:null,
 permission_granted:false,owner_receipt_issued:false,authority:0});
export function screenC72HostIngress(q={}){
 if(!plain(q))return stop('R3_INPUT_INVALID');
 const w=q.priorTurnEvidence;
 if(!plain(w)||!plain(w.pinned_blob_shas))return stop('R3_INPUT_INVALID');
 if(q.humanMessage!=='I ACCEPT'||q.freshHumanTurn!==true||q.ownerOutcome!=='NOT_INVOKED'||
    !SHA.test(w.source_head||'')||w.host_link_displayed!==true||
    w.distinct_human_message_observed!==true||
    w.terms_link!=='https://github.com/Luke883i/iKant_EDU/blob/'+w.source_head+'/TERMS.md'||
    !FILES.every(p=>SHA.test(w.pinned_blob_shas[p]||''))||
    !['NODE_GITHUB_API','HOST_CALLBACKS','HOST_SOURCE_PACKET'].includes(q.carrier))
   return stop('R3_C72_FIRST_TURN_OR_CARRIER_UNVERIFIED');
 const n=q.networkObservation;
 if(n!==undefined&&n!==null){
  if(!plain(n)||(n.nodeDns!==undefined&&!plain(n.nodeDns)))return stop('R3_NETWORK_EVIDENCE_INVALID');
  const d=n.nodeDns;
  if(q.carrier==='NODE_GITHUB_API'&&d?.status==='FAILED_OBSERVED'&&
    d.host==='api.github.com'&&typeof d.epoch==='string'&&d.epoch.length>0&&
    d.epoch===n.runtimeEpoch&&n.networkChangedObserved!==true)
   return stop('R3_SAME_EPOCH_NODE_DNS_REPROBE_DENIED');
 }
 return pass();
}
