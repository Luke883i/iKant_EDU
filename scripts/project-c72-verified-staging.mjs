#!/usr/bin/env node
/** Host-only, post-accept, source-blob relay. NO C72, consent or mode owner.
 * A host that can physically pass bytes to Node uses this small per-blob stdin
 * protocol. The existing ORIGINAL cold seed consumes the verified stage.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const NAMES=Object.freeze([
 'README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json',
 'host/c72-public-mode-admission.mjs',
 'host/project-c72-postaccept-reentry.mjs'
]);
const SHA=/^[a-f0-9]{40}$/u;
const B64=/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const fail=x=>{throw Error(x);};
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const witnessNames=NAMES.slice(0,5);
const receipt=(fields)=>Object.freeze({schema:'ikant-host-c72-verified-staging-result/v1',authority:0,
 active:false,original_owner_invoked:false,native_event_attested:false,
 source_origin_attested:false,connector_to_node_origin_attested:false,...fields});
export function validateRelayManifest(q){
 if(!plain(q)||q.schema!=='ikant-host-c72-verified-staging/v1'||!SHA.test(q.source_head||'')||
  !plain(q.expectedBlobShas)||!plain(q.priorTurnEvidence)||
  q.priorTurnEvidence.source_head!==q.source_head||
  q.priorTurnEvidence.host_link_displayed!==true||
  q.priorTurnEvidence.terms_link!=='https://github.com/Luke883i/iKant_EDU/blob/'+q.source_head+'/TERMS.md'||
  !plain(q.priorTurnEvidence.pinned_blob_shas)||
  NAMES.some(p=>!SHA.test(q.expectedBlobShas[p]||''))||
  witnessNames.some(p=>q.expectedBlobShas[p]!==q.priorTurnEvidence.pinned_blob_shas[p]))
  return 'C72_RELAY_MANIFEST_INVALID';
 if(Object.keys(q.expectedBlobShas).length!==NAMES.length||
  Object.keys(q.priorTurnEvidence.pinned_blob_shas).length!==5)
  return 'C72_RELAY_MANIFEST_EXTRA_KEYS';
 return null;
}
function root(dir){
 if(typeof dir!=='string'||!path.isAbsolute(dir))fail('C72_RELAY_STAGE_DIR_INVALID');
 const normalized=path.resolve(dir);
 if(normalized!==dir)fail('C72_RELAY_STAGE_DIR_INVALID');
 const st=fs.lstatSync(dir);
 if(!st.isDirectory()||st.isSymbolicLink()||fs.realpathSync(dir)!==dir||
  (st.mode&0o077)!==0||(process.getuid&&st.uid!==process.getuid()))
  fail('C72_RELAY_STAGE_DIR_NOT_PRIVATE');
 return dir;
}
function manifest(dir){
 const loc=path.join(root(dir),'.c72-relay-manifest.json');
 const st=fs.lstatSync(loc);
 if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size<1||st.size>20000||
    (st.mode&0o077)!==0)fail('C72_RELAY_MANIFEST_UNSAFE');
 const q=JSON.parse(fs.readFileSync(loc,'utf8'));
 const edge=validateRelayManifest(q);if(edge)fail(edge);
 return q;
}
function safeFile(dir,p){
 let d=dir;const parts=p.split('/');
 for(const part of parts.slice(0,-1)){
  d=path.join(d,part);const st=fs.lstatSync(d);
  if(!st.isDirectory()||st.isSymbolicLink()||fs.realpathSync(d)!==d||
     (st.mode&0o077)!==0||(process.getuid&&st.uid!==process.getuid()))
    fail('C72_RELAY_PARENT_UNSAFE');
 }
 const loc=path.join(d,parts.at(-1));
 const st=fs.lstatSync(loc);
 if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size<1||st.size>256000||
    (st.mode&0o077)!==0)fail('C72_RELAY_FILE_UNSAFE');
 const fd=fs.openSync(loc,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
 try{
  const a=fs.fstatSync(fd),one=fs.readFileSync(fd),two=fs.readFileSync(loc),b=fs.fstatSync(fd);
  if(a.ino!==st.ino||a.dev!==st.dev||a.size!==one.length||
    a.ctimeMs!==b.ctimeMs||a.mtimeMs!==b.mtimeMs||!one.equals(two))
    fail('C72_RELAY_READBACK_RACE');
  return one;
 }finally{fs.closeSync(fd);}
}
export function initializeRelay(q){
 const edge=validateRelayManifest(q);if(edge)fail(edge);
 const dir=q.stageDirectory;
 if(typeof dir!=='string'||!path.isAbsolute(dir)||path.resolve(dir)!==dir||fs.existsSync(dir))
  fail('C72_RELAY_FRESH_ABSOLUTE_STAGE_REQUIRED');
 fs.mkdirSync(dir,{mode:0o700});fs.chmodSync(dir,0o700);
 const data={schema:q.schema,source_head:q.source_head,
  expectedBlobShas:q.expectedBlobShas,priorTurnEvidence:q.priorTurnEvidence};
 const bytes=Buffer.from(JSON.stringify(data)+'\n');
 fs.writeFileSync(path.join(dir,'.c72-relay-manifest.json'),bytes,{flag:'wx',mode:0o600});
 if(validateRelayManifest(manifest(dir)))fail('C72_RELAY_MANIFEST_READBACK');
 return receipt({ok:true,phase:'STAGE_INITIALIZED',source_head:q.source_head,verified_count:0,stageDirectory:dir});
}
export function putRelayBlob(q){
 if(!plain(q)||q.schema!=='ikant-host-c72-verified-put/v1'||!NAMES.includes(q.path)||
    typeof q.contentBase64!=='string'||q.contentBase64.length>350000||
    !q.contentBase64.length||q.contentBase64.length%4!==0||!B64.test(q.contentBase64))
  fail('C72_RELAY_PUT_INVALID');
 const m=manifest(q.stageDirectory),bytes=Buffer.from(q.contentBase64,'base64');
 if(q.contentBase64!==bytes.toString('base64')||bytes.length<1||bytes.length>256000||
    blob(bytes)!==m.expectedBlobShas[q.path])fail('C72_RELAY_PINNED_BLOB_DRIFT:'+q.path);
 const str=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 if(!Buffer.from(str,'utf8').equals(bytes))fail('C72_RELAY_UTF8_LOSS');
 const parts=q.path.split('/');let d=q.stageDirectory;
 for(const part of parts.slice(0,-1)){
  d=path.join(d,part);
  if(!fs.existsSync(d))fs.mkdirSync(d,{mode:0o700});
  if(!fs.lstatSync(d).isDirectory()||fs.lstatSync(d).isSymbolicLink()||
     (fs.lstatSync(d).mode&0o077)!==0)fail('C72_RELAY_PARENT_UNSAFE');
 }
 const loc=path.join(d,parts.at(-1));
 fs.writeFileSync(loc,bytes,{flag:'wx',mode:0o600});
 if(!safeFile(q.stageDirectory,q.path).equals(bytes))fail('C72_RELAY_FILE_READBACK_MISMATCH');
 return receipt({ok:true,phase:'BLOB_REOPENED',path:q.path,blob_sha1:m.expectedBlobShas[q.path],bytes:bytes.length});
}
/** Host tool transfers pinned GitHub UTF-8 into private local file. This
 * adapter validates local bytes, not GitHub/provider event origin or consent. */
export function putRelayLocalFile(q){
 if(!plain(q)||q.schema!=='ikant-host-c72-verified-put-local/v1'||
    !NAMES.includes(q.path)||typeof q.sourceFile!=='string'||
    !path.isAbsolute(q.sourceFile)||path.resolve(q.sourceFile)!==q.sourceFile)
   fail('C72_RELAY_LOCAL_FILE_REQUEST_INVALID');
 let fd;
 try{
  const st=fs.lstatSync(q.sourceFile);
  if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size<1||
     st.size>256000||(st.mode&0o077)!==0||
     (process.getuid&&st.uid!==process.getuid())||
     fs.realpathSync(q.sourceFile)!==q.sourceFile)
    fail('C72_RELAY_LOCAL_FILE_UNSAFE');
  fd=fs.openSync(q.sourceFile,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
  const a=fs.fstatSync(fd),bytes=fs.readFileSync(fd),b=fs.fstatSync(fd);
  if(a.dev!==st.dev||a.ino!==st.ino||a.size!==bytes.length||
     a.ctimeMs!==b.ctimeMs||a.mtimeMs!==b.mtimeMs)
    fail('C72_RELAY_LOCAL_FILE_CHANGED');
  return putRelayBlob({schema:'ikant-host-c72-verified-put/v1',
   stageDirectory:q.stageDirectory,path:q.path,contentBase64:bytes.toString('base64')});
 }finally{if(fd!==undefined)fs.closeSync(fd);}
}
export function verifyRelay(q){
 if(!plain(q)||q.schema!=='ikant-host-c72-verified-verify/v1')fail('C72_RELAY_VERIFY_INVALID');
 const m=manifest(q.stageDirectory),verified=[];
 for(const name of NAMES){
  let bytes;
  try{bytes=safeFile(q.stageDirectory,name);}catch(e){
   if(e.code==='ENOENT')return receipt({ok:false,edge:'C72_RELAY_SOURCE_INCOMPLETE',missing:name,verified_count:verified.length});
   throw e;
  }
  if(blob(bytes)!==m.expectedBlobShas[name])fail('C72_RELAY_PINNED_BLOB_DRIFT:'+name);
  verified.push({path:name,blob_sha1:m.expectedBlobShas[name],bytes:bytes.length});
 }
 return receipt({ok:true,phase:'SOURCE_READY_FOR_ORIGINAL_COLD_SEED',
   stageDirectory:q.stageDirectory,source_head:m.source_head,verified_count:verified.length,verified});
}
export async function runRelayCli(raw){
 try{
  if(Buffer.byteLength(raw,'utf8')>360000)fail('C72_RELAY_STDIN_BOUNDS');
  const q=JSON.parse(raw);const op=q?.op;
  if(op==='init')return initializeRelay(q);
  if(op==='put')return putRelayBlob(q);
  if(op==='put-local')return putRelayLocalFile(q);
  if(op==='verify')return verifyRelay(q);
  return receipt({ok:false,edge:'C72_RELAY_OP_UNKNOWN'});
 }catch(e){return receipt({ok:false,edge:String(e.message||'C72_RELAY_UNKNOWN')});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let text='';for await(const chunk of process.stdin){text+=chunk.toString('utf8');
  if(Buffer.byteLength(text,'utf8')>360000)break;}
 const result=await runRelayCli(text);
 process.stdout.write(JSON.stringify(result)+'\n');if(!result.ok)process.exitCode=2;
}
