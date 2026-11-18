import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
import {validateDod,deriveHypergraph,exactBoundedCut,assessHistoricalRetirements,buildTotalSupergraph,deriveProductSolution,observe,scoreMultiLevelContraction} from '../scripts/pr251-forensic-hypergraph.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const c=JSON.parse(fs.readFileSync(path.join(root,'contracts/pr251-forensic-hypergraph-dod.json')));
test('PR251 retrograde 35 DoD nodes, 10 typed AND gates, no authority',()=>{
 assert.equal(validateDod(c),true);
 const graph=deriveHypergraph(c,{checked_files:2,consumer_index:[
  {path:'a',literal_dependencies:['b']},{path:'b',literal_dependencies:[]}]});
 assert.equal(graph.nodes.length,35);assert.equal(graph.hyperedges.length,10);
 assert.equal(graph.edges.length,1);assert.equal(graph.product_go,false);
});
test('2048 deterministic negative mutations reject DoD omission and forged authority',()=>{
 let seed=251;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)%4);
 for(let i=0;i<2048;i++){
  const m=structuredClone(c);
  switch(rng()){
   case 0:m.product_go=true;break;
   case 1:m.release='PASS';break;
   case 2:m.leaves.pop();break;
   case 3:m.gates[0][2].push(m.gates[0][2][0]);break;
  }
  assert.equal(validateDod(m),false,'surviving mutation '+i);
 }
});
test('bounded mincut enumerates all 8 subsets, blocks live consumer and keeps a survivor',()=>{
 const graph={edges:[{from:'a',to:'b'},{from:'root',to:'c'}],roots:['root'],
  sizes:{a:11,b:7,c:13}};
 const result=exactBoundedCut(graph,['a','b','c'],[['a','b']]);
 assert.equal(result.enumerated,8);assert.deepEqual(result.selected,['a']);
 assert.equal(result.bounded_static_bytes,11);assert.equal(result.global_minimum_certified,false);
 const locked=exactBoundedCut({...graph,locked_paths:['a','b','c']},['a','b','c']);
 assert.deepEqual(locked.selected,[]);assert.equal(locked.bounded_static_bytes,0);
 assert.throws(()=>exactBoundedCut(graph,Array.from({length:17},(_,i)=>'n'+i)),/BOUND_16/);
});
test('original V5-B/CORA source witness remains source-only; PR251 exact epoch is required',()=>{
 const r=observe();
 assert.equal(r.exact_source_epoch,true,JSON.stringify(r));
 assert.equal(r.retired_paths,25);assert.equal(r.obligations,35);
 assert.equal(r.head,execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim());
 assert.equal(r.tree,execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim());
 assert.equal(r.global_dod,'HOLD');assert.equal(r.product_go,false);
 assert.equal(r.external_consumers,'UNKNOWN');
});

test('V10 historical archive is NOT a runtime file floor; missing retirement proofs stay blocked',()=>{
 const now=observe();
 assert.equal(now.source_retirement.historical_paths,1630);
 assert.equal(now.source_retirement.missing.length,25);
 assert.ok(now.source_retirement.missing.every(r=>r.preimage_proof==='GIT_OBJECT_PIN_VERIFIED'));
 assert.ok(now.source_retirement.missing.every(r=>r.status==='EVIDENCE_BLOCKED'||r.status==='KNOWN_CONSUMER_BLOCKED'));
 assert.equal(new Set(now.source_retirement.missing.map(r=>r.preimage_sha)).size,25);
 assert.equal(now.source_retirement.legacy_v12,'REFUTED');
 assert.equal(now.source_retirement.proof_blocked,true);
 assert.equal(now.source_retirement.behavioral_equivalence,'NOT_ATTESTED');
 assert.equal(now.product_go,false);
 const probe=assessHistoricalRetirements(c,{consumer_index:[]},['scripts/c1-combine.mjs']);
 assert.throws(()=>assessHistoricalRetirements(c,{consumer_index:[]},['scripts/c1-run.mjs']),/UNREGISTERED_HISTORIC_RETIREMENT/);
 assert.equal(probe.retirement_candidates.length,1);
 assert.equal(probe.retirement_candidates[0].preimage_proof,'GIT_OBJECT_PIN_VERIFIED');
 assert.ok(['EVIDENCE_BLOCKED','KNOWN_CONSUMER_BLOCKED'].includes(probe.retirement_candidates[0].status));
 assert.ok(probe.retirement_candidates[0].proof_obligations.includes('same_head_native_regression'));
 assert.equal(probe.historic_source_is_not_runtime_minimum,true);
});


test('complete typed source census hashes every blob and does not promote unknown consumers',()=>{
 const r=buildTotalSupergraph({consumer_index:[{path:'src/a.mjs',literal_dependencies:['src/b.mjs']}]},{
  treeText:'100644 blob '+gitBlob('import "./b.mjs";')+'       17\tsrc/a.mjs\0'
   +'100644 blob '+gitBlob('export const b=1;')+' 17\tsrc/b.mjs\0',
  read:p=>Buffer.from(p==='src/a.mjs'?'import "./b.mjs";':'export const b=1;')
 });
 assert.equal(r.files,2);assert.equal(r.git_sha_errors,0);
 assert.equal(r.relation_count,2);assert.equal(r.product_go,false);
 assert.deepEqual(new Set(r.relations.map(x=>x.type)),new Set(['STATIC_IMPORT','SOURCE_LITERAL']));
 assert.equal(r.global_minimum_certified,false);
 assert.equal(r.semantic_inventory.length,2);
});
function gitBlob(text){
 const b=Buffer.from(text);
 return crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
}


test('backward product slice is distinct from assurance and an archive hypothesis is not release',()=>{
 const files=[
  {path:'ikant.mjs',bytes:20,dynamic_site:false},
  {path:'src/needed.mjs',bytes:80,dynamic_site:true},
  {path:'tests/qualification.test.mjs',bytes:14,dynamic_site:false},
  {path:'project/docs/old.md',bytes:120,dynamic_site:false}];
 const a=deriveProductSolution(files,[{from:'ikant.mjs',to:'src/needed.mjs',type:'STATIC_IMPORT'}]);
 assert.deepEqual(a.product_observed_closure,{files:2,bytes:100});
 assert.deepEqual(a.verification_observed_closure,{files:1,bytes:14});
 assert.equal(a.outside_observed_closure.files,1);
 assert.equal(a.documentary_retirement_hypothesis.bytes,120);
 assert.equal(a.dynamic_paths_inside_observed_closure,1);
 assert.equal(a.full_consumer_closure,false);
 assert.equal(a.product_go,false);
});

test('physical atlas counterexample becomes typed assurance dependency without laundering it into runtime',()=>{
 const r=observe({deep:true}),g=r.total_source_supergraph,
  // Avoid the source graph's TEST_LITERAL observer effect: construct the exact
  // path without creating a new lexical reference that would reclassify Q.
  doc=['project','docs','BOOTSTRAP_DECOUPLING_D0.md'].join('/'),
  solution=g.product_first_solution;
 assert.equal(g.relations.filter(e=>e.from==='scripts/ikant-document-atlas.mjs'&&
  e.to===doc&&e.type==='GENERATED_ATLAS_MEMBERSHIP').length,1);
 assert.ok(solution.outside_paths.some(x=>x.path===doc));
 assert.ok(solution.generated_document_assurance_closure.new_files>0);
 assert.ok(solution.generated_document_assurance_closure.files>solution.combined_observed_closure.files);
 assert.equal(solution.generated_document_assurance_closure.not_runtime_equivalence,true);
 assert.equal(g.external_consumers,'UNKNOWN');
 assert.equal(g.product_go,false);
});

test('PR252 all-level metric rejects offsetting assurance growth and fake radical contraction',()=>{
 const pre={files:1645,bytes:9500000,executedSourceBytes:19786};
 const candidate={files:1628,bytes:9480000,executedSourceBytes:9820};
 const evidence={lineage_valid:true,original_native:true,zero_write_denials:true,
  ledger_owner_trace:true,duplicate_policy_before:2,duplicate_policy_after:1,
  duplicate_inspector_before:2,duplicate_inspector_after:1,counterfactual_replayed:true};
 const good=scoreMultiLevelContraction(pre,candidate,evidence);
 assert.equal(good.physical.pass,true);assert.equal(good.implementation.pass,true);
 assert.equal(good.architecture.owner_candidate,true);
 assert.equal(good.source_candidate,true);assert.equal(good.global_dod,'HOLD');
 assert.equal(good.product_go,false);assert.equal(good.architecture.external_consumers,'UNKNOWN');
 const mutations=[
  [{...candidate,bytes:9500001},evidence],
  [{...candidate,files:1645},evidence],
  [{...candidate,executedSourceBytes:10000},evidence],
  [candidate,{...evidence,duplicate_inspector_after:2}],
  [candidate,{...evidence,original_native:false}],
  [candidate,{...evidence,counterfactual_replayed:false}],
  [candidate,{...evidence,zero_write_denials:false}],
  [candidate,{...evidence,lineage_valid:false}]
 ];
 for(const [a,b] of mutations)assert.equal(scoreMultiLevelContraction(pre,a,b).source_candidate,false);
 let seed=252;for(let n=0;n<8192;n++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const a={...candidate},b={...evidence};
  switch(seed%6){
   case 0:a.files=1645;break;case 1:a.bytes=9500000;break;
   case 2:a.executedSourceBytes=10001;break;case 3:b.duplicate_policy_after=2;break;
   case 4:b.zero_write_denials=false;break;case 5:b.ledger_owner_trace=false;break;
  }
  assert.equal(scoreMultiLevelContraction(pre,a,b).source_candidate,false,'seeded mutant '+n);
 }
 assert.throws(()=>scoreMultiLevelContraction({...pre,bytes:-1},candidate),/BAD_TREE_METRICS/);
});

test('PR252 JSON-value cuts preserve original main data, but not byte identity or runtime certification',()=>{
 const base='e270c6e2cc772f960126eecea9f50501339e3656';
 const files=["pr1-64-coverage.v1.json","session-local-capability-lattice.json","cohost-context-root.json","project-edu-h1-irreducible.json","project-host-tool-grounding-abi.json","bootstrap-composition-space.json","pr2-previous-bundle-crosswalk.v1.json","repository-rename-2dim.json","local-session-fastboot.json"];
 let bytesSaved=0;
 for(const name of files){
  const p='contracts/'+name;
  const pre=execFileSync('git',['show',base+':'+p],{cwd:root});
  const post=fs.readFileSync(path.join(root,p));
  const original=JSON.parse(pre),candidate=JSON.parse(post);
  assert.deepStrictEqual(candidate,original,'JSON_VALUE_DRIFT:'+p);
  assert.ok(post.length<pre.length,'NOT_A_COMPACTION:'+p);
  const wrong=structuredClone(candidate),first=Object.keys(wrong)[0];
  assert.ok(first,'EMPTY_MUTANT:'+p);delete wrong[first];
  assert.notDeepStrictEqual(wrong,original,'FALSE_NEGATIVE_MUTANT:'+p);
  bytesSaved+=pre.length-post.length;
 }
 assert.ok(bytesSaved>=24000,'PHYSICAL_SAVING_TOO_SMALL');
});
