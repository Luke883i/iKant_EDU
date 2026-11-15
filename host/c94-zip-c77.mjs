import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const sha1Git=b=>crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
const H40=/^[0-9a-f]{40}$/,H64=/^[0-9a-f]{64}$/;
const stop=e=>({schema:'ikant-le-c94-c77-carrier/v1',status:'C94_C77_STOP',first_unclosed_edge:e,source_origin_attested:false,c81_verified:false,active:false,authority:0});
const goodName=p=>typeof p==='string'&&p.length<=180&&p.length>0&&!p.includes('\\')&&!p.includes('\0')&&p.split('/').every(k=>k!=='.'&&k!=='..'&&/^[A-Za-z0-9_.-]+$/.test(k));
function crc32(b){let c=-1;for(const x of b){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^(0xedb88320&-(c&1));}return(c^-1)>>>0;}
/** Bounded ZIP reader: no shell or unzip dependency; no zip64, data descriptor guessing,
 * external entries, special files, zip slip, ambiguous names, CRC corruption or bombs. */
export function unpackC94Zip(bytes,{maxBytes=5_000_000}={}){
 if(!Buffer.isBuffer(bytes)||bytes.length<22||bytes.length>maxBytes)throw Error('ZIP_SIZE');
 let e=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
  if(bytes.readUInt32LE(i)===0x06054b50&&i+22+bytes.readUInt16LE(i+20)===bytes.length){e=i;break;}}
 if(e<0||bytes.readUInt16LE(e+4)!==0||bytes.readUInt16LE(e+6)!==0||
    bytes.readUInt16LE(e+8)!==bytes.readUInt16LE(e+10))throw Error('ZIP_EOCD');
 const count=bytes.readUInt16LE(e+10),size=bytes.readUInt32LE(e+12),offset=bytes.readUInt32LE(e+16);
 if(count<20||count>65||offset+size!==e)throw Error('ZIP_CENTRAL_DIRECTORY');
 let at=offset,total=0;const files=new Map();
 for(let n=0;n<count;n++){
  if(at+46>e||bytes.readUInt32LE(at)!==0x02014b50)throw Error('ZIP_CENTRAL_RECORD');
  const flags=bytes.readUInt16LE(at+8),method=bytes.readUInt16LE(at+10),crc=bytes.readUInt32LE(at+16);
  const clen=bytes.readUInt32LE(at+20),ulen=bytes.readUInt32LE(at+24);
  const nlen=bytes.readUInt16LE(at+28),xlen=bytes.readUInt16LE(at+30),comment=bytes.readUInt16LE(at+32);
  const external=bytes.readUInt32LE(at+38),local=bytes.readUInt32LE(at+42);
  if(at+46+nlen+xlen+comment>e||flags&1||!(method===0||method===8)||ulen>350000||clen>1000000||total+ulen>4_000_000||local>=offset)
   throw Error('ZIP_BOUNDS_OR_METHOD');
  const fileType=(external>>>16)&0xf000;
  if(fileType!==0&&fileType!==0x8000)throw Error('ZIP_NONREGULAR_FILE');
  const name=bytes.subarray(at+46,at+46+nlen).toString('utf8');
  at+=46+nlen+xlen+comment;
  if(!(name==='c77-build-receipt.json'||(name.startsWith('c77-standalone/')&&goodName(name.slice(15))))||files.has(name))throw Error('ZIP_UNSAFE_OR_DUPLICATE_PATH');
  if(local+30>offset||bytes.readUInt32LE(local)!==0x04034b50||
     bytes.readUInt16LE(local+6)!==flags||bytes.readUInt16LE(local+8)!==method)throw Error('ZIP_LOCAL_HEADER_FLAGS_DRIFT');
  const ln=bytes.readUInt16LE(local+26),lx=bytes.readUInt16LE(local+28);
  if(local+30+ln+lx+clen>offset||bytes.subarray(local+30,local+30+ln).toString('utf8')!==name)throw Error('ZIP_LOCAL_NAME_OR_SIZE');
  const payload=bytes.subarray(local+30+ln+lx,local+30+ln+lx+clen);
  let raw;try{raw=method===8?zlib.inflateRawSync(payload,{maxOutputLength:ulen+1}):Buffer.from(payload);}catch{throw Error('ZIP_DEFLATE');}
  if(raw.length!==ulen||crc32(raw)!==crc)throw Error('ZIP_CRC_OR_DEFLATE_SIZE');
  if(method===0&&clen!==ulen)throw Error('ZIP_STORED_SIZE');
  files.set(name==='c77-build-receipt.json'?name:name.slice(15),raw);total+=raw.length;
 }
 if(at!==e)throw Error('ZIP_TRAILING_CENTRAL');
 return files;
}
export function validateC94C77Archive(bytes,{sourceHead}={}){
 try{
  if(!H40.test(sourceHead||''))return stop('C77_SOURCE_HEAD_REQUIRED');
  const files=unpackC94Zip(bytes),manifestBytes=files.get('c77-manifest.json');
  if(!manifestBytes||manifestBytes.length>120000)return stop('C77_MANIFEST_MISSING');
  const manifest=JSON.parse(manifestBytes.toString('utf8'));
  if(manifest?.schema!=='ikant-le-c77-standalone-capsule/v1'||manifest.source_head!==sourceHead||
     manifest.cx_anchor_count!==70||manifest.active!==false||manifest.authority!==0||
     !Array.isArray(manifest.files)||manifest.files.length!==files.size-(files.has('c77-build-receipt.json')?2:1))return stop('C77_MANIFEST_SOURCE_OR_SET');
  const all=new Set();
  for(const f of manifest.files){
   if(!f||!goodName(f.path)||all.has(f.path)||!H64.test(f.sha256)||
      !Number.isSafeInteger(f.bytes)||f.bytes<=0||
      typeof f.generated_derivative!=='boolean')return stop('C77_MANIFEST_MEMBER');
   all.add(f.path);
   const member=files.get(f.path);
   if(!member||member.length!==f.bytes||sha256(member)!==f.sha256)return stop('C77_MEMBER_HASH_DRIFT');
   if(f.generated_derivative!==true){
    if(!H40.test(f.original_source_blob_sha1||'')||sha1Git(member)!==f.original_source_blob_sha1)
     return stop('C77_ORIGINAL_GIT_BLOB_DRIFT');
   }
  }
  if(files.has('c77-build-receipt.json')){
   const receipt=JSON.parse(files.get('c77-build-receipt.json').toString('utf8'));
   if(receipt.head!==sourceHead||receipt.bundle_manifest_sha256!==sha256(manifestBytes)||receipt.file_count!==manifest.files.length)
    return stop('C77_BUILD_RECEIPT_DRIFT');
  }
  files.delete('c77-build-receipt.json');
  const proof=files.get('contracts/c77-cx-build-proof.json');
  if(!proof)return stop('C77_CX_PROOF_MISSING');
  const census=JSON.parse(proof.toString('utf8'));
  if(census.source_head!==sourceHead||census.entries?.length!==70||census.authority!==0)return stop('C77_CX_PROOF_UNQUALIFIED');
  return {schema:'ikant-le-c94-c77-carrier/v1',status:'C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN',
   source_head:sourceHead,manifest_sha256:sha256(manifestBytes),artifact_sha256:sha256(bytes),
   files:manifest.files.length,cx_anchors:census.entries.length,content:files,manifest,
   c81_verified:false,source_origin_attested:false,native_chat_delivery_attested:false,active:false,authority:0};
 }catch(e){return stop(String(e?.message||e).slice(0,85));}
}
/** Writes real file bytes and reopens each file. Caller owns the parent directory. */
export function stageC94C77Archive(bytes,{sourceHead,parentDir=os.tmpdir()}={}){
 const checked=validateC94C77Archive(bytes,{sourceHead});
 if(checked.status!=='C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN')return checked;
 if(!path.isAbsolute(parentDir)||!fs.statSync(parentDir).isDirectory())return stop('OUTPUT_PARENT');
 let dir;
 try{
  dir=fs.mkdtempSync(path.join(parentDir,'c94-c77-'));
  for(const [rel,content]of checked.content){
   const f=path.resolve(dir,rel);if(!f.startsWith(dir+path.sep))throw Error('PATH_ESCAPE');
   fs.mkdirSync(path.dirname(f),{recursive:true});
   fs.writeFileSync(f,content,{flag:'wx',mode:0o600});
   if(!fs.readFileSync(f).equals(content))throw Error('REOPEN_DRIFT');
  }
  return {schema:'ikant-le-c94-c77-stage/v1',status:'C94_C77_STAGED_REOPENED_NOT_RUNTIME_EXECUTED',
    output_dir:dir,source_head:sourceHead,manifest_sha256:checked.manifest_sha256,
    artifact_sha256:checked.artifact_sha256,files:checked.files+1,
    write_reopen_verified:true,source_origin_attested:false,c81_verified:false,
    active:false,native_delivery_attested:false,authority:0};
 }catch(e){if(dir)fs.rmSync(dir,{recursive:true,force:true});return stop('C77_STAGE_'+String(e?.message||e).slice(0,50));}
}
