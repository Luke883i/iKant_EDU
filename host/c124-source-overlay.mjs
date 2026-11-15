/** C124 exact 3-source overlay on the old immutable C107 carrier.
 * This selects a NEW source Git epoch, never falsifies the old C107 source pin.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {isProxy} from 'node:util/types';
import {PIN} from './c107-carrier-consumer.mjs';
const SHA=b=>crypto.createHash('sha256').update(b).digest('hex');
const GIT=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
export const C124_SOURCE_EPOCH='6648e1f58157224cbd6440a04764d3df34aa0cfd';
export const C124_OVERLAY_GIT_BLOBS=Object.freeze({
 'src/c124-channel-bridge.mjs':'d31972e2000f62f8ebc4dd68b274f0e987a410c3',
 'src/c70-experimental-compute-preview.mjs':'372da2db8c519037b6c8d2e9a349294e6e428aee',
 'host/c107-experimental-turn.mjs':'1cc601d461800b4dc796bc34078fac6a5074ace7'
});
const paths=Object.keys(C124_OVERLAY_GIT_BLOBS).sort();
const fail=first_edge=>({ok:false,first_edge,active:false});
export function verifyC124OverlayBytes(overlay){
 if(!overlay||typeof overlay!=='object'||Array.isArray(overlay)||isProxy(overlay))return fail('C124_OVERLAY_ENVELOPE');
 const own=Reflect.ownKeys(overlay);if(own.length!==3||!own.every(k=>typeof k==='string'&&paths.includes(k)))return fail('C124_OVERLAY_PATHS');
 const d=Object.getOwnPropertyDescriptors(overlay);
 let total=0;
 for(const p of paths){
  const b=d[p]?.value;
  if(!Object.hasOwn(d[p]||{},'value')||!Buffer.isBuffer(b)||b.length<=100||b.length>30000||
     GIT(b)!==C124_OVERLAY_GIT_BLOBS[p])return fail('C124_OVERLAY_GIT_BLOB_MISMATCH');
  total+=b.length;
 }
 const witness=Buffer.from(JSON.stringify({schema:'c124-source-epoch-overlay/v1',
  source_epoch:C124_SOURCE_EPOCH,original_carrier:PIN.carrier_sha256,
  overlay:paths.map(p=>({path:p,bytes:d[p].value.length,git_blob_sha1:C124_OVERLAY_GIT_BLOBS[p],
   sha256:SHA(d[p].value)}))})+'\n');
 return {ok:true,source_head:C124_SOURCE_EPOCH,source_package_sha256:SHA(witness),
  overlay_sha256:SHA(witness),member_count:3,total_bytes:total,
  members:paths.map(p=>({path:p,sha256:SHA(d[p].value)})),active:false};
}
export function stageC124Overlay(installRoot,overlay){
 const q=verifyC124OverlayBytes(overlay);if(!q.ok)return q;
 try{
  if(typeof installRoot!=='string'||!path.isAbsolute(installRoot)||
     fs.realpathSync(installRoot)!==installRoot)return fail('C124_STAGE_ROOT_UNVERIFIED');
  const d=Object.getOwnPropertyDescriptors(overlay);
  for(const p of paths){
   const target=path.join(installRoot,p),fresh=p==='src/c124-channel-bridge.mjs';
   if(fs.realpathSync(path.dirname(target))!==path.dirname(target))return fail('C124_STAGE_DIR_UNSAFE');
   if(fresh){if(fs.existsSync(target))return fail('C124_STAGE_NEW_MODULE_ALREADY_EXISTS');}
   else{const before=fs.lstatSync(target);
    if(before.isSymbolicLink()||!before.isFile())return fail('C124_STAGE_PATH_UNSAFE');}
   const flags=fresh?fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW:
    fs.constants.O_WRONLY|fs.constants.O_TRUNC|fs.constants.O_NOFOLLOW;
   const fd=fs.openSync(target,flags,0o600);
   try{const b=d[p].value;if(fs.writeSync(fd,b)!==b.length)return fail('C124_STAGE_SHORT_WRITE');fs.fsyncSync(fd)}
   finally{fs.closeSync(fd)}
   if(SHA(fs.readFileSync(target))!==q.members.find(m=>m.path===p).sha256)return fail('C124_STAGE_REOPEN_MISMATCH');
  }
  return {...q,stage_reopened:true,original_c107_carrier_unchanged:true};
 }catch{return fail('C124_STAGE_IO_DENIED')}
}
