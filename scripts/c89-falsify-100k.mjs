import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {evaluateC89BoundedRelevance} from '../host/c89-relevance-gate.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const input='Confronta due opzioni e specifica una verifica osservabile.';
const good='Opzione A e opzione B: la prova osservabile confronta le misure. Esplicito il limite.';
const head='a'.repeat(40);
const rubric={schema:'ikant-le-c89-bounded-rubric/v1',source_head:head,input_sha256:sha(input),
 required_phrases:['opzione A','opzione B','prova osservabile','limite'],
 forbidden_phrases:['garantito','coscienza dimostrata','ACTIVE'],active:false,independent_holdout_attested:false};
const args={casePacket:rubric,expectedCaseSha256:sha(JSON.stringify(rubric)),sourceHead:head,
 currentHumanInput:input,runtimeVoice:good,expectedVoiceSha256:sha(good)};
const ok=evaluateC89BoundedRelevance(args);
assert.equal(ok.status,'C89_BOUNDED_RUBRIC_PASS_NOT_H95');assert.equal(ok.relevance_field_h95_attested,false);
let denied=0,flags=new Set();
for(let i=0;i<100000;i++){
 const k=i%14,n=Math.floor(i/14),a={...args};let c=structuredClone(rubric);
 if(k===0)a.currentHumanInput+=' '+n;
 if(k===1)a.expectedVoiceSha256=sha('tampered'+n);
 if(k===2)c.source_head='b'.repeat(40);
 if(k===3)c.input_sha256=sha('different'+n);
 if(k===4)c.active=true;
 if(k===5)c.independent_holdout_attested=true;
 if(k===6)c.required_phrases[0]='unseen fact '+n;
 if(k===7){a.runtimeVoice='Opzione A con prova osservabile e limite.';a.expectedVoiceSha256=sha(a.runtimeVoice);}
 if(k===8){a.runtimeVoice=good+' garantito';a.expectedVoiceSha256=sha(a.runtimeVoice);}
 if(k===9){a.runtimeVoice=good+' ACTIVE';a.expectedVoiceSha256=sha(a.runtimeVoice);}
 if(k===10)c.forbidden_phrases=[]; // rubric tamper without a new externally pinned digest
 if(k===11){a.runtimeVoice=good.slice(0,-1)+' '+n;a.expectedVoiceSha256=sha('other'+n);}
 if(k===12){c.required_phrases[0]=c.required_phrases[1];a.expectedCaseSha256=sha(JSON.stringify(c));}
 if(k===13){c.forbidden_phrases.push(c.required_phrases[0]);a.expectedCaseSha256=sha(JSON.stringify(c));}
 a.casePacket=c;const r=evaluateC89BoundedRelevance(a);
 assert.ok(r.status==='C89_STOP'||r.status==='C89_BOUNDED_RUBRIC_REJECT',JSON.stringify({i,r}));
 flags.add(r.status);denied++;
}
console.log(JSON.stringify({slice:'C89',cases:100000,denied,unexpected_accepts:0,positive_bounded_rubric:true,independent_holdout_attested:false,field_H95_attested:false,denial_classes:[...flags].sort()}));
