/** Host-owned, process-local integration example; P01-P04 are outcome contracts, not a recipe.
 * This module imports the PR118 consumer and invokes ONLY original C107/C87 owners.
 * Source provenance and human-native origin remain explicitly bounded. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {isProxy} from 'node:util/types';
import * as pr118 from './c107-carrier-consumer.mjs';
import {C124_SOURCE_EPOCH,stageC124Overlay} from './c124-source-overlay.mjs';
const C107_RELEASE=pr118.C107_RELEASE??pr118.PIN;
const HEAD=C107_RELEASE.source_head??C107_RELEASE.head;
const HANDOFF=C107_RELEASE.manual_source_url??C107_RELEASE.manual_url;
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');

const B=(first_edge,trace_ref=null,continuity='CONTINUITY_UNVERIFIED')=>({
 origin:'CHATGPT_HOST',authority:0,source_head:HEAD,TRACE_REF:trace_ref||'NOT_SAVED',
 CONTINUITY:continuity,FIRST_EDGE:first_edge,NEXT:first_edge==='NATIVE_CHATGPT_PER_TURN_DISPATCH'?'HOST_FIELD_QUALIFICATION':'MANUAL_SOURCE_HANDOFF',
 native_chatgpt_origin_attested:false,provider_origin_attested:false,canonical_active:false,
 PHASE:'HOST_LOCAL_EXPERIMENTAL',STATE:'NOT_ATTESTED',SOURCE_REF:HEAD,INPUT_REF:'NOT_ATTESTED',
 C70_PROOF:'NOT_ATTESTED',C100_PROOF:'NOT_ATTESTED',C87_PROOF:'NOT_ATTESTED',
 AUTHOR_ORIGIN:'UNKNOWN',HOST_CARRIER:'HOST_SUPPLIED_PINNED_BYTES',PROVIDER_PROOF:'NOT_ATTESTED',
 EVENT_REF:trace_ref||'NOT_ATTESTED',HOST_COMMENT:'Nessuna origine nativa ChatGPT attestata.',TECH_ARTIFACT:'NONE'
});
/** Reject hostile getters/proxies before any C72 or C107 original owner access. */
function safeData(v,depth=0){
 if(depth>12)return false;
 if(v===null||typeof v==='string'||typeof v==='boolean')return true;
 if(typeof v==='number')return Number.isFinite(v);
 if(typeof v!=='object'||isProxy(v))return false;
 // Never traverse arrays with .every(): indexed accessors can execute user code.
 if(Array.isArray(v)){
  if(v.length>100)return false;
  const ds=Object.getOwnPropertyDescriptors(v);
  for(let i=0;i<v.length;i++){
   const d=ds[i];if(!d||!Object.hasOwn(d,'value')||!safeData(d.value,depth+1))return false;
  }
  return Reflect.ownKeys(ds).every(k=>k==='length'||/^(?:0|[1-9][0-9]*)$/.test(String(k))&&Number(k)<v.length);
 }
 const proto=Object.getPrototypeOf(v);
 if(proto!==Object.prototype&&proto!==null)return false;
 const ds=Object.getOwnPropertyDescriptors(v),ks=Reflect.ownKeys(ds);
 return ks.length<=100&&ks.every(k=>typeof k==='string'&&!['__proto__','prototype','constructor'].includes(k)&&
  'value' in ds[k]&&safeData(ds[k].value,depth+1));
}
export function denyHostTurn(edge){return {schema:'ikant-edu-cohost-surface/v1',surface_a:{origin:'NO_VOICE',voice_utf8:null},surface_b:B(edge),manual_source_url:HANDOFF};}
/** The host may choose any transport; this Node implementation expects already-real bytes. */
export async function createLocalCohostAdapter({carrierBytes,privateParent=os.tmpdir(),c124OverlayBytes=null}={}){
 const proof=pr118.inspectC107Carrier(carrierBytes);
 if(!proof.ok)return {ok:false,first_edge:proof.first_unclosed_edge,blocked:denyHostTurn('P01_CARRIER_BYTES_UNVERIFIED')};
 const stage=await pr118.stageC107Carrier(carrierBytes,{privateParent,parent:privateParent});
 if(!stage.ok)return {ok:false,first_edge:stage.first_unclosed_edge,blocked:denyHostTurn('P01_STAGE_REOPEN_FAILED')};
 const overlay=c124OverlayBytes===null?null:stageC124Overlay(stage.install_root,c124OverlayBytes);
 if(overlay&&!overlay.ok){fs.rmSync(stage.install_root,{recursive:true,force:true});return {ok:false,first_edge:overlay.first_edge,blocked:denyHostTurn(overlay.first_edge)};}
 const sourceHead=overlay?C124_SOURCE_EPOCH:HEAD;
 const root=stage.install_root,ledgerDir=path.join(root,'.ikant-host');
 fs.mkdirSync(ledgerDir,{mode:0o700});
 const ledger=path.join(ledgerDir,'c107-observations.jsonl');
 const c107=await import(pathToFileURL(path.join(root,'host/c107-experimental-turn.mjs')).href);
 const c72=await import(pathToFileURL(path.join(root,'host/c72-unified-mode-admission.mjs')).href);
 let closed=false,attempts=0,lastFailure=null;
 function blocked(edge){return denyHostTurn(edge)}
 function runTurn(frame={}){
  if(closed)return blocked('ADAPTER_CLOSED');
  if(!safeData(frame))return blocked('HOST_FRAME_GETTER_PROXY_OR_SHAPE');
  const {humanInput,nonce,selection,priorMessages=[],resetContext=false,modelCandidate,authorization,expectedC124ChannelSha256}=frame;
  if(!authorization||authorization.human_mode_selected!==true||authorization.opt_in_confirmed!==true)
   return blocked('P02_TEXT_MODE_OR_OPTIN_MISSING');
  if(authorization.provenance!=='LOCAL_TEST_FIXTURE'&&authorization.provenance!=='HOST_TEXT_WITNESSED')
   return blocked('P02_CONSENT_ORIGIN_UNSUPPORTED');
  if(!c72.validateC72ModeSelection(selection,{mode:'EXPERIMENTAL',sourceHead:sourceHead}))
   return blocked('P02_ORIGINAL_C72_SELECTION_INVALID');
  if(modelCandidate!==undefined&&authorization.separate_cohost_draft_authorized!==true)
   return blocked('P03_SEPARATE_HOST_DRAFT_OPTIN_MISSING');
  if(overlay&&modelCandidate!==undefined&&
     (typeof expectedC124ChannelSha256!=='string'||!/^[0-9a-f]{64}$/.test(expectedC124ChannelSha256)))
   return blocked('C124_ORIGINAL_CHANNEL_BINDING_REQUIRED');
  if(typeof humanInput!=='string'||!humanInput.trim()||typeof nonce!=='string')
   return blocked('P02_INPUT_NONCE_INVALID');
  if(!Array.isArray(priorMessages)||priorMessages.some(x=>typeof x!=='string'))
   return blocked('P02_HISTORY_INVALID');
  let turn,readback;
  try{
   turn=c107.executeC107Turn({ledgerFile:ledger,nonce,
    ...(overlay?{expectedC124ChannelSha256}:{}),
    request:{sourceHead:sourceHead,selection,humanInput,optIn:true,
      ...(modelCandidate!==undefined?{modelCandidate}:{})},priorMessages,resetContext});
   readback=c107.inspectC107Ledger(ledger);
  }catch{return blocked('P02_ORIGINAL_OWNER_EXCEPTION')}
  const voice=pr118.qualifyC107Voice({turn,readback,humanInput,nonce,ledgerFile:ledger,sourceHead});
  if(voice.origin==='NO_VOICE')return blocked(turn?.first_unclosed_edge||voice.first_unclosed_edge||'P03_READBACK_NOT_QUALIFIED');
  if(voice.origin==='HOST_BOUND'&&authorization.separate_cohost_draft_authorized!==true)
   return blocked('P03_HOST_BOUND_OPTIN_MISSING');
  const trace=readback.last_hash;
  return {schema:'ikant-edu-cohost-surface/v1',surface_a:{origin:voice.origin,voice_utf8:voice.voice_utf8},
   surface_b:{...B('NATIVE_CHATGPT_PER_TURN_DISPATCH',trace,'C87_LOCAL_REOPENED_NOT_NATIVE'),
    source_head:sourceHead,SOURCE_REF:sourceHead,
    STATE:'C107_ORIGINAL_LOCAL_EXECUTED',INPUT_REF:digest(Buffer.from(humanInput,'utf8')),
    C70_PROOF:'C107_SOURCE_ORIGINAL_NODE_EXECUTED',C100_PROOF:'ORIGINAL_INPUT_OUTPUT_BOUND',
    C87_PROOF:'ORIGINAL_APPEND_REOPEN',AUTHOR_ORIGIN:voice.origin==='HOST_BOUND'?'HOST_AUTHORED':'ORIGINAL_DEMO',
    EVENT_REF:readback.last_hash,HOST_COMMENT:'Linguaggio locale verificato tramite C107/C87; ingresso nativo ChatGPT non provato.',
    scope:authorization.provenance,source_package_sha256:overlay?overlay.source_package_sha256:proof.package_sha256,
    ...(overlay?{c124_language_channel_sha256:turn.c124_language_channel_sha256}:{}) ,
    input_sha256:digest(Buffer.from(humanInput,'utf8')),visible_voice_sha256:turn.output_sha256,
    original_c70_executed:true,original_c87_writer_executed:true,
    independent_semantic_review_attested:false,host_draft_authorized:authorization.separate_cohost_draft_authorized===true,
    llm_provider_origin:'NOT_ATTESTED',run_origin:'LOCAL_NODE_EXECUTION'},manual_source_url:null};
 }
 function recovery(frame={}){
  if(closed)return {status:'ADAPTER_CLOSED'};
  if(!safeData(frame))return {status:'MANUAL_SOURCE_HANDOFF',url:HANDOFF,first_edge:'HOST_RECOVERY_FRAME_INVALID'};
  const {freshEvidenceId=null}=frame;
  if(attempts>=3||attempts>0&&(!freshEvidenceId||freshEvidenceId===lastFailure))
   return {status:'MANUAL_SOURCE_HANDOFF',url:HANDOFF,first_edge:'HOST_NO_NEW_BYTE_BRIDGE_EVIDENCE'};
  attempts++;lastFailure=freshEvidenceId||'FIRST_ATTEMPT';
  return {status:'PROBE_ALLOWED',attempt:attempts,retries_left:3-attempts};
 }
 function dispose(){if(!closed){closed=true;fs.rmSync(root,{recursive:true,force:true})}}
 return {ok:true,stage_verified:true,source_head:sourceHead,c124_verified:overlay?.stage_reopened===true,
  source_package_sha256:overlay?overlay.source_package_sha256:proof.package_sha256,
  install_root:root,ledger_file:ledger,runTurn,recovery,dispose};
}
