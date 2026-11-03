import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {evaluate2DimRename,falsify2Dim,preflightReadOnly} from '../scripts/repository-rename-2dim.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const c=JSON.parse(fs.readFileSync(path.join(root,'contracts/repository-rename-2dim.json'),'utf8'));
test('2DIM original authority: graph closed and no implicit admin operation',()=>{
 assert.equal(c.schema,'ikant-edu-2dim-repository-rename/v1');
 assert.equal(c.repo_id,1371330383);
 assert.equal(c.automatic_rename_forbidden,true);
 assert.equal(c.owner_effects_forbidden,true);
 assert.equal(c.original_receipt_transfer,false);
 assert.equal(c.global.status,'OPEN_REQUIRED_HUMAN_ADMIN_ACTION');
 const mid=new Set(c.intermediate.map(x=>x.id)),local=new Set(c.local.map(x=>x.id));
 assert.equal(mid.size,6);assert.equal(local.size,26);
 assert.deepEqual(new Set(c.global.requires),mid);
 assert.deepEqual(new Set(c.intermediate.flatMap(x=>x.requires)),local);
 assert.equal(c.strategy_comparison.filter(x=>x.eligible).length,1);
});
test('2DIM 25 realistic negative families x400 and 1000 synthetic good controls',()=>{
 const a=falsify2Dim(),b=falsify2Dim();
 assert.deepEqual(a,b,'seeded readback must be byte identical');
 assert.equal(a.negatives,10000);assert.equal(a.rejected,10000);
 assert.equal(a.positive_controls,1000);assert.equal(a.positive_controls_passed,1000);
 assert.equal(a.per_family_rejected.length,25);
 assert.ok(a.per_family_rejected.every(x=>x===400));
 assert.equal(a.provider_rename_performed,false);
 assert.equal(a.original_owner_invoked,false);
 assert.equal(a.independent_external_consumers_verified,false);
});
test('2DIM rejects alias-only and source-id claims without GitHub identity',()=>{
 const r=evaluate2DimRename({phase:'CUTOVER',dry_run:true,repository_id:1371330383,
  full_name:'Luke883i/iKant_EDU',head:'a'.repeat(40),tree:'b'.repeat(40),
  pinned_head:'a'.repeat(40),pinned_tree:'b'.repeat(40),
  repository_id_from_github_api:true,unique_canonical_name:true});
 assert.equal(r.ok,false);
 assert.equal(r.edge,'2DIM_CANONICAL_IDENTITY_MISMATCH');
 assert.equal(r.rename_performed,false);
 assert.equal(evaluate2DimRename({phase:'CUTOVER',dry_run:true,repository_id:1371330383}).edge,
 '2DIM_REPOSITORY_ID_NOT_VERIFIED');
});
test('2DIM read-only preflight cannot declare ADMIN READY from old repo',()=>{
 const r=preflightReadOnly();
 assert.equal(r.status,'NOT_READY_FOR_RENAME');
 assert.equal(r.precommit_only,true);
 assert.equal(r.native_owner_receipts_attested,false);
 assert.equal(r.administrator_rename_executed,false);
 assert.equal(r.local_contract_pins.bootstrap,'Luke883i/iKant_LE');
 assert.equal(r.local_contract_pins.admission,'Luke883i/iKant_LE');
 assert.equal(r.local_contract_pins.catalog,'Luke883i/iKant_LE');
 assert.ok(r.hard_stops.includes('C72_LINKED_TERMS_BINDINGS_UNMIGRATED'));
});
