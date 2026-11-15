import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';

const CONTRACT=JSON.parse(readFileSync(new URL('../contracts/c72-unified-mode-admission.json',import.meta.url),'utf8'));
const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/;
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const seal=x=>Object.freeze({...x,receipt_sha256:sha(x)});
const reasons=Object.freeze({
 INVALID_OFFER:'SOURCE_OR_TERMS_UNVERIFIED',
 INVALID_PRESENTATION:'TERMS_PRESENTATION',
 INVALID_ACCEPTANCE:'EXACT_I_ACCEPT',
 INVALID_SELECTION:'MODE_CHOICE',
 INVALID_BOUNDARY:'COMMON_GATE_BINDING'
});
const denied=(reason)=>Object.freeze({schema:'ikant-le-c72-denial/v1',
 status:reason,first_unclosed_edge:reasons[reason]||'UNIFIED_ADMISSION',
 active:false,canonical_runtime:false,persistent:false,
 native_event_attested:false,owner_receipt_issued:false,authority:0});
function readSeal(x,schema){
 if(!x||x.schema!==schema||x.authority!==0||!H64.test(String(x.receipt_sha256||'')))return false;
 const {receipt_sha256,...body}=x;
 return sha(body)===receipt_sha256;
}
export function c72AdmissionContract(){return structuredClone(CONTRACT);}
export function issueC72TermsOffer({sourceHead,termsDigest}={}){
 if(!H40.test(String(sourceHead||''))||!H64.test(String(termsDigest||'')))throw Error('frozen source head and Terms digest required');
 return seal({schema:'ikant-le-c72-terms-offer/v1',source_head:sourceHead,terms_digest:termsDigest,
  terms_gate:'I ACCEPT',presentation_required:true,
  selection_after_acceptance:true,allowed_modes:['CANONICAL','EXPERIMENTAL'],
  active:false,native_event_attested:false,origin_authentication:'UNVERIFIED',authority:0});
}
export function validateC72Offer(o){
 return readSeal(o,'ikant-le-c72-terms-offer/v1')&&H40.test(String(o.source_head||''))&&
 H64.test(String(o.terms_digest||''))&&o.terms_gate==='I ACCEPT'&&
 o.presentation_required===true&&o.selection_after_acceptance===true&&
 JSON.stringify(o.allowed_modes)===JSON.stringify(['CANONICAL','EXPERIMENTAL'])&&
 o.active===false&&o.native_event_attested===false&&o.origin_authentication==='UNVERIFIED';
}
export function acceptC72Terms({offer,humanMessage,termsPresented}={}){
 if(!validateC72Offer(offer))return denied('INVALID_OFFER');
 if(termsPresented!==true)return denied('INVALID_PRESENTATION');
 if(humanMessage!=='I ACCEPT')return denied('INVALID_ACCEPTANCE');
 return seal({schema:'ikant-le-c72-accepted/v1',
  source_head:offer.source_head,terms_digest:offer.terms_digest,
  terms_offer_sha256:offer.receipt_sha256,
  human_text_sha256:sha('I ACCEPT'),text_consent_observed:true,
  terms_presentation_host_claim:true,
  selection_pending:true,selected_mode:null,
  active:false,canonical_runtime:false,persistent:false,
  native_event_attested:false,host_event_identity:null,origin_authentication:'UNVERIFIED',
  owner_receipt_issued:false,authority:0});
}
export function validateC72Accepted(a){
 return readSeal(a,'ikant-le-c72-accepted/v1')&&
 H40.test(String(a.source_head||''))&&H64.test(String(a.terms_digest||''))&&
 H64.test(String(a.terms_offer_sha256||''))&&a.human_text_sha256===sha('I ACCEPT')&&
 a.text_consent_observed===true&&a.terms_presentation_host_claim===true&&
 a.selection_pending===true&&a.selected_mode===null&&a.active===false&&
 a.canonical_runtime===false&&a.persistent===false&&
 a.native_event_attested===false&&a.host_event_identity===null&&
 a.origin_authentication==='UNVERIFIED'&&a.owner_receipt_issued===false;
}
const sentences=[
 'iKant è un ambiente conversazionale costituzionale governato dal codice di questo repository, non un semplice personaggio o una promessa di coscienza.',
 'Il modello linguistico è il motore sostituibile; i moduli verificabili trattano intenzione, incertezza, regole di autorizzazione, psiche funzionale e memoria operativa.',
 'Una risposta utile deve separare fatti osservati, ipotesi, decisioni e azioni: le ricevute tecniche attestano soltanto ciò che il runtime ha realmente eseguito.',
 'La modalità CANONICAL richiede ingresso nativo, provenienza, esecuzione Node, stato persistente e readback ACTIVE: attualmente non è raccomandata in ChatGPT Projects senza tali prove.',
 'La modalità EXPERIMENTAL è raccomandata per le prove interne: può eseguire componenti reali se accessibili, ma non garantisce instradamento automatico, persistenza tra messaggi o partecipazione nativa.',
 'Il consenso I ACCEPT ha autorizzato questa procedura, non ha avviato nessuna modalità. Ora scegli esattamente CANONICAL oppure EXPERIMENTAL.'
];
const predicates=[
 t=>t.includes('iKant')&&t.includes('repository'),
 t=>t.includes('modello linguistico')&&t.includes('moduli'),
 t=>t.includes('fatti osservati')&&t.includes('azioni'),
 t=>t.includes('CANONICAL')&&t.includes('ACTIVE'),
 t=>t.includes('EXPERIMENTAL')&&t.includes('persistenza'),
 t=>t.includes('I ACCEPT')&&t.includes('scegli')
];
const clausesA=[
 'Lo stato comunicato sarà proporzionato alle evidenze.',
 'Il sistema non attribuisce autorità ai propri riepiloghi.',
 'La telemetria non aggiunge permessi.',
 'Non vengono inventate ricevute per sembrare operativo.',
 'Gli strumenti esterni hanno confini di capacità espliciti.',
 'Le risposte restano correggibili dall’essere umano.',
 'La verificabilità precede ogni dichiarazione di risultato.',
 'Le simulazioni sono etichettate come simulazioni.',
 'La conformità al repository non attesta la piattaforma.',
 'Una prova locale non implica persistenza della chat.'
];
const clausesB=[
 'Puoi scegliere in base al risultato che desideri verificare.',
 'L’esecuzione non viene presunta dal testo del prompt.',
 'Il percorso completo resta riservato a host idonei.',
 'Il laboratorio non può acquisire privilegi canonici.',
 'Le fonti esterne richiedono attribuzione.',
 'La scelta di modalità non costituisce un evento nativo autenticato.',
 'L’interazione non attribuisce volontà autonoma al software.',
 'La qualità d’uso va verificata con prove reali.',
 'Le informazioni non verificate restano dichiarate tali.',
 'Ogni messaggio futuro richiede un nuovo test del collegamento.'
];
export function evaluateC72Introductions(){
 const all=[];
 for(let a=0;a<10;a++)for(let b=0;b<10;b++){
  const text=sentences.join(' ')+' '+clausesA[a]+' '+clausesB[b];
  const words=text.trim().split(/\s+/u).length;
  const mandatory=predicates.every(p=>p(text));
  const duplicate=clausesA[a].toLowerCase().split(' ').filter(w=>clausesB[b].toLowerCase().includes(w)&&w.length>=9).length;
  const score=(mandatory?10000:0)-(words>200?1000:0)-(words<90?1000:0)-
    Math.abs(words-150)*3-duplicate*2;
  all.push({index:a*10+b,text,words,mandatory,score});
 }
 all.sort((a,b)=>b.score-a.score||a.index-b.index);
 return {evaluated:all.length,unique:new Set(all.map(x=>x.text)).size,
  selected:all[0],scores_are_empirical:false};
}
export function presentC72Introduction(accepted){
 if(!validateC72Accepted(accepted))return denied('INVALID_BOUNDARY');
 const best=evaluateC72Introductions();
 return seal({schema:'ikant-le-c72-orientation/v1',source_head:accepted.source_head,
  terms_digest:accepted.terms_digest,acceptance_receipt_sha256:accepted.receipt_sha256,
  text:best.selected.text,selected_candidate_index:best.selected.index,
  candidates_evaluated:best.evaluated,unique_candidates:best.unique,
  mode_options:['CANONICAL','EXPERIMENTAL'],
  default_recommendation:'EXPERIMENTAL',active:false,
  evidence_is_user_study:false,authority:0});
}
export function validateC72Orientation(o,accepted){
 if(!validateC72Accepted(accepted)||!readSeal(o,'ikant-le-c72-orientation/v1'))return false;
 const best=evaluateC72Introductions();
 return o.source_head===accepted.source_head&&o.terms_digest===accepted.terms_digest&&
 o.acceptance_receipt_sha256===accepted.receipt_sha256&&o.text===best.selected.text&&
 o.selected_candidate_index===best.selected.index&&o.candidates_evaluated===100&&
 o.unique_candidates===100&&
 JSON.stringify(o.mode_options)===JSON.stringify(['CANONICAL','EXPERIMENTAL'])&&
 o.default_recommendation==='EXPERIMENTAL'&&o.active===false&&
 o.evidence_is_user_study===false;
}
export function selectC72Mode({accepted,orientation,humanMessage}={}){
 if(!validateC72Orientation(orientation,accepted))return denied('INVALID_BOUNDARY');
 if(humanMessage!=='CANONICAL'&&humanMessage!=='EXPERIMENTAL')return denied('INVALID_SELECTION');
 return seal({schema:'ikant-le-c72-mode-selection/v1',
  source_head:accepted.source_head,terms_digest:accepted.terms_digest,
  acceptance_receipt_sha256:accepted.receipt_sha256,
  orientation_receipt_sha256:orientation.receipt_sha256,
  selected_mode:humanMessage,
  status:humanMessage==='CANONICAL'?'CANONICAL_REQUESTED_NOT_ACTIVE':'EXPERIMENTAL_SELECTED_NOT_RUNNING',
  common_human_gate:'I ACCEPT',additional_consent_required:false,
  first_unclosed_edge:humanMessage==='CANONICAL'?'HOST_MESSAGE_INGRESS':'EXECUTED_SOURCE_PROVENANCE',
  active:false,canonical_runtime:false,persistent:false,native_event_attested:false,
  owner_receipt_issued:false,authority:0});
}
export function validateC72ModeSelection(s,{mode=null,sourceHead=null}={}){
 if(!readSeal(s,'ikant-le-c72-mode-selection/v1'))return false;
 if(!H40.test(String(s.source_head||''))||!H64.test(String(s.terms_digest||''))||
 !H64.test(String(s.acceptance_receipt_sha256||''))||
 !H64.test(String(s.orientation_receipt_sha256||'')))return false;
 if(s.selected_mode!=='CANONICAL'&&s.selected_mode!=='EXPERIMENTAL')return false;
 if(mode!==null&&s.selected_mode!==mode)return false;
 if(sourceHead!==null&&s.source_head!==sourceHead)return false;
 return s.status===(s.selected_mode==='CANONICAL'?'CANONICAL_REQUESTED_NOT_ACTIVE':'EXPERIMENTAL_SELECTED_NOT_RUNNING')&&
 s.common_human_gate==='I ACCEPT'&&s.additional_consent_required===false&&
 s.first_unclosed_edge===(s.selected_mode==='CANONICAL'?'HOST_MESSAGE_INGRESS':'EXECUTED_SOURCE_PROVENANCE')&&
 s.active===false&&s.canonical_runtime===false&&s.persistent===false&&
 s.native_event_attested===false&&s.owner_receipt_issued===false;
}
