import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSessionShell} from '../src/session-shell.mjs';
import {buildHostConsumptionFrame} from '../src/host-consumption-frame.mjs';
import {projectOneShellThreadSnapshot,acceptOneShellThreadSnapshot} from '../host/oneshell-thread-session.mjs';
const H='a'.repeat(40),R='b'.repeat(64);
function fixture(text='Voce esatta\nè originale',turns=1){
 const state={status:'ACTIVE',accepted:true,probed:true,admission:{terms_presented:true,source_head:H,source_head_locked:true,orientation_objects:Array(5).fill({})},bootstrap:{terminal:'ACTIVE',probe:{ok:true,executed_provenance_receipt_sha256:R}},experience:{turns}};
 const session_shell=buildSessionShell({surfaceText:text,state,release:{surface_b_required:false}});
 const result={state:'ACTIVE',claim_class:'IKANT_ACTIVE',session_shell,runtime_turn_event_hash:'c'.repeat(64)};
 return {result,frame:buildHostConsumptionFrame({result,sourceHead:H,runtimeRootSha256:R,sessionRef:'scope'})};
}
test('session snapshot retains exact voice and all six slots, never asserts native persistence',()=>{
 const {result,frame}=fixture();const p=projectOneShellThreadSnapshot({result,frame,sessionRef:'verified-session'});
 assert.equal(p.ok,true);assert.equal(p.slots.A,'Voce esatta\nè originale');
 assert.deepEqual(p.slot_order,['ESITO','A','B','PROVA','EDGE','NEXT']);
 assert.equal(p.provider_thread_persistence_attested,false);assert.equal(p.active,false);
 assert.equal(acceptOneShellThreadSnapshot({next:p}).kind,'INITIAL');
 assert.equal(acceptOneShellThreadSnapshot({previous:p,next:p}).kind,'IDEMPOTENT');
});
test('source owner missing and wrong session cannot produce a voice or reuse a panel',()=>{
 const f=fixture();const p=projectOneShellThreadSnapshot({...f,sessionRef:'scope-1'});
 assert.equal(projectOneShellThreadSnapshot({result:f.result,frame:{...f.frame,receipt_sha256:'0'.repeat(64)},sessionRef:'scope-1'}).ok,false);
 assert.equal(projectOneShellThreadSnapshot({...f,sessionRef:''}).ok,false);
 const q=projectOneShellThreadSnapshot({...f,sessionRef:'scope-2'});
 assert.equal(acceptOneShellThreadSnapshot({previous:p,next:q}).first_edge,'THREAD_SESSION_CROSS_BINDING');
 assert.equal(acceptOneShellThreadSnapshot({next:{...p,slots:{...p.slots,A:'fake'}}}).first_edge,'THREAD_SNAPSHOT_TAMPERED');
});
test('monotonic transition, reject backtracking and same-turn conflicting voice',()=>{
 const x=fixture('one',2),y=fixture('two',3),z=fixture('three',2);
 const a=projectOneShellThreadSnapshot({...x,sessionRef:'same',presentationSequence:2});
 const b=projectOneShellThreadSnapshot({...y,sessionRef:'same',presentationSequence:3});
 const c=projectOneShellThreadSnapshot({...z,sessionRef:'same',presentationSequence:2});
 assert.equal(acceptOneShellThreadSnapshot({previous:a,next:b}).kind,'UPDATE');
 assert.equal(acceptOneShellThreadSnapshot({previous:b,next:a}).first_edge,'THREAD_STALE_TURN_COUNT');
 assert.equal(acceptOneShellThreadSnapshot({previous:a,next:c}).first_edge,'THREAD_SAME_TURN_CONFLICT');
});
test('ten verified local presentation frames share one binding; out-of-order replay denied',()=>{
 let previous=null;let updates=0;
 for(let i=1;i<=10;i++){
  const f=fixture('verified local voice '+i,i);
  const next=projectOneShellThreadSnapshot({...f,sessionRef:'one-thread',presentationSequence:i});
  const state=acceptOneShellThreadSnapshot({previous,next});
  assert.equal(state.ok,true,JSON.stringify(state));
  assert.equal(state.kind,previous?'UPDATE':'INITIAL');
  assert.equal(next.slots.A,'verified local voice '+i);
  previous=state.snapshot;updates++;
 }
 assert.equal(updates,10);
 const old=fixture('old voice',1);
 const stale=projectOneShellThreadSnapshot({...old,sessionRef:'one-thread',presentationSequence:2});
 assert.equal(acceptOneShellThreadSnapshot({previous,next:stale}).first_edge,'THREAD_STALE_TURN_COUNT');
});
