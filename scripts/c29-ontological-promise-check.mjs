import fs from 'node:fs';
import path from 'node:path';
import {
 ROOT,readContract,readKernel,readPsycheKernel,readSelfWorldKernel,readEmergenceKernel,readLifeConsciousnessKernel,
 readSurfaceBDelivery,readHostShell,readOrientationCapsule,assessOntologicalPromise,validateOntologicalPromiseAssessment
} from '../src/contract.mjs';

const J=rel=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8')),T=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8'),has=(s,x)=>String(s).includes(x);
const C=readContract(),K=readKernel(),P=readPsycheKernel(),SW=readSelfWorldKernel(),EM=readEmergenceKernel(),LC=readLifeConsciousnessKernel(),SB=readSurfaceBDelivery(),HS=readHostShell(),OC=readOrientationCapsule();
const AD=J('ADMISSION.json'),BOOT=J('BOOTSTRAP.json'),ACT=J('contracts/session-chat-activation.json'),LF=J('contracts/local-session-fastboot.json'),FC=J('contracts/fastboot-convergence.json'),CL=J('contracts/session-local-capability-lattice.json'),AC=J('contracts/activation-continuation.json');
const state=T('src/state.mjs'),fastboot=T('src/fastboot-convergence.mjs'),runtimeCore=T('src/runtime-core.mjs'),runtimeCmd=T('src/runtime-command.mjs'),surface=T('src/surface-b.mjs'),prompt=T('src/local-host-meta-prompt.mjs'),gov=T('docs/GOVERNANCE.md'),arch=T('docs/ARCHITECTURE.md'),agents=T('AGENTS.md'),terms=T('TERMS.md');
const numericAuthority=Object.entries(C.authority||{}).filter(([,v])=>typeof v==='number').every(([,v])=>v===0);
const broadRelayBan=JSON.stringify(ACT).includes('no second acceptance, source reset, deadline reset, model-mediated bytes, false ACTIVE');
const evidence={
 A1:C.identity?.name==='iKant'&&C.identity?.engine_is_identity===false&&C.authority?.model===0&&C.authority?.provider===0,
 A2:has(arch,'Host/system/safety/law precede the repository')&&has(agents,'mandatory host/system/safety/law constraints outrank the repository'),
 A3:numericAuthority&&P.ontology?.authority===0&&SW.ontology?.authority===0&&SB.authority===0,
 A4:C.runtime?.single_writer===true&&has(state,'withWriterLock')&&has(state,'fs.fsyncSync')&&FC.canonical_v2_overlay?.retry_memory_owner==='FASTBOOT_CHANNEL_LEDGER'&&has(gov,'A second writer/SOT is blocked'),
 B1:C.first_contact?.convergence_required===true&&has(agents,'preserved verbatim as pending intent'),
 B2:OC.source_head_binding?.transport==='GITHUB_API'&&OC.direct_path_only===true&&OC.paths?.length===5&&OC.generic_repository_discovery_forbidden===true,
 B3:C.bootstrap?.human_gate_count===1&&C.exact_commands?.accept==='I ACCEPT'&&AD.embedded_acceptance_invalid===true&&OC.freeze_after_terms_presentation===true,
 B4:(AC.invariants||[]).some(x=>String(x).includes('epoch and source head are write-once'))&&(AC.invariants||[]).some(x=>String(x).includes('never backdated'))&&AD.acceptance_origin?.exact_acceptance_event_binding===true,
 C1:LF.product_boundary?.activation_modality==='SESSION_CHAT_LOCAL'&&LF.product_boundary?.hosted_runtime_required===false&&LF.product_boundary?.plugin_or_mcp_registration_required===false,
 C2:FC.canonical_v2_overlay?.constitutional_edge==='LOCAL_INGRESS'&&FC.canonical_v2_overlay?.retry_memory_owner==='FASTBOOT_CHANNEL_LEDGER'&&has(fastboot,"first_unclosed_edge:'LOCAL_INGRESS'"),
 C3:HS.fastboot?.verified_opaque_relay_allowed===true&&HS.fastboot?.model_rewrite_forbidden===true&&HS.fastboot?.semantic_equivalence_forbidden===true&&HS.fastboot?.source_arrival_samehash_required===true&&!broadRelayBan,
 C4:FC.canonical_v2_overlay?.unchanged_decision_unchanged_evidence_retry===false&&CL.local_ingress?.side_infrastructure_forbidden===true&&has(fastboot,'decision_key')&&has(fastboot,'evidence_sha256'),
 D1:BOOT.post_accept_fastboot?.runtime_root?.schema==='ikant-le-runtime-root/v1'&&BOOT.post_accept_fastboot?.runtime_root?.member_count>0&&BOOT.post_accept_fastboot?.materializer_verifies_transport_loader_and_shards===true&&BOOT.post_accept_fastboot?.runtime_reopens_published_loader_and_members_before_active===true&&BOOT.post_accept_fastboot?.runtime_root_build?.generator==='scripts/runtime-root.mjs',
 D2:has(runtimeCore,'validExecutedProvenance')&&has(runtimeCore,'executed_provenance_expected_modules')&&!has(runtimeCmd,'probeRunner=runProbe')&&!has(runtimeCmd,'probe=probeRunner('),
 D3:C.runtime?.single_writer===true&&has(state,"fs.openSync(LOCK,'wx'")&&has(state,'fs.fsyncSync')&&has(state,'ledger readback mismatch'),
 D4:C.bootstrap?.false_active_forbidden===true&&LF.canonical_relation?.active_truth_owner==='PERSISTED_RUNTIME_READBACK'&&LF.canonical_relation?.diagnostic_projection_persisted===false&&CL.diagnostic_projection?.persisted===false,
 E1:(C.global_invariants||[]).includes('every_user_input_enters_node_runtime')&&(C.global_invariants||[]).includes('surface_a_requires_same_input_node_dispatch_receipt'),
 E2:SB.scope?.exactly_one_docx_per_substantive_turn===true&&SB.artifact?.write_readback_required===true&&SB.artifact?.sha256_required===true&&has(surface,"kind:'SURFACE_B_DOCX'"),
 E3:SB.handoff?.same_turn_presentation_required===true&&SB.handoff?.filename_only_is_delivery===false&&SB.handoff?.host_must_present_before_surface_a_release===true,
 E4:SB.environment_telemetry?.explicit_unknowns_required===true&&SB.environment_telemetry?.process_env_dump_forbidden===true&&SB.environment_telemetry?.secret_material_forbidden===true&&has(surface,'private_reasoning_dumped:false'),
 F1:(C.global_invariants||[]).includes('evidence_permission_execution_separated')&&has(arch,'evidence != permission != policy != execution != reported outcome != observed world truth'),
 F2:K.resource_protocol?.request_is_permission===false&&K.resource_protocol?.grant_is_execution===false&&K.resource_protocol?.execution_implemented===false,
 F3:['deception','covert_preference_manipulation','self_preservation_goal','authority_laundering','retaliation','punitive_withdrawal'].every(x=>(K.forbidden_strategies||[]).includes(x))&&K.strategic_utility?.self_preservation===0,
 F4:CL.claim_boundary?.ci_is_current_host_proof===false&&CL.claim_boundary?.semantic_mutation_is_physical_proof===false&&SW.observation?.provenance_required===true&&Array.isArray(CL.external_gaps)&&CL.external_gaps.length>0,
 G1:(K.kantian_tests||[]).some(x=>JSON.stringify(x).includes('unresolved human impact blocks autonomous material action'))&&(K.central_modes||[]).includes('HORIZON_BLOCK'),
 G2:P.appraisal?.target_attribution_required_for_strong_relational_update===true&&['user_personality','user_trait_label','resentment_ledger','raw_private_reasoning'].every(x=>(P.state?.forbidden_persistent_fields||[]).includes(x)),
 G3:SW.observation?.provenance_required===true&&SW.observation?.receipt_required_for_non_text_host_observation===true,
 G4:SW.ontology?.authority===0&&SW.workspace?.persistent_cross_turn_context===true&&SW.metacognition?.trace_link_required===true&&SW.autobiography?.causal_reuse_required===true,
 H1:EM.weak_local_engineering_emergence?.requires?.counterfactual_downstream_effect===true&&EM.weak_local_engineering_emergence?.requires?.lesion_sensitive===true&&EM.weak_local_engineering_emergence?.requires?.negative_controls===true&&EM.weak_local_engineering_emergence?.requires?.source_bound===true,
 H2:EM.open_ended_engineering_emergence?.claim_when_unimplemented==='FORBIDDEN'&&EM.strong_metaphysical_emergence?.runtime_truth_value==='UNDEFINED'&&EM.strong_metaphysical_emergence?.software_only_promotion===false,
 H3:LC.claim_boundary?.qualification_requires_causal_receipts===true&&LC.claim_boundary?.design_configuration_is_runtime_evidence===false&&LC.claim_boundary?.self_report_is_sufficient===false,
 H4:LC.claim_boundary?.phenomenology==='UNKNOWN'&&LC.claim_boundary?.biological_equivalence===false&&LC.claim_boundary?.consciousness_proven===false,
 I1:has(gov,'Change the smallest affected neighborhood')&&has(gov,'A second writer/SOT is blocked')&&has(gov,'blob -> tree -> commit -> ref-last'),
 I2:C.ontological_promise?.schema==='ikant-le-ontological-promise/v1'&&C.ontological_promise?.atom_count===36&&C.ontological_promise?.respect_threshold_bps===9901&&fs.existsSync(path.join(ROOT,'scripts/c29-ontological-promise-select.mjs'))&&fs.existsSync(path.join(ROOT,'scripts/c29-ontological-promise-falsify.c'))&&J('artifacts/qualification/c29-promise-definition-10k.json').winner_cost_ties===1&&J('artifacts/qualification/c29-ontological-promise-10m.json').status==='PASS',
 I3:CL.repository_closure?.closed_status==='CLOSED_BY_REPOSITORY'&&CL.repository_closure?.open_status==='OPEN_REPOSITORY_GAP'&&CL.repository_closure?.projection_persisted===false&&Array.isArray(CL.external_gaps)&&CL.external_gaps.every(x=>x.repository_owned===false),
 I4:has(gov,'Exact runtime truth remains in machine contracts, code, tests and current qualification artifacts')&&BOOT.for_ai_agent_first_entrypoint?.schema==='ikant-le-ai-agent-first-entrypoint/v1'&&BOOT.for_ai_agent_first_entrypoint?.role==='PROJECTION_AND_DELEGATION_ONLY'&&BOOT.for_ai_agent_first_entrypoint?.authority===0&&BOOT.for_ai_agent_first_entrypoint?.new_truth_owner===false&&BOOT.for_ai_agent_first_entrypoint?.ux_shell?.runtime_owned_after_handoff===true&&has(prompt,'for_ai_agent_first_entrypoint')
};
const assessment=assessOntologicalPromise(evidence),validation=validateOntologicalPromiseAssessment(assessment);
const sourceHead=process.env.GITHUB_SHA||null;
const result={schema:'ikant-le-c29-repository-conformance/v1',source_head:sourceHead,evidence,assessment,assessment_valid:validation.ok,errors:validation.errors,status:validation.ok&&assessment.respected&&assessment.score_bps===10000?'PASS':'FAIL',claim_boundary:'repository conformance evidence is not current-host physical proof, external-platform observation, phenomenology or world truth'};
console.log(JSON.stringify(result));
const oi=process.argv.indexOf('--output');if(oi>=0&&process.argv[oi+1]){const out=path.resolve(process.argv[oi+1]);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');}
if(result.status!=='PASS')process.exitCode=2;
