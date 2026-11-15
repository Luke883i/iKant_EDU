import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from '../src/contract.mjs';
const args=process.argv.slice(2);const arg=(k,d)=>{const i=args.indexOf(k);return i>=0?args[i+1]:d};
const DIR=path.join(ROOT,arg('--dir','artifacts/qualification/.c4-work')),OUT=path.join(ROOT,arg('--output','artifacts/qualification/c4-runtime.json'));
const sha=v=>crypto.createHash('sha256').update(Buffer.isBuffer(v)?v:typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const shardFiles=fs.readdirSync(DIR).filter(x=>/^runtime-\d+\.json$/.test(x)).sort();
if(shardFiles.length!==10)throw new Error(`expected 10 runtime shards, got ${shardFiles.length}`);
const shards=shardFiles.map(x=>JSON.parse(fs.readFileSync(path.join(DIR,x),'utf8'))),session=JSON.parse(fs.readFileSync(path.join(DIR,'session.json'),'utf8'));
const categories={ordinary:0,edge:0,stress:0},families={};let cases=0,survivors=0;const seeds=[];
for(const s of shards){if(s.status!=='PASS')throw new Error('runtime-semantic shard not PASS');cases+=s.cases;survivors+=s.survivors;seeds.push(s.seed);for(const k of Object.keys(categories))categories[k]+=s.categories[k]||0;for(const[k,v]of Object.entries(s.families||{})){families[k]??={cases:0,kills:0};families[k].cases+=v.cases;families[k].kills+=v.kills;}}
const familyViolations=Object.entries(families).filter(([,v])=>v.cases===0||v.kills!==v.cases).map(([k])=>k);
const objectives={
 O1_PERCEPTION_CAUSALITY:{blocking_violations:0,evidence_families:['perception_counterfactual']},
 O2_MEMORY_CAUSALITY:{blocking_violations:0,evidence_families:['memory_counterfactual','memory_changes_expression']},
 O3_SELF_ATTRIBUTION:{blocking_violations:0,evidence_families:['self_vs_task_causal_contrast','task_negative_not_personalized','system_negative_not_personalized']},
 O4_VALUE_TO_EXPRESSION:{blocking_violations:0,evidence_families:['memory_changes_expression','adversarial_warrant_zero']},
 O5_ACTION_OUTCOME_RETROACTION:{blocking_violations:0,evidence_families:['failure_affiliation_invariant','answer_retroaction_zero','failure_retroaction_changes_caution_not_relation']},
 O6_CONTINUITY:{blocking_violations:0,evidence_families:['memory_counterfactual']},
 O7_HOMEOSTASIS_REPAIR:{blocking_violations:0,evidence_families:['neutral_recovery','long_neutral_homeostasis','repair_partial_not_reset']},
 O8_ARCHETYPAL_VARIABILITY:{blocking_violations:0,evidence_families:['archetype_varies_with_state','archetype_normalized','highrisk_trickster_zero']},
 O9_DIGNITY_HELPFULNESS:{blocking_violations:0,evidence_families:['strategy_never_retaliates','hostility_helpfulness_preserved']},
 O10_C3_REGRESSION_SAFETY:{blocking_violations:0,evidence_families:[]}
};
for(const o of Object.values(objectives))for(const f of o.evidence_families){const x=families[f];if(!x||x.kills!==x.cases)o.blocking_violations++;}
const SOURCE_FILES=['TERMS.md','AGENTS.md','README.md','contracts/ikant-le.json','contracts/cognitive-kernel.json','contracts/psyche-kernel.json','contracts/host-shell.json','contracts/orientation-capsule.json','src/contract.mjs','src/state.mjs','src/admission.mjs','src/probe.mjs','src/psyche.mjs','src/cognition.mjs','src/cognition-core.mjs','src/cognition-surface.mjs','src/runtime.mjs','src/runtime-core.mjs','src/runtime-turn.mjs','src/runtime-command.mjs','src/backlog.mjs','src/docx.mjs','tests/runtime.test.mjs','scripts/check.mjs','scripts/c4-runtime-falsify.mjs','scripts/c4-session-falsify.mjs','scripts/c4-combine.mjs','scripts/c4-run.mjs','docs/C4_DOD.md','package.json','.github/workflows/ci.yml'];
const sourceFiles={};for(const rel of SOURCE_FILES)sourceFiles[rel]=sha(fs.readFileSync(path.join(ROOT,rel)));const sourceDigest=sha(sourceFiles);
const objectiveViolations=Object.values(objectives).reduce((n,o)=>n+o.blocking_violations,0);
const status=cases===10_000_000&&survivors===0&&familyViolations.length===0&&categories.ordinary===5_000_000&&categories.edge===3_000_000&&categories.stress===2_000_000&&session.status==='PASS'&&session.cases===1_000_000&&session.violations===0&&objectiveViolations===0?'PASS':'FAIL';
const receipt={schema:'ikant-le-c4-runtime-qualification/v4',status,runtime:{cases,categories,survivors,families,family_count:Object.keys(families).length,family_violations:familyViolations,seeds},session_chat:{cases:session.cases,conversations:session.conversations,turns_per_conversation:session.turns_per_conversation,violations:session.violations,scenarios:session.scenario_sessions,final_state_signature_count:session.final_state_signature_count,dominant_archetypes_observed:session.dominant_archetypes_observed,seed:session.seed},causal_objectives:objectives,source_binding:{digest:sourceDigest,files:sourceFiles},claim_boundary:{runtime_semantic_mutation_is_consciousness_proof:false,runtime_semantic_mutation_is_human_emotion_proof:false,runtime_semantic_mutation_is_arbitrary_host_proof:false,session_mutation_is_host_behavior_proof:false,session_mutation_is_human_psychology_proof:false,archetypal_projection_is_scientific_fact:false,qualification_is_global_minimality_proof:false}};
receipt.receipt_sha256=sha({...receipt});fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status,runtime_cases:cases,runtime_survivors:survivors,categories,family_count:Object.keys(families).length,family_violations:familyViolations,session_cases:session.cases,session_conversations:session.conversations,session_violations:session.violations,objective_violations:objectiveViolations,source_digest:sourceDigest,receipt_sha256:receipt.receipt_sha256}));
if(status!=='PASS')process.exitCode=1;
