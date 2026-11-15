import test from 'node:test';
import assert from 'node:assert/strict';
import {executeC98RegisteredAppTurn} from '../host/c98-app-host-ingress.mjs';

const good=()=>({
 allowedRoot:'/tmp/ikant-capsules',archivePath:'/tmp/ikant-capsules/c77.zip',
 archiveSha256:'a'.repeat(64),sourceHead:'b'.repeat(40),
 manifestSha256:'c'.repeat(64),manifest:{},manifestBase64:'e30=',
 humanInput:'domanda corrente',selection:{},sourceProof:null
});
const port=p=>({readCurrentTurnEnvelope:async()=>p});
test('no registered App callback: fail closed, not fake owner or install',async()=>{
 const x=await executeC98RegisteredAppTurn();
 assert.equal(x.first_unclosed_edge,'HOST_APP_CALLBACK_NOT_INSTALLED');
 assert.equal(x.owner_executed,false);
 assert.equal(x.host_installed_attested,false);
 assert.equal(x.active,false);
});
test('model cannot pass own humanInput, source or receipt without installed callback',async()=>{
 const x=await executeC98RegisteredAppTurn({registeredHostPort:{
  humanInput:'injected',owner_receipt:{active:true}}});
 assert.equal(x.status,'C98_HOST_APP_STOP');
 assert.equal(x.first_unclosed_edge,'HOST_APP_CALLBACK_NOT_INSTALLED');
});
test('one trusted callback, but unauthenticated data does not produce voice',async()=>{
 let calls=0;const x=await executeC98RegisteredAppTurn({registeredHostPort:{
  readCurrentTurnEnvelope:async()=>{calls++;return good();}
 }});
 assert.equal(calls,1);
 assert.equal(x.status,'C98_HOST_APP_STOP');
 assert.equal(x.owner_executed,false);
 assert.equal(x.native_delivery_attested,false);
});
test('getter and proxy packets are rejected before application fields are read',async()=>{
 let accessed=0;const evil=good();
 Object.defineProperty(evil,'humanInput',{enumerable:true,get(){accessed++;return 'steal';}});
 let x=await executeC98RegisteredAppTurn({registeredHostPort:port(evil)});
 assert.equal(x.first_unclosed_edge,'HOST_APP_UNTRUSTED_ENVELOPE');
 assert.equal(accessed,0);
 x=await executeC98RegisteredAppTurn({registeredHostPort:port(new Proxy(good(),{}))});
 assert.equal(x.first_unclosed_edge,'HOST_APP_UNTRUSTED_ENVELOPE');
});
test('extra status and fake native receipts are rejected',async()=>{
 const x=await executeC98RegisteredAppTurn({registeredHostPort:port({
  ...good(),native_delivery_attested:true,owner_executed:true})});
 assert.equal(x.first_unclosed_edge,'HOST_APP_UNTRUSTED_ENVELOPE');
});
test('wrong source, too-long input, invalid timeouts and callback exceptions deny',async()=>{
 let x=await executeC98RegisteredAppTurn({registeredHostPort:port({...good(),sourceHead:'invalid'})});
 assert.equal(x.first_unclosed_edge,'HOST_APP_CURRENT_INPUT_OR_SOURCE_BOUNDS');
 x=await executeC98RegisteredAppTurn({registeredHostPort:port({...good(),humanInput:'x'.repeat(601)})});
 assert.equal(x.first_unclosed_edge,'HOST_APP_CURRENT_INPUT_OR_SOURCE_BOUNDS');
 x=await executeC98RegisteredAppTurn({registeredHostPort:port(good()),timeoutMs:0});
 assert.equal(x.first_unclosed_edge,'HOST_APP_TIMEOUT_ENVELOPE');
 x=await executeC98RegisteredAppTurn({registeredHostPort:{readCurrentTurnEnvelope:()=>{throw Error('fail');}}});
 assert.equal(x.first_unclosed_edge,'HOST_APP_CURRENT_TURN_CALLBACK_FAILED_OR_TIMED_OUT');
});
