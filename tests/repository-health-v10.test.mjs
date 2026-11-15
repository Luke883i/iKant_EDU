import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditV10,evaluateMinimalDoD,proofOfMinimum,scanLiteralRelative,newUnresolved,validateSourceContract} from '../scripts/repository-health-v10.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const spec=JSON.parse(fs.readFileSync(path.join(root,'contracts/repository-health-v10.json'),'utf8'));

test('V10 source owner pins and complete reconstructed Git tree are checked, not assumed',()=>{
 const out=auditV10({runNative:false});
 assert.equal(out.source_git.ok,true,JSON.stringify(out.source_git.errors));
 assert.equal(out.baseline_tree,'4cff62ed12f79390a059784bcbf9770788a3a4d1');
 assert.equal(out.source_git.tracked,1630);
 assert.equal(out.gate_results.P,'PASS');
 assert.equal(out.gate_results.O,'PASS');
 assert.equal(out.gate_results.R,'PASS');
 assert.equal(out.source_git.tree,out.tree);
 assert.equal(out.authority,0);
 assert.equal(out.product_go,false);
 assert.equal(out.ci_on_candidate,'NOT_RUN');
});

test('V10 inherited lexical debt remains explicitly counted and SHA-pinned',()=>{
 const out=auditV10({runNative:false});
 assert.equal(out.import_lexical_edges>=1720,true);
 assert.equal(out.legacy_unresolved,32);
 assert.equal(out.new_unresolved.length,0);
 assert.equal(out.dynamic_census.epistemic_status,'SOURCE_LEXICAL_CENSUS_NOT_RUNTIME_REACHABILITY');
 assert.equal(out.gate_results.I,'PASS');
 assert.equal(spec.inherited_unresolved_lexical_edges.length,32);
});

test('V10 adversary: new broken literal import is rejected, never declassified as old debt',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'v10-edges-'));
 try{
  fs.mkdirSync(path.join(dir,'host'));
  const brokenSpec='../src/does-not-exist.mjs';
  const body=['import {x} from ',JSON.stringify(brokenSpec),';'].join('');
  fs.writeFileSync(path.join(dir,'host','owner.mjs'),body);
  const edges=scanLiteralRelative(dir,['host/owner.mjs']);
  assert.equal(edges.length,1);
  assert.equal(edges[0].valid,false);
  assert.equal(newUnresolved(edges,spec.inherited_unresolved_lexical_edges).length,1);
  assert.equal(newUnresolved(edges,[{...edges[0],source_blob:'0'.repeat(40)}]).length,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('V10 adversary: no false success from skipped smoke, wrong owner or absent rollback',()=>{
 const good=Object.fromEntries(['P','I','O','Q','L','R'].map(x=>[x,true]));
 assert.equal(evaluateMinimalDoD(good).passed,true);
 for(const id of Object.keys(good)){
  const mutant={...good,[id]:false};
  assert.equal(evaluateMinimalDoD(mutant).passed,false,id);
  assert.equal(evaluateMinimalDoD({...good,[id]:undefined}).passed,false,id);
 }
 assert.equal(auditV10({runNative:false}).gate_results.Q,'HOLD');
});

test('V10 minimum: exhaustive six-gate deletion proof and 10k seeded mutants',()=>{
 const r=proofOfMinimum();
 assert.equal(r.subsets,64);
 assert.equal(r.unique_minimum,true);
 assert.deepEqual(r.passing_masks,[63]);
 let x=20261115>>>0,rejected=0;
 const good=Object.fromEntries(r.six_gates.map(v=>[v,true]));
 for(let i=0;i<10000;i++){
  x^=x<<13;x^=x>>>17;x^=x<<5;
  const mask=(x>>>0)%63;
  const v=Object.fromEntries(r.six_gates.map((k,j)=>[k,Boolean(mask&(1<<j))]));
  assert.equal(evaluateMinimalDoD(v).passed,false,'mutant '+i);
  rejected++;
 }
 assert.equal(rejected,10000);
 assert.equal(evaluateMinimalDoD(good).passed,true);
});

test('V10 kept source topology avoids demonstrated V9 host-import break',()=>{
 const source='host/c73-project-capsule.mjs';
 const original=path.resolve(root,path.dirname(source),'../src/host-consumption-frame.mjs');
 assert.equal(fs.existsSync(original),true);
 const moved=path.resolve(root,'src/host','../src/host-consumption-frame.mjs');
 assert.equal(fs.existsSync(moved),false);
});

test('V10 adversary: forged authority, owner pin or legacy exception cannot upgrade source health',()=>{
 assert.equal(validateSourceContract(spec),true);
 assert.equal(validateSourceContract({...spec,authority:1}),false);
 assert.equal(validateSourceContract({...spec,product_go:true}),false);
 assert.equal(validateSourceContract({...spec,baseline_tree:'f'.repeat(40)}),false);
 assert.equal(validateSourceContract({...spec,protected_owner_blobs:{...spec.protected_owner_blobs,'BOOTSTRAP.json':'a'.repeat(40)}}),true);
 // Source-contract shape alone cannot authenticate an owner: readback compares
 // every owner pin with the independently reachable baseline Git tree.
 const corrupted=JSON.parse(JSON.stringify(spec));
 corrupted.inherited_unresolved_lexical_edges[0].specifier='./new-claimed-legacy.mjs';
 assert.equal(validateSourceContract(corrupted),false);
});
