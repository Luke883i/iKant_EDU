import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('PR2: 22 global gates from sealed I9/I10 mapped to original atomic 64 without manufacturing PASS',()=>{
 const original=read('contracts/pr1-64-coverage.v1.json');
 const cross=read('contracts/pr2-previous-bundle-crosswalk.v1.json');
 const pr2=read('contracts/pr2-runtime-dod-of-dod.v1.json');
 const ids=new Set(original.nodes.map(n=>n.id));
 assert.equal(ids.size,64);assert.equal(cross.bundles.length,2);
 assert.deepEqual(cross.bundles.map(b=>b.gates.length),[12,10]);
 assert.equal(cross.native_product_go,false);assert.equal(cross.historical_gates_not_current_proof,true);
 const before=new Set();
 for(const b of cross.bundles){
  assert.match(b.original_sha256,/^[0-9a-f]{64}$/);
  for(const g of b.gates){
   assert.equal(before.has(b.iteration+g.id),false);before.add(b.iteration+g.id);
   assert.ok(g.original_status&&g.obligationIds.length>0);
   for(const id of g.obligationIds)assert.ok(ids.has(id),id);
  }
 }
 assert.equal(before.size,22);
 assert.deepEqual(pr2.rules.map(x=>x.id).sort(),original.nodes.filter(x=>x.target_pr==='PR2').map(x=>x.id).sort());
 assert.equal(cross.bundles[1].gates.find(g=>g.id==='G5_MCP_HTTP').original_status,'BLOCKED_SDK_UNINSTALLED');
});
