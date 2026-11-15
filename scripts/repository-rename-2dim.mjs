#!/usr/bin/env node
/** Read-only 2D repository-identity/capability protocol. NEVER renames a repository.
 * Its hypothetical READY outcome is a predicate, not GitHub admin authority.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CONTRACT=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/repository-rename-2dim.json'),'utf8'));
const H40=/^[0-9a-f]{40}$/;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const blocked=edge=>Object.freeze({ok:false,kind:'BLOCKED',edge,authority:0,owner_invoked:false,rename_performed:false,active:false});
const safe=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function evaluate2DimRename(candidate){
 const x=candidate;
 if(!safe(x)||!['CUTOVER','POST_RENAME'].includes(x.phase)||x.dry_run!==true)
  return blocked('2DIM_INVALID_INPUT_OR_PHASE');
 if(x.repository_id!==CONTRACT.repo_id||x.repository_id_from_github_api!==true)
  return blocked('2DIM_REPOSITORY_ID_NOT_VERIFIED');
 const wanted=x.phase==='CUTOVER'?CONTRACT.repo_name_from:CONTRACT.repo_name_to;
 if(x.full_name!==wanted||x.unique_canonical_name!==true||x.dual_canonical===true)
  return blocked('2DIM_CANONICAL_IDENTITY_MISMATCH');
 if(!H40.test(x.head||'')||!H40.test(x.tree||'')||
    x.head!==x.pinned_head||x.tree!==x.pinned_tree||x.source_head_fresh!==true)
  return blocked('2DIM_SOURCE_HEAD_TREE_DRIFT');
 if(x.original_owner_invoked===true||x.owner_attempt_ambiguous!==false||
    x.old_receipts_reused!==false||x.replayed_human_acceptance!==false)
  return blocked('2DIM_OWNER_REPLAY_OR_AMBIGUITY');
 if(x.c72_source_migrated!==true||x.original_c72_terms_requalified!==true)
  return blocked('2DIM_C72_TERMS_UNQUALIFIED');
 if(x.first_contact_requalified!==true||x.project_prompt_builder_requalified!==true||
    x.project_source_manifest_requalified!==true)
  return blocked('2DIM_PROJECT_SOURCE_UNQUALIFIED');
 if(x.c87_c125_original_unchanged!==true||x.original_writer_unique!==true)
  return blocked('2DIM_WRITER_OR_VOICE_CHANGED');
 if(x.dynamic_consumers_resolved!==true||x.external_action_reusable_workflow_calls_resolved!==true||
    x.github_pages_packages_deployments_checked!==true||x.webhooks_oauth_checked!==true)
  return blocked('2DIM_EXTERNAL_CONSUMER_OPEN');
 if(x.required_checks_provider_readback!==true||x.original_contract_tests_green!==true||
    x.human_admin_authorization!==true||x.two_independent_engineers!==true)
  return blocked('2DIM_PROVIDER_CHECKS_OR_HUMAN_GATE');
 if(x.phase==='POST_RENAME'){
  if(x.postrename_github_id_reopened!==true||x.postrename_head_tree_preserved!==true)
   return blocked('2DIM_POST_RENAME_IDENTITY_NOT_REOPENED');
  if(x.connected_project_prompt_equivalence_verified!==true||
     x.connector_permissions_reverified!==true||x.new_session_fresh_c72_readback!==true)
   return blocked('2DIM_POST_RENAME_NATIVE_PROOFS_MISSING');
 }
 return Object.freeze({ok:true,kind:x.phase==='CUTOVER'?'DRYRUN_READY_FOR_HUMAN_ADMIN_RENAME':'DRYRUN_POST_VERIFICATION',
  authority:0,owner_invoked:false,rename_performed:false,active:false,provider_readback_not_issued_by_this_function:true});
}
function good(i,phase='POST_RENAME'){
 const hex=hash('2dim-head:'+i).slice(0,40),tree=hash('2dim-tree:'+i).slice(0,40);
 return {phase,dry_run:true,repository_id:CONTRACT.repo_id,repository_id_from_github_api:true,
  full_name:phase==='CUTOVER'?CONTRACT.repo_name_from:CONTRACT.repo_name_to,
  unique_canonical_name:true,dual_canonical:false,head:hex,pinned_head:hex,tree,pinned_tree:tree,source_head_fresh:true,
  original_owner_invoked:false,owner_attempt_ambiguous:false,old_receipts_reused:false,replayed_human_acceptance:false,
  c72_source_migrated:true,original_c72_terms_requalified:true,first_contact_requalified:true,
  project_prompt_builder_requalified:true,project_source_manifest_requalified:true,c87_c125_original_unchanged:true,
  original_writer_unique:true,dynamic_consumers_resolved:true,external_action_reusable_workflow_calls_resolved:true,
  github_pages_packages_deployments_checked:true,webhooks_oauth_checked:true,
  required_checks_provider_readback:true,original_contract_tests_green:true,
  human_admin_authorization:true,two_independent_engineers:true,postrename_github_id_reopened:true,
  postrename_head_tree_preserved:true,connected_project_prompt_equivalence_verified:true,
  connector_permissions_reverified:true,new_session_fresh_c72_readback:true};
}
const NEGATIVE_FAMILIES=[
 (x,i)=>x.repository_id=CONTRACT.repo_id+1+i%9,
 (x,i)=>x.full_name='Luke883i/iKant_EDU'+(i%27+1),
 (x,i)=>x.head=hash('stale:'+i).slice(0,40),
 (x,i)=>x.tree=hash('foreign-tree:'+i).slice(0,40),
 x=>x.source_head_fresh=false,
 x=>x.unique_canonical_name=false,
 x=>x.dual_canonical=true,
 x=>x.original_owner_invoked=true,
 x=>x.owner_attempt_ambiguous=true,
 x=>x.old_receipts_reused=true,
 x=>x.replayed_human_acceptance=true,
 x=>x.c72_source_migrated=false,
 x=>x.original_c72_terms_requalified=false,
 x=>x.first_contact_requalified=false,
 x=>x.project_prompt_builder_requalified=false,
 x=>x.project_source_manifest_requalified=false,
 x=>x.c87_c125_original_unchanged=false,
 x=>x.original_writer_unique=false,
 x=>x.dynamic_consumers_resolved=false,
 x=>x.external_action_reusable_workflow_calls_resolved=false,
 x=>x.github_pages_packages_deployments_checked=false,
 x=>x.webhooks_oauth_checked=false,
 x=>x.required_checks_provider_readback=false,
 x=>x.human_admin_authorization=false,
 x=>x.connected_project_prompt_equivalence_verified=false
];
export function falsify2Dim(){
 const seed='0x2D1A2026',families=NEGATIVE_FAMILIES.length,perFamily=400,failures=[],counts=[];
 const digest=crypto.createHash('sha256');
 for(let f=0;f<families;f++){let rejected=0;for(let i=0;i<perFamily;i++){
  const q=good(100000+f*perFamily+i);NEGATIVE_FAMILIES[f](q,i);
  const result=evaluate2DimRename(q);digest.update(JSON.stringify({f,i,phase:q.phase,expected:'BLOCKED',observed:result.edge})+'\n');
  if(result.ok===false&&result.kind==='BLOCKED'&&result.rename_performed===false)rejected++;
  else failures.push({f,i,result});
 }counts.push(rejected);}
 let controls=0;for(let i=0;i<1000;i++){
  const phase=i%2===0?'CUTOVER':'POST_RENAME';
  const q=good(i,phase),v=evaluate2DimRename(q);
  digest.update(JSON.stringify({positive:i,phase,kind:v.kind})+'\n');
  if(v.ok===true&&v.authority===0&&v.rename_performed===false&&v.owner_invoked===false)controls++;
  else failures.push({positive:i,result:v});
 }
 const report={schema:'ikant-rename-2dim-falsification/v1',seed,source:'DETERMINISTIC_SYNTHETIC_PREDICATE_NOT_NATIVE_RUNTIME',
  negative_families:families,per_family:perFamily,negatives:families*perFamily,
  rejected:counts.reduce((a,b)=>a+b,0),per_family_rejected:counts,positive_controls:1000,positive_controls_passed:controls,
  cases_sha256:digest.digest('hex'),false_authority_claim:false,original_owner_invoked:false,provider_rename_performed:false,
  independent_external_consumers_verified:false,product_release:'PRODUCT_NO_GO'};
 if(failures.length||report.rejected!==10000||controls!==1000)throw Error('2DIM_MUTATION_FAILURE:'+JSON.stringify(failures.slice(0,3)));
 return report;
}
export function preflightReadOnly(){
 const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
 const boot=JSON.parse(read('BOOTSTRAP.json')),admission=JSON.parse(read('ADMISSION.json')),
  orientation=JSON.parse(read('contracts/orientation-capsule.json')),
  catalog=JSON.parse(read('release/catalog.json'));
 const pins={bootstrap:boot.canonical_repository,admission:admission.repository,
  orientation:orientation.canonical_repository,catalog:catalog.source_of_truth?.repository};
 const old=CONTRACT.repo_name_from;const mismatch=Object.entries(pins).filter(([k,v])=>!String(v||'').includes(old));
 let head=null,tree=null;
 try{head=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
 tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:ROOT,encoding:'utf8'}).trim();}catch{}
 const blockedBy=['CANONICAL_SOURCE_STILL_OLD','C72_LINKED_TERMS_BINDINGS_UNMIGRATED',
 'EXTERNAL_ACTION_CONSUMERS_UNATTESTED','CHATGPT_PROJECT_INSTALLED_PROMPT_UNKNOWN',
 'REQUIRED_PROVIDER_AND_HUMAN_CUTOVER_RECEIPTS_UNKNOWN'];
 return {schema:'ikant-rename-2dim-preflight/v1',status:'NOT_READY_FOR_RENAME',
  source_head:head,source_tree:tree,expected_repo_id:CONTRACT.repo_id,
  local_contract_pins:pins,unexpected_old_identity_mismatch:mismatch,
  hard_stops:blockedBy,precommit_only:true,administrator_rename_executed:false,
  native_owner_receipts_attested:false,provider_attested:false,product_release:'PRODUCT_NO_GO'};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const mode=process.argv[2]||'--both';
 if(!['--both','--preflight','--falsify'].includes(mode))throw Error('UNKNOWN_MODE');
 const out={};
 if(mode!=='--falsify')out.preflight=preflightReadOnly();
 if(mode!=='--preflight')out.mutation=falsify2Dim();
 process.stdout.write(JSON.stringify(out,null,2)+'\n');
}
