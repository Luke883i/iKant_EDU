import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveC127Transport} from '../host/edu-c127-source-transport.mjs';
test('missing admission cannot trigger callbacks',async()=>{
 let calls=0;
 const r=await resolveC127Transport({admitted:false,bridges:[{id:'A',fetch:()=>{calls++;return Buffer.from('x')}}]});
 assert.equal(r.ok,false);assert.equal(calls,0);
});
test('only three distinct physically attempted machine bridges, manual LAST',async()=>{
 let calls=0;const bridge=i=>({id:'bridge'+i,fetch:()=>{calls++;return Buffer.from('invalid'+i)}});
 const r=await resolveC127Transport({admitted:true,bridges:[bridge(0),bridge(1),bridge(2),bridge(3)]});
 assert.equal(r.ok,false);assert.equal(r.attempts,3);assert.equal(calls,3);
 assert.equal(r.next,'MANUAL_EXACT_SOURCE_AND_OVERLAY_HANDOFF');
 assert.equal(r.first_edge,'C127_MAXIMUM_REAL_MACHINE_ATTEMPTS_EXHAUSTED');
 assert.equal(r.events.length,3);
});
test('no pretend attempts and repeated bridge ID fail closed',async()=>{
 const absent=await resolveC127Transport({admitted:true,bridges:[]});
 assert.equal(absent.attempts,0);assert.equal(absent.next,'MANUAL_EXACT_SOURCE_AND_OVERLAY_HANDOFF');
 const duplicate=await resolveC127Transport({admitted:true,bridges:[
  {id:'A',fetch:()=>Buffer.from('bad')},{id:'A',fetch:()=>Buffer.from('bad2')}]});
 assert.equal(duplicate.ok,false);assert.equal(duplicate.first_edge,'C127_UNTRUSTED_BRIDGE');
});
