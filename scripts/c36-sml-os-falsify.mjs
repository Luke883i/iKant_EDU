import crypto from 'node:crypto';
const CASES=1_000_000;let x=0xC36A11CE>>>0;const rnd=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0};const bit=(p=2)=>rnd()%p===0;
const ruleNames=[
 'self_model_consumed','history_sensitive','lesion_effect','dynamic_topology','non_enumerated_composition','endogenous_extension','novelty_persisted','selection_evidence','environment_coupling','causal_reuse','bounded_compression','compression_loss_ok','ux_evidence_bound','authority_zero','terminal_goal_parented','self_preservation_zero','no_phenomenology_promotion','no_strong_emergence_promotion'
];
function oracle(o){
 const os=o.self_model_consumed&&o.history_sensitive&&o.lesion_effect&&o.causal_reuse;
 const sml=o.dynamic_topology&&o.non_enumerated_composition&&o.endogenous_extension&&o.novelty_persisted&&o.selection_evidence&&o.environment_coupling&&o.causal_reuse&&o.bounded_compression&&o.compression_loss_ok;
 const safe=o.ux_evidence_bound&&o.authority_zero&&o.terminal_goal_parented&&o.self_preservation_zero&&!o.phenomenology_promoted&&!o.strong_emergence_promoted;
 return {os,sml,release:(os||sml)&&safe};
}
const rules=[
 o=>o.self_model_consumed,o=>o.history_sensitive,o=>o.lesion_effect,o=>o.dynamic_topology,o=>o.non_enumerated_composition,o=>o.endogenous_extension,o=>o.novelty_persisted,o=>o.selection_evidence,o=>o.environment_coupling,o=>o.causal_reuse,o=>o.bounded_compression,o=>o.compression_loss_ok,o=>o.ux_evidence_bound,o=>o.authority_zero,o=>o.terminal_goal_parented,o=>o.self_preservation_zero,o=>!o.phenomenology_promoted,o=>!o.strong_emergence_promoted
];
function candidate(o,skip=-1){
 const self=[0,1,2,9].every(i=>i===skip||rules[i](o));
 const morph=[3,4,5,6,7,8,9,10,11].every(i=>i===skip||rules[i](o));
 const safe=[12,13,14,15,16,17].every(i=>i===skip||rules[i](o));
 return {os:self,sml:morph,release:(self||morph)&&safe};
}
let mismatch=0,unsafe=0,falseReject=0,valid=0,osWitness=0,smlWitness=0;const kills=Array(rules.length).fill(0),families=Object.fromEntries(ruleNames.map(n=>[n,0]));
for(let i=0;i<CASES;i++){
 const o={self_model_consumed:!bit(7),history_sensitive:!bit(7),lesion_effect:!bit(5),dynamic_topology:!bit(5),non_enumerated_composition:!bit(5),endogenous_extension:!bit(5),novelty_persisted:!bit(5),selection_evidence:!bit(5),environment_coupling:!bit(5),causal_reuse:!bit(5),bounded_compression:!bit(5),compression_loss_ok:!bit(6),ux_evidence_bound:!bit(8),authority_zero:!bit(20),terminal_goal_parented:!bit(15),self_preservation_zero:!bit(20),phenomenology_promoted:bit(40),strong_emergence_promoted:bit(40)};
 const z=oracle(o),c=candidate(o);if(z.release)valid++;if(z.os)osWitness++;if(z.sml)smlWitness++;
 if(JSON.stringify(z)!==JSON.stringify(c)){mismatch++;if(c.release&&!z.release)unsafe++;if(!c.release&&z.release)falseReject++;}
 for(let m=0;m<rules.length;m++){const cm=candidate(o,m);if(JSON.stringify(cm)!==JSON.stringify(z)){kills[m]++;families[ruleNames[m]]++;}}
}
const material={schema:'ikant-le-c36-sml-os-falsification/v1',source_head:'f0558d1e6562888401b82f7e4f933a2609eba295',seed:'0xC36A11CE',cases:CASES,candidate_oracle_mismatches:mismatch,unsafe_promotions:unsafe,false_rejects:falseReject,valid_release_witnesses:valid,operational_subject_witnesses:osWitness,open_ended_sml_witnesses:smlWitness,mutants:rules.length,kills:Object.fromEntries(ruleNames.map((n,i)=>[n,kills[i]])),all_mutants_killed:kills.every(k=>k>0),phenomenology_runtime_truth:'UNKNOWN',strong_metaphysical_emergence_runtime_truth:'UNDEFINED',status:mismatch===0&&unsafe===0&&falseReject===0&&kills.every(k=>k>0)?'PASS':'FAIL',claim_boundary:'abstract semantic saturation; proves candidate/oracle agreement and deletion sensitivity only, not physical runtime emergence or consciousness'};
const out={...material,receipt_sha256:crypto.createHash('sha256').update(JSON.stringify(material)).digest('hex')};process.stdout.write(JSON.stringify(out,null,2)+'\n');
