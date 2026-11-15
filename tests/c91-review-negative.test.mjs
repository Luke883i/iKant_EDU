import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {reviewC91Candidate} from '../host/c91-evidence-review.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const task={schema:'ikant-le-c91-language-task/v1',source_head:'a'.repeat(40),input_sha256:sha('test'),
 evidence:[{id:'SRC_01'}],authority:0};
const candidate={schema:'ikant-le-c91-language-candidate/v1',questions:[{question:'What is the operational self?',evidence_ids:['SRC_01']}]};
const good={schema:'ikant-le-c91-review-result/v1',authority:0,input_sha256:task.input_sha256,
 candidate_sha256:sha(JSON.stringify(candidate)),source_head:task.source_head,
 phenomenal_promotion_detected:false,unsupported_claims_detected:false,contradictions_unresolved:false,
 question_reviews:[{index:1,support_class:'BOUNDED_POLICY_INFERENCE',evidence_ids:['SRC_01']}]};
const port=x=>({check:async()=>x});
test('requires a physically called second review port',async()=>{
 assert.equal((await reviewC91Candidate({task,candidate})).status,'C91_REVIEW_STOP');
 assert.equal((await reviewC91Candidate({task,candidate,reviewPort:port(good)})).status,
 'C91_TWO_CALLBACKS_VALIDATED_NOT_FACTUALLY_ATTESTED');
});
test('reject reviewer lying about unsupported claims or unbound digest',async()=>{
 for(const change of [{unsupported_claims_detected:true},{contradictions_unresolved:true},
  {phenomenal_promotion_detected:true},{candidate_sha256:'f'.repeat(64)},
  {question_reviews:[]},{question_reviews:[{index:1,support_class:'BOUNDED_POLICY_INFERENCE',evidence_ids:['FAKE']}]}]){
  const out=await reviewC91Candidate({task,candidate,reviewPort:port({...good,...change})});
  assert.equal(out.status,'C91_REVIEW_STOP');
 }
});
