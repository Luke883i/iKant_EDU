import test from 'node:test';
import assert from 'node:assert/strict';
import {selectPhysicalCandidates} from '../scripts/pr251-physical-ddmin.mjs';
const HEAD='a'.repeat(40),TREE='b'.repeat(40);
const rows=[
 {path:'project/docs/Z_DOC.md',sha:'c'.repeat(40),bytes:81,mode:'100644'},
 {path:'project/docs/A_DOC.md',sha:'d'.repeat(40),bytes:92,mode:'100644'},
 {path:'project/docs/archive/X.md',sha:'e'.repeat(40),bytes:22,mode:'100644'},
 {path:'scripts/extra.mjs',sha:'f'.repeat(40),bytes:100,mode:'100644'}
];
const atlas=[
 '- [project/docs/A_DOC.md](A_DOC.md): document.',
 '- [project/docs/Z_DOC.md](Z_DOC.md): document.',
 '- [project/docs/archive/X.md](archive/X.md): historic.'
].join('\n');
const graph=()=>({head:HEAD,tree:TREE,exact_source_epoch:true,product_go:false,
 total_source_supergraph:{product_go:false,external_consumers:'UNKNOWN',
   product_first_solution:{outside_paths:structuredClone(rows)}}});
test('selection captures original generated-atlas semantic consumer absent from lexical P/Q',()=>{
 const x=selectPhysicalCandidates(graph(),atlas);
 assert.equal(x.edge,'GENERATED_MARKDOWN_MEMBERSHIP_NOT_STATIC_IMPORT');
 assert.deepEqual(x.candidates.map(y=>y.path),['project/docs/A_DOC.md','project/docs/Z_DOC.md']);
 assert.equal(x.consumer_proof_level,'HYPOTHESIS_UNTIL_NATIVE_EXECUTION');
 assert.equal(x.product_go,false);
});
test('independent source graph cannot promote external, product-go or stale source epochs',()=>{
 for(const mutation of [
  g=>g.total_source_supergraph.external_consumers='CLOSED',
  g=>g.product_go=true,
  g=>g.exact_source_epoch=false,
  g=>g.head='FORGED',
  g=>g.total_source_supergraph.product_go=true
 ]){
  const g=graph();mutation(g);
  assert.throws(()=>selectPhysicalCandidates(g,atlas),/PR251_PHYSICAL_UNTRUSTED_SCOPE/);
 }
});
test('duplicate source paths, unsafe path and invalid original Git SHA are rejected',()=>{
 for(const mutation of [
  g=>g.total_source_supergraph.product_first_solution.outside_paths[0].path='../escape.md',
  g=>g.total_source_supergraph.product_first_solution.outside_paths[1].path='project/docs/Z_DOC.md',
  g=>g.total_source_supergraph.product_first_solution.outside_paths[0].sha='0',
  g=>g.total_source_supergraph.product_first_solution.outside_paths[0].bytes=-1
 ]){
  const g=graph();mutation(g);
  assert.throws(()=>selectPhysicalCandidates(g,atlas),/PR251_PHYSICAL_INVALID_OUTSIDE_ROW/);
 }
});
test('unlisted markdown cannot become an invented original atlas consumer',()=>{
 assert.throws(()=>selectPhysicalCandidates(graph(),'Atlas has no relevant literal links'),
  /PR251_PHYSICAL_INSUFFICIENT_ATLAS_COUNTEREXAMPLES/);
});
test('selected pair is deterministic under source graph input order mutation',()=>{
 const g=graph();g.total_source_supergraph.product_first_solution.outside_paths.reverse();
 assert.deepEqual(selectPhysicalCandidates(g,atlas).candidates,
  selectPhysicalCandidates(graph(),atlas).candidates);
});
