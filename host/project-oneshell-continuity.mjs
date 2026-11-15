/** HOST-only OneShell presentation continuity, authority 0.
 * No native message authentication, provider persistence, or new iKant state owner.
 * An exit ticket is valid only while its issuing process and original owner remain
 * available. A serialized HOST ticket cannot resurrect or authenticate an exit.
 */
import {validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';
import {classifyOneShellHumanDestination} from './project-oneshell-host-boundary.mjs';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const H40=/^[a-f0-9]{40}$/u;
const exits=new WeakMap(),pendingExit=new WeakMap(),managedOwners=new WeakSet();
export const IKANT_EXIT_WARNING="ATTENZIONE: L'INFRASTRUTTURA IKANT VERRA CHIUSA";
export const IKANT_EXIT_CONFIRM='CONFERMO EXIT IKANT';
export const IKANT_EXIT_CANCEL='ANNULLA EXIT IKANT';
const stopped=edge=>Object.freeze({kind:'STOP',shell:'ONESHELL',edge,next:'STOP'});
const goodOwnerReadback=(x,selection,head)=>x?.owner==='C135_EDU_V2'&&
 x.source_head===head&&x.selection_receipt_sha256===selection.receipt_sha256&&
 x.original_c87_readback?.status==='C107_LEDGER_REOPENED';
export function projectOneShellContinuation({selection,sourceHead,liveHead,ownerStatus,
 originalSession=null,humanInput,humanMessageObserved=false,exitReadback=null}={}){
 if(!H40.test(sourceHead||'')||!H40.test(liveHead||''))return stopped('SOURCE_LOCK_NOT_ATTESTED');
 if(sourceHead!==liveHead)return stopped('STOP_SOURCE_LOCK_STALE');
 if(!validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead}))
  return stopped('C72_EDU_SELECTION_REQUIRED');
 if(!ownerStatus||typeof ownerStatus!=='object'||ownerStatus.uncertain===true)
  return stopped('EDU_OWNER_STATUS_UNCERTAIN');
 if(ownerStatus.closed===true){
  // Caller-written JSON, status flags and cached receipt hashes are not enough.
  const witnessed=exitReadback&&exits.get(exitReadback);
  if(witnessed?.originalSession===originalSession&&originalSession!==null&&
    witnessed.sourceHead===sourceHead&&witnessed.selectionSha===selection.receipt_sha256&&
    exitReadback?.human_input==='EXIT IKANT'&&
    exitReadback?.human_confirmation===IKANT_EXIT_CONFIRM&&
    exitReadback?.worker_termination_attested===true&&
    exitReadback?.host_observed_human_message===true&&
    exitReadback?.source_head===sourceHead&&exitReadback?.closed===true&&
    exitReadback?.original_owner==='C135_EDU_V2'&&
    originalSession.status().closed===true)
   return Object.freeze({kind:'EXIT_CONFIRMED',shell:'HOST_CHATGPT',edge:'NONE',
     next:'HOST_CHATGPT_NEXT_TURN'});
  return stopped('EDU_OWNER_CLOSED_WITHOUT_VERIFIED_HUMAN_EXIT');
 }
 if(ownerStatus.closed!==false||ownerStatus.busy===true)return stopped('EDU_OWNER_NOT_STABLE');
 if(humanInput==='EXIT IKANT'){
  if(humanMessageObserved!==true)return stopped('HUMAN_EXIT_EVENT_NOT_OBSERVED');
  return Object.freeze({kind:'REQUEST_EXIT_CONFIRMATION',shell:'ONESHELL',
    warning:IKANT_EXIT_WARNING,confirmation_exact:IKANT_EXIT_CONFIRM,
    cancel_exact:IKANT_EXIT_CANCEL,edge:'HUMAN_EXIT_CONFIRMATION_PENDING',
    next:'AWAIT_EXACT_EXIT_CONFIRMATION'});
 }
 return Object.freeze({kind:'CONTINUE',shell:'ONESHELL',edge:'NONE',
   next:'ROUTE_USING_LIVE_ORIGINAL_OWNER'});
}
export async function closeOneShellOnHumanExit({selection,sourceHead,liveHead,
 humanInput,humanMessageObserved=false,originalSession,evidenceFile=null,
 workerSupervisor=null}={}){
 let status, ownerReadback;
 try{status=originalSession?.status?.()}catch{return Object.freeze({ok:false,shell:'ONESHELL',edge:'ORIGINAL_OWNER_STATUS_READ_UNKNOWN'});}
 if(!H40.test(sourceHead||'')||sourceHead!==liveHead)
  return Object.freeze({ok:false,shell:'ONESHELL',edge:'STOP_SOURCE_LOCK_STALE'});
 if(!validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead}))
  return Object.freeze({ok:false,shell:'ONESHELL',edge:'C72_EDU_SELECTION_REQUIRED'});
 const pending=pendingExit.get(originalSession);
 if(humanInput!==IKANT_EXIT_CONFIRM||humanMessageObserved!==true||
  pending?.sourceHead!==sourceHead||pending?.selectionSha!==selection.receipt_sha256)
  return Object.freeze({ok:false,shell:'ONESHELL',edge:'TWO_DISTINCT_HUMAN_MESSAGES_REQUIRED'});
 if(status?.closed!==false||status.busy===true||status.uncertain===true)
  return Object.freeze({ok:false,shell:'ONESHELL',edge:'ORIGINAL_OWNER_NOT_STABLE'});
 if(originalSession?.owner!=='C135_EDU_V2'||typeof originalSession.close!=='function'||
    typeof originalSession.readSessionState!=='function')
  return Object.freeze({ok:false,shell:'ONESHELL',edge:'ORIGINAL_EDU_OWNER_REQUIRED'});
 if(evidenceFile!==null&&(typeof evidenceFile!=='string'||evidenceFile.length===0||
    fs.existsSync(evidenceFile)))
  return Object.freeze({ok:false,shell:'ONESHELL',edge:'FRESH_EXIT_EVIDENCE_DESTINATION_REQUIRED'});
 try{ownerReadback=originalSession.readSessionState()}catch{}
 if(workerSupervisor?.dedicated!==true||
  typeof workerSupervisor.terminate!=='function'||typeof workerSupervisor.readback!=='function')
  return Object.freeze({ok:false,shell:'ONESHELL',edge:'DEDICATED_WORKER_SUPERVISOR_REQUIRED'});
 if(!goodOwnerReadback(ownerReadback,selection,sourceHead))
  return Object.freeze({ok:false,shell:'ONESHELL',edge:'ORIGINAL_C87_READBACK_BEFORE_EXIT_REQUIRED'});
 pendingExit.delete(originalSession); // one shot before any close or worker action
 try{
  // One shot. On any ambiguous result STOP, never invoke close again.
  await originalSession.close();
  const after=originalSession.status();
  if(after?.closed!==true||after.uncertain===true||after.busy===true)
   return Object.freeze({ok:false,shell:'ONESHELL',edge:'ORIGINAL_C135_EXIT_READBACK_NOT_CONFIRMED'});
  await workerSupervisor.terminate({source_head:sourceHead,original_owner:originalSession.owner});
  const worker=await workerSupervisor.readback();
  if(worker?.dedicated!==true||worker?.terminated!==true||worker?.verified!==true)
   return Object.freeze({ok:false,shell:'ONESHELL',edge:'DEDICATED_WORKER_TERMINATION_NOT_ATTESTED'});
  const ticket=Object.freeze({schema:'ikant-le-host-exit-projection/v3',
   human_input:'EXIT IKANT',human_confirmation:IKANT_EXIT_CONFIRM,
   worker_termination_attested:true,
   host_observed_human_message:true,source_head:sourceHead,
   selection_receipt_sha256:selection.receipt_sha256,closed:true,
   original_owner:'C135_EDU_V2',same_local_owner_reference:true,
   native_event_attested:false,provider_persistence_attested:false,authority:0});
  const bytes=JSON.stringify(ticket);
  if(evidenceFile!==null){
   fs.writeFileSync(evidenceFile,bytes,{flag:'wx',mode:0o600});
   if(fs.readFileSync(evidenceFile,'utf8')!==bytes)
    return Object.freeze({ok:false,shell:'ONESHELL',edge:'EXIT_EVIDENCE_READBACK_FAILED'});
  }
  exits.set(ticket,{originalSession,sourceHead,selectionSha:selection.receipt_sha256});
  const next=projectOneShellContinuation({selection,sourceHead,liveHead,
   ownerStatus:after,originalSession,exitReadback:ticket});
  if(next.kind!=='EXIT_CONFIRMED')
   return Object.freeze({ok:false,shell:'ONESHELL',edge:'ORIGINAL_C135_EXIT_RECONCILIATION_FAILED'});
  return Object.freeze({ok:true,shell:'HOST_CHATGPT',exit:'OWNER_CLOSED_AND_DEDICATED_WORKER_TERMINATED',
   origin:'HOST_OBSERVED_HUMAN_MESSAGE_NOT_NATIVE',native_event_attested:false,
   persistent_ui_attested:false,exitReadback:ticket,
   evidence_sha256:createHash('sha256').update(bytes).digest('hex'),
   evidence_file:evidenceFile,next:'HOST_CHATGPT_NEXT_TURN'});
 }catch{return Object.freeze({ok:false,shell:'ONESHELL',
   edge:'ORIGINAL_C135_OR_WORKER_KILL_OUTCOME_UNKNOWN_RECONCILE_READ_ONLY'});}
}

/** Bind the original running C135 session without exposing its close() method.
 * The HOST supplies a fresh main HEAD reader and a newly observed message for
 * each route call. This is an in-process gate, not a native ChatGPT hook.
 */
export function bindManagedOneShellEdu({selection,sourceHead,originalSession,readMain,
 workerSupervisor=null}={}){
 if(!validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead})||
    originalSession?.owner!=='C135_EDU_V2'||typeof originalSession.status!=='function'||
    typeof originalSession.readSessionState!=='function'||
    typeof originalSession.publishTurn!=='function'||typeof readMain!=='function')
  throw Error('MANAGED_ONESHELL_ORIGINAL_OWNER_REQUIRED');
 if(managedOwners.has(originalSession))throw Error('MANAGED_ONESHELL_OWNER_ALREADY_BOUND');
 managedOwners.add(originalSession);
 let disposition='ONESHELL',attemptedExit=false;
 async function routeHumanTurn({frame,humanMessageObserved=false,evidenceFile=null}={}){
  if(disposition!=='ONESHELL')return Object.freeze({ok:false,shell:disposition==='EXITED'?'HOST_CHATGPT':'ONESHELL',
   edge:disposition==='EXITED'?'IKANT_ALREADY_EXITED':'EDU_SESSION_UNCERTAIN_RECONCILE_READ_ONLY'});
  let liveHead;
  try{liveHead=await readMain();}catch{return Object.freeze({ok:false,shell:'ONESHELL',edge:'SOURCE_MAIN_READ_UNKNOWN'});}
  let status;
  try{status=originalSession.status();}catch{return Object.freeze({ok:false,shell:'ONESHELL',edge:'EDU_OWNER_STATUS_READ_UNKNOWN'});}
  const next=projectOneShellContinuation({selection,sourceHead,liveHead,ownerStatus:status,
   humanInput:frame?.humanInput,humanMessageObserved});
  if(next.kind==='STOP')return Object.freeze({ok:false,shell:'ONESHELL',edge:next.edge});
  if(typeof frame?.humanInput!=='string'||humanMessageObserved!==true)
   return Object.freeze({ok:false,shell:'ONESHELL',edge:'CURRENT_HUMAN_INPUT_REQUIRED'});
  const input=frame.humanInput,waiting=pendingExit.get(originalSession);
  if(waiting){
   if(input===IKANT_EXIT_CANCEL){pendingExit.delete(originalSession);
    return Object.freeze({ok:true,shell:'ONESHELL',kind:'EXIT_CANCELLED',edge:'NONE',next:'AWAIT_HUMAN_INPUT'});}
   if(input==='EXIT IKANT')return Object.freeze({ok:true,shell:'ONESHELL',...next});
   if(input!==IKANT_EXIT_CONFIRM)return Object.freeze({ok:false,shell:'ONESHELL',
    kind:'EXIT_CONFIRMATION_PENDING',warning:IKANT_EXIT_WARNING,
    edge:'HUMAN_EXIT_CONFIRMATION_PENDING',next:'AWAIT_EXACT_EXIT_CONFIRMATION'});
   if(attemptedExit)return Object.freeze({ok:false,shell:'ONESHELL',edge:'EXIT_ATTEMPT_ALREADY_RECORDED'});
   if(typeof evidenceFile!=='string'||!evidenceFile.length)
    return Object.freeze({ok:false,shell:'ONESHELL',edge:'EXIT_EVIDENCE_FILE_REQUIRED'});
   if(workerSupervisor?.dedicated!==true)return Object.freeze({ok:false,shell:'ONESHELL',
    edge:'DEDICATED_WORKER_SUPERVISOR_REQUIRED'});
   attemptedExit=true;
   const result=await closeOneShellOnHumanExit({selection,sourceHead,liveHead,
    humanInput:input,humanMessageObserved,originalSession,evidenceFile,workerSupervisor});
   disposition=result.ok===true?'EXITED':'UNKNOWN';
   return result;
  }
  if(input===IKANT_EXIT_CONFIRM||input===IKANT_EXIT_CANCEL)
   return Object.freeze({ok:false,shell:'ONESHELL',edge:'EXIT_CONFIRMATION_NOT_PENDING'});
  if(next.kind==='REQUEST_EXIT_CONFIRMATION'){
   pendingExit.set(originalSession,{sourceHead,selectionSha:selection.receipt_sha256});
   return Object.freeze({ok:true,shell:'ONESHELL',...next});
  }
  if(typeof frame?.humanInput!=='string'||humanMessageObserved!==true)
   return Object.freeze({ok:false,shell:'ONESHELL',edge:'CURRENT_HUMAN_INPUT_REQUIRED'});
  // A HOST request never consumes an iKant turn or generates a substitute voice.
  const hostGate=classifyOneShellHumanDestination(input);
  if(hostGate.target==='HOST_CHECKUP'||hostGate.target==='HOST_DOCUMENTATION')
   return Object.freeze({ok:true,shell:'ONESHELL',kind:hostGate.target,
     edge:hostGate.edge,next:'HOST_ONLY_NO_C87',owner_voice_attested:false});
  if(hostGate.target==='DENIED')return Object.freeze({ok:false,shell:'ONESHELL',
   edge:hostGate.edge,next:'STOP'});
  try{
   const result=await originalSession.publishTurn(frame);
   if(result?.slots?.A===undefined){disposition='UNKNOWN';return Object.freeze({ok:false,shell:'ONESHELL',edge:'ORIGINAL_EDU_TURN_OUTCOME_UNKNOWN'});}
   return Object.freeze({ok:true,shell:'ONESHELL',frame:result});
  }catch{disposition='UNKNOWN';return Object.freeze({ok:false,shell:'ONESHELL',edge:'EDU_TURN_OUTCOME_UNKNOWN_RECONCILE_READ_ONLY'});}
 }
 return Object.freeze({schema:'ikant-le-host-managed-edu-oneshell/v2',authority:0,
   getDisposition:()=>disposition,routeHumanTurn,
   native_delivery_attested:false,ui_persistence_attested:false});
}
