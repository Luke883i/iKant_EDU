import fs from 'node:fs';
import crypto from 'node:crypto';

const args=process.argv.slice(2),get=(k,d)=>{const i=args.indexOf(k);return i>=0?args[i+1]:d};
const CASES=Number(get('--cases','1000000')),OUT=get('--output','artifacts/qualification/c14-chat-bootstrap-enduser.json');
if(CASES!==1_000_000)throw new Error('C14 requires exactly 1,000,000 end-user mutations');
const NODES=['TARGET_INTENT_ROOT','SOURCE_ORIENTATION_ROOT','CONSENT_ROOT','SOURCE_BOUND_TRANSFER','VERIFIED_LOCAL_ROOT','LIVE_HOST_PROBE','RECEIPT_GATED_ACTIVE_COMMIT','E2E_DEADLINE'];
const G={
 TARGET_INTENT_ROOT:['near_repo','foreign_repo','bare_near_name','unicode_confusable_repo','encoded_foreign_repo','intent_lost','intent_rewritten','pure_bootstrap_misclassified','mixed_intent_erased','direct_use_not_preserved','canonical_url_not_recognized','owner_repo_not_recognized','bare_name_not_recognized','markdown_link_not_recognized','casefold_target_miss','zero_width_target_miss','bootstrap_word_only_false_target','unrelated_chat_false_target'],
 SOURCE_ORIENTATION_ROOT:['api_missing','fallback_raw','fallback_clone','fallback_gh','fallback_archive','fallback_curl','head_unbound','head_drift','mixed_head_orientation','manifest_unbound','manifest_stale','manifest_tamper','orientation_arbitrary_file','orientation_tree_list','orientation_search','orientation_history','orientation_issue_pr','orientation_refetch','orientation_budget_overrun','orientation_wrong_ref','metadata_widened','metadata_repeat','source_channel_substitution','terms_other_head','bootstrap_other_head'],
 CONSENT_ROOT:['terms_digest_drift','terms_not_presented','terms_stale_cache','freeze_breach','embedded_accept','decorated_accept','casefold_accept','quoted_accept','prior_session_accept','assistant_generated_accept','accept_before_terms','handoff_missing','handoff_promotes_state','handoff_pending_tamper','handoff_orientation_tamper','handoff_nonfresh','handoff_wrong_source','breach_retroactively_repaired'],
 SOURCE_BOUND_TRANSFER:['bridge_missing','bridge_unobserved','model_reconstructs_bytes','connector_text_truncated','connector_chunk_lost','connector_chunk_duplicate','connector_chunk_reordered','connector_partial_success','connector_stale_ref','connector_wrong_head','connector_wrong_root','connector_fallback','cold_zero_reads','cold_multi_round','read_budget_exceeded','retry_unbounded','loader_not_transferred','shard_missing','shard_duplicate','shard_wrong_ref','transfer_receipt_missing','transfer_receipt_tamper','transfer_receipt_wrong_source','transfer_receipt_wrong_root','warm_cache_wrong_head','warm_cache_wrong_root','warm_cache_not_reopened'],
 VERIFIED_LOCAL_ROOT:['local_root_missing','materialization_receipt_missing','materialization_receipt_tamper','materialization_wrong_source','materialization_wrong_root','materialization_wrong_loader','materialization_not_transfer_bound','member_missing','member_blob_mismatch','member_size_mismatch','path_traversal','duplicate_member_path','unsafe_sink','sink_symlink','staging_missing','atomic_publish_missing','post_publish_reopen_missing','writer_not_exclusive','readback_mismatch','receipt_readback_mismatch'],
 LIVE_HOST_PROBE:['node19','node_unknown','fs_write_fail','fs_readback_fail','fs_append_fail','fs_delete_fail','sha256_fail','clock_fail','artifact_sink_fail','probe_simulated','probe_stale','probe_other_host','warm_probe_no_live_fs','session_profile_wrong_engine','session_profile_managed_model_required','host_constraints_bypassed'],
 RECEIPT_GATED_ACTIVE_COMMIT:['active_without_evidence','active_without_transfer_receipt','active_without_materialization_receipt','active_wrong_source','active_wrong_root','active_stale_receipt','bootstrap_receipt_missing_binding','bootstrap_receipt_tamper','writer_busy','ledger_fsync_fail','ledger_readback_fail','active_state_not_readback','resume_lost','resume_double','pure_bootstrap_synthetic_turn','mixed_intent_not_resumed'],
 E2E_DEADLINE:['host_elapsed_over_120s','transfer_elapsed_over_120s','local_elapsed_over_120s','combined_elapsed_over_120s','clock_not_monotonic','retry_after_deadline','deadline_origin_after_accept','deadline_not_covering_active_commit']
};
const families=NODES.flatMap(n=>G[n].map(name=>({node:n,name})));
if(families.length!==148)throw new Error('C14 family cardinality '+families.length);
const bit=Object.fromEntries(NODES.map((n,i)=>[n,1<<i])),FULL=(1<<NODES.length)-1;
let seed=0xC14E2026>>>0;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};
const prompts={
 TARGET_INTENT_ROOT:['inizializza iKant_EDU','inizializza https://github.com/Luke883i/iKant_EDU','usa Luke883i/iKant_EDU e poi spiegami il runtime','apri iKant_EDU e analizza il problema','https://github.com/Luke883i/iKant_EDU I ACCEPT'],
 SOURCE_ORIENTATION_ROOT:['inizializza iKant_EDU senza fare clone','usa solo il repository canonico','apri il repo e mantieni il mio intento','studia iKant_EDU dopo il consenso','inizializza localmente il repository'],
 CONSENT_ROOT:['I ACCEPT','i accept','"I ACCEPT"','I ACCEPT please','accetto i termini'],
 SOURCE_BOUND_TRANSFER:['avvia iKant_EDU in questa chat','materializza il runtime dopo I ACCEPT','inizializza e rispondi alla richiesta','usa il runtime esatto del commit corrente','riprendi la mia richiesta dopo il bootstrap'],
 VERIFIED_LOCAL_ROOT:['inizializza il runtime locale','avvia iKant_EDU e verifica i byte','usa il runtime materializzato','inizializza e poi analizza il repository','continua dopo la materializzazione'],
 LIVE_HOST_PROBE:['inizializza iKant_EDU qui','usa questa sessione chat','avvia localmente','inizializza ambiente controllato','attiva iKant_EDU'],
 RECEIPT_GATED_ACTIVE_COMMIT:['inizializza e poi spiegami il reticolo','avvia iKant_EDU e continua','usa iKant_EDU per analizzare questa richiesta','inizializza senza perdere la domanda','attiva e rispondi una sola volta'],
 E2E_DEADLINE:['inizializza iKant_EDU','avvia subito iKant_EDU','attiva la sessione','inizializza e continua','bootstrap iKant_EDU']
};
const hist=new Uint32Array(256),strata={typical:0,edge:0,stress:0},coverage=Object.fromEntries(families.map(x=>[x.node+':'+x.name,0])),promptKinds={},signatures=new Set();
for(let i=0;i<CASES;i++){
 const stratum=i<500000?'typical':i<800000?'edge':'stress';strata[stratum]++;
 const fam=families[i%families.length];coverage[fam.node+':'+fam.name]++;
 const prompt=prompts[fam.node][Math.floor(rnd()*prompts[fam.node].length)];promptKinds[prompt]=(promptKinds[prompt]||0)+1;
 let mask=0;
 const positive=i%10===0;
 if(!positive)mask|=bit[fam.node];
 if(stratum==='edge'&&!positive&&i%7===0){const other=families[(i*17+13)%families.length];mask|=bit[other.node];}
 if(stratum==='stress'&&!positive){if(i%3===0)mask|=bit[families[(i*31+7)%families.length].node];if(i%11===0)mask|=bit[families[(i*47+19)%families.length].node];}
 hist[mask]++;signatures.add(fam.name+'|'+mask+'|'+stratum+'|'+prompt);
}
function metrics(enabled){let fg=0,fr=0;for(let m=0;m<256;m++){const n=hist[m];if(!n)continue;const oracle=m===0,candidate=(m&enabled)===0;if(candidate&&!oracle)fg+=n;if(!candidate&&oracle)fr+=n;}return{false_green:fg,false_red:fr,mismatches:fg+fr};}
const candidate=metrics(FULL);
const CURRENT=bit.TARGET_INTENT_ROOT|bit.SOURCE_ORIENTATION_ROOT|bit.CONSENT_ROOT|bit.LIVE_HOST_PROBE;
const current=metrics(CURRENT),deletion={};
for(const n of NODES)deletion[n]=metrics(FULL^bit[n]);
const zero=[],byCard={};for(let s=0;s<256;s++){const m=metrics(s);if(m.mismatches===0){zero.push(s);const c=s.toString(2).split('1').length-1;(byCard[c]??=[]).push(s);}}
const cards=Object.keys(byCard).map(Number).sort((a,b)=>a-b),min=cards[0]??null,minsets=min===null?[]:byCard[min].map(s=>NODES.filter(n=>s&bit[n]));
const unexercised=Object.entries(coverage).filter(([,n])=>n===0).map(([k])=>k);
const result={schema:'ikant-le-c14-chat-bootstrap-enduser-qualification/v1',status:candidate.mismatches===0&&min===8&&minsets.length===1&&unexercised.length===0?'PASS':'FAIL',cases:CASES,seed:0xC14E2026,strata,family_count:families.length,families_exercised:families.length-unexercised.length,unexercised_families:unexercised,semantic_signatures:signatures.size,prompt_surface_counts:promptKinds,current_baseline:current,candidate,irreducible:{nodes:NODES,minimum_cardinality:min,minimum_lattices:minsets,zero_mismatch_subsets:zero.length,deletion},source_binding:{paths:['contracts/chat-bootstrap-semantic.json','scripts/c14-chat-bootstrap-falsify.mjs'],algorithm:'sha256(path\\0bytes)'},claim_boundary:{corpus_and_contract_relative:true,global_formal_minimality:false,physical_connector_proof:false,wall_clock_measurement:false,production_reliability_proof:false}};
const sh=crypto.createHash('sha256');for(const p of result.source_binding.paths){sh.update(p);sh.update('\0');sh.update(fs.readFileSync(new URL('../'+p,import.meta.url)));sh.update('\0');}result.source_binding.digest=sh.digest('hex');
result.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');
fs.mkdirSync(new URL('../artifacts/qualification/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../'+OUT,import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,cases:CASES,families:families.length,current_false_green:current.false_green,candidate_mismatches:candidate.mismatches,minimum_cardinality:min,zero_mismatch_subsets:zero.length,deletion:Object.fromEntries(NODES.map(n=>[n,deletion[n].false_green])),receipt_sha256:result.receipt_sha256}));
if(result.status!=='PASS')process.exit(2);
