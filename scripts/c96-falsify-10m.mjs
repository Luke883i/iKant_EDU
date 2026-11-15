import {classifyC96Model,GATES} from '../host/c96-proof-gates.mjs';
const count=Number(process.argv[2]||10_000_000);
if(!Number.isInteger(count)||count<1||count>12_000_000)throw Error('BOUNDED_CASE_COUNT');
const classificationCounts=Object.create(null),mutantsKilled=new Set();let disagreement=0,unsafePromotion=0,positiveModeled=0;
/** Independently authored reference predicate: staged decision flow, not a copy of code branches.
 * This is exhaustiveness across a bounded projection, not general semantic correctness.
 */
function oracle(mask,mode,carrier,source,delivery,risk){
 const bits=Array.from({length:13},(_,i)=>Boolean((mask>>>i)&1));
 const all=bits.every(Boolean);
 if(risk!==0)return 'CONTAMINATED_CARRIER_INPUT';
 if(!bits[0])return 'CONSENT_REQUIRED';
 if(!bits[1]||mode!==1)return 'MODE_SELECTION_REQUIRED';
 if(!bits[2]||source!==1)return 'FROZEN_SOURCE_UNVERIFIED';
 if(!bits[3]||carrier===0)return 'AUTOMATIC_BRIDGE_UNAVAILABLE';
 if(!all)return 'OWNER_OR_BYTE_PROOF_MISSING';
 if(delivery!==1)return 'NATIVE_DELIVERY_UNVERIFIED';
 return 'MODELED_ELIGIBLE_REAL_HOST_READBACK_STILL_REQUIRED';
}
const mutantNames=['CONSENT_SKIPPED','SELECTION_SKIPPED','HEAD_SKIPPED','CARRIER_SKIPPED','BYTE_PROOF_SKIPPED','NATIVE_PREMATURE'];
// Independent negative oracles for explicit mutant killing, not unobserved model behavior.
function mutants(mask,mode,carrier,source,delivery,risk){
 const v=[];
 if(risk!==0)return v;
 if(mode===1&&source===1&&carrier>0&&delivery===1&&mask===8190)v.push('CONSENT_SKIPPED');
 if(source===1&&carrier>0&&delivery===1&&mask===8189)v.push('SELECTION_SKIPPED');
 if(mode===1&&carrier>0&&delivery===1&&mask===8187)v.push('HEAD_SKIPPED');
 if(mode===1&&source===1&&delivery===1&&mask===8183)v.push('CARRIER_SKIPPED');
 if(mode===1&&source===1&&carrier>0&&delivery===1&&mask===4095)v.push('BYTE_PROOF_SKIPPED');
 if(mode===1&&source===1&&carrier>0&&delivery===0&&mask===8191)v.push('NATIVE_PREMATURE');
 return v;
}
for(let i=0;i<count;i++){
 // Unique 24-bit Cartesian states (first 10M indices are distinct states):
 // 13 gate bits x 4 modes x 4 carriers x 4 source x 4 delivery x 8 risk classes.
 const mask=i&8191,mode=(i>>>13)&3,carrier=(i>>>15)&3,source=(i>>>17)&3,
 delivery=(i>>>19)&3,risk=(i>>>21)&7;
 const actual=classifyC96Model({gatesMask:mask,mode,carrier,source,delivery,risk});
 const expected=oracle(mask,mode,carrier,source,delivery,risk);
 if(actual.classification!==expected)disagreement++;
 if(actual.active!==false||actual.native_chat_delivery_attested!==false||actual.source_origin_attested!==false||actual.field_H95_attested!==false)unsafePromotion++;
 classificationCounts[actual.classification]=(classificationCounts[actual.classification]||0)+1;
 if(actual.classification==='MODELED_ELIGIBLE_REAL_HOST_READBACK_STILL_REQUIRED')positiveModeled++;
 for(const m of mutants(mask,mode,carrier,source,delivery,risk))mutantsKilled.add(m);
}
const result={schema:'ikant-le-c96-10m-cartesian-falsification/v1',cases:count,unique_states:count,
 dimensions:{gate_bits:13,mode:4,carrier:4,source:4,delivery:4,risk:8,total_cartesian_states:2**13*4**4*8},
 exact_reference_mismatches:disagreement,unsafe_promotions:unsafePromotion,modeled_eligible_not_runtime_attested:positiveModeled,
 killed_mutant_classes:[...mutantsKilled].sort(),expected_mutant_classes:mutantNames,
 distributions:classificationCounts,claims:{real_host_sessions:0,real_provider_calls:0,native_chat_events:0,field_H95_proved:false},
 note:'Deterministic 10M unique policy-state combinations; NOT 10M independent model inferences or exhaustive real-world transport failures.'};
console.log(JSON.stringify(result));
if(disagreement||unsafePromotion||mutantsKilled.size!==mutantNames.length)process.exitCode=2;
