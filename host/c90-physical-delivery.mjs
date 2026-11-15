import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {executeC90ProductionTurn} from './c90-turn-owner.mjs';
import {projectC90ObservedFrame,renderC90HostText} from './c90-observed-frame.mjs';
import {appendC90ScratchContinuation} from './c90-continuity.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const stop=edge=>({schema:'ikant-le-c90-host-release/v2',status:'C90_HOST_RELEASE_STOP',
 first_unclosed_edge:edge,active:false,native_chat_delivery_attested:false});
/** Full JSON and gzip are byte recoverable; a chat summary is not lossless. */
export function writeC90ExactEvidence(frame,{parentDir=os.tmpdir()}={}){
 const rendered=renderC90HostText(frame);
 if(rendered.status!=='C90_HOST_TEXT_READY_NOT_CHAT_DELIVERED'||
  !path.isAbsolute(parentDir))return stop('C90_EVIDENCE_FRAME_OR_PATH');
 const bytes=Buffer.from(JSON.stringify(frame)+'\n','utf8');
 if(bytes.length>200000)return stop('C90_EVIDENCE_TOO_LARGE');
 const gz=zlib.gzipSync(bytes,{mtime:0,level:9});
 let directory;
 try{
  directory=fs.mkdtempSync(path.join(parentDir,'ikant-c90-receipt-'));
  const outputs=[['exact-runtime-frame.json',bytes],['exact-runtime-frame.json.gz',gz]];
  const files=[];
  for(const [name,b] of outputs){
   const dest=path.join(directory,name),fd=fs.openSync(dest,'wx',0o600);
   try{if(fs.writeSync(fd,b)!==b.length)throw Error('SHORT_WRITE');fs.fsyncSync(fd);}
   finally{fs.closeSync(fd);}
   if(!fs.readFileSync(dest).equals(b))throw Error('C90_REOPEN_MISMATCH');
   files.push({name,absolute_path:dest,sha256:sha(b),bytes:b.length});
  }
  if(!zlib.gunzipSync(fs.readFileSync(files[1].absolute_path)).equals(bytes))
   throw Error('GZIP_NOT_LOSSLESS');
  return {schema:'ikant-le-c90-evidence/v2',
   status:'C90_EVIDENCE_GZIP_WRITTEN_REOPENED_NOT_CHAT_PRESENTED',
   files,full_frame_sha256:sha(bytes),gzip_sha256:sha(gz),
   byte_identical_decompression_verified:true,semantic_lossless_via_full_original_bytes:true,
   inline_summary_is_lossless:false,artifact_native_presentation_attested:false,active:false};
 }catch{
  if(directory)fs.rmSync(directory,{recursive:true,force:true});
  return stop('C90_EVIDENCE_WRITE_READBACK');
 }
}
function discardEvidence(e){
 if(e?.status==='C90_EVIDENCE_GZIP_WRITTEN_REOPENED_NOT_CHAT_PRESENTED'&&
  e.files?.length===2){
  const dir=path.dirname(e.files[0].absolute_path);
  if(e.files.every(f=>path.dirname(f.absolute_path)===dir)&&path.basename(dir).startsWith('ikant-c90-receipt-'))
   fs.rmSync(dir,{recursive:true,force:true});
 }
}
/** Unique production path. Only this function invokes actual C84 then renders voice+backlog. */
export async function executeC90HostRelease(q={},options={}){
 const current=await executeC90ProductionTurn(q);
 if(current.status!=='C90_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED')
  return stop(current.first_unclosed_edge||'C90_REAL_C84_NOT_EXECUTED');
 const frame=projectC90ObservedFrame(current);
 if(frame.status!=='C90_FRAME_PROJECTED_RECEIPT_SHAPE_ONLY')return stop('C90_FRAME_PROJECTION');
 const rendered=renderC90HostText(frame);
 if(rendered.status!=='C90_HOST_TEXT_READY_NOT_CHAT_DELIVERED')return stop('C90_TEXT_RENDER');
 const evidence=writeC90ExactEvidence(frame,{parentDir:options.evidenceDir||os.tmpdir()});
 if(evidence.status!=='C90_EVIDENCE_GZIP_WRITTEN_REOPENED_NOT_CHAT_PRESENTED')
  return stop('C90_EVIDENCE_WRITE');
 let scratch=null;
 if(options.scratchLedgerFile){
  scratch=appendC90ScratchContinuation({file:options.scratchLedgerFile,sourceHead:q.sourceHead,
   inputSha256:q.inputSha256,outputSha256:current.output_sha256,nonce:options.turnNonce});
  if(scratch.status!=='C90_LOCAL_SCRATCH_READBACK_UNAUTHENTICATED'){
   discardEvidence(evidence);
   return stop(scratch.first_unclosed_edge||'C90_SCRATCH_NOT_REOPENED');
  }
 }
 return {schema:'ikant-le-c90-host-release/v2',
  status:'C90_HOST_RELEASE_READY_NOT_NATIVE_PRESENTED',host_text_exact:rendered.text,
  surface_a_exact:frame.surface_a_exact,frame_sha256:frame.frame_sha256,
  debug:frame.debug,backlog:frame.backlog,telemetry:frame.telemetry,evidence,scratch,
  source_head:q.sourceHead,input_sha256:q.inputSha256,output_sha256:current.output_sha256,
  runtime_executed:true,host_github_connector_to_node_attested:false,
  native_chat_delivery_attested:false,canonical_active:false,authority:0};
}
