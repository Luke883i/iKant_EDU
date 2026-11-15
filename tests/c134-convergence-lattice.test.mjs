import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../contracts/c134-convergence-lattice.json',import.meta.url),'utf8'));
test('reticolo: tasks, owners, measurable criteria and bounded dependencies',()=>{
 assert.equal(data.schema,'ikant-c134-convergence-lattice/v1');assert.equal(data.authority,0);
 const all=new Map();for(const node of data.nodes){
  assert.ok(!all.has(node.id));assert.ok(node.owner&&node.measurement);
  assert.ok(node.checklist.length>=3);
  for(const dep of node.requires)assert.ok(all.has(dep),'forward/unresolved dependency '+dep);
  all.set(node.id,node);
 }
 assert.equal(data.nodes.length,8);
 assert.ok(!all.get('C136_CANONICAL_FALLBACK').requires.includes('C135_EDU'));
 assert.deepEqual(all.get('C138_EDU_RELEASE').requires,['C135_EDU','C137_LLM_EFFICACY']);
 assert.deepEqual(all.get('C138_CANONICAL_RELEASE').requires,['C136_CANONICAL_FALLBACK','C137_LLM_EFFICACY']);
 assert.ok(data.never_infer.includes('CI_PASS_EQUALS_REASONING_GAIN'));
});
