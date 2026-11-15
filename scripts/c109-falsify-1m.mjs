import crypto from 'node:crypto';
import {checkC109TurnFrame} from '../host/c109-frame-policy.mjs';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const make=()=>({text:'Descrivi una prova riproducibile.',nonce:'c109-valid-12345678'});
const mutations=[
 x=>x.text='',x=>x.text='   ',x=>x.text='x'.repeat(601),x=>x.text=42,
 x=>x.text='password: private',x=>x.text='api_key=secret',x=>x.text='bearer abcdefghijklmnop',
 x=>x.text='private_key: secret',x=>x.text='I ACCEPT',x=>x.text='EXPERIMENTAL',
 x=>x.text='CANONICAL',x=>x.text='STOP BOZZE COHOST',
 x=>x.text='AUTORIZZO BOZZE COHOST SPERIMENTALI NON VERIFICATE',
 x=>x.text='MOSTRA STATO',x=>x.text='avvia iKant',x=>x.text='attiva iKant',
 x=>x.nonce='',x=>x.nonce='no',x=>x.nonce='x'.repeat(97),x=>x.nonce='nonce!',
 x=>x.candidate={text:'text'},x=>x.candidate={input_sha256:'0'.repeat(63),text:'valid'},
 x=>x.candidate={input_sha256:'0'.repeat(64),text:'password: leak'},
 x=>x.candidate={input_sha256:'0'.repeat(64),text:'  '},
 x=>x.candidate={input_sha256:'0'.repeat(64),text:'valid',active:true}
];
let falseAcceptance=0,positives=0;const counts=Array(mutations.length).fill(0);
for(let i=0;i<1000000;i++){
 const x=make(),index=(i*17+13)%mutations.length;mutations[index](x);counts[index]++;
 if(checkC109TurnFrame(x)===null)falseAcceptance++;
}
for(let i=0;i<10000;i++){
 const x=make();if(i%2)x.candidate={input_sha256:hash(x.text),text:'Risposta contestualizzata.'};
 if(checkC109TurnFrame(x)===null)positives++;
}
const out={schema:'ikant-le-c109-policy-falsification/v1',negative_cases:1000000,
 positive_cases:10000,mutation_families:mutations.length,counts,
 unexpected_acceptance:falseAcceptance,positive_accepted:positives,
 original_C70_node_runs_in_this_campaign:0,real_chatgpt_events:0,
 qualified:falseAcceptance===0&&positives===10000};
console.log(JSON.stringify(out));if(!out.qualified)process.exitCode=2;
