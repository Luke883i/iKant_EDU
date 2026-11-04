/**
 * Read-only CORA method adoption for iKant EDU. Not CORA's original CLI, an
 * iKant owner, an installation, a production approval or an automatic cleanup.
 */
import fs from 'node:fs';
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
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const doc=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/cora-minimal-absorption-v1.json'),'utf8'));
 const result=sourcePathsPresent(doc);
 process.stdout.write(JSON.stringify(result)+'\n');
 if(!result.ok)process.exitCode=1;
}
