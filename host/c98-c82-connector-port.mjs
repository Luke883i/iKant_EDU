import crypto from 'node:crypto';
import {isProxy} from 'node:util/types';

/** C98 is a data-only adapter for EXISTING host/c82-experimental-carriers.mjs.
 * It has no network access, planner, workspace writer, runtime owner or UI.
 * `readC77Member` MUST be genuinely registered by the external host; this file
 * cannot authenticate that registration, source ref origin, or native delivery.
 */
const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
const b64=s=>typeof s==='string'&&s.length>0&&s.length%4===0&&
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s)&&
  Buffer.from(s,'base64').toString('base64')===s;
const safePath=s=>typeof s==='string'&&s.length<=200&&
  (s==='README.md'||/^(?:(?:src|host|contracts|assets\/brand)\/)[A-Za-z0-9._/-]+$/.test(s))&&
  !s.split('/').some(p=>!p||p==='.'||p==='..');
const fail=e=>Object.assign(new Error(`C98_${e}`),{code:`C98_${e}`});
// A callback packet is untrusted data, not an object that may execute getters
// or inherit authority claims from a prototype. Reject before reading fields.
export const isC98PlainDataRecord=x=>{
 if(!x||typeof x!=='object'||Array.isArray(x)||isProxy(x)||
   Object.getPrototypeOf(x)!==Object.prototype)return false;
 const keys=Reflect.ownKeys(x);
 return keys.every(k=>typeof k==='string'&&
  Object.getOwnPropertyDescriptor(x,k)?.enumerable===true&&
  Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));
};
// Strict recursive boundary before JSON.stringify: no getters, Proxy traps,
// cycles, sparse arrays, functions, magic toJSON methods or inherited values.
// The authoritative manifest remains the original SHA-bound raw JSON bytes.
export function isC98JSONDataTree(value){
 const seen=new Set();let count=0;
 function visit(x,depth){
  if(++count>5000||depth>20||x===undefined)return false;
  if(x===null||typeof x==='string'||typeof x==='boolean')return true;
  if(typeof x==='number')return Number.isFinite(x);
  if(typeof x!=='object'||isProxy(x)||seen.has(x))return false;
  seen.add(x);
  if(Array.isArray(x)){
   if(Object.getPrototypeOf(x)!==Array.prototype||x.length>5000)return false;
   const keys=Reflect.ownKeys(x);
   if(keys.length!==x.length+1)return false;
   for(let i=0;i<x.length;i++){
    const d=Object.getOwnPropertyDescriptor(x,String(i));
    if(!d||!d.enumerable||!Object.hasOwn(d,'value')||!visit(d.value,depth+1))return false;
   }
   return true;
  }
  if(!isC98PlainDataRecord(x))return false;
  const keys=Object.keys(x);
  if(keys.length>256)return false;
  for(const k of keys){
   const d=Object.getOwnPropertyDescriptor(x,k);
   if(!visit(d.value,depth+1))return false;
  }
  return true;
 }
 return visit(value,0);
}
export function makeC98C82Carrier({sourceHead,manifestBase64,manifestSha256,manifest,
  readC77Member,carrierName='HOST_C77_AUTHORIZED'}={}){
 if(!H40.test(sourceHead||'')||!H64.test(manifestSha256||'')||!b64(manifestBase64)||
   manifestBase64.length>160000||!isC98JSONDataTree(manifest)||
   typeof readC77Member!=='function')throw fail('SOURCE_MANIFEST_OR_REAL_CALLBACK_MISSING');
 const manifestBytes=Buffer.from(manifestBase64,'base64');
 if(sha(manifestBytes)!==manifestSha256)throw fail('MANIFEST_HASH_DRIFT');
 let frozen;try{frozen=JSON.parse(manifestBytes.toString('utf8'));}
 catch{throw fail('MANIFEST_INVALID_JSON');}
 if(JSON.stringify(frozen)!==JSON.stringify(manifest)||manifest.source_head!==sourceHead||
   !Array.isArray(manifest.files)||manifest.files.length<20||manifest.files.length>50||
   !/^[A-Z0-9_]{2,48}$/.test(carrierName))throw fail('MANIFEST_OBJECT_OR_CARRIER_DRIFT');
 const expected=new Map();
 for(const f of manifest.files){
  if(!f||!safePath(f.path)||expected.has(f.path)||!Number.isInteger(f.bytes)||
    f.bytes<1||f.bytes>1000000||!H64.test(f.sha256)||
    typeof f.generated_derivative!=='boolean'||
    (f.generated_derivative===false&&!H40.test(f.original_source_blob_sha1))||
    (f.generated_derivative===true&& !(
      (f.path==='src/c71-experimental-host-draft.mjs'&&H40.test(f.original_source_blob_sha1))||
      (f.path==='contracts/c77-cx-build-proof.json'&&f.original_source_blob_sha1===null)
    )))throw fail('UNSAFE_MANIFEST_ENTRY');
  expected.set(f.path,Object.freeze({...f}));
 }
 // This callback is called only by C82. C82 still owns hedging, global budget,
 // SHA bound selection, quarantine and exactly-one C78 staging writer.
 let invoked=0,accepted=0;
 const carrier=Object.freeze({name:carrierName,
   async getFile(filePath,{signal}={}){
     const f=expected.get(filePath);
     if(!f)throw fail('UNEXPECTED_PATH');
     if(signal?.aborted)throw fail('ABORTED_BEFORE_READ');
     invoked++;
     const r=await readC77Member(Object.freeze({sourceHead,path:filePath,
       manifestSha256,signal}));
     if(!isC98PlainDataRecord(r)||
       Object.keys(r).sort().join(',')!==['contentBase64','manifestSha256','path','sourceHead'].sort().join(',')||
       r.sourceHead!==sourceHead||r.path!==filePath||r.manifestSha256!==manifestSha256||
       !b64(r.contentBase64)||r.contentBase64.length>1400000)throw fail('HOST_MEMBER_ENVELOPE');
     const bytes=Buffer.from(r.contentBase64,'base64');
     if(bytes.length!==f.bytes||sha(bytes)!==f.sha256)throw fail('CONTENT_SHA256_DRIFT');
     if(f.generated_derivative===false&&gitBlob(bytes)!==f.original_source_blob_sha1)
       throw fail('GIT_ORIGINAL_BLOB_DRIFT');
     if(signal?.aborted)throw fail('ABORTED_AFTER_READ');
     accepted++;
     return {contentBase64:r.contentBase64}; // exactly C82's existing port
   }});
 return Object.freeze({
   carrier,expectedMemberCount:expected.size,manifest_sha256:manifestSha256,
   source_head:sourceHead,
   // Accounting is process-local: it is not host-authenticated provenance.
   statistics:()=>Object.freeze({invoked,accepted,host_authenticated_origin:false,
     native_event_attested:false,owner_executed:false,active:false})
 });
}
