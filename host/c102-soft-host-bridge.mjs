import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {executeC101LocalCohostMachine,verifyC101Readback} from '../host/c101-local-cohost-machine.mjs';
import {appendC87Turn,reopenC87Ledger} from '../host/c87-durable-ledger.mjs';

const H40=/^[a-f0-9]{40}$/;
const NONCE=/^[A-Za-z0-9_-]{12,96}$/;
const LEDGER_NAME='c102-soft-observations.jsonl';
const SHA256=x=>crypto.createHash('sha256').update(x).digest('hex');
const STOP=(edge)=>({schema:'ikant-le-c102-soft-host-bridge/v1',status:'C102_STOP',first_unclosed_edge:edge,active:false,persistent:false,native_event_attested:false,native_delivery_attested:false,authority:0});
function safeLedger(file){
 if(typeof file!=='string'||!path.isAbsolute(file)||path.basename(file)!==LEDGER_NAME||path.basename(path.dirname(file))!=='.ikant-host')return false;
 try {const dir=path.dirname(file);if(!fs.lstatSync(dir).isDirectory()||fs.lstatSync(dir).isSymbolicLink()||fs.realpathSync(dir)!==dir)return false;
  if(fs.existsSync(file)&&(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink()))return false;
  return true;
 }catch{return false;}
}
export function inspectC102Ledger(ledgerFile){
 if(!safeLedger(ledgerFile))return STOP('C102_HOST_LEDGER_PATH');
 try {const r=reopenC87Ledger(ledgerFile);if(r.status!=='C87_LEDGER_CHAIN_VALID')return STOP('C102_LEDGER_INTEGRITY');
  return {schema:'ikant-le-c102-inspection/v1',status:'C102_LEDGER_REOPENED',count:r.count,last_hash:r.last_hash,latest_state:r.latest_state,
  source_origin_attested:false,native_session_persistence_attested:false,active:false,authority:0};
 }catch{return STOP('C102_LEDGER_INTEGRITY_OR_IO');}
}
/** Host-only local composition; no new owner, state writer, provider, or native hook. */
export function executeC102SoftTurn({ledgerFile,nonce,request}={}){
 if(!safeLedger(ledgerFile))return STOP('C102_HOST_LEDGER_PATH');
 if(!NONCE.test(nonce||'')||!request||typeof request!=='object'||Array.isArray(request)||request.optIn!==true||
    !H40.test(request.sourceHead||'')||typeof request.humanInput!=='string'||Buffer.byteLength(request.humanInput,'utf8')>600)
  return STOP('C102_EXPLICIT_INPUT_OR_OPT_IN');
 let before;
 try{before=reopenC87Ledger(ledgerFile);}catch{return STOP('C102_LEDGER_INTEGRITY_OR_IO');}
 if(before.status!=='C87_LEDGER_CHAIN_VALID')return STOP('C102_LEDGER_INTEGRITY');
 if(before.latest_state?.nonce===nonce)return STOP('C102_NONCE_REPLAY');
 let voice;
 try{voice=executeC101LocalCohostMachine(request);}catch{return STOP('C102_C101_EXCEPTION');}
 if(voice?.status!=='C101_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED'||
   !verifyC101Readback(voice,request).ok||voice.active!==false||voice.native_delivery_attested!==false||
   voice.source_head!==request.sourceHead||voice.input_sha256!==SHA256(Buffer.from(request.humanInput,'utf8'))||
   voice.output_sha256!==SHA256(Buffer.from(voice.voice_utf8,'utf8')))
  return STOP(voice?.first_unclosed_edge||'C102_C101_READBACK');
 const state={schema:'ikant-le-c102-observation/v1',nonce,c101_status:voice.status,c70_status:voice.c70_status,
   c71_status:voice.c71_status,c100_status:voice.c100_status,voice_source:voice.voice_source,
   active:false,native_host_dispatch_attested:false,cognitive_cross_turn_continuity_attested:false};
 let written,after;
 try{written=appendC87Turn(ledgerFile,{source_head:request.sourceHead,input_sha256:voice.input_sha256,
  output_sha256:voice.output_sha256,state},{atomicGuard:{source_head:request.sourceHead,
  nonce,expected_prior_hash:before.last_hash}});after=reopenC87Ledger(ledgerFile);
 }catch{return STOP('C102_C87_WRITE_OR_REPLAY');}
 if(written.status!=='C87_LOCAL_DURABLE_READBACK_NOT_NATIVE_SESSION'||after.status!=='C87_LEDGER_CHAIN_VALID'||
    after.last_hash!==written.event_sha256||after.latest_state?.nonce!==nonce)
  return STOP('C102_C87_POSTWRITE_READBACK');
 return {schema:'ikant-le-c102-soft-host-bridge/v1',status:'C102_ORIGINAL_C101_C87_LOCAL_READBACK',
  source_head:request.sourceHead,input_sha256:voice.input_sha256,output_sha256:voice.output_sha256,
  voice_utf8:voice.voice_utf8,voice_source:voice.voice_source,
  c70_status:voice.c70_status,c71_status:voice.c71_status,c100_status:voice.c100_status,
  ledger_status:written.status,ledger_entries:after.count,ledger_event_sha256:after.last_hash,
  actual_local_c101_c87_invoked:true,source_origin_attested:false,
  cognitive_cross_turn_continuity_attested:false,persistent:false,
  native_event_attested:false,native_delivery_attested:false,active:false,authority:0,
  first_unclosed_edge:'CHATGPT_NATIVE_PER_TURN_HOOK_UNATTESTED'};
}
