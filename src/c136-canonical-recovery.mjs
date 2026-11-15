/** C136: bounded manual byte recovery ADAPTER for original canonical source owner.
 * The ORIGINAL C59, runtime-root descriptor, activation and native-ingress
 * validators remain unchanged. This cannot issue ACTIVE or a C59 composition.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {isProxy} from 'node:util/types';
import {runtimeRootDescriptor,validateRuntimeRootDescriptor} from './runtime-root-verified.mjs';
import {validateCanonicalCompositionHandoff} from './bootstrap-semantic.mjs';

export const C136_RECOVERY_SCHEMA='ikant-le-c136-canonical-manual-recovery/v1';
export const C136_CHANNELS=Object.freeze(['WARM_CACHE_EXACT','GITHUB_API_BASE64','GITHUB_GIT_BLOB_API']);
const FAILURE=new Set(['CHANNEL_UNAVAILABLE','SOURCE_NOT_REACHABLE','OPAQUE_TRANSFER_UNSUPPORTED']);
const HEX40=/^[a-f0-9]{40}$/,HEX64=/^[a-f0-9]{64}$/;
const SAFE_REL=/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\\)[A-Za-z0-9._/-]+$/;
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const gitSha=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const deny=edge=>Object.freeze({ok:false,edge,authority:0,active:false,canonical_active:false,native_ingress_attested:false});
const plain=o=>o&&typeof o==='object'&&!Array.isArray(o)&&!isProxy(o)&&
 (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null)&&
 Reflect.ownKeys(o).every(k=>typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptors(o)[k],'value'));

/** Fail closed on uncertain writes/timeouts or a fourth, duplicated or skipped machine channel.
 * These observations are HOST_WITNESSED, never provider-authenticated events.
 */
export function issueC136RecoveryPermit({sourceHead,runtimeRootSha256,attempts}={}){
 if(!HEX40.test(String(sourceHead||''))||!HEX64.test(String(runtimeRootSha256||'')))return deny('C136_SOURCE_BINDING');
 if(!Array.isArray(attempts)||isProxy(attempts)||attempts.length!==3)return deny('C136_MACHINE_EXHAUSTION_NOT_ATTESTED');
 const seen=new Set(),ids=new Set();let prev=-1;
 for(const a of attempts){
  if(!plain(a)||!C136_CHANNELS.includes(a.channel)||seen.has(a.channel))return deny('C136_DUPLICATE_OR_UNKNOWN_CARRIER');
  seen.add(a.channel);
  if(a.outcome==='UNKNOWN'||a.outcome==='TIMEOUT_UNKNOWN'||a.side_effects!=='NONE')return deny('C136_UNCERTAIN_SIDE_EFFECT_STOP');
  if(a.outcome!=='FAILED_DEFINITIVE'||!FAILURE.has(a.error_code)||a.source_head!==sourceHead||
     a.runtime_root_sha256!==runtimeRootSha256||typeof a.attempt_id!=='string'||
     !/^[A-Za-z0-9_-]{12,96}$/.test(a.attempt_id)||ids.has(a.attempt_id)||
     !Number.isFinite(a.observed_monotonic_ms)||a.observed_monotonic_ms<=prev||
     a.host_witnessed!==true||a.machine_native_proof_attested!==false)
   return deny('C136_MACHINE_FAILURE_EVIDENCE_INVALID');
  ids.add(a.attempt_id);prev=a.observed_monotonic_ms;
 }
 const material={schema:C136_RECOVERY_SCHEMA,authority:0,owner:'CANONICAL_PRE_RUNTIME_BYTE_ADAPTER',
  source_head:sourceHead,runtime_root_sha256:runtimeRootSha256,attempt_budget:3,
  machine_channels:[...C136_CHANNELS],
  attempts:attempts.map(a=>({channel:a.channel,attempt_id:a.attempt_id,
    source_head:a.source_head,runtime_root_sha256:a.runtime_root_sha256,
    observed_monotonic_ms:a.observed_monotonic_ms,outcome:a.outcome,error_code:a.error_code,
    side_effects:a.side_effects,host_witnessed:true,machine_native_proof_attested:false})),
  decision:'MANUAL_BYTES_MAY_BE_INSPECTED_PRECANONICAL',native_ingress_attested:false,
  canonical_active:false,active:false,original_c59_handoff_authority_granted:false};
 return Object.freeze({ok:true,...material,receipt_sha256:digest(Buffer.from(JSON.stringify(material)))});
}
export function validateC136RecoveryPermit(receipt,{sourceHead,runtimeRootSha256}={}){
 if(!plain(receipt)||isProxy(receipt.machine_channels)||isProxy(receipt.attempts)||receipt.schema!==C136_RECOVERY_SCHEMA||receipt.authority!==0||
    receipt.owner!=='CANONICAL_PRE_RUNTIME_BYTE_ADAPTER'||receipt.source_head!==sourceHead||
    receipt.runtime_root_sha256!==runtimeRootSha256||receipt.attempt_budget!==3||
    receipt.decision!=='MANUAL_BYTES_MAY_BE_INSPECTED_PRECANONICAL'||
    receipt.canonical_active!==false||receipt.active!==false||
    receipt.native_ingress_attested!==false||receipt.original_c59_handoff_authority_granted!==false||
    JSON.stringify(receipt.machine_channels)!==JSON.stringify(C136_CHANNELS)||
    !HEX64.test(String(receipt.receipt_sha256||'')))return deny('C136_PERMIT_IDENTITY');
 const material={...receipt};delete material.ok;delete material.receipt_sha256;
 if(digest(Buffer.from(JSON.stringify(material)))!==receipt.receipt_sha256)return deny('C136_PERMIT_DIGEST');
 const expected=issueC136RecoveryPermit({sourceHead,runtimeRootSha256,attempts:receipt.attempts});
 if(!expected.ok||expected.receipt_sha256!==receipt.receipt_sha256)return deny(expected.edge||'C136_PERMIT_ATTEMPTS');
 return Object.freeze({ok:true,receipt_sha256:receipt.receipt_sha256,authority:0,
   active:false,canonical_active:false,native_ingress_attested:false});
}
function exactDoubleRead(manualRoot,object){
 if(!SAFE_REL.test(object.path)||!HEX40.test(object.blob_sha1)||
   !Number.isInteger(object.bytes)||object.bytes<1)throw Error('BAD_OBJECT');
 const f=path.join(manualRoot,object.path),parent=path.dirname(f);
 if(fs.realpathSync(parent)!==parent||fs.lstatSync(parent).isSymbolicLink())throw Error('PARENT_SYMLINK');
 const fd=fs.openSync(f,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
 try{
  const st=fs.fstatSync(fd);if(!st.isFile()||st.size!==object.bytes)throw Error('OBJECT_SIZE');
  const a=Buffer.alloc(object.bytes),b=Buffer.alloc(object.bytes);
  if(fs.readSync(fd,a,0,object.bytes,0)!==object.bytes||
     fs.readSync(fd,b,0,object.bytes,0)!==object.bytes||!a.equals(b)||
     gitSha(a)!==object.blob_sha1)throw Error('OBJECT_READBACK_OR_SHA');
  return a;
 }finally{fs.closeSync(fd)}
}
/** Stage exact immutable runtime-root carrier objects only; not a runtime activation. */
export function materializeC136ManualCarrier({workspace,manualRoot,outputRoot,sourceHead,permit}={}){
 if(typeof workspace!=='string'||!path.isAbsolute(workspace)||typeof manualRoot!=='string'||
    !path.isAbsolute(manualRoot)||typeof outputRoot!=='string'||!path.isAbsolute(outputRoot)||
    !HEX40.test(String(sourceHead||'')))return deny('C136_PATH_OR_SOURCE_INVALID');
 let stage=null,lockFd=null,lockPath=null;
 try{
  const descriptor=runtimeRootDescriptor(workspace),dv=validateRuntimeRootDescriptor(descriptor);
  if(!dv.ok)return deny('C136_ORIGINAL_DESCRIPTOR_INVALID');
  const gate=validateC136RecoveryPermit(permit,{sourceHead,runtimeRootSha256:descriptor.runtime_root_sha256});
  if(!gate.ok)return deny(gate.edge);
  const manualReal=fs.realpathSync(manualRoot),parent=path.dirname(outputRoot);
  if(manualReal!==manualRoot||manualReal===workspace||manualReal===outputRoot||
     fs.lstatSync(manualRoot).isSymbolicLink()||!fs.statSync(manualRoot).isDirectory()||
     fs.existsSync(outputRoot)||fs.realpathSync(parent)!==parent||
     fs.lstatSync(parent).isSymbolicLink())return deny('C136_SOURCE_OR_SINK_UNSAFE');
  // The operator-supplied destination is exclusive across local processes.
  lockPath=outputRoot+'.c136.lock';lockFd=fs.openSync(lockPath,'wx',0o600);
  if(fs.existsSync(outputRoot))return deny('C136_SINK_RACE_DENIED');
  const boot=JSON.parse(fs.readFileSync(path.join(workspace,'BOOTSTRAP.json'),'utf8'));
  const kernel=boot.post_accept_fastboot?.pre_runtime_kernel;
  if(kernel?.path!==descriptor.loader.path||kernel.blob_sha1!==descriptor.loader.blob_sha1||
     !Number.isInteger(kernel.bytes)||kernel.bytes<1)return deny('C136_ORIGINAL_KERNEL_INVALID');
  const objects=[{path:descriptor.loader.path,blob_sha1:descriptor.loader.blob_sha1,bytes:kernel.bytes},
    ...descriptor.shards.map(s=>({path:s.path,blob_sha1:s.blob_sha1,bytes:s.source_bytes}))];
  if(JSON.stringify(objects.map(o=>o.path))!==JSON.stringify(boot.post_accept_fastboot?.remote_paths)||
     objects.length!==new Set(objects.map(o=>o.path)).size)return deny('C136_FROZEN_OBJECT_SET_MISMATCH');
  const bytes=new Map();
  for(const o of objects)bytes.set(o.path,exactDoubleRead(manualRoot,o));
  stage=fs.mkdtempSync(path.join(parent,'.ikant-c136-'));
  for(const o of objects){
   const target=path.join(stage,o.path);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});
   const fd=fs.openSync(target,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL,0o600);
   try{fs.writeFileSync(fd,bytes.get(o.path));fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
   if(gitSha(fs.readFileSync(target))!==o.blob_sha1)throw Error('STAGE_REOPEN');
  }
  fs.renameSync(stage,outputRoot);stage=null;
  for(const o of objects)if(gitSha(fs.readFileSync(path.join(outputRoot,o.path)))!==o.blob_sha1)
    throw Error('PUBLISH_REOPEN');
  const body={schema:'ikant-le-c136-manual-source-readback/v1',authority:0,source_head:sourceHead,
    runtime_root_sha256:descriptor.runtime_root_sha256,permit_sha256:permit.receipt_sha256,
    source_object_count:objects.length,object_set_sha256:digest(Buffer.from(JSON.stringify(objects))),
    single_inode_double_read:true,atomic_publish:true,independent_postpublish_reopen:true,
    byte_path:'HOST_MANUAL_FILE_PRECANONICAL',native_ingress_attested:false,
    original_c59_handoff_authority_granted:false,canonical_active:false,active:false};
  const receipt=Object.freeze({...body,receipt_sha256:digest(Buffer.from(JSON.stringify(body)))});
  // Critical negative assertion: original C59 cannot accept this carrier as its native handoff.
  const native=validateCanonicalCompositionHandoff(receipt,{sourceHead,
    runtimeRootSha256:descriptor.runtime_root_sha256,runtimeRootDescriptor:descriptor});
  if(native.ok)throw Error('ORIGINAL_C59_AUTHORITY_BYPASS');
  return {ok:true,receipt,output_root:outputRoot,objects:objects.length,
    original_c59_native_handoff_valid:false,canonical_active:false,native_ingress_attested:false};
 }catch(e){return deny('C136_BYTES_ORIGINAL_READBACK_DENIED')}
 finally{if(stage)fs.rmSync(stage,{recursive:true,force:true});
  if(lockFd!==null){fs.closeSync(lockFd);try{fs.unlinkSync(lockPath)}catch{}}}
}
