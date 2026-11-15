import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {materializeC82ParallelCarriers} from '../host/c82-experimental-carriers.mjs';
import {executeC84ExperimentalTurn} from '../host/c84-experimental-transport.mjs';

const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const head='a'.repeat(40);
const files=Array.from({length:20},(_,i)=>{
 const b=Buffer.from('c84-qualified-source-'+i,'utf8');
 return {path:'src/c84-fixture-'+i+'.mjs',bytes:b.length,sha256:sha(b),
  original_source_blob_sha1:blob(b),generated_derivative:false,
  contentBase64:b.toString('base64')};
});
const makeRelay=()=>({
 expectedPaths:files.map(f=>f.path),_sourceHead:head,writes:[],
 stageFile({filePath,contentBase64,sourceBlobSha1}){
  const f=files.find(v=>v.path===filePath);
  assert.equal(contentBase64,f.contentBase64);
  assert.equal(sourceBlobSha1,f.original_source_blob_sha1);
  this.writes.push(filePath);
 },
 finalize(){return {all_bytes_reopened:this.writes.length===files.length};}
});
test('C84 C82 parallel legacy byte transfer: one writer, no origin or ACTIVE promotion',async()=>{
 let running=0,peak=0;
 const provider=(name,valid)=>({name,async getFile(filePath){
  running++;peak=Math.max(peak,running);
  try{
   await new Promise(resolve=>setTimeout(resolve,1));
   const f=files.find(v=>v.path===filePath);
   return {contentBase64:valid?f.contentBase64:Buffer.from('wrong').toString('base64')};
  }finally{running--;}
 }});
 const relay=makeRelay();
 const result=await materializeC82ParallelCarriers({relay,
  manifest:{source_head:head,files},
  carriers:[provider('LEGACY_CORRUPT',false),provider('LEGACY_ZIP_VERIFIED',true)],
  parallelism:2,carrierTimeoutMs:1000});
 assert.equal(result.status,'C82_C77_BYTES_MATERIALIZED_IN_NODE',JSON.stringify(result));
 assert.equal(result.all_bytes_reopened,true);
 assert.equal(result.files,20);
 assert.equal(relay.writes.length,20);
 assert.ok(peak<=2);
 assert.ok(result.max_awaited_callbacks_observed<=2);
 assert.ok(result.selected_carriers.every(v=>v.carrier==='LEGACY_ZIP_VERIFIED'));
 assert.equal(result.source_origin_attested,false);
 assert.equal(result.active,false);
 assert.equal(result.persistent,false);
});
test('C84 1000 real C82 negative mutation attempts deny all-or-nothing staging',async()=>{
 const carrier={name:'WARM_CACHE_EXACT',getFile:async p=>({
  contentBase64:files.find(f=>f.path===p).contentBase64
 })};
 for(let i=0;i<1000;i++){
  const mutant=files.map(f=>({...f}));
  const target=mutant[i%mutant.length];
  switch(i%5){
  case 0: target.sha256='0'.repeat(64);break;
  case 1: target.original_source_blob_sha1='f'.repeat(40);break;
  case 2: target.bytes+=1;break;
  case 3: target.sha256='F'.repeat(64);break;
  case 4: target.original_source_blob_sha1=null;break;
  }
  const relay=makeRelay();
  const result=await materializeC82ParallelCarriers({relay,
   manifest:{source_head:head,files:mutant},carriers:[carrier],parallelism:3});
  assert.equal(result.status,'C82_CARRIER_STOP');
  assert.equal(relay.writes.length,0);
 }
});
test('C84 rejects invalid frozen source and input without creating a runtime',async()=>{
 for(const x of [
  {sourceHead:'x',humanInput:'legitimo'},
  {sourceHead:head,humanInput:'x'.repeat(601)},
  {sourceHead:head,humanInput:'api_key=secret'},
  {sourceHead:head,humanInput:'normale',selection:null}
 ]){
  const r=await executeC84ExperimentalTurn({
   sourceHead:x.sourceHead,expectedManifestSha256:'b'.repeat(64),
   humanInput:x.humanInput,selection:x.selection,carriers:[]});
  assert.equal(r.status,'C84_STOP');
  assert.equal(r.active,false);
  assert.equal(r.owner_receipt_issued,false);
 }
});

test('C84.3 immediate samehash winner does not launch slower losing providers',async()=>{
 let loserCalls=0;
 const fastest={name:'WARM_CACHE_EXACT',getFile:async filePath=>{
  const f=files.find(v=>v.path===filePath);return {contentBase64:f.contentBase64};
 }};
 const unused={name:'LEGACY_PERMALINK',getFile:async()=>{
  loserCalls++;throw Error('LOSER_SHOULD_NOT_LAUNCH');
 }};
 const relay=makeRelay();
 const r=await materializeC82ParallelCarriers({relay,
  manifest:{source_head:head,files},carriers:[fastest,unused],
  parallelism:3,carrierTimeoutMs:500,hedgeDelayMs:75});
 assert.equal(r.status,'C82_C77_BYTES_MATERIALIZED_IN_NODE',JSON.stringify(r));
 assert.equal(loserCalls,0);
 assert.equal(r.invoked_host_callbacks,20);
 assert.equal(r.max_awaited_callbacks_observed<=3,true);
 assert.equal(r.candidate_hedge_delay_ms,75);
 assert.equal(relay.writes.length,20);
});
test('C84.3 timed hedging selects a fast alternate and cancels cooperative slow carrier',async()=>{
 let slowCalls=0,aborts=0,fastCalls=0;
 const slow={name:'SLOW_LEGACY',getFile:(p,{signal})=>new Promise((resolve,reject)=>{
  slowCalls++;
  const timer=setTimeout(()=>reject(Error('SLOW_TIMEOUT')),300);
  const cancel=()=>{aborts++;clearTimeout(timer);reject(Error('COOPERATIVE_ABORT'));};
  signal.addEventListener('abort',cancel,{once:true});
 })};
 const quick={name:'GITHUB_API_BASE64',getFile:async p=>{
  fastCalls++;return {contentBase64:files.find(f=>f.path===p).contentBase64};
 }};
 const relay=makeRelay();
 const r=await materializeC82ParallelCarriers({relay,manifest:{source_head:head,files},
  carriers:[slow,quick],parallelism:3,carrierTimeoutMs:500,hedgeDelayMs:20});
 assert.equal(r.status,'C82_C77_BYTES_MATERIALIZED_IN_NODE',JSON.stringify(r));
 assert.equal(r.all_bytes_reopened,true);
 assert.ok(slowCalls>0);
 assert.ok(fastCalls>0);
 assert.equal(aborts,slowCalls);
 assert.ok(r.max_awaited_callbacks_observed<=3);
 assert.equal(r.timeout_does_not_prove_provider_cancellation,true);
});

test('C84.5 quarantines a timed-out uncooperative provider, without inventing cancellation',async()=>{
 let uncooperativeCalls=0;
 const neverSettles={name:'UNCOOPERATIVE_LEGACY',getFile:async()=>{
  uncooperativeCalls++;
  return new Promise(()=>{});
 }};
 const good={name:'ACTUAL_SAMEHASH_CACHE',getFile:async path=>({
  contentBase64:files.find(f=>f.path===path).contentBase64
 })};
 const relay=makeRelay();
 const receipt=await materializeC82ParallelCarriers({
  relay,manifest:{source_head:head,files},carriers:[neverSettles,good],
  parallelism:2,carrierTimeoutMs:50,hedgeDelayMs:20});
 assert.equal(receipt.status,'C82_C77_BYTES_MATERIALIZED_IN_NODE',JSON.stringify(receipt));
 assert.equal(relay.writes.length,20);
 assert.ok(uncooperativeCalls>0);
 assert.ok(uncooperativeCalls<=2,'timed-out provider relaunched after quarantine');
 assert.deepEqual(receipt.timed_out_carrier_names,['UNCOOPERATIVE_LEGACY']);
 assert.equal(receipt.provider_physical_termination_attested,false);
 assert.equal(receipt.active,false);
});
