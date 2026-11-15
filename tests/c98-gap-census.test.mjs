import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=JSON.parse(readFileSync(new URL('../contracts/c98-post-pr101-evidence.json',import.meta.url)));
const mapping=JSON.parse(readFileSync(new URL('../contracts/c98-gap-to-owner-map.json',import.meta.url)));
test('14 host edges each mapped exactly once to a reusable existing owner',()=>{
 assert.deepEqual(mapping.gaps.map(x=>x.edge),source.host_or_externally_open_edges);
 assert.equal(mapping.gaps.length,14);
 assert.equal(new Set(mapping.gaps.map(x=>x.edge)).size,14);
 assert.equal(mapping.host_attested_closed_gaps.length,0);
 assert.equal(mapping.field_H95_attested,false);
 assert.ok(mapping.gaps.every(x=>x.reuse&&x.proof));
});
