/** E12 Host focus delivery over ORIGINAL C72/E9 and C135/C87/E10.
 * No native client widget, model identity, second writer or consent authority.
 */
import {materializeOneShellFocusApp} from './project-oneshell-focus-app.mjs';
import {makeOneShellChatPresentation} from './project-oneshell-chat-presentation.mjs';
const stop=edge=>Object.freeze({ok:false,edge,voice:'NO_VOICE',native_ui_attested:false,persistent_ui_attested:false,authority:0,active:false});
const phaseName=n=>'turn-'+String(n).padStart(6,'0');
/** After real C72 acceptance, the original E9 owner supplies A=NO_VOICE. */
export async function projectPostAcceptFocusApp({phase,outputDirectory,reportName='admission',...source}={}){
 if(!['ACCEPTED','EDU_SELECTED','SOURCE_HANDOFF','MATERIALIZED','EDU_READY','OWNER_TURN','RECOVERED_TURN','STOP'].includes(phase))
  return stop('FOCUS_ORIGINAL_PHASE_INVALID');
 try{
  const {projectPostAcceptOneShell}=await import('./project-oneshell-postaccept-rail.mjs');
  const rail=projectPostAcceptOneShell({phase,...source,format:'TEXT'});
  if(rail?.ok!==true)return stop(rail?.edge||'FOCUS_E9_RAIL_REJECTED');
  const app=materializeOneShellFocusApp({frame:rail.frame,outputDirectory,reportName});
  if(app.ok!==true)return stop(app.edge);
  const chat=makeOneShellChatPresentation({frame:rail.frame,focusApp:app});
  if(chat.ok!==true)return stop(chat.edge);
  return Object.freeze({ok:true,phase,frame:rail.frame,focus_app:app,chat_presentation:chat,
   original_c72_acceptance_sha256:rail.original_c72_acceptance_sha256,
   native_ui_attested:false,persistent_ui_attested:false,authority:0,active:false});
 }catch{return stop('FOCUS_POSTACCEPT_ORIGINAL_UNAVAILABLE');}
}
/** One original E10 session; render exactly one focus app after each verified turn. */
export async function openFocusOneShellSession({outputDirectory,readyName='edu-ready',...source}={}){
 let original;
 try{
  const {openContinuousOneShell}=await import('./project-oneshell-continuous.mjs');
  original=await openContinuousOneShell(source);
  if(original?.ok!==true)return stop(original?.edge||'FOCUS_E10_NOT_READY');
  let count=original.count(),blocked=false;
  if(!Number.isSafeInteger(count)||count<0){original.close();return stop('FOCUS_ORIGINAL_C87_COUNT_INVALID');}
  const uniqueReadyName=count===0?readyName:readyName+'-rebind-'+String(count).padStart(6,'0');
  const ready=materializeOneShellFocusApp({frame:original.frame,outputDirectory,reportName:uniqueReadyName});
  if(ready.ok!==true){original.close();return stop(ready.edge);}
  const chatReady=makeOneShellChatPresentation({frame:original.frame,focusApp:ready});
  if(chatReady.ok!==true){original.close();return stop(chatReady.edge);}
  async function publishHumanTurn(args){
   if(blocked)return stop('FOCUS_UNKNOWN_WRITE_NO_RETRY');
   let result;try{result=await original.publishHumanTurn(args);}catch{blocked=true;return stop('FOCUS_TURN_UNKNOWN_NO_RETRY');}
   if(result?.ok!==true)return stop(result?.edge||'FOCUS_ORIGINAL_OWNER_STOP');
   if(result.original_c87_count!==count+1||!result.frame){blocked=true;return stop('FOCUS_C87_RECONCILIATION_REQUIRED');}
   const app=materializeOneShellFocusApp({frame:result.frame,outputDirectory,reportName:phaseName(result.original_c87_count)});
   if(app?.ok!==true){blocked=true;return stop(app?.edge||'FOCUS_REPORT_READBACK_REQUIRED');}
   const chat=makeOneShellChatPresentation({frame:result.frame,humanInput:args?.humanInput,focusApp:app});
   if(chat.ok!==true){blocked=true;return stop(chat.edge);}
   count=result.original_c87_count;
   return Object.freeze({...result,focus_app:app,chat_presentation:chat,original_voice_preserved:true,
    native_ui_attested:false,persistent_ui_attested:false,provider_delivery_attested:false,authority:0,active:false});
  }
  return Object.freeze({ok:true,schema:'ikant-host-focus-session/v1',focus_ready:ready,chat_ready:chatReady,
   original_c87_count:()=>count,publishHumanTurn,status:()=>original.status(),
   close:()=>original.close(),authority:0,active:false,native_ui_attested:false,persistent_ui_attested:false});
 }catch{try{original?.close();}catch{}return stop('FOCUS_SESSION_OUTCOME_UNKNOWN');}
}
