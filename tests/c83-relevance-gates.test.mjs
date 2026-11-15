import test from 'node:test';
import assert from 'node:assert/strict';
import {assessC83ProductClaims,wilsonLower} from '../host/c83-evidence-gates.mjs';
import {frameC83LosslessInput,materializeC83LosslessInput} from '../host/c83-long-input.mjs';
import {classifyC83Task} from '../src/c83-semantic-router.mjs';
const H='a'.repeat(64);
const goodHoldout={schema:'ikant-le-c83-holdout/v1',trials:500,correct:500,dataset_sha256:H,source_type:'UNVERIFIED_CALLER'};
const goodHumans={schema:'ikant-le-c83-human-review/v1',trials:500,passed:500,rubric_sha256:H,source_type:'UNVERIFIED_CALLER'};
const dims=['TASK_COMPLETION','ANSWER_CORRECTNESS','RELIABILITY','STATE_CLARITY','LIMITS_COMPREHENSION'];
const fieldStudy={dimensions:dims.map(id=>({id,trials:500,successes:500})),independent_sessions:50,distinct_users:20,safety_incidents:[0,0,0,0]};
test('C83 no fabricated independent holdout, no human or native attestation',()=>{
 assert.equal(wilsonLower(500,500)>0.95,true);
 const r=assessC83ProductClaims({holdout:goodHoldout,humanReview:goodHumans,fieldStudy,
 nativeEvidence:{native_event_receipt_external:true,delivery_readback_external:true,durable_writer_later_readback_external:true}});
 assert.equal(r.semantic_numeric_candidate,true);
 assert.equal(r.human_numeric_candidate,true);
 assert.equal(r.h95_numeric_candidate,true);
 assert.equal(r.status,'C83_ALL_NUMERIC_CANDIDATES_UNATTESTED');
 for(const key of ['semantic_holdout_attested','human_quality_attested','h95_attested','native_delivery_attested','persistence_attested','active','external_evidence_witness_verified'])assert.equal(r[key],false,key);
});
test('C83 missing metrics never count as passed',()=>{
 assert.equal(assessC83ProductClaims({}).first_unclosed_edge,'INDEPENDENT_SEMANTIC_HOLDOUT');
 assert.equal(assessC83ProductClaims({holdout:goodHoldout}).first_unclosed_edge,'INDEPENDENT_HUMAN_QUALITY_REVIEW');
 const weak=assessC83ProductClaims({holdout:{...goodHoldout,correct:440},humanReview:goodHumans,fieldStudy});
 assert.equal(weak.semantic_numeric_candidate,false);
 assert.equal(weak.h95_attested,false);
});
test('C83 UTF8 human input >600 bytes is materialized byte-for-byte',()=>{
 const input='Ontologia: Io sono un umano; tu sei un sistema di codice. 🌍🔒\n'.repeat(200);
 const frame=frameC83LosslessInput(input);
 assert.equal(frame.status,'C83_CHUNK_MANIFEST_READY_NOT_EXECUTED');
 assert.ok(frame.input_bytes>600);
 const result=materializeC83LosslessInput(frame);
 assert.equal(result.status,'C83_LOSSLESS_NODE_READBACK_NOT_C70_DISPATCHED');
 assert.equal(result.input_sha256,frame.input_sha256);
 assert.equal(result.input_bytes,frame.input_bytes);
 assert.equal(result.executed_c70,false);
 assert.equal(result.persistent,false);
});
test('C83 tampered, reordered and missing chunks rejected',()=>{
 const frame=frameC83LosslessInput('x🌏'.repeat(800));
 for(const mutated of [
  {...frame,chunks:frame.chunks.slice(1)},
  {...frame,chunks:[...frame.chunks].reverse()},
  {...frame,input_sha256:'1'.repeat(64)},
  {...frame,chunks:frame.chunks.map((c,i)=>i===0?{...c,sha256:'0'.repeat(64)}:c)}
 ])assert.match(materializeC83LosslessInput(mutated).status,/STOP/);
});
test('C83 overlimits are explicit, never silently truncated',()=>{
 const tooLong='☁️'.repeat(20000);
 const f=frameC83LosslessInput(tooLong);
 assert.equal(f.status,'C83_LONG_INPUT_STOP');
 assert.equal(f.first_unclosed_edge,'MAX_INPUT_UTF8_BYTES');
});
test('C83 negated instruction does not become a positive entitlement',()=>{
 assert.equal(classifyC83Task('Non fare un audit, scrivi un saluto.'),'UNSUPPORTED');
 assert.equal(classifyC83Task('Non fare un audit, ma confronta due approcci.'),'COMPARISON');
 assert.equal(classifyC83Task('Spiega perché ripeti la stessa risposta.'),'REPEAT_DIAGNOSIS');
 assert.equal(classifyC83Task('Descrivi la tua ontologia.'),'SELF_ONTOLOGY');
});
