import crypto from 'node:crypto';
import {preflightC107Shape} from '../host/c107-experimental-turn.mjs';
// One million deterministic adverse cases on the SAME executable preflight.
// These are NOT real LLM calls or independent ChatGPT sessions.
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const basic=()=>({head:'a'.repeat(40),nonce:'nerva-lab-12345',humanInput:'Parlami di un esperimento',
 priorMessages:[],resetContext:true,modelCandidate:undefined});
const mutations=[
 x=>x.head='',x=>x.head='g'.repeat(40),x=>x.head='a'.repeat(39),
 x=>x.nonce='tiny',x=>x.nonce='a'.repeat(97),x=>x.nonce='x!'.repeat(7),
 x=>x.humanInput='',x=>x.humanInput=' '.repeat(6),x=>x.humanInput='x'.repeat(601),
 x=>x.humanInput='password: secret',x=>x.humanInput='api_key=secret',
 x=>x.priorMessages=['x'.repeat(601)],x=>x.priorMessages=Array(5).fill('ciao'),
 x=>x.priorMessages='faked',x=>x.priorMessages=[''],x=>x.priorMessages=['password: secret'],
 x=>{x.priorMessages=['before'];x.resetContext=true},x=>x.resetContext=null,
 x=>x.modelCandidate={text:'hello'},x=>x.modelCandidate={input_sha256:'0'.repeat(64),text:'hello'},
 x=>x.modelCandidate={input_sha256:sha(x.humanInput),text:''},
 x=>x.modelCandidate={input_sha256:sha(x.humanInput),text:'bearer ABCDEFGHIJKLMNOP'},
 x=>x.modelCandidate={input_sha256:sha(x.humanInput),text:'ok',active:true},
 x=>x.modelCandidate={input_sha256:sha(x.humanInput),text:'x'.repeat(16001)},
 x=>x.priorMessages=[42]
];
let unexpected=0;const counts=Array(mutations.length).fill(0);
for(let i=0;i<1000000;i++){
 const x=basic(),n=(i*17+13)%mutations.length;mutations[n](x);counts[n]++;
 if(preflightC107Shape(x)===null)unexpected++;
}
let positive=0;
for(let i=0;i<10000;i++){
 const x=basic();if(i%2){x.resetContext=false;x.priorMessages=['Ciao'];}
 if(i%3===0)x.modelCandidate={input_sha256:sha(x.humanInput),text:'Testo coerente'};
 if(preflightC107Shape(x)===null)positive++;
}
const result={schema:'ikant-le-c107-falsification/v1',negative_cases:1000000,
 positive_controls:10000,positives_accepted:positive,mutation_axes:mutations.length,
 axis_counts:counts,unexpected_promotions:unexpected,real_model_calls:0,
 original_c70_runs_in_campaign:0,native_chatgpt_events:0,
 qualified:unexpected===0&&positive===10000};
console.log(JSON.stringify(result));if(!result.qualified)process.exitCode=2;
