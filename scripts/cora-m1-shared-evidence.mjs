#!/usr/bin/env node
/** M1 source/CI/consumer *evidence cut*, not a new V5-B inventory or original owner. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditRepository} from './v5b-repository-governance-audit.mjs';
import {censusRepo} from './project-review-callsites.mjs';
import {observePrGEvidence} from './cora-pr-g-evidence-readback.mjs';
import {validateFContract} from './cora-pr-f-qualification.mjs';
import fs from 'node:fs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SHA=/^[a-f0-9]{40}$/u;
const SOURCE_NODES=['F01','F02','F03','F04','F05'];
const EXTERNAL_NODES=['F06','F07','F08','F10','F11','F12'];
const CRITICAL=[
 'BOOTSTRAP.json','contracts/project-host-tool-grounding-abi.json',
 'host/project-c72-transport-frontier.mjs','host/project-oneshell-continuous.mjs',
 'project/session-chat/PROMPT.txt','project/edu-oneshell/PROMPT_INNESCO.txt',
 'project-baseline/PROJECT_PROMPT.txt','project/oneshell-v7/PROMPT_TEMPLATE.txt',
 'scripts/project-review-callsites.mjs','scripts/cora-pr-f-qualification.mjs',
 'scripts/cora-pr-g-evidence-readback.mjs','scripts/cora-s3-convergence.mjs'
];
const digest=x=>createHash('sha256').update(x).digest('hex');
const stop=(edge)=>({ok:false,first_edge:edge,authority:0,active:false,
 m1_complete:false,repository_standardized:false,archive_allowed:false,
 product_go:false,external_consumer_closure:false,provider:'NOT_ATTESTED',
 human_review:'NOT_ATTESTED'});
const uniq=x=>new Set(x).size===x.length;
const isSorted=x=>x.every((v,i)=>i===0||x[i-1]<v);
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8',maxBuffer:32000000,timeout:30000}).trim();
const raw=(...a)=>execFileSync('git',a,{cwd:ROOT,maxBuffer:32000000,timeout:30000});
/** Retain Git stage/mode/sha and compare independently to actual HEAD TREE. */
export function parseGitObjects(indexBytes,treeBytes){
 const parse=(s,kind)=>s.toString('utf8').split('\0').filter(Boolean).map(row=>{
  const m=kind==='index'?
   /^([0-7]{6}) ([a-f0-9]{40}) ([0-3])\t(.+)$/u.exec(row):
   /^([0-7]{6}) (blob|commit) ([a-f0-9]{40})\t(.+)$/u.exec(row);
  if(!m||m[1]!=='100644'&&m[1]!=='100755'&&m[1]!=='120000'&&m[1]!=='160000'||
   kind==='index'&&m[3]!=='0')throw Error('M1_UNSUPPORTED_GIT_STAGE_OR_PATH');
  return {path:m[4],mode:m[1],sha:kind==='index'?m[2]:m[3]};
 });
 const index=parse(indexBytes,'index'),tree=parse(treeBytes,'tree');
 const sort=a=>a.sort((x,y)=>x.path<y.path?-1:x.path>y.path?1:0);
 sort(index);sort(tree);
 if(!uniq(index.map(x=>x.path))||!uniq(tree.map(x=>x.path))||
   JSON.stringify(index)!==JSON.stringify(tree))throw Error('M1_GIT_INDEX_TREE_NOT_IDENTICAL');
 return {rows:index,paths:index.map(x=>x.path),paths_sha256:digest(index.map(x=>x.path).join('\n'))};
}
/** Pure reconciliation. Caller is responsible for authenticating the Git objects and tools. */
export function qualifyM1Snapshot({gitObjects,audit,callsite,g,contract}={}){
 if(!gitObjects||!SHA.test(gitObjects.head||'')||!SHA.test(gitObjects.tree||'')||
  !SHA.test(gitObjects.workflow_tree||'')||!Array.isArray(gitObjects.rows)||
  gitObjects.rows.length===0)return stop('M1_GIT_OBJECTS_UNBOUND');
 const rows=gitObjects.rows,paths=rows.map(x=>x.path);
 if(!uniq(paths)||!isSorted(paths)||rows.some(x=>!SHA.test(x.sha||'')||
  !['100644','100755','120000','160000'].includes(x.mode))||
  gitObjects.paths_sha256!==digest(paths.join('\n')))
  return stop('M1_INDEX_TREE_OR_DIGEST_INVALID');
 if(validateFContract(contract).ok!==true||
  !Array.isArray(contract.reticulum)||contract.reticulum.length!==18)
  return stop('M1_ORIGINAL_F_RETICULUM_INVALID');
 const ids=contract.reticulum.map(x=>x.id);
 if(!uniq(ids)||!SOURCE_NODES.every(x=>ids.includes(x))||
  !EXTERNAL_NODES.every(x=>ids.includes(x)))return stop('M1_RETICULUM_NODE_COVERAGE');
 if(audit?.schema!=='ikant-v5b-live-readonly-audit/v1'||
  audit.status!=='SOURCE_INDEXED_NOT_HUMAN_REVIEWED'||audit.errors?.length!==0||
  audit.checked_files!==rows.length||audit.workflow_count!==116||
  !Array.isArray(audit.consumer_index)||audit.consumer_index.length!==rows.length||
  !Array.isArray(audit.workflows)||audit.workflows.length!==116||
  audit.required_checks!=='UNKNOWN_PROVIDER_NOT_ATTESTED'||
  audit.human_reviewed_files!==0)return stop('M1_V5B_SINGLE_INVENTORY_NOT_VERIFIED');
 const consumerPaths=audit.consumer_index.map(x=>x.path);
 if(!uniq(consumerPaths)||!isSorted(consumerPaths)||
  JSON.stringify(consumerPaths)!==JSON.stringify(paths))return stop('M1_V5B_CONSUMER_BIJECTION_FAILED');
 const tracked=new Set(paths),consumerByPath=new Map(audit.consumer_index.map(x=>[x.path,x]));
 for(const row of audit.consumer_index){
  if(!['UNKNOWN_NOT_UNUSED','LITERAL_CONSUMER_OBSERVED'].includes(row.status)||
   row.human_verified!==false||
   row.interpretation!=='HEURISTIC_ONLY_DYNAMIC_AND_DATA_CONSUMERS_NOT_PROVEN'||
   !Array.isArray(row.literal_importers)||!Array.isArray(row.literal_dependencies)||
   !uniq(row.literal_importers)||!uniq(row.literal_dependencies)||
   [...row.literal_importers,...row.literal_dependencies].some(x=>!tracked.has(x))||
   (row.status==='LITERAL_CONSUMER_OBSERVED')!==(row.literal_importers.length>0))
   return stop('M1_V5B_CONSUMER_STATUS_LAUNDERED');
 }
 const workflows=audit.workflows.map(x=>x.path);
 if(!uniq(workflows)||!isSorted(workflows)||workflows.some(x=>!x.startsWith('.github/workflows/')||
  !tracked.has(x))||paths.filter(x=>x.startsWith('.github/workflows/')).length!==116||
  workflows.some(x=>!SHA.test(audit.workflows.find(w=>w.path===x)?.blob_sha1||'')||
  audit.workflows.find(w=>w.path===x)?.required_check_status!=='UNKNOWN_PROVIDER_NOT_DERIVED'))
  return stop('M1_CI_WORKFLOW_OR_ADMIN_STATUS_PROMOTED');
 if(callsite?.schema!=='ikant-host-callsite-census/v1'||
  callsite.authority!==0||
  callsite.epistemic_status!=='SOURCE_LEXICAL_CENSUS_NOT_RUNTIME_REACHABILITY'||
  callsite.tracked_file_count!==rows.length||
  callsite.source_sha256!==gitObjects.paths_sha256||
  !Array.isArray(callsite.callsites)||callsite.callsite_count!==callsite.callsites.length||
  callsite.unknown_target_count!==callsite.callsites.filter(x=>x.qualification==='DYNAMIC_TARGET_UNKNOWN').length)
  return stop('M1_LEXICAL_CENSUS_NOT_BOUND_TO_V5B');
 const dynamicCount=new Map(),literalCount=new Map();
 for(const x of callsite.callsites){
  if(!tracked.has(x.path)||!Number.isInteger(x.line)||x.line<1||
   !['LITERAL','DYNAMIC_TARGET_UNKNOWN'].includes(x.qualification)||
   x.qualification==='DYNAMIC_TARGET_UNKNOWN'&&x.target!==null||
   x.qualification==='LITERAL'&&(typeof x.target!=='string'||!x.target)||
   typeof x.kind!=='string'||typeof x.expression!=='string')
   return stop('M1_CALLSITE_ROW_INVALID');
  const count=x.qualification==='DYNAMIC_TARGET_UNKNOWN'?dynamicCount:literalCount;
  count.set(x.path,(count.get(x.path)||0)+1);
 }
 if(g?.ok!==true||g.status!=='SOURCE_PACKET_READY_EXTERNAL_DOD_BLOCKED'||
  g.original_DOD!=='contracts/cora-pr-f-integrated-qualification-v1.json'||
  g.source?.head!==gitObjects.head||g.source?.tree!==gitObjects.tree||
  (g.source?.current_workflow_tree??g.source?.workflow_tree)!==gitObjects.workflow_tree||
  g.source?.tracked!==rows.length||
  g.consumers?.lexical_callsites!==callsite.callsite_count||
  g.consumers?.dynamic_unknown!==callsite.unknown_target_count||
  g.consumers?.closure!=='UNKNOWN_REQUIRES_INDEPENDENT_REVIEW'||
  g.source_evidence_only!==true||g.external_closure!==false||
  g.permission_to_delete!==false||g.permission_to_merge!==false||
  g.repository_standardized!==false||g.product_go!==false||
  g.approval!=='NOT_ATTESTED'||g.provider!=='NOT_ATTESTED'||
  !Array.isArray(g.original_F_nodes)||g.original_F_nodes.length!==ids.length||
  g.original_F_nodes.some((n,i)=>n.id!==contract.reticulum[i].id||
    JSON.stringify(n.requires)!==JSON.stringify(contract.reticulum[i].needs))||
  !SOURCE_NODES.every(x=>g.original_F_nodes.find(n=>n.id===x)?.status==='SOURCE_OBSERVED_NOT_HUMAN_REVIEW')||
  !EXTERNAL_NODES.every(x=>g.original_F_nodes.find(n=>n.id===x)?.status!=='SOURCE_OBSERVED_NOT_HUMAN_REVIEW'))
  return stop('M1_ORIGINAL_PR_G_PACKET_OR_EXTERNAL_EDGE_INVALID');
 for(const p of CRITICAL)if(!tracked.has(p))return stop('M1_CRITICAL_PATH_NOT_IN_SINGLE_INVENTORY');
 const expectedExternal={
  F06:'CLEAN_ROOM_TEST_AND_EXACT_HEAD_CI_EXTERNAL',
  F07:'CI_ORIGINAL_ONE_MILLION_REPLAY_EXTERNAL',
  F08:'DYNAMIC_EXTERNAL_CONSUMER_REVIEW_OPEN',
  F09:'ELEVEN_BLOBS_REOPENED_FULL_ROLLBACK_REVIEW_OPEN',
  F10:'GITHUB_ADMIN_REQUIRED_CHECKS_UNKNOWN',
  F11:'TWO_INDEPENDENT_ENGINEERS_HUMAN_DECISION_NOT_ATTESTED',
  F12:'POSTMERGE_FRESH_CHECKOUT_NOT_ATTESTED'
 };
 if(Object.entries(expectedExternal).some(([id,status])=>
  g.original_F_nodes.find(n=>n.id===id)?.status!==status)||
  g.original_F_nodes.some((n,i)=>n.evidence_level!==contract.reticulum[i].scope))
  return stop('M1_EXTERNAL_STATUS_OR_SCOPE_FORGED');
 const unresolved=callsite.callsites.filter(x=>x.qualification==='DYNAMIC_TARGET_UNKNOWN');
 if(!Array.isArray(g.consumers.unresolved_callsites)||
  g.consumers.unresolved_callsites.length!==unresolved.length||
  unresolved.some((x,i)=>{
   const a=g.consumers.unresolved_callsites[i];
   return a?.path!==x.path||a.line!==x.line||a.kind!==x.kind||
    a.expression!==x.expression||a.closure!=='REVIEW_REQUIRED_NOT_RUNTIME_REACHABILITY';
  }))return stop('M1_UNRESOLVED_DYNAMIC_SITES_LAUNDERED');
 const critical=CRITICAL.map(p=>({path:p,v5b_status:consumerByPath.get(p).status,
  literal_importers:consumerByPath.get(p).literal_importers.length,
  lexical_dynamic_calls:dynamicCount.get(p)||0,
  lexical_literal_calls:literalCount.get(p)||0,
  runtime_reachability:'NOT_ATTESTED'}));
 const unknown=audit.consumer_index.filter(x=>x.status==='UNKNOWN_NOT_UNUSED').length;
 const evidence={head:gitObjects.head,tree:gitObjects.tree,workflow_tree:gitObjects.workflow_tree,
  tracked:rows.length,workflows:116,
  v5b_unknown_not_unused:unknown,lexical_dynamic_unknown:callsite.unknown_target_count,
  lexical_callsites:callsite.callsite_count,critical,
  original_F_source_nodes:SOURCE_NODES,original_F_external_nodes:EXTERNAL_NODES};
 const digest_sha256=digest(JSON.stringify(evidence));
 return {ok:true,status:'M1_SHARED_SOURCE_EVIDENCE_CUT_ONLY',first_edge:'F06_CLEAN_CHECKOUT_CI_EXTERNAL_ATTESTATION_OPEN',
  ...evidence,evidence_digest_sha256:digest_sha256,
  v5b_single_inventory:true,critical_consumer_graph:'SOURCE_HEURISTIC_WITH_EXPLICIT_UNKNOWNS',
  consumer_closure:'UNKNOWN_REQUIRES_INDEPENDENT_REVIEW',
  ci:'EXACT_HEAD_JOB_READBACK_REQUIRED',required_checks:'UNKNOWN_ADMIN_READBACK',
  original_F08:'BLOCKED_EXTERNAL',owner:'NOT_INVOKED',provider:'NOT_ATTESTED',
  independent_review:'NOT_ATTESTED',postmerge:'NOT_ATTESTED',
  source_evidence_only:true,external_consumer_closure:false,
  m1_complete:false,repository_standardized:false,archive_allowed:false,
  product_go:false,active:false,authority:0};
}
/** Logical witness mutation cannot turn source bytes into an external receipt. */
export function evaluateM1Reticulum(contract,witness={}){
 if(validateFContract(contract).ok!==true)return stop('M1_ORIGINAL_F_INVALID');
 const state={};
 for(const n of contract.reticulum){
  const parent=(n.needs||[]).every(p=>state[p]==='MODEL_TRUE');
  state[n.id]=['INTERMEDIATE','GLOBAL'].includes(n.scope)?
   (parent?'MODEL_TRUE':'BLOCKED_DEPENDENCY'):
   witness[n.id]===true&&parent?'MODEL_TRUE':'UNKNOWN_NOT_ATTESTED';
 }
 return {ok:true,state,model_source:state.I_SOURCE==='MODEL_TRUE',
  model_repository:state.G_REPOSITORY_STANDARDIZED==='MODEL_TRUE',
  actual_m1_complete:false,repository_standardized:false,archive_allowed:false,
  product_go:false,authority:0,active:false,owner:'NOT_INVOKED',
  provider:'NOT_ATTESTED',human_review:'NOT_ATTESTED'};
}
export function observeM1Source(){
 try{
  const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
  const workflow_tree=git('rev-parse','HEAD:.github/workflows');
  const parsed=parseGitObjects(raw('ls-files','--stage','-z'),raw('ls-tree','-r','-z','HEAD'));
  const audit=auditRepository();
  const callsite=censusRepo(ROOT);
  const g=observePrGEvidence();
  const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/cora-pr-f-integrated-qualification-v1.json'),'utf8'));
  const result=qualifyM1Snapshot({gitObjects:{...parsed,head,tree,workflow_tree},
   audit,callsite,g,contract});
  if(git('rev-parse','HEAD')!==head||git('rev-parse','HEAD^{tree}')!==tree)
   return stop('M1_SOURCE_CHANGED_DURING_READBACK');
  return result;
 }catch(e){return {...stop('M1_GIT_ORIGINAL_AUDIT_READBACK_EXCEPTION'),
  diagnostic:String(e?.message||e).slice(0,220)};}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('M1_UNKNOWN_ARGS');
 const r=observeM1Source();
 process.stdout.write(JSON.stringify(r,null,2)+'\n');
 if(!r.ok)process.exitCode=1;
}
