/** S02 pre-PR admission-to-runtime boundary. Authority ZERO.
 * Public EDU/v2 is not a C72/v1 EXPERIMENTAL owner receipt. A historical
 * C127/C134 cache is not the currently pinned repository main.
 * Until the original C107/C135 consumer can validate EDU/v2 against its
 * rebuilt immutable source epoch, this module MUST NOT dispatch a turn.
 */
import {validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';
import {isProxy} from 'node:util/types';
const H40=/^[a-f0-9]{40}$/;
const stop=(edge)=>Object.freeze({schema:'ikant-le-s02-edu-bridge/v1',ok:false,mode:'EDU',status:'BLOCKED',
 first_edge:edge,dispatch_authorized:false,owner_receipt:null,writer_invocations:0,
 native_origin_attested:false,active:false,authority:0,next:'STOP'});
export function qualifyS02EduIngress({selection,sourceHead,cacheEpoch}={}){
 if(!validateC72V2ModeSelection(selection,{mode:'EDU'}))return stop('S02_C72_V2_SELECTION_UNVERIFIED');
 if(typeof sourceHead!=='string'||!H40.test(sourceHead)||selection.source_head!==sourceHead)
  return stop('S02_CURRENT_SOURCE_HEAD_NOT_BOUND');
 if(typeof cacheEpoch!=='string'||!H40.test(cacheEpoch))return stop('S02_CACHE_EPOCH_UNVERIFIED');
 if(cacheEpoch!==sourceHead)return stop('S02_HISTORIC_CACHE_SOURCE_EPOCH_MISMATCH');
 return stop('S02_C107_CONSUMER_REQUIRES_GENUINE_EDU_V2_OWNER');
}
/** A caller cannot provide a fake original owner or a legacy receipt fallback. */
export function dispatchS02EduTurn(args={}){
 if(!args||typeof args!=='object'||isProxy(args)||Array.isArray(args)||
    Object.getPrototypeOf(args)!==Object.prototype||
    Reflect.ownKeys(args).some(k=>!['selection','sourceHead','cacheEpoch','nonce'].includes(k)))
  return stop('S02_UNSAFE_OR_UNEXPECTED_DISPATCH_ENVELOPE');
 if(typeof args.nonce!=='string'||!/^[A-Za-z0-9_-]{12,96}$/.test(args.nonce))
  return stop('S02_INVALID_NONCE');
 return qualifyS02EduIngress(args);
}

/** NEW public v2 route. The sync v1 guard above stays deny-only for legacy
 * cache envelopes; this function alone delegates to the original owner.
 */
export async function createS02EduV2Session(args={}){
 if(!args||typeof args!=='object'||isProxy(args)||Array.isArray(args)||
    Object.getPrototypeOf(args)!==Object.prototype||
    Reflect.ownKeys(args).some(k=>typeof k!=='string'||
     !['selection','sourceRoot','privateParent','languagePort','send','afterAcceptWitness'].includes(k)||
     !Object.hasOwn(Object.getOwnPropertyDescriptor(args,k),'value')))
  return stop('S02_V2_SESSION_ENVELOPE_INVALID');
 const {createC135EduV2Session}=await import('./c135-edu-v2-owner.mjs');
 return createC135EduV2Session(args);
}
