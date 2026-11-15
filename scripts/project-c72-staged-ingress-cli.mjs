#!/usr/bin/env node
/** C72 HOST_STAGED_FILES recipe (not an owner). Recycles C78 stdin and C104
 * physical readback WITHOUT introducing a new durable writer or EDU handoff.
 * Postaccept only; stage five files via an actually available Host carrier.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runC72SelectedHostIngress} from '../host/project-c72-physical-ingress.mjs';
const NAMES=Object.freeze(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
const H40=/^[0-9a-f]{40}$/u;
const fail=e=>{throw Error(e)};
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length,'ascii')).update(Buffer.from([0])).update(b).digest('hex');
function readStage(directory,name){
 const filename=path.join(directory,name),st=fs.lstatSync(filename);
 if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size<1||st.size>256000)
  fail('C72_STAGE_FILE_INVALID');
 const fd=fs.openSync(filename,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 try{
  const first=fs.fstatSync(fd);
  if(!first.isFile()||first.nlink!==1||first.ino!==st.ino||first.dev!==st.dev||
      first.size!==st.size)fail('C72_STAGE_FILE_RACE');
  const read=()=>{const out=Buffer.alloc(first.size);let done=0;
    while(done<out.length){const n=fs.readSync(fd,out,done,out.length-done,done);
      if(n<=0)fail('C72_STAGE_SHORT_READ');done+=n;}
    return out;};
  const a=read(),b=read(),end=fs.fstatSync(fd);
  if(!a.equals(b)||end.size!==first.size||end.ino!==first.ino||
    end.dev!==first.dev||end.mtimeMs!==first.mtimeMs||end.ctimeMs!==first.ctimeMs)
   fail('C72_STAGE_READBACK_CHANGED');
  return a;
 }finally{fs.closeSync(fd);}
}
let input='';
try{
 for await(const chunk of process.stdin){
  input+=chunk.toString('utf8');
  if(Buffer.byteLength(input,'utf8')>20000)fail('C72_STAGE_INPUT_BOUNDS');
 }
 const req=JSON.parse(input);
 if(req?.schema!=='ikant-host-c72-staged-request/v1'||req?.humanMessage!=='I ACCEPT'||
    req?.freshHumanTurn!==true||!req?.priorTurnEvidence)
  fail('C72_EXACT_NEW_CONSENT_REQUIRED');
 const witness=req.priorTurnEvidence,h=witness.source_head;
 if(!H40.test(h||'')||!H40.test(req.liveHead||'')||req.liveHead!==h||
    typeof req.stageDirectory!=='string'||!path.isAbsolute(req.stageDirectory))
  fail('C72_STAGE_SOURCE_OR_DIRECTORY');
 const root=path.resolve(req.stageDirectory),dir=fs.lstatSync(root);
 if(!dir.isDirectory()||dir.isSymbolicLink()||fs.realpathSync(root)!==root||
    (dir.mode&0o077)!==0||(process.getuid&&dir.uid!==process.getuid()))
  fail('C72_STAGE_DIRECTORY_NOT_PRIVATE');
 const documents=[];let total=0;
 for(const name of NAMES){
  const bytes=readStage(root,name);total+=bytes.length;
  if(total>550000||!H40.test(witness?.pinned_blob_shas?.[name]||'')||
      blob(bytes)!==witness.pinned_blob_shas[name])fail('C72_STAGE_GIT_BLOB_DRIFT:'+name);
  const content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if(!Buffer.from(content,'utf8').equals(bytes))fail('C72_STAGE_UTF8_LOSS');
  documents.push({path:name,source_head:h,blob_sha1:witness.pinned_blob_shas[name],content});
 }
 const sourcePacket={schema:'ikant-host-c72-source-packet/v1',
  source_head:h,live_head:req.liveHead,carrier_kind:'HOST_OPAQUE_TRANSFER',
  source_origin_attested:false,native_event_attested:false,documents};
 const r=await runC72SelectedHostIngress({humanMessage:req.humanMessage,
  freshHumanTurn:req.freshHumanTurn,priorTurnEvidence:witness,
  carrier:'HOST_SOURCE_PACKET',sourcePacket,ownerOutcome:'NOT_INVOKED'});
 process.stdout.write(JSON.stringify({...r,staged_file_count:5,
  local_physical_readback:true,native_github_event_attested:false})+'\n');
 if(r.ok!==true)process.exitCode=2;
}catch(e){
 process.stdout.write(JSON.stringify({ok:false,kind:'STOP',
  edge:String(e?.message||'C72_STAGE_UNKNOWN').replace(/[^A-Za-z0-9_:]/g,'_').slice(0,100),
  staged_file_count:0,original_owner_invoked:false,authority:0,active:false,
  local_physical_readback:false,native_github_event_attested:false})+'\n');
 process.exitCode=2;
}
