import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {validateC94C77Archive} from './c94-zip-c77.mjs';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const H40=/^[a-f0-9]{40}$/; const H64=/^[a-f0-9]{64}$/;
const firstContact=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const kinds=new Set(['HOST_GITHUB_FILE','HOST_GITHUB_ARTIFACT','NODE_HTTPS_ARTIFACT','EXACT_LOCAL_CACHE','HOST_FILE_BRIDGE']);
const canonicalB64=x=>typeof x==='string'&&x.length>0&&x.length%4===0&&/^[A-Za-z0-9+/]*={0,2}$/.test(x)&&Buffer.from(x,'base64').toString('base64')===x;
const pathOK=x=>typeof x==='string'&&x.length>0&&x.length<=180&&x.split('/').every(s=>s&&s!=='.'&&s!=='..'&&/^[a-zA-Z0-9_.-]+$/.test(s));
const stop=(e,extra={})=>({schema:'ikant-le-c96-acquisition/v1',status:'C96_STOP',first_unclosed_edge:e,
 manual_zip_auto_selected:false,host_origin_attested:false,native_event_attested:false,
 c81_reachability_attested:false,owner_executed:false,active:false,authority:0,...extra});
const nativeFlags={manual_zip_auto_selected:false,host_origin_attested:false,native_event_attested:false,
 c81_reachability_attested:false,owner_executed:false,active:false,authority:0};
export function firstContactC96Plan(input){
 if(typeof input!=='string'||!input.trim())return stop('FIRST_CONTACT_INPUT');
 return {schema:'ikant-le-c96-preaccept-plan/v1',status:'C96_ONLY_FIVE_PINNED_READS_THEN_TERMS_STOP',
 ordered_paths:[...firstContact],allowed_operations:['GITHUB_API_READ_FIVE_PATHS','DISPLAY_PINNED_TERMS','STOP_FOR_LATER_I_ACCEPT'],
 consent_attested:false,other_repository_reads_allowed:false,automatic_runtime_acquisition_allowed:false,
 ...nativeFlags};
}
function validateManifest(manifest,head){
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest)||
  manifest.schema!=='ikant-le-c77-standalone-capsule/v1'||manifest.source_head!==head||
  manifest.cx_anchor_count!==70||!Array.isArray(manifest.files)||
  manifest.files.length<20||manifest.files.length>50)return 'SOURCE_MANIFEST_UNQUALIFIED';
 const seen=new Set();
 for(const f of manifest.files){
  if(!f||!pathOK(f.path)||seen.has(f.path)||!H64.test(f.sha256||'')||
    !Number.isSafeInteger(f.bytes)||f.bytes<1||f.bytes>1_000_000)return 'UNSAFE_MANIFEST_FILE';
  seen.add(f.path);
 }
 if(!seen.has('contracts/c77-cx-build-proof.json')||!seen.has('src/c71-experimental-host-draft.mjs'))
  return 'DERIVED_C77_CX_FILES_MISSING';
 return null;
}
export function planC96PostAccept({sourceHead,manifest,manifestBase64,expectedManifestSha256,selection,carriers=[],concurrency=6}={}){
 if(!H40.test(sourceHead||'')||!H64.test(expectedManifestSha256||''))return stop('SOURCE_HEAD_AND_MANIFEST_DIGEST');
 if(!selection||selection.selected_mode!=='EXPERIMENTAL'||
  selection.status!=='EXPERIMENTAL_SELECTED_NOT_RUNNING')return stop('HOST_C72_MODE_SELECTION_UNVERIFIED');
 if(!canonicalB64(manifestBase64)||manifestBase64.length>160000)return stop('MANIFEST_RAW_BYTES_REQUIRED');
 const original=Buffer.from(manifestBase64,'base64');
 if(original.length>120000||digest(original)!==expectedManifestSha256)return stop('MANIFEST_SHA256_DRIFT');
 let parsed;try{parsed=JSON.parse(original.toString('utf8'));}catch{return stop('MANIFEST_BYTES_INVALID_JSON');}
 if(JSON.stringify(parsed)!==JSON.stringify(manifest))return stop('MANIFEST_OBJECT_DRIFT');
 const mv=validateManifest(manifest,sourceHead);if(mv)return stop(mv);
 if(!Number.isInteger(concurrency)||concurrency<1||concurrency>12)return stop('BOUNDED_CONCURRENCY');
 if(!Array.isArray(carriers)||carriers.length>12)return stop('CARRIER_LIST_BOUNDS');
 const ids=new Set();const usable=[];
 for(const c of carriers){
  if(!c||typeof c.id!=='string'||!/^[A-Za-z0-9_.-]{2,32}$/.test(c.id)||ids.has(c.id)||
    !kinds.has(c.kind)||!Number.isSafeInteger(c.estimatedMs)||c.estimatedMs<1||c.estimatedMs>120000)
   return stop('CARRIER_DESCRIPTOR_INVALID');
  ids.add(c.id);
  const fileKind=c.kind==='HOST_GITHUB_FILE'||c.kind==='EXACT_LOCAL_CACHE'||c.kind==='HOST_FILE_BRIDGE';
  const allowed=fileKind?['estimatedMs','id','kind','readFile']:['estimatedMs','id','kind','readArchive'];
  if(Object.keys(c).sort().join(',')!==allowed.sort().join(','))
   return stop('CARRIER_DESCRIPTOR_INVALID');
  if(fileKind){if(typeof c.readFile!=='function')continue;}
  else if(typeof c.readArchive!=='function')continue;
  usable.push(c);
 }
 usable.sort((a,b)=>a.estimatedMs-b.estimatedMs||a.id.localeCompare(b.id));
 if(!usable.length)return {schema:'ikant-le-c96-acquisition/v1',status:'C96_NO_REGISTERED_AUTOMATIC_CARRIER',
  first_unclosed_edge:'HOST_AUTOMATIC_CARRIER_CAPABILITY_NOT_INSTALLED',
  manually_selectable_only_after_explicit_user_decision:true,manual_zip_auto_selected:false,
  unique_members:manifest.files.length,cx_anchors_to_verify:70, ...nativeFlags};
 // Prefer independent transport KIND for the second hedge when physically registered.
 // Claimed endpoint diversity is not provider-origin authentication.
 const first=usable[0],different=usable.find(c=>c.kind!==first.kind);
 const candidates=[first,...(different?[different]:(usable[1]?[usable[1]]:[]))];
 for(const c of usable)if(candidates.length<3&&!candidates.some(x=>x.id===c.id))candidates.push(c);
 return {schema:'ikant-le-c96-acquisition/v1',status:'C96_AUTOMATIC_PLAN_HOST_CAPABILITY_NOT_AUTHENTICATED',
  source_head:sourceHead,expected_manifest_sha256:expectedManifestSha256,
  unique_members:manifest.files.length,cx_anchors_to_verify:70,
  carrier_ids:candidates.map(x=>x.id), max_concurrent_members:concurrency,
  max_hedges_per_member:Math.min(2,candidates.length),expected_member_sha256:manifest.files.map(f=>({path:f.path,sha256:f.sha256})),
  first_unclosed_edge:'ACTUAL_CARRIER_BYTES_AND_C81_GIT_PROOF',...nativeFlags};
}
const boundedRead=async (candidate,sourceHead,f,expectedManifestSha256,archives)=>{
 let value;
 if(typeof candidate.readArchive==='function'){
  if(!archives.has(candidate.id))archives.set(candidate.id,Promise.resolve().then(()=>candidate.readArchive({sourceHead}))
   .then(raw=>{
    if(!Buffer.isBuffer(raw))throw Error('NON_BINARY_ZIP');
    const c=validateC94C77Archive(raw,{sourceHead});
    if(c.status!=='C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN'||c.manifest_sha256!==expectedManifestSha256)
     throw Error('C77_ZIP_MANIFEST_OR_HEAD');
    return c.content;
   }));
  value=(await archives.get(candidate.id)).get(f.path);
 }else value=await candidate.readFile({sourceHead,path:f.path,sha256:f.sha256});
 if(!Buffer.isBuffer(value)||value.length!==f.bytes||digest(value)!==f.sha256)
  throw Error('CARRIER_MEMBER_BYTES_DRIFT');
 return Buffer.from(value);
};
/** All callbacks must be ACTUALLY installed by a host; a model-written name proves nothing.
 * Per-member source SHA precedes one atomic write/readback; failure never publishes a partial capsule.
 * This prepares C77 files only. It cannot mint C81, C72, ACTIVE, provider, or native UI receipts. */
export async function acquireC96PostAccept({sourceHead,manifest,manifestBase64,expectedManifestSha256,selection,carriers=[],concurrency=6,parentDir=os.tmpdir()}={}){
 const planned=planC96PostAccept({sourceHead,manifest,manifestBase64,expectedManifestSha256,selection,carriers,concurrency});
 if(planned.status!=='C96_AUTOMATIC_PLAN_HOST_CAPABILITY_NOT_AUTHENTICATED')return planned;
 if(typeof parentDir!=='string'||!path.isAbsolute(parentDir))return stop('ABSOLUTE_OUTPUT_PARENT_REQUIRED');
 const candidates=planned.carrier_ids.map(id=>carriers.find(c=>c.id===id));
 const archives=new Map(),out=new Array(manifest.files.length),failures=[];let cursor=0;
 const work=async()=>{for(;;){const i=cursor++;if(i>=manifest.files.length)return;
   const f=manifest.files[i],attempts=candidates.slice(0,Math.min(2,candidates.length));
   const settled=await Promise.allSettled(attempts.map(c=>boundedRead(c,sourceHead,f,expectedManifestSha256,archives)));
   const success=settled.find(x=>x.status==='fulfilled');
   if(success)out[i]=success.value;
   else failures.push({path:f.path,attempted:attempts.map(c=>c.id),first_error:String(settled[0]?.reason?.message||'READ_FAILED').slice(0,100)});
 }};
 try{await Promise.all(Array.from({length:Math.min(concurrency,manifest.files.length)},work));}
 catch{return stop('CARRIER_EXECUTOR_EXCEPTION');}
 if(failures.length)return stop('AUTOMATIC_MEMBER_ACQUISITION_INCOMPLETE',{
  unique_members:manifest.files.length,verified_members:out.filter(Boolean).length,failures:failures.slice(0,20),
  manual_zip_suggested:false,next_action:'CHECK_OR_INSTALL_AUTOMATIC_CARRIER_AND_RETRY'});
 let dir=null;
 try{
  dir=fs.mkdtempSync(path.join(parentDir,'ikant-c96-'));
  const files=[];
  for(let i=0;i<manifest.files.length;i++){
   const f=manifest.files[i],bytes=out[i],target=path.resolve(dir,f.path);
   if(!target.startsWith(dir+path.sep))throw Error('PATH_ESCAPE');
   fs.mkdirSync(path.dirname(target),{recursive:true});
   const fd=fs.openSync(target,'wx',0o600);
   try{if(fs.writeSync(fd,bytes)!==bytes.length)throw Error('SHORT_WRITE');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
   const reopened=fs.readFileSync(target);
   if(!reopened.equals(bytes)||digest(reopened)!==f.sha256)throw Error('FS_READBACK_HASH_MISMATCH');
   files.push({path:f.path,bytes:bytes.length,sha256:f.sha256});
  }
  return {schema:'ikant-le-c96-acquisition/v1',status:'C96_C77_FILES_REOPENED_C81_STILL_REQUIRED',
   source_head:sourceHead,output_dir:dir,files,verified_members:files.length,unique_members:files.length,
   cx_anchors_to_verify:70,archive_reads_started:archives.size,
   next_unverified_edge:'C77_DERIVATION_CX70_C84_C85_C81_AND_C90_OWNER',
   actual_carrier_callbacks_invoked:true,per_file_reopen_verified:true,
   ...nativeFlags};
 }catch(e){if(dir)fs.rmSync(dir,{recursive:true,force:true});
  return stop('MATERIALIZATION_ATOMIC_READBACK_FAILED',{detail:String(e?.message||e).slice(0,110)});}
}
