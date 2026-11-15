// Host-owned NEGATIVE observer for the two-object Project baseline.
// This module cannot activate iKant, run C72, issue Terms, generate Surface A,
// attest native events or grant project-instruction compliance.
import {createHash} from 'node:crypto';
const H40=/^[a-f0-9]{40}$/;
const ownerEdges=Object.freeze([
 'EXACT_FROZEN_SOURCE_READBACK',
 'C72_REAL_TERMS_AND_CONSENT',
 'REAL_CURRENT_MESSAGE_INGRESS',
 'C77_VERIFIED_BYTES_IN_NODE',
 'C81_C84_OR_C59_OWNER_EXECUTION',
 'SAME_INPUT_OWNER_READBACK',
 'NATIVE_CHAT_DELIVERY'
]);
const safeHas=(x,k)=>Object.hasOwn(x,k) &&
  Object.getOwnPropertyDescriptor(x,k)?.get===undefined &&
  Object.getOwnPropertyDescriptor(x,k)?.set===undefined;
const stopped=(edge,head=null)=>Object.freeze({
 schema:'ikant-le-c98-project-observation/v1',
 status:'C98_DIAGNOSTIC_ONLY',source_head:head,
 first_unclosed_edge:edge,
 surface_a_exact_utf8:null,owner_executed:false,
 host_installed_attested:false,active:false,
 native_chat_delivery_attested:false,inter_turn_persistence_attested:false,
 authority:0
});
// Explicitly not a runtime dispatcher. Never takes text from a model as proof.
export function observeC98ProjectCapabilities(facts){
 if(!facts||Object.getPrototypeOf(facts)!==Object.prototype||
    Reflect.ownKeys(facts).some(k=>typeof k!=='string')||
    !['sourceHead','callableGithubConnector','termsBytesActuallyRead','nodeOwnerActuallyCallable']
      .every(k=>safeHas(facts,k)))
   return stopped('PROJECT_HOST_CAPABILITY_DATA_UNVERIFIED');
 const keys=Object.keys(facts).sort().join(',');
 if(keys!=='callableGithubConnector,nodeOwnerActuallyCallable,sourceHead,termsBytesActuallyRead')
   return stopped('PROJECT_HOST_CAPABILITY_DATA_UNVERIFIED');
 if(typeof facts.callableGithubConnector!=='boolean'||
    typeof facts.termsBytesActuallyRead!=='boolean'||
    typeof facts.nodeOwnerActuallyCallable!=='boolean')
   return stopped('PROJECT_HOST_CAPABILITY_DATA_UNVERIFIED');
 const head=H40.test(facts.sourceHead)?facts.sourceHead:null;
 if(!facts.callableGithubConnector)return stopped('ACTUALLY_CALLABLE_GITHUB_CONNECTOR',head);
 if(!head)return stopped('FROZEN_GITHUB_HEAD_READBACK');
 if(!facts.termsBytesActuallyRead)return stopped('FIVE_SOURCE_FILES_AND_FULL_TERMS_READBACK',head);
 if(!facts.nodeOwnerActuallyCallable)return stopped('CURRENT_HUMAN_INPUT_TO_REAL_SOURCE_BOUND_NODE_OWNER',head);
 // Even if all caller flags claim success, this observer lacks actual owner bytes.
 return stopped('SAME_INPUT_C81_C84_OR_C59_OWNER_READBACK',head);
}
export const c98ProjectBoundaryFingerprint=()=>createHash('sha256')
 .update(ownerEdges.join('\n')).digest('hex');
export {ownerEdges};
