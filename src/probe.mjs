import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import { runtimePaths } from './state.mjs';
import { runtimeRootDescriptor,validateRuntimeRootDescriptor } from './runtime-root-verified.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlobSha1=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function executedProvenance(){
 const d=runtimeRootDescriptor(ROOT),v=validateRuntimeRootDescriptor(d);if(!v.ok)throw new Error('runtime descriptor invalid for executed provenance');
 const modules=['src/probe.mjs','src/runtime-command.mjs'].map(rel=>{const spec=d.members.find(x=>x.path===rel);if(!spec)throw new Error('runtime provenance member missing:'+rel);const bytes=fs.readFileSync(path.join(ROOT,rel)),blob=gitBlobSha1(bytes);if(bytes.length!==spec.bytes||blob!==spec.blob_sha1)throw new Error('executed provenance mismatch:'+rel);return{path:rel,blob_sha1:blob,bytes:bytes.length};});
 const material={schema:'ikant-le-executed-provenance/v1',runtime_root_sha256:d.runtime_root_sha256,runtime_root_path_sha256:sha256(Buffer.from(ROOT)),modules,readback_verified:true,relative_import_chain:true,authority:0};return{...material,receipt_sha256:sha256(Buffer.from(JSON.stringify(material)))};
}
export function runProbe({warm=false,hostSurface='LOCAL_NODE_CHAT_HOST'}={}){const major=Number(process.versions.node.split('.')[0]);if(!Number.isInteger(major)||major<20)return{ok:false,reason:'Node.js 20+ required',terminal:'HOST_INCOMPATIBLE'};const{dir}=runtimePaths();fs.mkdirSync(dir,{recursive:true});const p=path.join(dir,`probe-${crypto.randomUUID()}.tmp`);const a='ikant-le-probe';const b='\nappend-readback';try{fs.writeFileSync(p,a,{mode:0o600});if(fs.readFileSync(p,'utf8')!==a)return{ok:false,reason:'FS readback failed',terminal:'HOST_INCOMPATIBLE'};if(!warm){fs.appendFileSync(p,b);if(fs.readFileSync(p,'utf8')!==a+b)return{ok:false,reason:'FS append/readback failed',terminal:'HOST_INCOMPATIBLE'};}const h=crypto.createHash('sha256').update(warm?a:a+b).digest('hex');if(h.length!==64)return{ok:false,reason:'crypto unavailable',terminal:'HOST_INCOMPATIBLE'};if(!Number.isFinite(Date.now()))return{ok:false,reason:'clock unavailable',terminal:'HOST_INCOMPATIBLE'};const provenance=executedProvenance();fs.unlinkSync(p);if(fs.existsSync(p))return{ok:false,reason:'FS delete failed',terminal:'HOST_INCOMPATIBLE'};return{ok:true,node:process.versions.node,fs:warm?'write+readback+delete':'crud+append+readback+delete',crypto:'sha256',clock:'Date.now',artifact_sink:true,host_surface:String(hostSurface),warm,executed_provenance:provenance};}catch(err){try{fs.unlinkSync(p);}catch{}return{ok:false,reason:String(err?.message||err),terminal:'HOST_INCOMPATIBLE'};}}
