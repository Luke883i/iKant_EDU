import crypto from 'node:crypto';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode}
 from '../host/c72-unified-mode-admission.mjs';
import {planC108} from '../host/c108-host-matrix.mjs';

// Exactly 1M deterministic preflight negative cases (NOT LLM calls).
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const terms=fs.readFileSync(new URL('../TERMS.md',import.meta.url));
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:sha(terms)});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const selection=selectC72Mode({accepted,
 orientation:presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
const generator={generate:async()=> 'callback placeholder, never invoked by preflight'};
const base=i=>({request:{sourceHead:head,selection,
 humanInput:'Spiega un metodo riproducibile '+(i%100000),optIn:true},
 nonce:'c108-mutate-'+String(i).padStart(8,'0'),priorMessages:[],
 resetContext:true,languagePort:generator});
const mutants=[
 x=>{x.request.sourceHead='0'.repeat(40);},
 x=>{x.request.sourceHead='g'.repeat(40);},
 x=>{x.nonce='short';},
 x=>{x.nonce='bad@'+'x'.repeat(12);},
 x=>{x.request.humanInput='';},
 x=>{x.request.humanInput=' '.repeat(12);},
 x=>{x.request.humanInput='a'.repeat(601);},
 x=>{x.request.humanInput='password: secret';},
 x=>{x.request.optIn=false;},
 x=>{x.request.optIn='true';},
 x=>{x.request.selection=null;},
 x=>{x.request.selection={...selection,selected_mode:'CANONICAL'};},
 x=>{x.request.selection={...selection,source_head:'0'.repeat(40)};},
 x=>{x.request.extra='forged_receipt';},
 x=>{x.request=[];},
 x=>{x.request=new Proxy(x.request,{});},
 x=>{Object.defineProperty(x.request,'humanInput',{get(){return 'getter';}});},
 x=>{x.prefer='RUN SHELL';},
 x=>{x.prefer='E0_HOST_DRAFT';},
 x=>{x.languagePort=null;},
 x=>{x.languagePort={generate:'not-callable'};},
 x=>{x.languagePort=new Proxy(generator,{});},
 x=>{x.priorMessages=['a','b','c','d','e'];},
 x=>{x.priorMessages=['prior'];x.resetContext=true;},
 x=>{x.prefer='BOUND';x.candidate={input_sha256:'0'.repeat(64),text:'unbound'};}
];
let failures=0;const counts=Array(mutants.length).fill(0),examples=[];
for(let i=0;i<1000000;i++){
 const x=base(i),k=(i*17+3)%mutants.length;mutants[k](x);counts[k]++;
 const r=planC108(x);
 if(r.status!=='C108_STOP'){failures++;if(examples.length<8)examples.push({case:i,family:k,status:r.status});}
}
let pass=0;
for(let i=0;i<10000;i++){
 const x=base(i);
 if(i%3===1){delete x.languagePort;
  x.candidate={input_sha256:sha(x.request.humanInput),text:'prova verificata'};}
 if(i%3===2){delete x.languagePort;x.relayPort={turn:async()=>{}};}
 if(planC108(x).status==='C108_PLAN_ONLY')pass++;
}
const report={schema:'ikant-le-c108-preflight-falsification/v1',
 negative_cases:1000000,positive_controls:10000,positive_accepted:pass,
 mutation_families:mutants.length,family_counts:counts,
 unexpected_promotions:failures,examples,
 actual_provider_calls:0,original_c70_runs_during_mutations:0,
 native_chatgpt_events:0,qualified:failures===0&&pass===10000};
console.log(JSON.stringify(report));if(!report.qualified)process.exitCode=2;
