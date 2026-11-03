/** Host post-I ACCEPT reentry: use ONLY original C72/v2 owners, never an emulator.
 * This component cannot attest a prior native message, preinstalled gateway,
 * provider identity, or native ChatGPT tool routing. No preaccept execution. */
import {createHash} from 'node:crypto';
import {
 issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,presentC72V2Introduction,
 validateC72V2Accepted,validateC72V2Orientation,c72LinkedTermsURL
} from './c72-public-mode-admission.mjs';
const ORDER=Object.freeze(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
const SHA=/^[0-9a-f]{40}$/u;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const gitBlob=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const deny=edge=>Object.freeze({ok:false,first_edge:edge,original_owner_invoked:false,owner_receipt:null,introduction:null,authority:0,native_event_attested:false});
/** Classifies *observations*, not an inferred environment; discovery misses are UNKNOWN. */
export function classifyC72OwnerEvidence({discovery='UNKNOWN',callability='UNKNOWN',outcome='NOT_INVOKED',receipt='UNOBSERVED'}={}){
 if(!['UNKNOWN','FOUND','EMPTY'].includes(discovery)||!['UNKNOWN','CALLABLE','UNAVAILABLE_VERIFIED'].includes(callability)||
    !['NOT_INVOKED','SUCCEEDED','FAILED','UNKNOWN'].includes(outcome)||!['UNOBSERVED','VALID','INVALID'].includes(receipt))return 'C72_DIAGNOSTIC_EVIDENCE_INVALID';
 if(outcome==='UNKNOWN')return 'C72_OWNER_OUTCOME_UNKNOWN';
 if(outcome==='FAILED')return 'C72_OWNER_EXECUTION_FAILED';
 if(outcome==='SUCCEEDED')return receipt==='VALID'?'C72_OWNER_RECEIPT_VERIFIED':receipt==='INVALID'?'C72_OWNER_RECEIPT_INVALID':'C72_RECEIPT_NOT_OBSERVED';
 if(callability==='UNAVAILABLE_VERIFIED')return 'C72_OWNER_UNAVAILABLE_VERIFIED';
 if(callability==='CALLABLE')return 'C72_OWNER_NOT_INVOKED';
 return discovery==='EMPTY'?'C72_OWNER_UNRESOLVED_NOT_ABSENT':'C72_OWNER_CALLABILITY_UNKNOWN';
}
/** After a *distinct* exact I ACCEPT, Host may reacquire the same five pinned
 * document bytes with GitHub API and execute this preverified original owner.
 * Reacquisition DOES NOT retroactively prove the first-turn orientation. */
export function reenterC72V2PostAccept({sourceHead,liveHead,humanMessage,priorTurnEvidence,documents}={}){
 if(humanMessage!=='I ACCEPT')return deny('C72_EXACT_ACCEPTANCE_REQUIRED');
 if(!SHA.test(sourceHead||'')||!SHA.test(liveHead||'')||liveHead!==sourceHead)return deny('STOP_SOURCE_LOCK_STALE');
 const termsUrl=c72LinkedTermsURL(sourceHead);
 if(priorTurnEvidence?.source_head!==sourceHead||priorTurnEvidence?.terms_link!==termsUrl||
    priorTurnEvidence?.host_link_displayed!==true||priorTurnEvidence?.distinct_human_message_observed!==true)
    return deny('C72_PRIOR_ORIENTATION_NOT_HOST_ATTESTED');
 if(!Array.isArray(documents)||documents.length!==ORDER.length)return deny('C72_PINNED_DOCUMENT_SET_INVALID');
 let terms=null;
 for(let i=0;i<ORDER.length;i++){
  const d=documents[i];
  if(d?.path!==ORDER[i]||d?.source_head!==sourceHead||typeof d.content!=='string'||
     priorTurnEvidence?.pinned_blob_shas?.[ORDER[i]]!==d.blob_sha1||
     !SHA.test(d.blob_sha1||'')||gitBlob(Buffer.from(d.content,'utf8'))!==d.blob_sha1)
   return deny('C72_PINNED_DOCUMENT_BLOB_INVALID');
  if(i===4)terms=Buffer.from(d.content,'utf8');
 }
 try{
  const offer=issueC72V2LinkedTermsOffer({sourceHead,termsDigest:hash(terms)});
  const accepted=acceptC72V2LinkedTerms({offer,humanMessage,termsLinkPresented:true});
  if(!validateC72V2Accepted(accepted))return deny('C72_OWNER_ACCEPTANCE_NOT_VERIFIED');
  const introduction=presentC72V2Introduction(accepted);
  if(!validateC72V2Orientation(introduction,accepted))return deny('C72_OWNER_INTRODUCTION_NOT_VERIFIED');
  return Object.freeze({ok:true,status:'C72_ORIGINAL_POSTACCEPT_VERIFIED',original_owner_invoked:true,
   source_head:sourceHead,offer,accepted,introduction,terms_sha256:hash(terms),
   terms_link_presented_host_claim:true,terms_body_presented:false,terms_read_attested:false,
   prior_turn_evidence_kind:'HOST_CLAIM_ONLY',native_event_attested:false,
   provider_bound_identity_attested:false,preinstalled_gateway_attested:false,
   authority:0,active:false});
 }catch{return deny('C72_ORIGINAL_OWNER_EXECUTION_FAILED');}
}
