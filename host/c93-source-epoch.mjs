import crypto from 'node:crypto';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const H40=/^[0-9a-f]{40}$/;const H64=/^[0-9a-f]{64}$/;
const stop=edge=>Object.freeze({schema:'ikant-le-c93-source-epoch/v1',status:'C93_SOURCE_STOP',first_unclosed_edge:edge,source_reachability_verified:false,github_ref_origin_attested:false,active:false,authority:0});
const safePath=x=>/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(x)&&!x.split('/').some(s=>s==='.'||s==='..');
const b64=x=>typeof x==='string'&&x.length>0&&x.length%4===0&&/^[A-Za-z0-9+/]*={0,2}$/.test(x)&&Buffer.from(x,'base64').toString('base64')===x;
/** Byte-bound epoch preflight; C85 + actual C81 object-proof are STILL mandatory in C90.
 * This deliberately does not authenticate HEAD against GitHub or mint a runtime receipt. */
export function checkC93SourceEpoch(q={}){
 if(!q||typeof q!=='object'||Array.isArray(q))return stop('REQUEST_ENVELOPE');
 if(!H40.test(q.sourceHead||'')||!H64.test(q.packageSha256||'')||!H64.test(q.manifestSha256||''))return stop('HEAD_AND_DIGEST_SHAPE');
 if(!b64(q.packageBase64)||q.packageBase64.length>9_000_000)return stop('OPAQUE_PACKAGE_BYTES');
 const raw=Buffer.from(q.packageBase64,'base64');
 if(raw.length>6_000_000||sha(raw)!==q.packageSha256)return stop('PACKAGE_SHA256');
 let p;try{p=JSON.parse(raw.toString('utf8'));}catch{return stop('PACKAGE_JSON');}
 if(p?.schema!=='ikant-le-c84-single-source-package/v1'||p.sourceHead!==q.sourceHead||p.expectedManifestSha256!==q.manifestSha256||
    p.active!==false||p.source_origin_attested!==false||p.native_chat_delivery_attested!==false||p.authority!==0||!b64(p.manifestBase64))return stop('C84_PACKAGE_EPOCH');
 const manifestBytes=Buffer.from(p.manifestBase64,'base64');
 if(manifestBytes.length>100000||sha(manifestBytes)!==q.manifestSha256)return stop('MANIFEST_SHA256');
 let m;try{m=JSON.parse(manifestBytes.toString('utf8'));}catch{return stop('MANIFEST_JSON');}
 if(!m||typeof m!=='object'||Array.isArray(m)||m.source_head!==q.sourceHead||!Array.isArray(m.files)||m.files.length<20||m.files.length>50||
   !Array.isArray(p.files)||p.files.length!==m.files.length)return stop('MANIFEST_FILE_SET');
 if(!p.sourceProof||!b64(p.sourceProof.commitBase64)||!Array.isArray(p.sourceProof.treeObjects)||!p.sourceProof.treeObjects.length||
   !p.sourceProof.treeObjects.every(t=>t&&H40.test(t.sha1||'')&&b64(t.content_base64)))return stop('C81_RAW_PROOF_SHAPE');
 const byPath=new Map();
 for(const f of p.files){
   if(!f||typeof f.path!=='string'||!safePath(f.path)||!b64(f.contentBase64)||byPath.has(f.path))return stop('DUPLICATE_OR_MALFORMED_BYTES');
   byPath.set(f.path,Buffer.from(f.contentBase64,'base64'));
 }
 const manifestPaths=new Set();
 for(const spec of m.files){
   if(!spec||typeof spec.path!=='string'||!safePath(spec.path)||manifestPaths.has(spec.path)||
     !H64.test(spec.sha256||'')||
     !Number.isSafeInteger(spec.bytes)||spec.bytes<0||!byPath.has(spec.path))return stop('MANIFEST_PATH');
   manifestPaths.add(spec.path);
   const data=byPath.get(spec.path);
   if(data.length!==spec.bytes||sha(data)!==spec.sha256)return stop('C84_FILE_HASH_DRIFT');
 }
 return Object.freeze({schema:'ikant-le-c93-source-epoch/v1',status:'C93_SOURCE_BYTES_BOUND_C81_STILL_REQUIRED',source_head:q.sourceHead,manifest_sha256:q.manifestSha256,package_sha256:q.packageSha256,files:m.files.length,source_reachability_verified:false,github_ref_origin_attested:false,native_delivery_attested:false,active:false,authority:0});
}
