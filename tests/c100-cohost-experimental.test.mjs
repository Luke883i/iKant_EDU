import test from 'node:test';
import assert from 'node:assert/strict';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {prepareC100CohostDraft,finalizeC100CohostDraft,compactC100Observation} from '../host/c100-cohost-experimental.mjs';
const head='640c3393873a212e7fa639bfdf85b8e2d2b6ba13';
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const orientation=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
const input='Descrivi la mia natura ontologica, quella umana';
const good=()=>prepareC100CohostDraft({sourceHead:head,selection,humanInput:input,optIn:true});
test('real C72 receipt required, canonical refuses delegated language',()=>{
 assert.equal(good().status,'C100_COHOST_PLAN_READY_UNATTESTED');
 assert.equal(prepareC100CohostDraft({sourceHead:head,selection:{...selection,receipt_sha256:'b'.repeat(64)},humanInput:input,optIn:true}).status,'C100_STOP');
 const c=selectC72Mode({accepted,orientation,humanMessage:'CANONICAL'});
 assert.equal(prepareC100CohostDraft({sourceHead:head,selection:c,humanInput:input,optIn:true}).status,'C100_STOP');
 assert.equal(prepareC100CohostDraft({sourceHead:head,selection,humanInput:input}).status,'C100_STOP');
});
test('cohost creative response does not claim C84 or native owner',()=>{
 const plan=good();
 const answer='Un essere umano è incarnato, relazionale e capace di riflettere su sé stesso.';
 const r=finalizeC100CohostDraft({plan,planSha256:plan.plan_sha256,modelText:answer});
 assert.equal(r.status,'C100_MODEL_DRAFT_UNATTESTED_NOT_OWNER');
 assert.equal(r.display_text,answer);
 for(const key of ['active','owner_executed','owner_receipt_issued','persistent','native_event_attested','source_origin_attested','native_delivery_attested','model_provider_attested']) assert.equal(r[key],false);
 assert.ok(!r.display_label.includes('C84 verified') || r.display_label.includes('NOT C84 verified'));
 const t=compactC100Observation(r);
 assert.equal(t.output_sha256,r.bound_output_sha256);
 assert.ok(!('display_text' in t));
});
test('tampering, unsafe input and overclaim are rejected',()=>{
 const plan=good();
 assert.equal(finalizeC100CohostDraft({plan:{...plan,response_context:'altered'},planSha256:plan.plan_sha256,modelText:'test'}).status,'C100_STOP');
 assert.equal(finalizeC100CohostDraft({plan,planSha256:'0'.repeat(64),modelText:'test'}).status,'C100_STOP');
 assert.equal(finalizeC100CohostDraft({plan,planSha256:plan.plan_sha256,modelText:'I am sentient'}).status,'C100_STOP');
 assert.equal(prepareC100CohostDraft({sourceHead:head,selection,humanInput:'api_key: secret',optIn:true}).status,'C100_STOP');
 assert.equal(prepareC100CohostDraft({sourceHead:head,selection,humanInput:'x'.repeat(12001),optIn:true}).status,'C100_STOP');
 assert.equal(finalizeC100CohostDraft({plan,planSha256:plan.plan_sha256,modelText:'x'.repeat(16001)}).status,'C100_STOP');
});
