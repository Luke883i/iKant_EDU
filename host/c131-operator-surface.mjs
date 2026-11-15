/** C131: read-only operator text. NOT a native ChatGPT UI filter or an owner. */
import {isProxy} from 'node:util/types';
const phrases=Object.freeze({
 NEEDS_UPLOAD:'Per avviare la prova serve un solo pacchetto verificabile. Non e\' ancora stata eseguita una risposta (C127: controllo dei file).',
 CHECKING_SOURCE:'Sto verificando che i file corrispondano alla versione prevista. Non sto attivando una nuova identita\' (C127: controllo dei file).',
 READY_FOR_INPUT:'La prova locale e\' pronta a ricevere una domanda; questo non dimostra una connessione nativa con la chat (C125: consegna controllata).',
 PROCESSING:'Sto elaborando la domanda e verificando le condizioni di registrazione. Il risultato non e\' ancora attestato (C70: elaborazione; C87: registro).',
 CLOSED:'La prova locale e\' stata chiusa: non saranno inviate altre risposte da questa sessione (C125: consegna controllata).',
 BLOCKED:'Il controllo originale non ha autorizzato una risposta registrata. Posso descrivere il limite senza inventare una prova (C114: controllo delle affermazioni).'
});
const stages=new Set(Object.keys(phrases));
/** This text is guidance only: caller cannot mint owner receipts by passing a stage. */
export function renderC131OperatorStage(stage){
 if(typeof stage!=='string'||!stages.has(stage))return Object.freeze({ok:false,reason:'UNKNOWN_STAGE',authority:0});
 return Object.freeze({ok:true,text:phrases[stage],audience:'NON_SPECIALIST_OPERATOR',
  evidence:'PRESENTER_PROJECTION_ONLY',native_ui_control:false,active:false,authority:0});
}
/** Only the original session closure/busy status influences the READY card.
 * Presence of a caller status object is not proof of C87 or canonical ACTIVE.
 */
export function presentC131ManualSessionCard(statusGetter){
 if(typeof statusGetter!=='function')return renderC131OperatorStage('BLOCKED');
 try{
  const s=statusGetter();
  if(!s||typeof s!=='object'||isProxy(s)||Array.isArray(s))return renderC131OperatorStage('BLOCKED');
  const descriptors=Object.getOwnPropertyDescriptors(s);
  for(const p of ['closed','busy'])if(!Object.hasOwn(descriptors[p]||{},'value')||typeof descriptors[p].value!=='boolean')return renderC131OperatorStage('BLOCKED');
  return renderC131OperatorStage(s.closed?'CLOSED':s.busy?'PROCESSING':'READY_FOR_INPUT');
 }catch{return renderC131OperatorStage('BLOCKED')}
}
