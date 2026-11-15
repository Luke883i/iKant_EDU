import test from 'node:test';import assert from 'node:assert/strict';
import {projectSafeHostEvidence} from '../host/p1-privacy-envelope.mjs';
test('Only technical fields may leave HOST; no input/name/secret',()=>{
 const x={status:'LOCAL_READBACK_VERIFIED',mode:'EDU',source_head:'a'.repeat(40),
  human_input:'My name is Gianluca',user_name:'Gianluca',bearer_token:'SECRETBYTES123',
  provider_email:'private@example.org',c87_event_sha256:'b'.repeat(64)};
 const y=projectSafeHostEvidence(x);assert.equal(y.ok,true);assert.equal(y.active,false);
 const text=JSON.stringify(y);for(const v of ['Gianluca','SECRETBYTES123','private@example.org','My name is'])assert.equal(text.includes(v),false);
});
test('HOST projections fail closed on malformed fields or effectful source',()=>{
 assert.equal(projectSafeHostEvidence({status:'I AM ACTIVE'}).ok,false);
 assert.equal(projectSafeHostEvidence(new Proxy({}, {get(){throw Error('LEAK')}})).ok,false);
 const x={};Object.defineProperty(x,'status',{get(){throw Error('LEAK')}});assert.equal(projectSafeHostEvidence(x).ok,false);
});