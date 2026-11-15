import test from 'node:test';
import assert from 'node:assert/strict';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode}
 from '../host/c72-unified-mode-admission.mjs';
import {planC99PostSelectionTurn as plan} from '../host/c99-postselection-planner.mjs';
const head='a05846cb58af8a6509299008674beb582020e318';
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const intro=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation:intro,humanMessage:'EXPERIMENTAL'});
const canon=selectC72Mode({accepted,orientation:intro,humanMessage:'CANONICAL'});
const req={sourceHead:head,selection,humanInput:'Come funziona il runtime?',cohostOptInObserved:false,
 cohostRevoked:false,carrierHints:[],previousFailedRoute:'NONE',failedEvidenceChanged:false};
const run=(x={})=>plan({...req,...x});
test('absence of installed carrier and optin denies C84 retry and cohost fallback',()=>{
 assert.equal(run().status,'C99_STOP');
 const stale=run({previousFailedRoute:'C84',carrierHints:['C84']});
 assert.equal(stale.status,'C99_STOP');
 assert.equal(stale.first_unclosed_edge,'FIRST_UNCLOSED_EDGE_UNCHANGED_NO_RETRY');
});
test('real original C72 only; hints merely produce unauthenticated route plans',()=>{
 assert.equal(run({selection:canon,carrierHints:['C84']}).status,'C99_STOP');
 assert.equal(run({selection:{selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'},carrierHints:['C84']}).status,'C99_STOP');
 for(const [hint,expected,optIn] of [
  [['C84','C102','C100'],'C84',false],
  [['C102','C100'],'C102',true],
  [['C100'],'C100',true],
  [[], 'E0_HOST_DRAFT',true]
 ]){
  const r=run({carrierHints:hint,cohostOptInObserved:optIn});
  assert.equal(r.route,expected);assert.equal(r.status,'C99_PLAN_ONLY_NOT_EXECUTED');
  assert.equal(r.owner_executed,false);assert.equal(r.local_runtime_executed,false);
  assert.equal(r.native_delivery_attested,false);
 }
});
test('hard limits, revocation, stale route and long input',()=>{
 assert.equal(run({carrierHints:['C102'],cohostOptInObserved:true,cohostRevoked:true}).status,'C99_STOP');
 assert.equal(run({carrierHints:['C84','C102','C100'],cohostOptInObserved:true,
  previousFailedRoute:'C84'}).route,'C102');
 assert.equal(run({carrierHints:['C102','C100'],cohostOptInObserved:true,
  previousFailedRoute:'C102'}).route,'C100');
 assert.equal(run({carrierHints:['C102'],cohostOptInObserved:true,
  previousFailedRoute:'C102'}).route,'E0_HOST_DRAFT');
 assert.equal(run({carrierHints:['C84','C102','C100'],cohostOptInObserved:true,
  previousFailedRoute:'C84',failedEvidenceChanged:true}).route,'C84');
 assert.equal(run({humanInput:'x'.repeat(601),carrierHints:['C84','C102','C100'],
  cohostOptInObserved:true}).route,'C100');
 assert.equal(run({humanInput:'x'.repeat(12001),cohostOptInObserved:true}).status,'C99_STOP');
 for(const cmd of ['I ACCEPT','CANONICAL','EXPERIMENTAL','STOP BOZZE COHOST'])
  assert.equal(run({humanInput:cmd,cohostOptInObserved:true}).status,'C99_STOP');
});
test('reject hostile descriptors without invoking getters or proxies',()=>{
 let called=0;const bad={...selection};
 Object.defineProperty(bad,'source_head',{get(){called++;throw Error('never')} });
 assert.equal(run({selection:bad,carrierHints:['C84']}).status,'C99_STOP');
 const hints=['C84'];
 Object.defineProperty(hints,'0',{get(){called++;throw Error('never')}});
 assert.equal(run({carrierHints:hints}).status,'C99_STOP');
 const root={...req};Object.defineProperty(root,'sourceHead',{get(){called++;throw Error('never')}});
 assert.equal(plan(root).status,'C99_STOP');
 assert.equal(called,0);
 assert.equal(plan(new Proxy(req,{get(){called++;throw Error('never')}})).status,'C99_STOP');
 assert.equal(called,0);
});
