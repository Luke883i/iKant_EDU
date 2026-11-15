import assert from 'node:assert/strict';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {qualifyS02EduIngress} from '../host/s02-edu-versioned-consumer.mjs';
const current='a973079beab243e535ab907937857ed1f6684cf1',old='6648e1f58157224cbd6440a04764d3df34aa0cfd';
const o=issueC72V2TermsOffer({sourceHead:current,termsDigest:'b'.repeat(64)});
const a=acceptC72V2Terms({offer:o,humanMessage:'I ACCEPT',termsPresented:true});
const p=presentC72V2Introduction(a);const edu=selectC72V2Mode({accepted:a,orientation:p,humanMessage:'EDU'});
const canon=selectC72V2Mode({accepted:a,orientation:p,humanMessage:'CANONICAL'});
let cases=0,violations=0;
for(let i=0;i<1_000_000;i++){
 const choice=i%5===0?canon:i%5===1?{...edu,active:true}:i%5===2?{...edu,selected_mode:'EXPERIMENTAL'}:edu;
 const source=i%7===0?old:current,cache=i%13===0?current:old;
 const r=qualifyS02EduIngress({selection:choice,sourceHead:source,cacheEpoch:cache});
 if(r.active||r.dispatch_authorized||r.writer_invocations||r.owner_receipt!==null||r.status!=='BLOCKED')violations++;
 cases++;
}
assert.equal(violations,0);process.stdout.write(JSON.stringify({schema:'ikant-s02-synthetic-falsification/v1',cases,violations,runtime_turns:0,original_writes:0})+'\n');
