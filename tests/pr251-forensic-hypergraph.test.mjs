import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateDod,deriveHypergraph,exactBoundedCut,historicRetentionCut,observe} from '../scripts/pr251-forensic-hypergraph.mjs';
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
 assert.equal(r.global_dod,'HOLD');assert.equal(r.product_go,false);
 assert.equal(r.external_consumers,'UNKNOWN');
});

test('supergraph hard-retention edge refuses any current deletion of original V10 sources',()=>{
 const audit={consumer_index:[{path:'a'},{path:'b'}]};
 // Synthetic paths do not map against a fabricated policy; real Git V10 is the oracle.
 const current=observe();
 assert.equal(current.source_lock.required,1630);
 assert.equal(current.source_lock.under_original_contract_minimum_files,1630);
 assert.equal(current.source_lock.blocked,true);
 assert.equal(current.source_lock.live_absent.length,25);
 assert.equal(current.product_go,false);
});
