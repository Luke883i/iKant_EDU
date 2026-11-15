import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const H64=/^[a-f0-9]{64}$/;
const stop=edge=>({schema:'ikant-le-c83-long-input/v1',status:'C83_LONG_INPUT_STOP',first_unclosed_edge:edge,executed_c70:false,native_delivery_attested:false,persistent:false,authority:0});
export function frameC83LosslessInput(humanInput,{maxChunkBytes=560,maxTotalBytes=65536}={}){
 if(typeof humanInput!=='string'||!humanInput.trim()||!Number.isInteger(maxChunkBytes)||maxChunkBytes<32||maxChunkBytes>600||!Number.isInteger(maxTotalBytes)||maxTotalBytes<600||maxTotalBytes>65536)return stop('INPUT_POLICY');
 const bytes=Buffer.from(humanInput,'utf8');
 if(bytes.length>maxTotalBytes)return stop('MAX_INPUT_UTF8_BYTES');
 const chunks=[];
 for(let cursor=0;cursor<bytes.length;cursor+=maxChunkBytes){
  const b=bytes.subarray(cursor,cursor+maxChunkBytes);
  chunks.push({index:chunks.length,offset:cursor,bytes:b.length,sha256:sha(b),content_base64:b.toString('base64')});
 }
 return {schema:'ikant-le-c83-long-input/v1',status:'C83_CHUNK_MANIFEST_READY_NOT_EXECUTED',
  input_sha256:sha(bytes),input_bytes:bytes.length,chunk_count:chunks.length,
  chunks,executed_c70:false,native_delivery_attested:false,persistent:false,authority:0};
}
/** Host-owned temporary readback: no cognitive dispatch of a long message is
 * claimed while C70/C78 remain bounded to <=600 UTF-8 bytes. */
export function materializeC83LosslessInput(frame,{sinkRoot=os.tmpdir()}={}){
 if(!frame||frame.schema!=='ikant-le-c83-long-input/v1'||frame.status!=='C83_CHUNK_MANIFEST_READY_NOT_EXECUTED'||
  !Array.isArray(frame.chunks)||frame.chunks.length<1||frame.chunks.length>2048||
  !H64.test(String(frame.input_sha256))||!Number.isSafeInteger(frame.input_bytes)||
  frame.input_bytes<1||frame.input_bytes>65536)return stop('INVALID_CHUNK_MANIFEST');
 const data=[];let cursor=0;
 for(const [i,c] of frame.chunks.entries()){
  if(c?.index!==i||c.offset!==cursor||!Number.isInteger(c.bytes)||c.bytes<1||c.bytes>600||
    !H64.test(String(c.sha256))||typeof c.content_base64!=='string'||c.content_base64.length%4!==0||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(c.content_base64))return stop('CHUNK_SHAPE_OR_SEQUENCE');
  const b=Buffer.from(c.content_base64,'base64');
  if(b.toString('base64')!==c.content_base64||b.length!==c.bytes||sha(b)!==c.sha256)return stop('CHUNK_IDENTITY');
  data.push(b);cursor+=b.length;
 }
 if(cursor!==frame.input_bytes)return stop('INPUT_LENGTH_MISMATCH');
 const joined=Buffer.concat(data);
 if(sha(joined)!==frame.input_sha256||Buffer.from(joined.toString('utf8'),'utf8').compare(joined)!==0)return stop('UTF8_OR_INPUT_SHA256_MISMATCH');
 if(typeof sinkRoot!=='string'||!path.isAbsolute(sinkRoot))return stop('ABSOLUTE_SINK_REQUIRED');
 let dir=null;
 try{
  dir=fs.mkdtempSync(path.join(fs.realpathSync(sinkRoot),'ikant-c83-'));
  fs.chmodSync(dir,0o700);
  const p=path.join(dir,'original-human-input.utf8');
  fs.writeFileSync(p,joined,{flag:'wx',mode:0o600});
  const re=fs.readFileSync(p);
  if(!re.equals(joined))return stop('HOST_FILE_READBACK_MISMATCH');
  return {schema:'ikant-le-c83-long-input/v1',status:'C83_LOSSLESS_NODE_READBACK_NOT_C70_DISPATCHED',
   input_sha256:sha(re),input_bytes:re.length,chunk_count:frame.chunk_count,
   all_chunks_verified:true,write_reopen_verified:true,
   first_unclosed_edge:'C70_C78_FULL_INPUT_SEMANTIC_DISPATCH',
   executed_c70:false,native_delivery_attested:false,persistent:false,authority:0};
 }catch{return stop('HOST_FILESYSTEM_IO');}
 finally{if(dir)fs.rmSync(dir,{force:true,recursive:true});}
}
