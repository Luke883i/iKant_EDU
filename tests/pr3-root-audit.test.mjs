import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectPr3Cut} from '../scripts/pr3-root-audit.mjs';
const read=x=>JSON.parse(readFileSync(new URL('../'+x,import.meta.url),'utf8'));
test('PR3 inherits 64 canonical obligations and exactly seven allocated leaves',()=>{
 const a=read('contracts/pr1-64-coverage.v1.json'),b=read('contracts/pr2-runtime-dod-of-dod.v1.json'),c=read('contracts/pr3-repository-contraction.v1.json');
 const seven=['R01','R02','R03','R04','R05','R09','R10'];
 assert.equal(a.nodes.length,64);assert.equal(b.rules.length,19);
 assert.deepEqual(a.nodes.filter(x=>x.target_pr==='PR3').map(x=>x.id).sort(),seven);
 assert.deepEqual(c.dod.local,seven);assert.equal(c.product_go,false);
 assert.equal(c.source_root_count,16);assert.equal(c.cut.root_count_after,15);
 assert.equal(c.external_manual_render_config,'UNKNOWN_REQUIRES_OPERATOR_REVIEW');
});
test('PR3 exact Git tracked root contraction, no source shadow alias',()=>{
 const r=inspectPr3Cut();
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.before_root_count,16);assert.equal(r.after_root_count,15);assert.equal(r.root_delta,-1);
 assert.equal(r.product_go,false);assert.equal(r.live_old_root_consumers.length,0);
});
test('PR3 historical source decision is preserved and false archive preimage rejected',()=>{
 const current=read('contracts/pr3-repository-contraction.v1.json');
 const wrong=structuredClone(current);wrong.cut.git_blob_sha1='0'.repeat(40);
 assert.equal(inspectPr3Cut(wrong).ok,false);
 const promoted=structuredClone(current);promoted.product_go=true;
 assert.equal(inspectPr3Cut(promoted).ok,false);
 const assumed=structuredClone(current);assumed.external_manual_render_config='PASS';
 assert.equal(inspectPr3Cut(assumed).ok,false);
 const missing=structuredClone(current);missing.consumer_assessment.pop();
 assert.equal(inspectPr3Cut(missing).ok,false);
});
test('PR3 original owner pins and historical source still traceable',()=>{
 const r=inspectPr3Cut();
 assert.equal(r.changed_owner_pins,0);assert.equal(r.historical_builder_source_only,true);
 assert.equal(r.manual_provider_configuration,'UNKNOWN');
});
