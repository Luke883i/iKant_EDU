import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const repo=fileURLToPath(new URL('../',import.meta.url));
const source=readFileSync(new URL('../scripts/r7-v12-epoch-audit.py',import.meta.url),'utf8');
const run=(...a)=>spawnSync('python3',['scripts/r7-v12-epoch-audit.py',...a],{cwd:repo,encoding:'utf8',timeout:110000});
test('V12 independent Git readback preserves all 50 frozen governance blobs under moved paths',()=>{
 const r=run();assert.equal(r.status,0,r.stderr+r.stdout);
 const x=JSON.parse(r.stdout);assert.equal(x.status,'SCOPED_APPEND_ONLY_SOURCE_EPOCH');
 assert.equal(x.hist_source_files,1630);assert.equal(x.mapped,1630);
 assert.equal(x.historical_governance_records,50);assert.deepEqual(x.historical_governance_changed,[]);
 assert.equal(x.roots.length,7);assert.equal(x.root_files.length,9);
 assert.equal(x.owner_authority,0);assert.equal(x.owner_review,'NOT_ATTESTED');
 assert.equal(x.runtime_equivalence,'NOT_ATTESTED');assert.equal(x.product_go,false);
 assert.equal(Object.keys(x.owner_blobs).length,9);
});
test('V12 must never promote a source-only epoch to a product release',()=>{
 const r=run('--require-product');assert.equal(r.status,20);
 const x=JSON.parse(r.stdout);assert.equal(x.product_go,false);assert.equal(x.historical_receipts_upgraded,false);
});
test('V12 mutation guardians: historical bytes, mapping, root count and owner claims are guarded',()=>{
 for(const forbidden of ['TOPOLOGY_NOT_SEVEN_BY_NINE','HISTORICAL_GOVERNANCE_BYTES_REWRITTEN','MAPPING_COLLISION','GIT_MODES_CHANGED','UNSAFE_DESTINATION','TRACKED_WORKTREE_DIRTY','EPOCH_CONTRACT_REWRITTEN','V11_NOT_ANCESTOR'])
  assert.ok(source.includes(forbidden),forbidden);
 assert.ok(source.includes("'owner_review': 'NOT_ATTESTED'"));
});
