/**
 * Read-only CORA method adoption for iKant EDU. Not CORA's original CLI, an
 * iKant owner, an installation, a production approval or an automatic cleanup.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SCHEMA='ikant-cora-minimal-absorption/v1';
const OWNERS=Object.freeze({
 C72:'host/c72-public-mode-admission.mjs',
 C135:'host/c135-edu-v2-owner.mjs',
 C87:'host/c87-durable-ledger.mjs',
 C125_S03:'host/c125-output-port.mjs'
});
const FALSE_GUARDS=Object.freeze([
 'new_runtime_owner','new_cognition_owner','new_ledger_writer','new_ci_workflow',
 'automatic_delete_or_archive','automatic_workflow_retirement',
 'automatic_merge_or_release','reuse_prior_consent_or_receipts',
 'ci_or_git_proves_native_active','cora_is_ikant_owner'
]);
const DOMAINS=Object.freeze(['R','S','P']);
const PHASES=Object.freeze([
 'PIN_BASE_AND_CORA_SOURCE','CENSUS_AND_CLASSIFY','SELECT_SINGLE_REVERSIBLE_SLICE',
 'FALSIFY_REAL_SOURCE_AND_NEGATIVE_CASES','RUN_EXISTING_CI_AT_EXACT_HEAD',
 'REOPEN_GIT_AND_RUNTIME_EVIDENCE','INDEPENDENT_REVIEW','POSTMERGE_REVALIDATE'
]);
const METHODS=Object.freeze({
 R:['git-provenance','artifact-semantics','archaeology','workflow-intelligence'],
 S:['product-ontology','debt-forensics','agent-assurance','reticular-DoD','development-gates'],
 P:['documentation-assurance','runtime-observation','source-runtime-fusion','release-verification','process-catalog']
});
const DOMAIN_REFS=Object.freeze({
 R:['scripts/v5b-repository-governance-audit.mjs','governance/v5b-change-register.json'],
 S:['contracts/project-review-readiness-v1.json','scripts/project-review-callsites.mjs'],
 P:['contracts/c72-product-value-promise.json','contracts/project-oneshell-do-d.json']
});
const REFS=Object.freeze(Object.values(DOMAIN_REFS).flat());
const h40=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const stop=(edge)=>({ok:false,edge,authority:0,active:false,product_go:false,permission_to_change:false});
export function qualifyCoraAbsorption(c){
 if(!obj(c)||c.schema!==SCHEMA||c.authority!==0||
    c.status!=='ENGINEERING_CANDIDATE_NOT_PRODUCT_GO'||
    typeof c.intent!=='string'||c.intent.length<60)return stop('CORA_CONTRACT_IDENTITY');
 if(!obj(c.cora_source)||c.cora_source.repository!=='Luke883i/cora'||
    !h40(c.cora_source.commit)||c.cora_source.method_contract!=='cora.method-atlas.json'||
    c.cora_source.adoption!=='METHOD_REFERENCE_ONLY_NO_CORA_INSTALLATION_OR_RUNTIME_AUTHORITY')
   return stop('CORA_UPSTREAM_UNBOUND');
 if(!obj(c.target_source)||c.target_source.repository!=='Luke883i/iKant_EDU'||
    !h40(c.target_source.baseline_main)||c.target_source.baseline_is_not_current_head_forever!==true)
   return stop('CORA_TARGET_UNBOUND');
 if(!obj(c.existing_owners)||!same(c.existing_owners,OWNERS))return stop('CORA_OWNER_SUBSTITUTION');
 if(!obj(c.guardrails)||!same(Object.keys(c.guardrails).sort(),[...FALSE_GUARDS].sort())||
    FALSE_GUARDS.some(k=>c.guardrails[k]!==false))return stop('CORA_UNAUTHORIZED_EFFECT_OR_PROMOTION');
 if(!Array.isArray(c.domains)||!same(c.domains.map(x=>x?.id),DOMAINS))return stop('CORA_DOMAIN_COLLAPSE');
 const methods=[];
 for(const d of c.domains){
  if(!obj(d)||!['REPOSITORY','SOFTWARE','PRODUCT'][DOMAINS.indexOf(d.id)]||
     d.name!==['REPOSITORY','SOFTWARE','PRODUCT'][DOMAINS.indexOf(d.id)]||
     !same(d.methods,METHODS[d.id])||!same(d.reuse,DOMAIN_REFS[d.id])||typeof d.minimal_action!=='string'||
     d.minimal_action.length<50||typeof d.falsifier!=='string'||d.falsifier.length<40||
     !Array.isArray(d.done_requires)||d.done_requires.length!==3||
     d.done_requires.some(x=>typeof x!=='string'||x.length<8)||
     d.status!==(d.id==='P'?'BLOCKED_EXTERNAL':'OPEN'))return stop('CORA_DOMAIN_EVIDENCE_OR_FALSIFIER');
  methods.push(...d.methods);
 }
 if(methods.length!==14||new Set(methods).size!==14)return stop('CORA_METHOD_REDUNDANCY_OR_OMISSION');
 if(!same(c.execution_order,PHASES))return stop('CORA_PHASE_GATE_BYPASS');
 if(!obj(c.acceptance)||c.acceptance.source!=='ALL_R_AND_S_OBLIGATIONS_WITH_ORIGINAL_EVIDENCE'||
    c.acceptance.product!=='ALL_R_S_P_AND_EXTERNAL_OBLIGATIONS_WITH_ORIGINAL_EVIDENCE'||
    c.acceptance.aggregation!=='AND_NON_COMPENSATORY'||
    c.acceptance.unobserved!=='UNKNOWN_NOT_PASS'||
    c.acceptance.authorization!=='NONE')return stop('CORA_FALSE_GREEN');
 if(!same(c.evidence_boundary,[
   'GIT_SOURCE','CHECKOUT_TEST','OWNER_RUNTIME','PROVIDER_DELIVERY',
   'INDEPENDENT_USER_VALUE','HUMAN_GOVERNANCE'])||c.current_result!=='NO_RELEASE_CLAIM')
   return stop('CORA_PROOF_LAUNDERING');
 return Object.freeze({ok:true,status:'SOURCE_METHOD_CANDIDATE_ONLY',
  domains:DOMAINS.length,methods:methods.length,authority:0,active:false,
  product_go:false,permission_to_change:false,original_cora_cli_executed:false});
}
export function sourcePathsPresent(c,root=ROOT){
 const result=qualifyCoraAbsorption(c);if(!result.ok)return result;
 const names=[...Object.values(OWNERS),...REFS];
 const missing=names.filter(p=>!fs.existsSync(path.join(root,p)));
 return {ok:missing.length===0,status:missing.length?'SOURCE_PATHS_NOT_OBSERVED':'LOCAL_SOURCE_PATHS_PRESENT_ONLY',
  inspected:names.length,missing,authority:0,active:false,product_go:false,permission_to_change:false};
}

/** PR217 reticular extension: one V5-B source, not a second inventory authority.
 * Git index, commit tree and working bytes are independently reconciled.
 * All owner/accountability and external-delivery columns remain UNKNOWN.
 */
import {execFileSync} from 'node:child_process';
import {auditRepository,parseStagedGitEntries,provisionalRole,qualifyRegisteredC72SourceEpoch} from './v5b-repository-governance-audit.mjs';
const reticularPath='contracts/cora-reticular-hygiene-v1.json';
const reticularIds=[
 'S01','S02','S03','S04','S05','S06','S07','S08','S09',
 'E01','E02','E03','E04',
 'I_DISCOVERY','I_HYGIENE','I_EXTERNAL',
 'G_SOURCE_PREPARED','G_REPOSITORY_STANDARDIZED','G_PRODUCT_QUALIFIED'
];
const expectedEdges={
 I_DISCOVERY:['S01','S02','S03','S04','S05'],
 I_HYGIENE:['S06','S07','S08','S09'],
 I_EXTERNAL:['E01','E02','E03'],
 G_SOURCE_PREPARED:['I_DISCOVERY','I_HYGIENE'],
 G_REPOSITORY_STANDARDIZED:['G_SOURCE_PREPARED','I_EXTERNAL'],
 G_PRODUCT_QUALIFIED:['G_REPOSITORY_STANDARDIZED','E04']
};
const isHash=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8',maxBuffer:32_000_000}).trim();
export function qualifyReticularLattice(c){
 const fail=edge=>({ok:false,edge,authority:0,product_go:false,permission_to_change:false});
 if(!c||typeof c!=='object'||Array.isArray(c)||c.schema!=='ikant-cora-reticular-hygiene/v1'||
    c.authority!==0||c.active!==false||c.product_go!==false||c.retirement_authorized!==false)
   return fail('CORA_LATTICE_IDENTITY');
 if(c.origin?.target!=='Luke883i/iKant_EDU'||!isHash(c.origin?.base_main)||
    c.origin?.cora!=='Luke883i/cora'||c.origin?.cora_head!=='3fdf761167e62cc427b7339fc6c59343c1b0be8f'||
    c.origin?.existing_V5B!=='scripts/v5b-repository-governance-audit.mjs')
   return fail('CORA_SOURCE_EPOCH_UNBOUND');
 if(c.abstract_dod?.logic!=='NON_COMPENSATORY_AND'||
    c.abstract_dod?.unknown!=='BLOCKS_PROMOTION_NOT_EQUIVALENT_TO_UNUSED'||
    !c.abstract_dod?.cleaning?.startsWith('NO_DELETION_WITHOUT_')||
    c.proof_boundary?.authorization!=='NONE'||
    c.proof_boundary?.product!=='BLOCKED_EXTERNAL'||
    c.proof_boundary?.repo_standardization!=='BLOCKED_EXTERNAL'||
    c.release!=='NO_GO')
   return fail('CORA_EVIDENCE_PROMOTION');
 if(!Array.isArray(c.nodes)||c.nodes.length!==reticularIds.length||
    new Set(c.nodes.map(x=>x.id)).size!==reticularIds.length||
    !reticularIds.every(id=>c.nodes.some(x=>x.id===id)))
   return fail('CORA_LATTICE_NODE_COVERAGE');
 const by=new Map(c.nodes.map(x=>[x.id,x]));
 for(const id of reticularIds){
  const n=by.get(id),want=expectedEdges[id]||[];
  if(!n||!Array.isArray(n.depends_on)||JSON.stringify(n.depends_on)!==JSON.stringify(want)||
     typeof n.description!=='string'||n.description.length<20||
     (id.startsWith('E')||id==='I_EXTERNAL'||id.startsWith('G_')&&id!=='G_SOURCE_PREPARED'
       ? n.scope!=='EXTERNAL' : n.scope!=='SOURCE_GIT'))
   return fail('CORA_DAG_EDGE_OR_SCOPE');
  if(id.startsWith('S')&&(!n.falsifier||n.falsifier.length<35))
   return fail('CORA_NO_LOCAL_FALSIFIER');
 }
 if(c.goals?.prepared!=='G_SOURCE_PREPARED'||c.goals?.standardized!=='G_REPOSITORY_STANDARDIZED'||
    c.goals?.product!=='G_PRODUCT_QUALIFIED')
   return fail('CORA_DAG_ROOT_PROMOTION');
 if(c.commits?.git_absolute_minimum!==1||c.commits?.reviewable_semantic_minimum!==3||
    JSON.stringify(c.commits.chain?.map(x=>[x.id,x.depends_on]))!==
    JSON.stringify([['C1',[]],['C2',['C1']],['C3',['C2']]]))
   return fail('CORA_COMMIT_DAG_INVALID');
 if(c.first_slice?.no_deleted_paths!==true||c.first_slice?.no_new_workflow!==true||
    c.first_slice?.no_owner_changes!==true||
    c.first_slice?.workflow_decision!=='RETAIN_PENDING_INDEPENDENT_CONSUMER_REVIEW')
   return fail('CORA_UNAUTHORIZED_RETIREMENT');
 const owners=['host/c72-public-mode-admission.mjs','host/c135-edu-v2-owner.mjs',
  'host/c87-durable-ledger.mjs','host/c125-output-port.mjs'];
 if(JSON.stringify(c.reuse?.owners)!==JSON.stringify(owners)||
    !isHash(c.reuse?.baseline_workflow_tree)||
    !owners.every(p=>isHash(c.reuse?.owner_blob_pins?.[p]))||
    Object.keys(c.reuse?.owner_blob_pins||{}).length!==owners.length||
    c.reuse?.census!=='scripts/v5b-repository-governance-audit.mjs#auditRepository')
   return fail('CORA_OWNER_OR_CENSUS_SUBSTITUTION');
 const evolution=c.reuse.workflow_evolution;
 const exactWorkflowDeltas=[{"path":".github/workflows/docs-ontology-coverage.yml","before":"792fb99a98655cb22c40a7d4002a4c1b147c2843","after":"62d1e83724dcb2d66f933bbdacdd5358dada6c1b"},{"path":".github/workflows/c134-versioned-cognitive-source.yml","before":"78ef8fba75f8587e7f13f04767a9bc9fd981df44","after":"79cebb7bbd85646532cdd9deb5fef3fff2579dca"},{"path":".github/workflows/p1-p7-oneshell-release.yml","before":"1a8d982b6bc45985f77b464f11d6f4f539950f5d","after":"005a5e4666ce5c810d9c075b36a79eb083ab9354"},{"path":".github/workflows/c101-local-cohost.yml","before":"b7ef35bb51caa942bd47c1969fd7de4c51339df7","after":"7d16f6ad04486a7c375e3f4b79d9b061edd1e248"},{"path":".github/workflows/c102-soft-host.yml","before":"8944402f1d0a765075d5480efa1925083e28df86","after":"1bab8ba99a3adb54ce6755ccd9c7b10a7e82295a"},{"path":".github/workflows/c103-host-adapter.yml","before":"8f5349172923f4d6a5d151ea80cfcd501be4b754","after":"580e02fab03d6529064a575d2374f02d29e1a974"}];
 if(evolution?.schema!=='ikant-cora-workflow-evolution/v1'||
    evolution.authority!==0||evolution.retirement_authorized!==false||
    evolution.source_main!=='b6058b129ee1df0dcbbb3c92cf1f750ee9e024fa'||
    evolution.expected_count!==116||
    evolution.baseline_tree!==c.reuse.baseline_workflow_tree||
    evolution.revised_migration_epoch!=='25501ccba48b7d9cbc66842ddd3dff8b05267884'||
    evolution.historical_baseline_preserved!==true||
    evolution.external_review!=='NOT_ATTESTED'||
    JSON.stringify(evolution.allowed)!==JSON.stringify(exactWorkflowDeltas))
   return fail('CORA_WORKFLOW_EVOLUTION_UNPINNED');
 return {ok:true,authority:0,product_go:false,permission_to_change:false,
  nodes:reticularIds.length,source_leaves:9,external_leaves:4};
}
/** Validate the Git TREE by undoing precisely one reviewed candidate blob delta.
 * No git history, network, mktree side effect, owner, or review permission implied. */
/** Git source-only: preserve one-delta legacy fixture and six pinned live changes.
 * The result is no workflow retirement, provider receipt or independent approval.
 */
export function qualifyWorkflowTreeEvolution(spec,{entries,observedTree}={}){
 const fail=edge=>({ok:false,edge,authority:0,retirement_authorized:false,product_go:false});
 if(spec?.schema!=='ikant-cora-workflow-evolution/v1'||spec.authority!==0||
    spec.retirement_authorized!==false||!isHash(spec.baseline_tree)||
    !Array.isArray(entries)||entries.length!==spec.expected_count||
    !Array.isArray(spec.allowed)||![1,6].includes(spec.allowed.length)||!isHash(observedTree))
   return fail('CORA_WORKFLOW_TREE_UNBOUND');
 const seen=new Set();
 for(const e of entries){
  if(!e||!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*[.]ya?ml$/.test(e.name)||
     e.mode!=='100644'||!isHash(e.sha)||seen.has(e.name))
   return fail('CORA_WORKFLOW_TREE_ENTRY_INVALID');
  seen.add(e.name);
 }
 const digest=rows=>{
  const list=[...rows].sort((a,b)=>Buffer.compare(Buffer.from(a.name),Buffer.from(b.name)));
  const content=Buffer.concat(list.map(e=>Buffer.concat([
   Buffer.from(e.mode+' '+e.name+String.fromCharCode(0),'utf8'),Buffer.from(e.sha,'hex')])));
  const hdr=Buffer.from('tree '+content.length+String.fromCharCode(0),'utf8');
  return crypto.createHash('sha1').update(hdr).update(content).digest('hex');
 };
 if(digest(entries)!==observedTree)return fail('CORA_WORKFLOW_OBSERVED_TREE_INCORRECT');
 if(observedTree===spec.baseline_tree)return {ok:true,status:'UNCHANGED_BASELINE',
  authority:0,retirement_authorized:false,product_go:false};
 const changes=new Map();
 for(const change of spec.allowed){
  const prefix='.github/workflows/';
  const name=change.path?.startsWith(prefix)?change.path.slice(prefix.length):'';
  if(!name||!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*[.]ya?ml$/.test(name)||
     !isHash(change.before)||!isHash(change.after)||
     change.before===change.after||!seen.has(name)||changes.has(name))
   return fail('CORA_WORKFLOW_CHANGE_NOT_PINNED');
  if(entries.find(e=>e.name===name).sha!==change.after)
   return fail('CORA_WORKFLOW_UNDECLARED_BLOB');
  changes.set(name,change);
 }
 const rollback=entries.map(e=>changes.has(e.name)?{...e,sha:changes.get(e.name).before}:e);
 if(digest(rollback)!==spec.baseline_tree)return fail('CORA_WORKFLOW_ROLLBACK_TREE_MISMATCH');
 return {ok:true,status:changes.size===1?'ONE_REVERSED_DELTA_MATCHES_BASELINE':
   'SIX_REVERSED_DELTAS_MATCH_BASELINE',before_tree:spec.baseline_tree,
   observed_tree:observedTree,changed_paths:[...changes.keys()].sort().map(n=>'.github/workflows/'+n),
   authority:0,retirement_authorized:false,product_go:false};
}
function evaluateNodes(c,observed){
 const nodes=new Map(c.nodes.map(x=>[x.id,x])),states=new Map();
 function walk(id){
  if(states.has(id))return states.get(id);
  const n=nodes.get(id);
  if(!n.depends_on.length){
   const result=n.scope==='EXTERNAL'?'BLOCKED_EXTERNAL':
    observed[id]===true?'SOURCE_CANDIDATE':'DEBT_BLOCKED';
   states.set(id,result);return result;
  }
  const deps=n.depends_on.map(walk);
  const result=deps.includes('BLOCKED_EXTERNAL')?'BLOCKED_EXTERNAL':
   deps.includes('DEBT_BLOCKED')?'DEBT_BLOCKED':'SOURCE_CANDIDATE';
  states.set(id,result);return result;
 }
 for(const id of reticularIds)walk(id);
 return Object.fromEntries(states);
}
/** Pure scoped reconciliation permits both real full-checkout and adversarial fixtures. */
export function qualifyReticularCensus(c,{audit,index,tree,head,treeSha,ownersStable=false,deltaSafe=false,readme='' }={}){
 const gate=qualifyReticularLattice(c);
 if(!gate.ok)return gate;
 const errors=[],rows=[],seen=new Set(),indexMap=new Map(),treeMap=new Map();
 const fail=edge=>({ok:false,edge,errors,authority:0,product_go:false,permission_to_change:false});
 if(!isHash(head)||!isHash(treeSha)||!Array.isArray(index)||!Array.isArray(tree)||
    !audit||audit.schema!=='ikant-v5b-live-readonly-audit/v1')
   return fail('CORA_GIT_INPUT_UNBOUND');
 for(const [kind,items,dst] of [['index',index,indexMap],['tree',tree,treeMap]]){
  for(const x of items){
   if(typeof x?.path!=='string'||!isHash(x?.sha)||dst.has(x.path)){errors.push('INVALID_OR_DUPLICATE_'+kind);continue}
   dst.set(x.path,x.sha);
  }
 }
 if(indexMap.size!==treeMap.size||indexMap.size!==audit.checked_files)errors.push('GIT_PATH_COUNT_MISMATCH');
 for(const [p,sha] of indexMap)if(treeMap.get(p)!==sha)errors.push('INDEX_TREE_BLOB_MISMATCH:'+p);
 for(const p of treeMap.keys())if(!indexMap.has(p))errors.push('TREE_ONLY_PATH:'+p);
 if(audit.status!=='SOURCE_INDEXED_NOT_HUMAN_REVIEWED'||audit.errors?.length||
    audit.required_checks!=='UNKNOWN_PROVIDER_NOT_ATTESTED'||audit.product_release!=='PRODUCT_NO_GO')
   errors.push('V5B_OR_PROVIDER_PROMOTION');
 const consumers=new Map((audit.consumer_index||[]).map(x=>[x.path,x]));
 const workflows=new Map((audit.workflows||[]).map(x=>[x.path,x]));
 if(consumers.size!==indexMap.size||workflows.size!==audit.workflow_count)
  errors.push('V5B_CENSUS_INCOMPLETE');
 for(const [p,sha] of [...indexMap].sort(([a],[b])=>a.localeCompare(b))){
  const x=consumers.get(p),role=provisionalRole(p),w=workflows.get(p);
  if(seen.has(p)||!x||x.path!==p||x.human_verified!==false||
     !['UNKNOWN_NOT_UNUSED','LITERAL_CONSUMER_OBSERVED'].includes(x.status)||
     !Array.isArray(x.literal_importers)||!Array.isArray(x.literal_dependencies))
   errors.push('CONSUMER_OR_ROLE_UNQUALIFIED:'+p);
  if(p.startsWith('.github/workflows/')&&(!w||!Array.isArray(w.events)||!Array.isArray(w.jobs)||!Array.isArray(w.flags)))
   errors.push('WORKFLOW_SOURCE_UNQUALIFIED:'+p);
  seen.add(p);
  rows.push({path:p,git_blob_sha1:sha,provisional_role:role,
   accountability:'HUMAN_OWNER_UNKNOWN',consumer_status:x?.status||'UNKNOWN_NOT_UNUSED',
   literal_importers:x?.literal_importers||[],literal_dependencies:x?.literal_dependencies||[],
   workflow:w?{events:w.events,jobs:w.jobs,flags:w.flags,required_check_status:w.required_check_status}:null,
   consolidation:'RETAIN_PENDING_CONSUMER_AND_HUMAN_REVIEW'});
 }
 if(indexMap.size!==seen.size)errors.push('SOURCE_SET_NOT_BIJECTIVE');
 if(errors.length)return fail('CORA_SOURCE_CENSUS_REFUTED');
 const observations={
  S01:true,S02:true,S03:rows.every(x=>x.provisional_role!==''),
  S04:rows.every(x=>x.consumer_status!=='UNUSED'),
  S05:rows.filter(x=>x.workflow).length===audit.workflow_count,
  S06:ownersStable===true,S07:deltaSafe===true,
  S08:indexMap.has('tests/cora-reticular-hygiene.test.mjs')&&indexMap.has('tests/cora-minimal-absorption.test.mjs'),
  S09:readme.includes('<!-- cora-reticular-source-hygiene:v1 -->')
 };
 const states=evaluateNodes(c,observations);
 return {ok:Object.values(observations).every(Boolean),
  status:Object.values(observations).every(Boolean)?'SOURCE_CANDIDATE_REQUIRES_INDEPENDENT_CI':'SOURCE_DOD_OPEN',
  authority:0,active:false,product_go:false,permission_to_change:false,
  git:{head,tree:treeSha,tracked:rows.length,workflow_count:audit.workflow_count},
  obligations:observations,goals:{prepared:states.G_SOURCE_PREPARED,
   standardized:states.G_REPOSITORY_STANDARDIZED,product:states.G_PRODUCT_QUALIFIED},
  external:{dynamic_consumers:'UNKNOWN',independent_review:'UNKNOWN',required_checks:'UNKNOWN',
   native_delivery:'UNKNOWN'},
  unresolved_dynamic_candidates:audit.dependency_probe?.dynamic_site_candidates??null,
  rows};
}
/** One original V5-B audit and its CORA-qualified projection from the same observation.\n * The audit is created internally; callers cannot inject an unqualified substitute. */
export function observeReticularCensusWithAudit(){
 const c=JSON.parse(fs.readFileSync(path.join(ROOT,reticularPath),'utf8'));
 const head=git('rev-parse','HEAD'),treeSha=git('rev-parse','HEAD^{tree}');
 const parseTree=git('ls-tree','-r','-z','--full-tree','HEAD').split('\0').filter(Boolean).map(line=>{
  const m=/^([0-7]{6}) blob ([a-f0-9]{40})\t(.+)$/s.exec(line);
  if(!m)throw Error('CORA_NON_BLOB_TREE_ENTRY');return {path:m[3],sha:m[2]};
 });
 const index=parseStagedGitEntries(execFileSync('git',['ls-files','--stage','-z'],{cwd:ROOT}).toString('utf8'))
  .map(x=>({path:x.path,sha:x.sha}));
 const ownerPaths=c.reuse.owners;
 const ownerEpochReadback=ownerPaths.map(p=>qualifyRegisteredC72SourceEpoch({
  path:p,historicalBlobSha1:c.reuse.owner_blob_pins[p],
  observedBlobSha1:git('rev-parse','--verify','HEAD:'+p)
 }));
 const ownersStable=ownerEpochReadback.every(e=>e.ok===true);
 // Reconstruct original workflow TREE by reversing only the explicitly pinned blob.
 // Original V5-B independently checks tracked files, retention and every delta register.
 const workflowTree=git('rev-parse','--verify','HEAD:.github/workflows');
 const bytes=execFileSync('git',['ls-tree','-z','HEAD:.github/workflows'],{cwd:ROOT});
 const entries=bytes.toString('utf8').split(String.fromCharCode(0)).filter(Boolean).map(line=>{
  const m=/^([0-7]{6}) blob ([a-f0-9]{40})(.)(.+)$/.exec(line);
  if(!m||m[3].charCodeAt(0)!==9)throw Error('CORA_WORKFLOW_NON_BLOB_ENTRY');
  return {mode:m[1],sha:m[2],name:m[4]};
 });
 const delta=qualifyWorkflowTreeEvolution(c.reuse.workflow_evolution,{entries,observedTree:workflowTree});
 const deltaSafe=delta.ok===true;
 const audit=auditRepository();
 const census=qualifyReticularCensus(c,{audit,index,tree:parseTree,head,treeSha,
  ownersStable,deltaSafe,readme:fs.readFileSync(path.join(ROOT,'README.md'),'utf8')});
 return {census:{...census,original_owner_source_epoch_readback:ownerEpochReadback,
  new_epoch_is_not_owner_receipt:true},audit};
}
/** Preserve the pre-D2 public result shape and original read-only CLI behavior. */
export function observeReticularCensus(){
 return observeReticularCensusWithAudit().census;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv[2]==='--reticulum'){
  const r=observeReticularCensus(),full=process.argv[3]==='--full';
  const out=full?r:{...r,rows:undefined};
  process.stdout.write(JSON.stringify(out,null,2)+'\n');
  if(!r.ok)process.exitCode=1;
 }else{
  const doc=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/cora-minimal-absorption-v1.json'),'utf8'));
  const result=sourcePathsPresent(doc);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(!result.ok)process.exitCode=1;
 }
}
