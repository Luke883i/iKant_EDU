import fsForTest from 'node:fs';
import crypto from 'node:crypto';
const requireIndependentSha=bytes=>crypto.createHash('sha1').update('blob '+bytes.length+String.fromCharCode(0)).update(bytes).digest('hex');
import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyWorkflow,evaluateMutationGate,referencePredicate,provisionalRole,auditRepository,parseStagedGitEntries,qualifyWorkingTreeDifference,auditWorkflowRetirements,qualifyRegisterSuccession,gitBlobSha1,qualifyRegisteredC72SourceEpoch} from '../scripts/v5b-repository-governance-audit.mjs';

test('canonical Git hash helper is byte-accurate for UTF-8 and binary, reject object coercion',()=>{
 const cryptoSha=bytes=>{
  const b=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);
  return requireIndependentSha(b);
 };
 assert.equal(gitBlobSha1(''),'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
 for(const x of ['', 'hello', 'caffè', '🚀', '\u0000', 'a\r\nb', '\uFEFFx',
  '🇮🇹 café\n', 'a\uD800', 'iKant_EDU'] ){
  const b=Buffer.from(x,'utf8');
  assert.equal(gitBlobSha1(x),gitBlobSha1(b));
  assert.equal(gitBlobSha1(new Uint8Array(b)),gitBlobSha1(b));
  assert.equal(gitBlobSha1(x),cryptoSha(b));
 }
 const binary=Buffer.from([0,255,0,195,40,128]);
 assert.equal(gitBlobSha1(binary),cryptoSha(binary));
 for(const value of [null,undefined,12,false,{},['a'],new ArrayBuffer(2)]){
  assert.throws(()=>gitBlobSha1(value),/V5B_GIT_BLOB_INPUT_TYPE/);
 }
});
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
test('stage zero index records are the source of Git provenance',()=>{
 const a=parseStagedGitEntries('100644 '+'a'.repeat(40)+' 0\tartifacts/qualification/c32-selection.json\0');
 assert.equal(a.length,1);
 assert.equal(a[0].path,'artifacts/qualification/c32-selection.json');
 assert.throws(()=>parseStagedGitEntries('100644 '+'a'.repeat(40)+' 1\tREADME.md\0'),/INDEX_STAGE/);
 assert.throws(()=>parseStagedGitEntries('100644 '+'a'.repeat(40)+' 0\tREADME.md\0'+'100644 '+'a'.repeat(40)+' 0\tREADME.md\0'),/INDEX_DUPLICATE/);
});
test('regenerated C32 evidence is recorded but not treated as a source commit',()=>{
 const old='a'.repeat(40),changed='b'.repeat(40);
 const q=qualifyWorkingTreeDifference('artifacts/qualification/c32-session-shell-selection-1k.json',old,changed);
 assert.equal(q.ok,true);assert.equal(q.status,'TEST_GENERATED_EVIDENCE_DIFFERENT_FROM_COMMITTED_BLOB');
 assert.equal(q.evidence_claim,'WORKTREE_BYTE_CHANGE_NOT_NEW_OWNER_RECEIPT');
 assert.equal(qualifyWorkingTreeDifference('artifacts/qualification/c32-session-shell-selection-1k.json',old,old).status,'SAME_AS_INDEX');
 for(const p of ['host/c87-durable-ledger.mjs','README.md','.github/workflows/c32-session-shell.yml','governance/v5b-baseline-inventory.json']){
  const r=qualifyWorkingTreeDifference(p,old,changed);
  assert.equal(r.ok,false,p);assert.equal(r.edge,'V5B_TRACKED_SOURCE_DIRTY');
 }
});
test('original full-checkout inventory is mechanically indexed, not reviewed',{skip:process.env.V5B_SKIP_LIVE==='1'},()=>{
 const r=auditRepository();
 assert.equal(r.errors.length,0,JSON.stringify(r.errors.slice(0,40)));
 assert.equal(r.baseline_files,1471);
 assert.equal(r.retained_workflows,87);
 assert.equal(r.baseline_workflow_count,121);assert.equal(r.retired_workflows.length,5);assert.equal(r.workflow_count,116);
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

test('V5B retirement demands exact absent runner, active replacement, preserved test',()=>{
 const before=['.github/workflows/a.yml','.github/workflows/b.yml'],live=['.github/workflows/b.yml'];
 const m={paths:before,superseded_workflows:{'.github/workflows/a.yml':{status:'SUPERSEDED_RUNNER',reason:'Original tests remain active in a declared replacement CI workflow and are not silently removed.',replacements:['.github/workflows/b.yml'],tests:['tests/a.test.mjs']}}};
 assert.deepEqual(auditWorkflowRetirements(before,live,m,[...live,'tests/a.test.mjs']).errors,[]);
 assert.ok(auditWorkflowRetirements(before,live,{paths:before},live).errors.some(e=>e.startsWith('UNREGISTERED_WORKFLOW_REMOVAL')));
 assert.ok(auditWorkflowRetirements(before,live,m,live).errors.some(e=>e.startsWith('RETIRED_WORKFLOW_TEST_MISSING')));
 assert.ok(auditWorkflowRetirements(before,[],m,['tests/a.test.mjs']).errors.some(e=>e.startsWith('REPLACEMENT_NOT_ACTIVE')));
});

test('V5-B rejects overlapping delta registers unless explicit predecessor is pinned',()=>{
 const a={operation:'MODIFY',register:'governance/changes/earlier.json',source_main:'a'.repeat(40),human_review:'REVIEW_REQUIRED'};
 const b={operation:'MODIFY',register:'governance/changes/later.json',source_main:'a'.repeat(40),human_review:'REVIEW_REQUIRED',
  supersedes_register:a.register,supersedes_source_main:a.source_main};
 assert.equal(qualifyRegisterSuccession(a,b),false,'same-main duplicate must be rejected');
 assert.equal(qualifyRegisterSuccession(a,{...b,same_source_main_change:'EXPLICIT_REVIEW_REQUIRED_PR_SLICE'}),true);
 assert.equal(qualifyRegisterSuccession(a,{...b,source_main:'b'.repeat(40)}),true,'distinct pinned main epoch');
 assert.equal(qualifyRegisterSuccession(a,{...b,supersedes_register:'elsewhere',same_source_main_change:'EXPLICIT_REVIEW_REQUIRED_PR_SLICE'}),false);
 assert.equal(qualifyRegisterSuccession(a,{...b,supersedes_source_main:'b'.repeat(40),same_source_main_change:'EXPLICIT_REVIEW_REQUIRED_PR_SLICE'}),false);
 assert.equal(qualifyRegisterSuccession(a,{...b,human_review:'PROVISIONAL',same_source_main_change:'EXPLICIT_REVIEW_REQUIRED_PR_SLICE'}),false);
 assert.equal(qualifyRegisterSuccession(a,{...b,operation:'REMOVE',same_source_main_change:'EXPLICIT_REVIEW_REQUIRED_PR_SLICE'}),false);
 assert.equal(qualifyRegisterSuccession(a,{...b,register:a.register,same_source_main_change:'EXPLICIT_REVIEW_REQUIRED_PR_SLICE'}),false);
});

test('V5-B permits only pinned future-epoch ADD to MODIFY succession, never silent replay',()=>{
 const prior={operation:'ADD',register:'governance/changes/initial.json',
  source_main:'a'.repeat(40),human_review:'REVIEW_REQUIRED'};
 const next={operation:'MODIFY',register:'governance/changes/next.json',
  source_main:'b'.repeat(40),human_review:'REVIEW_REQUIRED',
  supersedes_register:prior.register,supersedes_source_main:prior.source_main};
 assert.equal(qualifyRegisterSuccession(prior,next),true);
 const reject=[
  {...next,source_main:prior.source_main},
  {...next,register:prior.register},
  {...next,supersedes_register:'governance/changes/unbound.json'},
  {...next,supersedes_source_main:'f'.repeat(40)},
  {...next,human_review:'PROVISIONAL'},
  {...next,operation:'REMOVE'}];
 for(const v of reject)assert.equal(qualifyRegisterSuccession(prior,v),false,JSON.stringify(v));
 assert.equal(qualifyRegisterSuccession({...prior,operation:'REMOVE'},next),false);
 assert.equal(qualifyRegisterSuccession({...prior,human_review:'PROVISIONAL'},next),false);
});

test('V5B reviewer status supports digit-bearing C98 lineage while rejecting invalid tokens',()=>{
 const base=['.github/workflows/c98-project-3md.yml','.github/workflows/c98-host-bound-prepr.yml'];
 const retained={paths:base,superseded_workflows:{[base[0]]:{status:'SUBSUMED_C98_BASELINE',reason:'Specialist baseline is verified in an active replacement with exact focused regression coverage.',replacements:[base[1]],tests:['tests/c98-project-baseline.test.mjs']}}};
 const paths=[base[1],'tests/c98-project-baseline.test.mjs'];
 assert.deepEqual(auditWorkflowRetirements(base,[base[1]],retained,paths).errors,[]);
 for(const status of ['SUBSUMED-C98_BASELINE','9_SUBSUMED','SUBSUMED C98','']){
  const mutant={...retained,superseded_workflows:{[base[0]]:{...retained.superseded_workflows[base[0]],status}}};
  assert(auditWorkflowRetirements(base,[base[1]],mutant,paths).errors.some(x=>x.startsWith('UNREVIEWABLE_WORKFLOW_RETIREMENT')),status);
 }
});

test('prospective C72 source-epoch register is exact, cannot upgrade prior receipts',()=>{
 const fs=fsForTest;
 const path='host/c72-public-mode-admission.mjs';
 const old='eec28e35a1066802edc905c7d61c1ecbcef0082d';
 const current='f8f3713115137732fde380f02bfc0ec6874214f5';
 const base=JSON.parse(fs.readFileSync(new URL('../governance/changes/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz-edu-only-original-e2e.json',import.meta.url),'utf8'));
 const run=(registration,observed=current,prior=old)=>qualifyRegisteredC72SourceEpoch({
  path,historicalBlobSha1:prior,observedBlobSha1:observed,registration});
 const result=run(base);assert.equal(result.ok,true);assert.equal(result.amended,true);
 assert.equal(result.historical_receipt_reusable,false);
 assert.equal(result.native_event_attested,false);
 assert.equal(result.review_attested,false);
 assert.equal(result.status,'PROSPECTIVE_C72_SOURCE_ONLY_REVIEW_REQUIRED');
 assert.equal(run({...base,source_main:'f'.repeat(40)}).ok,false);
 assert.equal(run({...base,human_review_completed:true}).ok,false);
 assert.equal(run({...base,source_epoch_amendment:{...base.source_epoch_amendment,owner_invoked:true}}).ok,false);
 assert.equal(run({...base,source_epoch_amendment:{...base.source_epoch_amendment,mcp_remains_independent:false}}).ok,false);
 const bad=structuredClone(base);bad.paths.find(x=>x.path===path).prospective_source_blob_sha1='f'.repeat(40);
 assert.equal(run(bad).ok,false);
 assert.equal(run(base,'f'.repeat(40)).ok,false);
 assert.equal(run(base,current,'f'.repeat(40)).ok,false);
 assert.equal(qualifyRegisteredC72SourceEpoch({path:'host/c135-edu-v2-owner.mjs',historicalBlobSha1:old,observedBlobSha1:current,registration:base}).ok,false);
 const unchanged=run(base,old);assert.equal(unchanged.ok,true);assert.equal(unchanged.amended,false);
});
