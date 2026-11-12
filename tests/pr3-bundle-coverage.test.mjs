import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('PR3 DoD-of-DoD retains original 64 and seven unique PR3 owners',()=>{
 const o=read('contracts/pr1-64-coverage.v1.json');
 const p=read('contracts/pr3-repository-contraction.v1.json');
 assert.equal(o.total,64);
 assert.equal(o.nodes.length,64);
 const ids=new Set(o.nodes.map(x=>x.id));
 assert.equal(ids.size,64);
 const seven=['R01','R02','R03','R04','R05','R09','R10'];
 assert.deepEqual(o.nodes.filter(x=>x.target_pr==='PR3').map(x=>x.id).sort(),seven);
 assert.deepEqual(p.dod.local.slice().sort(),seven);
 assert.equal(p.cut.root_count_after,15);assert.equal(p.product_go,false);
 for(const node of o.nodes){for(const d of node.dependencies)assert.ok(ids.has(d),'unknown dependency '+d);}
});
test('PR3 audited 22 historical I9/I10 gates, without treating old PASS as runtime truth',()=>{
 const c=read('contracts/pr2-previous-bundle-crosswalk.v1.json');
 assert.equal(c.native_product_go,false);
 assert.equal(c.historical_gates_not_current_proof,true);
 assert.deepEqual(c.bundles.map(x=>[x.iteration,x.gates.length]),[['I9',12],['I10',10]]);
 for(const b of c.bundles)assert.match(b.original_sha256,/^[0-9a-f]{64}$/);
 const targets=['R01','R02','R03','R04','R05','R09','R10'];
 const seen=new Map(targets.map(x=>[x,[]]));
 for(const b of c.bundles)for(const gate of b.gates){
  assert.ok(gate.id&&gate.original_status&&gate.obligationIds.length);
  for(const id of gate.obligationIds)if(seen.has(id))seen.get(id).push(b.iteration+':'+gate.id);
 }
 for(const id of ['R01','R02','R03','R04','R10'])
  assert.ok(seen.get(id).length>0,id+' historical global coverage');
 // R05 and R09 arise as atomic source-specific obligations in R1.
 // Do not invent a historical global gate which never existed in the sealed bundle.
 assert.deepEqual(seen.get('R05'),[]);
 assert.deepEqual(seen.get('R09'),[]);
});
test('PR3 cannot promote historical hold, external Render or full root minimality',()=>{
 const p=read('contracts/pr3-repository-contraction.v1.json');
 const c=read('contracts/pr2-previous-bundle-crosswalk.v1.json');
 const old=c.bundles.find(x=>x.iteration==='I9').gates.find(x=>x.id==='G4_REPOSITORY_MINIMALITY');
 assert.equal(old.original_status,'OPEN_16_ROOT_HELD');
 assert.equal(p.external_manual_render_config,'UNKNOWN_REQUIRES_OPERATOR_REVIEW');
 assert.equal(p.no_auto_delete_of_other_roots,true);
 assert.equal(p.cut.old_path_not_present,true);
 assert.equal(p.cut.content_mutation_allowed,false);
 assert.equal(p.product_go,false);
});
