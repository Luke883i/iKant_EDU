import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const x=JSON.parse(readFileSync(new URL('../contracts/s02-s09-semantic-dag.json',import.meta.url),'utf8'));
test('S01-S09 graph is acyclic and canonical is independent of EDU trial gate',()=>{
 const seen=new Set(),visiting=new Set();function visit(n){assert.ok(x.nodes[n],'missing node '+n);if(seen.has(n))return;
 assert.equal(visiting.has(n),false,'cycle');visiting.add(n);for(const v of x.nodes[n].depends)visit(v);visiting.delete(n);seen.add(n);}
 for(const n of Object.keys(x.nodes))visit(n);
 assert.equal(seen.size,10);assert.ok(!x.nodes.S09_CANONICAL.depends.includes('S05'));
 assert.equal(x.nodes.S02.status,'MERGED_MAIN_LOCAL_V2_OWNER_30_TURN_TESTED_NOT_PROVIDER');
 assert.equal(x.nodes.S02.local_verified,true);
 assert.deepEqual(x.nodes.S02.remaining,['INDEPENDENT_CHATGPT_PROVIDER_DELIVERY','S05_30_REAL_HUMAN_TRIALS']);assert.equal(x.nodes.S08.status,'CANONICAL_NOT_ACTIVE');
});
