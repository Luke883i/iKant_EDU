import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {qualifyNeedleOutput,observeNeedleShadow,NEEDLE_SOURCE_HEAD} from '../host/needle-shadow-adapter.mjs';
import {completeWithLocalNeedle} from '../host/needle-shadow-local-runner.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const input=Buffer.from('Studia il metodo scientifico.');
const good={type:'call',confidence:.81,function_calls:[{name:'route_hint',arguments:{route:'GENERAL_STUDY'}}]};
const req=(more={})=>({humanInputBytes:input,sourceHead:NEEDLE_SOURCE_HEAD,mode:'EDU',enabled:true,explicitDataPermission:true,localOnly:true,timeoutMs:300,modelComplete:async()=>good,...more});
const neg=[
 x=>{x.active=true;}, x=>{x.results=['forged'];}, x=>{x.type='illegal';},
 x=>{x.type='call';x.function_calls=[];}, x=>{x.type='none';},
 x=>{x.confidence=1.2;}, x=>{x.confidence=NaN;}, x=>{x.confidence=-1;},
 x=>{x.function_calls=[{name:'C87',arguments:{text:'x'}}];},
 x=>{x.function_calls=[{name:'route_hint',arguments:{route:'SELF_ONTOLOGY'}}];},
 x=>{x.function_calls=[{name:'route_hint',arguments:{route:'GENERAL_STUDY',owner:'C135'}}];},
 x=>{x.function_calls=[{name:'extract_slots',arguments:{fields:['a','b','c','d','e']}}];},
 x=>{x.function_calls=[{name:'extract_slots',arguments:{fields:['x'.repeat(70)]}}];},
 x=>{x.function_calls=[{name:'extract_slots',arguments:{fields:['\n']}}];},
 x=>{x.function_calls=[{name:'extract_slots',arguments:JSON.parse('{"__proto__":{"active":true}}')}];},
 x=>{x.suppressed_calls={};}, x=>{x.function_calls[0].results=[1];},
 x=>{x.function_calls=Array(4).fill(x.function_calls[0]);},
 x=>{x.extra='forged';}, x=>{Object.defineProperty(x,'getter',{get(){throw Error('bad getter');},enumerable:true});},
 x=>{x.reasoning='X'.repeat(5000);},
 x=>{x.function_calls=[{name:'extract_slots',arguments:{fields:undefined}}];},
 x=>{x.function_calls=[{name:'route_hint',arguments:{route:4}}];},
 x=>{x.function_calls=[{name:'delete_records',arguments:{}}];}
];
test('original byte digest, no message echoed, no owner calls',async()=>{
 const r=await observeNeedleShadow(req());
 assert.equal(r.status,'SHADOW_ONLY');
 assert.equal(r.input_sha256,sha(input));
 assert.equal(r.writer_calls,0);
 assert.equal(r.active,false);
 assert.equal(r.native_identity_attested,false);
 assert.equal(r.model_efficacy_attested,false);
 assert.ok(!JSON.stringify(r).includes('scientifico'));
 assert.ok(!JSON.stringify(r).includes('GENERAL_STUDY'));
});
test('empty or uncalibrated no authority',()=>{
 assert.equal(qualifyNeedleOutput({type:'none',function_calls:[],confidence:null}).status,'ABSTAIN');
 assert.equal(qualifyNeedleOutput({type:'refusal',function_calls:[]}).status,'ABSTAIN');
 assert.equal(qualifyNeedleOutput({type:'call',confidence:null,function_calls:[{name:'extract_slots',arguments:{fields:['date']}}]}).status,'SHADOW_ONLY');
});
test('gates stop before any model invocation, exact invalid UTF-8 denied',async()=>{
 let calls=0;const f=()=>{calls++;return good;};
 for(const change of [{sourceHead:'f'.repeat(40)},{mode:'CANONICAL'},{enabled:false},{explicitDataPermission:false},{localOnly:false},{humanInputBytes:'not bytes'},{humanInputBytes:Buffer.from([0xc3,0x28])},{humanInputBytes:Buffer.alloc(0)},{humanInputBytes:Buffer.from([0])},{humanInputBytes:Buffer.alloc(8193,65)},{timeoutMs:9999},{modelComplete:null}]){
  const x=await observeNeedleShadow(req({modelComplete:f,...change}));assert.equal(x.status,'STOP');
 }
 assert.equal(calls,0);
});
test('2400 deterministic adversarial cases: 24 mutations x 100, no empirical model claims',()=>{
 assert.equal(neg.length,24);
 for(let i=0;i<2400;i++){
  const x=structuredClone(good);neg[i%neg.length](x);
  assert.equal(qualifyNeedleOutput(x).status,'STOP','mutation '+i);
 }
});
test('failed callback or timeout: STOP without raw exception',async()=>{
 for(const modelComplete of [()=>{throw Error('SECRET '+input);},()=>new Promise(()=>{})]){
  const x=await observeNeedleShadow(req({modelComplete,timeoutMs:55}));
  assert.equal(x.status,'STOP');assert.equal(x.first_edge,'NEEDLE_FAILED_OR_TIMED_OUT_NO_RETRY');
  assert.ok(!JSON.stringify(x).includes('SECRET'));
 }
});
test('real OS-process exit on hung test worker (bounded timeout)',async()=>{
 const old=process.env.IKANT_NEEDLE_FIXTURE_TEST;process.env.IKANT_NEEDLE_FIXTURE_TEST='1';
 try{
  await assert.rejects(completeWithLocalNeedle('hello',{testFixture:true,timeoutMs:130}),/NEEDLE_WORKER_TIMEOUT_EXITED/);
  await assert.rejects(completeWithLocalNeedle('hello',{python:'sh'}),/NEEDLE_BUDGET_OR_PYTHON_DENIED/);
 }finally{if(old===undefined)delete process.env.IKANT_NEEDLE_FIXTURE_TEST;else process.env.IKANT_NEEDLE_FIXTURE_TEST=old;}
});
test('no process on unbounded input or invalid timeout',async()=>{
 await assert.rejects(completeWithLocalNeedle('x'.repeat(8193)),/NEEDLE_INPUT_DENIED/);
 await assert.rejects(completeWithLocalNeedle('ok',{timeoutMs:9000}),/NEEDLE_BUDGET_OR_PYTHON_DENIED/);
});
