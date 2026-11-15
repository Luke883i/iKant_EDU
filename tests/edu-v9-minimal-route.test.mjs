import test from 'node:test';import assert from 'node:assert/strict';
import {projectV9MinimalNext,V9_FACTS} from '../host/edu-v9-minimal-route.mjs';
const all=()=>Object.fromEntries(V9_FACTS.map(k=>[k,true]));
const expect=(p,n)=>assert.equal(projectV9MinimalNext(p).next,n);
test('monotone minimal path, never C107 direct instead of PR119',()=>{
 const cases=[
  ['index_verified','VERIFY_HOST_INDEX_THEN_STOP'],
  ['terms_presented','PIN_AND_PRESENT_TERMS_THEN_STOP'],
  ['common_accept_observed','AWAIT_EXACT_I_ACCEPT'],
  ['experimental_selected','AWAIT_EXACT_MODE'],
  ['separate_draft_optin_observed','AWAIT_SEPARATE_DRAFT_OPTIN'],
  ['carrier_local_verified','PROBE_ONE_OWNER_ALLOWED_MACHINE_BRIDGE'],
  ['pr118_pr119_materialized','MATERIALIZE_PINNED_PR118_PR119_MODULES'],
  ['guided_owner_executed','RUN_ONLY_PR119_GUIDED_OWNER'],
  ['independent_c87_readback','RECONCILE_C87_WITHOUT_BLIND_RETRY']];
 for(const [key,next] of cases){const f=all();f[key]=false;if(key==='carrier_local_verified'){f.machine_bridge_available=false;f.machine_attempts_exhausted=false;}expect(f,next)}
 expect(all(),'PRESENT_OWNER_VOICE_BYTES_UNCHANGED');
});
test('handoff only after machine exhausted, never after existing bytes',()=>{
 const f=all();f.carrier_local_verified=false;f.machine_bridge_available=false;
 f.machine_attempts_exhausted=false;expect(f,'PROBE_ONE_OWNER_ALLOWED_MACHINE_BRIDGE');
 f.machine_attempts_exhausted=true;expect(f,'MANUAL_SOURCE_HANDOFF_LAST_RESORT');
 f.machine_bridge_available=true;expect(f,'VERIFY_AND_STAGE_EXISTING_C107_BYTES');
 f.carrier_local_verified=true;expect(f,'PRESENT_OWNER_VOICE_BYTES_UNCHANGED');
});
test('unknown properties/getters/proxies denied without invoking traps',()=>{
 let read=0;const a=all();a.extra=true;expect(a,'STOP');
 const b=all();Object.defineProperty(b,'index_verified',{get(){read++;throw Error('read')},enumerable:true});expect(b,'STOP');assert.equal(read,0);
 const c=new Proxy(all(),{get(){read++;throw Error('read')}});expect(c,'STOP');assert.equal(read,0);
 expect(new Map(),'STOP');
});
test('exhaustive 2^11 state projection agrees with independent priority oracle',()=>{
 let examined=0;for(let mask=0;mask<1<<V9_FACTS.length;mask++){
  const f=Object.fromEntries(V9_FACTS.map((k,i)=>[k,Boolean(mask&(1<<i))]));
  const o=projectV9MinimalNext(f);
  let want;
  const k=['VERIFY_HOST_INDEX_THEN_STOP','PIN_AND_PRESENT_TERMS_THEN_STOP','AWAIT_EXACT_I_ACCEPT','AWAIT_EXACT_MODE','AWAIT_SEPARATE_DRAFT_OPTIN'];
  const first=[0,1,2,3,4].find(i=>!(mask&(1<<i)));
  if(first!==undefined)want=k[first];
  else if(!(mask&(1<<5)))want=(mask&(1<<6))?'VERIFY_AND_STAGE_EXISTING_C107_BYTES':(mask&(1<<7))?'MANUAL_SOURCE_HANDOFF_LAST_RESORT':'PROBE_ONE_OWNER_ALLOWED_MACHINE_BRIDGE';
  else if(!(mask&(1<<8)))want='MATERIALIZE_PINNED_PR118_PR119_MODULES';
  else if(!(mask&(1<<9)))want='RUN_ONLY_PR119_GUIDED_OWNER';
  else if(!(mask&(1<<10)))want='RECONCILE_C87_WITHOUT_BLIND_RETRY';
  else want='PRESENT_OWNER_VOICE_BYTES_UNCHANGED';
  assert.equal(o.next,want,`mask=${mask}`);assert.equal(o.authority,0);assert.equal(o.claims_authenticated,false);examined++;
 }assert.equal(examined,2048);
});
