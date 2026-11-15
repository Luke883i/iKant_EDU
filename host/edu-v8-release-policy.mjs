/** Necessary, never sufficient, host-claim policy lattice. This pure checker
 * does NOT authenticate source/provider/human consent by receiving caller flags.
 * Only the runtime wrapper may project positive text after original C87 readback.
 */
import {isProxy} from 'node:util/types';
import {PIN} from './c107-carrier-consumer.mjs';
import {C124_SOURCE_EPOCH} from './c124-source-overlay.mjs';
export const V8_CLAIM_FIELDS=Object.freeze([
 'source_staged_exact','consent_original_c72','consent_separate_cohost',
 'input_sha256_bound','original_c70_before_language','c70_plan_ack_match',
 'c114_guard_completed','pr119_owner_host_bound','single_c87_writer',
 'c87_independent_readback','readback_nonce_same','readback_voice_exact',
 'readback_c70_same','event_count_increment_one','turn_exclusive',
 'not_active','no_native_claim','no_provider_claim'
]);
const constant=x=>Object.freeze(x);
const blocked=reason=>constant({schema:'ikant-edu-v8-host-claim-policy/v1',eligible:false,
 status:'POLICY_ONLY_NOT_PROVENANCE',origin:'NO_VOICE',reason,
 active:false,native_origin_attested:false,provider_origin_attested:false});
export function qualifyV8HostClaim(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||isProxy(input))return blocked('V8_BAD_ENVELOPE');
 try{
  if(Object.getPrototypeOf(input)!==Object.prototype&&Object.getPrototypeOf(input)!==null)return blocked('V8_BAD_ENVELOPE');
  const descriptors=Object.getOwnPropertyDescriptors(input);
  const keys=Reflect.ownKeys(descriptors);
  const expected=['schema','source_head','carrier_sha256','language_origin',...V8_CLAIM_FIELDS];
  if(keys.length!==expected.length||!expected.every(k=>Object.hasOwn(descriptors,k)&&Object.hasOwn(descriptors[k],'value'))||
   keys.some(k=>typeof k!=='string'||!expected.includes(k)))return blocked('V8_UNKNOWN_OR_ACCESSOR_FIELDS');
  if(input.schema!=='ikant-edu-v8-host-evidence/v1'||![PIN.head,C124_SOURCE_EPOCH].includes(input.source_head)||
   input.carrier_sha256!==PIN.carrier_sha256||input.language_origin!=='HOST_BOUND')
   return blocked('V8_SOURCE_OR_ORIGIN_MISMATCH');
  for(const k of V8_CLAIM_FIELDS)if(input[k]!==true)return blocked('V8_MISSING_'+k.toUpperCase());
  return constant({schema:'ikant-edu-v8-host-claim-policy/v1',eligible:true,
   status:'POLICY_ONLY_NOT_PROVENANCE',origin:'HOST_BOUND',
   allowed_label:'iKant EXPERIMENTAL | testo host guidato da C70, vincolato e riaperto',
   interpretation:'Necessary evidence shape; actual owner receipts, human gates and local readback must be independently verified.',
   active:false,native_origin_attested:false,provider_origin_attested:false});
 }catch{return blocked('V8_BAD_ENVELOPE')}
}
