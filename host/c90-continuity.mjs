import fs from 'node:fs';
import {appendC87Turn,reopenC87Ledger} from './c87-durable-ledger.mjs';
const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/;
const stop=edge=>({schema:'ikant-le-c90-continuity/v2',status:'C90_CONTINUITY_STOP',
 first_unclosed_edge:edge,native_session_persistence_attested:false,authenticated_history:false,active:false});
/** C87 is scratch, not canonical owner. The nonce/epoch predicate is rechecked UNDER C87's exclusive writer lock. */
export function appendC90ScratchContinuation({file,sourceHead,inputSha256,outputSha256,nonce}={}){
 if(typeof file!=='string'||!file.startsWith('/')||!H40.test(sourceHead||'')||
  !H64.test(inputSha256||'')||!H64.test(outputSha256||'')||
  typeof nonce!=='string'||!/^[A-Za-z0-9_-]{12,100}$/.test(nonce))
  return stop('C90_CONTINUITY_FIELDS');
 let earlier;
 try{
  earlier=fs.existsSync(file)?reopenC87Ledger(file):
   {status:'C87_LEDGER_CHAIN_VALID',count:0,last_hash:'0'.repeat(64)};
  if(earlier.status!=='C87_LEDGER_CHAIN_VALID')return stop('C87_LEDGER_READBACK');
  const lines=fs.existsSync(file)?fs.readFileSync(file,'utf8').trim().split('\n').filter(Boolean):[];
  for(const line of lines){
   const r=JSON.parse(line);
   if(r.source_head!==sourceHead)return stop('C90_SOURCE_EPOCH_DRIFT');
   if(r.state?.nonce===nonce)return stop('C90_NONCE_REPLAY');
  }
  const priorHash=earlier.last_hash||'0'.repeat(64);
  const out=appendC87Turn(file,{source_head:sourceHead,input_sha256:inputSha256,
   output_sha256:outputSha256,state:{nonce,prior_local_record_sha256:priorHash}},
   {atomicGuard:{source_head:sourceHead,nonce,expected_prior_hash:priorHash}});
  if(out.status!=='C87_LOCAL_DURABLE_READBACK_NOT_NATIVE_SESSION')
   return stop('C87_WRITER_RECEIPT');
  return {schema:'ikant-le-c90-continuity/v2',
   status:'C90_LOCAL_SCRATCH_READBACK_UNAUTHENTICATED',local_ledger_entries:out.ledger_entries,
   local_record_sha256:out.event_sha256,exact_source_head:sourceHead,write_reopen_verified:true,
   external_host_anchor_verified:false,authenticated_history:false,native_session_persistence_attested:false,
   canonical_writer_invoked:false,active:false};
 }catch(e){
  if(e?.message==='C87_PRIOR_LEDGER_CHANGED')return stop('C90_STALE_PRIOR_READBACK');
  if(e?.message==='C87_NONCE_REPLAY')return stop('C90_NONCE_REPLAY');
  if(e?.message==='C87_SOURCE_EPOCH_DRIFT')return stop('C90_SOURCE_EPOCH_DRIFT');
  return stop('C87_LOCK_OR_FS_FAILURE');
 }
}
export function evaluateC90ContinuityClaim(receipt){
 return {status:'C90_NATIVE_PERSISTENCE_UNVERIFIED',
  first_unclosed_edge:'HOST_AUTHENTICATED_NEXT_TURN_READBACK',
  local_scratch_readback:receipt?.status==='C90_LOCAL_SCRATCH_READBACK_UNAUTHENTICATED',
  native_session_persistence_attested:false,authenticated_history:false,active:false};
}
