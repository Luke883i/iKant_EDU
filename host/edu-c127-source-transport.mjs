/** C127: content-addressed Project cache + honest bounded host transfer.
 * Distribution aid ONLY, not an iKant source owner, admission gate or retry owner.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {isProxy} from 'node:util/types';
import {PIN,inspectC107Carrier} from './c107-carrier-consumer.mjs';
import {C124_SOURCE_EPOCH,C124_OVERLAY_GIT_BLOBS,verifyC124OverlayBytes} from './c124-source-overlay.mjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const paths=Object.keys(C124_OVERLAY_GIT_BLOBS).sort();
const canonical=s=>typeof s==='string'&&s.length%4===0&&/^[A-Za-z0-9+/]*={0,2}$/.test(s)&&Buffer.from(s,'base64').toString('base64')===s;
const safe=o=>o&&typeof o==='object'&&!isProxy(o)&&!Array.isArray(o)&&
 (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null)&&
 Reflect.ownKeys(o).every(k=>typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptors(o)[k],'value'));
const bad=edge=>Object.freeze({ok:false,first_edge:edge,active:false,provider_origin_attested:false});
function normalized(carrier,overlays){
 if(!Buffer.isBuffer(carrier)||carrier.length!==PIN.carrier_bytes||hash(carrier)!==PIN.carrier_sha256)return bad('C127_C107_CARRIER_DIGEST');
 if(inspectC107Carrier(carrier)?.status!=='C107_SOURCE_EXACT_VERIFIED_NOT_EXECUTED')return bad('C127_C107_ORIGINAL_INSPECT');
 const verified=verifyC124OverlayBytes(overlays);
 if(!verified.ok)return bad(verified.first_edge||'C127_C124_SOURCE_GIT_BLOB');
 return {ok:true,carrierBytes:carrier,c124OverlayBytes:overlays,source_head:C124_SOURCE_EPOCH,
  original_source_head:PIN.head,carrier_sha256:PIN.carrier_sha256,
  overlay_sha256:verified.overlay_sha256,active:false,provider_origin_attested:false};
}
export function buildC127SourceCache({carrierBytes,c124OverlayBytes}={}){
 const r=normalized(carrierBytes,c124OverlayBytes);if(!r.ok)return r;
 const obj={schema:'ikant-c127-project-source-cache/v1',source_epoch:C124_SOURCE_EPOCH,
  original_head:PIN.head,carrier_sha256:PIN.carrier_sha256,
  carrier_base64:carrierBytes.toString('base64'),
  overlays:paths.map(p=>({path:p,git_blob_sha1:C124_OVERLAY_GIT_BLOBS[p],
   bytes:c124OverlayBytes[p].length,base64:c124OverlayBytes[p].toString('base64')}))};
 const bytes=Buffer.from(JSON.stringify(obj)+'\n','utf8');
 return {ok:true,bytes,sha256:hash(bytes),members:4,active:false};
}
export function inspectC127SourceCache(raw){
 try{
  if(!Buffer.isBuffer(raw)||raw.length<62000||raw.length>250000)return bad('C127_CACHE_LENGTH');
  // C128: decoding must not normalize invalid UTF-8 or ambiguous JSON bytes.
  const utf8=raw.toString('utf8');
  if(!Buffer.from(utf8,'utf8').equals(raw))return bad('C128_CACHE_NONCANONICAL_UTF8');
  const o=JSON.parse(utf8);
  if(!Buffer.from(JSON.stringify(o)+'\n','utf8').equals(raw))
   return bad('C128_CACHE_NONCANONICAL_JSON');
  if(!safe(o)||Reflect.ownKeys(o).length!==6||
    o.schema!=='ikant-c127-project-source-cache/v1'||o.source_epoch!==C124_SOURCE_EPOCH||
    o.original_head!==PIN.head||o.carrier_sha256!==PIN.carrier_sha256||
    !canonical(o.carrier_base64)||!Array.isArray(o.overlays)||isProxy(o.overlays)||
    o.overlays.length!==3)return bad('C127_CACHE_SCHEMA');
  const seen=new Set(),overlay=Object.create(null);
  for(const item of o.overlays){
   if(!safe(item)||Reflect.ownKeys(item).length!==4||
      !paths.includes(item.path)||seen.has(item.path)||
      item.git_blob_sha1!==C124_OVERLAY_GIT_BLOBS[item.path]||
      !canonical(item.base64))return bad('C127_CACHE_OVERLAY_ENTRY');
   const bytes=Buffer.from(item.base64,'base64');
   if(item.bytes!==bytes.length)return bad('C127_CACHE_OVERLAY_LENGTH');
   overlay[item.path]=bytes;seen.add(item.path);
  }
  const r=normalized(Buffer.from(o.carrier_base64,'base64'),overlay);
  if(!r.ok)return r;
  // Independent roundtrip through the frozen C127 writer: one physical byte identity,
  // exactly one canonical order of the four source regions.
  const rebuilt=buildC127SourceCache({carrierBytes:r.carrierBytes,c124OverlayBytes:r.c124OverlayBytes});
  if(!rebuilt.ok||!rebuilt.bytes.equals(raw))return bad('C128_CACHE_NONCANONICAL_SOURCE_ORDER');
  return {...r,cache_sha256:hash(raw),member_count:4,source_transport:'C127_LOCAL_CACHE_BYTES_VERIFIED'};
 }catch{return bad('C127_CACHE_PARSE_OR_BYTES')}
}
export function loadC127SourceCache(cachePath){
 if(typeof cachePath!=='string'||!cachePath.startsWith('/')||cachePath.length>4096)
  return bad('C127_ABSOLUTE_PATH_REQUIRED');
 let fd=null;
 try{
  // Validate and read from a single held inode. Path-based lstat/readFileSync/readFileSync
  // opens three times and allows symlink or inode replacement between operations.
  fd=fs.openSync(cachePath,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  const first=fs.fstatSync(fd);
  if(!first.isFile()||first.size<62000||first.size>250000)return bad('C127_LOCAL_FILE_UNSAFE');
  function reread(){
   const out=Buffer.alloc(first.size);
   let offset=0;
   while(offset<out.length){
    const n=fs.readSync(fd,out,offset,out.length-offset,offset);
    if(n<=0)return null;
    offset+=n;
   }
   return out;
  }
  const a=reread(),b=reread(),last=fs.fstatSync(fd);
  if(!a||!b||!a.equals(b)||last.size!==first.size||
     last.ino!==first.ino||last.dev!==first.dev)return bad('C128_CACHE_FILE_READBACK_DRIFT');
  const r=inspectC127SourceCache(a);
  return r.ok?{...r,file_readback_verified:true,single_inode_readback_verified:true}:r;
 }catch{return bad('C127_LOCAL_CACHE_UNAVAILABLE')}
 finally{if(fd!==null){try{fs.closeSync(fd)}catch{}}}
}
/** Only genuinely callable, *distinct* host transports are attempted; no invented retries.
 * callbacks return physical cache bytes. Max 1 initial + 2 evidence-distinct methods.
 * The fallback is a recommendation to the HUMAN, never an automatic download.
 */
export async function resolveC127Transport({admitted=false,cachePath=null,bridges=[]}={}){
 if(admitted!==true)return bad('C127_ORIGINAL_C72_ADMISSION_REQUIRED');
 if(cachePath!==null){
  const local=loadC127SourceCache(cachePath);
  if(local.ok)return {...local,attempts:0,next:'RUN_EXISTING_PR119',first_edge:null};
 }
 if(!Array.isArray(bridges)||isProxy(bridges)||bridges.length>12)return bad('C127_BRIDGES_INVALID');
 const seen=new Set(),events=[];
 for(const entry of bridges){
  if(events.length>=3)break;
  if(!entry||typeof entry!=='object'||isProxy(entry)||typeof entry.id!=='string'||
     !/^[A-Za-z0-9_-]{1,64}$/.test(entry.id)||seen.has(entry.id)||typeof entry.fetch!=='function')
   return bad('C127_UNTRUSTED_BRIDGE');
  seen.add(entry.id);
  let obtained;try{obtained=await entry.fetch()}catch{events.push({id:entry.id,result:'FETCH_FAILED'});continue}
  const checked=inspectC127SourceCache(obtained);
  events.push({id:entry.id,result:checked.ok?'BYTES_VERIFIED':checked.first_edge});
  if(checked.ok)return {...checked,attempts:events.length,events,next:'RUN_EXISTING_PR119',first_edge:null};
 }
 return Object.freeze({ok:false,status:'C127_TRANSPORT_EXHAUSTED_HOST_ONLY',attempts:events.length,
  retries:Math.max(0,events.length-1),attempt_limit:3,
  events,first_edge:events.length===3?'C127_MAXIMUM_REAL_MACHINE_ATTEMPTS_EXHAUSTED':'C127_NO_MORE_PROVEN_MACHINE_BRIDGES',
  next:'MANUAL_EXACT_SOURCE_AND_OVERLAY_HANDOFF',manual_c107_url:PIN.manual_url,
  overlay_paths:paths,active:false,provider_origin_attested:false,native_chatgpt_hook_attested:false});
}
