import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
const H40=/^[a-f0-9]{40}$/;const H64=/^[a-f0-9]{64}$/;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonicalB64=s=>typeof s==='string'&&s.length%4===0&&/^[A-Za-z0-9+/]*={0,2}$/.test(s)&&Buffer.from(s,'base64').toString('base64')===s;
function denied(edge){return {status:'C85_STOP',first_unclosed_edge:edge,active:false,github_ref_authenticated:false,native_delivery_attested:false};}
/** A REAL caller supplies already-transferred bytes. No hidden GitHub/network ability is implied. */
export function verifyC85TransferredPackage({packageBase64,expectedPackageSha256,sourceHead,expectedManifestSha256}={}){
 if(!H40.test(sourceHead||'')||!H64.test(expectedPackageSha256||'')||!H64.test(expectedManifestSha256||''))return denied('C85_PINNED_DIGESTS_REQUIRED');
 if(!canonicalB64(packageBase64)||packageBase64.length>9_000_000)return denied('C85_UNCANONICAL_BASE64');
 const bytes=Buffer.from(packageBase64,'base64');
 if(bytes.length>6_000_000||hash(bytes)!==expectedPackageSha256)return denied('C85_PACKAGE_SHA256');
 let p;try{p=JSON.parse(bytes.toString('utf8'));}catch{return denied('C85_PACKAGE_JSON');}
 if(p?.schema!=='ikant-le-c84-single-source-package/v1'||p.sourceHead!==sourceHead||
  p.expectedManifestSha256!==expectedManifestSha256||!canonicalB64(p.manifestBase64)||
  p.active!==false||p.source_origin_attested!==false||p.native_chat_delivery_attested!==false||p.authority!==0||
  !Array.isArray(p.files)||p.files.length<20||p.files.length>50||
  !p.sourceProof||!canonicalB64(p.sourceProof.commitBase64)||!Array.isArray(p.sourceProof.treeObjects)||
  p.sourceProof.treeObjects.length<1||!p.sourceProof.treeObjects.every(t=>H40.test(t?.sha1||'')&&canonicalB64(t?.content_base64)))return denied('C85_C84_PACKAGE_SHAPE');
 const manifest=Buffer.from(p.manifestBase64,'base64');
 if(hash(manifest)!==expectedManifestSha256)return denied('C85_MANIFEST_SHA256');
 let m;try{m=JSON.parse(manifest.toString('utf8'));}catch{return denied('C85_MANIFEST_JSON');}
 if(m.source_head!==sourceHead||!Array.isArray(m.files)||m.files.length!==p.files.length)return denied('C85_MANIFEST_BINDING');
 const names=new Set();
 for(const f of p.files){
  if(!f||typeof f.path!=='string'||!canonicalB64(f.contentBase64)||names.has(f.path))return denied('C85_DUPLICATE_OR_UNCANONICAL_FILE');
  names.add(f.path);const spec=m.files.find(x=>x.path===f.path),b=Buffer.from(f.contentBase64,'base64');
  if(!spec||spec.bytes!==b.length||spec.sha256!==hash(b))return denied('C85_FILE_BYTE_DRIFT');
 }
 return {status:'C85_PACKAGE_SAMEHASH_VERIFIED_NOT_MATERIALIZED',package_sha256:hash(bytes),source_head:sourceHead,manifest_sha256:expectedManifestSha256,files:p.files.length,active:false,github_ref_authenticated:false,native_delivery_attested:false};
}
/** Exclusive host-local write/reopen; a receipt does not certify the source transport/provider. */
export function materializeC85TransferredPackage(request,{parentDir=os.tmpdir()}={}){
 const verified=verifyC85TransferredPackage(request);
 if(verified.status!=='C85_PACKAGE_SAMEHASH_VERIFIED_NOT_MATERIALIZED')return verified;
 let dir;
 try{
  dir=fs.mkdtempSync(path.join(parentDir,'ikant-c85-'));
  const target=path.join(dir,'source-package.json');
  const bytes=Buffer.from(request.packageBase64,'base64');
  fs.writeFileSync(target,bytes,{flag:'wx',mode:0o600});
  if(!fs.readFileSync(target).equals(bytes))throw Error('C85_READBACK_MISMATCH');
  return {...verified,status:'C85_HOST_LOCAL_BYTES_REOPENED',absolute_path:target,
   write_reopen_verified:true,physical_connector_to_node_attested:false};
 }catch(e){if(dir)fs.rmSync(dir,{recursive:true,force:true});return denied('C85_LOCAL_WRITE_READBACK');}
}
