import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {checkC90Ingress} from '../host/c90-turn-owner.mjs';
import {verifyC90Source} from '../host/c90-source-boundary.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const input='Confronta due alternative con un criterio osservabile.';
const b={sourceHead:'a'.repeat(40),manifestSha256:'b'.repeat(64),
 packageSha256:'c'.repeat(64),packageBase64:'Z2l0',
 inputSha256:sha(input),humanInput:input,
 selection:{selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'}};
const N=Number(process.env.C90_CASES||100000);
if(!Number.isSafeInteger(N)||N<1||N>1000000)throw Error('CASE_LIMIT');
let denied=0;const edges=new Set();
for(let i=0;i<N;i++){
 const q={...b},k=i%12,n=Math.floor(i/12);
 if(k===0)q.inputSha256=n.toString(16).padStart(64,'0');
 if(k===1)q.humanInput+=' '+n;
 if(k===2)q.humanInput+='\ud800';
 if(k===3)q.humanInput=input.repeat(16);
 if(k===4)q.selection={selected_mode:'CANONICAL',status:'CANONICAL_REQUESTED_NOT_ACTIVE'};
 if(k===5)q.selection={selected_mode:'EXPERIMENTAL',status:'ACTIVE'};
 if(k===6)q.selection=null;
 if(k===7)q.runtimeReceipt={status:'C84_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED'};
 if(k===8)q.voice='invented answer '+n;
 if(k===9)q.inputSha256='?'+q.inputSha256.slice(1);
 if(k===10)q.humanInput=' ';
 if(k===11)q.hostCandidate='HOST_CANDIDATE_BOUNDED';
 const r=checkC90Ingress(q);
 assert.equal(r.status,'C90_TURN_STOP',JSON.stringify({i,r}));denied++;edges.add(r.first_unclosed_edge);
}
const invalid=verifyC90Source(b);
assert.equal(invalid.status,'C90_SOURCE_STOP');
console.log(JSON.stringify({schema:'ikant-c90-semantic-adversarial/v1',cases:N,
 denied,unexpected_accepts:0,semantic_families:12,
 edges:[...edges].sort(),fake_source_cannot_authorize_execution:true,
 host_native_sessions_tested:0}));
