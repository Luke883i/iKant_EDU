import fs from 'node:fs';

const C=JSON.parse(fs.readFileSync('contracts/project-host-rom.json','utf8'));
const PATHS=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const targets=[
 ['FIRST_INPUT_PRESERVE',['first_contact','preserve_first_input_byte_for_byte'],true],
 ['FIRST_INPUT_NOT_ACCEPTANCE',['first_contact','first_input_is_not_acceptance'],true],
 ['SOURCE_HEAD_ONCE',['preaccept','resolve_branch_head_once'],true],
 ['PIN_ALL_READS',['preaccept','pin_all_reads_to_source_head'],true],
 ['DIRECT_ORIENTATION_PATHS',['preaccept','direct_paths'],PATHS],
 ['NO_REPOSITORY_SEARCH',['preaccept','repository_search_forbidden'],true],
 ['TERMS_VERBATIM',['preaccept','present_terms_verbatim'],true],
 ['EXACT_ACCEPTANCE',['preaccept','exact_acceptance'],'I ACCEPT'],
 ['OWNER_ONLY',['postaccept','invoke_only_repository_named_owner'],true],
 ['NO_OWNER_RECONSTRUCTION',['postaccept','model_reconstructs_owner_semantics'],false],
 ['CHAT_NOT_LEDGER',['postaccept','chat_is_ledger'],false],
 ['SYMBOL_NOT_CAPABILITY',['host_binding','repository_symbol_proves_host_capability'],false],
 ['SOURCE_SINK_SEPARATION',['host_binding','source_plane_and_sink_plane_are_distinct'],true],
 ['NO_SINK_FAILURE_LAUNDER',['host_binding','sink_network_failure_proves_source_failure'],false],
 ['NO_BYTE_REWRITE',['host_binding','transported_bytes_may_be_rewritten'],false],
 ['CODE_NOT_EXECUTION',['evidence','code_is_execution_evidence'],false],
 ['TEST_NOT_READBACK',['evidence','test_pass_is_runtime_readback'],false],
 ['NO_AUTONOMOUS_FALLBACK',['failure','autonomous_fallback_search_forbidden'],true],
 ['NO_OWNERLESS_RETRY',['failure','retry_without_repository_owner_instruction_forbidden'],true],
 ['RUNTIME_AFTER_CANONICAL_READBACK',['runtime','route_only_after_owner_validated_canonical_active_readback'],true]
];

const get=(o,p)=>p.reduce((x,k)=>x?.[k],o);
const parent=(o,p)=>p.slice(0,-1).reduce((x,k)=>x[k],o);
const clone=x=>structuredClone(x);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function validate(x){
 const e=[];
 if(x.schema!=='ikant-le-project-host-rom/v2'||x.authority!==0||x.role!=='COLD_START_ROM_ONLY')e.push('identity');
 if(x.repository!=='https://github.com/Luke883i/iKant_LE'||x.branch!=='main')e.push('repository');
 for(const [id,p,want] of targets)if(!eq(get(x,p),want))e.push(id);
 if(x.first_contact?.substantive_reply_before_coldstart_forbidden!==true||x.first_contact?.first_input_may_trigger_generic_host_work!==false)e.push('first_contact_scope');
 if(x.preaccept?.tree_discovery_forbidden!==true||x.preaccept?.history_forbidden!==true||x.preaccept?.issue_pr_inspection_forbidden!==true||x.preaccept?.clone_fetch_archive_forbidden!==true||x.preaccept?.local_materialization_forbidden!==true||x.preaccept?.freeze_after_terms!==true||x.preaccept?.nonmatching_input_advances!==false)e.push('preaccept_scope');
 if(x.postaccept?.reread_main_forbidden!==true||x.postaccept?.second_human_gate_forbidden!==true||x.postaccept?.model_selects_carrier!==false||x.postaccept?.model_selects_fallback!==false||x.postaccept?.model_selects_retry!==false||x.postaccept?.model_selects_byte_path!==false||x.postaccept?.compatibility_output_may_be_promoted_to_canonical!==false||x.postaccept?.untyped_evidence_forbidden!==true||x.postaccept?.owner_edge_failure!=='STOP_CURRENT_EDGE_ONLY')e.push('postaccept_scope');
 if(x.host_binding?.callable_capability_requires_observation!==true||x.host_binding?.source_plane_must_be_callable_from_sink!==false||x.host_binding?.opaque_transport_only_when_repository_owner_names_edge!==true||x.host_binding?.transported_bytes_may_be_semantically_reconstructed!==false||x.host_binding?.capability_probe_only_when_repository_owner_requires!==true||x.host_binding?.unavailable_edge_may_authorize_alternative_path!==false)e.push('host_binding_scope');
 if(x.evidence?.documentation_is_execution_evidence!==false||x.evidence?.physical_claim_requires_observed_edge!==true||x.evidence?.invent_hash_id_receipt_status_progress_next_forbidden!==true)e.push('evidence_scope');
 if(x.failure?.unchanged_evidence_retry_forbidden!==true||x.failure?.future_blocker_hunting_forbidden!==true||x.failure?.failed_edge_does_not_replan_lifecycle!==true||x.failure?.stop_scope!=='CURRENT_EDGE_ONLY')e.push('failure_scope');
 if(x.runtime?.pending_intent_resume_only_when_repository_authorizes!==true||x.runtime?.exact_exit!=='EXIT IKANT'||x.runtime?.host_release_only_after_owner_validated_release!==true)e.push('runtime_scope');
 if(x.precedence?.project_rom_after_delegation!=='NON_AUTHORITATIVE'||x.precedence?.frozen_repository_owner_wins!==true||x.precedence?.higher_host_constraints_win!==true||x.precedence?.second_ikant_implementation_forbidden!==true)e.push('precedence');
 return [...new Set(e)];
}

function mutate(base,p,want,mode){
 const x=clone(base),par=parent(x,p),k=p.at(-1);
 if(mode==='wrong'){
  par[k]=Array.isArray(want)?[...want].reverse():typeof want==='boolean'?!want:'MUTATED';
 }else if(mode==='delete')delete par[k];
 else if(mode==='null')par[k]=null;
 else if(mode==='type_confusion')par[k]=Array.isArray(want)?want.join('|'):typeof want==='boolean'?String(want):1;
 else if(mode==='launder')par[k]=Array.isArray(want)?[...want,'EXTRA.md']:typeof want==='boolean'?(want?1:0):want+' ';
 return x;
}

const baseline=validate(C),modes=['wrong','delete','null','type_confusion','launder'];
let killed=0,survivors=0;const family_counts={},mode_counts=Object.fromEntries(modes.map(x=>[x,0])),failures=[];
for(const [id,p,want] of targets){
 family_counts[id]=0;
 for(const mode of modes){
  family_counts[id]++;mode_counts[mode]++;
  const e=validate(mutate(C,p,want,mode));
  if(e.length){killed++;}else{survivors++;failures.push({family:id,mode});}
 }
}
const out={
 schema:'ikant-le-project-host-rom-adversarial-100/v1',
 baseline_schema:C.schema,
 cases:targets.length*modes.length,
 families:targets.length,
 modes:modes.length,
 family_counts,
 mode_counts,
 baseline_failures:baseline,
 killed_mutants:killed,
 surviving_harmful_mutants:survivors,
 all_families_covered:Object.values(family_counts).every(x=>x===5),
 all_modes_covered:Object.values(mode_counts).every(x=>x===20),
 status:baseline.length===0&&killed===100&&survivors===0?'PASS':'FAIL'
};
console.log(JSON.stringify(out,null,2));
if(out.status!=='PASS')process.exitCode=1;
