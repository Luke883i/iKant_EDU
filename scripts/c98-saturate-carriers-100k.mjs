import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
import {makeC98C82Carrier} from '../host/c98-c82-connector-port.mjs';
// ACTUAL 100,000 in-process calls on the C98 adapter with real historical C77 bytes.
// NOT 100,000 real ChatGPT sessions, real GitHub callbacks or real H95 trials.
const archive=fs.readFileSync(new URL('../tests/fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const head='66f074b34f34455b3c4188703d83ad71316baa06';
const verified=validateC94C77Archive(archive,{sourceHead:head});
if(verified.status!=='C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN')throw Error(verified.first_unclosed_edge);
const manifest=verified.manifest,manifestBase64=verified.content.get('c77-manifest.json').toString('base64');
const path=manifest.files[0].path,bytes=verified.content.get(path),b64=bytes.toString('base64');
const base={sourceHead:head,manifestSha256:verified.manifest_sha256,path,contentBase64:b64};
let reply=null,gettersExecuted=0;
const port=makeC98C82Carrier({sourceHead:head,manifest,manifestBase64,
 manifestSha256:verified.manifest_sha256,
 readC77Member:async()=>reply});
const classes=26,n=Number(process.argv[2]||100000);
if(!Number.isSafeInteger(n)||n<100||n>100000)throw Error('C98_CASES_OUT_OF_BOUNDS');
const counts=Array(classes).fill(0),survivors=[],start=performance.now();
const crc=x=>crypto.createHash('sha256').update(x).digest('hex');
const nonce=i=>i.toString(16).padStart(8,'0');
function malformed(i){
 const c=i%classes,x=nonce(i);
 switch(c){
 case 0:return {...base,sourceHead:('0'.repeat(32)+x)};
 case 1:return {...base,manifestSha256:'f'.repeat(56)+x};
 case 2:return {...base,path:path+'_mutation_'+x};
 case 3:return {...base,host_native_claim:x};
 case 4:return {...base,contentBase64:Buffer.from(bytes.toString('utf8')+x).toString('base64')};
 case 5:return {...base,contentBase64:'%'+x};
 case 6:return {...base,contentBase64:'AAAA'};
 case 7:return {...base,contentBase64:b64+'='};
 case 8:{const o={...base};delete o.contentBase64;return o;}
 case 9:return null;
 case 10:return [base,x];
 case 11:return Object.assign(Object.create({native_session_origin:x}),base);
 case 12:{const o={...base};Object.defineProperty(o,'contentBase64',{enumerable:true,get(){gettersExecuted++;return b64;}});return o;}
 case 13:{const o={...base};o[Symbol(x)]=true;return o;}
 case 14:return {...base,path:i};
 case 15:return {...base,contentBase64:i};
 case 16:return {...base,sourceHead:undefined};
 case 17:return {...base,manifestSha256:null};
 case 18:return {...base,native_event_attested:true,nonce:x};
 case 19:return Object.freeze({...base,active:true,nonce:x});
 case 20:return Object.assign(Object.create(null),base);
 case 21:{const b=Buffer.from(bytes);b[0]^=1+(i%127);return {...base,contentBase64:b.toString('base64')};}
 case 22:return x;
 case 23:{const o={...base};Object.defineProperty(o,'__proto__',{value:x,enumerable:true});return o;}
 case 24:return {...base,first_unclosed_edge:null,nonce:x};
 case 25:return {...base,contentBase64:Buffer.concat([bytes,Buffer.from(x)]).toString('base64')};
 }
}
for(let i=0;i<n;i++){
 reply=malformed(i);counts[i%classes]++;
 try{await port.carrier.getFile(path);if(survivors.length<20)survivors.push({i,class:i%classes});}
 catch{} // rejected by the actual adapter code
}
const out={schema:'ikant-le-c98-real-node-carrier-100k/v1',
 test_source:'ACTUAL_LOCAL_NODE_EXECUTION_WITH_REAL_HISTORICAL_C77_BYTES',
 mutation_vectors_executed:n,classes,per_class:counts,
 distinct_vectors:n,
 unsafe_callback_packets_accepted:survivors.length,
 unsafe_samples:survivors,
 adversarial_getters_invoked:gettersExecuted,
 sha256_of_class_counts:crc(JSON.stringify(counts)),
 max_claim:'LOCAL_C98_ADAPTER_REJECTION_EVIDENCE_ONLY',
 current_host_github_artifact_downloads:0,current_host_native_event_receipts:0,
 field_H95_real_samples:0,active:false,
 elapsed_ms:Number((performance.now()-start).toFixed(3)),
 result:survivors.length===0&&gettersExecuted===0?'PASS':'FAIL'};
console.log(JSON.stringify(out,null,2));
if(out.result!=='PASS')process.exitCode=1;
