import test from 'node:test';
import assert from 'node:assert/strict';
import {assessV5CFixture,fixtureCandidate,REQUIRED,auditOriginalSource} from '../scripts/v5c-edu-proof-policy.mjs';
test('policy includes at least twenty local requirements and does not mint runtime authority',()=>{
 assert(REQUIRED.length>=30);
 const expected=new Set(Array.from({length:20},(_,i)=>'L'+String(i+1).padStart(2,'0')));
 assert.deepEqual(new Set(REQUIRED.map(x=>x[2])),expected,'every local DoD has an explicit falsifiable predicate');
 const a=assessV5CFixture(fixtureCandidate());
 assert.equal(a.ok,true);assert.equal(a.global_dod_attested,false);
 assert.equal(a.original_native_event_attested,false);
 assert.equal(a.owner_receipt_created,false);assert.equal(a.product_release,'PRODUCT_NO_GO');
});
test('all individually necessary evidence gates reject a single-field mutation',()=>{
 for(const [k,v] of REQUIRED){
  const changed={...fixtureCandidate(),[k]:typeof v==='boolean'?!v:'NOT_'+v};
  const result=assessV5CFixture(changed);
  assert.equal(result.ok,false,k);
  assert(result.edge.includes(k),k);
 }
});
test('provider or native owner claimed by a fixture is never accepted',()=>{
 for(const kind of ['OWNER_RECEIPT','PROVIDER_INSTALLED','CI_GREEN','LOCAL_HASH_ONLY']){
  assert.equal(assessV5CFixture({...fixtureCandidate(),kind}).edge,'V5C_ORIGIN_MISLABELED');
 }
});
test('source lock, C72 at-most-once and readback fences must not be waived',()=>{
 for(const key of ['source_epoch_unchanged','accept_owner_outcome','original_attempt_fence',
  'ledger_independently_reopened','ambiguous_send_replayed']){
  const specimen={...fixtureCandidate(),[key]:key==='accept_owner_outcome'?'UNKNOWN':
   key==='ambiguous_send_replayed'?true:false};
  assert.equal(assessV5CFixture(specimen).ok,false,key);
 }
});
test('original repo source boundaries preserve C72/C135/C87/C125/S03 and manifest',()=>{
 const report=auditOriginalSource();
 assert.equal(report.ok,true,JSON.stringify(report.errors));
 assert.equal(report.original_owner_executed,false);
 assert.equal(report.global_dod_attested,false);
 assert(report.source_manifest_paths>=100);
});
