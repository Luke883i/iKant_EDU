import crypto from 'node:crypto';
import {assessC72UserValue} from './c72-value-assessor.mjs';

const H64=/^[a-f0-9]{64}$/;
const SHA=x=>crypto.createHash('sha256').update(x).digest('hex');
export function wilsonLower(successes,trials,z=1.6448536269514722){
 if(!Number.isSafeInteger(successes)||!Number.isSafeInteger(trials)||trials<1||successes<0||successes>trials)return null;
 const p=successes/trials,z2=z*z,d=1+z2/trials;
 return (p+z2/(2*trials)-z*Math.sqrt(p*(1-p)/trials+z2/(4*trials*trials)))/d;
}
const blocked=(edge,extras={})=>({schema:'ikant-le-c83-evidence-gate/v1',status:'C83_NOT_ATTESTED',first_unclosed_edge:edge,semantic_holdout_attested:false,human_quality_attested:false,native_delivery_attested:false,persistence_attested:false,h95_attested:false,active:false,authority:0,...extras});
/** Caller-submitted evidence is numerical only; no model-authored payload,
 * claimed evaluator signature, or synthetic session qualifies as independent. */
export function assessC83ProductClaims({holdout,humanReview,fieldStudy,nativeEvidence}={}){
 if(!holdout||holdout.schema!=='ikant-le-c83-holdout/v1'||
    !Number.isSafeInteger(holdout.trials)||holdout.trials<1||
    !Number.isSafeInteger(holdout.correct)||holdout.correct<0||holdout.correct>holdout.trials||
    !H64.test(String(holdout.dataset_sha256||''))||
    !['UNVERIFIED_CALLER','EXTERNALLY_REFERENCED_UNATTESTED'].includes(holdout.source_type))
   return blocked('INDEPENDENT_SEMANTIC_HOLDOUT');
 if(!humanReview||humanReview.schema!=='ikant-le-c83-human-review/v1'||
    !Number.isSafeInteger(humanReview.trials)||humanReview.trials<1||
    !Number.isSafeInteger(humanReview.passed)||humanReview.passed<0||humanReview.passed>humanReview.trials||
    !H64.test(String(humanReview.rubric_sha256||''))||
    !['UNVERIFIED_CALLER','EXTERNALLY_REFERENCED_UNATTESTED'].includes(humanReview.source_type))
   return blocked('INDEPENDENT_HUMAN_QUALITY_REVIEW');
 const holdoutLower=wilsonLower(holdout.correct,holdout.trials),qualityLower=wilsonLower(humanReview.passed,humanReview.trials);
 const metricCandidate=holdoutLower>=0.95&&qualityLower>=0.90;
 const value=fieldStudy?assessC72UserValue(fieldStudy):null;
 const fieldCandidate=value?.metric_target_met===true;
 const hostEdges=!!nativeEvidence&&nativeEvidence.native_event_receipt_external===true&&
 nativeEvidence.delivery_readback_external===true&&nativeEvidence.durable_writer_later_readback_external===true;
 // These booleans are supplied by the caller: only native owner-controlled
 // independently verified receipts can discharge the actual host edge.
 return blocked(metricCandidate?(fieldCandidate?'EXTERNAL_HOST_EVIDENCE_AUTHENTICATION':'INDEPENDENT_HOST_FIELD_STUDY'):'SEMANTIC_OR_HUMAN_HOLDOUT_THRESHOLD',{
  status:metricCandidate&&fieldCandidate?'C83_ALL_NUMERIC_CANDIDATES_UNATTESTED':'C83_METRICS_INCOMPLETE_OR_BELOW_TARGET',
  holdout_accuracy:holdout.correct/holdout.trials,holdout_wilson_lower:holdoutLower,
  quality_pass_fraction:humanReview.passed/humanReview.trials,quality_wilson_lower:qualityLower,
  semantic_numeric_candidate:holdoutLower>=0.95,human_numeric_candidate:qualityLower>=0.90,
  h95_numeric_candidate:fieldCandidate,host_claims_supplied_unverified:hostEdges,
  field_projection:value, external_evidence_witness_verified:false,
  input_evidence_digest:SHA(JSON.stringify({holdout,humanReview,fieldStudy,nativeEvidence}))
 });
}
