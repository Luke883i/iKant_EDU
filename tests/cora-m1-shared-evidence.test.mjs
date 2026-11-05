import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseGitObjects,qualifyM1Snapshot,evaluateM1Reticulum,observeM1Source}
 from '../scripts/cora-m1-shared-evidence.mjs';
import {validateFContract} from '../scripts/cora-pr-f-qualification.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CONTRACT=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/cora-pr-f-integrated-qualification-v1.json'),'utf8'));
const SHA=x=>x.repeat(40);
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const clone=x=>JSON.parse(JSON.stringify(x));
const critical=[
 'BOOTSTRAP.json','contracts/project-host-tool-grounding-abi.json',
 'host/project-c72-transport-frontier.mjs','host/project-oneshell-continuous.mjs',
 'project/session-chat/PROMPT.txt','project/edu-oneshell/PROMPT_INNESCO.txt',
 'project-baseline/PROJECT_PROMPT.txt','project/oneshell-v7/PROMPT_TEMPLATE.txt',
 'scripts/project-review-callsites.mjs','scripts/cora-pr-f-qualification.mjs',
 'scripts/cora-pr-g-evidence-readback.mjs','scripts/cora-s3-convergence.mjs'
];
function fixture(){
 const paths=[...critical,...Array.from({length:116},(_,i)=>
  '.github/workflows/m1-test-'+String(i).padStart(3,'0')+'.yml')].sort();
 const head=SHA('a'),tree=SHA('b'),workflow_tree=SHA('c');
 const gitObjects={head,tree,workflow_tree,rows:paths.map(path=>({path,mode:'100644',sha:SHA('d')})),
  paths_sha256:digest(paths.join('\n'))};
 const consumer_index=paths.map(path=>({path,literal_importers:[],literal_dependencies:[],
  status:'UNKNOWN_NOT_UNUSED',
  interpretation:'HEURISTIC_ONLY_DYNAMIC_AND_DATA_CONSUMERS_NOT_PROVEN',human_verified:false}));
 const workflows=paths.filter(x=>x.startsWith('.github/workflows/')).map(path=>({
  path,blob_sha1:SHA('d'),required_check_status:'UNKNOWN_PROVIDER_NOT_DERIVED'}));
 const audit={schema:'ikant-v5b-live-readonly-audit/v1',
  status:'SOURCE_INDEXED_NOT_HUMAN_REVIEWED',errors:[],checked_files:paths.length,
  workflow_count:116,consumer_index,workflows,
  required_checks:'UNKNOWN_PROVIDER_NOT_ATTESTED',human_reviewed_files:0};
 const callsites=[
  {path:'host/project-c72-transport-frontier.mjs',line:19,kind:'import (',
   expression:'getRuntimePath()',target:null,qualification:'DYNAMIC_TARGET_UNKNOWN'},
  {path:'scripts/project-review-callsites.mjs',line:5,kind:'require (',
   expression:"'node:fs'",target:'node:fs',qualification:'LITERAL'}];
 const callsite={schema:'ikant-host-callsite-census/v1',authority:0,
  epistemic_status:'SOURCE_LEXICAL_CENSUS_NOT_RUNTIME_REACHABILITY',
  tracked_file_count:paths.length,source_sha256:gitObjects.paths_sha256,
  callsites,callsite_count:callsites.length,unknown_target_count:1};
 const g={ok:true,status:'SOURCE_PACKET_READY_EXTERNAL_DOD_BLOCKED',
  original_DOD:'contracts/cora-pr-f-integrated-qualification-v1.json',
  source:{head,tree,workflow_tree,tracked:paths.length},
  consumers:{lexical_callsites:2,dynamic_unknown:1,
   closure:'UNKNOWN_REQUIRES_INDEPENDENT_REVIEW',
   unresolved_callsites:[{path:callsites[0].path,line:callsites[0].line,
    kind:callsites[0].kind,expression:callsites[0].expression,
    closure:'REVIEW_REQUIRED_NOT_RUNTIME_REACHABILITY'}]},
  source_evidence_only:true,external_closure:false,
  permission_to_delete:false,permission_to_merge:false,
  repository_standardized:false,product_go:false,
  approval:'NOT_ATTESTED',provider:'NOT_ATTESTED',
  original_F_nodes:CONTRACT.reticulum.map(n=>({id:n.id,requires:n.needs,
   evidence_level:n.scope,
   status:({'F06':'CLEAN_ROOM_TEST_AND_EXACT_HEAD_CI_EXTERNAL',
    'F07':'CI_ORIGINAL_ONE_MILLION_REPLAY_EXTERNAL',
    'F08':'DYNAMIC_EXTERNAL_CONSUMER_REVIEW_OPEN',
    'F09':'ELEVEN_BLOBS_REOPENED_FULL_ROLLBACK_REVIEW_OPEN',
    'F10':'GITHUB_ADMIN_REQUIRED_CHECKS_UNKNOWN',
    'F11':'TWO_INDEPENDENT_ENGINEERS_HUMAN_DECISION_NOT_ATTESTED',
    'F12':'POSTMERGE_FRESH_CHECKOUT_NOT_ATTESTED'})[n.id]||
   (['F01','F02','F03','F04','F05'].includes(n.id)?
    'SOURCE_OBSERVED_NOT_HUMAN_REVIEW':'BLOCKED_EXTERNAL')}))};
 return {gitObjects,audit,callsite,g,contract:CONTRACT};
}
test('M1 reuses valid original PR-F reticulum; no new owner or new inventory',()=>{
 assert.equal(validateFContract(CONTRACT).ok,true);
 const r=qualifyM1Snapshot(fixture());
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.status,'M1_SHARED_SOURCE_EVIDENCE_CUT_ONLY');
 assert.equal(r.tracked,128);
 assert.equal(r.workflows,116);
 assert.equal(r.lexical_dynamic_unknown,1);
 assert.equal(r.v5b_unknown_not_unused,128);
 assert.equal(r.critical.length,12);
 assert.equal(r.m1_complete,false);
 assert.equal(r.repository_standardized,false);
 assert.equal(r.archive_allowed,false);
 assert.equal(r.provider,'NOT_ATTESTED');
});
test('Git HEAD TREE and stage-0 index must match including original SHA and mode',()=>{
 const i=Buffer.from('100644 '+SHA('a')+' 0\tA.mjs\0'+'100755 '+SHA('b')+' 0\tB.mjs\0');
 const t=Buffer.from('100644 blob '+SHA('a')+'\tA.mjs\0'+'100755 blob '+SHA('b')+'\tB.mjs\0');
 const a=parseGitObjects(i,t);
 assert.deepEqual(a.paths,['A.mjs','B.mjs']);
 assert.equal(a.rows[0].sha,SHA('a'));
 assert.throws(()=>parseGitObjects(i,Buffer.from(t.toString().replace(SHA('b'),SHA('c')))));
 assert.throws(()=>parseGitObjects(Buffer.from(i.toString().replace(' 0\tA',' 1\tA')),t));
 assert.throws(()=>parseGitObjects(Buffer.from(i.toString()+i.toString()),t));
});
test('fail-closed evidence mutations reject false consumer closure and invented GitHub/admin PASS',()=>{
 const attacks=[
  x=>x.gitObjects.head='a',x=>x.gitObjects.tree='a',
  x=>x.gitObjects.rows[0].sha='a',x=>x.gitObjects.paths_sha256=SHA('a'),
  x=>x.gitObjects.rows.reverse(),
  x=>x.audit.errors.push('M1_PLAUSIBLE_ERROR'),
  x=>x.audit.status='PASS',
  x=>x.audit.consumer_index.pop(),
  x=>x.audit.consumer_index[0].status='UNUSED',
  x=>x.audit.consumer_index[0].human_verified=true,
  x=>x.audit.consumer_index[0].interpretation='NO_CONSUMERS',
  x=>x.audit.consumer_index[0].literal_dependencies.push('file-not-present'),
  x=>x.audit.workflow_count=115,
  x=>x.audit.workflows[0].required_check_status='PROVIDER_PASS',
  x=>x.audit.required_checks='GREEN',
  x=>x.callsite.tracked_file_count=127,
  x=>x.callsite.source_sha256=SHA('a'),
  x=>x.callsite.unknown_target_count=0,
  x=>x.callsite.callsites[0].qualification='LITERAL',
  x=>x.callsite.callsites[0].target='x',
  x=>x.callsite.callsites[0].path='UNTRACKED',
  x=>x.g.source.head=SHA('e'),
  x=>x.g.consumers.closure='PASS',
  x=>x.g.source_evidence_only=false,
  x=>x.g.permission_to_delete=true,
  x=>x.g.permission_to_merge=true,
  x=>x.g.external_closure=true,
  x=>x.g.repository_standardized=true,
  x=>x.g.provider='ACK',
  x=>x.g.original_F_nodes[0].status='OWNER_RECEIPT',
  x=>x.g.original_F_nodes[0].evidence_level='EXTERNAL',
  x=>x.g.original_F_nodes.find(n=>n.id==='F08').status='PASS',
  x=>x.g.consumers.unresolved_callsites[0].closure='PASS',
  x=>x.g.consumers.unresolved_callsites.pop(),
  x=>x.contract={schema:'fake',reticulum:[]}
 ];
 for(const [n,attack] of attacks.entries()){
  const x=fixture();attack(x);const r=qualifyM1Snapshot(x);
  assert.equal(r.ok,false,'attack '+n+': '+JSON.stringify(r));
  assert.equal(r.archive_allowed,false);
  assert.equal(r.repository_standardized,false);
  assert.equal(r.external_consumer_closure,false);
 }
});
test('M1 100k finite logical mutation vectors do not become real CI, owner or provider proof',()=>{
 const leaves=CONTRACT.reticulum.filter(n=>!['INTERMEDIATE','GLOBAL'].includes(n.scope)&&n.id!=='X_PRODUCT');
 const all=Object.fromEntries(leaves.map(n=>[n.id,true]));
 const apparent=evaluateM1Reticulum(CONTRACT,all);
 assert.equal(apparent.model_repository,true);
 assert.equal(apparent.repository_standardized,false);
 assert.equal(apparent.actual_m1_complete,false);
 assert.equal(apparent.archive_allowed,false);
 const run=()=>{
  let seed=20261105>>>0,survivors=0,models=0;
  const sha=crypto.createHash('sha256');
  for(let i=0;i<100000;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const which=seed%leaves.length;
   const claims={...all,[leaves[which].id]:false};
   const r=evaluateM1Reticulum(CONTRACT,claims);
   if(r.model_repository)models++;
   if(r.repository_standardized||r.archive_allowed||r.product_go||r.authority!==0||
    r.owner!=='NOT_INVOKED'||r.provider!=='NOT_ATTESTED')survivors++;
   sha.update(which+':'+String(r.model_repository)+':'+String(r.repository_standardized)+';');
  }
  return {survivors,models,cases:100000,digest:sha.digest('hex')};
 };
 const one=run(),two=run();
 assert.deepEqual(one,two);
 assert.equal(one.survivors,0);
 assert.equal(one.models,0);
});
test('real M1 source-gate readback on checkout, while all external gates remain open',()=>{
 const r=observeM1Source();
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.status,'M1_SHARED_SOURCE_EVIDENCE_CUT_ONLY');
 assert.equal(r.workflows,116);
 assert.equal(r.v5b_single_inventory,true);
 assert.equal(r.critical_consumer_graph,'SOURCE_HEURISTIC_WITH_EXPLICIT_UNKNOWNS');
 assert.equal(r.first_edge,'F06_CLEAN_CHECKOUT_CI_EXTERNAL_ATTESTATION_OPEN');
 assert.equal(r.consumer_closure,'UNKNOWN_REQUIRES_INDEPENDENT_REVIEW');
 assert.equal(r.m1_complete,false);
 assert.equal(r.repository_standardized,false);
 assert.equal(r.product_go,false);
 assert.equal(r.archive_allowed,false);
 assert.equal(r.provider,'NOT_ATTESTED');
 assert.match(r.evidence_digest_sha256,/^[0-9a-f]{64}$/);
});
