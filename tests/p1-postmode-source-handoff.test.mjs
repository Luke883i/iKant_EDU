import test from 'node:test';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {planP1PostModeSourceHandoff} from '../host/p1-postmode-source-handoff.mjs';
const H='a'.repeat(40),T=createHash('sha256').update('original terms').digest('hex');
const offer=issueC72V2TermsOffer({sourceHead:H,termsDigest:T});
const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const selection=selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:'EDU'});
test('ZIP offered only on genuine post-mode source blocker; not on uncertain state',()=>{
 const absent=planP1PostModeSourceHandoff({selection,sourceAvailable:false,bridgeState:'DEFINITIVELY_UNAVAILABLE'});
 assert.equal(absent.action,'REQUEST_SOURCE_ZIP');assert.equal(absent.source_zip_url,`https://github.com/Luke883i/iKant_EDU/archive/${H}.zip`);
 assert.equal(planP1PostModeSourceHandoff({selection,sourceAvailable:true}).source_zip_url,null);
 assert.equal(planP1PostModeSourceHandoff({selection}).source_zip_url,null);
 assert.equal(planP1PostModeSourceHandoff({selection:{...selection,selected_mode:'EDU',receipt_sha256:'0'.repeat(64)},sourceAvailable:false,bridgeState:'DEFINITIVELY_UNAVAILABLE'}).action,'STOP');
});

test('P1 direct helper cannot bypass EDU-only and verified automatic-bridge absence',()=>{
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'SOURCE_ABSENT'}).action,'VERIFY_MACHINE_BRIDGE');
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'PARTIAL_SOURCE_ONLY',bridgeState:'AVAILABLE'}).source_zip_url,null);
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'SOURCE_ABSENT',bridgeState:'DEFINITIVELY_UNAVAILABLE'}).action,'REQUEST_SOURCE_ZIP');
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'FULL_SOURCE_VERIFIED',bridgeState:'DEFINITIVELY_UNAVAILABLE'}).action,'USE_VERIFIED_SOURCE');
 const canonical=selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:'CANONICAL'});
 assert.equal(planP1PostModeSourceHandoff({selection:canonical,sourceState:'SOURCE_ABSENT',bridgeState:'DEFINITIVELY_UNAVAILABLE'}).action,'STOP');
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'SOURCE_ABSENT',bridgeState:'INFERRED'}).action,'STOP');
});

test('explicit post-EDU manual ZIP is a transport decision and never a C72 bypass',()=>{
 const explicit=planP1PostModeSourceHandoff({selection,sourceState:'SOURCE_ABSENT',
  bridgeState:'UNKNOWN',manualRoute:'EXPLICIT_MANUAL_POST_EDU'});
 assert.equal(explicit.ok,true);
 assert.equal(explicit.action,'REQUEST_SOURCE_ZIP');
 assert.equal(explicit.bridge_absence_claimed,false);
 assert.equal(explicit.source_zip_url,`https://github.com/Luke883i/iKant_EDU/archive/${H}.zip`);
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'SOURCE_ABSENT',
  bridgeState:'UNKNOWN'}).action,'VERIFY_MACHINE_BRIDGE');
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'SOURCE_UNKNOWN',
  manualRoute:'EXPLICIT_MANUAL_POST_EDU'}).action,'VERIFY_SOURCE');
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'FULL_SOURCE_VERIFIED',
  manualRoute:'EXPLICIT_MANUAL_POST_EDU'}).action,'USE_VERIFIED_SOURCE');
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'SOURCE_ABSENT',
  manualRoute:'INFERRED_FROM_HOST'}).action,'STOP');
 const wrong={...selection,receipt_sha256:'f'.repeat(64)};
 assert.equal(planP1PostModeSourceHandoff({selection:wrong,sourceState:'SOURCE_ABSENT',
  manualRoute:'EXPLICIT_MANUAL_POST_EDU'}).action,'STOP');
});

test('historical LE archive cannot be proposed as the EDU source for a pinned original C72 selection',()=>{
 const result=planP1PostModeSourceHandoff({selection,sourceState:'PARTIAL_SOURCE_ONLY',
  bridgeState:'UNKNOWN',manualRoute:'EXPLICIT_MANUAL_POST_EDU'});
 assert.equal(result.ok,true);
 assert.equal(result.after_mode_only,true);
 assert.equal(result.source_zip_url,`https://github.com/Luke883i/iKant_EDU/archive/${H}.zip`);
 assert.equal(result.source_zip_url.includes('/iKant_LE/'),false);
 assert.equal(planP1PostModeSourceHandoff({selection:{...selection,receipt_sha256:'0'.repeat(64)},
  sourceState:'SOURCE_ABSENT',manualRoute:'EXPLICIT_MANUAL_POST_EDU'}).action,'STOP');
});
