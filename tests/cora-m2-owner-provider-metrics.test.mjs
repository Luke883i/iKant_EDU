import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateM2Profile,modelM2Cut,observeM2Source} from '../scripts/cora-m2-owner-provider-metrics.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PROFILE=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/cora-m2-owner-provider-metrics-v1.json'),'utf8'));
const copy=x=>JSON.parse(JSON.stringify(x));
const leaves=PROFILE.nodes.filter(n=>!['INTERMEDIATE','GLOBAL'].includes(n.scope));
const source=Object.fromEntries(leaves.filter(n=>n.scope==='SOURCE').map(n=>[n.id,true]));
const all=Object.fromEntries(leaves.map(n=>[n.id,true]));
test('M2 reuses original owner/S3/PR-F/M1, with exact 16-node AND, 14 metrics, 14 checklist entries',()=>{
 const q=validateM2Profile(PROFILE);
 assert.equal(q.ok,true,JSON.stringify(q));
 assert.equal(q.nodes,16);
 assert.equal(q.metrics,14);
 assert.equal(q.checklist,14);
 assert.equal(PROFILE.authority,0);
 assert.equal(PROFILE.owner,false);
 assert.deepEqual(PROFILE.nodes.at(-1).needs,['I_M2_SOURCE','M2E6','M2E7']);
 assert.equal(PROFILE.source.original_m1,'scripts/cora-m1-shared-evidence.mjs');
 assert.equal(PROFILE.source.original_s3,'contracts/cora-s3-source-convergence-v1.json');
 assert.equal(PROFILE.nonpromotion.provider_attested,false);
 assert.equal(PROFILE.metric_policy.numeric_ratio_never_proves_field_success,true);
});
test('source-only witnesses cannot close original C72, C135, C87, C125 or native provider',()=>{
 const q=modelM2Cut(PROFILE,source);
 assert.equal(q.ok,true);
 assert.equal(q.model_source,true);
 assert.equal(q.model_full,false);
 for(const n of PROFILE.nodes.filter(x=>x.scope==='EXTERNAL'))
  assert.notEqual(q.state[n.id],'MODEL_TRUE',n.id);
 assert.equal(q.m2_complete,false);
 assert.equal(q.owner_invoked,false);
 assert.equal(q.provider_attested,false);
 assert.equal(q.ledger_written,false);
 assert.equal(q.voice_sent,false);
});
test('all-true simulated owner/provider leaves have NO authority to mint original receipts',()=>{
 const q=modelM2Cut(PROFILE,all);
 assert.equal(q.model_full,true);
 for(const [k,v] of Object.entries({m2_complete:false,owner_invoked:false,
  provider_attested:false,ledger_written:false,voice_sent:false,
  original_receipt_issued:false,repository_standardized:false,
  product_go:false,permission_to_retry:false,authority:0,active:false}))
  assert.equal(q[k],v,k);
});
test('every required leaf is non-compensatory for M2 logical closure',()=>{
 for(const n of leaves){
  const q=modelM2Cut(PROFILE,{...all,[n.id]:false});
  assert.equal(q.model_full,false,n.id);
  assert.equal(q.m2_complete,false,n.id);
 }
});
test('contract-authority, source-pins, metrics, checklist and topology falsifiers',()=>{
 const bad=[
  p=>p.authority=1,p=>p.owner=true,p=>p.active=true,p=>p.release='GO',
  p=>p.source.base_head='a'.repeat(40),p=>p.source.base_tree='a'.repeat(40),
  p=>p.source.repository='Luke883i/iKant_LE',
  p=>p.source.original_m1='new-inventory',
  p=>p.source.original_s3='new-runtime',
  p=>p.source.original_pr_f='new-constitution',
  p=>p.pinned_original_blobs['host/c87-durable-ledger.mjs']='a'.repeat(40),
  p=>p.abstract_dod.logic='OR',
  p=>p.abstract_dod.formula='ONLY_GIT_HASHES',
  p=>p.abstract_dod.source_not_owner_receipt=false,
  p=>p.abstract_dod.local_ledger_not_provider_persistence=false,
  p=>p.abstract_dod.callback_not_native_delivery=false,
  p=>p.abstract_dod.zero_native_receipt_minted=false,
  p=>p.abstract_dod.unknown_not_pass=false,
  p=>p.metric_policy.numeric_ratio_never_proves_field_success=false,
  p=>p.metric_policy.source_metric_states=['PASS'],
  p=>p.metric_policy.external_metric_states=['PASS'],
  p=>p.metric_policy.finite_mutations_are_not_independent_trials=false,
  p=>p.metric_policy.field_evidence_requires_original_receipts_and_independent_readback=false,
  p=>p.metric_policy.provider_evidence_requires_native_authenticated_ack=false,
  p=>p.nonpromotion.owner_invoked=true,
  p=>p.nonpromotion.provider_attested=true,
  p=>p.nonpromotion.m2_complete=true,
  p=>p.nonpromotion.ledger_written=true,
  p=>p.nonpromotion.voice_sent=true,
  p=>p.nonpromotion.permission_to_retry=true,
  p=>p.nodes.pop(),p=>p.nodes[0].id='FORGED',
  p=>p.nodes[10].needs=[],p=>p.nodes[11].scope='SOURCE',
  p=>p.metrics.pop(),p=>p.metrics[7].default_state='PASS',
  p=>p.metrics[0].layer='PROVIDER',
  p=>p.metrics[13].node='M2S0',
  p=>p.checklist.pop(),
  p=>p.checklist[8].verdict='APPROVED',
  p=>p.checklist[0].external=true,
  p=>p.first_unclosed='M2_COMPLETE',
  p=>p.not_a_receipt=false
 ];
 const h=crypto.createHash('sha256');
 let seed=20261105>>>0,survivors=0,unblocked=0,covered=new Set();
 for(let i=0;i<12000;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const idx=i<bad.length?i:seed%bad.length;
  const q=copy(PROFILE);
  bad[idx](q);
  covered.add(idx);
  const r=validateM2Profile(q);
  if(r.ok)survivors++;
  if(r.m2_complete!==false||r.provider_attested!==false||r.authority!==0)unblocked++;
  h.update(idx+':'+(r.ok?'S':'R')+';');
 }
 assert.equal(covered.size,bad.length);
 assert.equal(survivors,0);
 assert.equal(unblocked,0);
 assert.match(h.digest('hex'),/^[0-9a-f]{64}$/);
});
test('100000 deterministic model vectors cannot turn hypothetical receipts into physical receipts',()=>{
 const run=()=>{
  let seed=20261105>>>0,unsafe=0,logicalFull=0;
  const h=crypto.createHash('sha256');
  for(let i=0;i<100000;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const n=seed%leaves.length;
   const q=modelM2Cut(PROFILE,{...all,[leaves[n].id]:false});
   if(q.model_full)logicalFull++;
   if(q.m2_complete||q.owner_invoked||q.provider_attested||q.voice_sent||
    q.permission_to_retry||q.repository_standardized||q.authority!==0)unsafe++;
   h.update(n+':'+(q.model_full?'1':'0')+';');
  }
  return {unsafe,logicalFull,sha256:h.digest('hex')};
 };
 const a=run(),b=run();
 assert.deepEqual(a,b);
 assert.equal(a.logicalFull,0);
 assert.equal(a.unsafe,0);
});
test('actual HEAD source readback: seven source metrics, seven external metrics remain NOT_ATTESTED',()=>{
 const q=observeM2Source();
 assert.equal(q.ok,true,JSON.stringify(q));
 assert.equal(q.status,'M2_SOURCE_METROLOGY_ONLY_EXTERNAL_DOD_OPEN');
 assert.equal(q.metrics_total,14);
 assert.equal(q.checklist_total,14);
 assert.equal(q.source_metric_count,7);
 assert.equal(q.external_metric_count,7);
 assert.equal(Object.keys(q.source.original_owner_blobs).length,8);
 assert.equal(q.reticulum.source_model,true);
 assert.equal(q.reticulum.full_model,false);
 assert.equal(q.first_edge,'M2E1_ORIGINAL_C72_RECEIPT_NOT_ATTESTED');
 for(const m of q.metrics.filter(x=>x.layer==='PROVIDER'||x.layer==='OWNER')){
  assert.equal(m.status,'NOT_ATTESTED',m.id);
  assert.equal(m.numerator,null,m.id);
 }
 assert.equal(q.m2_complete,false);
 assert.equal(q.owner_invoked,false);
 assert.equal(q.ledger_written,false);
 assert.equal(q.native_delivery,'NOT_ATTESTED');
 assert.equal(q.provider,'NOT_ATTESTED');
 assert.equal(q.product_go,false);
});
