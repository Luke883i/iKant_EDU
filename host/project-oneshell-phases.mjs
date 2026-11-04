/** Admission and materialization semantic slides: original C72 and source owners only. */
import {createHash} from 'node:crypto';
import {
 validateC72V2Offer,validateC72V2Accepted,validateC72V2Orientation,
 validateC72V2ModeSelection,issueC72V2LinkedTermsOffer,
 acceptC72V2LinkedTerms,presentC72V2Introduction,selectC72V2Mode
} from './c72-public-mode-admission.mjs';
import {verifyLocalProjectSource} from '../scripts/project-repo-loader.mjs';
import {oneShellFrame} from './project-oneshell-edu.mjs';
const H40=/^[a-f0-9]{40}$/;
const paths=Object.freeze(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
const denied=e=>oneShellFrame({esito:'BLOCCATO',b:'La fase richiesta non ha una ricevuta originale valida.',
 edge:e,next:'STOP'});
const sha=x=>createHash('sha256').update(Buffer.from(x,'utf8')).digest('hex');
const href=(h,p)=>'https://github.com/Luke883i/iKant_EDU/blob/'+h+'/'+p;
/** Only HOST presentation. Preaccept must not require or acquire a Git TREE.
 * Caller independently verifies main and the five permitted pinned documents;
 * this function cannot certify a GitHub API call from a plain JS object. */
export function oneShellOrientation({head,offer}={}){
 if(!H40.test(head||'')||
    !validateC72V2Offer(offer)||offer.source_head!==head||
    offer.presentation!=='PINNED_DOCUMENT_LINK'||offer.terms_link!==href(head,'TERMS.md')||
    offer.terms_read_attested!==false||offer.terms_body_presented!==false)
  return denied('C72_LINKED_OFFER_AND_SOURCE_LOCK_REQUIRED');
 return oneShellFrame({esito:'ORIENTAMENTO · HOST',b:'Cinque documenti originali da verificare al commit congelato. Il link ai Termini non attesta la lettura.',
  prova:paths.map(p=>href(head,p)).join('\n'),edge:'C72_HUMAN_ACCEPTANCE_PENDING',next:'AWAIT_I_ACCEPT'});
}
/** The full original C72 introduction is preserved in B without paraphrase. */
export function oneShellAccepted({accepted,orientation}={}){
 if(!validateC72V2Accepted(accepted)||!validateC72V2Orientation(orientation,accepted))
  return denied('C72_ORIGINAL_ACCEPTANCE_AND_INTRODUCTION_REQUIRED');
 return oneShellFrame({esito:'TERMINI ACCETTATI · HOST',b:orientation.text,
  prova:'C72_ORIENTATION_SHA256:'+sha(JSON.stringify(orientation)),
  edge:'HUMAN_MODE_SELECTION_PENDING',next:'AWAIT_EDU_OR_CANONICAL'});
}
export function oneShellSelected({selection,accepted,orientation}={}){
 if(!validateC72V2Accepted(accepted)||!validateC72V2Orientation(orientation,accepted)||
    !validateC72V2ModeSelection(selection,{sourceHead:accepted?.source_head})||
    selection.acceptance_receipt_sha256!==accepted.receipt_sha256||
    selection.orientation_receipt_sha256!==orientation.receipt_sha256)
  return denied('C72_ORIGINAL_MODE_RECEIPT_REQUIRED');
 const edu=selection.selected_mode==='EDU';
 return oneShellFrame({esito:edu?'EDU SELEZIONATA':'CANONICAL LEGACY NON QUALIFICATA',
  b:edu?'La selezione autorizza soltanto i controlli della sorgente e del runtime EDU.':
    'Percorso CANONICAL legacy, destinato alla dismissione nel Project; nessun bootstrap CANONICAL o ACTIVE viene avviato. Non attestato come funzionante.',
  prova:'C72_SELECTION_SHA256:'+selection.receipt_sha256,
  edge:edu?selection.first_unclosed_edge:'CANONICAL_LEGACY_PRODUCT_NO_GO',
  next:edu?'VERIFY_SOURCE':'STOP'});
}
/** Closed source verification over materialized bytes, never the caller's assertion. */
export function oneShellMaterialized({selection,sourceRoot,head,tree}={}){
 if(!validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead:head})||!H40.test(tree||''))
  return denied('EDU_SOURCE_AND_SELECTION_REQUIRED');
 try{
  const original=verifyLocalProjectSource(sourceRoot,{head,tree});
  if(original.source_head!==head||original.source_tree!==tree)
   return denied('SOURCE_READBACK_BINDING_MISMATCH');
  return oneShellFrame({esito:'CODICE EDU VERIFICATO',
   b:'Tutti i sorgenti della closure sono stati riletti e confrontati con il tree Git.',
   prova:'TREE:'+tree,edge:'EDU_RUNTIME_NOT_STARTED',next:'START_C135_EDU'});
 }catch{return denied('EDU_SOURCE_REOPEN_FAILED')}
}
export const ONE_SHELL_PHASES=Object.freeze(['ORIENTATION','ACCEPTED','MODE_SELECTED',
 'SOURCE_CHECK','SOURCE_HANDOFF','MATERIALIZED','EDU_READY','FIRST_TURN_VERIFIED']);
export const ONE_SHELL_SLOTS=Object.freeze(['ESITO','A','B','PROVA','EDGE','NEXT']);

/** Ephemeral read-only OneShell C72 coordination: no preaccept TREE dependency.
 * This helper assumes its imported original C72 owner is already available in the process;
 * it does not install a gateway or replace postaccept recovery in a cold Host.
 * NOT a new admission owner,
 * transport, persistent state or native human-event authentication.
 * One advance corresponds to ONE externally observed exact human message.
 */
export function createOneShellAdmissionFlow({head,termsUtf8}={}){
 if(!H40.test(head||'')||typeof termsUtf8!=='string'||
    !termsUtf8.length||Buffer.byteLength(termsUtf8,'utf8')>500000)
  throw Error('FROZEN_ORIGINAL_TERMS_REQUIRED');
 const termsDigest=sha(termsUtf8);
 let phase='WAIT_TRIGGER',offer=null,accepted=null,orientation=null,selection=null;
 const rejected=(edge)=>denied(edge);
 function advance({humanMessage,termsLinkPresented=false}={}){
  // Project-scoped first-contact bootstrap accepts ANY actual human text.
  // Text is never an acceptance, mode selection or runtime input at this gate.
  if(phase==='WAIT_TRIGGER'){
   if(typeof humanMessage!=='string')return rejected('FIRST_HUMAN_MESSAGE_REQUIRED');
   offer=issueC72V2LinkedTermsOffer({sourceHead:head,termsDigest});
   const frame=oneShellOrientation({head,offer});
   if(frame.slots.NEXT!=='AWAIT_I_ACCEPT')return rejected('C72_ORIENTATION_BLOCKED');
   phase='WAIT_ACCEPT';
   return frame;
  }
  if(typeof humanMessage!=='string'||humanMessage.length>64)return rejected('EXACT_HUMAN_MESSAGE_REQUIRED');
  if(phase==='WAIT_ACCEPT'){
   if(humanMessage!=='I ACCEPT'||termsLinkPresented!==true)
    return rejected('C72_EXACT_ACCEPTANCE_OR_LINK_WITNESS_REQUIRED');
   const candidate=acceptC72V2LinkedTerms({offer,humanMessage,termsLinkPresented});
   if(!validateC72V2Accepted(candidate))return rejected('C72_ACCEPTANCE_DENIED');
   const introduction=presentC72V2Introduction(candidate);
   if(!validateC72V2Orientation(introduction,candidate))return rejected('C72_INTRODUCTION_DENIED');
   const frame=oneShellAccepted({accepted:candidate,orientation:introduction});
   if(frame.slots.NEXT!=='AWAIT_EDU_OR_CANONICAL')return rejected('C72_INTRODUCTION_PROJECTION_DENIED');
   accepted=candidate;orientation=introduction;phase='WAIT_MODE';
   return frame;
  }
  if(phase==='WAIT_MODE'){
   if(humanMessage!=='EDU'&&humanMessage!=='CANONICAL')return rejected('C72_EXACT_MODE_REQUIRED');
   const candidate=selectC72V2Mode({accepted,orientation,humanMessage});
   if(!validateC72V2ModeSelection(candidate,{sourceHead:head}))
    return rejected('C72_SELECTION_DENIED');
   const frame=oneShellSelected({selection:candidate,accepted,orientation});
   // Legacy CANONICAL is an original C72 selection receipt, not an EDU start.
   // Its Project frame must STOP but the valid receipt remains inspectable.
   if(candidate.selected_mode==='CANONICAL'){
    if(frame.slots.NEXT!=='STOP'||frame.slots.EDGE!=='CANONICAL_LEGACY_PRODUCT_NO_GO')
     return rejected('C72_LEGACY_STOP_PROJECTION_DENIED');
   }else if(frame.slots.NEXT!=='VERIFY_SOURCE')
    return rejected('C72_SELECTION_PROJECTION_DENIED');
   selection=candidate;phase='MODE_SELECTED';
   return frame;
  }
  return rejected('C72_NEW_HUMAN_MESSAGE_NOT_A_NEW_GATE');
 }
 return Object.freeze({
  advance,phase:()=>phase,
  selection:()=>phase==='MODE_SELECTED'?selection:null,
  source_head:head,
  authority:0,persistent:false,provider_event_authenticated:false,
  native_ui_attested:false
 });
}
