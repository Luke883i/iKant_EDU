#!/usr/bin/env node
/** C72 post-I ACCEPT cold seed. HOST transport only, no owner/consent/UI authority.
 * Zero checkout: only Node stdlib at startup; original owner materialized later.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const C72_COLDSTART_FILES=Object.freeze([
 'README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json',
 'host/c72-public-mode-admission.mjs',
 'host/project-c72-postaccept-reentry.mjs'
]);
const FIRST=C72_COLDSTART_FILES.slice(0,5);
const H40=/^[a-f0-9]{40}$/u;
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const stop=edge=>({ok:false,kind:'STOP',edge,authority:0,active:false,
 original_owner_invoked:false,native_event_attested:false,source_origin_attested:false});
function witnessEdge(q){
 const w=q?.priorTurnEvidence;
 if(q?.humanMessage!=='I ACCEPT'||q?.freshHumanTurn!==true||q?.schema!=='ikant-host-c72-coldstart/v1')
  return 'C72_EXACT_NEW_CONSENT_REQUIRED';
 if(q?.ownerOutcome!=='NOT_INVOKED')return 'C72_OWNER_ALREADY_ATTEMPTED_OR_UNKNOWN';
 if(!obj(w)||!H40.test(w.source_head||'')||w.host_link_displayed!==true||
    w.distinct_human_message_observed!==true||!obj(w.pinned_blob_shas)||
    !['Luke883i/iKant_LE','Luke883i/iKant_EDU'].some(name=>
     w.terms_link==='https://github.com/'+name+'/blob/'+w.source_head+'/TERMS.md')||
    FIRST.some(p=>!H40.test(w.pinned_blob_shas[p]||'')))return 'C72_ORIENTATION_WITNESS_MISSING';
 if(!H40.test(q.liveHead||'')||q.liveHead!==w.source_head)return 'STOP_SOURCE_LOCK_STALE';
 if(!obj(q.expectedBlobShas)||C72_COLDSTART_FILES.some(p=>!H40.test(q.expectedBlobShas[p]||'')))
  return 'C72_PINNED_SOURCE_SHAS_REQUIRED';
 if(FIRST.some(p=>q.expectedBlobShas[p]!==w.pinned_blob_shas[p]))return 'C72_FIRST_TURN_SHA_DRIFT';
 if(!H40.test(q.seedBlobSha1||''))return 'C72_SEED_BLOB_SHA_REQUIRED';
 if(Number(q.stageDirectory!==undefined)+Number(q.sourcePacket!==undefined)!==1)
  return 'C72_EXACTLY_ONE_PHYSICAL_CARRIER_REQUIRED';
 return null;
}
function readExact(filename){
 const st=fs.lstatSync(filename);
 if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size<1||st.size>256000)
  throw Error('C72_STAGE_FILE_INVALID');
 const fd=fs.openSync(filename,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
 try{
  const before=fs.fstatSync(fd);
  if(before.dev!==st.dev||before.ino!==st.ino||before.size!==st.size)
   throw Error('C72_STAGE_FILE_RACE');
  const read=()=>{const b=Buffer.alloc(before.size);let i=0;
   while(i<b.length){const n=fs.readSync(fd,b,i,b.length-i,i);
    if(n<1)throw Error('C72_STAGE_SHORT_READ');i+=n;}return b;};
  const a=read(),b=read(),after=fs.fstatSync(fd);
  if(!a.equals(b)||after.ino!==before.ino||after.dev!==before.dev||
     after.size!==before.size||after.ctimeMs!==before.ctimeMs||after.mtimeMs!==before.mtimeMs)
   throw Error('C72_STAGE_READBACK_CHANGED');
  return a;
 }finally{fs.closeSync(fd);}
}
function staged(root,name){
 let p=root;
 for(const part of name.split('/')){p=path.join(p,part);
  if(fs.lstatSync(p).isSymbolicLink())throw Error('C72_STAGE_SYMLINK');}
 return readExact(p);
}
function readSources(q){
 const files=new Map();
 if(q.stageDirectory!==undefined){
  if(typeof q.stageDirectory!=='string'||!path.isAbsolute(q.stageDirectory))
   throw Error('C72_STAGE_DIRECTORY_INVALID');
  const root=path.resolve(q.stageDirectory),st=fs.lstatSync(root);
  if(!st.isDirectory()||st.isSymbolicLink()||fs.realpathSync(root)!==root||
     (st.mode&0o077)!==0||(process.getuid&&st.uid!==process.getuid()))
   throw Error('C72_STAGE_DIRECTORY_NOT_PRIVATE');
  for(const p of C72_COLDSTART_FILES)files.set(p,staged(root,p));
 }else{
  if(!Array.isArray(q.sourcePacket)||q.sourcePacket.length!==C72_COLDSTART_FILES.length)
   throw Error('C72_SOURCE_PACKET_COUNT_INVALID');
  for(let i=0;i<C72_COLDSTART_FILES.length;i++){
   const d=q.sourcePacket[i],p=C72_COLDSTART_FILES[i];
   if(!obj(d)||d.path!==p||typeof d.contentBase64!=='string'||
      d.contentBase64.length>350000||d.contentBase64.length%4!==0||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(d.contentBase64))
    throw Error('C72_PACKET_ENVELOPE_INVALID');
   const b=Buffer.from(d.contentBase64,'base64');
   if(b.toString('base64')!==d.contentBase64)throw Error('C72_PACKET_BASE64_INVALID');
   files.set(p,b);
  }
 }
 let total=0;
 for(const p of C72_COLDSTART_FILES){
  const b=files.get(p);total+=b.length;
  if(b.length<1||b.length>256000||total>550000||sha(b)!==q.expectedBlobShas[p])
   throw Error('C72_PINNED_BLOB_DRIFT:'+p);
  const s=new TextDecoder('utf-8',{fatal:true}).decode(b);
  if(!Buffer.from(s,'utf8').equals(b))throw Error('C72_UTF8_LOSS:'+p);
 }
 return files;
}

function e15TransitBytes(q){
 if(q.projectProfile!=='PROJECT_EDU_E15'||typeof q.transitDirectory!=='string'||
    !path.isAbsolute(q.transitDirectory))throw Error('E15_REQUIRED_PRIVATE_TRANSIT');
 const p=q.transitSourcePacket;
 if(!p||p.path!=='host/project-c72-receipt-transit.mjs'||
    typeof p.contentBase64!=='string'||p.contentBase64.length>350000||
    p.contentBase64.length%4!==0||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(p.contentBase64)||
    !H40.test(q.transitBlobSha1||''))throw Error('E15_VERIFIED_TRANSIT_BLOB_REQUIRED');
 const b=Buffer.from(p.contentBase64,'base64');
 if(!b.length||b.length>256000||b.toString('base64')!==p.contentBase64||
    sha(b)!==q.transitBlobSha1)throw Error('E15_TRANSIT_GIT_BLOB_MISMATCH');
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

/** No blind retry. A STOP after original owner invocation is terminal. */
export async function executeC72Coldstart(q,{seedPath=fileURLToPath(import.meta.url)}={}){
 const edge=witnessEdge(q);if(edge)return stop(edge);
 if(q.projectProfile!==undefined&&q.projectProfile!=='PROJECT_EDU_E15')return stop('E15_PROJECT_PROFILE_INVALID');
 let projectTransitBytes=null;
 if(q.projectProfile==='PROJECT_EDU_E15'){
  try{projectTransitBytes=e15TransitBytes(q)}catch(e){return stop(String(e.message||'E15_TRANSIT_PREFLIGHT_UNKNOWN'));}
 }
 try{if(sha(readExact(seedPath))!==q.seedBlobSha1)return stop('C72_SEED_SOURCE_BLOB_DRIFT');}
 catch{return stop('C72_SEED_SOURCE_NOT_VERIFIED');}
 let transit=null;
 // Preflight the optional physical receipt sink BEFORE invoking original C72.
 if(q.transitDirectory!==undefined&&q.projectProfile!=='PROJECT_EDU_E15'){
  try{transit=await import('./project-c72-receipt-transit.mjs');}
  catch{return stop('C72_TRANSIT_MODULE_NOT_MATERIALIZED');}
 }
 let files;
 try{files=readSources(q);}catch(e){return stop(String(e.message||'C72_SOURCE_UNKNOWN'));}
 // C72 zero-checkout chooses exactly one canonical name from verified ORIGINAL
 // staged bytes, never from a caller-supplied alias, redirect or success flag.
 try{
  const boot=JSON.parse(files.get('BOOTSTRAP.json').toString('utf8'));
  const adm=JSON.parse(files.get('ADMISSION.json').toString('utf8'));
  const admission=JSON.parse(files.get('contracts/c72-public-mode-admission-v2.json').toString('utf8'));
  const name=boot.canonical_repository;
  if(boot.canonical_branch!=='main'||!
     ['Luke883i/iKant_LE','Luke883i/iKant_EDU'].includes(name)||
     adm.repository!==name||
     admission?.source_identity?.repository_id!==1371330383||
     admission?.source_identity?.canonical_repository!==name||
     q.priorTurnEvidence.terms_link!=='https://github.com/'+name+'/blob/'+q.liveHead+'/TERMS.md')
   return stop('C72_CANONICAL_SOURCE_EPOCH_MISMATCH');
 }catch{return stop('C72_CANONICAL_SOURCE_EPOCH_UNREADABLE');}
 if(projectTransitBytes!==null){
  try{
   const pinned=JSON.parse(files.get('BOOTSTRAP.json').toString('utf8'))
    ?.project_session?.postaccept_original_c72_transit_pin;
   if(pinned?.path!=='host/project-c72-receipt-transit.mjs'||
      pinned?.blob_sha1!==q.transitBlobSha1||
      pinned?.source!=='FIRST_TURN_BOOTSTRAP_SHA_VERIFIED')
    return stop('E16_CARRIER_NOT_PINNED_IN_VERIFIED_BOOTSTRAP');
  }catch{return stop('E16_VERIFIED_BOOTSTRAP_PIN_UNAVAILABLE');}
 }
 let root,invoked=false;
 try{
  root=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c72-'));fs.chmodSync(root,0o700);
  for(const [p,b] of files){
   const target=path.join(root,p);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});
   fs.writeFileSync(target,b,{flag:'wx',mode:0o600});
   if(!readExact(target).equals(b))throw Error('C72_REOPEN_DRIFT:'+p);
  }
  if(projectTransitBytes!==null){
   const file=stageE15Transit(root,projectTransitBytes);
   transit=await import(pathToFileURL(file).href);
  }
  const owner=await import(pathToFileURL(path.join(root,'host/project-c72-postaccept-reentry.mjs')).href);
  const verify=await import(pathToFileURL(path.join(root,'host/c72-public-mode-admission.mjs')).href);
  const docs=FIRST.map(p=>({path:p,source_head:q.liveHead,
   blob_sha1:q.expectedBlobShas[p],content:files.get(p).toString('utf8')}));
  if(projectTransitBytes!==null){
   // Source pin is taken from independently SHA-verified first-turn BOOTSTRAP bytes.
   // An unknown write is terminal: this file is exclusive and cannot be replayed.
   e16PrivatePin(q.transitDirectory,q.liveHead,q.transitBlobSha1,{write:true});
  }
  if(transit){
   const claimed=transit.claimC72TransitAttempt({directory:q.transitDirectory,
    sourceHead:q.liveHead,phase:'ACCEPT'});
   if(!claimed.ok)return stop(claimed.edge);
  }
  invoked=true;
  const r=owner.reenterC72V2PostAccept({sourceHead:q.liveHead,liveHead:q.liveHead,
   humanMessage:q.humanMessage,priorTurnEvidence:q.priorTurnEvidence,documents:docs});
  if(r.ok!==true||!verify.validateC72V2Accepted(r.accepted)||
     !verify.validateC72V2Orientation(r.introduction,r.accepted))
   return {...stop(r.first_edge||'C72_ORIGINAL_RECEIPT_INVALID'),original_owner_invoked:true};
  if(transit){
   const stored=transit.storeC72Accepted({directory:q.transitDirectory,
    sourceHead:q.liveHead,accepted:r.accepted,introduction:r.introduction});
   if(stored.ok!==true)return {...stop(stored.edge),original_owner_invoked:true};
  }
  return {ok:true,kind:'C72_ORIGINAL_POSTACCEPT_VERIFIED',
   accepted:r.accepted,introduction:r.introduction,source_head:q.liveHead,
   carrier:q.stageDirectory!==undefined?'HOST_STAGED_PARTIAL_SOURCE':'HOST_SOURCE_PACKET',
   original_owner_invoked:true,verified_file_count:files.size,authority:0,
   active:false,native_event_attested:false,source_origin_attested:false,
   native_delivery_attested:false};
 }catch{return {...stop(invoked?'C72_OWNER_OUTCOME_UNKNOWN':'C72_COLDSTART_EXECUTION_UNKNOWN'),
  original_owner_invoked:invoked};}
 finally{if(root)fs.rmSync(root,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let raw='';
 try{
  for await(const chunk of process.stdin){raw+=chunk.toString('utf8');
   if(Buffer.byteLength(raw,'utf8')>800000)throw Error('C72_COLDSTART_REQUEST_BOUNDS');}
  const r=await executeC72Coldstart(JSON.parse(raw));
  process.stdout.write(JSON.stringify(r)+'\n');if(r.ok!==true)process.exitCode=2;
 }catch(e){process.stdout.write(JSON.stringify(stop(String(e.message||'C72_COLDSTART_INPUT_INVALID')))+'\n');process.exitCode=2;}
}
