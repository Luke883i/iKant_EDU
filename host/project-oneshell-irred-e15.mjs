import path from 'node:path';
import {createHash} from 'node:crypto';
/** E15: pure, authority-zero evidence cut-set. No source, consent, C87 or voice minted here. */
const H40=/^[0-9a-f]{40}$/u;
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const B64=/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
const MAX_TRANSIT_B64=350000;
export const E15_PROFILE='PROJECT_EDU_E15';
export const E15_ORDER=Object.freeze(['SOURCE_LOCK','ORIENTATION','C72_TRANSIT','C72_ACCEPTED',
 'C72_EDU','SOURCE_READBACK','C135_OWNER','C87_READBACK','C125_S03','ONE_SHELL',
 'RECOVERY_FENCE','LOGO_SOURCE','HOST_DELIVERY']);
export const E15_STAGES=Object.freeze(['ACCEPT','EDU','MATERIALIZED','READY','TURN','RECOVERED','DELIVERED']);
const required=Object.freeze({
 ACCEPT:4,EDU:5,MATERIALIZED:6,READY:7,TURN:10,RECOVERED:11,DELIVERED:13
});
const edge=Object.freeze({SOURCE_LOCK:'STOP_SOURCE_LOCK_STALE',ORIENTATION:'E15_ORIENTATION_WITNESS_REQUIRED',
 C72_TRANSIT:'E15_ORIGINAL_C72_TRANSIT_REQUIRED',C72_ACCEPTED:'E15_ORIGINAL_ACCEPTANCE_READBACK_REQUIRED',
 C72_EDU:'E15_ORIGINAL_MODE_READBACK_REQUIRED',SOURCE_READBACK:'E15_PINNED_TREE_BLOB_READBACK_REQUIRED',
 C135_OWNER:'E15_ORIGINAL_C135_REQUIRED',C87_READBACK:'E15_ORIGINAL_C87_READBACK_REQUIRED',
 C125_S03:'E15_ORIGINAL_S03_REQUIRED',ONE_SHELL:'E15_SIX_SLOTS_ORIGINAL_REQUIRED',
 RECOVERY_FENCE:'E15_RECOVERY_WORKER_FENCE_REQUIRED',LOGO_SOURCE:'E15_VERIFIED_LOGO_OR_TEXT_REQUIRED',
 HOST_DELIVERY:'E15_HOST_DELIVERY_UNKNOWN'});
const deny=(e)=>Object.freeze({ok:false,edge:e,voice:'NO_VOICE',authority:0,active:false,native_delivery_attested:false});
/** Evidence flags MUST originate from original owners/readbacks. A true flag is not itself a receipt. */
export function adjudicateE15(q={}){
 if(!plain(q))return deny('E15_PROFILE_OR_STAGE_INVALID');
 if(q.profile!==E15_PROFILE||!E15_STAGES.includes(q.stage))return deny('E15_PROFILE_OR_STAGE_INVALID');
 if(typeof q.sourceHead!=='string'||typeof q.liveHead!=='string'||
    !H40.test(q.sourceHead)||q.sourceHead!==q.liveHead)return deny(edge.SOURCE_LOCK);
 const count=required[q.stage];
 const checks=[true,q.orientationWitness===true,q.transitReadback===true,q.originalAccepted===true,
  q.originalEduMode===true,q.sourceTreeBlobReadback===true,q.originalC135===true,
  q.originalC87Readback===true,q.originalC125S03===true,q.sixSlotsOriginal===true,
  q.workerLossFence===true,q.verifiedLogoOrTextFallback===true,q.hostDeliveryObserved===true];
 for(let i=1;i<count;i++){
  if(i===10&&q.stage!=='RECOVERED')continue;
  if(i===11&&q.stage==='RECOVERED')continue;
  if(!checks[i])return deny(edge[E15_ORDER[i]]);
 }
 if(q.stage==='RECOVERED'&&q.workerLossFence!==true)return deny(edge.RECOVERY_FENCE);
 return Object.freeze({ok:true,stage:q.stage,edge:null,voice:'OWNER_ONLY_IF_ORIGINALLY_ATTESTED',
  authority:0,active:false,host_delivery_observed:q.stage==='DELIVERED'&&q.hostDeliveryObserved===true,
  native_delivery_attested:false});
}
export function admitE15TransportEnvelope(q={}){
 if(!plain(q))return deny('E15_EXPLICIT_PROJECT_PROFILE_REQUIRED');
 if(q.projectProfile!==E15_PROFILE)return deny('E15_EXPLICIT_PROJECT_PROFILE_REQUIRED');
 if(typeof q.transitDirectory!=='string'||!path.isAbsolute(q.transitDirectory)||
    path.normalize(q.transitDirectory)!==q.transitDirectory||q.transitDirectory.length<2)return deny(edge.C72_TRANSIT);
 const p=q.transitSourcePacket;
 if(!plain(p)||p.path!=='host/project-c72-receipt-transit.mjs'||
  typeof p.contentBase64!=='string'||p.contentBase64.length<4||
  p.contentBase64.length>MAX_TRANSIT_B64||p.contentBase64.length%4!==0||
  typeof q.transitBlobSha1!=='string'||!H40.test(q.transitBlobSha1))
  return deny('E15_PINNED_TRANSIT_BLOB_REQUIRED');
 if(!B64.test(p.contentBase64))return deny('E16_TRANSIT_BASE64_INVALID');
 const bytes=Buffer.from(p.contentBase64,'base64');
 if(bytes.length<1||bytes.length>256000||bytes.toString('base64')!==p.contentBase64)
  return deny('E16_TRANSIT_BASE64_INVALID');
 const got=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 if(got!==q.transitBlobSha1)return deny('E16_TRANSIT_GIT_SHA_MISMATCH');
 // This is only a byte-envelope check: a caller-supplied Git hash is NOT pinned source provenance.
 return Object.freeze({ok:true,authority:0,active:false,original_owner_invoked:false,
  source_origin_attested:false,native_delivery_attested:false});
}
