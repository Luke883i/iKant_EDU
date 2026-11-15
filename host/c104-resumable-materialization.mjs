import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';

/* C104: resumable source-byte ingress, not an owner, downloader, model, or a
   new state writer. Existing C77/C78/C81/C87/C96 keep their original roles.
   All source transport must be supplied by a genuinely invoked host adapter. */
const S='ikant-le-c104-resumable-materialization/v1';
const H40=/^[a-f0-9]{40}$/, H64=/^[a-f0-9]{64}$/;
const PATH=/^(?:README\.md|(?:host|src|scripts|contracts|assets\/brand)\/[A-Za-z0-9_.\/-]+)$/;
const ID=/^[A-Za-z0-9_.-]{2,48}$/;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const flags={authority:0,active:false,canonical_runtime:false,native_event_attested:false,
 native_delivery_attested:false,github_origin_attested:false,owner_executed:false,
 native_host_hook_attested:false,source_cache_is_runtime:false};
const deny=edge=>({schema:S,status:'C104_STOP',first_unclosed_edge:edge,...flags});
function safePath(p){return typeof p==='string'&&p.length<=180&&PATH.test(p)&&p.split('/').every(x=>x&&x!=='.'&&x!=='..');}
function verifySpec(spec,specSha,head){
 if(!spec||Object.getPrototypeOf(spec)!==Object.prototype||spec.schema!=='ikant-le-c104-source-spec/v1'||
  spec.source_head!==head||!H40.test(head||'')||!H64.test(specSha||'')||
  hash(Buffer.from(JSON.stringify(spec)))!==specSha||spec.authority!==0||spec.github_origin_attested!==false||
  !Array.isArray(spec.files)||spec.files.length<1||spec.files.length>256)return false;
 let total=0;const names=new Set();
 for(const f of spec.files){
  if(!f||Object.getPrototypeOf(f)!==Object.prototype||!safePath(f.path)||names.has(f.path)||
   !H40.test(f.git_blob_sha1||'')||!Number.isSafeInteger(f.bytes)||f.bytes<=0||f.bytes>1_000_000)return false;
  total+=f.bytes;names.add(f.path);
 }
 return total<=12_000_000&&spec.files.every((x,i,a)=>i===0||a[i-1].path<x.path);
}
function safeRoot(root){
 try {if(typeof root!=='string'||!path.isAbsolute(root))return false;
  const s=fs.lstatSync(root);return s.isDirectory()&&!s.isSymbolicLink()&&fs.realpathSync(root)===root;
 }catch{return false;}
}
function validate(ctx){
 try{
  if(!ctx||!verifySpec(ctx.spec,ctx.specSha256,ctx.sourceHead)||
    !validateC72ModeSelection(ctx.selection,{mode:'EXPERIMENTAL',sourceHead:ctx.sourceHead})||
    !safeRoot(ctx.cacheRoot))return null;
  const dir=path.join(ctx.cacheRoot,'c104-'+ctx.sourceHead+'-'+ctx.specSha256.slice(0,24));
  return {dir,files:ctx.spec.files,head:ctx.sourceHead,digest:ctx.specSha256};
 }catch{return null;}
}
function protectedParents(root,parent,create=false){
 const relative=path.relative(root,parent);
 if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('OUTSIDE_HOST_CACHE');
 let at=root;
 for(const part of relative.split(path.sep).filter(Boolean)){
  at=path.join(at,part);
  try{const st=fs.lstatSync(at);if(!st.isDirectory()||st.isSymbolicLink())throw Error('C104_SYMLINK_OR_FILE_PARENT');}
  catch(e){if(e.code!=='ENOENT'||!create)throw e;
   fs.mkdirSync(at,{mode:0o700});}
 }
 return true;
}
function contentFile(dir,p){return path.join(dir,'objects',...p.split('/'));}
function inspectOne(dir,f,root){
 const filename=contentFile(dir,f.path);
 try{
  protectedParents(root,path.dirname(filename));
  const st=fs.lstatSync(filename);
  if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size!==f.bytes)return 'CORRUPT';
  const b=fs.readFileSync(filename);
  return b.length===f.bytes&&blob(b)===f.git_blob_sha1?'VERIFIED':'CORRUPT';
 }catch(e){return e.code==='ENOENT'?'MISSING':'CORRUPT';}
}
/** Source progress is derived from reread bytes, never from a model promise. */
export function inspectC104(ctx){
 const p=validate(ctx);if(!p)return deny('C104_SPEC_ADMISSION_OR_ROOT');
 const missing=[],corrupt=[];let verified=0,bytes=0;
 for(const f of p.files){const v=inspectOne(p.dir,f,ctx.cacheRoot);
  if(v==='VERIFIED'){verified++;bytes+=f.bytes;}
  else if(v==='CORRUPT')corrupt.push(f.path);else missing.push(f.path);
 }
 const done=missing.length===0&&corrupt.length===0;
 return {schema:S,status:done?'C104_SOURCE_BYTES_100PCT_NOT_RUNTIME':'C104_MATERIALIZATION_NEXT_REQUIRED',
  source_head:p.head,spec_sha256:p.digest,total:p.files.length,verified,bytes_verified:bytes,
  missing,corrupt,next_batch:[...corrupt,...missing].slice(0,8),
  completion_percent:Number((verified/p.files.length*100).toFixed(3)),
  compute_priority:done?'RUNTIME_QUALIFICATION_BEFORE_COGNITION':'SOURCE_MATERIALIZATION',
  runtime_qualified:false,model_may_claim_complete:false,
  first_unclosed_edge:done?'ORIGINAL_C77_C81_COGNITIVE_READBACK':'C104_REQUIRED_SOURCE_BYTES_MISSING',...flags};
}
/** One verified file, exclusive creation and physical reopening. No network. */
export function stageC104({context,filePath,contentBase64,carrierId}={}){
 const p=validate(context);if(!p)return deny('C104_SPEC_ADMISSION_OR_ROOT');
 const f=p.files.find(x=>x.path===filePath);
 if(!f||!ID.test(carrierId||'')||typeof contentBase64!=='string'||
  contentBase64.length>1_500_000||contentBase64.length%4!==0||
  !/^[A-Za-z0-9+/]*={0,2}$/.test(contentBase64))return deny('C104_CARRIER_OR_FILE_ENVELOPE');
 const b=Buffer.from(contentBase64,'base64');
 if(b.toString('base64')!==contentBase64||b.length!==f.bytes||blob(b)!==f.git_blob_sha1)
  return deny('C104_ORIGINAL_GIT_BLOB_MISMATCH');
 if(inspectOne(p.dir,f,context.cacheRoot)==='VERIFIED')return {...inspectC104(context),stage:'EXACT_CACHE_REUSED'};
 if(inspectOne(p.dir,f,context.cacheRoot)==='CORRUPT')return deny('C104_CACHE_TAMPER_NOT_OVERWRITTEN');
 const target=contentFile(p.dir,f.path),parent=path.dirname(target);
 let temp;
 try{
  protectedParents(context.cacheRoot,parent,true);
  temp=target+'.tmp-'+crypto.randomBytes(8).toString('hex');
  const fd=fs.openSync(temp,'wx',0o600);
  try{if(fs.writeSync(fd,b)!==b.length)throw Error('SHORT_WRITE');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  fs.linkSync(temp,target);fs.unlinkSync(temp);temp=null;
  if(inspectOne(p.dir,f,context.cacheRoot)!=='VERIFIED')throw Error('PHYSICAL_REOPEN_MISMATCH');
  const result=inspectC104(context);
  return {...result,stage:'HOST_SUPPLIED_BYTES_WRITTEN_REOPENED',stage_path:filePath,
   source_git_blob_self_consistent:true,host_connector_origin_attested:false};
 }catch(e){
  if(temp)try{fs.unlinkSync(temp);}catch{}
  if(e.code==='EEXIST'&&inspectOne(p.dir,f,context.cacheRoot)==='VERIFIED')return {...inspectC104(context),stage:'CONCURRENT_EXACT_REUSE'};
  return deny('C104_EXCLUSIVE_WRITE_OR_READBACK');
 }
}
/** Parallelism is real only when caller installs and invokes a readFile port. */
export async function runC104HostWorkers({context,readFile,carrierId='HOST_FILE',carrierEvidenceSha256,concurrency=8}={}){
 if(typeof readFile!=='function'||!ID.test(carrierId)||!H64.test(carrierEvidenceSha256||'')||!Number.isInteger(concurrency)||concurrency<1||concurrency>12)
  return deny('C104_REAL_HOST_READ_PORT_REQUIRED');
 const p=validate(context);if(!p)return deny('C104_SPEC_ADMISSION_OR_ROOT');
 let start=inspectC104(context);if(start.status==='C104_STOP'||start.corrupt.length)return start;
 const pending=p.files.filter(f=>start.missing.includes(f.path));let cursor=0,invocations=0,success=0,skipped=0;
 const failures=[];
 const denialRoot=path.join(p.dir,'failed-carrier-attempts');
 const marker=f=>path.join(denialRoot,hash(Buffer.from(f.path+'\0'+carrierId+'\0'+carrierEvidenceSha256))); 
 const worker=async()=>{for(;;){const i=cursor++;if(i>=pending.length)return;
  const f=pending[i];try{
   if(fs.existsSync(marker(f))){skipped++;continue;}
   invocations++;
   const raw=await readFile(Object.freeze({sourceHead:p.head,path:f.path,gitBlobSha1:f.git_blob_sha1,bytes:f.bytes}));
   if(!Buffer.isBuffer(raw))throw Error('CALLBACK_MUST_RETURN_BYTES');
   const r=stageC104({context,filePath:f.path,contentBase64:raw.toString('base64'),carrierId});
   if(r.status==='C104_STOP')throw Error(r.first_unclosed_edge);success++;
  }catch(e){failures.push({path:f.path,error:String(e.message||e).slice(0,90)});
   try{protectedParents(context.cacheRoot,denialRoot,true);fs.writeFileSync(marker(f),'DENIED\n',{flag:'wx',mode:0o600});}
   catch{}
  }
 }};
 await Promise.all(Array.from({length:Math.min(concurrency,pending.length||1)},worker));
 const end=inspectC104(context);
 return {...end,actual_callback_invocations:invocations,successful_stages:success,
  failures:failures.slice(0,30),skipped_unchanged_failed_carrier:skipped,host_read_port_called:invocations>0,
  source_provider_authenticated:false};
}
/** Real local C77 invocation after full source byte acquisition. This checks
 *  actual Node execution, NOT GitHub source origin or native ChatGPT ingress. */
export async function qualifyC104C77Handoff({context,capsuleDir,manifestSha256,humanInput}={}){
 const cache=inspectC104(context);
 if(cache.status!=='C104_SOURCE_BYTES_100PCT_NOT_RUNTIME')return deny('C104_SOURCE_GRAPH_NOT_100PCT');
 if(typeof capsuleDir!=='string'||!path.isAbsolute(capsuleDir)||
  !H64.test(manifestSha256||'')||typeof humanInput!=='string'||!humanInput.trim()||
  Buffer.byteLength(humanInput,'utf8')>600)return deny('C104_C77_LOCAL_INPUT_OR_MANIFEST');
 try{
  const manifestFile=path.join(capsuleDir,'c77-manifest.json');
  const bytes=fs.readFileSync(manifestFile);
  if(hash(bytes)!==manifestSha256)return deny('C104_C77_MANIFEST_HASH');
  const manifest=JSON.parse(bytes.toString('utf8'));
  if(manifest.source_head!==context.sourceHead||manifest.files?.length!==35)
   return deny('C104_C77_CAPSULE_SOURCE_EPOCH');
  const entry=path.join(capsuleDir,'host/c77-first-turn.mjs');
  const c77=await import(pathToFileURL(entry).href);
  const r=await c77.executeC77FirstTurn({schema:'ikant-le-c77-experimental-turn-request/v1',
   selection:context.selection,human_input:humanInput},manifestSha256);
  if(r.status!=='EXPERIMENTAL_COMPUTE_CAPSULE_READY'||r.executed_repository_kernel!==true||
   r.bundle_manifest_sha256!==manifestSha256||r.source_head!==context.sourceHead||
   r.input_sha256!==hash(Buffer.from(humanInput,'utf8'))||
   typeof r.voice!=='string'||r.output_sha256!==hash(Buffer.from(r.voice,'utf8'))||
   r.active!==false||r.native_delivery_attested!==false)
   return deny('C104_ORIGINAL_C77_C70_C71_READBACK_FAILED');
  return {schema:S,status:'C104_ORIGINAL_C77_LOCAL_COGNITION_EXECUTED',
   source_head:context.sourceHead,input_sha256:r.input_sha256,output_sha256:r.output_sha256,
   voice_utf8:r.voice,c77_status:r.status,c70_status:r.c70_status,c71_status:r.c71_status,
   materialized_source_blobs:cache.verified,compute_priority:'HUMAN_INTERACTION',
   local_c77_invoked:true,runtime_qualified:true,
   first_unclosed_edge:'HOST_NATIVE_AUTOMATIC_DISPATCH_AND_SOURCE_ORIGIN',...flags};
 }catch{return deny('C104_ORIGINAL_C77_EXECUTION_UNAVAILABLE');}
}
export const C104_SOURCE_SCHEMA='ikant-le-c104-source-spec/v1';
