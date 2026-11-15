/** C72 original receipt transport between distinct Host turns/processes.
 * The two exclusive private records are projections, NOT consent owners or a ledger.
 * No historical event can be reconstructed from digests or chat text.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateC72V2Accepted,validateC72V2Orientation,validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';
const H40=/^[a-f0-9]{40}$/u;
const hash=b=>createHash('sha256').update(b).digest('hex');
const names=Object.freeze({ACCEPT:'c72-original-accepted.json',EDU:'c72-original-selected.json'});
const stop=edge=>Object.freeze({ok:false,edge,authority:0,active:false,native_event_attested:false,original_owner_invoked:false});
function privateRoot(directory){
 if(typeof directory!=='string'||!path.isAbsolute(directory)||path.resolve(directory)!==directory)
  throw Error('C72_TRANSIT_ABSOLUTE_ROOT_REQUIRED');
 const st=fs.lstatSync(directory);
 if(!st.isDirectory()||st.isSymbolicLink()||fs.realpathSync(directory)!==directory||
    (st.mode&0o077)!==0||(process.getuid&&st.uid!==process.getuid()))
  throw Error('C72_TRANSIT_PRIVATE_ROOT_REQUIRED');
 return directory;
}
function readRecord(directory,name){
 const file=path.join(privateRoot(directory),name),st=fs.lstatSync(file);
 if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size<1||st.size>25000||
   (st.mode&0o077)!==0)throw Error('C72_TRANSIT_FILE_UNSAFE');
 const fd=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
 try{
  const a=fs.fstatSync(fd),bytes=fs.readFileSync(fd),b=fs.fstatSync(fd);
  if(a.dev!==st.dev||a.ino!==st.ino||a.size!==bytes.length||
    a.ctimeMs!==b.ctimeMs||a.mtimeMs!==b.mtimeMs)throw Error('C72_TRANSIT_READBACK_RACE');
  const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  const record=JSON.parse(text);
  if(text!==JSON.stringify(record)+'\n'||record.schema!=='ikant-host-c72-original-transit/v1'||
    record.authority!==0||record.native_event_attested!==false||record.active!==false||
    record.sha256!==hash(Buffer.from(JSON.stringify(record.payload),'utf8')))
   throw Error('C72_TRANSIT_SEAL_INVALID');
  return record;
 }finally{fs.closeSync(fd);}
}
function writeRecord(directory,name,phase,head,payload){
 const root=privateRoot(directory);
 const record={schema:'ikant-host-c72-original-transit/v1',phase,source_head:head,payload,
   sha256:hash(Buffer.from(JSON.stringify(payload),'utf8')),
   native_event_attested:false,authority:0,active:false};
 const bytes=Buffer.from(JSON.stringify(record)+'\n','utf8');
 const fd=fs.openSync(path.join(root,name),'wx',0o600);
 try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 const reopened=readRecord(root,name);
 if(JSON.stringify(reopened)!==JSON.stringify(record))throw Error('C72_TRANSIT_READBACK_MISMATCH');
 return Object.freeze({ok:true,phase,source_head:head,original_receipt_sha256:phase==='ACCEPT'?
   payload.accepted.receipt_sha256:payload.selection.receipt_sha256,
   bytes:bytes.length,sha256:hash(bytes),native_event_attested:false,authority:0,active:false});
}
/** Reserve a turn before the ORIGINAL call. An indeterminate call is terminal.
 * A reservation is NOT a receipt and cannot be used for runtime admission. */
export function claimC72TransitAttempt({directory,sourceHead,phase}={}){
 try{
  if(!H40.test(sourceHead||'')||!['ACCEPT','EDU'].includes(phase))
   return stop('C72_TRANSIT_ATTEMPT_INVALID');
  const root=privateRoot(directory);
  const name=phase==='ACCEPT'?'c72-original-accept-attempt.json':'c72-original-mode-attempt.json';
  const file=path.join(root,name),record={schema:'ikant-host-c72-attempt/v1',source_head:sourceHead,
   phase,original_receipt_issued:false,native_event_attested:false,authority:0};
  const bytes=Buffer.from(JSON.stringify(record)+'\n');
  const fd=fs.openSync(file,'wx',0o600);
  try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  if(!fs.readFileSync(file).equals(bytes))throw Error('C72_TRANSIT_ATTEMPT_READBACK');
  return Object.freeze({ok:true,phase,source_head:sourceHead,original_owner_invoked:false,
   authority:0,active:false});
 }catch{return stop('C72_TRANSIT_ATTEMPT_HELD_OR_UNKNOWN_NO_REPLAY');}
}
export function reopenC72Accepted({directory,sourceHead}={}){
 try{
  if(!H40.test(sourceHead||''))return stop('C72_TRANSIT_HEAD_REQUIRED');
  const r=readRecord(directory,names.ACCEPT);
  if(r.phase!=='ACCEPT'||r.source_head!==sourceHead||
    !validateC72V2Accepted(r.payload?.accepted)||
    !validateC72V2Orientation(r.payload?.introduction,r.payload.accepted)||
    r.payload.accepted.source_head!==sourceHead)
   return stop('C72_TRANSIT_ACCEPTANCE_INVALID');
  return Object.freeze({ok:true,...r.payload,source_head:sourceHead,authority:0,active:false});
 }catch{return stop('C72_TRANSIT_ACCEPTANCE_NOT_REOPENED');}
}
export function storeC72Accepted({directory,sourceHead,accepted,introduction}={}){
 try{
  if(!H40.test(sourceHead||'')||accepted?.source_head!==sourceHead||
    !validateC72V2Accepted(accepted)||!validateC72V2Orientation(introduction,accepted))
   return stop('C72_TRANSIT_ORIGINAL_ACCEPTANCE_REQUIRED');
  return writeRecord(directory,names.ACCEPT,'ACCEPT',sourceHead,{accepted,introduction});
 }catch{return stop('C72_TRANSIT_ACCEPTANCE_WRITE_UNKNOWN_NO_RETRY');}
}
export function storeC72Selected({directory,sourceHead,selection}={}){
 const a=reopenC72Accepted({directory,sourceHead});if(!a.ok)return a;
 try{
  if(!validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead})||
    selection.acceptance_receipt_sha256!==a.accepted.receipt_sha256||
    selection.orientation_receipt_sha256!==a.introduction.receipt_sha256)
   return stop('C72_TRANSIT_SELECTION_ORIGIN_INVALID');
  return writeRecord(directory,names.EDU,'EDU',sourceHead,{selection});
 }catch{return stop('C72_TRANSIT_SELECTION_WRITE_UNKNOWN_NO_RETRY');}
}
export function reopenC72Transit({directory,sourceHead}={}){
 const a=reopenC72Accepted({directory,sourceHead});if(!a.ok)return a;
 try{
  const r=readRecord(directory,names.EDU),selection=r.payload?.selection;
  if(r.phase!=='EDU'||r.source_head!==sourceHead||
    !validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead})||
    selection.acceptance_receipt_sha256!==a.accepted.receipt_sha256||
    selection.orientation_receipt_sha256!==a.introduction.receipt_sha256)
   return stop('C72_TRANSIT_SELECTION_ORIGIN_INVALID');
  return Object.freeze({ok:true,accepted:a.accepted,introduction:a.introduction,selection,
   source_head:sourceHead,original_owner_invoked:false,native_event_attested:false,
   authority:0,active:false});
 }catch{return stop('C72_TRANSIT_SELECTION_NOT_REOPENED');}
}
