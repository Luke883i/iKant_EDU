/** C130 presentation-only adapter. No ownership of native ChatGPT UI, ledger or source truth. */
import {isProxy} from 'node:util/types';
const ph=Object.freeze({
 ORIENTING:['Sto interpretando la richiesta per individuare la domanda principale.','(C70: orientamento della richiesta)'],
 COMPARING:['Sto confrontando le risposte possibili e le prove che potrebbero smentirle.','(C117: guida alla formulazione)'],
 SOURCE_CHECK:['Controllo che i file ricevuti corrispondano alla versione attesa.','(C127: verifica dei file)'],
 SOURCE_CONFIRMED:['Il controllore locale ha restituito una conferma sui file ricevuti.','(C127: verifica dei file)'],
 VOICE_REOPENED:['Il controllore locale ha confermato che la risposta è stata registrata e riletta.','(C87: registro della risposta)'],
 WAITING_UPLOAD:['Per procedere serve un unico pacchetto di file verificabile, caricato in questa conversazione.','(C127: verifica dei file)'],
 GUARD_BLOCKED:['Il controllo della risposta non ha permesso di registrarla. L’analisi può proseguire senza attribuire a iKant una voce verificata.','(C114: controllo delle affermazioni)'],
 NATIVE_MISSING:['La connessione diretta tra iKant e i messaggi di questa chat non è stata dimostrata.','(C59: percorso canonico)'],
 OWNER_FAILED:['Il controllo locale non ha concluso il passaggio richiesto. Non tratto l’esito come un’attivazione riuscita.','(C125: consegna controllata)']
});
const allowedLevels=Object.freeze({
 ORIENTING:['HOST_PLAN'],COMPARING:['HOST_PLAN'],SOURCE_CHECK:['HOST_PLAN'],
 SOURCE_CONFIRMED:['OWNER_REOPEN'],VOICE_REOPENED:['OWNER_REOPEN'],
 WAITING_UPLOAD:['HOST_PLAN','LOCAL_TEST'],GUARD_BLOCKED:['LOCAL_TEST','OWNER_REOPEN'],
 NATIVE_MISSING:['HOST_PLAN','LOCAL_TEST'],OWNER_FAILED:['LOCAL_TEST','OWNER_REOPEN']
});
function own(o){return o&&typeof o==='object'&&!Array.isArray(o)&&!isProxy(o)&&
 (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null)&&
 Reflect.ownKeys(o).every(k=>typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptors(o)[k],'value'))}
/** Proof level comes from the trusted caller, NOT verified by this language adapter. */
export function renderC130PublicStatus(args={}){
 if(!own(args))return Object.freeze({ok:false,reason:'UNTRUSTED_STATUS_INPUT',authority:0});
 const {phase,proofLevel}=args;
 if(typeof phase!=='string'||!Object.hasOwn(ph,phase)||typeof proofLevel!=='string'||
 !allowedLevels[phase].includes(proofLevel))return Object.freeze({ok:false,reason:'PUBLIC_STATUS_NOT_PRESENTABLE',authority:0});
 const [plain,annotation]=ph[phase];
 return Object.freeze({ok:true,text:plain+' '+annotation,
  host_authored:true,proof_level_is_caller_attested:true,
  platform_wide_control:false,owner_voice_rewritten:false,authority:0});
}
/** Heuristic visible-copy lint, explicitly not a semantic proof. */
export function inspectC130PublicCopy(value){
 if(typeof value!=='string'||!value.trim()||value.length>2000)
  return {ok:false,issues:['EMPTY_OR_TOO_LONG']};
 const issues=[];
 // C identifiers only with their natural-language meaning in the same parentheses.
 const code=/\bC\d{1,4}\b/gu;
 for(const m of value.matchAll(code)){
  const before=value.slice(0,m.index),start=before.lastIndexOf('(');
  const right=value.indexOf(')',m.index);
  if(start<0||right<0||value.slice(start+1,right).includes('(')||
    !new RegExp('\\b'+m[0]+'\\s*:\\s*[A-Za-zÀ-ÿ]{3,}').test(value.slice(start,right+1)))
    issues.push('UNEXPLAINED_CX');
 }
 if(/\b[a-zA-Z][A-Za-z0-9]*_(?:[A-Z0-9]+_?){2,}\b/u.test(value))issues.push('RAW_MACHINE_STATUS');
 if(/\b[a-f0-9]{40,64}\b/iu.test(value))issues.push('RAW_TRACE_HASH');
 if(/\b(?:sono senziente|ho coscienza soggettiva|ricordo tutte le chat)\b/iu.test(value))issues.push('UNSUPPORTED_SUBJECTIVITY');
 return {ok:issues.length===0,issues:[...new Set(issues)],heuristic_only:true};
}
export function c130PublicGlossary(){return Object.freeze(Object.fromEntries(Object.entries(ph).map(([k,v])=>[k,v[1]])))}
