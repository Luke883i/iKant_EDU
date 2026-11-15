import test from 'node:test';
import assert from 'node:assert/strict';
import {executeC98ExistingC84} from '../host/c98-existing-c84-entry.mjs';
const H='a'.repeat(40),S={selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'};
const good={sourceHead:H,selection:S,humanInput:'current input'};
test('no source or no C72 current selection cannot touch host',async()=>{
 const r=await executeC98ExistingC84({sourceHead:H,selection:S,humanInput:''});
 assert.equal(r.status,'C98_STOP');assert.equal(r.first_unclosed_edge,'C72_NATIVE_CURRENT_HUMAN_SELECTION_OR_SOURCE_REQUIRED');
});
test('installed callback is not guessed from available GitHub connector',async()=>{
 const r=await executeC98ExistingC84(good);
 assert.equal(r.first_unclosed_edge,'HOST_CONNECTOR_NODE_CALLBACK_NOT_INSTALLED');
 assert.equal(r.active,false);
});
test('real Node owner not invoked without bound source proof',async()=>{
 const r=await executeC98ExistingC84({...good,readC77Member:async()=>({})});
 assert.equal(r.first_unclosed_edge,'C81_VERIFIED_SOURCE_PROOF_REQUIRED');
});
test('fake provider/native ACTIVE fields do not enter owner without selection',async()=>{
 const r=await executeC98ExistingC84({...good,
  selection:{selected_mode:'CANONICAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'},
  readC77Member:async()=>({}),sourceProof:{commitBase64:'x',treeObjects:[]}});
 assert.equal(r.status,'C98_STOP');assert.equal(r.active,false);
});
test('ambiguous simultaneous archive+file callbacks fail before inspecting them',async()=>{
 let calls=0;
 const r=await executeC98ExistingC84({...good,
  readC77Member:async()=>{calls++;throw Error('not allowed')},
  readC77Archive:async()=>{calls++;throw Error('not allowed')}});
 assert.equal(r.status,'C98_STOP');
 assert.equal(r.first_unclosed_edge,'AMBIGUOUS_HOST_CARRIER_SELECT_ONE');
 assert.equal(calls,0);
});
