import crypto from 'node:crypto';
import {createC109ChatShell} from './c109-chat-shell.mjs';
import {inspectC107Ledger} from './c107-experimental-turn.mjs';
const S='ikant-le-c111-host-edge/v1';
const H=x=>crypto.createHash('sha256').update(Buffer.from(x,'utf8')).digest('hex');
const stops=e=>({schema:S,status:'C111_STOP',surface_a:null,surface_b:{first_unclosed_edge:e},
 active:false,native_delivery_attested:false,native_host_hook_attested:false});
const operations=new Set(['CAPABILITIES','ACTIVATE','MESSAGE','STATUS','REVOKE','EXIT']);
export function createC111HostEdge({sourceHead,ledgerFile,languagePort,relayPort,allowSynthetic=false}={}){
 const shell=createC109ChatShell({sourceHead,ledgerFile,languagePort,relayPort,allowSynthetic});
 const sessionId=crypto.randomUUID();
 let ended=false;
 async function dispatch(f){
  if(!f||typeof f!=='object'||Array.isArray(f)||!operations.has(f.op)||
   Object.keys(f).some(k=>!['op','text','hostDraft','candidate','nonce'].includes(k)))
   return stops('C111_TYPED_HOST_FRAME_REQUIRED');
  if(f.op!=='MESSAGE'&&['text','hostDraft','candidate','nonce'].some(k=>Object.hasOwn(f,k)))
   return stops('C111_CONTROL_FRAME_NO_USER_DATA');
  if(f.op==='CAPABILITIES')return {schema:S,status:'C111_CURRENT_NODE_PROCESS_OBSERVED',
   source_head:sourceHead,session_id:sessionId,phase:shell.phase,
   node_process_running:true,c109_original_modules_imported:true,original_c70_executed_in_probe:false,
   model_callback_callable:typeof languagePort?.generate==='function',
   synthetic_allowed_by_host:allowSynthetic===true,
   native_host_hook_attested:false,native_delivery_attested:false,source_origin_attested:false,active:false};
  if(ended)return stops('C111_SESSION_ALREADY_CLOSED');
  if(f.op==='STATUS')return {schema:S,status:'C111_LOCAL_PHASE_ONLY',phase:shell.phase,
   session_id:sessionId,active:false,native_delivery_attested:false};
  const text=f.op==='ACTIVATE'?'attiva iKant':f.op==='REVOKE'?'STOP BOZZE COHOST':
   f.op==='EXIT'?'ESCI LAB':f.text;
  if(typeof text!=='string'||!text.trim()||Buffer.byteLength(text,'utf8')>600)
   return stops('C111_BOUNDED_INPUT_REQUIRED');
  if(f.nonce!==undefined&&!/^[A-Za-z0-9_-]{12,96}$/.test(f.nonce))
   return stops('C111_NONCE_INVALID');
  if(f.op==='MESSAGE'&&f.candidate!==undefined&&
   (f.candidate?.input_sha256!==H(text)||typeof f.candidate?.text!=='string'||
    !f.candidate.text.trim()||Object.keys(f.candidate).sort().join(',')!=='input_sha256,text'))
   return stops('C111_CANDIDATE_INPUT_MISMATCH');
  const result=await shell.send({text,nonce:f.nonce||crypto.randomUUID(),
   candidate:f.candidate,hostDraft:f.hostDraft});
  if(result?.schema!=='ikant-le-c109-chat-shell/v1'||!result.surface_b)
   return stops('C111_C109_RUNTIME_OUTPUT_MISSING');
  const grade=result.status==='C109_VERIFIED_LOCAL_VOICE_NOT_NATIVE'?'ORIGINAL_LOCAL':
   result.status==='C109_SYNTHETIC_HOST_DRAFT_NOT_IKANT_RUNTIME'?'HOST_SYNTHETIC':'CONTROL_OR_STOP';
  if(grade==='ORIGINAL_LOCAL'){
   const ledger=inspectC107Ledger(ledgerFile),e=result.surface_b.evidence;
   if(!e||ledger.status!=='C107_LEDGER_REOPENED'||ledger.last_hash!==e.ledger_event_sha256||
    ledger.latest_state?.visible_voice_sha256!==H(result.surface_a)||e.output_sha256!==H(result.surface_a)||
    e.original_c70_executed!==true||e.original_c100_bound!==true||e.original_c87_reopened!==true)
    return stops('C111_C87_CURRENT_TURN_REOPEN_NOT_MATCHED');
  }
  if(grade==='HOST_SYNTHETIC'&&(!result.surface_a?.startsWith('[BOZZA HOST SPERIMENTALE - C70/C87 NON ESEGUITI]')||
   result.surface_b.evidence?.visible_voice_sha256!==H(result.surface_a)||
   result.surface_b.evidence?.c70_original_executed!==false||
   result.surface_b.evidence?.C87_writer_invoked!==false))
   return stops('C111_SYNTHETIC_TRUTH_GRADE_MISMATCH');
  if(result.status==='C109_LOCAL_SESSION_CLOSED')ended=true;
  return {...result,host_edge_schema:S,host_edge_grade:grade,
   host_session_id:sessionId,native_host_hook_attested:false};
 }
 return Object.freeze({dispatch});
}
