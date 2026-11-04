#!/usr/bin/env node
/** V5-B engineering audit: all reads; this is neither a release nor an owner/runtime receipt. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha256=s=>crypto.createHash('sha256').update(s).digest('hex');
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8',maxBuffer:16_000_000,timeout:30000}).trim();
const read=p=>fs.readFileSync(path.join(ROOT,p));
const json=p=>JSON.parse(read(p).toString('utf8'));
export const INVENTORY='governance/v5b-baseline-inventory.json';
export const REGISTER='governance/v5b-change-register.json';
export const DOD='contracts/project-v5b-repository-governance-dod.json';
const isPath=p=>typeof p==='string'&&p.length>0&&!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').some(s=>s===''||s==='.'||s==='..');
export function provisionalRole(p){
 return p.startsWith('.github/workflows/')?'CI_WORKFLOW':p.startsWith('tests/')||p.startsWith('test/')?'TEST_SOURCE':
 p.startsWith('contracts/')?'MACHINE_CONTRACT':p.startsWith('host/')?'HOST_ADAPTER_OR_OWNER_CANDIDATE':
 p.startsWith('src/')?'RUNTIME_SOURCE_CANDIDATE':p.startsWith('scripts/')?'ENGINEERING_TOOL_CANDIDATE':
 p.startsWith('docs/')?'DOCUMENTATION_CANDIDATE':p.startsWith('artifacts/')?'EVIDENCE_ARTIFACT_CANDIDATE':
 p.startsWith('project/')?'PROJECT_DISTRIBUTION_CANDIDATE':p.startsWith('plugins/')?'PLUGIN_OR_ADAPTER_CANDIDATE':
 p.startsWith('assets/')?'MEDIA_ASSET_CANDIDATE':p.startsWith('release/')?'RELEASE_CONFIG_CANDIDATE':
 p.startsWith('runtime/')||p.startsWith('runtime-root/')?'RUNTIME_RESOURCE_CANDIDATE':'ROOT_OR_MISC_UNREVIEWED';
}
export function classifyWorkflow(content){
 if(typeof content!=='string')throw Error('V5B_WORKFLOW_NON_TEXT');
 const lines=content.split(/\r?\n/);
 const events=[],jobs=[],uses=[],run=[];
 let inOn=false,inJobs=false;
 for(const line of lines){
  if(/^on:\s*(?:#.*)?$/.test(line)){inOn=true;inJobs=false;continue;}
  if(/^jobs:\s*(?:#.*)?$/.test(line)){inJobs=true;inOn=false;continue;}
  if(/^\S/.test(line)){inOn=false;inJobs=false;}
  if(inOn){const m=line.match(/^  (pull_request_target|pull_request|push|workflow_dispatch|workflow_call|schedule|workflow_run|merge_group|repository_dispatch):\s*/);if(m)events.push(m[1]);}
  if(inJobs){const m=line.match(/^  ([a-zA-Z][a-zA-Z0-9_-]*):\s*(?:#.*)?$/);if(m)jobs.push(m[1]);}
  const u=line.match(/^\s*-?\s*uses:\s*([^#]+?)(?:\s+#.*)?$/);if(u)uses.push(u[1].trim());
  const x=line.match(/^\s*-?\s*run:\s*(.*)$/);if(x)run.push(x[1].trim());
 }
 const inline=content.match(/^on:\s*\[([^\]]+)\]/m);if(inline)events.push(...inline[1].split(',').map(s=>s.trim()).filter(Boolean));
 const unique=[...new Set(events)].sort();
 const hazards=[];
 if(unique.includes('pull_request_target'))hazards.push('PR_TARGET_PRIVILEGE_REVIEW');
 if(/permissions:\s*write-all|\b(?:contents|issues|pull-requests|actions):\s*write/m.test(content))hazards.push('WRITE_PERMISSION_REVIEW');
 if(/secrets\.|\$\{\{\s*secrets\./i.test(content))hazards.push('SECRETS_USAGE_REVIEW');
 if(/\b(?:deploy|publish|release|npm publish|gh release|docker push)\b/i.test(content))hazards.push('POSSIBLE_DELIVERY_OR_RELEASE');
 if(!unique.length)hazards.push('TRIGGERS_UNPARSED_REVIEW');
 return {events:unique,jobs,steps_using_actions:uses.length,run_stanzas:run.length,uses,flags:hazards,required_check_status:'UNKNOWN_PROVIDER_NOT_DERIVED',effective_permissions:'UNVERIFIED'};
}
export function evaluateMutationGate(p){
 try{
  if(!p||typeof p!=='object'||Array.isArray(p))return {ok:false,edge:'V5B_INVALID'};
  if(p.source_lock!==true||p.original_owner_unchanged!==true)return {ok:false,edge:'V5B_SOURCE_OR_OWNER'};
  if(p.snapshot_complete!==true||p.provisional_roles_explicit!==true||p.unknowns_not_promoted!==true)
   return {ok:false,edge:'V5B_INVENTORY_UNTRUSTED'};
  if(p.retention_respected!==true||p.workflow_coverage!==true||p.changes_explained!==true)
   return {ok:false,edge:'V5B_WORKFLOW_OR_DELTA'};
  if(p.github_required_check_claim!==false||p.installed_product_claim!==false||p.ci_is_owner_receipt!==false)
   return {ok:false,edge:'V5B_AUTHORITY_PROMOTION'};
  if(p.action==='AUDIT_READONLY'&&p.write_effect===false&&p.delete_effect===false)
   return {ok:true,status:'READONLY_AUDIT_ACCEPTABLE_NOT_REVIEWED',authority:0,active:false};
  if(!['DELETE','RENAME','CONSOLIDATE_WORKFLOW'].includes(p.action))return {ok:false,edge:'V5B_UNKNOWN_OPERATION'};
  if(p.critical_dynamic_unknown!==false||p.consumers_verified!==true||p.byte_equivalence_checked!==true||
     p.behavioral_equivalence_checked!==true||p.human_authorization!==true||
     p.required_check_provider_readback!==true||p.original_contract_requalified!==true||
     p.restore_plan_tested!==true||p.write_effect!==false||p.delete_effect!==false)
   return {ok:false,edge:'V5B_MUTATION_NOT_AUTHORIZED'};
  return {ok:true,status:'PRECOMMIT_PLAN_ONLY_NOT_EFFECT_PERMISSION',authority:0,active:false};
 }catch{return {ok:false,edge:'V5B_UNSAFE_OBJECT'};}
}
export function referencePredicate(){return {source_lock:true,original_owner_unchanged:true,snapshot_complete:true,
 provisional_roles_explicit:true,unknowns_not_promoted:true,retention_respected:true,
 workflow_coverage:true,changes_explained:true,github_required_check_claim:false,
 installed_product_claim:false,ci_is_owner_receipt:false,action:'AUDIT_READONLY',
 write_effect:false,delete_effect:false,critical_dynamic_unknown:true,
 consumers_verified:false,byte_equivalence_checked:false,behavioral_equivalence_checked:false,
 human_authorization:false,required_check_provider_readback:false,
 original_contract_requalified:false,restore_plan_tested:false};}
function sha1Blob(bytes){return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');}
/** The Git index carries versioned provenance; generated working bytes do not. */
export function parseStagedGitEntries(raw){
 if(typeof raw!=='string')throw Error('V5B_INDEX_INPUT_INVALID');
 const entries=raw.split('\0').filter(Boolean).map(line=>{
  const match=line.match(/^([0-7]{6}) ([a-f0-9]{40}) ([0-3])\t(.+)$/s);
  if(!match||match[3]!=='0'||!isPath(match[4]))throw Error('V5B_INDEX_STAGE_OR_PATH_INVALID');
  return Object.freeze({mode:match[1],sha:match[2],path:match[4]});
 });
 if(new Set(entries.map(x=>x.path)).size!==entries.length)throw Error('V5B_INDEX_DUPLICATE_PATH');
 return entries;
}
export function qualifyWorkingTreeDifference(p,indexSha,workingSha){
 if(!isPath(p)||!/^[a-f0-9]{40}$/.test(indexSha)||!/^[a-f0-9]{40}$/.test(workingSha))
  return Object.freeze({ok:false,edge:'V5B_WORKTREE_INPUT_INVALID'});
 if(indexSha===workingSha)return Object.freeze({ok:true,status:'SAME_AS_INDEX'});
 if(/^artifacts\/qualification\/[a-zA-Z0-9._/-]+\.json$/.test(p))
  return Object.freeze({ok:true,status:'TEST_GENERATED_EVIDENCE_DIFFERENT_FROM_COMMITTED_BLOB',
   provenance:'INDEX_SHA_ONLY',evidence_claim:'WORKTREE_BYTE_CHANGE_NOT_NEW_OWNER_RECEIPT'});
 return Object.freeze({ok:false,edge:'V5B_TRACKED_SOURCE_DIRTY'});
}
/** Baseline history is immutable; runner retirement is a reviewed candidate, not approval. */
export function auditWorkflowRetirements(baselinePaths,livePaths,retention,trackedPaths){
 const errors=[],before=new Set(baselinePaths),live=new Set(livePaths),tracked=new Set(trackedPaths),map=retention?.superseded_workflows||{},retired=Object.keys(map);
 for(const p of retired){
  const r=map[p];
  if(!before.has(p)||live.has(p)||!retention?.paths?.includes(p))errors.push('INVALID_WORKFLOW_RETIREMENT:'+p);
  if(!r||typeof r.reason!=='string'||r.reason.length<60||!Array.isArray(r.replacements)||!r.replacements.length||!Array.isArray(r.tests)||!r.tests.length||!/^[A-Z][A-Z0-9_]*$/.test(r.status||''))errors.push('UNREVIEWABLE_WORKFLOW_RETIREMENT:'+p);
  for(const successor of r?.replacements||[])if(successor===p||!live.has(successor)||Object.hasOwn(map,successor))errors.push('REPLACEMENT_NOT_ACTIVE:'+p+':'+successor);
  for(const suite of r?.tests||[])if(!tracked.has(suite))errors.push('RETIRED_WORKFLOW_TEST_MISSING:'+p+':'+suite);
 }
 for(const p of before)if(!live.has(p)&&!Object.hasOwn(map,p))errors.push('UNREGISTERED_WORKFLOW_REMOVAL:'+p);
 const introduced=[...live].filter(p=>!before.has(p));
 return {errors,retired:retired.sort(),introduced,expected_live_count:before.size-retired.length+introduced.length};
}
/** Explicitly chain distinct candidate deltas; same-main PR slices are not human approval. */
export function qualifyRegisterSuccession(prior,next){
 if(!prior||!next||prior.operation==='REMOVE'||next.operation!=='MODIFY')return false;
 if(next.register===REGISTER||next.register===prior.register||
    next.supersedes_register!==prior.register||
    next.supersedes_source_main!==prior.source_main||
    prior.human_review!=='REVIEW_REQUIRED'||next.human_review!=='REVIEW_REQUIRED')return false;
 // Same source_main occurs when two PR commits share a single main base.
 // Explicit candidate lineage is necessary, but still no human signoff is inferred.
 return next.source_main!==prior.source_main||
  next.same_source_main_change==='EXPLICIT_REVIEW_REQUIRED_PR_SLICE';
}
export function auditRepository(){
 const base=json(INVENTORY),changes=json(REGISTER),retention=json('contracts/v1-workflow-retention.json');
 const contract=json(DOD),errors=[];
 if(base.schema!=='ikant-v5b-baseline-inventory/v1'||contract.schema!=='ikant-v5b-repository-governance-dod/v1')errors.push('BAD_CONTRACT');
 if(base.rows.length!==base.source_paths||base.workflows!==121||base.human_signoffs!==0)errors.push('BASELINE_INVARIANT');
 const old=new Map();for(const row of base.rows){
  if(!isPath(row.path)||old.has(row.path)||! /^[a-f0-9]{40}$/.test(row.git_blob_sha1)||
   row.provisional_role!==provisionalRole(row.path)||row.review!=='UNREVIEWED')errors.push('BASELINE_BAD_ROW:'+row.path);
  old.set(row.path,row);
 }
 const staged=parseStagedGitEntries(git('ls-files','--stage','-z'));
 const paths=staged.map(x=>x.path).sort();
 const indexShas=new Map(staged.map(x=>[x.path,x.sha]));
 const now=new Set(paths),seen=new Set(),wfs=[];
 const introduced=[],missing=[],changed=[],same=[],worktreeGenerated=[],worktreeSourceDirty=[];
 if(git('diff','--cached','--name-only').length)errors.push('V5B_STAGED_INDEX_DIFFERS_FROM_HEAD');
 const permitted=new Map();
 const extensions=paths.filter(p=>/^governance\/changes\/[a-z0-9_-]+\.json$/.test(p));
 const registers=[{name:REGISTER,doc:changes}];
 for(const p of extensions){
  try{
   const doc=json(p);
   if(doc.schema!=='ikant-v5b-change-extension/v1'||doc.self_path!==p||
      !/^[a-f0-9]{40}$/.test(doc.source_main||'')||
      !Array.isArray(doc.paths)||!doc.paths.some(x=>x.path===p&&x.operation==='ADD'))
     errors.push('V5B_INVALID_EXTENSION:'+p);
   else registers.push({name:p,doc});
  }catch{errors.push('V5B_EXTENSION_UNREADABLE:'+p);}
 }
 for(const {name,doc} of registers)for(const row of doc.paths){
  if(!isPath(row.path)||!['ADD','MODIFY','REMOVE'].includes(row.operation)||
    !['REVIEW_REQUIRED','PROVISIONAL'].includes(row.human_review)||
    typeof row.reason!=='string'||row.reason.length<16){
   errors.push('BAD_CHANGE_DECLARATION:'+name+':'+row.path);continue;
  }
  const prior=permitted.get(row.path);
  const next={...row,register:name,source_main:doc.source_main||changes.baseline_commit};
  if(prior){
   const initialExtension=prior.operation==='ADD'&&prior.register===REGISTER&&
    row.operation==='MODIFY'&&name!==REGISTER;
   const successor=qualifyRegisterSuccession(prior,next);
   if(!initialExtension&&!successor)errors.push('V5B_CONFLICTING_DELTA:'+row.path);
   else {
    // Keep baseline ADD/MODIFY classification intact for live inventory audit.
    // Update only the latest reviewed declaration for successive slices.
    permitted.set(row.path,{...prior,register:name,source_main:next.source_main,
     human_review:row.human_review});
   }
  }else permitted.set(row.path,next);
 }
 const refMap=new Map(), unresolved=[],relativeMissing=[];let textEdges=0,jsFiles=0;
 for(const p of paths){
  if(seen.has(p))errors.push('DUPLICATE_TRACKED:'+p);seen.add(p);
  const bytes=read(p),digest=indexShas.get(p),oldRow=old.get(p);
  const worktree=qualifyWorkingTreeDifference(p,digest,sha1Blob(bytes));
  if(!worktree.ok){worktreeSourceDirty.push(p);errors.push(worktree.edge+':'+p);}
  else if(worktree.status==='TEST_GENERATED_EVIDENCE_DIFFERENT_FROM_COMMITTED_BLOB')worktreeGenerated.push(p);
  if(!oldRow){introduced.push(p);if(permitted.get(p)?.operation!=='ADD')errors.push('UNREGISTERED_ADDITION:'+p);}
  else if(digest!==oldRow.git_blob_sha1){changed.push(p);if(permitted.get(p)?.operation!=='MODIFY')errors.push('UNREGISTERED_MODIFICATION:'+p);}
  else same.push(p);
  if(p.startsWith('.github/workflows/')){
   wfs.push({path:p,blob_sha1:digest,...classifyWorkflow(bytes.toString('utf8'))});
  }
  if(/\.(?:mjs|cjs|js|ts|tsx)$/.test(p)){
   jsFiles++;const src=bytes.toString('utf8');
   const refs=[...src.matchAll(/(?:\bfrom\s*|\bimport\s*\(|\brequire\s*\()\s*['"]([^'"]+)['"]/g)];
   for(const m of refs){const dest=m[1];if(!dest.startsWith('.'))continue;
    const normalized=path.posix.normalize(path.posix.join(path.posix.dirname(p),dest));
    const candidates=[normalized,normalized+'.mjs',normalized+'.js',normalized+'/index.mjs'];
    const target=candidates.find(v=>now.has(v)); // graph is completed against tracked set in postpass
    (refMap.get(p)||refMap.set(p,[]).get(p)).push({to:target||normalized,possible:candidates,kind:'LITERAL_RELATIVE'});
    textEdges++;
   }
   const dynamics=[...src.matchAll(/\bimport\s*\((?!\s*['"])/g),...src.matchAll(/pathToFileURL\s*\(/g)];
   if(dynamics.length)unresolved.push({path:p,candidates: dynamics.length,kind:'DYNAMIC_POSSIBLY_UNRESOLVED'});
  }
 }
 const importers=new Map(paths.map(p=>[p,new Set()])),outbound=new Map(paths.map(p=>[p,new Set()]));
 for(const [from,links] of refMap)for(const link of links){
  const resolved=link.possible.find(v=>now.has(v));
  if(resolved){importers.get(resolved).add(from);outbound.get(from).add(resolved);}
  else relativeMissing.push({from,target:link.to});
 }
 const consumerIndex=paths.map(p=>({path:p,
  literal_importers:[...importers.get(p)].sort(),
  literal_dependencies:[...outbound.get(p)].sort(),
  status:importers.get(p).size?'LITERAL_CONSUMER_OBSERVED':'UNKNOWN_NOT_UNUSED',
  interpretation:'HEURISTIC_ONLY_DYNAMIC_AND_DATA_CONSUMERS_NOT_PROVEN',
  human_verified:false}));
 for(const p of old.keys())if(!now.has(p)){missing.push(p);if(permitted.get(p)?.operation!=='REMOVE')errors.push('UNREGISTERED_DELETION:'+p);}
 for(const [p,decision] of permitted)if(decision.operation!=='REMOVE'&&!now.has(p))errors.push('DECLARED_BUT_ABSENT:'+p);
 const migration=auditWorkflowRetirements(base.rows.filter(r=>r.path.startsWith('.github/workflows/')).map(r=>r.path),wfs.map(w=>w.path),retention,paths);
 errors.push(...migration.errors);
 if(wfs.length!==migration.expected_live_count)errors.push('WORKFLOW_COUNT_DRIFT');
 const protectedMissing=retention.paths.filter(p=>!now.has(p)&&!Object.hasOwn(retention.superseded_workflows||{},p));
 if(protectedMissing.length)errors.push('PROTECTED_WORKFLOW_MISSING');
 if(retention.paths.length!==base.retained_workflows||JSON.stringify([...retention.paths].sort())!==JSON.stringify(base.retained_workflow_paths))errors.push('RETENTION_DRIFT');
 // Regex scan is heuristic: unresolved text references are REVIEW debt, not proof of a broken module.\n // Module loader/E2E tests remain the behavioral oracle; never delete based on this count.
 const audit={schema:'ikant-v5b-live-readonly-audit/v1',status:errors.length?'FAIL':'SOURCE_INDEXED_NOT_HUMAN_REVIEWED',
 source_head:base.commit,baseline_tree:base.tree,checked_files:paths.length,baseline_files:old.size,
 same_blob_count:same.length,changed_paths:changed,introduced_paths:introduced,missing_paths:missing,
  change_register_extensions:extensions,git_provenance:'STAGED_BLOB_IDS_MATCH_HEAD_REQUIRED',generated_worktree_evidence_changes:worktreeGenerated,
  tracked_source_worktree_dirty:worktreeSourceDirty,
 provisional_roles:paths.length,human_reviewed_files:0,workflow_count:wfs.length,
 retained_workflows:retention.paths.length,baseline_workflow_count:base.workflows,retired_workflows:migration.retired,protected_workflows_missing:protectedMissing,
 workflows:wfs,consumer_index:consumerIndex,dependency_probe:{js_files:jsFiles,literal_relative_edges:textEdges,
 dynamic_site_candidates:unresolved.length,unresolved_dynamic_candidates:unresolved,
 unresolved_relative_imports:relativeMissing,relative_resolution:'HEURISTIC_REVIEW_REQUIRED_NOT_A_RUNTIME_FAILURE'},required_checks:'UNKNOWN_PROVIDER_NOT_ATTESTED',
 owner_accountability:'HUMAN_OWNER_NOT_INFERRED',product_release:'PRODUCT_NO_GO',
 provider_installation:'UNKNOWN',errors};
 return audit;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=process.argv[2]||'summary';if(!['summary','full'].includes(mode))throw Error('V5B_UNKNOWN_MODE');
 const r=auditRepository();
 const summary=mode==='full'?r:{...r,workflows:undefined,consumer_index:undefined,dependency_probe:{...r.dependency_probe,unresolved_dynamic_candidates:undefined}};
 process.stdout.write(JSON.stringify(summary,null,2)+'\n');if(r.errors.length)process.exitCode=1;
}
