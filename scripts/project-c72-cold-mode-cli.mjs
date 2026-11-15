#!/usr/bin/env node
/** Host-only C72/v2 EDU later-message reentry, no checkout or new owner.
 * This command needs two ORIGINAL pinned Git blobs transported into this Node
 * process. A Host assertion of a new message is not provider authentication. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

const FILES=Object.freeze([
 'contracts/c72-public-mode-admission-v2.json',
 'host/c72-public-mode-admission.mjs'
]);
const H40=/^[a-f0-9]{40}$/u;
const B64=/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const fail=first_edge=>({ok:false,first_edge,original_owner_invoked:false,
  native_event_attested:false,active:false,authority:0});
function validate(q){
 if(!isObj(q)||q.schema!=='ikant-host-c72-later-mode/v1'||q.humanMessage!=='EDU'||
    q.freshHumanTurn!==true||q.priorAcceptanceObserved!==true||
    q.ownerOutcome!=='NOT_INVOKED')throw Error('C72_LATER_EXACT_EDU_REQUIRED');
 if(!H40.test(q.sourceHead||'')||q.liveHead!==q.sourceHead||
    q.accepted?.source_head!==q.sourceHead||q.introduction?.source_head!==q.sourceHead)
   throw Error('C72_LATER_SOURCE_LOCK_STALE');
 if(!isObj(q.expectedBlobShas)||!Array.isArray(q.sourcePacket)||
    q.sourcePacket.length!==FILES.length)throw Error('C72_LATER_TWO_ORIGINAL_FILES_REQUIRED');
 const originals=new Map();
 for(let i=0;i<FILES.length;i++){
  const p=FILES[i],f=q.sourcePacket[i];
  if(!isObj(f)||f.path!==p||!H40.test(q.expectedBlobShas[p]||'')||
     typeof f.contentBase64!=='string'||f.contentBase64.length>350000||
     f.contentBase64.length%4!==0||!B64.test(f.contentBase64))throw Error('C72_LATER_PACKET_INVALID');
  const b=Buffer.from(f.contentBase64,'base64');
  if(b.length<1||b.length>256000||b.toString('base64')!==f.contentBase64||
     blob(b)!==q.expectedBlobShas[p])throw Error('C72_LATER_GIT_BLOB_MISMATCH');
  const s=new TextDecoder('utf-8',{fatal:true}).decode(b);
  if(!Buffer.from(s,'utf8').equals(b))throw Error('C72_LATER_UTF8_LOSS');
  originals.set(p,b);
 }
 return originals;
}

function e15TransitBytes(q){
 if(q.projectProfile!=='PROJECT_EDU_E15'||typeof q.transitDirectory!=='string'||
    !path.isAbsolute(q.transitDirectory))throw Error('E15_REQUIRED_PRIVATE_TRANSIT');
 const p=q.transitSourcePacket;
 if(!p||p.path!=='host/project-c72-receipt-transit.mjs'||
    typeof p.contentBase64!=='string'||p.contentBase64.length>350000||
    p.contentBase64.length%4!==0||!B64.test(p.contentBase64)||
    !H40.test(q.transitBlobSha1||''))throw Error('E15_VERIFIED_TRANSIT_BLOB_REQUIRED');
 const b=Buffer.from(p.contentBase64,'base64');
 if(!b.length||b.length>256000||b.toString('base64')!==p.contentBase64||
    blob(b)!==q.transitBlobSha1)throw Error('E15_TRANSIT_GIT_BLOB_MISMATCH');
 const s=new TextDecoder('utf-8',{fatal:true}).decode(b);
 if(!Buffer.from(s,'utf8').equals(b))throw Error('E15_TRANSIT_UTF8_LOSS');
 return b;
}
function stageE15Transit(root,b){
 const file=path.join(root,'host/project-c72-receipt-transit.mjs');
 fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
 fs.writeFileSync(file,b,{flag:'wx',mode:0o600});
 if(!fs.readFileSync(file).equals(b))throw Error('E15_TRANSIT_PHYSICAL_READBACK');
 return file;
}


function e16PrivatePin(directory,sourceHead,sha1,{write=false}={}){
 const dir=fs.lstatSync(directory);
 if(!dir.isDirectory()||dir.isSymbolicLink()||(dir.mode&0o077)!==0||
    fs.realpathSync(directory)!==directory||
    (process.getuid&&dir.uid!==process.getuid()))throw Error('E16_PIN_ROOT_NOT_PRIVATE');
 const file=path.join(directory,'c72-e16-source-pin.json');
 const payload={schema:'ikant-c72-e16-transport-pin/v1',source_head:sourceHead,
  path:'host/project-c72-receipt-transit.mjs',blob_sha1:sha1,authority:0};
 const bytes=Buffer.from(JSON.stringify(payload)+'\n','utf8');
 if(write){
  const fd=fs.openSync(file,'wx',0o600);
  try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 }
 const st=fs.lstatSync(file);
 if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size!==bytes.length||
    (st.mode&0o077)!==0)throw Error('E16_PIN_READBACK_UNSAFE');
 const fd=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
 try{
  const before=fs.fstatSync(fd),actual=fs.readFileSync(fd),after=fs.fstatSync(fd);
  if(!actual.equals(bytes)||before.dev!==after.dev||before.ino!==after.ino||
     before.size!==after.size||before.mtimeMs!==after.mtimeMs||
     before.ctimeMs!==after.ctimeMs)throw Error('E16_FIRST_TURN_CARRIER_PIN_MISMATCH');
 }finally{fs.closeSync(fd);}
 return true;
}

export async function selectOriginalC72LaterEDU(q){
 let originals,projectTransitBytes=null,submittedAccepted=q.accepted,submittedIntroduction=q.introduction;
 if(q.projectProfile!==undefined&&q.projectProfile!=='PROJECT_EDU_E15')return fail('E15_PROJECT_PROFILE_INVALID');
 if(q.projectProfile==='PROJECT_EDU_E15'){
  try{projectTransitBytes=e15TransitBytes(q)}catch(e){return fail(String(e.message||'E15_TRANSIT_PREFLIGHT_UNKNOWN'));}
  q={...q,accepted:q.accepted??{source_head:q.sourceHead},
   introduction:q.introduction??{source_head:q.sourceHead}};
 }
 if(q.transitDirectory!==undefined&&q.projectProfile!=='PROJECT_EDU_E15'){
  // A mode turn reopens the earlier original acceptance, never reconstructs it.
  try{
   const transit=await import('../host/project-c72-receipt-transit.mjs');
   const a=transit.reopenC72Accepted({directory:q.transitDirectory,sourceHead:q.sourceHead});
   if(!a.ok)return fail(a.edge);
   if(q.accepted!==undefined&&JSON.stringify(q.accepted)!==JSON.stringify(a.accepted))
    return fail('C72_TRANSIT_ACCEPTANCE_CONFLICT');
   if(q.introduction!==undefined&&JSON.stringify(q.introduction)!==JSON.stringify(a.introduction))
    return fail('C72_TRANSIT_INTRODUCTION_CONFLICT');
   q={...q,accepted:a.accepted,introduction:a.introduction};
  }catch{return fail('C72_TRANSIT_READ_UNKNOWN');}
 }
 try{originals=validate(q);}catch(e){return fail(String(e.message||'C72_LATER_INPUT_INVALID'));}
 let temp=null,attempted=false;
 try{
  temp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c72-mode-'));fs.chmodSync(temp,0o700);
  for(const [p,b] of originals){
   const target=path.join(temp,p);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});
   fs.writeFileSync(target,b,{flag:'wx',mode:0o600});
   const again=fs.readFileSync(target);
   if(!again.equals(b)||blob(again)!==q.expectedBlobShas[p])throw Error('C72_LATER_READBACK_DRIFT');
  }
  let projectTransit=null;
  if(projectTransitBytes!==null){
   projectTransit=await import(pathToFileURL(stageE15Transit(temp,projectTransitBytes)).href);
   const reopened=projectTransit.reopenC72Accepted({directory:q.transitDirectory,sourceHead:q.sourceHead});
   if(!reopened.ok)return fail(reopened.edge);
   if((submittedAccepted!==undefined&&JSON.stringify(submittedAccepted)!==JSON.stringify(reopened.accepted))||
      (submittedIntroduction!==undefined&&JSON.stringify(submittedIntroduction)!==JSON.stringify(reopened.introduction)))
    return fail('E15_C72_ORIGINAL_RECEIPT_CONFLICT');
   e16PrivatePin(q.transitDirectory,q.sourceHead,q.transitBlobSha1);
   q={...q,accepted:reopened.accepted,introduction:reopened.introduction};
  }
  const owner=await import(pathToFileURL(path.join(temp,FILES[1])).href);
  if(!owner.validateC72V2Accepted(q.accepted)||!owner.validateC72V2Orientation(q.introduction,q.accepted))
   return fail('C72_LATER_ORIGINAL_ACCEPTANCE_INVALID');
  if(q.transitDirectory!==undefined){
   const transit=projectTransit??await import('../host/project-c72-receipt-transit.mjs');
   const claimed=transit.claimC72TransitAttempt({directory:q.transitDirectory,
    sourceHead:q.sourceHead,phase:'EDU'});
   if(!claimed.ok)return fail(claimed.edge);
  }
  attempted=true;
  const selection=owner.selectC72V2Mode({accepted:q.accepted,
    orientation:q.introduction,humanMessage:q.humanMessage});
  if(!owner.validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead:q.sourceHead})||
     selection.acceptance_receipt_sha256!==q.accepted.receipt_sha256||
     selection.orientation_receipt_sha256!==q.introduction.receipt_sha256)
   return {...fail('C72_LATER_ORIGINAL_SELECTION_INVALID'),original_owner_invoked:true};
  if(q.transitDirectory!==undefined){
   const transit=projectTransit??await import('../host/project-c72-receipt-transit.mjs');
   const stored=transit.storeC72Selected({directory:q.transitDirectory,
    sourceHead:q.sourceHead,selection});
   if(!stored.ok)return {...fail(stored.edge),original_owner_invoked:true};
  }
  return {ok:true,status:'C72_ORIGINAL_EDU_MODE_VERIFIED',
   original_owner_invoked:true,verified_file_count:FILES.length,
   source_head:q.sourceHead,selection,original_accepted_sha256:q.accepted.receipt_sha256,
   original_introduction_sha256:q.introduction.receipt_sha256,
   native_event_attested:false,source_origin_attested:false,active:false,authority:0};
 }catch{return {...fail(attempted?'C72_LATER_OWNER_OUTCOME_UNKNOWN':'C72_LATER_EXECUTION_UNKNOWN'),
             original_owner_invoked:attempted};}
 finally{if(temp)fs.rmSync(temp,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  let raw='';for await(const chunk of process.stdin){
   raw+=chunk.toString('utf8');
   if(Buffer.byteLength(raw,'utf8')>1200000)throw Error('C72_LATER_REQUEST_TOO_LARGE');
  }
  const result=await selectOriginalC72LaterEDU(JSON.parse(raw));
  process.stdout.write(JSON.stringify(result)+'\n');
  if(!result.ok)process.exitCode=2;
 }catch(e){process.stdout.write(JSON.stringify(fail(String(e.message||'C72_LATER_BAD_REQUEST')))+'\n');
   process.exitCode=2;}
}
