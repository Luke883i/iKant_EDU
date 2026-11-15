import test from 'node:test';import assert from 'node:assert/strict';
import {qualifyV8HostClaim,V8_CLAIM_FIELDS} from '../host/edu-v8-release-policy.mjs';
import {PIN} from '../host/c107-carrier-consumer.mjs';
const okay=()=>({schema:'ikant-edu-v8-host-evidence/v1',source_head:PIN.head,carrier_sha256:PIN.carrier_sha256,language_origin:'HOST_BOUND',...Object.fromEntries(V8_CLAIM_FIELDS.map(k=>[k,true]))});
test('necessary evidence shape allows HOST_BOUND only as POLICY_ONLY',()=>{
 const x=qualifyV8HostClaim(okay());assert.equal(x.eligible,true);assert.equal(x.origin,'HOST_BOUND');
 assert.equal(x.status,'POLICY_ONLY_NOT_PROVENANCE');assert.equal(x.active,false);assert.equal(x.native_origin_attested,false);
});
test('all 18 individual missing claims denied, fail-closed',()=>{
 for(const k of V8_CLAIM_FIELDS){const x=okay();x[k]=false;const r=qualifyV8HostClaim(x);assert.equal(r.eligible,false,k);assert.equal(r.origin,'NO_VOICE',k)}
});
test('source and wrong origin deny provider/ACTIVE claims',()=>{
 for(const patch of [{source_head:'0'.repeat(40)},{language_origin:'ORIGINAL_DEMO'},{carrier_sha256:'0'.repeat(64)}]){
  assert.equal(qualifyV8HostClaim({...okay(),...patch}).eligible,false);
 }
});
test('unknown key, accessor, Proxy and exotic prototype denied without hostile getter',()=>{
 let invoked=0;const x=okay();x.bad=true;assert.equal(qualifyV8HostClaim(x).eligible,false);
 const y=okay();Object.defineProperty(y,'source_head',{enumerable:true,get(){invoked++;throw Error('trap')}});
 assert.equal(qualifyV8HostClaim(y).eligible,false);assert.equal(invoked,0);
 const p=new Proxy(okay(),{get(){invoked++;throw Error('proxy')}});
 assert.equal(qualifyV8HostClaim(p).eligible,false);assert.equal(invoked,0);
 assert.equal(qualifyV8HostClaim(new Map()).eligible,false);
});
