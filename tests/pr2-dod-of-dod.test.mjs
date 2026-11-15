import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>JSON.parse(readFileSync(new URL('../'+x,import.meta.url)));
const original=read('contracts/pr1-64-coverage.v1.json');
const pr2=read('contracts/pr2-runtime-dod-of-dod.v1.json');
const expected=['P03','P04','P05','P06','P07','P08','M03','M04','M05','M06','M07','M08','T01','T02','T03','T04','T06','T08','T09'];
test('PR2 DoD of DoD: full denominator and 19 delegated owners without synthetic closure',()=>{
 assert.equal(original.nodes.length,64);
 assert.equal(new Set(original.nodes.map(n=>n.id)).size,64);
 assert.equal(pr2.original_64_count,64);assert.equal(pr2.threshold_99_percent,64);
 assert.equal(pr2.pr2_19_count,19);assert.equal(pr2.rules.length,19);
 assert.deepEqual(pr2.rules.map(r=>r.id).sort(),expected.sort());
 const counts={};for(const x of original.nodes)counts[x.target_pr]=(counts[x.target_pr]||0)+1;
 assert.deepEqual(counts,{SETUP:5,PR1:12,PR5:17,PR2:19,PR3:7,PR4:4});
 const seen=new Set();
 for(const r of pr2.rules){
  assert.equal(original.nodes.find(x=>x.id===r.id)?.target_pr,'PR2');
  assert.equal(r.declaredPass,false);assert.equal(r.proofStatus,'OPEN_UNTIL_EXECUTED');
  assert.ok(r.path&&r.predicate&&r.requiredTier&&r.falsifier);
  assert.equal(seen.has(r.id),false);seen.add(r.id);
 }
 assert.equal(pr2.product_go,false);assert.equal(pr2.native_provider_attested,false);
 assert.equal(pr2.noncompensatory,true);assert.equal(pr2.unknown_never_pass,true);
});
test('PR2 DoD of DoD: dependency lattice is acyclic and connected only to known IDs',()=>{
 const index=new Map(original.nodes.map(x=>[x.id,x]));
 const visiting=new Set(),visited=new Set();
 function visit(id){if(visited.has(id))return;assert.ok(index.has(id));assert.equal(visiting.has(id),false,'cycle '+id);
  visiting.add(id);for(const dep of index.get(id).dependencies)visit(dep);
  visiting.delete(id);visited.add(id);}
 for(const x of index.keys())visit(x);assert.equal(visited.size,64);
});
test('PR2 DoD of DoD: false gap closure / omitted paths are never accepted',()=>{
 const good=JSON.parse(JSON.stringify(pr2));
 const permitted=x=>x.rules.length===19&&x.product_go===false&&x.native_provider_attested===false&&
 x.rules.every(r=>r.declaredPass===false&&r.proofStatus==='OPEN_UNTIL_EXECUTED'&&r.path&&r.falsifier);
 assert.equal(permitted(good),true);
 for(const mutation of [
  x=>{x.rules.pop();},x=>{x.product_go=true;},x=>{x.native_provider_attested=true;},
  x=>{x.rules[0].declaredPass=true;},x=>{x.rules[0].proofStatus='PASS';},x=>{x.rules[0].path='';},
  x=>{x.rules[0].falsifier='';}
 ]){const copy=JSON.parse(JSON.stringify(good));mutation(copy);assert.equal(permitted(copy),false);}
});
