import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const C=JSON.parse(fs.readFileSync(new URL('../contracts/mcp-external-prepr-e2e.json',import.meta.url),'utf8'));
test('global 3-surface ontology is distinct, no third bootstrap mode',()=>{
 assert.deepEqual(C.session_chat_mode_choices,['EDU','CANONICAL']);
 assert.equal(C.independent_third_surface,'MCP_EXTERNAL');
 assert.equal(C.mcp_is_bootstrap_mode,false);assert.equal(C.eduv2_requires_mcp,false);
 assert.equal(C.canonical_native_activation_from_mcp,false);
 assert.equal(C.product_release,'PRODUCT_NO_GO');
 assert.equal(C.dod.length,17);
 assert.equal(new Set(C.dod.map(x=>x.id)).size,C.dod.length);
});
test('intermediate 1000 finite alternatives, reproducible score never attests semantic truth',()=>{
 const r=spawnSync(process.execPath,['scripts/mcp-prepr-qualify.mjs'],{cwd:new URL('..',import.meta.url).pathname,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);const x=JSON.parse(r.stdout);
 assert.equal(x.source_head,C.source_epoch.target_head);assert.equal(x.source_tree,C.source_epoch.target_tree);
 assert.equal(x.original_design_head,C.source_epoch.base_head);
 assert.notEqual(x.source_head,x.original_design_head);
 assert.equal(x.candidate_count,1000);assert.equal(x.feasible_count,4);
 assert.equal(x.selected,'A4-B4-P4-D7');assert.equal(x.score_is_empirical,false);
 assert.equal(x.canonical_active,false);assert.equal(x.product,'PRODUCT_NO_GO');
 assert.equal(x.external_open.length,6);
});
