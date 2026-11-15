import test from 'node:test';
import assert from 'node:assert/strict';
import {nodeDispatchReceiptPure,validateNodeDispatchReceipt} from '../src/runtime-dispatch.mjs';

test('C31 node dispatch validation recomputes digest and binds input epoch status and surface',()=>{
 const input='input limitato',r=nodeDispatchReceiptPure(input,{epoch:'acceptance-event-x',status:'RUNTIME_BOUND_LIMITED'},{nodeVersion:'20.11.1',hostSurface:'TEST'});
 assert.deepEqual(validateNodeDispatchReceipt(r,{input,epoch:'acceptance-event-x',statusBefore:'RUNTIME_BOUND_LIMITED',hostSurface:'TEST'}),{ok:true,errors:[]});
 assert.equal(validateNodeDispatchReceipt({...r,epoch:'acceptance-event-y'},{input,epoch:'acceptance-event-x',statusBefore:'RUNTIME_BOUND_LIMITED',hostSurface:'TEST'}).ok,false);
 assert.equal(validateNodeDispatchReceipt({...r,receipt_sha256:'f'.repeat(64)},{input,epoch:'acceptance-event-x',statusBefore:'RUNTIME_BOUND_LIMITED',hostSurface:'TEST'}).ok,false);
});
