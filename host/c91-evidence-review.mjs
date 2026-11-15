import crypto from 'node:crypto';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const H64=/^[a-f0-9]{64}$/;
const stop=e=>({schema:'ikant-le-c91-review/v1',status:'C91_REVIEW_STOP',
 first_unclosed_edge:e,semantic_truth_attested:false,independent_model_attested:false,
 authority:0});
/** A real second callback is mandatory. Even a passing review remains untrusted
 * without host-authenticated provider execution and independent fact checking. */
export async function reviewC91Candidate({task,candidate,reviewPort}={}){
 if(!task||task.schema!=='ikant-le-c91-language-task/v1'||
  !candidate||candidate.schema!=='ikant-le-c91-language-candidate/v1'||
  !reviewPort||typeof reviewPort.check!=='function')return stop('SECOND_REVIEW_PORT_REQUIRED');
 const candidateSha=sha(Buffer.from(JSON.stringify(candidate),'utf8'));
 const src=new Set((task.evidence||[]).map(x=>x.id));
 let result;
 try{result=await reviewPort.check(Object.freeze({
  schema:'ikant-le-c91-review-request/v1',input_sha256:task.input_sha256,
  candidate_sha256:candidateSha,source_head:task.source_head,
  evidence:task.evidence,candidate,authority:0}));}
 catch{return stop('SECOND_REVIEW_CALL_FAILED');}
 if(!result||typeof result!=='object'||Array.isArray(result)||
  Object.keys(result).sort().join(',')!==['schema','authority','input_sha256',
    'source_head','candidate_sha256','phenomenal_promotion_detected',
    'unsupported_claims_detected','contradictions_unresolved','question_reviews'].sort().join(',')||
  result.schema!=='ikant-le-c91-review-result/v1'||
  result.authority!==0||result.input_sha256!==task.input_sha256||
  result.candidate_sha256!==candidateSha||result.source_head!==task.source_head||
  result.phenomenal_promotion_detected!==false||
  result.unsupported_claims_detected!==false||
  result.contradictions_unresolved!==false||
  !Array.isArray(result.question_reviews)||result.question_reviews.length!==candidate.questions.length)
  return stop('REVIEW_OR_CLAIM_INVALID');
 for(let i=0;i<result.question_reviews.length;i++){
  const q=result.question_reviews[i];
  if(!q||typeof q!=='object'||Array.isArray(q)||
     Object.keys(q).sort().join(',')!=='evidence_ids,index,support_class'||q.index!==i+1||q.support_class!=='BOUNDED_POLICY_INFERENCE'||
     !Array.isArray(q.evidence_ids)||!q.evidence_ids.length||
     q.evidence_ids.some(id=>!src.has(id))||
     new Set(q.evidence_ids).size!==q.evidence_ids.length)return stop('REVIEW_UNSUPPORTED_QUESTION');
 }
 return {schema:'ikant-le-c91-review/v1',status:'C91_TWO_CALLBACKS_VALIDATED_NOT_FACTUALLY_ATTESTED',
  candidate_sha256:candidateSha,review_sha256:sha(Buffer.from(JSON.stringify(result),'utf8')),
  checks:result.question_reviews.length,review_callback_invoked:true,
  reviewer_origin_independently_attested:false,independent_factual_validation:false,
  semantic_truth_attested:false,authority:0};
}
