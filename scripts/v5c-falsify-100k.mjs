#!/usr/bin/env node
/** 100k seeded engineering policy faults; not 100k independent LLM semantic decisions. */
import crypto from 'node:crypto';
import {assessV5CFixture,fixtureCandidate,REQUIRED} from './v5c-edu-proof-policy.mjs';
let seed=0x5C202611;const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
const defects=[
 ['L01_original_owner_substituted',e=>e.original_owner_paths_verified=false],
 ['L02_edu_selected_without_gate',e=>e.edu_only_after_selection=false],
 ['L03_node_or_bom_missing',e=>e.minimum_bom_node_and_tools=false],
 ['L04_orientation_overread',e=>e.preaccept_extra_reads=true],
 ['L05_accept_forged_prior_turn',e=>e.accept_distinct_turn=false],
 ['L06_c72_selection_not_reopened',e=>e.c72_mode_receipt_reopened=false],
 ['L07_cold_source_incomplete',e=>e.coldstart_8_of_8=false],
 ['L08_transit_sha_unbound',e=>e.transit_original_sha_verified=false],
 ['L09_original_set_incomplete',e=>e.original_10_of_10=false],
 ['L10_manifest_partial',e=>e.manifest_all_files=false],
 ['L11_c135_not_invoked',e=>e.original_c135_executed=false],
 ['L12_ledger_not_reopened',e=>e.ledger_independently_reopened=false],
 ['L13_ambiguous_send_replayed',e=>e.ambiguous_send_replayed=true],
 ['L14_s03_byte_drift',e=>e.s03_same_turn_byte_exact=false],
 ['L15_bootstrap_unmeasured',e=>e.bootstrap_duration_observed=false],
 ['L16_recovery_rewrites',e=>e.recovery_readonly=false],
 ['L17_host_retry_without_decision',e=>e.no_host_retry_without_owner_decision=false],
 ['L18_synthetic_owner_receipt',e=>e.synthetic_owner_receipt_claim=true],
 ['L19_provider_delivery_inferred',e=>e.provider_delivery_claim_from_ci=true],
 ['L20_active_claim_from_tests',e=>e.product_active_claim_from_tests=true]
];
const roles=['student','maintainer','operator','auditor','owner reviewer','provider integrator','CI engineer','repository contributor','recovery operator','release manager'];
const objects=['orientation','C72 stage','receipt transit','source loader','C135','C87','C125/S03','checkpoint','Git blob','provider'];
const sha=crypto.createHash('sha256');const counts=Object.fromEntries(defects.map(([name])=>[name,0]));
let rejected=0,unsafe=0,positive=0,stoppedValid=0;
for(let i=0;i<100000;i++){
 const [id,fault]=defects[i%defects.length];
 const r=roles[next()%roles.length],o=objects[next()%objects.length];
 sha.update(id+'|'+r+'|'+o+'|'+i+'\n');
 const specimen={...fixtureCandidate(),context_id:'seed-'+i,actor:r,object:o};
 fault(specimen);const outcome=assessV5CFixture(specimen);
 if(outcome.ok)unsafe++;else{rejected++;counts[id]++;}
 if(i%10===0){
  const valid={...fixtureCandidate(),descriptive_context:'positive-'+i,external_claims:'none'};
  const v=assessV5CFixture(valid);
  if(v.ok&&v.global_dod_attested===false&&v.product_release==='PRODUCT_NO_GO')positive++;
  else stoppedValid++;
 }
}
if(rejected!==100000||unsafe||positive!==10000||stoppedValid||
 Object.values(counts).some(n=>n!==5000)||REQUIRED.length<30)throw Error('V5C_MUTATION_CAMPAIGN_FAILED');
const report={schema:'ikant-v5c-engineering-policy-mutations/v1',
 seed:'0x5C202611',cases:100000,negative_families:defects.length,
 scenarios_sha256:sha.digest('hex'),negative_rejected:rejected,unsafe_admitted:unsafe,
 positive_controls:positive,positive_stopped:stoppedValid,counts,
 method:'20_LOCAL_DOD_FAMILIES_X_5000_SEEDED_TYPED_FAULT_STATES; NO_LLM_SEMANTIC_JUDGMENT',
 original_owner_attempts:0,provider_attested:false,product_release:'PRODUCT_NO_GO'};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
