/** Pure counterfactual state projection, not a canonical or EDU runtime owner.
 * An object with ownerIssued=true is a caller assertion, never proof of an issuer.
 */
import {isProxy} from 'node:util/types';
const own=o=>o&&typeof o==='object'&&!Array.isArray(o)&&!isProxy(o)&&
 (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null)&&
 Reflect.ownKeys(o).every(k=>typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptors(o)[k],'value'));
const bad=reason=>Object.freeze({ok:false,action:'STOP',reason,active:false,authority:0});
export function projectC130Ingress(input={}){
 if(!own(input))return bad('UNTRUSTED_PROJECTION_INPUT');
 const {mode,termsAccepted=false,modeSelected=false,nativeEligible=false,
  attempts=[],attemptLimit=3}=input;
 if(!termsAccepted||!modeSelected)return bad('COMMON_ADMISSION_PENDING');
 if(mode==='EXPERIMENTAL')return Object.freeze({ok:true,action:'REQUEST_ONE_MANUAL_PACKAGE',
  attemptsAllowed:0,active:false,canonical:false,proposal_only:true,authority:0});
 if(mode!=='CANONICAL'||attemptLimit!==3||!Array.isArray(attempts)||isProxy(attempts)||attempts.length>3)
  return bad('INVALID_CANONICAL_PROJECTION');
 if(!nativeEligible)return bad('NATIVE_MESSAGE_HOOK_NOT_PROVED');
 const seen=new Set();
 for(const a of attempts){
  if(!own(a)||typeof a.channel!=='string'||!/^[A-Z_]{3,64}$/.test(a.channel)||seen.has(a.channel)||
    a.ownerIssued!==true||!['REAL_FAILURE','SUCCESS','INTEGRITY_MISMATCH','UNKNOWN'].includes(a.result))
   return bad('INVALID_OR_DUPLICATE_OWNER_RECEIPT');
  seen.add(a.channel);
 }
 if(attempts.some(a=>a.result==='INTEGRITY_MISMATCH'))return bad('INTEGRITY_HALT_NO_FALLBACK');
 if(attempts.some(a=>a.result==='UNKNOWN'))return bad('UNKNOWN_RECONCILE_NO_FALLBACK');
 if(attempts.some(a=>a.result==='SUCCESS'))return Object.freeze({ok:true,action:'DELEGATE_TO_C59_OWNER_NOT_ACTIVE',
  active:false,canonical:false,proposal_only:true,owner_receipts_authenticated:false,authority:0});
 if(attempts.length===3)return Object.freeze({ok:true,action:'OWNER_MAY_OFFER_MANUAL_FALLBACK',
  active:false,canonical:false,proposal_only:true,owner_receipts_authenticated:false,authority:0});
 return Object.freeze({ok:true,action:'OWNER_MAY_PROBE_NEXT_DISTINCT_CHANNEL',
  remaining:3-attempts.length,active:false,canonical:false,proposal_only:true,authority:0});
}
