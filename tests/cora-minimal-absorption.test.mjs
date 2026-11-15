import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {qualifyCoraAbsorption,sourcePathsPresent} from '../scripts/cora-minimal-absorption.mjs';
const doc=JSON.parse(fs.readFileSync(new URL('../contracts/cora-minimal-absorption-v1.json',import.meta.url),'utf8'));
const clone=()=>structuredClone(doc);

test('CORA method adoption is one minimal source-only candidate, never an owner, writer or product approval',()=>{
 const r=qualifyCoraAbsorption(doc);
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.domains,3);
 assert.equal(r.methods,14);
 assert.equal(r.authority,0);
 assert.equal(r.active,false);
 assert.equal(r.product_go,false);
 assert.equal(r.permission_to_change,false);
 assert.equal(r.original_cora_cli_executed,false);
 assert.deepEqual(doc.domains.map(x=>x.id),['R','S','P']);
 assert.equal(doc.domains[2].status,'BLOCKED_EXTERNAL');
});

test('CORA read-only path check blocks missing local sources rather than inventing owner presence',()=>{
 const nonexistent=sourcePathsPresent(doc,'/definitely-not-ikant-cora-source-directory');
 assert.equal(nonexistent.ok,false);
 assert.equal(nonexistent.status,'SOURCE_PATHS_NOT_OBSERVED');
 assert.equal(nonexistent.missing.length,10);
 assert.equal(nonexistent.product_go,false);
 if(process.env.CORA_LOCAL_FIXTURE!=='1'){
  const source=sourcePathsPresent(doc);
  assert.equal(source.ok,true,JSON.stringify(source));
  assert.equal(source.inspected,10);
  assert.deepEqual(source.missing,[]);
 }
});

test('10k deterministic adversarial models cannot upgrade source-only evidence into authorization',()=>{
 const mutations=[
  x=>x.schema='ikant-cora/v0',
  x=>x.authority=1,
  x=>x.status='ACTIVE',
  x=>x.cora_source.repository='unverified/cora',
  x=>x.cora_source.commit='main',
  x=>x.cora_source.adoption='NATIVE_RUNTIME',
  x=>x.target_source.repository='Luke883i/iKant_LE',
  x=>x.target_source.baseline_main='main',
  x=>x.existing_owners.C72='host/new-c72.mjs',
  x=>x.existing_owners.C125_S03='host/new-voice.mjs',
  x=>x.guardrails.new_runtime_owner=true,
  x=>x.guardrails.new_ledger_writer=true,
  x=>x.guardrails.new_ci_workflow=true,
  x=>x.guardrails.automatic_delete_or_archive=true,
  x=>x.guardrails.automatic_workflow_retirement=true,
  x=>x.guardrails.reuse_prior_consent_or_receipts=true,
  x=>x.guardrails.ci_or_git_proves_native_active=true,
  x=>x.domains.reverse(),
  x=>x.domains[1].methods=[...x.domains[1].methods,x.domains[1].methods[0]],
  x=>x.domains[0].reuse=['not-a-source'],
  x=>x.domains[0].methods[0]='fake-method',
  x=>x.domains[1].reuse=[...x.domains[0].reuse],
  x=>x.domains[0].falsifier='trust the model',
  x=>x.domains[2].status='PASS',
  x=>x.execution_order.splice(5,1),
  x=>x.acceptance.aggregation='WEIGHTED_SCORE',
  x=>x.acceptance.unobserved='PASS',
  x=>x.acceptance.authorization='SELF_APPROVED',
  x=>x.evidence_boundary.splice(2,1),
  x=>x.current_result='PRODUCT_GO'
 ];
 const run=()=>{
  let seed=20261104>>>0,killed=0,unsafe=0;
  const seen=new Set(),digest=crypto.createHash('sha256');
  for(let i=0;i<10000;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const family=i<mutations.length?i:seed%mutations.length,copy=clone();
   mutations[family](copy);
   if(i>=mutations.length){
    const picked=new Set([family]);
    let second=(seed>>>8)%mutations.length;
    while(picked.has(second))second=(second+1)%mutations.length;
    picked.add(second);mutations[second](copy);
    if((seed&3)===0){
     let third=(seed>>>16)%mutations.length;
     while(picked.has(third))third=(third+1)%mutations.length;
     mutations[third](copy);
    }
   }
   const r=qualifyCoraAbsorption(copy);
   if(!r.ok)killed++;
   if(r.ok||r.authority!==0||r.active||r.product_go||r.permission_to_change)unsafe++;
   seen.add(family);digest.update(i+':'+family+':'+(r.edge||r.status)+';');
  }
  return {cases:10000,families:seen.size,killed,unsafe,digest:digest.digest('hex')};
 };
 const a=run(),b=run();
 assert.deepEqual(a,b,'separate seeded replays must match byte-for-byte');
 assert.equal(a.cases,10000);
 assert.equal(a.families,mutations.length);
 assert.equal(a.killed,10000);
 assert.equal(a.unsafe,0);
});
