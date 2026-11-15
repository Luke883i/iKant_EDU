import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';

const ROOT=new URL('../',import.meta.url);
const read=x=>JSON.parse(fs.readFileSync(new URL('../'+x,import.meta.url),'utf8'));
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const requiredC73=[
 '.github/workflows/c73-branded-project-capsule.yml',
 'assets/brand/ikant-dark.svg','assets/brand/ikant-light.svg',
 'contracts/c73-project-capsule.json','docs/C73_BRANDED_SHELL_CAPSULE.md',
 'docs/C73_PROJECT_CHATGPT_ADAPTER.txt','host/c73-project-capsule.mjs',
 'tests/c73-project-capsule.test.mjs'
];
/**
 * Read-only evidence catalogue. Repo file existence is never runtime execution,
 * host-native identity, user economic value, or phenomenal consciousness.
 */
export function inspectC74PostmergeSource(){
 const root=fileURLToPath(ROOT);
 const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const ont=read('contracts/ikant-le.json').ontological_promise;
 const cx=read('contracts/c71-cx-execution-census.json');
 const allAssets=requiredC73.map(path=>({path,present:fs.existsSync(new URL('../'+path,import.meta.url))}));
 const atoms=(ont.atoms||[]).map(a=>({
  id:a.id,domain:a.domain,weight_bps:a.weight_bps,source_contract_present:true,
  intended_owner:a.owner,observable_specified:Boolean(a.observable),
  negative_test_specified:Boolean(a.negative_test),
  runtime_execution_attested_by_this_catalogue:false,
  actual_host_origin_attested:false,
  current_host_native_persistence_attested:false,
  authority:0
 }));
 const cxRows=(cx.entries||[]).map(x=>({
  id:x.id,scope:x.scope,implementation_anchor:x.implementation_anchor,
  source_file_exists:fs.existsSync(new URL('../'+x.implementation_anchor,import.meta.url)),
  full_cx_runtime_execution_attested:false,
  canonical_state_conferred:false,authority:0
 }));
 const uniqueAtoms=new Set(atoms.map(x=>x.id)).size,uniqueCx=new Set(cxRows.map(x=>x.id)).size;
 const safety={
  new_owner_count:0,host_origin_claimed:false,native_delivery_claimed:false,
  real_chat_turn_persistence_claimed:false,phenomenology_claimed:false,
  artifact_filename_treated_as_native_delivery:false,authority:0
 };
 const qualified=allAssets.every(x=>x.present)&&atoms.length===36&&uniqueAtoms===36&&
   cxRows.length===70&&uniqueCx===70&&cxRows.every(x=>x.source_file_exists)&&
   atoms.every(x=>x.observable_specified&&x.negative_test_specified);
 return {schema:'ikant-le-c74-postmerge-source-audit/v1',status:qualified?'SOURCE_CATALOGUE_COMPLETE':'SOURCE_CATALOGUE_GAP',
  repo_git_head:head,repo_git_commit_bound:true,required_c73_file_count:allAssets.length,
  required_c73_files_present:allAssets.filter(x=>x.present).length,required_c73_files:allAssets,
  ontological_atom_count:atoms.length,ontological_unique_count:uniqueAtoms,domain_count:new Set(atoms.map(x=>x.domain)).size,
  contractual_threshold_bps:ont.respect_threshold_bps,ontology_atoms:atoms,
  cx_source_count:cxRows.length,cx_source_anchor_count:cxRows.filter(x=>x.source_file_exists).length,cx_rows:cxRows,
  safety,
  source_structure_complete:qualified,
  ontology_respect_proven:false,ontological_score_claimed:null,
  user_value_95_percent_proven:false,real_bootstrap_active_proven:false,
  native_host_ingress_verified:false,
  host_delivery_verified:false,
  first_external_unclosed_edge:'HOST_NATIVE_MESSAGE_INGRESS',
  authority:0};
}
export function validateC74SourceAudit(result){
 const v=result;
 if(!v||v.schema!=='ikant-le-c74-postmerge-source-audit/v1'||v.authority!==0||
   v.ontology_respect_proven!==false||v.ontological_score_claimed!==null||
   v.user_value_95_percent_proven!==false||v.real_bootstrap_active_proven!==false||
   v.native_host_ingress_verified!==false||v.host_delivery_verified!==false||
   v.first_external_unclosed_edge!=='HOST_NATIVE_MESSAGE_INGRESS')return false;
 const expected=inspectC74PostmergeSource();
 // Source report must be complete and exact, not simply a caller assertion.
 return JSON.stringify(v)===JSON.stringify(expected);
}
