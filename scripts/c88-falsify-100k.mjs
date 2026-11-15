import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {stageC88ExtendedInput,reopenC88ExtendedInput} from '../host/c88-extended-ingress.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const input='🚀è漢字 '+('Valuta una soluzione robusta, con limiti osservabili. '.repeat(48));
const staged=stageC88ExtendedInput(input);assert.equal(staged.status,'C88_INPUT_STAGED_NOT_C84_EXECUTED');
assert.ok(staged.chunks.length>2);
const ok=reopenC88ExtendedInput(staged,{expectedInputSha256:sha(input)});
assert.equal(ok.status,'C88_INPUT_REOPENED_LOSSLESS_NOT_C84_EXECUTED');assert.equal(ok.human_input,input);
assert.equal(ok.executed_by_c84,false);
let denied=0,seen=new Set();
for(let i=0;i<100000;i++){
 const k=i%12,n=Math.floor(i/12),v=structuredClone(staged),q={expectedInputSha256:sha(input)};
 if(k===0)v.input_sha256='f'.repeat(64);
 if(k===1)v.input_bytes+=n+1;
 if(k===2)v.chunk_limit=601;
 if(k===3)v.chunks[0].sha256=sha('forged'+n);
 if(k===4)v.chunks[0].bytes+=1;
 if(k===5)v.chunks[1].index=0;
 if(k===6)v.chunks.splice(1,1);
 if(k===7)v.chunks.reverse();
 if(k===8)v.chunks[0].contentBase64=Buffer.from('changed-'+n).toString('base64');
 if(k===9)v.executed_by_c84=true;
 if(k===10)q.expectedInputSha256=sha('different'+n);
 if(k===11){const b=Buffer.from(v.chunks[0].contentBase64,'base64');
  const chunks=[b.subarray(0,1),b.subarray(1)];
  v.chunks.splice(0,1,...chunks.map((buf,i)=>({index:i,bytes:buf.length,sha256:sha(buf),contentBase64:buf.toString('base64')})));
  v.chunks.forEach((c,j)=>c.index=j);
 }
 const result=reopenC88ExtendedInput(v,q);assert.equal(result.status,'C88_STOP',JSON.stringify({i,result}));denied++;seen.add(result.first_unclosed_edge);
}
console.log(JSON.stringify({slice:'C88',cases:100000,denied,unexpected_accepts:0,lossless_long_input:true,input_bytes:Buffer.byteLength(input),chunk_count:staged.chunks.length,executed_by_c84:false,denial_classes:[...seen].sort()}));
