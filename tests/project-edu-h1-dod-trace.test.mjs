import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dod=JSON.parse(fs.readFileSync(new URL('../contracts/project-edu-h1-v5-dod-trace.json',import.meta.url),'utf8'));
const contract=JSON.parse(fs.readFileSync(new URL('../contracts/project-edu-h1-irreducible.json',import.meta.url),'utf8'));
test('Gold V5 56 nodes retained without dangling or cyclic DoD',()=>{
 const nodes=dod.nodes,by=new Map(nodes.map(x=>[x.id,x]));
 assert.equal(nodes.length,56);assert.equal(by.size,56);
 assert.equal(nodes.filter(x=>x.level==='LOCAL').length,34);
 assert.equal(nodes.filter(x=>x.level==='INTERMEDIATE').length,14);
 assert.equal(nodes.filter(x=>x.level==='GLOBAL').length,8);
 const visited=new Set(),active=new Set();
 function check(id){
  assert.ok(by.has(id),'missing '+id);
  assert.ok(!active.has(id),'cycle '+id);
  if(visited.has(id))return;
  active.add(id);
  const x=by.get(id);assert.equal(x.authority,0);
  for(const dep of x.depends_on)check(dep);
  active.delete(id);visited.add(id);
 }
 for(const id of by.keys())check(id);
 assert.equal(visited.size,56);
});
test('all Gold 40 problems mapped, no flags can certify field product',()=>{
 const rows=contract.historical_40_obligations;
 assert.equal(rows.length,40);
 assert.equal(new Set(rows.map(x=>x.id)).size,40);
 assert.equal(dod.counts.proven_field,0);
 assert.ok(dod.nodes.every(x=>x.status==='NOT_FIELD_ATTESTED'));
 assert.equal(dod.no_auto_promotion,true);
 assert.equal(contract.no_new_c72_issuer,true);
 assert.equal(contract.no_new_c87_writer,true);
 assert.equal(contract.normative_coverage_only_not_problem_resolution,true);
});
