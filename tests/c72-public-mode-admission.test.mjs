import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {issueC72V2TermsOffer,validateC72V2Offer,acceptC72V2Terms,validateC72V2Accepted,
 evaluateC72V2Introductions,presentC72V2Introduction,validateC72V2Orientation,
 selectC72V2Mode,validateC72V2ModeSelection,c72PublicAdmissionContract} from '../host/c72-public-mode-admission.mjs';
import {validateC72ModeSelection} from '../host/c72-unified-mode-admission.mjs';
const sourceHead='a'.repeat(40),termsDigest='b'.repeat(64);
const setup=()=>{
 const offer=issueC72V2TermsOffer({sourceHead,termsDigest});
 const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const orientation=presentC72V2Introduction(accepted);
 return {offer,accepted,orientation};
};
test('S01 prospective public C72 offers only EDU; v1 stays pinned historical',()=>{
 const x=c72PublicAdmissionContract();
 assert.deepEqual(x.mode_choices,['EDU']);
 assert.equal(x.default_for_new_admission,true);
 assert.equal(x.legacy_v1.no_silent_relabeling,true);
 assert.equal(x.authoritative_claims.selection_is_active,false);
 for(const file of ['BOOTSTRAP.json','ADMISSION.json']){
  const y=JSON.parse(fs.readFileSync(new URL(`../${file}`,import.meta.url)));
  const d=file==='BOOTSTRAP.json'?y.user_onboarding_c72:y.default_onboarding;
  assert.deepEqual(file==='BOOTSTRAP.json'?d.mode_choices:d.modes,['EDU']);
  assert.equal(d.module||d.owner,'host/c72-public-mode-admission.mjs');
 }
 const terms=fs.readFileSync(new URL('../TERMS.md',import.meta.url),'utf8');
 assert.match(terms,/Exact EDU selection: EDU/);
 assert.doesNotMatch(terms, /CANONICAL/);
 // README/AGENTS retain forensic historical references, not active Project choices.
});
test('S01 one precise I ACCEPT, then new exact mode selection, never ACTIVE',()=>{
 const {offer,accepted,orientation}=setup();
 assert.equal(validateC72V2Offer(offer),true);
 assert.equal(validateC72V2Accepted(accepted),true);
 assert.equal(validateC72V2Orientation(orientation,accepted),true);
 assert.equal(accepted.selected_mode,null);
 for(const word of ['I ACCEPT ',' i accept','I ACCEPT EDU','EXPERIMENTAL','EDU','I ACCEPT\n']){
  const refused=acceptC72V2Terms({offer,humanMessage:word,termsPresented:true});
  assert.equal(refused.active,false);assert.equal(refused.schema,'ikant-le-c72-public-denial/v2');
 }
 for(const word of ['EDU']){
  const x=selectC72V2Mode({accepted,orientation,humanMessage:word});
  assert.equal(validateC72V2ModeSelection(x,{mode:word,sourceHead}),true);
  assert.equal(x.active,false);assert.equal(x.native_event_attested,false);
  assert.equal(x.persistent,false);assert.equal(x.owner_receipt_issued,false);
  assert.equal(validateC72ModeSelection(x),false,'v2 is not a fake historical v1 receipt');
  if(word==='EDU')assert.equal(x.first_unclosed_edge,'EDU_OWNER_CONSUMER_V2_NOT_QUALIFIED');
  if(word==='CANONICAL')assert.equal(x.first_unclosed_edge,'AUTHENTICATED_NATIVE_MCP_INGRESS_NOT_ATTESTED');
 }
});
test('S01 v2 introduction deterministic, 100 candidates, no legacy public mode',()=>{
 const y=evaluateC72V2Introductions();
 assert.equal(y.evaluated,100);assert.equal(y.unique,100);assert.equal(y.selected.valid,true);
 assert.ok(y.selected.words>=90&&y.selected.words<=200);
 assert.ok(y.selected.text.includes('EDU')&&!y.selected.text.includes('CANONICAL'));
 assert.ok(!y.selected.text.includes('EXPERIMENTAL'));
 assert.equal(setup().orientation.text,y.selected.text);
});
test('S01 rejects legacy text, replay by schema, changed bindings and illicit promotions',()=>{
 const {offer,accepted,orientation}=setup();
 for(const word of ['EXPERIMENTAL','experimental','edu','EDU ','CANONICAL','CANONICAL\n','I ACCEPT EDU','']){
  const refused=selectC72V2Mode({accepted,orientation,humanMessage:word});
  assert.equal(refused.status,'INVALID_MODE_SELECTION');assert.equal(refused.active,false);
 }
 const edu=selectC72V2Mode({accepted,orientation,humanMessage:'EDU'});
 for(const variant of [
  {...edu,active:true},
  {...edu,persistent:true},
  {...edu,native_event_attested:true},
  {...edu,selected_mode:'EXPERIMENTAL'},
  {...edu,status:'CANONICAL_ACTIVE'},
  {...edu,source_head:'c'.repeat(40)},
  {...edu,schema:'ikant-le-c72-mode-selection/v1'},
  {...edu,owner_receipt_issued:true}
 ]) assert.equal(validateC72V2ModeSelection(variant),false);
 assert.equal(validateC72V2ModeSelection(edu,{mode:'CANONICAL'}),false);
 assert.equal(validateC72V2ModeSelection(edu,{sourceHead:'f'.repeat(40)}),false);
 assert.equal(selectC72V2Mode({accepted,orientation:{...orientation,text:orientation.text+' extra'},humanMessage:'EDU'}).status,'INVALID_ORIENTATION_BOUNDARY');
 assert.equal(acceptC72V2Terms({offer:{...offer,source_head:'f'.repeat(40)},humanMessage:'I ACCEPT',termsPresented:true}).status,'INVALID_OFFER');
 assert.equal(acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:false}).status,'TERMS_NOT_PRESENTED');
});
test('S01 manifest points to real current terms and does not promise migrated legacy runtime',()=>{
 const text=fs.readFileSync(new URL('../TERMS.md',import.meta.url),'utf8');
 assert.match(text,/Exact EDU selection: EDU/);
 assert.match(text,/MCP is an independent externally installed app\/service surface/);
 const bootstrap=JSON.parse(fs.readFileSync(new URL('../BOOTSTRAP.json',import.meta.url)));
 assert.equal(bootstrap.user_onboarding_c72.consumers_require_S02_versioned_wiring,true);
 const old=JSON.parse(fs.readFileSync(new URL('../contracts/c72-unified-mode-admission.json',import.meta.url)));
 assert.deepEqual(old.mode_choices,['CANONICAL','EXPERIMENTAL']);
});
