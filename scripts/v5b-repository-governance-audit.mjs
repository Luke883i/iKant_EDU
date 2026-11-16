#!/usr/bin/env node
/** V5-B engineering audit: all reads; this is neither a release nor an owner/runtime receipt. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {reopenR7SourceEpoch,mapR7SourcePath} from './r7-v13-epoch-bridge.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha256=s=>crypto.createHash('sha256').update(s).digest('hex');
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8',maxBuffer:16_000_000,timeout:30000}).trim();
const read=p=>fs.readFileSync(path.join(ROOT,p));
const json=p=>JSON.parse(read(p).toString('utf8'));
export const INVENTORY='contracts/governance/v5b-baseline-inventory.json';
export const REGISTER='contracts/governance/v5b-change-register.json';
export const DOD='contracts/project-v5b-repository-governance-dod.json';

/** Source-only amendment witness for a prospective C72 version. Historical pins
 * are NEVER overwritten; current blobs qualify only if the existing V5-B
 * register declares exact before/after Git SHA-1 and a new epoch with human
 * review still OPEN. No owner, consent, native source or provider attestation. */
export const C72_SOURCE_EPOCH_REGISTER='contracts/governance/changes/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz-edu-only-original-e2e.json';
const C72_SOURCE_BASE='9efdcb4b5d67e3de52a8805cf52b446dd5ff0857';
const C72_SOURCE_AMENDED=new Set([
 'host/c72-public-mode-admission.mjs',
 'contracts/c72-public-mode-admission-v2.json',
 'BOOTSTRAP.json',
 'project/session-chat/PROMPT.txt',
 'project/edu-oneshell/PROMPT_INNESCO.txt'
]);
export function qualifyRegisteredC72SourceEpoch({path,historicalBlobSha1,observedBlobSha1,registration}={}){
 const failed=edge=>Object.freeze({ok:false,edge,authority:0,owner_invoked:false,native_event_attested:false});
 const sha=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
 if(typeof path!=='string'||!sha(historicalBlobSha1)||!sha(observedBlobSha1))
  return failed('C72_EPOCH_GIT_OBJECTS_INVALID');
 if(historicalBlobSha1===observedBlobSha1)
  return Object.freeze({ok:true,status:'UNCHANGED_HISTORICAL_PIN_AT_CURRENT_HEAD',
    old_sha1:historicalBlobSha1,observed_sha1:observedBlobSha1,amended:false,
    review_attested:false,owner_invoked:false,native_event_attested:false,authority:0});
 if(!C72_SOURCE_AMENDED.has(path))return failed('C72_EPOCH_UNREGISTERED_OWNER_OR_PATH_CHANGE');
 let doc=registration;
 if(doc===undefined){try{doc=json(C72_SOURCE_EPOCH_REGISTER);}catch{return failed('C72_EPOCH_REGISTER_UNREADABLE');}}
 const e=doc?.source_epoch_amendment;
 if(doc?.schema!=='ikant-v5b-change-extension/v1'||
    doc.authority!==0||doc.source_main!==C72_SOURCE_BASE||
    !(doc.self_path===C72_SOURCE_EPOCH_REGISTER||
      (doc.self_path==='governance/changes/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz-edu-only-original-e2e.json'&&
        reopenR7SourceEpoch(doc.self_path,{newPath:C72_SOURCE_EPOCH_REGISTER}).byte_identical===true))||
    doc.release!=='NO_GO'||doc.human_review_completed!==false||
    doc.original_owner_unchanged!==false||
    doc.owner_amendment_scope!=='ORIGINAL_C72_V2_SOURCE_EPOCH_ONLY'||
    doc.historical_receipts_must_remain_pinned!==true||
    doc.mcp_external_owner_unchanged!==true||
    e?.schema!=='ikant-cora-registered-source-epoch-succession/v1'||
    e.baseline_main!==C72_SOURCE_BASE||e.owner!=='C72'||
    e.owner_original_preserved_in_historical_epoch!==true||
    e.previous_receipts_never_upgraded!==true||e.prospective_not_native_approved!==true||
    e.provider_receipt!=='NOT_ATTESTED'||e.owner_invoked!==false||
    e.readback_level!=='GIT_SOURCE_ONLY'||e.independent_engineering_reviews!=='NOT_ATTESTED'||
    e.mcp_remains_independent!==true)
  return failed('C72_EPOCH_BOUNDARY_OR_STATUS_INVALID');
 const rows=doc.paths?.filter(x=>x.path===path)||[];
 const row=rows.length===1?rows[0]:null;
 if(!row||row.operation!=='MODIFY'||row.human_review!=='REVIEW_REQUIRED'||
    row.original_source_blob_sha1!==historicalBlobSha1||
    row.prospective_source_blob_sha1!==observedBlobSha1)
  return failed('C72_EPOCH_EXACT_SOURCE_BLOB_NOT_REGISTERED');
 return Object.freeze({ok:true,status:'PROSPECTIVE_C72_SOURCE_ONLY_REVIEW_REQUIRED',
   amended:true,path,old_sha1:historicalBlobSha1,observed_sha1:observedBlobSha1,
   baseline_main:C72_SOURCE_BASE,
   historical_blob_reopened_in_current_epoch:false,
   historical_receipt_reusable:false,review_attested:false,
   owner_invoked:false,native_event_attested:false,provider_attested:false,
   authority:0});
}

/** Separate C135 historical source rebind from C72's original consent contract.
 * Exact one-line allowlist expansion, source-only and REVIEW_REQUIRED; never an
 * original owner approval or a new C72 authorization. */
export function qualifyR7OwnerSourceEpoch({path,historicalBlobSha1,observedBlobSha1}={}){
 if(path!=='host/c135-edu-v2-owner.mjs')
  return qualifyRegisteredC72SourceEpoch({path,historicalBlobSha1,observedBlobSha1});
 const denied=edge=>Object.freeze({ok:false,edge,authority:0,owner_invoked:false,native_event_attested:false});
 const before='e8bbe5741375e5d51f1caa02fdba2ecc5f6c049d';
 const after='7eacaba74aa4984b1b40fb7c996fd25c7c30986f';
 if(historicalBlobSha1!==before||observedBlobSha1!==after)return denied('C135_REBIND_SHA_NOT_EXACT');
 try{
  const source=git('show','c9a1179283958a7ffb30d1ad8c08af69d34fff0c:'+path);
  const current=git('show','HEAD:'+path);
  const oldString="!/^artifacts\\/qualification\\/[A-Za-z0-9_.-]+\\.json$/.test(p)";
  const newString="! /^(?:artifacts|tests\\/artifacts)\\/qualification\\/[A-Za-z0-9_.-]+\\.json$/.test(p)".replace('! ','!');
  if(source.split(oldString).length!==2||source.replace(oldString,newString)!==current||
     git('rev-parse','c9a1179283958a7ffb30d1ad8c08af69d34fff0c:'+path)!==before||
     git('rev-parse','7fa91861f6bd4a9760ad4ab69c0cdd048d9cab7c:'+path)!==after)
   return denied('C135_REBIND_NOT_SINGLE_EXACT_PATH_CHANGE');
  return Object.freeze({ok:true,status:'PROSPECTIVE_C135_SOURCE_REBIND_REVIEW_REQUIRED',
   old_sha1:before,observed_sha1:after,path,amended:true,
   source_only:true,historical_receipt_reusable:false,review_attested:false,
   owner_invoked:false,native_event_attested:false,provider_attested:false,authority:0});
 }catch{return denied('C135_SOURCE_PROVENANCE_UNREADABLE');}
}
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
/** Canonical Git blob SHA-1. Header length counts raw bytes, never JS code units. */
export function gitBlobSha1(input){
 if(typeof input!=='string'&&!Buffer.isBuffer(input)&&!(input instanceof Uint8Array))
  throw new TypeError('V5B_GIT_BLOB_INPUT_TYPE');
 const bytes=typeof input==='string'?Buffer.from(input,'utf8'):
  Buffer.from(input.buffer,input.byteOffset,input.byteLength);
 return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.byteLength+String.fromCharCode(0)))
  .update(bytes).digest('hex');
}
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
 if(/^(?:artifacts|tests\/artifacts)\/qualification\/[a-zA-Z0-9._/-]+\.json$/.test(p))
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
 if(!prior||!next||!['MODIFY','ADD'].includes(prior.operation)||next.operation!=='MODIFY')return false;
 // A file initially ADDED by a prior PR may evolve only through an explicitly pinned
 // next main epoch; same-epoch self-succession would launder an unreviewed addition.
 if(prior.operation==='ADD'&&next.source_main===prior.source_main)return false;
 if(next.register===REGISTER||next.register===prior.register||
    next.supersedes_register!==prior.register||
    next.supersedes_source_main!==prior.source_main||
    prior.human_review!=='REVIEW_REQUIRED'||next.human_review!=='REVIEW_REQUIRED')return false;
 // Same source_main occurs when two PR commits share a single main base.
 // Explicit candidate lineage is necessary, but still no human signoff is inferred.
 return next.source_main!==prior.source_main||
  next.same_source_main_change==='EXPLICIT_REVIEW_REQUIRED_PR_SLICE';
}
/** V13 prospective, source-only translation of V5-B's ORIGINAL inventory to the
 * V11/V12 seven-root epoch. No historic register is modified. A review-required
 * candidate is not an owner or provider signoff. This is fail-closed on any
 * unregistered path or content delta relative to the frozen V12 parent.
 */
export function qualifyV13V5BEpochProjection(){
 const fail=edge=>({ok:false,edge,authority:0,product_go:false});
 try{
  const c=json('contracts/r7-v13-causal-reticulum.json'),b=c?.source;
  if(c?.schema!=='ikant-r7-v13-causal-reticulum/v1'||c.authority!==0||
    c.product_go!==false||b?.v10_commit!=='c9a1179283958a7ffb30d1ad8c08af69d34fff0c'||
    b.v10_tree!=='9b6b80d7fe2f8536b9ce8633e09810fc87b81c28'||
    b.v12_commit!=='7fa91861f6bd4a9760ad4ab69c0cdd048d9cab7c'||
    b.v12_tree!=='aa4176e537e047589523d3c0fcbd2420e7439b8f')
    return fail('V13_CONTRACT_OR_EPOCH_PIN_INVALID');
  if(git('rev-parse',b.v10_commit+'^{tree}')!==b.v10_tree||
     git('rev-parse',b.v12_commit+'^{tree}')!==b.v12_tree)
    return fail('V13_HISTORIC_GIT_TREE_MISMATCH');
  git('merge-base','--is-ancestor',b.v12_commit,'HEAD');
  const p=json('contracts/r7-v11-seven-root-contract.json');
  if(git('show','30b8021e1f6659acd79cc96d3bc106a1742697e4:contracts/r7-v11-seven-root-contract.json')!==
     fs.readFileSync(path.join(ROOT,'contracts/r7-v11-seven-root-contract.json'),'utf8').trim())
    return fail('V13_MOVE_PLAN_CHANGED');
  function index(ref){
   const raw=execFileSync('git',['ls-tree','-r','-z',ref],{cwd:ROOT,maxBuffer:32_000_000});
   const result=new Map();
   for(const e of raw.toString('utf8').split('\0').filter(Boolean)){
    const m=/^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/u.exec(e);
    if(!m||result.has(m[3]))return null;
    result.set(m[3],{mode:m[1],sha:m[2]});
   }return result;
  }
  const prior=index(b.v10_commit),v12=index(b.v12_commit),current=index('HEAD');
  if(!prior||!v12||!current)return fail('V13_GIT_OBJECT_INDEX_INVALID');
  const mapping=new Map();
  for(const [old,blob] of prior){
   const to=mapR7SourcePath(old,p);
   if(!to||mapping.has(to))return fail('V13_MOVE_COLLISION');
   const now=current.get(to);
   if(!now||now.mode!==blob.mode)return fail('V13_ORIGINAL_MAPPED_SOURCE_LOST_OR_MODE_CHANGED:'+old);
   if(old.startsWith('governance/')&&now.sha!==blob.sha)return fail('V13_HISTORIC_GOVERNANCE_MODIFIED:'+old);
   mapping.set(to,old);
  }
  if(prior.size!==1630||[...prior.keys()].filter(k=>k.startsWith('governance/')).length!==50)
    return fail('V13_HISTORIC_CARDINALITY_DRIFT');
  const newV12=new Set(b.v12_new_paths),newV13=new Set(b.v13_new_paths);
  if(newV12.size!==5||newV13.size<3||newV13.size!==b.v13_new_paths.length)
    return fail('V13_PROSPECTIVE_ADDITION_CENSUS_INVALID');
  const expected=new Set([...mapping.keys(),...newV12,...newV13]);
  if(expected.size!==current.size||[...expected].some(x=>!current.has(x)))
    return fail('V13_UNDECLARED_CURRENT_FILE');
  if(![...newV12].every(x=>v12.has(x)&&!mapping.has(x))||
    ![...newV13].every(x=>!v12.has(x)))return fail('V13_NEW_FILE_LINEAGE_INVALID');
  const deltas=new Set(b.v13_modifications||[]);
  if(deltas.size!==b.v13_modifications?.length)return fail('V13_DELTA_DUPLICATE');
  const delta=[];
  for(const [p,blob] of current){
   if(v12.get(p)?.sha!==blob.sha||v12.get(p)?.mode!==blob.mode)delta.push(p);
  }
  for(const p of v12.keys())if(!current.has(p))delta.push(p);
  const found=new Set(delta);
  if(found.size!==delta.length||found.size!==deltas.size+newV13.size||
     [...deltas,...newV13].some(p=>!found.has(p)))return fail('V13_UNDECLARED_SOURCE_DELTA');
  if(git('status','--porcelain','--untracked-files=no')!=='')return fail('V13_TRACKED_WORKTREE_DIRTY');
  const historicLegacy=new Set(b.preexisting_v10_unregistered||[]);
  if(historicLegacy.size!==5||![...historicLegacy].every(p=>prior.has(p)))
    return fail('V13_PREEXISTING_DEBT_NOT_PINNED');
  if(git('ls-files','-z').split('\0').filter(Boolean).length!==current.size)
    return fail('V13_INDEX_TREE_MISMATCH');
  return {ok:true,status:'V13_SOURCE_PROSPECTIVE_REVIEW_REQUIRED',
    exact_historic_source_count:prior.size,current_count:current.size,
    mapped: mapping.size,modified_since_v12:deltas.size,
    new_since_v12:newV13.size,preexisting_v10_debts:historicLegacy.size,
    historic_governance_blobs_50:true,
    human_review:'NOT_ATTESTED',ci:'NOT_RUN',provider:'NOT_ATTESTED',authority:0,product_go:false};
 }catch(e){return fail('V13_EPOCH_PROJECTION_UNREADABLE:'+String(e).slice(0,120));}
}
/** PR249: read-only prospective successor of the V13 Git SOURCE epoch.
 * Source-only qualification is explicit, content-addressed, and independently
 * revisitable. Legacy V5-B registers and receipts are never rewritten.
 * This does NOT confer owner review, CI, provider truth, or product GO.
 */

/** PR249 CI successor: source-only exact checkout repair. Historic review stays OPEN. */
const PR249_CHECKOUT_ANCHOR='7cd95a485f71008dd6aa7c3da6aa76bd0f3ead65';
const PR249_CHECKOUT_TREE='f4c24eb23641fa08c6262fc5fb5a57223a2f3c8a';
const PR249_CHECKOUT_WORKFLOWS=[
 ".github/workflows/c20-dual-profile-session-chat.yml",
 ".github/workflows/c24-canonical-boundary.yml",
 ".github/workflows/c25-executor-data-plane.yml",
 ".github/workflows/c51-supersystem-runtime.yml",
 ".github/workflows/c59-single-composition.yml",
 ".github/workflows/c62-evidence-runtime-cut.yml",
 ".github/workflows/ci.yml",
 ".github/workflows/host-negative-semantic-r3.yml",
 ".github/workflows/lib0-embedded-nuance.yml",
 ".github/workflows/mcp-standalone-assurance.yml",
 ".github/workflows/oneshell-v1-qualification.yml",
 ".github/workflows/project-oneshell-prompt.yml",
 ".github/workflows/readme-compat-diagnostics.yml"
];
function r7Pr249CheckoutPatch(s){
 const lines=s.split("\n"),out=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i];out.push(line);
  const match=line.match(/^(\s*)- uses: actions\/checkout@v4\s*$/);
  if(!match)continue;
  const indent=match[1];
  if(lines[i+1]===indent+"  with:"){
   out.push(lines[++i]);
   const part=lines.slice(i+1,i+7).join("\n");
   if(!new RegExp("^"+indent+"    fetch-depth:","m").test(part))out.push(indent+"    fetch-depth: 0");
   if(!new RegExp("^"+indent+"    ref:","m").test(part))out.push(indent+"    ref: ${{ github.event.pull_request.head.sha || github.sha }}");
  }else out.push(indent+"  with:",indent+"    ref: ${{ github.event.pull_request.head.sha || github.sha }}",indent+"    fetch-depth: 0");
 }
 return out.join("\n");
}
const PR249_RECEIPT_PINS=[["tests/artifacts/qualification/c51-candidate-blob-manifest.json","0f11d508b274242fc82900415caa56a893efa94b"],["tests/artifacts/qualification/c51-supersystem-dod.json","090aa9f6fecde747f6a9b60af45fa7cba73496d3"],["tests/artifacts/qualification/c52-candidate-blob-manifest.json","c148208a24bb3d8b7e1152248db2afd75e5060ce"],["tests/artifacts/qualification/c52-runtime-physical-closure-dod.json","0c0f777063c10412f287e171bad2e8357c8cf19a"]];
function qualifyPr249CheckoutRepairEpoch(){
 const fail=edge=>({ok:false,edge,authority:0,product_go:false});
 try{
  if(git('rev-parse',PR249_CHECKOUT_ANCHOR+'^{tree}')!==PR249_CHECKOUT_TREE)
   return fail('PR249_REPAIR_ANCHOR_TREE_CHANGED');
  git('merge-base','--is-ancestor',PR249_CHECKOUT_ANCHOR,'HEAD');
  const delta=git('diff','--name-status','--no-renames',PR249_CHECKOUT_ANCHOR,'HEAD').split('\n').filter(Boolean);
  const paths=delta.map(row=>{const m=/^M\t(.+)$/.exec(row);return m?.[1]||null;});
  const permitted=[...PR249_CHECKOUT_WORKFLOWS,'scripts/v5b-repository-governance-audit.mjs','tests/test_oneshell_v1_materialization.py',...PR249_RECEIPT_PINS.map(x=>x[0])].sort();
  if(paths.includes(null)||JSON.stringify([...paths].sort())!==JSON.stringify(permitted))
   return fail('PR249_REPAIR_NOT_EXACT_13_CHECKOUTS_AND_AUDIT');
  for(const p of PR249_CHECKOUT_WORKFLOWS){
   const before=git('show',PR249_CHECKOUT_ANCHOR+':'+p);
   const after=git('show','HEAD:'+p);
   if(after!==r7Pr249CheckoutPatch(before)||after===before)
    return fail('PR249_CHECKOUT_UNEXPECTED_DELTA:'+p);
  }
  for(const [p,pin] of PR249_RECEIPT_PINS)if(git('rev-parse','HEAD:'+p)!==pin)
   return fail('PR249_RECEIPT_BLOB_PIN_DRIFT:'+p);
  if(git('rev-parse','HEAD:tests/test_oneshell_v1_materialization.py')!=='37c28e69fee7ffe2340d27c0522dd2d0ea513b15')
   return fail('PR249_ONESHELL_FIX_BLOB_DRIFT');
  if(git('diff','--cached','--name-only'))return fail('PR249_REPAIR_STAGED_INDEX_CHANGED');
  const dirty=git('diff','--name-only').split('\n').filter(Boolean);
  if(dirty.some(p=>!/^tests\/artifacts\/qualification\/[A-Za-z0-9_.-]+\.json$/.test(p)))
   return fail('PR249_REPAIR_NON_EVIDENCE_WORKTREE_DIRTY');
  return {ok:true,status:'PR249_CHECKOUT_REPAIR_SOURCE_ONLY_REVIEW_REQUIRED',
   anchor:PR249_CHECKOUT_ANCHOR,workflow_changes:PR249_CHECKOUT_WORKFLOWS.length,
   original_governance_unchanged:true,owner_review:'NOT_ATTESTED',
   native_equivalence:'NOT_ATTESTED',provider:'NOT_ATTESTED',authority:0,product_go:false};
 }catch(e){return fail('PR249_REPAIR_SOURCE_UNREADABLE:'+String(e).slice(0,140));}
}

export function qualifyPr249SourceEpoch(){
 if(git('rev-parse','HEAD')!==PR249_CHECKOUT_ANCHOR)return qualifyPr249CheckoutRepairEpoch();
 const fail=edge=>({ok:false,edge,authority:0,product_go:false});
 try{
  const c=json('contracts/r7-pr249-founding-contract.json'),e=c?.pr249_epoch;
  if(c.schema!=='ikant-r7-pr249-founding-contract/v1'||c.authority!==0||
     c.product_go!==false||e?.schema!=='ikant-r7-pr249-source-successor/v1'||
     e.review_required!==true||e.product_go!==false||
     e.source_commit!=='86e20abb714fa4000352b61a0c0abf8795775318'||
     e.source_tree!=='07f135d6d54ff69b78cc9e7215daa0bdafa9f84c')
   return fail('PR249_SOURCE_CONTRACT_INVALID');
  if(git('rev-parse',e.source_commit+'^{tree}')!==e.source_tree)return fail('PR249_SOURCE_TREE_DRIFT');
  git('merge-base','--is-ancestor',e.source_commit,'HEAD');
  function listing(rev){
   const out=new Map();
   for(const line of execFileSync('git',['ls-tree','-r','-z',rev],{cwd:ROOT,maxBuffer:64_000_000}).toString('utf8').split('\0').filter(Boolean)){
    const m=/^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/u.exec(line);
    if(!m||out.has(m[3]))return null;
    out.set(m[3],{mode:m[1],sha:m[2]});
   }
   return out;
  }
  const base=listing(e.source_commit),live=listing('HEAD');
  if(!base||!live||base.size!==1639)return fail('PR249_SOURCE_INDEX_INVALID');
  const added=[...live.keys()].filter(x=>!base.has(x)).sort();
  const modified=[...base.keys()].filter(x=>!live.has(x)||
    live.get(x).sha!==base.get(x).sha||live.get(x).mode!==base.get(x).mode).sort();
  const fixedAdd=[
   'contracts/r7-pr249-founding-contract.json',
   'project/docs/R7_PR249_FOUNDING_GUIDE.md',
   'scripts/r7-pr249-falsify.mjs',
   'scripts/r7-pr249-physical-gate.py',
   'tests/r7-pr249-founding-contract.test.mjs',
   'tests/r7-pr249-physical-gate.test.mjs'].sort();
  const fixedMod=['.github/workflows/c53-physical-closure-hardening.yml',
   '.github/workflows/project-session-repo-first.yml',
   'scripts/cora-minimal-absorption.mjs',
   'project/docs/IKANT_DOCUMENT_ATLAS.md',
   'project/docs/START_HERE.md','scripts/v5b-repository-governance-audit.mjs',
   'tests/artifacts/qualification/c51-candidate-blob-manifest.json',
   'tests/artifacts/qualification/c51-supersystem-dod.json',
   'tests/artifacts/qualification/c52-candidate-blob-manifest.json',
   'tests/artifacts/qualification/c52-runtime-physical-closure-dod.json'].sort();
  if(JSON.stringify(added)!==JSON.stringify(fixedAdd)||
     JSON.stringify(modified)!==JSON.stringify(fixedMod)||
     JSON.stringify(e.additions)!==JSON.stringify(fixedAdd)||
     JSON.stringify(e.modified_originals.map(x=>x.path).sort())!==JSON.stringify(fixedMod))
   return fail('PR249_PROSPECTIVE_DELTA_NOT_EXACT');
  for(const row of e.modified_originals){
   const old=base.get(row.path),now=live.get(row.path);
   if(!old||!now||old.mode!==now.mode||old.sha!==row.original_sha||
     now.sha!==row.prospective_sha)return fail('PR249_MODIFICATION_PIN_DRIFT:'+row.path);
  }
  for(const name of added){
   const row=live.get(name);
   if(row?.mode!=='100644'||(name!==fixedAdd[0]&&
      row.sha!==e.addition_pins?.[name]))
    return fail('PR249_ADDITION_PIN_DRIFT:'+name);
  }
  for(const [name,old] of base)if(name.startsWith('contracts/governance/')&&
     live.get(name)?.sha!==old.sha)return fail('PR249_GOVERNANCE_CHANGED:'+name);
  if(git('status','--porcelain','--untracked-files=no')!=='')return fail('PR249_DIRTY_WORKTREE');
  return {ok:true,status:'PR249_SOURCE_SUCCESSOR_REVIEW_REQUIRED',
   source_count:base.size,new_paths:added.length,modified_originals:modified.length,
   legacy_governance_unchanged:true,review:'NOT_ATTESTED',provider:'NOT_ATTESTED',
   authority:0,product_go:false};
 }catch(ex){return fail('PR249_SOURCE_UNREADABLE:'+String(ex).slice(0,140));}
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
  const worktree=qualifyWorkingTreeDifference(p,digest,gitBlobSha1(bytes));
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
 // V13 never rewrites old V5-B source documents. It reclassifies ONLY the
 // path/mode deltas uniquely explained by the pinned V10->V12->V13 lineage.
 // Retain the legacy error evidence separately so the projection is auditable.
 const historicalProjection=qualifyV13V5BEpochProjection();
 const scoped=historicalProjection.ok?historicalProjection:qualifyPr249SourceEpoch();
 if(scoped.ok&&errors.every(x=>/^(?:UNREGISTERED_MODIFICATION|UNREGISTERED_ADDITION|UNREGISTERED_DELETION|DECLARED_BUT_ABSENT):/.test(x))){
  audit.original_epoch_errors=errors;
  audit.source_epoch_projection=scoped;
  audit.errors=[];
  audit.status='SOURCE_INDEXED_NOT_HUMAN_REVIEWED';
 }else audit.source_epoch_projection=scoped;
 return audit;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=process.argv[2]||'summary';if(!['summary','full'].includes(mode))throw Error('V5B_UNKNOWN_MODE');
 const r=auditRepository();
 const summary=mode==='full'?r:{...r,workflows:undefined,consumer_index:undefined,dependency_probe:{...r.dependency_probe,unresolved_dynamic_candidates:undefined}};
 process.stdout.write(JSON.stringify(summary,null,2)+'\n');if(r.errors.length)process.exitCode=1;
}
