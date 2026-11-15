import test from 'node:test';
import assert from 'node:assert/strict';
import {censusGold} from '../scripts/v1-gold-census.mjs';
test('census every Git blob without confusing history and product authority',()=>{
 const r=censusGold();
 assert.equal(r.schema,'ikant-le-v1-gold-census/v1');
 assert.ok(r.tracked_files>=940);
 assert.ok(r.curated_gold>=35);
 assert.equal(r.curated_gold+r.unreviewed_files,r.tracked_files);
 assert.equal(new Set(r.members.map(x=>x.path)).size,r.tracked_files);
 const expected=['README.md','AGENTS.md','TERMS.md','src/runtime-root-verified.mjs',
  'host/c114-ontology-language-policy.mjs','host/edu-c129-manual-entry.mjs','release/catalog.json'];
 for(const path of expected)assert.equal(r.members.find(x=>x.path===path)?.reviewed_for_value,true);
 const guard=r.members.find(x=>x.path==='host/c114-ontology-language-policy.mjs');
 assert.equal(guard.disposition,'EVOLVE_PINNED_SOURCE');
 assert.equal(r.claim,'GIT_FILE_CENSUS_NOT_INDEPENDENT_SEMANTIC_VALUE_REVIEW');
});
