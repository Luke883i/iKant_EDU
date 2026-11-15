import {isProxy} from 'node:util/types';
import {inspectC104,stageC104,qualifyC104C77Handoff} from './c104-resumable-materialization.mjs';
import {planC99PostSelectionTurn} from './c99-postselection-planner.mjs';
import {executeC102SoftTurn,inspectC102Ledger} from './c102-soft-host-bridge.mjs';
import {verifyC103HostAdapterWitness} from './c103-host-adapter-conformance.mjs';

// NERVA is a host-local control plane, never an iKant owner, source provider,
// native ChatGPT callback, user-event attestor or a second ledger writer.
const S='ikant-le-c105-nerva/v1';
const CMDS=new Set(['GET STATE','GET MISSING','GET NEXT','GET LEDGER','PUT BLOB','RUN TURN']);
const DENIAL=Object.freeze({authority:0,active:false,canonical_runtime:false,
 native_event_attested:false,native_delivery_attested:false,source_origin_attested:false,
 host_hook_attested:false,owner_receipt_issued:false});
const stop=(edge)=>Object.freeze({schema:S,status:'C105_STOP',
 first_unclosed_edge:edge,...DENIAL});
function descriptor(x,allowed){
 try{
  if(!x||typeof x!=='object'||isProxy(x)||Array.isArray(x)||
   Object.getPrototypeOf(x)!==Object.prototype)return null;
  const names=Reflect.ownKeys(x);
  if(names.some(k=>typeof k!=='string'||!allowed.includes(k)))return null;
  const out={};
  for(const key of allowed){
   const d=Object.getOwnPropertyDescriptor(x,key);
   if(d&&!Object.hasOwn(d,'value'))return null;
   out[key]=d?.value;
  }
  return out;
 }catch{return null;}
}
const COMMAND_KEYS=['command','context','ledgerFile','capsuleDir','manifestSha256',
 'nonce','request','filePath','contentBase64','carrierId'];
const snap=(op,s,extras={})=>Object.freeze({schema:S,status:'C105_OBSERVATION_NOT_EXECUTION',
 command:op,source_head:s.source_head,phase:s.status==='C104_SOURCE_BYTES_100PCT_NOT_RUNTIME'?
 'SOURCE_BYTES_100PCT_QUALIFICATION_PENDING':'SOURCE_MATERIALIZATION',
 verified:s.verified,total:s.total,completion_percent:s.completion_percent,
 source_byte_runtime_qualified:false,first_unclosed_edge:s.first_unclosed_edge,...extras,...DENIAL});
/** One bounded call. The human-readable command is NOT evaluated as shell,
 * SQL, JS or an arbitrary tool string. Input text lives in typed request only.
 * Caller must separately provide genuine host capabilities and exact sources.
 */
export async function dispatchC105Nerva(frame={}){
 const f=descriptor(frame,COMMAND_KEYS);
 if(!f||typeof f.command!=='string'||!CMDS.has(f.command))
  return stop('C105_FIXED_LEXICON_ONLY');
 const s=inspectC104(f.context);
 if(s.status==='C104_STOP')return stop(s.first_unclosed_edge||'C105_C104_ADMISSION');
 switch(f.command){
 case 'GET STATE':
  return snap(f.command,s,{compute_priority:s.compute_priority});
 case 'GET MISSING':
  return snap(f.command,s,{missing:s.missing,corrupt:s.corrupt});
 case 'GET NEXT':
  return snap(f.command,s,{next_batch:s.next_batch,
   next_action:s.status==='C104_SOURCE_BYTES_100PCT_NOT_RUNTIME'?
   'QUALIFY_ORIGINAL_C77_BEFORE_COGNITION':'PROVIDE_REAL_HOST_MEMBER_BYTES'});
 case 'GET LEDGER': {
  const r=inspectC102Ledger(f.ledgerFile);
  if(r.status!=='C102_LEDGER_REOPENED')return stop(r.first_unclosed_edge||'C105_LEDGER_REOPEN');
  return Object.freeze({schema:S,status:'C105_HOST_LEDGER_REOPENED_NOT_COGNITION',
   source_head:s.source_head,ledger_entries:r.count,ledger_last_hash:r.last_hash,
   latest_observation:r.latest_state,first_unclosed_edge:'NO_CURRENT_INPUT_COGNITION',...DENIAL});
 }
 case 'PUT BLOB': {
  if(s.status==='C104_SOURCE_BYTES_100PCT_NOT_RUNTIME')
   return stop('C105_SOURCE_ALREADY_COMPLETE');
  const r=stageC104({context:f.context,filePath:f.filePath,
   contentBase64:f.contentBase64,carrierId:f.carrierId});
  if(r.status==='C104_STOP')return stop(r.first_unclosed_edge||'C105_BLOB_STAGE');
  return Object.freeze({schema:S,status:'C105_SOURCE_STAGE_LOCAL_REOPENED',
   source_head:r.source_head,verified:r.verified,total:r.total,
   stage:r.stage,completion_percent:r.completion_percent,
   next_batch:r.next_batch,phase:r.status==='C104_SOURCE_BYTES_100PCT_NOT_RUNTIME'?
   'SOURCE_BYTES_100PCT_QUALIFICATION_PENDING':'SOURCE_MATERIALIZATION',
   first_unclosed_edge:r.first_unclosed_edge,...DENIAL});
 }
 case 'RUN TURN': {
  if(s.status!=='C104_SOURCE_BYTES_100PCT_NOT_RUNTIME')
   return stop('C105_SOURCE_100PCT_REQUIRED');
  const q=descriptor(f.request,['sourceHead','selection','humanInput','optIn',
   'modelCandidate','relevanceCase','relevanceCaseSha256']);
  if(!q||q.sourceHead!==s.source_head||q.optIn!==true||
   q.selection?.receipt_sha256!==f.context?.selection?.receipt_sha256)
   return stop('C105_SOURCE_SELECTION_OR_OPTIN');
  // A C99 hint is NOT attestation. It merely prevents silent route escalation.
  const plan=planC99PostSelectionTurn({sourceHead:q.sourceHead,selection:q.selection,
   humanInput:q.humanInput,cohostOptInObserved:true,cohostRevoked:false,
   carrierHints:['C102'],previousFailedRoute:'NONE',failedEvidenceChanged:false});
  if(plan.status!=='C99_PLAN_ONLY_NOT_EXECUTED'||plan.route!=='C102')
   return stop(plan.first_unclosed_edge||'C105_POSTSELECTION_ROUTE');
  // This qualifier invokes the ORIGINAL C77 kernel on the current exact input.
  const qualified=await qualifyC104C77Handoff({context:f.context,
   capsuleDir:f.capsuleDir,manifestSha256:f.manifestSha256,humanInput:q.humanInput});
  if(qualified.status!=='C104_ORIGINAL_C77_LOCAL_COGNITION_EXECUTED')
    return stop(qualified.first_unclosed_edge||'C105_ORIGINAL_CAPSULE_COGNITION');
  const r=executeC102SoftTurn({ledgerFile:f.ledgerFile,nonce:f.nonce,request:f.request});
  if(r.status!=='C102_ORIGINAL_C101_C87_LOCAL_READBACK')
   return stop(r.first_unclosed_edge||'C105_C102_ORIGINAL_LOCAL_EXECUTION');
  if(qualified.input_sha256!==r.input_sha256)
   return stop('C105_C77_C102_INPUT_DRIFT');
  const ledger=inspectC102Ledger(f.ledgerFile);
  if(ledger.status!=='C102_LEDGER_REOPENED')
   return stop(ledger.first_unclosed_edge||'C105_C87_REOPEN');
  const witness=verifyC103HostAdapterWitness({request:f.request,nonce:f.nonce,
   receipt:r,inspection:ledger});
  if(witness.status!=='C103_ENVELOPE_CONFORMANT_NOT_HOST_ATTESTED'||
   witness.voice_utf8!==r.voice_utf8)
   return stop(witness.first_unclosed_edge||'C105_C103_READBACK');
  return Object.freeze({schema:S,status:'C105_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED',
   command:f.command,source_head:s.source_head,phase:'LOCAL_COGNITIVE_READBACK_NOT_NATIVE_DELIVERED',
   voice_utf8:r.voice_utf8,input_sha256:r.input_sha256,output_sha256:r.output_sha256,
   c77_status:qualified.c77_status,c70_status:r.c70_status,c71_status:r.c71_status,
   c102_status:r.status,c103_status:witness.status,c87_status:ledger.status,
   ledger_entries:ledger.count,ledger_event_sha256:ledger.last_hash,
   actual_local_kernel_invoked:true,local_observation_ledger_reopened:true,
   host_execution_independently_attested:false,
   first_unclosed_edge:'HOST_NATIVE_AUTOMATIC_DISPATCH_AND_DELIVERY_NOT_ATTESTED',...DENIAL});
 }
 }
 return stop('C105_UNHANDLED_COMMAND');
}
