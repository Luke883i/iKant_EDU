import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyWorkflow,evaluateMutationGate,referencePredicate,provisionalRole,auditRepository} from '../scripts/v5b-repository-governance-audit.mjs';

test('all-path roles are explicitly provisional and never human review',()=>{
 assert.equal(provisionalRole('tests/foo.test.mjs'),'TEST_SOURCE');
 assert.equal(provisionalRole('.github/workflows/a.yml'),'CI_WORKFLOW');
 assert.equal(provisionalRole('host/c87-owner.mjs'),'HOST_ADAPTER_OR_OWNER_CANDIDATE');
 assert.equal(provisionalRole('not_known.bin'),'ROOT_OR_MISC_UNREVIEWED');
});
test('workflow classification distinguishes source YAML from provider effective rules',()=>{
 const y='name: sample\non:\n  pull_request:\n  workflow_dispatch:\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm test\n';
 const r=classifyWorkflow(y);
 assert.deepEqual(r.events,['pull_request','workflow_dispatch']);
 assert.deepEqual(r.jobs,['check']);assert.equal(r.run_stanzas,1);
 assert.equal(r.required_check_status,'UNKNOWN_PROVIDER_NOT_DERIVED');
});
test('dangerous triggers and permissions are labelled for review',()=>{
 const r=classifyWorkflow('on:\n  pull_request_target:\npermissions:\n  contents: write\njobs:\n  publish:\n    steps:\n      - run: gh release create something\n');
 assert(r.flags.includes('PR_TARGET_PRIVILEGE_REVIEW'));
 assert(r.flags.includes('WRITE_PERMISSION_REVIEW'));
 assert(r.flags.includes('POSSIBLE_DELIVERY_OR_RELEASE'));
});
test('read-only finite gate is never a provider proof or product release',()=>{
 const r=evaluateMutationGate(referencePredicate());assert.equal(r.ok,true);
 assert.equal(r.authority,0);assert.equal(r.active,false);
});
test('removal, rename and CI consolidation cannot proceed without independent proof',()=>{
 for(const action of ['DELETE','RENAME','CONSOLIDATE_WORKFLOW']){
  const x=evaluateMutationGate({...referencePredicate(),action});
  assert.equal(x.ok,false,action);assert.equal(x.edge,'V5B_MUTATION_NOT_AUTHORIZED');
 }
});
test('SHA identity does not authorize file deletion',()=>{
 const p={...referencePredicate(),action:'DELETE',byte_equivalence_checked:true};
 assert.equal(evaluateMutationGate(p).ok,false);
});
test('CI and provider results do not mint original authority',()=>{
 for(const k of ['github_required_check_claim','installed_product_claim','ci_is_owner_receipt'])
  assert.equal(evaluateMutationGate({...referencePredicate(),[k]:true}).ok,false,k);
});
test('unclassified additions and broken retention are blocked',()=>{
 for(const [key,value] of [['snapshot_complete',false],['retention_respected',false],['changes_explained',false],['workflow_coverage',false],['unknowns_not_promoted',false]]){
  assert.equal(evaluateMutationGate({...referencePredicate(),[key]:value}).ok,false,key);
 }
});
test('original full-checkout inventory is mechanically indexed, not reviewed',{skip:process.env.V5B_SKIP_LIVE==='1'},()=>{
 const r=auditRepository();
 assert.equal(r.errors.length,0,JSON.stringify(r.errors.slice(0,40)));
 assert.equal(r.baseline_files,1471);
 assert.equal(r.retained_workflows,87);
 assert.equal(r.workflow_count,121);
 assert.equal(r.human_reviewed_files,0);
 assert.equal(r.owner_accountability,'HUMAN_OWNER_NOT_INFERRED');
 assert.equal(r.required_checks,'UNKNOWN_PROVIDER_NOT_ATTESTED');
 assert.equal(r.status,'SOURCE_INDEXED_NOT_HUMAN_REVIEWED');
 assert.equal(r.consumer_index.length,r.checked_files,'every tracked path has a candidate consumer record');
 assert(r.consumer_index.every(x=>x.human_verified===false));
 assert(r.consumer_index.every(x=>x.status==='UNKNOWN_NOT_UNUSED'||x.status==='LITERAL_CONSUMER_OBSERVED'));
 assert(r.consumer_index.some(x=>x.status==='UNKNOWN_NOT_UNUSED'),'absence of a literal importer must not be labelled UNUSED');
 assert(r.dependency_probe.js_files>=700,'unexpected JS source loss');
});
