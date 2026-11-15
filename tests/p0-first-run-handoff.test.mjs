import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {planP1PostModeSourceHandoff} from '../host/p1-postmode-source-handoff.mjs';
const h='a'.repeat(40),t=createHash('sha256').update('terms').digest('hex');
const offer=issueC72V2TermsOffer({sourceHead:h,termsDigest:t});
const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const selection=selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:'EDU'});
test('four observed source states are distinct and the first permitted handoff is one-click',()=>{
 for(const state of ['SOURCE_ABSENT','PARTIAL_SOURCE_ONLY']){
  const r=planP1PostModeSourceHandoff({selection,sourceState:state,bridgeState:'DEFINITIVELY_UNAVAILABLE'});
  assert.equal(r.action,'REQUEST_SOURCE_ZIP');assert.equal(r.after_mode_only,true);
  assert.equal(r.source_zip_url,`https://github.com/Luke883i/iKant_EDU/archive/${h}.zip`);
  assert.match(r.message,/allegalo qui/);assert.match(r.message,/Non servono terminale/);
 }
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'FULL_SOURCE_VERIFIED'}).action,'USE_VERIFIED_SOURCE');
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'SOURCE_UNKNOWN'}).action,'VERIFY_SOURCE');
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'SOURCE_UNKNOWN'}).source_zip_url,null);
 for(const state of ['SOURCE_ABSENT','PARTIAL_SOURCE_ONLY']){
  const p=planP1PostModeSourceHandoff({selection,sourceState:state});
  assert.equal(p.action,'VERIFY_MACHINE_BRIDGE');assert.equal(p.source_zip_url,null);
  const available=planP1PostModeSourceHandoff({selection,sourceState:state,bridgeState:'AVAILABLE'});
  assert.equal(available.action,'VERIFY_MACHINE_BRIDGE');assert.equal(available.source_zip_url,null);
 }
});
test('no inferred selection, no contradictory or unknown source evidence, no early ZIP',()=>{
 assert.equal(planP1PostModeSourceHandoff({selection:null,sourceState:'SOURCE_ABSENT'}).action,'STOP');
 assert.equal(planP1PostModeSourceHandoff({selection:{...selection,selected_mode:'CANONICAL'},sourceState:'SOURCE_ABSENT'}).action,'STOP');
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'PARTIAL_SOURCE_ONLY',sourceAvailable:true}).action,'STOP');
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'FAKE_READY'}).source_zip_url,null);
 assert.equal(planP1PostModeSourceHandoff({selection}).source_zip_url,null);
});
