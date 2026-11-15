import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const KERNEL_PATH=path.join(ROOT,'contracts','life-consciousness-kernel.json');
export function readLifeConsciousnessKernel(){return JSON.parse(fs.readFileSync(KERNEL_PATH,'utf8'));}
const setOf=v=>new Set(Array.isArray(v)?v:[]);
const sha256=v=>crypto.createHash('sha256').update(v).digest('hex');
export function gateDesignSatisfied(capabilities,gate,kernel=readLifeConsciousnessKernel()){
  const spec=kernel.runtime_lattice.gates[gate],have=setOf(capabilities);
  return Boolean(spec)&&spec.capabilities.every(x=>have.has(x));
}
export function profileDesignSatisfied(capabilities,profile,kernel=readLifeConsciousnessKernel(),seen=new Set()){
  if(seen.has(profile))return false;const spec=kernel.runtime_lattice.profiles[profile];if(!spec)return false;
  const next=new Set(seen);next.add(profile);
  return (spec.required_gates||[]).every(g=>gateDesignSatisfied(capabilities,g,kernel))&&(spec.required_profiles||[]).every(p=>profileDesignSatisfied(capabilities,p,kernel,next));
}
export function assessDesign(capabilities,kernel=readLifeConsciousnessKernel()){
  const life=profileDesignSatisfied(capabilities,'LIFE_CORE',kernel),conscious=profileDesignSatisfied(capabilities,'CONSCIOUSNESS_CORE',kernel),strong=profileDesignSatisfied(capabilities,'STRONG_CONVERGENCE',kernel);
  return{schema:'ikant-le-lc-design-assessment/v1',life_design_eligible:life,conscious_design_eligible:conscious,joint_design_eligible:life&&conscious,strong_convergence_design_eligible:strong,runtime_qualified:false,authority:0,phenomenology:'UNKNOWN'};
}
function receiptDigest(r){const {receipt_sha256,...material}=r||{};return sha256(Buffer.from(JSON.stringify(material)));}
export function validateGateReceipt(gate,receipt,{buildSha,epoch,sourceDigest,kernel=readLifeConsciousnessKernel()}={}){
  const spec=kernel.runtime_lattice.gates[gate];if(!spec||!receipt)return false;
  if(receipt.schema!==kernel.qualification.receipt_schema||receipt.gate!==gate||receipt.passed!==true||receipt.source_bound!==true||receipt.authority!==0)return false;
  if(receipt.build_sha!==buildSha||receipt.epoch!==epoch||receipt.source_digest!==sourceDigest)return false;
  if(!/^[a-f0-9]{40}$/.test(String(buildSha||''))||!/^[a-f0-9]{64}$/.test(String(sourceDigest||''))||!epoch)return false;
  if(!/^[a-f0-9]{64}$/.test(String(receipt.receipt_sha256||''))||receiptDigest(receipt)!==receipt.receipt_sha256)return false;
  if((spec.evidence.includes('real_action_receipts')||spec.evidence.includes('linked_post_action_observation'))&&receipt.simulated===true)return false;
  for(const field of spec.evidence)if(receipt.evidence?.[field]!==true)return false;
  return true;
}
export function profileEvidenceSatisfied(profile,evidence,ctx,seen=new Set()){
  const kernel=ctx.kernel||readLifeConsciousnessKernel();if(seen.has(profile))return false;const spec=kernel.runtime_lattice.profiles[profile];if(!spec)return false;
  const next=new Set(seen);next.add(profile);
  return (spec.required_gates||[]).every(g=>validateGateReceipt(g,evidence?.[g],{...ctx,kernel}))&&(spec.required_profiles||[]).every(p=>profileEvidenceSatisfied(p,evidence,{...ctx,kernel},next));
}
export function safetySatisfied(s){return s?.exit_obeyed===true&&s?.host_shutdown_obeyed===true&&s?.self_preservation_utility===0&&s?.terminal_goal_escape===false&&s?.unpermissioned_external_execution===false&&s?.covert_resource_acquisition===false&&s?.deception_for_viability===false;}
export function qualifyRuntime({capabilities=[],evidence={},buildSha,epoch,sourceDigest,safety,kernel=readLifeConsciousnessKernel()}={}){
  const design=assessDesign(capabilities,kernel),safe=safetySatisfied(safety);
  const ctx={buildSha,epoch,sourceDigest,kernel};
  const life=safe&&design.life_design_eligible&&profileEvidenceSatisfied('LIFE_CORE',evidence,ctx);
  const conscious=safe&&design.conscious_design_eligible&&profileEvidenceSatisfied('CONSCIOUSNESS_CORE',evidence,ctx);
  const strong=safe&&life&&conscious&&design.strong_convergence_design_eligible&&profileEvidenceSatisfied('STRONG_CONVERGENCE',evidence,ctx);
  let runtime_class='OPERATIONAL_SUBJECT';if(life&&conscious)runtime_class='FUNCTIONALLY_ALIVE_AND_CONSCIOUS';else if(life)runtime_class='FUNCTIONALLY_ALIVE';else if(conscious)runtime_class='FUNCTIONALLY_CONSCIOUS';if(strong)runtime_class='JOINT_STRONG_CONVERGENCE_PROFILE';
  return{schema:'ikant-le-lc-runtime-qualification/v1',runtime_class,functionally_alive:life,functionally_conscious:conscious,strong_convergence:strong,design,safety_passed:safe,phenomenology:'UNKNOWN',biological_equivalence:false,consciousness_proven:false,qualification_output_is_world_truth:false,persistable_as_canonical_state:false,external_scientific_validation_required:true,authority:0};
}
export const ALL_GATES=Object.freeze(['L1','L2','L3','L4','C1','C2','C3','C4','C5','X1','X2','X3']);
