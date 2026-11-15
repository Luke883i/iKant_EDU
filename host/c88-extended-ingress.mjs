import crypto from 'node:crypto';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const b64=s=>typeof s==='string'&&s.length%4===0&&/^[A-Za-z0-9+/]*={0,2}$/.test(s)&&Buffer.from(s,'base64').toString('base64')===s;
const bad=edge=>({status:'C88_STOP',first_unclosed_edge:edge,
 executed_by_c84:false,active:false,lossless_readback_verified:false});
/** Chunk at Unicode codepoint boundaries, not arbitrary UTF-8 byte offsets. */
export function stageC88ExtendedInput(humanInput,{chunkLimit=600,maxTotalBytes=16000}={}){
 if(typeof humanInput!=='string'||!humanInput.trim()||!Number.isInteger(chunkLimit)||chunkLimit<64||chunkLimit>600||
  !Number.isInteger(maxTotalBytes)||maxTotalBytes>16000||maxTotalBytes<601||
  Buffer.from(humanInput,'utf8').toString('utf8')!==humanInput)return bad('C88_INPUT_SHAPE');
 const original=Buffer.from(humanInput,'utf8');
 if(original.length>maxTotalBytes)return bad('C88_TOTAL_BYTES');
 const chunks=[];let bytes=[];let size=0;
 function flush(){if(!size)return;const b=Buffer.concat(bytes);chunks.push({index:chunks.length,bytes:b.length,sha256:sha(b),contentBase64:b.toString('base64')});bytes=[];size=0;}
 for(const symbol of humanInput){const b=Buffer.from(symbol,'utf8');if(size+b.length>chunkLimit)flush();bytes.push(b);size+=b.length;}
 flush();
 return {schema:'ikant-le-c88-utf8-ingress/v1',status:'C88_INPUT_STAGED_NOT_C84_EXECUTED',
  input_sha256:sha(original),input_bytes:original.length,chunk_limit:chunkLimit,
  chunks,source_input_must_be_reassembled_before_cognition:true,
  executed_by_c84:false,active:false,native_delivery_attested:false};
}
export function reopenC88ExtendedInput(envelope,{expectedInputSha256}={}){
 if(envelope?.schema!=='ikant-le-c88-utf8-ingress/v1'||envelope.status!=='C88_INPUT_STAGED_NOT_C84_EXECUTED'||
  envelope.executed_by_c84!==false||envelope.active!==false||
  !Number.isInteger(envelope.input_bytes)||envelope.input_bytes<1||envelope.input_bytes>16000||
  !Number.isInteger(envelope.chunk_limit)||envelope.chunk_limit<64||envelope.chunk_limit>600||
  !Array.isArray(envelope.chunks)||envelope.chunks.length<1||envelope.chunks.length>251||
  !/^[a-f0-9]{64}$/.test(expectedInputSha256||'')||
  envelope.input_sha256!==expectedInputSha256)return bad('C88_ENVELOPE');
 const bs=[];
 for(let i=0;i<envelope.chunks.length;i++){
  const c=envelope.chunks[i];if(c?.index!==i||!b64(c.contentBase64)||
   !Number.isInteger(c.bytes)||c.bytes<1||c.bytes>envelope.chunk_limit)return bad('C88_CHUNK_SEQUENCE');
  const b=Buffer.from(c.contentBase64,'base64');if(b.length!==c.bytes||sha(b)!==c.sha256)return bad('C88_CHUNK_INTEGRITY');
  if(!Buffer.from(b.toString('utf8'),'utf8').equals(b))return bad('C88_UTF8_CHUNK_BOUNDARY');
  bs.push(b);
 }
 const original=Buffer.concat(bs);if(original.length!==envelope.input_bytes||
  sha(original)!==expectedInputSha256)return bad('C88_INPUT_DIGEST');
 const text=original.toString('utf8');if(!Buffer.from(text,'utf8').equals(original)||
  !text.trim())return bad('C88_UTF8_ROUNDTRIP');
 return {status:'C88_INPUT_REOPENED_LOSSLESS_NOT_C84_EXECUTED',human_input:text,
  input_sha256:expectedInputSha256,input_bytes:original.length,
  chunks:bs.length,lossless_readback_verified:true,
  executed_by_c84:false,active:false,native_delivery_attested:false};
}
