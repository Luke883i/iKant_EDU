#!/usr/bin/env node
/** CORA M3: one bounded reversible source change, not archive/owner/approval authority. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {observeM1Source} from './cora-m1-shared-evidence.mjs';
import {observeM2Source,validateM2Profile} from './cora-m2-owner-provider-metrics.mjs';
import {observePrABacklog} from './cora-pr-a-backlog.mjs';
import {observePrFSource} from './cora-pr-f-qualification.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE='40d1fe252aab05b028cb82b80dd4818b977d5e2a';
const BASE_TREE='0a76acb3d1b799b9d62c4442f3db8e8a0f85c57a';
const BEFORE='57d07b7977d505a8fe85773ff11d56c54e82773d';
const AFTER='78cfc6a1472a1832afefa6f58b385176a5b037be';
const TARGET='scripts/cora-m2-owner-provider-metrics.mjs';
const HISTORICAL='project-baseline/PROJECT_PROMPT.txt';
const REGISTER='governance/changes/zzzzzzzzzzzzzzzzzzzzzzz-cora-m3-reversible-slice.json';
const ALLOWED={
 [TARGET]:'M','tests/cora-m2-owner-provider-metrics.test.mjs':'M',
 'scripts/cora-m3-reversible-slice.mjs':'A',
 'tests/cora-m3-reversible-slice.test.mjs':'A',[REGISTER]:'A'
};
const NODES=[
 ['M3S1','SOURCE',[]],['M3S2','SOURCE',['M3S1']],
 ['M3S3','SOURCE',['M3S1']],['M3S4','SOURCE',['M3S1']],
 ['M3S5','SOURCE',['M3S1']],
 ['M3_SOURCE','INTERMEDIATE',['M3S1','M3S2','M3S3','M3S4','M3S5']],
 ['M3E1','EXTERNAL',['M3_SOURCE']],['M3E2','EXTERNAL',['M3_SOURCE']],
 ['M3E3','EXTERNAL',['M3_SOURCE']],['M3E4','EXTERNAL',['M3_SOURCE']],
 ['M3_COMPLETE','GLOBAL',['M3_SOURCE','M3E1','M3E2','M3E3','M3E4']]
];
const SHA=/^[a-f0-9]{40}$/u;
const shaBlob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex');
const denied=edge=>({ok:false,edge,authority:0,source_slice_qualified:false,
 m3_complete:false,archive_allowed:false,rollback_proven:false,
 independent_equivalence_proven:false,consumer_closure:false,review_completed:false,
 product_go:false,owner_invoked:false,provider_attested:false});
const cmd=(...a)=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8',timeout:30000,maxBuffer:8000000}).trim();
const bytes=(...a)=>execFileSync('git',a,{cwd:ROOT,timeout:30000,maxBuffer:8000000});
/** Construct an exact allowlisted delta from the historical ownerless M2 tool. */
export function expectedM2HardenedSource(original,profile){
 if(typeof original!=='string'||profile?.schema!=='ikant-host-cora-m2-owner-provider-metrics/v1'||
  !Array.isArray(profile.nodes)||profile.nodes.length!==16||
  !profile.nonpromotion||!profile.metric_policy)throw Error('M3_ORIGINAL_INPUT_UNVERIFIED');
 const replace=(v,a,b)=>{
  if(v.split(a).length!==2)throw Error('M3_PATCH_ANCHOR_DRIFT');
  return v.replace(a,b);
 };
 let next=replace(original,"import fs from 'node:fs';\n",'');
 next=replace(next,'const H40=/^[a-f0-9]{40}$/u;',
  'const ORIGINAL_PROOFS='+JSON.stringify(profile.nodes.map(n=>n.proof))+';\n'+
  'const NONPROMOTION_KEYS='+JSON.stringify(Object.keys(profile.nonpromotion).sort())+';\n'+
  'const METRIC_POLICY_KEYS='+JSON.stringify(Object.keys(profile.metric_policy).sort())+';\n'+
  'const H40=/^[a-f0-9]{40}$/u;');
 next=replace(next,'p.nonpromotion&&Object.values(p.nonpromotion).some(x=>x!==false)||',
  'JSON.stringify(Object.keys(p.nonpromotion||{}).sort())!==JSON.stringify(NONPROMOTION_KEYS)||\n'+
  '  Object.values(p.nonpromotion||{}).some(x=>x!==false)||\n'+
  '  JSON.stringify(Object.keys(p.metric_policy||{}).sort())!==JSON.stringify(METRIC_POLICY_KEYS)||');
 next=replace(next,"typeof n.proof!=='string'||n.proof.length<25||",
  'n.proof!==ORIGINAL_PROOFS[i]||');
 return next;
}
export function modelM3Reticulum(claims={}){
 const state={};
 for(const [id,scope,needs] of NODES){
  const parents=needs.every(p=>state[p]==='MODEL_TRUE');
  state[id]=scope==='SOURCE'||scope==='EXTERNAL'?
   claims[id]===true&&parents?'MODEL_TRUE':'UNKNOWN_NOT_PROVEN':
   parents?'MODEL_TRUE':'BLOCKED_DEPENDENCY';
 }
 return {ok:true,nodes:NODES.length,state,
  source_model:state.M3_SOURCE==='MODEL_TRUE',full_model:state.M3_COMPLETE==='MODEL_TRUE',
  first_edge:NODES.find(n=>state[n[0]]!=='MODEL_TRUE')?.[0]||'MODEL_ONLY_NOT_EXTERNAL_RECEIPT',
  authority:0,m3_complete:false,archive_allowed:false,rollback_proven:false,
  independent_equivalence_proven:false,consumer_closure:false,review_completed:false,
  product_go:false,owner_invoked:false};
}
export function qualifyM3Delta({baseHead,baseTree,head,tree,before,after,
 profile,delta,ownerPins,prA,m1,m2,f}={}){
 if(baseHead!==BASE||baseTree!==BASE_TREE||!SHA.test(head||'')||!SHA.test(tree||'')||
  head===BASE||!profile||validateM2Profile(profile).ok!==true||
  !Array.isArray(delta)||delta.length!==Object.keys(ALLOWED).length)
  return denied('M3_EPOCH_PROFILE_OR_DELTA_INVALID');
 if(typeof before!=='string'||typeof after!=='string'||
  shaBlob(Buffer.from(before,'utf8'))!==BEFORE||shaBlob(Buffer.from(after,'utf8'))!==AFTER)
  return denied('M3_GIT_BLOB_IDENTITY_DRIFT');
 try{if(expectedM2HardenedSource(before,profile)!==after)
  return denied('M3_CHANGE_NOT_EXACT_HARDENING');}
 catch{return denied('M3_CHANGE_ANCHOR_DRIFT');}
 const seen=new Set();
 for(const {path:p,status} of delta){
  if(seen.has(p)||ALLOWED[p]!==status)return denied('M3_UNREGISTERED_CHANGE_OR_ARCHIVE');
  seen.add(p);
 }
 if(seen.size!==Object.keys(ALLOWED).length)return denied('M3_DELTA_BIJECTION_INVALID');
 if(!ownerPins||JSON.stringify(ownerPins)!==JSON.stringify(profile.pinned_original_blobs))
  return denied('M3_ORIGINAL_OWNER_BLOB_DRIFT');
 if(f?.ok!==true||f.witnesses?.F08!==false||f.witnesses?.F09!==false||
  f.witnesses?.F11!==false||f.repo_standardized!==false||
  m1?.ok!==true||m1.head!==head||m1.tree!==tree||
  m1.m1_complete!==false||m1.archive_allowed!==false||
  m2?.ok!==true||m2.source?.head!==head||m2.source?.tree!==tree||
  m2.m2_complete!==false||m2.provider!=='NOT_ATTESTED')
  return denied('M3_ORIGINAL_UPSTREAM_EVIDENCE_INVALID');
 if(prA?.ok!==true||prA.source_head!==head||prA.source_tree!==tree||
  prA.delete_authorized!==false||prA.workflow_retirement_authorized!==false||
  prA.unresolved?.dynamic_and_external_consumers!==true||
  !Array.isArray(prA.rows)||!prA.rows.some(r=>r.path===HISTORICAL&&
   r.delete_authorized===false&&r.consumer_closure==='UNKNOWN'))
  return denied('M3_HISTORICAL_ARCHIVE_NOT_PROVEN_SAFE');
 return {ok:true,source_slice_qualified:true,status:'M3_BOUNDED_GIT_SOURCE_CHANGE_ONLY',
  base_head:BASE,base_tree:BASE_TREE,head,tree,original_blob:BEFORE,
  hardened_blob:AFTER,changed_paths:delta.length,archived_paths:0,
  hardening:['EXACT_NODE_PROOF','EXACT_NONPROMOTION_KEYS','EXACT_METRIC_POLICY_KEYS','UNUSED_IMPORT_REMOVED'],
  source_consumer:'UNKNOWN_NOT_UNUSED',
  first_edge:'M3E1_EXTERNAL_CONSUMER_AND_BEHAVIOR_CLOSURE_NOT_ATTESTED',
  rollback:'GIT_BLOB_RECONSTRUCTION_ONLY_PHYSICAL_RESTORE_PENDING',
  independent_equivalence_proven:false,rollback_proven:false,
  consumer_closure:false,review_completed:false,m3_complete:false,
  archive_allowed:false,product_go:false,authority:0,owner_invoked:false,provider_attested:false};
}
export function observeM3Source(){
 try{
  const head=cmd('rev-parse','HEAD'),tree=cmd('rev-parse','HEAD^{tree}');
  if(!SHA.test(head)||!SHA.test(tree))return denied('M3_LIVE_HEAD_INVALID');
  try{cmd('cat-file','-e',BASE+'^{commit}');}
  catch{return denied('M3_BASELINE_NOT_LOCALLY_AVAILABLE');}
  try{cmd('merge-base','--is-ancestor',BASE,head);}
  catch{return denied('M3_BASE_NOT_ANCESTOR');}
  if(cmd('rev-parse',BASE+'^{tree}')!==BASE_TREE)return denied('M3_BASE_TREE_DRIFT');
  const profile=JSON.parse(bytes('show',head+':contracts/cora-m2-owner-provider-metrics-v1.json').toString('utf8'));
  const before=bytes('show',BASE+':'+TARGET).toString('utf8');
  const after=bytes('show',head+':'+TARGET).toString('utf8');
  if(cmd('rev-parse',BASE+':'+TARGET)!==BEFORE||cmd('rev-parse',head+':'+TARGET)!==AFTER)
   return denied('M3_GIT_REPLAY_SHA_DRIFT');
  const raw=bytes('diff','--name-status','-z',BASE,head).toString('utf8').split('\0').filter(Boolean);
  if(raw.length%2)return denied('M3_GIT_DIFF_PARSE_INVALID');
  const delta=[];for(let i=0;i<raw.length;i+=2)delta.push({status:raw[i],path:raw[i+1]});
  const ownerPins={};
  for(const [p,expected] of Object.entries(profile.pinned_original_blobs)){
   const blob=bytes('show',head+':'+p),sha=cmd('rev-parse',head+':'+p);
   if(sha!==expected||shaBlob(blob)!==sha)return denied('M3_OWNER_PIN_DRIFT:'+p);
   ownerPins[p]=sha;
  }
  const m1=observeM1Source(),m2=observeM2Source(),prA=observePrABacklog(),f=observePrFSource();
  const q=qualifyM3Delta({baseHead:BASE,baseTree:BASE_TREE,head,tree,
    before,after,profile,delta,ownerPins,prA,m1,m2,f});
  if(cmd('rev-parse','HEAD')!==head||cmd('rev-parse','HEAD^{tree}')!==tree)
   return denied('M3_HEAD_CHANGED_DURING_PROBE');
  return q;
 }catch(e){return {...denied('M3_GIT_ORIGINAL_READBACK_UNKNOWN'),
  diagnostic:String(e?.message||e).slice(0,180)};}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('M3_UNKNOWN_ARGS');
 const r=observeM3Source();process.stdout.write(JSON.stringify(r,null,2)+'\n');
 if(!r.ok)process.exitCode=1;
}
