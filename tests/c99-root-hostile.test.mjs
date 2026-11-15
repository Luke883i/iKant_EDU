import test from 'node:test';
import assert from 'node:assert/strict';
import {gateC99ExperimentalEntry,gateC99SourceHandoff} from '../host/c99-route-policy.mjs';
import {executeC98ExistingC84} from '../host/c98-existing-c84-entry.mjs';
const H='a'.repeat(40),M='b'.repeat(64);
const b=()=>({sourceHead:H,selection:{selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'},humanInput:'ciao',readC77Archive:async()=>{}});
test('C99 root-level getter cannot trigger on six experimental entry fields',()=>{
 let calls=0;
 for(const k of ['sourceHead','selection','humanInput','readC77Member','readC77Archive','nodeGithubNetworkRequested']){
  const x=b();Object.defineProperty(x,k,{enumerable:true,get(){calls++;return b()[k];}});
  const r=gateC99ExperimentalEntry(x);assert.equal(r.status,'C99_STOP',k);
  assert.equal(r.first_unclosed_edge,'C99_INPUT_ENVELOPE_ACCESSOR');
 }
 assert.equal(calls,0);
});
test('C99 root-level getters cannot trigger in C81 source handoff',()=>{
 let calls=0;const make=()=>({sourceHead:H,manifestSha256:M,sourceProof:{commitBase64:'x',treeObjects:[{}]}});
 for(const k of ['sourceHead','manifestSha256','sourceProof']){
  const x=make();Object.defineProperty(x,k,{enumerable:true,get(){calls++;return make()[k];}});
  const r=gateC99SourceHandoff(x);assert.equal(r.status,'C99_STOP');
  assert.equal(r.first_unclosed_edge,'C99_INPUT_ENVELOPE_ACCESSOR');
 }
 assert.equal(calls,0);
});
test('normal host ingress remains same status, no C84 callback executed',()=>{
 let calls=0;const x=b();x.readC77Archive=()=>{calls++;};
 const r=gateC99ExperimentalEntry(x);
 assert.equal(r.status,'C99_CALLBACK_SHAPE_ONLY_NOT_AUTHENTICATED');
 assert.equal(calls,0);
 const s=gateC99SourceHandoff({sourceHead:H,manifestSha256:M,sourceProof:{commitBase64:'x',treeObjects:[{}]}});
 assert.equal(s.status,'C99_C81_PROOF_SHAPE_ONLY_NOT_VERIFIED');
});
test('C98 real entry does not touch a malicious root sourceProof accessor',async()=>{
 let calls=0;const x={...b(),manifestSha256:M};
 Object.defineProperty(x,'sourceProof',{enumerable:true,get(){calls++;return {commitBase64:'x',treeObjects:[{}]}}});
 const r=await executeC98ExistingC84(x);
 assert.equal(r.status,'C98_STOP');
 assert.equal(r.first_unclosed_edge,'C99_INPUT_ENVELOPE_ACCESSOR');
 assert.equal(calls,0);
});

test('C99 refuses JavaScript Proxy on root envelope before executing proxy traps',()=>{
 let traps=0;
 const p=new Proxy(b(),{getOwnPropertyDescriptor(t,k){traps++;return Reflect.getOwnPropertyDescriptor(t,k)},
  getPrototypeOf(t){traps++;return Reflect.getPrototypeOf(t)}});
 const r=gateC99ExperimentalEntry(p);
 assert.equal(r.status,'C99_STOP');assert.equal(r.first_unclosed_edge,'C99_INPUT_ENVELOPE_ACCESSOR');
 assert.equal(traps,0);
});
test('C99 refuses Proxy C72 selection and raw Git proof without executing traps',()=>{
 let traps=0;const poison=t=>new Proxy(t,{
  getOwnPropertyDescriptor(o,k){traps++;return Reflect.getOwnPropertyDescriptor(o,k)},
  getPrototypeOf(o){traps++;return Reflect.getPrototypeOf(o)},
  get(o,k){traps++;return Reflect.get(o,k)}});
 const s=poison({selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING',source_head:H});
 assert.equal(gateC99ExperimentalEntry({...b(),selection:s}).status,'C99_STOP');
 assert.equal(gateC99SourceHandoff({sourceHead:H,manifestSha256:M,
  sourceProof:poison({commitBase64:'x',treeObjects:[{}]})}).status,'C99_STOP');
 assert.equal(gateC99SourceHandoff({sourceHead:H,manifestSha256:M,
  sourceProof:{commitBase64:'x',treeObjects:poison([{}])}}).status,'C99_STOP');
 assert.equal(traps,0);
});
