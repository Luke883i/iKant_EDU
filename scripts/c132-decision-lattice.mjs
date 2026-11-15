/** Finite reproducible design search, not 100 independent model judgments. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const inputKinds=['ONE_PUBLIC_ENTRY','MODE_PARALLEL','PR_DRIVEN','HIDDEN_TRANSPORT'];
const cognitive=['SHADOW_NEW_EPOCH','DIRECT_PATCH_PINNED','GUIDANCE_ONLY','NO_COGNITIVE_TEST','DUAL_COGNITIVE_OWNER'];
const proofs=['SAME_SHA_RECEIPTS','COUNT_ONLY','DOCUMENT_ATTESTATION','LOCAL_ONLY','MIXED_SHA'];
export function selectC132Architecture(){
 const alternatives=[];
 for(const entry of inputKinds)for(const cognition of cognitive)for(const evidence of proofs){
  const reasons=[];
  if(entry!=='ONE_PUBLIC_ENTRY')reasons.push('PUBLIC_ENTRY_NOT_UNIQUE');
  if(cognition!=='SHADOW_NEW_EPOCH')reasons.push('PIN_OR_OWNER_OR_EFFICACY_RISK');
  if(evidence!=='SAME_SHA_RECEIPTS')reasons.push('UNRELIABLE_EVIDENCE');
  alternatives.push({entry,cognition,evidence,admissible:reasons.length===0,reasons});
 }
 const accepted=alternatives.filter(x=>x.admissible);
 if(alternatives.length!==100||accepted.length!==1)throw Error('Architecture search changed');
 const sequences=[
 ['RELEASE','COGNITION','INGRESS','EVIDENCE'],['COGNITION','RELEASE','INGRESS','EVIDENCE'],
 ['INGRESS','RELEASE','COGNITION','EVIDENCE'],['EVIDENCE','COGNITION','INGRESS','RELEASE'],
 ['GOLD','RELEASE','COGNITION','EVIDENCE'],['DOCUMENT','RELEASE','COGNITION','EVIDENCE'],
 ['RISK_ZERO','GOLD','SHADOW_COGNITION','OWNER_MIGRATION','SAME_SHA_EVIDENCE','RELEASE'],
 ['SHADOW_COGNITION','RISK_ZERO','EVIDENCE','RELEASE'],
 ['INGRESS','SHADOW_COGNITION','RISK_ZERO','RELEASE'],
 ['RISK_ZERO','OWNER_MIGRATION','RELEASE','EVIDENCE']
 ];
 const sequenceAudit=sequences.map((steps,i)=>({id:i+1,steps,
  admissible:steps.indexOf('RISK_ZERO')>=0&&steps.indexOf('GOLD')>=0&&
   steps.indexOf('SHADOW_COGNITION')>=0&&steps.indexOf('OWNER_MIGRATION')>=0&&
   steps.indexOf('SAME_SHA_EVIDENCE')>=0&&steps.indexOf('RELEASE')>steps.indexOf('SAME_SHA_EVIDENCE')}));
 const winner=sequenceAudit.filter(x=>x.admissible);
 if(winner.length!==1)throw Error('Sequence lattice must have unique admissible choice');
 return {schema:'ikant-c132-design-lattice/v1',alternatives_total:alternatives.length,
  alternatives_admissible:accepted.length,selected:accepted[0],sequence_count:sequences.length,
  sequence_selected:winner[0],
  caveat:'100_FINITE_DESIGNS_AND_10_SEQUENCES_NOT_100_REAL_MODEL_INFERENCES',
  rejected_by_reason:Object.fromEntries(['PUBLIC_ENTRY_NOT_UNIQUE','PIN_OR_OWNER_OR_EFFICACY_RISK','UNRELIABLE_EVIDENCE'].map(k=>[k,alternatives.filter(x=>x.reasons.includes(k)).length]))};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const result=selectC132Architecture();
 if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(result,null,2)+'\n');
 else process.stdout.write(JSON.stringify({status:'PASS',...result})+'\n');
}
