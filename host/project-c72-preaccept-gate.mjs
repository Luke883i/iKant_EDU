/** Opt-in host-bound preaccept gateway. It cannot intercept unrelated host tools.
 * Must already be installed before orientation; never fetch this module preaccept.
 * Only original C72/v2 issues acceptance and introduction receipts.
 */
import {createHash} from 'node:crypto';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,
  presentC72V2Introduction,validateC72V2Accepted,
  validateC72V2Orientation,c72SourceRepository} from './c72-public-mode-admission.mjs';
const ORDER=Object.freeze(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
const H40=/^[a-f0-9]{40}$/u;
const gitBlob=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const stop=(edge)=>Object.freeze({ok:false,edge,authority:0,original_receipt:false});
export function createProjectC72PreacceptGate({readMain,readDocument}={}){
 if(typeof readMain!=='function'||typeof readDocument!=='function')
  throw Error('PREACCEPT_CALLBACKS_REQUIRED');
 let phase='NEW',head=null,termsSha=null,offer=null,accepted=null,orientation=null;
 const observed=[];
 const snapshot=()=>Object.freeze({phase,source_head:head,read_count:observed.length,
  order:Object.freeze(observed.map(x=>x.path)),terms_link_presented:phase==='AWAITING_ACCEPTANCE'||
  phase==='ACCEPTED',original_acceptance_verified:accepted!==null,authority:0,
  external_host_tools_attested:false,native_human_origin_attested:false});
 async function orient(){
  if(phase!=='NEW')return stop('ORIENTATION_ALREADY_STARTED');
  phase='READING';
  try{
   const h=await readMain();
   if(typeof h!=='string'||!H40.test(h))throw Error('SOURCE_HEAD_INVALID');
   head=h;
   for(const path of ORDER){
    const d=await readDocument(path,head);
    if(d===null||typeof d!=='object'||typeof d.content!=='string'||
       typeof d.blob_sha1!=='string')throw Error('DIRECT_DOCUMENT_EVIDENCE_MISSING');
    const bytes=Buffer.from(d.content,'utf8');
    if(gitBlob(bytes)!==d.blob_sha1)throw Error('DOCUMENT_GIT_BLOB_MISMATCH');
    if(observed.reduce((n,x)=>n+x.bytes,bytes.length)>262144)
      throw Error('ORIENTATION_BYTE_BUDGET');
    observed.push(Object.freeze({path,bytes:bytes.length,blob_sha1:d.blob_sha1}));
    if(path==='TERMS.md')termsSha=sha256(bytes);
   }
   offer=issueC72V2LinkedTermsOffer({sourceHead:head,termsDigest:termsSha});
   // Host must explicitly attest display of the pinned link in a separate step.
   phase='OFFER_READY';
   return Object.freeze({ok:true,edge:'TERMS_LINK_DISPLAY_REQUIRED',source_head:head,
    documents:Object.freeze(observed.map(x=>Object.freeze({...x,
     link:`https://github.com/${c72SourceRepository()}/blob/${head}/${x.path}`}))),
    terms_link:offer.terms_link,original_offer:offer,
    human_terms_read_attested:false,host_display_attested:false,authority:0});
  }catch(e){phase='STOP';return stop('PREACCEPT_ORIENTATION_SOURCE_UNVERIFIED');}
 }
 function attestTermsLinkDisplayed({actuallyDisplayed}={}){
  if(phase!=='OFFER_READY'||actuallyDisplayed!==true)return stop('TERMS_LINK_DISPLAY_NOT_ATTESTED');
  phase='AWAITING_ACCEPTANCE';
  // First-turn source SHA witness is formed before the Terms freeze; the
  // following I ACCEPT must be a separate human message. A caller must retain
  // this exact object (or visibly record its five hashes), not recreate it
  // from the post-accept re-fetch.
  const witness=Object.freeze({source_head:head,terms_link:offer.terms_link,
   host_link_displayed:true,distinct_human_message_observed:false,
   pinned_blob_shas:Object.freeze(Object.fromEntries(observed.map(x=>[x.path,x.blob_sha1]))),
   witness_scope:'HOST_CLAIM_ONLY',native_event_attested:false});
  return Object.freeze({ok:true,edge:'AWAIT_I_ACCEPT',frozen:true,authority:0,
    host_display_claim:true,human_read_attested:false,orientation_witness:witness});
 }
 function accept(humanMessage){
  if(phase!=='AWAITING_ACCEPTANCE')return stop('PREACCEPT_ACCEPTANCE_GATE_CLOSED');
  if(humanMessage!=='I ACCEPT')return stop('C72_EXACT_ACCEPTANCE_REQUIRED');
  const a=acceptC72V2LinkedTerms({offer,humanMessage,termsLinkPresented:true});
  if(!validateC72V2Accepted(a))return stop('C72_ORIGINAL_ACCEPTANCE_NOT_VERIFIED');
  const i=presentC72V2Introduction(a);
  if(!validateC72V2Orientation(i,a))return stop('C72_ORIGINAL_INTRO_NOT_VERIFIED');
  accepted=a;orientation=i;phase='ACCEPTED';
  return Object.freeze({ok:true,edge:'AWAIT_EDU_OR_CANONICAL',
   accepted:a,introduction:i,authority:0,native_event_attested:false});
 }
 function denySourceAction(action){
  // Never delegate arbitrary source actions, regardless of phase.
  return stop(phase==='AWAITING_ACCEPTANCE'?'ORIENTATION_FROZEN_NO_REPOSITORY_CALLS':
    'PREACCEPT_SOURCE_ACTION_NOT_IN_CAPSULE');
 }
 return Object.freeze({orient,attestTermsLinkDisplayed,accept,denySourceAction,snapshot});
}
