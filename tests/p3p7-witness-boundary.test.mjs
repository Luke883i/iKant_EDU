import test from 'node:test';import assert from 'node:assert/strict';
import {inspectP3P7Readiness} from '../host/p3p7-witness-boundary.mjs';
test('P3–P7 caller cannot certify external product or native plugin',()=>{
 for(let i=0;i<10000;i++){
  const c={P3:true,P4:true,P5:true,P6:true,P7:true,canonical_active:true,provider_verified:true,user_count:30,receipt_sha256:'a'.repeat(64),nonce:i};
  const x=inspectP3P7Readiness(c);
  assert.equal(x.canonical_active,false);assert.equal(x.edu_product_released,false);assert.equal(x.canonical_product_released,false);
  assert.deepEqual(x.blocked_gates.map(y=>y.priority),['P3','P4','P5','P6','P7']);assert.equal(x.next,'STOP');
 }
});
