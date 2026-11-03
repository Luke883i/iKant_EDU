/** HOST-only orchestration decision, no original C72 receipt or native identity.
 * Missing catalog entries never prove unavailable runtime: prefer post-accept
 * original-owner reentry over asking the human to diagnose a gateway. */
const deny=(edge,message)=>Object.freeze({kind:'STOP',action:'STOP',edge,
 human_next:'Nessuna azione tecnica richiesta a te. '+message,
 native_event_attested:false,original_receipt_issued:false,authority:0});
const auto=(action,edge,explanation)=>Object.freeze({kind:'AUTO',action,edge,
 human_next:explanation,native_event_attested:false,
 original_receipt_issued:false,authority:0});
const gate=(action,edge,humanNext)=>Object.freeze({kind:'HUMAN_GATE',action,edge,
 human_next:humanNext,native_event_attested:false,
 original_receipt_issued:false,authority:0});
/** 
 * Accepts observed state, not inferred capability. `acceptedOriginal` means a
 * separately reopened original C72/v2 receipt, not the text `I ACCEPT`.
 * Does not call owner or confer a mode, nor retry an UNKNOWN outcome.
 */
export function planC72HostRecovery({phase='AWAIT_ACCEPTANCE',humanMessage='',
  freshHumanTurn=false,termsLinkShown=false,priorSourceWitness=false,
  ownerAcceptanceVerified=false,ownerOutcome='NOT_INVOKED',
  node='UNKNOWN',apiTransport='UNKNOWN',catalog='UNKNOWN'}={}){
 if(!['AWAIT_ACCEPTANCE','ACCEPTANCE_PENDING','AWAIT_MODE'].includes(phase)||
  !['NOT_INVOKED','UNKNOWN','FAILED','SUCCEEDED'].includes(ownerOutcome)||
  !['UNKNOWN','AVAILABLE','UNAVAILABLE_VERIFIED'].includes(node)||
  !['UNKNOWN','AVAILABLE','UNAVAILABLE_VERIFIED'].includes(apiTransport)||
  !['UNKNOWN','EMPTY','FOUND'].includes(catalog))
  return deny('C72_HOST_EVIDENCE_INVALID','Il sistema non può convalidare gli indicatori tecnici.');
 if(phase==='AWAIT_MODE'){
  if(ownerAcceptanceVerified!==true)return deny('C72_ORIGINAL_RECEIPT_NOT_ATTESTED','Il consenso non è ancora stato validato dal componente originale.');
  if(!freshHumanTurn)return gate('AWAIT_EDU_OR_CANONICAL','C72_MODE_SELECTION_PENDING','Scrivi EDU oppure CANONICAL in un nuovo messaggio.');
  if(humanMessage!=='EDU'&&humanMessage!=='CANONICAL')return gate('AWAIT_EDU_OR_CANONICAL','C72_EXACT_MODE_REQUIRED','Invia soltanto EDU oppure CANONICAL, senza altre parole.');
  return auto('INVOKE_ORIGINAL_C72_MODE_OWNER','C72_MODE_ORIGINAL_SELECTION_REQUIRED','Il sistema verifica la selezione con il componente originale.');
 }
 if(phase==='AWAIT_ACCEPTANCE'){
  if(!termsLinkShown)return deny('C72_TERMS_NOT_DISPLAYED','Prima va mostrato il collegamento ai Terms.');
  if(!freshHumanTurn||humanMessage!=='I ACCEPT')return gate('AWAIT_I_ACCEPT','C72_EXACT_NEW_CONSENT_REQUIRED','Dopo aver esaminato i Terms, invia un nuovo messaggio contenente esattamente I ACCEPT.');
 }
 if(phase==='ACCEPTANCE_PENDING'&&ownerAcceptanceVerified!==true&&humanMessage==='EDU')
  return deny('C72_ACCEPTANCE_PENDING_NOT_MODE','EDU non sostituisce la ricevuta di consenso.');
 if(ownerAcceptanceVerified===true)
  return gate('AWAIT_EDU_OR_CANONICAL','C72_MODE_SELECTION_PENDING','In un nuovo messaggio, scrivi EDU oppure CANONICAL.');
 if(ownerOutcome==='UNKNOWN')return deny('C72_OWNER_OUTCOME_UNKNOWN','L’esito della chiamata è incerto: controllo solo le prove esistenti, senza ripetere la scrittura.');
 if(ownerOutcome==='FAILED')return deny('C72_OWNER_EXECUTION_FAILED','Il componente ha restituito un errore verificato.');
 if(ownerOutcome==='SUCCEEDED')return deny('C72_ORIGINAL_RECEIPT_NOT_ATTESTED','Manca la verifica della ricevuta originale.');
 if(!priorSourceWitness)return deny('C72_ORIENTATION_WITNESS_MISSING','La chat non conserva una prova sufficiente delle cinque letture e dei Terms.');
 // An empty connector catalog does not change the flow: an installed Node host
 // can still materialize and invoke the pinned original C72 after consent.
 if(node==='UNKNOWN')return auto('VERIFY_NODE_20','C72_NODE_CAPABILITY_UNKNOWN','Controllo automaticamente le capacità disponibili; non devi verificare alcun gateway.');
 if(node==='UNAVAILABLE_VERIFIED')return deny('C72_NODE_UNAVAILABLE_VERIFIED','Questa chat non dispone di esecuzione Node compatibile.');
 if(apiTransport==='UNKNOWN')return auto('VERIFY_PINNED_API_TRANSPORT','C72_SOURCE_BRIDGE_UNKNOWN','Controllo automaticamente l’accesso ai file originali.');
 if(apiTransport==='UNAVAILABLE_VERIFIED')return deny('C72_POSTACCEPT_TRANSPORT_UNAVAILABLE_VERIFIED','Questa chat non dispone di un collegamento verificabile ai file originali.');
 return auto('INVOKE_PINNED_C72_POSTACCEPT_REENTRY','C72_ORIGINAL_REENTRY_REQUIRED','Verifico i blob originali e completo l’ammissione; non devi intervenire.');
}


/** Post-consent one-shot executor, not another C72 owner. The host supplies
 * live GitHub API callbacks explicitly; Node cannot authenticate their origin.
 * AUTO decisions are executed here rather than narrated as terminal STOPs.
 * A read/call outcome UNKNOWN is terminal; never repeat a potentially written
 * admission operation. Only the original reentry imports/validates C72/v2.
 */
/** Host evidence projection ONLY, not a transport implementation or native attestator.
 * A bound packet/callback may be a local fixture. GitHub and Node separately
 * available never certify that bytes crossed tools. Trace is owner-executor data.
 */
export function describeC72BridgeEvidence(trace=[]){
 if(!Array.isArray(trace)||trace.some(x=>typeof x!=='string'))
  throw Error('C72_TRACE_INVALID');
 const carrier=trace.includes('TRANSPORT:HOST_SOURCE_PACKET')?'HOST_SOURCE_PACKET':
  trace.includes('TRANSPORT:HOST_CALLBACKS')?'HOST_CALLBACKS':null;
 const docs=trace.filter(x=>x.startsWith('READ_PINNED:')).length;
 return Object.freeze({
  node_check_observed:trace.includes('VERIFY_NODE_20'),
  node_carrier_bound:carrier!==null,
  node_carrier_kind:carrier,
  records_ingested:docs,
  github_connector_to_node_origin_attested:false,
  native_human_event_attested:false,
  cross_tool_transfer_failure_observed:false
 });
}

export async function executeC72PostAcceptRecovery({humanMessage, freshHumanTurn,
  priorTurnEvidence,readMain,readPinnedDocument,sourcePacket=null,ownerOutcome='NOT_INVOKED'}={}){
 const stop=(edge,trace=[],invoked=false)=>Object.freeze({ok:false,kind:'STOP',edge,
   trace:Object.freeze([...trace]),original_owner_invoked:invoked,
   native_event_attested:false,authority:0,
   bridge_evidence:describeC72BridgeEvidence(trace)});
 const trace=[];
 if(humanMessage!=='I ACCEPT'||freshHumanTurn!==true)
  return stop('C72_EXACT_NEW_CONSENT_REQUIRED');
 if(ownerOutcome!=='NOT_INVOKED')return stop(ownerOutcome==='UNKNOWN'?
  'C72_OWNER_OUTCOME_UNKNOWN':'C72_OWNER_ALREADY_ATTEMPTED');
 const w=priorTurnEvidence;
 const names=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
 const sha=/^[a-f0-9]{40}$/u;
 if(!sha.test(w?.source_head||'')||w?.host_link_displayed!==true||
  w?.distinct_human_message_observed!==true||
  w?.terms_link!==`https://github.com/Luke883i/iKant_EDU/blob/${w.source_head}/TERMS.md`||
  !w?.pinned_blob_shas||names.some(n=>!sha.test(w.pinned_blob_shas[n]||'')))
  return stop('C72_ORIENTATION_WITNESS_MISSING');
 // Running in Node proves the Node capability, not connector reachability.
 const major=Number(process.versions.node.split('.')[0]);
 trace.push('VERIFY_NODE_20');
 if(!Number.isInteger(major)||major<20)return stop('C72_NODE_UNAVAILABLE_VERIFIED',trace);
 const {bindC72Transport}=await import('./project-c72-capability-port.mjs');
 const bound=bindC72Transport({sourceHead:w.source_head,readMain,readPinnedDocument,sourcePacket});
 if(!bound.ok)return stop(bound.edge,trace);
 trace.push('VERIFY_PINNED_API_TRANSPORT');
 trace.push('TRANSPORT:'+bound.kind);
 let liveHead;
 try{liveHead=await bound.readMain();}catch{return stop('C72_HEAD_READ_OUTCOME_UNKNOWN',trace);}
 if(!sha.test(liveHead||''))return stop('C72_HEAD_READ_INVALID',trace);
 if(liveHead!==w.source_head)return stop('STOP_SOURCE_LOCK_STALE',trace);
 const documents=[];
 for(const path of names){
  let d;
  try{d=await bound.readPinnedDocument(path,w.source_head);}catch{
   return stop('C72_SOURCE_READ_OUTCOME_UNKNOWN:'+path,trace);
  }
  if(!d||d.path!==path||d.source_head!==w.source_head||
    typeof d.content!=='string'||d.blob_sha1!==w.pinned_blob_shas[path])
   return stop('C72_PINNED_DOCUMENT_BLOB_INVALID:'+path,trace);
  // Reentry recomputes Git blob identity from exact UTF-8 bytes.
  documents.push({path,source_head:w.source_head,content:d.content,blob_sha1:d.blob_sha1});
  trace.push('READ_PINNED:'+path);
 }
 trace.push('INVOKE_PINNED_C72_POSTACCEPT_REENTRY');
 let reentry;
 try{
  const owner=await import('./project-c72-postaccept-reentry.mjs');
  reentry=owner.reenterC72V2PostAccept({sourceHead:w.source_head,liveHead,
    humanMessage,priorTurnEvidence:w,documents});
  if(reentry.ok!==true)return stop(reentry.first_edge||'C72_ORIGINAL_OWNER_FAILED',trace,reentry.original_owner_invoked===true);
  const validators=await import('./c72-public-mode-admission.mjs');
  if(!validators.validateC72V2Accepted(reentry.accepted)||
     !validators.validateC72V2Orientation(reentry.introduction,reentry.accepted))
   return stop('C72_ORIGINAL_RECEIPT_READBACK_FAILED',trace,true);
 }catch{return stop('C72_OWNER_OUTCOME_UNKNOWN',trace,null);}
 return Object.freeze({ok:true,kind:'C72_ORIGINAL_POSTACCEPT_VERIFIED',
  trace:Object.freeze(trace),source_head:w.source_head,accepted:reentry.accepted,
  introduction:reentry.introduction,original_owner_invoked:true,
  transport_kind:bound.kind,source_origin_attested:false,
  native_event_attested:false,active:false,authority:0,
  bridge_evidence:describeC72BridgeEvidence(trace)});
}
