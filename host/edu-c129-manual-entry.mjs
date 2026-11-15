/** C129 EDU operator entry: exact local manual source, no machine transport selection.
 * This is a constrained frontend over the ORIGINAL C127 -> PR119 -> C87 -> C125
 * owners. It cannot attest human identity, native ChatGPT ingress or ACTIVE.
 * The prior C125 factory remains compatibility-only for callers that need it.
 */
import {isProxy} from 'node:util/types';
import {loadC127SourceCache} from './edu-c127-source-transport.mjs';
import {createC125ShellSession} from './edu-c125-shell-session.mjs';
import {presentC131ManualSessionCard} from './c131-operator-surface.mjs';
import {createC133ShadowLanguagePort} from './c133-shadow-language-port.mjs';
import {createC135CognitiveSession} from './c135-cognitive-edu-owner.mjs';

const blocked=edge=>Object.freeze({ok:false,mode:'EXPERIMENTAL',runtime_ready:false,
 first_edge:edge,next:'MANUAL_EXACT_SOURCE_HANDOFF',native_ui_exclusive:false,
 provider_origin_attested:false,active:false,authority:0});
const own=o=>o&&typeof o==='object'&&!isProxy(o)&&!Array.isArray(o)&&
 (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null)&&
 Reflect.ownKeys(o).every(k=>typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptors(o)[k],'value'));

/** Do not accept host-carrier alternatives, callbacks that fetch bytes, or unverified paths. */
export async function createC129ManualEduSession(args={}){
 if(!own(args))return blocked('C129_UNSAFE_ENTRY_ENVELOPE');
 const expected=['afterAcceptWitness','languagePort','manualCachePath','privateParent','send','cognitiveEpoch'];
 const keys=Object.keys(args);
 if(keys.some(k=>!expected.includes(k)))return blocked('C129_UNEXPECTED_OR_MACHINE_TRANSPORT');
 const {manualCachePath,privateParent,languagePort,send,afterAcceptWitness,cognitiveEpoch=null}=args;
 if(cognitiveEpoch!==null&&cognitiveEpoch!=='C134_COMPOSITE')return blocked('C135_EPOCH_SELECTION_INVALID');
 if(!own(afterAcceptWitness)||Object.keys(afterAcceptWitness).sort().join(',')!=='accepted,scope'||
  afterAcceptWitness.accepted!==true||afterAcceptWitness.scope!=='HOST_WITNESSED_ONLY')
  return blocked('C129_POST_ACCEPT_HOST_WITNESS_REQUIRED');
 if(typeof manualCachePath!=='string'||!manualCachePath.startsWith('/')||
  typeof privateParent!=='string'||!privateParent.startsWith('/')||
  typeof languagePort!=='function'||typeof send!=='function')return blocked('C129_MANUAL_INPUT_REQUIRED');
 // Read original C127 from one O_NOFOLLOW inode twice, verify canonical UTF-8,
 // exact C107 bytes and C124 three Git blobs. No attempt at a network fallback.
 const checked=loadC127SourceCache(manualCachePath);
 if(!checked.ok)return blocked(checked.first_edge);
 // Pass only the bytes captured by the verified held inode. Do not reopen a
 // user-mutable path between validation and C125 staging.
 if(cognitiveEpoch==='C134_COMPOSITE'){
  // One public manual entry: new epoch is an explicit experimental choice.
  // The capture is passed directly, never reopened from a mutable path.
  const v=await createC135CognitiveSession({sourceCapture:checked,privateParent,
   languagePort,send,afterAcceptWitness});
  if(!v.ok||!v.runtime_ready){v.close?.();return blocked(v.first_edge||'C135_SOURCE_NOT_READY');}
  return Object.freeze({ok:true,mode:'EXPERIMENTAL',manual_only:true,runtime_ready:true,
   source_head:v.source_head,source_kind:v.source_kind,cognitive_epoch:'C134_COMPOSITE',
   cache_sha256:checked.cache_sha256,single_inode_readback_verified:true,
   machine_transport_attempts:0,active:false,authority:0,native_ui_exclusive:false,
   provider_origin_attested:false,publishTurn:v.publishTurn,
   close:v.close,status:v.status,
   operatorCard:()=>presentC131ManualSessionCard(v.status)});
 }

 const session=await createC125ShellSession({carrierBytes:checked.carrierBytes,
  c124OverlayBytes:checked.c124OverlayBytes,privateParent,
  languagePort:createC133ShadowLanguagePort(languagePort),send,afterAcceptWitness});
 if(!session.ok||!session.runtime_ready){session.close?.();return blocked(session.initial_edge||session.first_edge||'C129_OWNER_NOT_READY');}
 return Object.freeze({ok:true,mode:'EXPERIMENTAL',manual_only:true,runtime_ready:true,
  source_head:checked.source_head,cache_sha256:checked.cache_sha256,
  single_inode_readback_verified:checked.single_inode_readback_verified===true,
  machine_transport_attempts:0,native_ui_exclusive:false,provider_origin_attested:false,
  active:false,authority:0,publishTurn:session.publishTurn,
  publishStatus:session.publishStatus,close:session.close,status:session.status,
  operatorCard:()=>presentC131ManualSessionCard(session.status)});
}

/** Public EDU/v2 entry. This is NOT the C127/C134 historical manual-cache
 * entry above. No path can mint a C72/v1 experimental receipt.
 */
export async function createC129PublicEduV2Session(args={}){
 const {createS02EduV2Session}=await import('./s02-edu-versioned-consumer.mjs');
 return createS02EduV2Session(args);
}
