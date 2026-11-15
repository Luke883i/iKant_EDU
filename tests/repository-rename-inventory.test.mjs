import test from 'node:test';
import assert from 'node:assert/strict';
import {classify,scanSource} from '../scripts/repository-rename-inventory.mjs';

test('S00 categories preserve original, operational and historical boundaries',()=>{
 assert.equal(classify('BOOTSTRAP.json'),'ORIGINAL_OR_ENTRY_CRITICAL');
 assert.equal(classify('host/c72-public-mode-admission.mjs'),'ORIGINAL_OR_ENTRY_CRITICAL');
 assert.equal(classify('scripts/build-project-oneshell-prompt.mjs'),'ACTIVE_CODE_REVIEW');
 assert.equal(classify('tests/project-first-contact.test.mjs'),'TEST_REGRESSION');
 assert.equal(classify('docs/archive/prepr/legacy.md'),'HISTORICAL_PRESERVE');
 assert.equal(classify('random-other-file.txt'),'UNCLASSIFIED_REVIEW');
});
test('S00 scans tracked Git files and cannot promote local census to administrative GO',()=>{
 const x=scanSource();
 assert.match(x.source_head,/^[a-f0-9]{40}$/);
 assert.match(x.source_tree,/^[a-f0-9]{40}$/);
 assert.ok(x.tracked_paths>1000);
 assert.ok(x.matching_files>0);
 const matched=new Set(x.rows.map(z=>z.path));
 for(const p of ['BOOTSTRAP.json','ADMISSION.json','src/first-contact.mjs',
  'host/c72-public-mode-admission.mjs','scripts/build-project-oneshell-prompt.mjs'])
  assert.ok(matched.has(p),'missing '+p);
 assert.equal(x.status,'NOT_READY_FOR_RENAME');
 assert.equal(x.external_action_callers,'UNKNOWN_REQUIRES_EXTERNAL_OWNER_EVIDENCE');
 assert.equal(x.rename_performed,false);
 assert.equal(x.active,false);
});
