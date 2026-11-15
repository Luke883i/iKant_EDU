/** C131: release *eligibility* projection only; caller flags cannot authenticate GitHub. */
import {isProxy} from 'node:util/types';
const sha40=/^[0-9a-f]{40}$/;
const sha64=/^[0-9a-f]{64}$/;
const error=edge=>Object.freeze({ok:false,eligible:false,first_edge:edge,
 source_authentication:'CALLER_ATTESTED_ONLY',published:false,active:false,authority:0});
const own=o=>o&&typeof o==='object'&&!Array.isArray(o)&&!isProxy(o)&&
 (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null)&&
 Reflect.ownKeys(o).every(k=>typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptors(o)[k],'value'));
export function qualifyC131ReleaseCandidate(o={}){
 if(!own(o)||Reflect.ownKeys(o).some(k=>!['branch','sourceCommit','promptCommit','bundleCommit','bundleSha256','manifestVerified','testsPassed','ownerIdentityVerified'].includes(k)))
  return error('UNTRUSTED_SOURCE_INPUT');
 const d=Object.getOwnPropertyDescriptors(o),get=k=>Object.hasOwn(d[k]||{},'value')?d[k].value:undefined;
 const branch=get('branch'),head=get('sourceCommit'),prompt=get('promptCommit'),bundle=get('bundleCommit');
 if(branch!=='main')return error('SOURCE_NOT_MAIN');
 if(typeof head!=='string'||!sha40.test(head))return error('SOURCE_COMMIT_NOT_PINNED');
 if(prompt!==head)return error('PROMPT_SOURCE_DRIFT');
 if(bundle!==head)return error('BUNDLE_SOURCE_DRIFT');
 if(typeof get('bundleSha256')!=='string'||!sha64.test(get('bundleSha256'))||get('manifestVerified')!==true)
  return error('BUNDLE_BYTES_NOT_VERIFIED');
 if(get('testsPassed')!==true)return error('CI_QUALIFICATION_MISSING');
 if(get('ownerIdentityVerified')!==true)return error('OWNER_CLAIMS_NOT_RECONCILED');
 return Object.freeze({ok:true,eligible:true,first_edge:null,decision:'CANDIDATE_ELIGIBLE_FOR_SEPARATE_RELEASE_DECISION',
  source_commit:head,source_authentication:'CALLER_ATTESTED_ONLY',
  published:false,active:false,authority:0});
}
