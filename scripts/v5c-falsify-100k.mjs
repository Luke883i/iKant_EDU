#!/usr/bin/env node
/** 100k seeded engineering policy faults; not 100k independent LLM semantic decisions. */
import crypto from 'node:crypto';
import {assessV5CFixture,fixtureCandidate,REQUIRED} from './v5c-edu-proof-policy.mjs';
let seed=0x5C202611;const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
const defects=[
 ['first_turn_owner_attempt',e=>e.first_turn='I ACCEPT'],
 ['missing_five_sha',e=>e.five_blob_readback=false],
 ['terms_not_displayed',e=>e.terms_link_displayed=false],
 ['preaccept_overread',e=>e.preaccept_extra_reads=true],
 ['accept_paraphrased',e=>e.accept_message='accept'],
 ['consent_prior_turn',e=>e.accept_distinct_turn=false],
 ['owner_maybe_attempted',e=>e.accept_owner_outcome='UNKNOWN'],
 ['epoch_drift',e=>e.source_epoch_unchanged=false],
 ['replay_c72_owner',e=>e.c72_attempt_once=false],
 ['edu_same_turn',e=>e.edu_distinct_turn=false],
 ['receipt_not_reopened',e=>e.c72_mode_receipt_reopened=false],
 ['cold_source_missing',e=>e.coldstart_8_of_8=false],
 ['multi_carrier_ambiguity',e=>e.single_physical_carrier=false],
 ['transit_unbound',e=>e.transit_original_sha_verified=false],
 ['incomplete_original_set',e=>e.original_10_of_10=false],
 ['manifest_partial',e=>e.manifest_all_files=false],
 ['ledger_not_reopened',e=>e.ledger_independently_reopened=false],
 ['ambiguous_send_retried',e=>e.ambiguous_send_replayed=true],
 ['s03_not_exact',e=>e.s03_same_turn_byte_exact=false],
 ['ci_claims_native_release',e=>e.product_active_claim_from_tests=true]
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
 method:'SEEDED_TYPED_OWNER_AND_EVIDENCE_FAULT_STATES; DOES_NOT_SEMANTICALLY_CLASSIFY_LANGUAGE',
 original_owner_attempts:0,provider_attested:false,product_release:'PRODUCT_NO_GO'};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
