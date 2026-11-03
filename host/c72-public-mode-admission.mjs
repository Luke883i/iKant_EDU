/** C72 public admission v2: two choices. No runtime ownership or v1 receipt substitution.
 * Historical C72/v1 stays immutable for prior tests and explicit legacy consumers.
 * SHA-256 is an integrity check on caller data, NOT a provider event signature.
 */
import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
const CONTRACT=JSON.parse(readFileSync(new URL('../contracts/c72-public-mode-admission-v2.json',import.meta.url),'utf8'));
/** Original self-contained OLD identity. Rename is intentionally NOT enabled in this owner yet.
 * C72 cold seed already stages BOOTSTRAP.json and ADMISSION.json; no extra transport object.
 * No GitHub provider identity or rename authority is claimed here.
 */
// Pre-materialization C72 has no guaranteed local BOOTSTRAP/ADMISSION filesystem.
// Keep the original name frozen here; all document comparisons belong to the
// repository-scope source auditor, NOT a hidden optional/fallback local read.
// Switching this owner requires a separately qualified original source epoch.
export function c72SourceRepository(){
 const name=CONTRACT?.source_identity?.canonical_repository;
 if(CONTRACT?.source_identity?.repository_id!==1371330383||
    !['Luke883i/iKant_LE','Luke883i/iKant_EDU'].includes(name))
  throw Error('C72_CANONICAL_SOURCE_UNQUALIFIED');
 return name;
}
export function c72LinkedTermsURL(sourceHead){
 if(!/^[a-f0-9]{40}$/.test(sourceHead||''))throw Error('C72_SOURCE_HEAD_INVALID');
 return 'https://github.com/'+c72SourceRepository()+'/blob/'+sourceHead+'/TERMS.md';
}

const H40=/^[a-f0-9]{40}$/u,H64=/^[a-f0-9]{64}$/u;
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const seal=x=>Object.freeze({...x,receipt_sha256:hash(x)});
const is=(x,s)=>{
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.getPrototypeOf(x)!==Object.prototype||
    x.schema!==s||x.authority!==0||!H64.test(x.receipt_sha256||''))return false;
 const {receipt_sha256,...body}=x;
 return hash(body)===receipt_sha256;
};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const denied=reason=>Object.freeze({schema:'ikant-le-c72-public-denial/v2',status:reason,
 first_unclosed_edge:'C72_V2_'+reason,active:false,canonical_runtime:false,
 native_event_attested:false,owner_receipt_issued:false,authority:0});
export function c72PublicAdmissionContract(){return structuredClone(CONTRACT);}
export function issueC72V2TermsOffer({sourceHead,termsDigest}={}){
 if(!H40.test(sourceHead||'')||!H64.test(termsDigest||''))throw Error('source head and terms digest required');
 return seal({schema:'ikant-le-c72-public-terms-offer/v2',source_head:sourceHead,
  terms_digest:termsDigest,terms_gate:'I ACCEPT',allowed_modes:['EDU','CANONICAL'],
  presentation_required:true,origin_authentication:'UNVERIFIED',
  active:false,native_event_attested:false,authority:0});
}
export function validateC72V2Offer(x){return is(x,'ikant-le-c72-public-terms-offer/v2')&&
 H40.test(x.source_head||'')&&H64.test(x.terms_digest||'')&&x.terms_gate==='I ACCEPT'&&
 same(x.allowed_modes,['EDU','CANONICAL'])&&x.presentation_required===true&&
 x.origin_authentication==='UNVERIFIED'&&x.active===false&&x.native_event_attested===false;}
export function acceptC72V2Terms({offer,humanMessage,termsPresented}={}){
 if(!validateC72V2Offer(offer))return denied('INVALID_OFFER');
 if(offer.presentation==='PINNED_DOCUMENT_LINK')return denied('LINK_PRESENTATION_OWNER_REQUIRED');
 if(termsPresented!==true)return denied('TERMS_NOT_PRESENTED');
 if(humanMessage!=='I ACCEPT')return denied('EXACT_ACCEPTANCE_REQUIRED');
 return seal({schema:'ikant-le-c72-public-accepted/v2',source_head:offer.source_head,
  terms_digest:offer.terms_digest,offer_sha256:offer.receipt_sha256,
  human_message_sha256:hash('I ACCEPT'),terms_presented_host_claim:true,
  selection_pending:true,selected_mode:null,origin_authentication:'UNVERIFIED',
  active:false,canonical_runtime:false,persistent:false,native_event_attested:false,
  owner_receipt_issued:false,authority:0});
}
/** Explicit link-presentation path. Availability is not a claim of document reading. */
export function issueC72V2LinkedTermsOffer({sourceHead,termsDigest}={}){
 const original=issueC72V2TermsOffer({sourceHead,termsDigest});
 const {receipt_sha256,...body}=original;
 return seal({...body,presentation:'PINNED_DOCUMENT_LINK',
  terms_link:c72LinkedTermsURL(sourceHead),
  terms_body_presented:false,terms_read_attested:false});
}
export function acceptC72V2LinkedTerms({offer,humanMessage,termsLinkPresented}={}){
 if(!validateC72V2Offer(offer)||offer.presentation!=='PINNED_DOCUMENT_LINK'||
  offer.terms_link!==c72LinkedTermsURL(offer.source_head)||
  offer.terms_body_presented!==false||offer.terms_read_attested!==false)return denied('INVALID_LINK_OFFER');
 if(termsLinkPresented!==true)return denied('TERMS_LINK_NOT_PRESENTED');
 if(humanMessage!=='I ACCEPT')return denied('EXACT_ACCEPTANCE_REQUIRED');
 return seal({schema:'ikant-le-c72-public-accepted/v2',source_head:offer.source_head,
  terms_digest:offer.terms_digest,offer_sha256:offer.receipt_sha256,
  human_message_sha256:hash('I ACCEPT'),terms_presented_host_claim:false,
  terms_link_presented_host_claim:true,terms_link:offer.terms_link,
  terms_body_presented:false,terms_read_attested:false,
  selection_pending:true,selected_mode:null,origin_authentication:'UNVERIFIED',
  active:false,canonical_runtime:false,persistent:false,native_event_attested:false,
  owner_receipt_issued:false,authority:0});
}
export function validateC72V2Accepted(x){return is(x,'ikant-le-c72-public-accepted/v2')&&
 H40.test(x.source_head||'')&&H64.test(x.terms_digest||'')&&H64.test(x.offer_sha256||'')&&
 x.human_message_sha256===hash('I ACCEPT')&&(x.terms_presented_host_claim===true||
  x.terms_presented_host_claim===false&&x.terms_link_presented_host_claim===true&&
  x.terms_body_presented===false&&x.terms_read_attested===false&&
  x.terms_link===c72LinkedTermsURL(x.source_head))&&
 x.selection_pending===true&&x.selected_mode===null&&x.origin_authentication==='UNVERIFIED'&&
 x.active===false&&x.canonical_runtime===false&&x.persistent===false&&
 x.native_event_attested===false&&x.owner_receipt_issued===false;}
const base=[
 'iKant è un runtime conversazionale sperimentale governato dal repository: non è una persona né un nuovo modello linguistico.',
 'Il modello HOST è sostituibile, mentre i moduli originali verificano soltanto le operazioni realmente osservate.',
 'Le risposte separano fatti osservati, ipotesi, decisioni, ricevute e limiti; nessuna impronta prova la verità del testo.',
 'EDU è la modalità sperimentale consigliata per prove locali e bozze guidate, senza dichiarare instradamento nativo o persistenza tra chat.',
 'CANONICAL è il percorso di prodotto via MCP autenticato, ma richiede ingresso originale, writer, readback e consegna: MCP connesso non significa ACTIVE.',
 'Dopo il consenso I ACCEPT scegli esattamente EDU oppure CANONICAL; scegliere non installa alcun plugin e non avvia il runtime.'
];
const variantsA=['Le autorizzazioni rimangono limitate al turno.',
 'Ogni scrittura deve essere riletta e verificata.',
 'Un fallimento non autorizza un retry cieco.',
 'Le capacità della piattaforma devono essere osservate.',
 'La presentazione HOST non crea ricevute native.',
 'L’integrità dei byte non certifica la provenienza.',
 'La shell non cambia la semantica degli owner.',
 'I test di regressione non provano benefici cognitivi.',
 'Lo storico non costituisce prova dello stato corrente.',
 'Gli strumenti esterni richiedono permessi espliciti.'];
const variantsB=['La scelta consigliata iniziale resta EDU.',
 'La modalità selezionata rimane inattiva fino alla prova.',
 'Un evento non autenticato non attiva CANONICAL.',
 'Ogni nuova sorgente richiede un nuovo controllo.',
 'Una bozza non equivale a una consegna nativa.',
 'Il codice non sostituisce il servizio installato.',
 'Le note HOST sono distinte dalla voce originale.',
 'La cronologia di chat non vale come registro durevole.',
 'La modalità CANONICAL non ha fallback automatico.',
 'Le prove dell’utente rimangono correggibili.'];
export function evaluateC72V2Introductions(){
 const candidates=[];
 for(let a=0;a<10;a++)for(let b=0;b<10;b++){
  const text=[...base,variantsA[a],variantsB[b]].join(' ');
  const words=text.trim().split(/\s+/u).length;
  const valid=words>=90&&words<=200&&text.includes('EDU')&&text.includes('CANONICAL')&&
   text.includes('I ACCEPT')&&!text.includes('EXPERIMENTAL');
  candidates.push({index:a*10+b,text,words,valid,score:(valid?10000:0)-Math.abs(words-150)*3});
 }
 candidates.sort((a,b)=>b.score-a.score||a.index-b.index);
 return {evaluated:100,unique:new Set(candidates.map(x=>x.text)).size,
  selected:candidates[0],scores_are_empirical:false};
}
export function presentC72V2Introduction(accepted){
 if(!validateC72V2Accepted(accepted))return denied('INVALID_ACCEPTANCE_BOUNDARY');
 const rank=evaluateC72V2Introductions();
 if(rank.unique!==100||!rank.selected.valid)return denied('INTRODUCTION_CONTRACT_INVALID');
 return seal({schema:'ikant-le-c72-public-orientation/v2',source_head:accepted.source_head,
  terms_digest:accepted.terms_digest,acceptance_receipt_sha256:accepted.receipt_sha256,
  text:rank.selected.text,candidate_index:rank.selected.index,
  candidates_evaluated:rank.evaluated,unique_candidates:rank.unique,
  mode_options:['EDU','CANONICAL'],default_recommendation:'EDU',
  scores_are_empirical:false,active:false,authority:0});
}
export function validateC72V2Orientation(x,accepted){
 if(!validateC72V2Accepted(accepted)||!is(x,'ikant-le-c72-public-orientation/v2'))return false;
 const rank=evaluateC72V2Introductions();
 return x.source_head===accepted.source_head&&x.terms_digest===accepted.terms_digest&&
 x.acceptance_receipt_sha256===accepted.receipt_sha256&&x.text===rank.selected.text&&
 x.candidate_index===rank.selected.index&&x.candidates_evaluated===100&&
 x.unique_candidates===100&&same(x.mode_options,['EDU','CANONICAL'])&&
 x.default_recommendation==='EDU'&&x.scores_are_empirical===false&&x.active===false;
}
export function selectC72V2Mode({accepted,orientation,humanMessage}={}){
 if(!validateC72V2Orientation(orientation,accepted))return denied('INVALID_ORIENTATION_BOUNDARY');
 if(humanMessage!=='EDU'&&humanMessage!=='CANONICAL')return denied('INVALID_MODE_SELECTION');
 return seal({schema:'ikant-le-c72-public-selection/v2',source_head:accepted.source_head,
  terms_digest:accepted.terms_digest,acceptance_receipt_sha256:accepted.receipt_sha256,
  orientation_receipt_sha256:orientation.receipt_sha256,selected_mode:humanMessage,
  status:CONTRACT.status[humanMessage],first_unclosed_edge:CONTRACT.first_edge[humanMessage],
  common_human_gate:'I ACCEPT',additional_consent_required:false,
  active:false,canonical_runtime:false,persistent:false,native_event_attested:false,
  owner_receipt_issued:false,authority:0});
}
export function validateC72V2ModeSelection(x,{mode=null,sourceHead=null}={}){
 if(!is(x,'ikant-le-c72-public-selection/v2'))return false;
 if(!H40.test(x.source_head||'')||!H64.test(x.terms_digest||'')||
 !H64.test(x.acceptance_receipt_sha256||'')||!H64.test(x.orientation_receipt_sha256||''))return false;
 if(x.selected_mode!=='EDU'&&x.selected_mode!=='CANONICAL')return false;
 if(mode!==null&&mode!==x.selected_mode)return false;
 if(sourceHead!==null&&sourceHead!==x.source_head)return false;
 return x.status===CONTRACT.status[x.selected_mode]&&x.first_unclosed_edge===CONTRACT.first_edge[x.selected_mode]&&
 x.common_human_gate==='I ACCEPT'&&x.additional_consent_required===false&&
 x.active===false&&x.canonical_runtime===false&&x.persistent===false&&
 x.native_event_attested===false&&x.owner_receipt_issued===false;
}
