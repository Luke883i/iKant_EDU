/** HOST OneShell after I ACCEPT. Reprojects original C72/C135 only, never replays them.
 * A private original WeakSet in renderOneShell rejects serialized/fabricated voice.
 * Native ChatGPT widget persistence is not implied by the visible shell. */
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {reopenC87Ledger} from './c87-durable-ledger.mjs';
import {validateC72V2Accepted,validateC72V2Orientation,validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';
import {oneShellAccepted,oneShellSelected,oneShellMaterialized} from './project-oneshell-phases.mjs';
import {oneShellFrame,renderOneShell} from './project-oneshell-edu.mjs';
import {emitVerifiedHostOneShell} from './project-oneshell-emission.mjs';
import {classifyPostAcceptRail,RAIL_HUMAN_PHASE} from './project-oneshell-rail-core.mjs';
const H40=/^[0-9a-f]{40}$/u,H64=/^[0-9a-f]{64}$/u;
const hash=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const denied=edge=>Object.freeze({ok:false,edge,frame:oneShellFrame({esito:'BLOCCATO',
 b:'Non posso attestare questa fase senza i proprietari originali e i loro riscontri.',
 prova:'NESSUNA NUOVA RICEVUTA',edge,next:'STOP'}),active:false,native_ui_attested:false,
 provider_persistence_attested:false,authority:0});
export function projectPostAcceptOneShell({phase,sourceHead,liveHead,accepted,introduction,selection=null,
 sourceRoot=null,sourceTree=null,sourceFrame=null,ownerSession=null,ownerFrame=null,
 turnNonce=null,turnInput=null,checkpoint=null,recoveryWitness=null,format='TEXT'}={}){
 try{
  if(!H40.test(sourceHead||'')||!H40.test(liveHead||'')||sourceHead!==liveHead)
   return denied(sourceHead!==liveHead?'STOP_SOURCE_LOCK_STALE':'RAIL_SOURCE_HEAD_UNVERIFIED');
  if(!validateC72V2Accepted(accepted)||accepted.source_head!==sourceHead||
     !validateC72V2Orientation(introduction,accepted))return denied('RAIL_ORIGINAL_C72_ACCEPTANCE_REQUIRED');
  const modeOk=selection!==null&&validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead})&&
    selection.acceptance_receipt_sha256===accepted.receipt_sha256&&
    selection.orientation_receipt_sha256===introduction.receipt_sha256;
  if(phase!=='ACCEPTED'&&!modeOk)return denied('RAIL_ORIGINAL_EDU_SELECTION_REQUIRED');
  let frame=null,verifiedSource=false,ownerReady=false,originalC125S03=false;
  let independentC87Readback=false,sameTurnEvidence=false,originalPortableC87=false,workerLossWitness=false;
  if(phase==='ACCEPTED')frame=oneShellAccepted({accepted,orientation:introduction});
  else if(phase==='EDU_SELECTED')frame=oneShellSelected({selection,accepted,orientation:introduction});
  else if(phase==='SOURCE_HANDOFF'){
   renderOneShell(sourceFrame);
   if(sourceFrame.voice_origin!=='NO_VOICE'||!['VERIFY_SOURCE','VERIFY_MACHINE_BRIDGE',
     'API_TREE_SOURCE_MATERIALIZATION','UPLOAD_PINNED_SOURCE_ZIP','STOP'].includes(sourceFrame.slots.NEXT))
    return denied('RAIL_SOURCE_FRAME_NOT_HOST_ADVISORY');
   frame=sourceFrame;
  }else if(phase==='MATERIALIZED'){
   frame=oneShellMaterialized({selection,sourceRoot,head:sourceHead,tree:sourceTree});
   verifiedSource=frame.slots.NEXT==='START_C135_EDU';
  }else if(['EDU_READY','OWNER_TURN','RECOVERED_TURN'].includes(phase)){
   const state=ownerSession?.readSessionState?.(),status=ownerSession?.status?.();
   ownerReady=ownerSession?.ok===true&&ownerSession?.runtime_ready===true&&
    status?.closed===false&&status?.uncertain===false&&state?.owner==='C135_EDU_V2'&&
    state.source_head===sourceHead&&H40.test(state.source_tree||'')&&
    state.selection_receipt_sha256===selection.receipt_sha256&&
    state.original_c87_readback?.status==='C107_LEDGER_REOPENED';
   verifiedSource=ownerReady&&(!sourceTree||state.source_tree===sourceTree);
   if(phase==='EDU_READY'){
    if(!ownerReady)return denied('RAIL_ORIGINAL_C135_READY_REQUIRED');
    frame=ownerSession.frame;renderOneShell(frame);
    if(frame.voice_origin!=='NO_VOICE'||frame.slots.NEXT!=='AWAIT_HUMAN_INPUT')
     return denied('RAIL_READY_FRAME_INVALID');
   }else{
    renderOneShell(ownerFrame);
    frame=ownerFrame;
    const evidence=ownerSession?.getLastEvidence?.(),led=state?.original_c87_readback;
    const c125=evidence?.original_c125_utf8;
    originalC125S03=frame.voice_origin==='HOST_BOUND_LOCAL'&&frame.slots.A!=='NO_VOICE'&&
      frame.original_voice_sha256===hash(frame.slots.A)&&
      typeof c125==='string'&&evidence.original_c125_sha256===hash(c125)&&
      c125.includes('<<<VOICE_UTF8_START>>>\n'+frame.slots.A+'\n<<<VOICE_UTF8_END>>>');
    independentC87Readback=ownerReady&&led?.count>=1&&led.count===evidence?.original_c87_readback?.count&&
      led.last_hash===evidence?.original_c87_readback?.last_hash;
    // Original C87 stores the input hash in the LEDGER EVENT, not in latest_state.
    // Reopen the original ledger and check its final complete event, never infer it.
    let lastEvent=null,independent=null;
    try{
     independent=reopenC87Ledger(state.ledger_file);
     const rows=fs.readFileSync(state.ledger_file,'utf8');
     if(rows.endsWith('\n'))lastEvent=JSON.parse(rows.trimEnd().split('\n').at(-1));
    }catch{}
    sameTurnEvidence=typeof turnNonce==='string'&&turnNonce.length>=12&&
      typeof turnInput==='string'&&!!turnInput.trim()&&
      independent?.status==='C87_LEDGER_CHAIN_VALID'&&
      independent.count===led?.count&&independent.last_hash===led?.last_hash&&
      lastEvent?.record_sha256===led?.last_hash&&
      lastEvent?.source_head===sourceHead&&
      lastEvent?.state?.nonce===turnNonce&&lastEvent?.input_sha256===hash(turnInput);
    originalPortableC87=checkpoint?.schema==='ikant-le-c135-portable-c87/v1'&&
      checkpoint.source_head===sourceHead&&checkpoint.source_tree===state?.source_tree&&
      checkpoint.selection_receipt_sha256===selection.receipt_sha256&&
      checkpoint.expectedCount===led?.count&&checkpoint.expectedLastHash===led?.last_hash&&
      H64.test(checkpoint.ledger_sha256||'')&&hash(checkpoint.ledger_utf8)===checkpoint.ledger_sha256;
    workerLossWitness=recoveryWitness?.previousWorkerGone===true&&
      ownerSession?.recovered_original_ledger?.kind==='C87_LOCAL_COLD_REBIND_NOT_NATIVE'&&
      ownerSession.recovered_original_ledger.count===led?.count-1&&
      ownerSession.recovered_original_ledger.source_head===sourceHead;
   }
  }else if(phase==='STOP')frame=oneShellFrame({esito:'BLOCCATO',b:RAIL_HUMAN_PHASE.STOP,
   edge:'RAIL_EXTERNAL_STOP_OBSERVED',next:'STOP'});
  else return denied('RAIL_PHASE_INVALID');
  const cls=classifyPostAcceptRail({phase,sourceHead,liveHead,
   originalAcceptance:true,originalIntroduction:true,originalEduSelection:modeOk,
   verifiedSource,ownerReady,originalC125S03,independentC87Readback,sameTurnEvidence,
   originalPortableC87,workerLossWitness});
  if(cls.ok!==true)return denied(cls.edge);
  renderOneShell(frame);
  const projection=emitVerifiedHostOneShell(frame,{format});
  if(projection.ok!==true)return denied(projection.first_edge||'RAIL_RENDERER_UNAVAILABLE');
  const anchor=hash(sourceHead+'\0'+accepted.receipt_sha256+'\0'+introduction.receipt_sha256);
  return Object.freeze({ok:true,phase,frame,content:projection.content,
   render_format:projection.format,host_session_anchor_sha256:anchor,
   owner_evidence:cls.voice==='OWNER_ONLY',human_meaning:RAIL_HUMAN_PHASE[phase],
   original_source_head:sourceHead,original_c72_acceptance_sha256:accepted.receipt_sha256,
   original_c72_selection_sha256:modeOk?selection.receipt_sha256:null,
   original_c87_count:independentC87Readback?ownerSession.readSessionState().original_c87_readback.count:null,
   original_voice_sha256:cls.voice==='OWNER_ONLY'?frame.original_voice_sha256:null,
   native_ui_attested:false,provider_persistence_attested:false,
   native_delivery_attested:false,cross_chat_persistence_attested:false,authority:0,active:false});
 }catch{return denied('RAIL_OWNER_FRAME_OR_READBACK_UNVERIFIED');}
}
