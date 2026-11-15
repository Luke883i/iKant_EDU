import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode}
 from '../host/c72-unified-mode-admission.mjs';
import {executeC101LocalCohostMachine,verifyC101Readback}
 from '../host/c101-local-cohost-machine.mjs';
const head='3bc929b55f5dedb9f0ed833e8d036558a5c13d53';
const o=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
const a=acceptC72Terms({offer:o,humanMessage:'I ACCEPT',termsPresented:true});
const intro=presentC72Introduction(a);
const experimental=selectC72Mode({accepted:a,orientation:intro,humanMessage:'EXPERIMENTAL'});
const canonical=selectC72Mode({accepted:a,orientation:intro,humanMessage:'CANONICAL'});
const input='Confronta due metodi di apprendimento con limiti verificabili';
const valid={sourceHead:head,selection:experimental,humanInput:input,optIn:true};
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const candidate=Array.from({length:13},()=>
 'Propongo un confronto tra due metodi usando criteri osservabili, limiti dichiarati, dati distinti dalle ipotesi e una prova di falsificazione indipendente.').join(' ');

test('C101 invokes real C70/C71/C100 and verifies machine UTF-8',()=>{
 const r=executeC101LocalCohostMachine(valid);
 assert.equal(r.status,'C101_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED',JSON.stringify(r));
 assert.equal(r.cognitive_kernel_executed,true);
 assert.equal(r.c70_status,'EXPERIMENTAL_COMPUTE_PREVIEW');
 assert.equal(r.c71_status,'EXPERIMENTAL_HOST_DRAFT');
 assert.equal(r.c100_status,'C100_MODEL_DRAFT_UNATTESTED_NOT_OWNER');
 assert.equal(r.input_sha256,sha(input));
 assert.equal(r.output_sha256,sha(r.voice_utf8));
 assert.equal(verifyC101Readback(r,valid).ok,true);
 for(const k of ['active','persistent','native_delivery_attested','c84_owner_executed','source_origin_attested'])
   assert.equal(r[k],false,k);
 const other=executeC101LocalCohostMachine(valid);
 assert.equal(other.output_sha256,r.output_sha256);
 assert.equal(other.voice_utf8,r.voice_utf8);
 assert.equal(verifyC101Readback({...r,voice_utf8:r.voice_utf8+'!'},valid).ok,false);
});

test('C71 may admit a bounded host draft but only as exact, local projection',()=>{
 const r=executeC101LocalCohostMachine({...valid,modelCandidate:candidate});
 assert.equal(r.status,'C101_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED',JSON.stringify(r));
 assert.equal(r.input_sha256,sha(input));
 assert.equal(r.output_sha256,sha(r.voice_utf8));
 assert.equal(verifyC101Readback(r,{...valid,modelCandidate:candidate}).ok,true);
 assert.equal(r.c84_owner_executed,false);
});

test('C71 guarded identity cannot be overwritten by host draft',()=>{
 const prompt={...valid,humanInput:'Chi sei, iKant?'};
 const guarded=executeC101LocalCohostMachine({...prompt,modelCandidate:candidate});
 const control=executeC101LocalCohostMachine(prompt);
 assert.equal(guarded.status,'C101_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED',JSON.stringify(guarded));
 assert.equal(guarded.guarded,true);
 assert.equal(guarded.host_candidate_used,false);
 assert.equal(guarded.voice_utf8,control.voice_utf8);
});

test('C101 stops at independent gates, no persistence/ACTIVE promotion',()=>{
 const rejects=[
  {...valid,selection:canonical},
  {...valid,sourceHead:'f'.repeat(40)},
  {...valid,optIn:false},
  {...valid,humanInput:'password: cat'},
  {...valid,humanInput:'x'.repeat(601)},
  {...valid,humanInput:''},
  {...valid,modelCandidate:'x'.repeat(3501)},
  {...valid,selection:{...experimental,active:true}},
  {...valid,unexpected:true},
 ];
 for(const x of rejects){const r=executeC101LocalCohostMachine(x);
  assert.equal(r.status,'C101_STOP');assert.equal(r.active,false);
  assert.equal(r.c84_owner_executed,false);
 }
 let getterTriggered=false;
 const accessor=Object.defineProperty({...valid},'humanInput',{
  get(){getterTriggered=true;throw Error('getter called');}});
 assert.equal(executeC101LocalCohostMachine(accessor).status,'C101_STOP');
 assert.equal(getterTriggered,false);
 const proxy=new Proxy(valid,{get(){throw Error('proxy getter');}});
 assert.equal(executeC101LocalCohostMachine(proxy).status,'C101_STOP');
});
