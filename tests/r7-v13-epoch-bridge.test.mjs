import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mapR7SourcePath,reopenR7SourceEpoch} from '../scripts/r7-v13-epoch-bridge.mjs';
const p=JSON.parse(fs.readFileSync(new URL('../contracts/r7-v11-seven-root-contract.json',import.meta.url)));
test('V13 mapping is explicit, preserves original snapshots and denies collision or traversal',()=>{
 assert.equal(mapR7SourcePath('project-baseline/INSTALL_EASY.md',p),'project/baseline/INSTALL_EASY.md');
 assert.equal(mapR7SourcePath('governance/v5b-baseline-inventory.json',p),'contracts/governance/v5b-baseline-inventory.json');
 assert.equal(mapR7SourcePath('host/c135-edu-v2-owner.mjs',p),'host/c135-edu-v2-owner.mjs');
 assert.equal(mapR7SourcePath('../etc/passwd',p),null);
 assert.equal(mapR7SourcePath('host/file.mjs',{...p,product_go:true}),null);
 assert.equal(mapR7SourcePath('host/file.mjs',{...p,moved_roots:{host:'src'}}), 'src/file.mjs');
});
test('V13 original SHA is reopened from historical Git, changed source stays review-required',()=>{
 const g=reopenR7SourceEpoch('governance/v5b-baseline-inventory.json');
 assert.equal(g.ok,true,JSON.stringify(g));assert.equal(g.byte_identical,true);
 assert.equal(g.status,'MOVED_OR_UNCHANGED_BYTE_EXACT');
 const b=reopenR7SourceEpoch('project-baseline/INSTALL_EASY.md');
 assert.equal(b.ok,true,JSON.stringify(b));assert.equal(b.byte_identical,false);
 assert.equal(b.status,'PROSPECTIVE_CHANGED_SOURCE_REVIEW_REQUIRED');
 assert.equal(b.product_go,false);assert.equal(b.authority,0);
 assert.equal(reopenR7SourceEpoch('project-baseline/INSTALL_EASY.md',{newPath:'project/docs/INSTALL_EASY.md'}).ok,false);
 assert.equal(reopenR7SourceEpoch('nonexistent.file').ok,false);
 assert.equal(reopenR7SourceEpoch('../../etc/shadow').ok,false);
});
