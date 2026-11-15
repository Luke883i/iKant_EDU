import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {chooseP0P1Contracts} from '../scripts/p0p1-select-contracts.mjs';
test('100 candidate contracts are preserved and 4 minimal roots selected with unchanged owners',()=>{
 const c=chooseP0P1Contracts();
 assert.equal(c.candidate_count,100);assert.equal(c.minimal_selected_count,4);
 assert.deepEqual(c.selected.map(x=>x.id),['K015','K045','K075','K094']);
 assert.equal(c.native_ui_attested,false);assert.equal(c.selection_is_empirical,false);
 assert.deepEqual(c,JSON.parse(readFileSync(new URL('../contracts/p0p1-100-selection.json',import.meta.url))));
});
