import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {baseline,evaluate,NAMES,mutate,falsify} from '../scripts/r7-pr249-falsify.mjs';
const CONTRACT=new URL('../contracts/r7-pr249-founding-contract.json',import.meta.url);
test('foundation: noncompensatory 7-root target and no false authority',()=>{
 const c=JSON.parse(fs.readFileSync(CONTRACT));
 assert.equal(c.authority,0);assert.equal(c.product_go,false);
 assert.equal(c.target.directory_roots.length,7);assert.equal(c.target.root_files.length,9);
 assert.deepEqual(c.reticulum.map(x=>x.id),['P','S','L','I','O','Q','R']);
 assert.equal(c.baseline.historical_source_is_not_github_main_history,true);
 assert.match(c.mutation_design.domain,/synthetic/);
});
test('foundation: all 32 non-compensatory failure classes reject one fault',()=>{
 const x=baseline();assert.match(evaluate(x),/NOT_REALWORLD_CERTIFICATION/);
 assert.equal(NAMES.length,32);
 for(let n=0;n<NAMES.length;n++)for(let variant=0;variant<9;variant++){
  assert.equal(evaluate(mutate(x,n,variant)),NAMES[n],`class ${n} variant ${variant}`);
 }
});
test('foundation: seeded ledger reproducible, full coverage and no survivors',()=>{
 const a=falsify(10000,249202611),b=falsify(10000,249202611);
 assert.equal(a.pass,true);assert.equal(a.survivors,0);assert.equal(a.observed_families,32);
 assert.equal(a.observation_sha256,b.observation_sha256);
});
