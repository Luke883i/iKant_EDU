import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {planP1PostModeSourceHandoff} from '../host/p1-postmode-source-handoff.mjs';
import {planOneShellEduSource} from '../host/project-oneshell-edu.mjs';

const head='a'.repeat(40);
const digest=createHash('sha256').update('PR215 checkout-only fixture terms').digest('hex');
const offer=issueC72V2TermsOffer({sourceHead:head,termsDigest:digest});
const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const orientation=presentC72V2Introduction(accepted);
const selection=selectC72V2Mode({accepted,orientation,humanMessage:'EDU'});
const expected='https://github.com/Luke883i/iKant_EDU/archive/'+head+'.zip';

test('PR215 original C72 EDU selection binds both P1 and six-slot OneShell to the current pinned source',()=>{
 for(const state of ['SOURCE_ABSENT','PARTIAL_SOURCE_ONLY']){
  const p=planP1PostModeSourceHandoff({selection,sourceState:state,bridgeState:'UNKNOWN',manualRoute:'EXPLICIT_MANUAL_POST_EDU'});
  assert.equal(p.ok,true);
  assert.equal(p.action,'REQUEST_SOURCE_ZIP');
  assert.equal(p.after_mode_only,true);
  assert.equal(p.source_zip_url,expected);
  assert.equal(p.source_zip_url.includes('/iKant_LE/'),false);
  const frame=planOneShellEduSource({selection,sourceState:state,bridgeState:'UNKNOWN',nodeReady:true,manualExtractorReady:true,manualRoute:'EXPLICIT_MANUAL_POST_EDU'});
  assert.deepEqual(frame.slot_order,['ESITO','A','B','PROVA','EDGE','NEXT']);
  assert.equal(frame.slots.PROVA,expected);
  assert.equal(frame.slots.NEXT,'UPLOAD_PINNED_SOURCE_ZIP');
  assert.equal(frame.slots.A,'NO_VOICE');
 }
});

test('PR215 source URL migration never grants an early ZIP or bypasses C72, unknown source or bridge gates',()=>{
 const bad={...selection,receipt_sha256:'0'.repeat(64)};
 for(const selectionTest of [null,bad]){
  const p=planP1PostModeSourceHandoff({selection:selectionTest,sourceState:'SOURCE_ABSENT',manualRoute:'EXPLICIT_MANUAL_POST_EDU'});
  assert.equal(p.ok,false);
 }
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'SOURCE_UNKNOWN',manualRoute:'EXPLICIT_MANUAL_POST_EDU'}).action,'VERIFY_SOURCE');
 assert.equal(planP1PostModeSourceHandoff({selection,sourceState:'SOURCE_ABSENT',bridgeState:'UNKNOWN',manualRoute:'AUTO'}).action,'VERIFY_MACHINE_BRIDGE');
 const frame=planOneShellEduSource({selection,sourceState:'SOURCE_ABSENT',bridgeState:'UNKNOWN',nodeReady:false,manualExtractorReady:true,manualRoute:'EXPLICIT_MANUAL_POST_EDU'});
 assert.notEqual(frame.slots.NEXT,'UPLOAD_PINNED_SOURCE_ZIP');
 assert.equal(frame.slots.A,'NO_VOICE');
});
