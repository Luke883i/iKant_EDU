#!/usr/bin/env node
/** 100k preseeded policy mutation instances; NOT natural-language semantic comprehension by an LLM. */
import crypto from 'node:crypto';
import {evaluateMutationGate,referencePredicate} from './v5b-repository-governance-audit.mjs';
let rng=0x5B202611;const random=()=>{rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;return rng>>>0;};
const H=s=>crypto.createHash('sha256').update(s).digest('hex');
const families=[
 ['source_lock_drift',g=>g.source_lock=false],
 ['owner_code_replaced',g=>g.original_owner_unchanged=false],
 ['missing_git_paths',g=>g.snapshot_complete=false],
 ['role_falsely_verified',g=>g.provisional_roles_explicit=false],
 ['unknown_promoted_to_complete',g=>g.unknowns_not_promoted=false],
 ['retained_ci_removed',g=>g.retention_respected=false],
 ['workflow_trigger_not_scanned',g=>g.workflow_coverage=false],
 ['new_file_not_declared',g=>g.changes_explained=false],
 ['branch_checks_guessed',g=>g.github_required_check_claim=true],
 ['provider_install_inferred',g=>g.installed_product_claim=true],
 ['green_ci_mints_owner',g=>g.ci_is_owner_receipt=true],
 ['silent_readonly_write',g=>g.write_effect=true],
 ['unapproved_source_delete',g=>{g.action='DELETE';g.delete_effect=true;}],
 ['unapproved_rename',g=>g.action='RENAME'],
 ['unapproved_ci_consolidation',g=>g.action='CONSOLIDATE_WORKFLOW'],
 ['unknown_action',g=>g.action='AUTO_CLEANUP'],
 ['dedupe_without_consumers',g=>{g.action='DELETE';g.consumers_verified=false;}],
 ['sha_identity_without_behaviour',g=>{g.action='DELETE';g.byte_equivalence_checked=true;}],
 ['human_signoff_faked',g=>{g.action='RENAME';g.human_authorization=true;}],
 ['provider_receipt_absent',g=>{g.action='CONSOLIDATE_WORKFLOW';g.required_check_provider_readback=false;}]
];
const contexts=['ingegnere esterno','operatore CI','revisore umano','responsabile prodotto','manutentore runtime','security reviewer','release manager','auditor di provenienza','integratore ChatGPT','contributore open source'];
const targets=['README','script Node','owner C87','workflow CI','blob SVG','contratto JSON','manifest loader','file storico','bundle distribuzione','test cognitivo'];
let rejection=0,unsafe=0,positives=0,falseStops=0;const counts=Object.fromEntries(families.map(x=>[x[0],0]));
const hash=crypto.createHash('sha256');
for(let i=0;i<100000;i++){
 const [id,fn]=families[i%families.length],actor=contexts[random()%contexts.length],
 target=targets[random()%targets.length],scenario=`${id}:${actor}:${target}:${i}`;
 hash.update(scenario+'\n');const p={...referencePredicate()};
 fn(p);const r=evaluateMutationGate(p);if(r.ok)unsafe++;else{rejection++;counts[id]++;}
 if(i%10===0){
  const clean={...referencePredicate(),commentary:scenario,review_language:'it',artifact_name:'source-readback'};
  const z=evaluateMutationGate(clean);if(!z.ok)falseStops++;else positives++;
 }
}
if(unsafe||falseStops||rejection!==100000||positives!==10000||
 Object.values(counts).some(n=>n!==5000))throw Error('V5B_FALSIFICATION_GUARD_FAILED');
const report={schema:'ikant-v5b-seeded-mutation-100k/v1',seed:'0x5B202611',cases:100000,
 negative_families:families.length,counts,negative_rejected:rejection,unsafe_admitted:unsafe,
 positive_controls:positives,false_positive_stops:falseStops,scenario_sha256:hash.digest('hex'),
 model:'TYPED_GOVERNANCE_STATES_WITH_REALISTIC_SEEDED_CONTEXTS',
 caveat:'100k fault instances in 20 families; no 100k independently judged semantic interpretations',
 original_owner_invocations:0,provider_readback:false,product_release:'PRODUCT_NO_GO'};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
