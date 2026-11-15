import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
/** C107 experimental source-exact transport consumer; NOT a lifecycle owner. */
export const PIN=Object.freeze({
 head:'c734bf934e33703a6a1f91f0f4d5df96eec96945',
 tree:'7b1e8b87f43b5995b9c6d1079254918f22549e01',
 release:'cf213a2276802d73e844b706e6cd8431bc76bed6',
 name:'release/v8/ikant-c107-source-c734bf934e33.ikc.br',
 carrier_sha256:'d17195881d6567524f1cdf358c991be5ff0d68e92aea2ba14273f0ea2cf74c6d',
 frame_sha256:'b3c06c1ca553daa18f7815cc91e7900275526a1cfcd3ecb5dc707ffa4e965ad0',
 package_sha256:'65f8a39574786afdfa20e521927004b1709f973b3a1c572daed32586e2cb77b1',
 source_bytes:251952,member_count:43,carrier_bytes:62448,frame_bytes:254496,
 manual_url:'https://github.com/Luke883i/iKant_LE/archive/c734bf934e33703a6a1f91f0f4d5df96eec96945.zip'
});
const H=b=>crypto.createHash('sha256').update(b).digest('hex');
const B=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const fail=e=>({ok:false,status:'C107_CARRIER_STOP',first_unclosed_edge:String(e),manual_source_url:PIN.manual_url,active:false});
const safe=p=>typeof p==='string'&&/^(?:README\.md|TERMS\.md|(?:contracts|host|src|scripts)\/[A-Za-z0-9._/-]+)$/.test(p)&&p.split('/').every(x=>x&&x!=='.'&&x!=='..');
const keys=(x,k)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===k;
/** Validate actual transport, decoded frame, every member and original C107 package. */
export function inspectC107Carrier(raw){
 try{
  if(!Buffer.isBuffer(raw)||raw.length!==PIN.carrier_bytes||H(raw)!==PIN.carrier_sha256)throw Error('TRANSPORT_PIN');
  let data;try{data=zlib.brotliDecompressSync(raw,{maxOutputLength:1000000})}catch{throw Error('BROTLI_LIMIT_OR_ERROR')}
  if(data.length!==PIN.frame_bytes||H(data)!==PIN.frame_sha256||data.subarray(0,8).toString('ascii')!=='IKC10701')throw Error('FRAME_PIN');
  const ml=data.readUInt32BE(8);if(ml<128||ml>40000||12+ml>data.length)throw Error('MANIFEST_LENGTH');
  const literal=data.subarray(12,12+ml).toString('utf8'),meta=JSON.parse(literal);
  if(JSON.stringify(meta)!==literal||!keys(meta,'active,authority,decoded_package_sha256,files,schema,source_head,source_tree')||
   meta.schema!=='ikant-le-c107-source-carrier/v1'||meta.source_head!==PIN.head||meta.source_tree!==PIN.tree||
   meta.decoded_package_sha256!==PIN.package_sha256||meta.active!==false||meta.authority!==0||
   !Array.isArray(meta.files)||meta.files.length!==PIN.member_count)throw Error('MANIFEST_SOURCE_IDENTITY');
  const files=[],seen=new Set();let off=12+ml,total=0;
  for(const m of meta.files){
   if(!keys(m,'bytes,path')||!safe(m.path)||seen.has(m.path)||!Number.isSafeInteger(m.bytes)||
    m.bytes<0||m.bytes>500000||off+m.bytes>data.length)throw Error('MEMBER_PATH_OR_SIZE');
   seen.add(m.path);const b=data.subarray(off,off+m.bytes);off+=m.bytes;total+=m.bytes;
   files.push({path:m.path,bytes:b.length,sha256:H(b),git_blob_sha1:B(b),content_base64:b.toString('base64')});
  }
  if(off!==data.length||total!==PIN.source_bytes)throw Error('TRAILER_OR_TOTAL_BYTES');
  const pkg=Buffer.from(JSON.stringify({schema:'ikant-le-c107-minimal-package/v1',source_head:PIN.head,files,active:false,authority:0})+'\n');
  if(H(pkg)!==PIN.package_sha256)throw Error('EXACT_PACKAGE_DIGEST');
  return {ok:true,status:'C107_SOURCE_EXACT_VERIFIED_NOT_EXECUTED',source_head:PIN.head,member_count:files.length,source_bytes:total,package:pkg,package_sha256:H(pkg),files,active:false,native_delivery_attested:false};
 }catch(e){return fail(e?.message||'UNKNOWN')}
}
/** Byte staging only: original scripts/c107-pack.mjs is NOT in the 43-member carrier. */
export function stageC107Carrier(raw,{parent=os.tmpdir()}={}){
 const proof=inspectC107Carrier(raw);if(!proof.ok)return proof;
 let dir;
 try{
  if(typeof parent!=='string'||!path.isAbsolute(parent)||!fs.statSync(parent).isDirectory()||fs.realpathSync(parent)!==parent)throw Error('PRIVATE_PARENT_REQUIRED');
  dir=fs.mkdtempSync(path.join(parent,'ikant-c107-source-'));fs.chmodSync(dir,0o700);
  for(const m of proof.files){
   const target=path.resolve(dir,m.path);if(!target.startsWith(dir+path.sep))throw Error('PATH_ESCAPE');
   fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});
   const b=Buffer.from(m.content_base64,'base64'),fd=fs.openSync(target,'wx',0o600);
   try{if(fs.writeSync(fd,b)!==b.length)throw Error('SHORT_WRITE');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
   if(H(fs.readFileSync(target))!==m.sha256||B(fs.readFileSync(target))!==m.git_blob_sha1)throw Error('STAGE_READBACK');
  }
  return {ok:true,status:'C107_HOST_STAGED_REOPENED_NOT_EXECUTED',install_root:dir,source_head:PIN.head,member_count:43,original_packer_stage_attested:false,active:false};
 }catch(e){if(dir)fs.rmSync(dir,{recursive:true,force:true});return fail(e?.message||'STAGE_FAILURE')}
}
/** Consistency of local original receipts, never native or provider attestation. */
export function qualifyC107Voice({turn,readback,humanInput,nonce,ledgerFile,sourceHead=PIN.head}={}){
 const no=e=>({origin:'NO_VOICE',voice_utf8:null,first_unclosed_edge:e,active:false});
 if(typeof humanInput!=='string'||typeof nonce!=='string'||!turn||!readback)return no('RECEIPT_MISSING');
 if(turn.status!=='C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK'||turn.original_c70_executed!==true||
  turn.original_c87_writer_executed!==true||turn.active!==false||typeof turn.voice_utf8!=='string'||
  turn.input_sha256!==H(Buffer.from(humanInput))||turn.output_sha256!==H(Buffer.from(turn.voice_utf8)))return no('C107_SAME_INPUT_OR_VOICE');
 if(readback.status!=='C107_LEDGER_REOPENED'||readback.last_hash!==turn.ledger_event_sha256||
  readback.latest_state?.source_head!==sourceHead||readback.latest_state?.nonce!==nonce||
  readback.latest_state?.visible_voice_sha256!==turn.output_sha256||
  readback.latest_state?.host_language_used!==turn.model_draft_used)return no('C87_READBACK_MISMATCH');
 try{
  const bytes=fs.readFileSync(ledgerFile,'utf8');if(!bytes.endsWith('\n'))return no('C87_TORN_LEDGER');
  const rows=bytes.trimEnd().split('\n');if(rows.length!==readback.count)return no('C87_COUNT');
  const event=JSON.parse(rows.at(-1));
  if(event.record_sha256!==readback.last_hash||event.source_head!==sourceHead||
   event.input_sha256!==turn.input_sha256||event.output_sha256!==turn.output_sha256||
   event.state?.nonce!==nonce||event.active!==false)return no('C87_EVENT_MISMATCH');
 }catch{return no('C87_LOCAL_LEDGER_UNAVAILABLE')}
 return {origin:turn.model_draft_used?'HOST_BOUND':'ORIGINAL_DEMO',voice_utf8:turn.voice_utf8,
  local_receipt_consistent:true,active:false,native_delivery_attested:false,provider_origin_attested:false,
  first_unclosed_edge:'NATIVE_CHATGPT_PER_TURN_DISPATCH'};
}
export function c107Handoff({attempts=1,newEvidence=false}={}){
 if(!Number.isInteger(attempts)||attempts<1)throw Error('INVALID_ATTEMPTS');
 if(attempts>3||(attempts>1&&newEvidence!==true))return {status:'MANUAL_SOURCE_HANDOFF',url:PIN.manual_url,first_unclosed_edge:'HOST_BYTE_BRIDGE_EXHAUSTED'};
 return {status:'HOST_PROBE_ALLOWED',attempts_left:Math.max(0,3-attempts),retry_requires_new_evidence:true};
}
