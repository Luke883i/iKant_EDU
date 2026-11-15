import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';

const H40=/^[0-9a-f]{40}$/,H64=/^[0-9a-f]{64}$/;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const pathAllowed=p=>typeof p==='string'&&p.length<180&&!p.includes('..')&&
 /^(README\.md|(?:host|src|contracts|assets\/brand)\/[a-zA-Z0-9_.\/-]+)$/.test(p);
function decode64(data){
 if(typeof data!=='string'||data.length%4||data.length>3_000_000||
   !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))
  throw Error('C78_INVALID_BASE64');
 const result=Buffer.from(data,'base64');
 if(result.toString('base64')!==data)throw Error('C78_NONCANONICAL_BASE64');
 return result;
}
function validateManifest(manifest,sourceHead){
 if(!manifest||manifest.schema!=='ikant-le-c77-standalone-capsule/v1'||
    manifest.source_head!==sourceHead||manifest.mode!=='EXPERIMENTAL'||
    manifest.authority!==0||manifest.active!==false||
    manifest.source_origin_attested!==false||
    manifest.native_event_attested!==false||manifest.persistent!==false||
    manifest.cx_anchor_count!==70||!Array.isArray(manifest.files)||
    manifest.files.length<20||manifest.files.length>50)throw Error('C78_INVALID_CAPSULE_MANIFEST');
 const allowed=new Map();
 for(const file of manifest.files){
  if(!pathAllowed(file.path)||allowed.has(file.path)||!H64.test(String(file.sha256))||
     !Number.isInteger(file.bytes)||file.bytes<1||file.bytes>1_000_000||
     (file.original_source_blob_sha1!==null&&!H40.test(String(file.original_source_blob_sha1)))||
     typeof file.generated_derivative!=='boolean')throw Error('C78_INVALID_CAPSULE_ENTRY');
  allowed.set(file.path,file);
 }
 for(const p of ['host/c77-first-turn.mjs','host/c77-qualified-census.mjs',
  'contracts/c77-cx-build-proof.json','contracts/c71-cx-execution-census.json',
  'src/c70-experimental-compute-preview.mjs','src/c71-experimental-host-draft.mjs',
  'assets/brand/ikant-light.svg','assets/brand/ikant-dark.svg']){
  if(!allowed.has(p))throw Error('C78_REQUIRED_ENTRY_MISSING:'+p);
 }
 return allowed;
}
const auditStop=(edge,detail)=>({schema:'ikant-le-c78-bridge-readback/v1',
 status:'C78_STOP',first_unclosed_edge:edge,detail:String(detail||'').slice(0,180),
 active:false,canonical_runtime:false,native_event_attested:false,persistent:false,
 source_origin_attested:false,host_native_chat_delivery_attested:false,
 host_docx_delivery_attested:false,owner_receipt_issued:false,authority:0});

/**
 * C78 is a bounded host-owned byte relay, NOT a connector/Node/network API.
 * The host must supply bytes from its actually callable GitHub connector. The
 * caller-provided manifest digest checks integrity only; never source origin.
 * Creation and writes are forbidden before a validated C72 EXPERIMENTAL choice.
 */
export class C78HostRelay {
 constructor({selection,sourceHead,expectedManifestSha256,manifestBase64,
   sinkRoot=os.tmpdir()}={}){
  if(!validateC72ModeSelection(selection,{mode:'EXPERIMENTAL',sourceHead}))
   throw Error('C78_VALIDATED_POST_CONSENT_SELECTION_REQUIRED');
  if(!H40.test(String(sourceHead))||!H64.test(String(expectedManifestSha256)))
   throw Error('C78_FROZEN_SOURCE_AND_MANIFEST_REQUIRED');
  const bytes=decode64(manifestBase64);
  if(bytes.length>100_000||sha(bytes)!==expectedManifestSha256)
   throw Error('C78_MANIFEST_DIGEST_MISMATCH');
  const manifest=JSON.parse(bytes.toString('utf8'));
  const expected=validateManifest(manifest,sourceHead);
  if(typeof sinkRoot!=='string'||!path.isAbsolute(sinkRoot))
   throw Error('C78_ABSOLUTE_SINK_REQUIRED');
  const parent=fs.realpathSync(sinkRoot);
  if(!fs.statSync(parent).isDirectory())throw Error('C78_SINK_NOT_DIRECTORY');
  this.root=fs.mkdtempSync(path.join(parent,'ikant-c78-'));
  fs.chmodSync(this.root,0o700);
  this._selection=selection;
  this._sourceHead=sourceHead;
  this._manifest=manifest;
  this._manifestBytes=bytes;
  this._manifestDigest=expectedManifestSha256;
  this._files=expected;
  this._received=new Map();
  this._closed=false;
  this._ready=false;
  this._dispatches=0;
  this._sourceOriginAttested=false;
  // Leave the manifest available to C77 only after file materialization.
 }
 get expectedPaths(){return Object.freeze([...this._files.keys()].sort());}
 get receivedCount(){return this._received.size;}
 stageFile({filePath,contentBase64,sourceBlobSha1=null}={}){
  if(this._closed||this._ready)throw Error('C78_RELAY_NOT_STAGING');
  const entry=this._files.get(filePath);
  if(!entry||!pathAllowed(filePath))throw Error('C78_UNLISTED_PATH');
  if(this._received.has(filePath))throw Error('C78_DUPLICATE_PATH');
  const bytes=decode64(contentBase64);
  if(bytes.length!==entry.bytes||sha(bytes)!==entry.sha256)
   throw Error('C78_FILE_INTEGRITY_MISMATCH:'+filePath);
  if(!entry.generated_derivative){
   const object=gitBlob(bytes);
   if(entry.original_source_blob_sha1!==object||
      (sourceBlobSha1!==null&&sourceBlobSha1!==object))
    throw Error('C78_GIT_BLOB_MISMATCH:'+filePath);
  }else if(sourceBlobSha1!==null&&
    sourceBlobSha1!==entry.original_source_blob_sha1)
   throw Error('C78_DERIVATIVE_PROVENANCE_CLAIM_INVALID');
  const file=path.resolve(this.root,filePath);
  if(!file.startsWith(this.root+path.sep))throw Error('C78_PATH_TRAVERSAL');
  fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  fs.writeFileSync(file,bytes,{flag:'wx',mode:0o600});
  if(!fs.readFileSync(file).equals(bytes))throw Error('C78_FILE_READBACK_MISMATCH');
  this._received.set(filePath,{sha256:entry.sha256,bytes:entry.bytes});
  return {schema:'ikant-le-c78-stage-readback/v1',path:filePath,
   sha256:entry.sha256,bytes:entry.bytes,readback_verified:true,
   git_blob_self_consistent:!entry.generated_derivative,
   source_origin_attested:false,authority:0};
 }
 finalize(){
  if(this._closed)throw Error('C78_CLOSED');
  if(this._ready)throw Error('C78_ALREADY_FINALIZED');
  if(this._received.size!==this._files.size)
   throw Error('C78_INCOMPLETE_BYTE_TRANSFER:'+this._received.size+'/'+this._files.size);
  for(const entry of this._files.values()){
   const bytes=fs.readFileSync(path.join(this.root,entry.path));
   if(bytes.length!==entry.bytes||sha(bytes)!==entry.sha256)
    throw Error('C78_FINAL_READBACK_MISMATCH:'+entry.path);
  }
  const manifestFile=path.join(this.root,'c77-manifest.json');
  fs.writeFileSync(manifestFile,this._manifestBytes,{flag:'wx',mode:0o600});
  if(sha(fs.readFileSync(manifestFile))!==this._manifestDigest)
   throw Error('C78_FINAL_MANIFEST_READBACK_MISMATCH');
  this._ready=true;
  return {schema:'ikant-le-c78-bridge-readback/v1',
   status:'C78_NODE_BYTES_MATERIALIZED',source_head:this._sourceHead,
   manifest_sha256:this._manifestDigest,staged_files:this._received.size,
   all_bytes_reopened:true,source_origin_attested:false,
   first_unclosed_edge:'HOST_GITHUB_ORIGIN_AUTHENTICATION',
   actual_carrier:'HOST_SUPPLIED_OPAQUE_BYTES',
   active:false,canonical_runtime:false,native_event_attested:false,
   persistent:false,host_native_chat_delivery_attested:false,
   host_docx_delivery_attested:false,owner_receipt_issued:false,authority:0};
 }
 dispatch({humanInput,hostCandidate}={}){
  if(!this._ready||this._closed)throw Error('C78_BYTES_NOT_QUALIFIED');
  if(typeof humanInput!=='string'||!humanInput.trim()||
     Buffer.byteLength(humanInput,'utf8')>600||
     /(?:password\s*[:=]|api[_ -]?key\s*[:=]|bearer\s+[a-z0-9._~+-]+)/i.test(humanInput))
   return auditStop('NON_SENSITIVE_HUMAN_INPUT_REQUIRED','Input is not in experimental scope');
  if(hostCandidate!==undefined&&(typeof hostCandidate!=='string'||
      hostCandidate.length>3500))return auditStop('HOST_CANDIDATE_INVALID');
  const envelope={schema:'ikant-le-c77-experimental-turn-request/v1',
    selection:this._selection,human_input:humanInput};
  if(hostCandidate!==undefined)envelope.host_candidate=hostCandidate;
  const launched=spawnSync(process.execPath,[path.join(this.root,'host/c77-first-turn.mjs'),
      '--expected-sha256',this._manifestDigest],
    {input:JSON.stringify(envelope),encoding:'utf8',timeout:30000,maxBuffer:1024*1024,
      cwd:this.root,env:{LANG:'C',HOME:this.root,TMPDIR:this.root,
        PATH:process.env.PATH||'/usr/bin:/bin',NODE_OPTIONS:'',IKANT_C78_HOST_RELAY:'1'}});
  this._dispatches++;
  if(launched.error)return auditStop('NODE_EXECUTION_UNAVAILABLE',launched.error.message);
  let result;try{result=JSON.parse(launched.stdout?.trim()||'')}catch{
   return auditStop('NODE_READBACK_MALFORMED','No typed JSON output');}
  if(launched.status!==0||result.status!=='EXPERIMENTAL_COMPUTE_CAPSULE_READY'||
     result.active!==false||result.authority!==0||
     result.source_head!==this._sourceHead||
     result.bundle_manifest_sha256!==this._manifestDigest||
     result.input_sha256!==sha(Buffer.from(humanInput,'utf8'))||
     result.output_sha256!==sha(Buffer.from(result.voice||'','utf8'))||
     result.capsule_plan?.surface_a_chat?.text!==result.voice||
     result.capsule_plan?.surface_b_links?.length!==0||
     result.executed_repository_kernel!==true)
   return auditStop('NODE_C77_READBACK_INVALID',result.first_unclosed_edge||result.status);
  return {schema:'ikant-le-c78-bridge-readback/v1',
   status:'C78_NODE_RESPONSE_READY_HOST_DELIVERY_PENDING',
   source_head:this._sourceHead,manifest_sha256:this._manifestDigest,
   executed_kernel:true,child_process_executed:true,child_process_exit_code:launched.status,
   input_sha256:result.input_sha256,output_sha256:result.output_sha256,
   c70_status:result.c70_status,c71_status:result.c71_status,c73_status:result.c73_status,
   surface_a_chat:{kind:'ORDINARY_CHAT_UNSEALED_DRAFT',text:result.voice,
      source:result.voice_source},
   surface_b_links:[],turn_dispatched_count:this._dispatches,
   first_unclosed_edge:'HOST_GITHUB_ORIGIN_AUTHENTICATION',
   downstream_unverified_edge:'HOST_NATIVE_CHAT_SURFACE_A_DELIVERY',
   source_origin_attested:false,host_native_chat_delivery_attested:false,
   inter_turn_persistence_attested:false,host_docx_delivery_attested:false,
   active:false,canonical_runtime:false,native_event_attested:false,persistent:false,
   owner_receipt_issued:false,authority:0};
 }
 close(){
  if(this._closed)return;
  this._closed=true;
  fs.rmSync(this.root,{recursive:true,force:true});
 }
}
export const c78HostStop=auditStop;
