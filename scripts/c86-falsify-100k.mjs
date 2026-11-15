import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {prepareC86Surface,compareC86Echo} from '../host/c86-surface-a.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const text='Confronta due alternative e indica una prova.';const voice='Le alternative sono A e B; prova la differenza usando un test osservabile.';
const head='a'.repeat(40),manifest='b'.repeat(64);
const base={status:'C84_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED',source_head:head,manifest_sha256:manifest,
 runtime_projection:'C81_RUNTIME_SURFACE_A_READY_NOT_NATIVE_DELIVERED',
 source_reachability:'C81_GIT_REACHABILITY_VERIFIED',input_sha256:sha(text),output_sha256:sha(voice),
 runtime_computed_answer:voice,active:false,native_chat_delivery_attested:false,source_origin_attested:false,
 owner_receipt_issued:false,canonical_runtime:false};
const args={runtimeReceipt:base,currentHumanInput:text,sourceHead:head,manifestSha256:manifest};
const ok=prepareC86Surface(args);assert.equal(ok.status,'C86_SURFACE_A_READY_NOT_NATIVE_DELIVERED');
assert.equal(compareC86Echo({surfaceReceipt:ok,displayedText:voice}).matched,true);
assert.equal(compareC86Echo({surfaceReceipt:ok,displayedText:voice}).native_chat_delivery_attested,false);
let denied=0;const errors=new Set();
for(let i=0;i<100000;i++){
 const k=i%13,n=Math.floor(i/13);const r={...base},a={...args,runtimeReceipt:r};
 if(k===0)r.status='ACTIVE';
 if(k===1)r.source_head='f'.repeat(40);
 if(k===2)r.manifest_sha256='f'.repeat(64);
 if(k===3)r.input_sha256=n.toString(16).padStart(64,'0');
 if(k===4)r.output_sha256=n.toString(16).padStart(64,'0');
 if(k===5)r.runtime_computed_answer+=' '+n;
 if(k===6)r.native_chat_delivery_attested=true;
 if(k===7)r.source_origin_attested=true;
 if(k===8)r.owner_receipt_issued=true;
 if(k===9)r.runtime_projection='HOST_CANDIDATE_BOUNDED';
 if(k===10)a.currentHumanInput=text+' '+n;
 if(k===11)r.canonical_runtime=true;
 if(k===12)a.currentHumanInput=text+'\ud800';
 const result=prepareC86Surface(a);assert.equal(result.status,'C86_STOP',JSON.stringify({i,result}));errors.add(result.first_unclosed_edge);denied++;
}
console.log(JSON.stringify({slice:'C86',cases:100000,denied,unexpected_accepts:0,positive_echo_matches:true,native_deliveries_attested:0,denial_classes:[...errors].sort()}));
