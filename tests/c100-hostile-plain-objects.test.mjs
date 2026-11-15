import test from 'node:test';
import assert from 'node:assert/strict';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {prepareC100CohostDraft,finalizeC100CohostDraft,compactC100Observation} from '../host/c100-cohost-experimental.mjs';

const head='fd32fd5362784409d34ec578299ffeabf3de8f0c';
function selection() {
 const offer=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
 const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const intro=presentC72Introduction(accepted);
 return selectC72Mode({accepted,orientation:intro,humanMessage:'EXPERIMENTAL'});
}
test('C100 rejects getter-bearing draft, receipt, mode without executing getter',()=>{
 const selected=selection();
 const plan=prepareC100CohostDraft({sourceHead:head,selection:selected,humanInput:'natura umana',optIn:true});
 assert.equal(plan.status,'C100_COHOST_PLAN_READY_UNATTESTED');
 let hits=0;
 const malicious={...plan};
 Object.defineProperty(malicious,'status',{enumerable:true,get(){hits++;return plan.status;}});
 assert.equal(finalizeC100CohostDraft({plan:malicious,planSha256:plan.plan_sha256,modelText:'test'}).status,'C100_STOP');
 assert.equal(compactC100Observation(malicious).status,'C100_STOP');
 const compromisedSelection={...selected};
 Object.defineProperty(compromisedSelection,'selected_mode',{enumerable:true,get(){hits++;return 'EXPERIMENTAL';}});
 assert.equal(prepareC100CohostDraft({sourceHead:head,selection:compromisedSelection,humanInput:'test',optIn:true}).status,'C100_STOP');
 assert.equal(hits,0);
});
test('C100 rejects untrusted Proxy before traps; preserves a legitimate draft',()=>{
 const selected=selection();
 const plan=prepareC100CohostDraft({sourceHead:head,selection:selected,humanInput:'Explain my question',optIn:true});
 let hits=0;
 const proxy=new Proxy(plan,{get(t,k){hits++;return Reflect.get(t,k)},getPrototypeOf(t){hits++;return Object.getPrototypeOf(t)}});
 assert.equal(finalizeC100CohostDraft({plan:proxy,planSha256:plan.plan_sha256,modelText:'test'}).status,'C100_STOP');
 assert.equal(compactC100Observation(proxy).status,'C100_STOP');
 assert.equal(hits,0);
 assert.equal(finalizeC100CohostDraft({plan,planSha256:plan.plan_sha256,modelText:'User-relevant answer.'}).status,'C100_MODEL_DRAFT_UNATTESTED_NOT_OWNER');
});
