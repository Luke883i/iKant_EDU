import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createProjectC72PreacceptGate} from '../host/project-c72-preaccept-gate.mjs';
import {executeC72PostAcceptRecovery,planC72HostRecovery} from '../host/project-c72-host-recovery.mjs';
import {validateC72V2Accepted,validateC72V2Orientation} from '../host/c72-public-mode-admission.mjs';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD');
const names=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const documents=Object.fromEntries(names.map(path=>{
 const content=execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'});
 const blob_sha1=git('rev-parse','HEAD:'+path);
 const bytes=Buffer.from(content,'utf8'),actual=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 assert.equal(actual,blob_sha1);
 return [path,Object.freeze({path,source_head:head,blob_sha1,content})];
}));
const witness=()=>({source_head:head,
 terms_link:`https://github.com/Luke883i/iKant_EDU/blob/${head}/TERMS.md`,
 host_link_displayed:true,distinct_human_message_observed:true,
 pinned_blob_shas:Object.fromEntries(names.map(p=>[p,documents[p].blob_sha1]))});
const valid=()=>({humanMessage:'I ACCEPT',freshHumanTurn:true,
 priorTurnEvidence:witness(),readMain:async()=>head,
 readPinnedDocument:async(p)=>documents[p]});
test('orientation emits SHA witness using only allowed six reads, freezes before consent',async()=>{
 const calls=[],gate=createProjectC72PreacceptGate({
  readMain:async()=>{calls.push('HEAD');return head;},
  readDocument:async(p,h)=>{assert.equal(h,head);calls.push(p);return documents[p];}
 });
 const result=await gate.orient();assert.equal(result.ok,true);
 assert.deepEqual(calls,['HEAD',...names]);assert.equal(result.documents.length,5);
 const displayed=gate.attestTermsLinkDisplayed({actuallyDisplayed:true});
 assert.equal(displayed.ok,true);const w=displayed.orientation_witness;
 assert.equal(w.host_link_displayed,true);
 assert.equal(w.distinct_human_message_observed,false);
 assert.deepEqual(w.pinned_blob_shas,witness().pinned_blob_shas);
 assert.equal(gate.snapshot().phase,'AWAITING_ACCEPTANCE');
 assert.equal(gate.denySourceAction('READ_TREE').ok,false);
 assert.equal(calls.length,6,'no post-Terms read');
});
test('AUTO is not a terminal error when callbacks are callable: actual original C72 receipt',async()=>{
 const plan=planC72HostRecovery({humanMessage:'I ACCEPT',freshHumanTurn:true,
 termsLinkShown:true,priorSourceWitness:true,node:'UNKNOWN',apiTransport:'UNKNOWN'});
 assert.equal(plan.kind,'AUTO');assert.equal(plan.action,'VERIFY_NODE_20');
 const a=await executeC72PostAcceptRecovery(valid());
 assert.equal(a.ok,true,JSON.stringify(a));
 assert(a.trace.includes('VERIFY_NODE_20')&&a.trace.includes('VERIFY_PINNED_API_TRANSPORT'));
 assert.equal(a.trace.filter(x=>x.startsWith('READ_PINNED:')).length,5);
 assert.equal(a.trace.at(-1),'INVOKE_PINNED_C72_POSTACCEPT_REENTRY');
 assert(validateC72V2Accepted(a.accepted));
 assert(validateC72V2Orientation(a.introduction,a.accepted));
 assert.equal(a.active,false);assert.equal(a.native_event_attested,false);
 assert.equal(a.original_owner_invoked,true);
});
test('bridge UNKNOWN and missing first-turn SHA cannot be relabeled absent or repaired retroactively',async()=>{
 let reads=0;const baseline=valid();
 const x=await executeC72PostAcceptRecovery({...baseline,readMain:undefined,readPinnedDocument:undefined});
 assert.equal(x.edge,'C72_SOURCE_BRIDGE_UNBOUND');assert.equal(x.original_owner_invoked,false);
 const y=await executeC72PostAcceptRecovery({...baseline,
  priorTurnEvidence:{...witness(),pinned_blob_shas:{}},
  readMain:()=>{reads++;return head;}});
 assert.equal(y.edge,'C72_ORIENTATION_WITNESS_MISSING');assert.equal(reads,0);
 const z=await executeC72PostAcceptRecovery({...baseline,ownerOutcome:'UNKNOWN'});
 assert.equal(z.edge,'C72_OWNER_OUTCOME_UNKNOWN');assert.equal(z.trace.length,0);
});
test('10,000 deterministic mutational scenarios: no fake receipt, no blind retry, typed first edge',async()=>{
 const trace=[];let accepted=0,stopped=0,reads=0;
 for(let i=0;i<10000;i++){
  const a=i%10,b=Math.floor(i/10)%10,c=Math.floor(i/100)%10,d=Math.floor(i/1000)%10;
  const v=valid();
  if(a>=2)v.humanMessage=['EDU','I ACCEPT\n','CANONICAL',' I ACCEPT','ciao','I ACCEPT\\t','EXIT IKANT',''][a-2];
  if(b===3)v.priorTurnEvidence.host_link_displayed=false;
  if(b===4)v.priorTurnEvidence.source_head='0'.repeat(40);
  if(b===5)v.priorTurnEvidence.pinned_blob_shas['TERMS.md']='0'.repeat(40);
  if(b===6)v.priorTurnEvidence.distinct_human_message_observed=false;
  if(b===7)v.priorTurnEvidence.terms_link='https://invalid.example';
  if(b===8)v.priorTurnEvidence.pinned_blob_shas={};
  if(b===9)v.ownerOutcome='UNKNOWN';
  if(c===3)v.readMain=undefined;
  if(c===4)v.readPinnedDocument=undefined;
  if(c===5)v.readMain=async()=>{throw Error('bridge unknown');};
  if(c===6)v.readMain=async()=>('a'.repeat(40));
  if(c===7)v.readMain=async()=>null;
  if(c===8)v.readPinnedDocument=async()=>{throw Error('timeout');};
  if(c===9)v.readMain=async()=>({object:{sha:head}});
  if(d>=2){
   const changed=names[(d-2)%5];
   const original=v.readPinnedDocument;
   v.readPinnedDocument=async(path,h)=>{
    reads++;const value=await original(path,h);
    return path===changed?{...value,content:value.content+'x'}:value;
   };
  }
  const response=await executeC72PostAcceptRecovery(v);
  if(response.ok){
   accepted++;
   assert.equal(a<2&&b<3&&c<3&&d<2,true);
   assert(validateC72V2Accepted(response.accepted));
   assert(validateC72V2Orientation(response.introduction,response.accepted));
   assert.equal(response.trace.filter(x=>x.startsWith('READ_PINNED:')).length,5);
   assert.equal(response.native_event_attested,false);
  }else{
   stopped++;assert.equal(response.kind,'STOP');
   assert.equal(response.original_owner_invoked===true,false);
   assert.match(response.edge,/^(C72_|STOP_SOURCE_LOCK_STALE)/);
  }
  trace.push(JSON.stringify({i,axes:[a,b,c,d],ok:response.ok,edge:response.edge||response.kind,
   steps:response.trace.length,original_owner_invoked:response.original_owner_invoked,
   native_event_attested:false}));
 }
 assert.equal(accepted+stopped,10000);assert(accepted>0&&stopped>0);
 const data=trace.join('\n')+'\n';
 const digest=createHash('sha256').update(data).digest('hex');
 const out=process.env.IKANT_C72_RECOVERY_TRACE_DIR;
 if(out){
  mkdirSync(out,{recursive:true});
  const file=join(out,'c72-recovery-10000.jsonl');
  writeFileSync(file,data,{flag:'wx'});assert.equal(readFileSync(file,'utf8'),data);
  const receipt={schema:'ikant-host-c72-recovery-10k/v1',cases:10000,
   accepted,stopped,trace_sha256:digest,native_provider_tests:0,
   original_owner_reused:true,product_release:'PRODUCT_NO_GO'};
  const target=join(out,'RECEIPT.json');
  writeFileSync(target,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  assert.deepEqual(JSON.parse(readFileSync(target,'utf8')),receipt);
 }
 console.log(JSON.stringify({scenario_count:10000,accepted,stopped,sha256:digest}));
});
