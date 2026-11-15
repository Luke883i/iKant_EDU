/** EDU V9: read-only host route projection. NOT a dispatcher, owner, writer or consent oracle.
 * The caller must supply witnessed phase facts; flags do not authenticate provenance.
 * Original C72/C107/PR119/C87 remain the only execution owners. */
import {isProxy} from 'node:util/types';
export const V9_FACTS=Object.freeze([
 'index_verified','terms_presented','common_accept_observed','experimental_selected',
 'separate_draft_optin_observed','carrier_local_verified','machine_bridge_available',
 'machine_attempts_exhausted','pr118_pr119_materialized','guided_owner_executed',
 'independent_c87_readback'
]);
const make=(next,edge,phase)=>Object.freeze({schema:'ikant-edu-v9-host-route/v1',
 status:'PROJECTION_ONLY_NOT_OWNER_RECEIPT',phase,next,first_edge:edge,
 surface_a:'NO_VOICE_UNTIL_OWNER_READBACK',native_chat_hook_attested:false,
 authority:0,claims_authenticated:false});
export function projectV9MinimalNext(facts){
 try{
  if(!facts||typeof facts!=='object'||Array.isArray(facts)||isProxy(facts))return make('STOP','UNTRUSTED_FACTS','INVALID');
  if(Object.getPrototypeOf(facts)!==Object.prototype&&Object.getPrototypeOf(facts)!==null)return make('STOP','UNTRUSTED_FACTS','INVALID');
  const ds=Object.getOwnPropertyDescriptors(facts),ks=Reflect.ownKeys(ds);
  if(ks.length!==V9_FACTS.length||ks.some(k=>typeof k!=='string'||!V9_FACTS.includes(k)||!Object.hasOwn(ds[k],'value')||typeof ds[k].value!=='boolean'))
   return make('STOP','UNTRUSTED_FACTS','INVALID');
  const f=Object.fromEntries(V9_FACTS.map(k=>[k,ds[k].value]));
  if(!f.index_verified)return make('VERIFY_HOST_INDEX_THEN_STOP','HOST_INDEX_UNVERIFIED','INDEX');
  if(!f.terms_presented)return make('PIN_AND_PRESENT_TERMS_THEN_STOP','ORIGINAL_TERMS_NOT_PRESENTED','ADMISSION');
  if(!f.common_accept_observed)return make('AWAIT_EXACT_I_ACCEPT','COMMON_ACCEPT_UNOBSERVED','ADMISSION');
  if(!f.experimental_selected)return make('AWAIT_EXACT_MODE','EXPERIMENTAL_NOT_SELECTED','MODE');
  if(!f.separate_draft_optin_observed)return make('AWAIT_SEPARATE_DRAFT_OPTIN','HOST_DRAFT_OPTIN_UNOBSERVED','OPTIN');
  if(!f.carrier_local_verified){
   if(f.machine_bridge_available)return make('VERIFY_AND_STAGE_EXISTING_C107_BYTES','C107_NOT_MATERIALIZED','TRANSPORT');
   if(!f.machine_attempts_exhausted)return make('PROBE_ONE_OWNER_ALLOWED_MACHINE_BRIDGE','MACHINE_TRANSFER_UNRESOLVED','TRANSPORT');
   return make('MANUAL_SOURCE_HANDOFF_LAST_RESORT','ALL_PROVEN_MACHINE_BRIDGES_EXHAUSTED','TRANSPORT');
  }
  if(!f.pr118_pr119_materialized)return make('MATERIALIZE_PINNED_PR118_PR119_MODULES','GUIDED_WRAPPER_NOT_AVAILABLE','ADAPTER');
  if(!f.guided_owner_executed)return make('RUN_ONLY_PR119_GUIDED_OWNER','PR119_GUIDED_TURN_NOT_EXECUTED','EXECUTION');
  if(!f.independent_c87_readback)return make('RECONCILE_C87_WITHOUT_BLIND_RETRY','INDEPENDENT_C87_READBACK_MISSING','READBACK');
  return make('PRESENT_OWNER_VOICE_BYTES_UNCHANGED','NATIVE_CHATGPT_PER_TURN_DISPATCH_NOT_ATTESTED','PRESENTATION');
 }catch{return make('STOP','UNTRUSTED_FACTS','INVALID')}
}
