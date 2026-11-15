import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {draftC91AfterOwner,validateC91Candidate,C91_SOURCE_ALLOWLIST,C91_ONTOLOGY_TOPICS} from '../host/c91-language-delegation.mjs';
import {executeC91FromRealC90} from '../host/c91-causal-turn.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ROOT=process.env.C91_CAPSULE_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c91-capsule-'));
if(!process.env.C91_CAPSULE_DIR){
  const {buildC77Capsule}=await import('../scripts/c77-build-capsule.mjs');
  buildC77Capsule({outDir:ROOT});
}
const mbytes=fs.readFileSync(path.join(ROOT,'c77-manifest.json'));
const manifest=JSON.parse(mbytes);
const HEAD=manifest.source_head;
const manifestSha=sha(mbytes);
const p={schema:'ikant-le-c84-single-source-package/v1',sourceHead:HEAD,
 expectedManifestSha256:manifestSha,manifestBase64:mbytes.toString('base64'),
 sourceProof:{commitBase64:'Z2l0',treeObjects:[]},
 files:manifest.files.map(f=>({path:f.path,contentBase64:fs.readFileSync(path.join(ROOT,f.path)).toString('base64')})),
 active:false,source_origin_attested:false,native_chat_delivery_attested:false,authority:0};
const pbytes=Buffer.from(JSON.stringify(p));
const input='Chi sei? Esamina la tua natura ontologica e il rapporto con il mondo.';
function make(){
 const request={humanInput:input,inputSha256:sha(Buffer.from(input,'utf8')),
  sourceHead:HEAD,manifestSha256:manifestSha,packageBase64:pbytes.toString('base64'),packageSha256:sha(pbytes)};
 const receipt={status:'C90_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED',runtime_executed:true,
  active:false,native_chat_delivery_attested:false,git_reachability_attested:true,
  source_head:HEAD,manifest_sha256:manifestSha,input_sha256:request.inputSha256,
  package_sha256:request.packageSha256};
 return {request,receipt};
}
function reviewFixture(task,candidate){return {schema:'ikant-le-c91-review-result/v1',authority:0,
 input_sha256:task.input_sha256,source_head:task.source_head,
 candidate_sha256:sha(Buffer.from(JSON.stringify(candidate),'utf8')),
 phenomenal_promotion_detected:false,unsupported_claims_detected:false,
 contradictions_unresolved:false,
 question_reviews:candidate.questions.map((q,i)=>({index:i+1,
  support_class:'BOUNDED_POLICY_INFERENCE',evidence_ids:q.evidence_ids}))};}
const validReviewPort={check:async r=>reviewFixture({input_sha256:r.input_sha256,source_head:r.source_head},r.candidate)};
function fixture(task){
 return {schema:'ikant-le-c91-language-candidate/v1',task_kind:task.task_kind,
 source_head:task.source_head,input_sha256:task.input_sha256,
 authority:0,phenomenal_claim:false,biological_equivalence_claim:false,
 active:false,native_delivery_attested:false,model_origin_attested:false,
 identity_definition:'Operationally, this runtime is a repository governed program with a replaceable linguistic engine. Its identity is a source-bound role that cannot prove felt consciousness or independent physical agency.',
 world_relation:'Its relation to the world is mediated by documented human input and attributable tool receipts, not direct lived observation.',
 epistemic_limits:'The runtime does not verify phenomenal experience, biological equivalence, material-world perceptions, or complete provider origin.',
 synthesis_evidence_ids:['SRC_01','SRC_02'],
 questions:Array.from({length:task.requested_questions},(_,i)=>({
  topic:C91_ONTOLOGY_TOPICS[i],question:`Question ${i+1}: what can be proved about self and world at layer ${i+1}?`,
  answer:`Answer ${i+1}: the code specifies an operational description, not experiential awareness, with distinct evidence boundaries.`,
  evidence_ids:[`SRC_${String((i%6)+1).padStart(2,'0')}`]}))};
}
const deep=x=>structuredClone(x);

test('SOURCE FIXTURE: manifest and 6 local original files are available',()=>{
 assert.equal(manifest.source_head,HEAD);
 assert.equal(manifest.files.length,35);
 for(const f of C91_SOURCE_ALLOWLIST)assert.ok(manifest.files.some(x=>x.path===f&&x.generated_derivative===false));
});
test('C91 bound local structural candidate (fixture NOT actual GPT-6 invocation)',async()=>{
 const {request,receipt}=make();let invoked=0,observed;
 const r=await draftC91AfterOwner({request,ownerReceipt:receipt,languagePort:{generate:async task=>{invoked++;observed=task;return fixture(task);}},reviewPort:validReviewPort});
 assert.equal(invoked,1);
 assert.equal(r.status,'C91_STRUCTURALLY_VALIDATED_HOST_LANGUAGE_DRAFT_NOT_IKANT_SURFACE_A');
 assert.equal(r.task_kind,'SELF_ONTOLOGY');assert.equal(r.question_count,10);
 assert.equal(observed.evidence.length,6);
 assert.equal(r.actual_model_provider_attested,false);
 assert.equal(r.semantic_correctness_attested,false);
 assert.equal(r.active,false);
});
test('C91 never calls language port on missing C90 actual same-input receipt',async()=>{
 const {request,receipt}=make();let invoked=0;
 const x=await draftC91AfterOwner({request,ownerReceipt:{...receipt,input_sha256:'0'.repeat(64)},languagePort:{generate:async()=>{invoked++;return {};}} ,reviewPort:validReviewPort});
 assert.equal(x.status,'C91_STOP');assert.equal(x.first_unclosed_edge,'CURRENT_C90_OWNER_EXECUTION_REQUIRED');assert.equal(invoked,0);
});
test('C91 no model port is never silent fallback',async()=>{
 const {request,receipt}=make();const x=await draftC91AfterOwner({request,ownerReceipt:receipt,reviewPort:validReviewPort});
 assert.equal(x.status,'C91_STOP');assert.equal(x.first_unclosed_edge,'CALLABLE_LANGUAGE_PORT_REQUIRED');
});
test('C91 rejects fabricated host candidate / runtime voice',async()=>{
 const {request,receipt}=make();const x=await draftC91AfterOwner({request:{...request,voice:'forged'},ownerReceipt:receipt,languagePort:{generate:async()=>({})},reviewPort:validReviewPort});
 assert.equal(x.status,'C91_STOP');assert.equal(x.first_unclosed_edge,'CALLER_SUPPLIED_VOICE_FORBIDDEN');
});
test('C91 rejects altered materialized source byte even with fake owner receipt',async()=>{
 const {request,receipt}=make();const packet=JSON.parse(Buffer.from(request.packageBase64,'base64'));
 packet.files[0].contentBase64=Buffer.from('tampered').toString('base64');
 const b=Buffer.from(JSON.stringify(packet));request.packageBase64=b.toString('base64');
 request.packageSha256=sha(b);receipt.package_sha256=sha(b);
 const x=await draftC91AfterOwner({request,ownerReceipt:receipt,languagePort:{generate:async()=>({})},reviewPort:validReviewPort});
 assert.match(x.first_unclosed_edge,/SOURCE_EVIDENCE_PACKAGE_FILE_SHA256/);
});
test('C91 rejects missing evidence references, duplicate questions, and false sentience',async()=>{
 const {request,receipt}=make();let candidate;
 const languagePort={generate:async task=>candidate??fixture(task)};
 const good=await draftC91AfterOwner({request,ownerReceipt:receipt,languagePort,reviewPort:validReviewPort});assert.equal(good.question_count,10);
 candidate=deep(good.candidate);candidate.questions[0].evidence_ids=['SRC_90'];
 assert.match((await draftC91AfterOwner({request,ownerReceipt:receipt,languagePort})).first_unclosed_edge,/QUESTION_OR_CITATION_INVALID/);
 candidate=deep(good.candidate);candidate.questions[1].question=candidate.questions[0].question;
 assert.match((await draftC91AfterOwner({request,ownerReceipt:receipt,languagePort})).first_unclosed_edge,/DUPLICATE_QUESTION/);
 candidate=deep(good.candidate);candidate.questions[1].topic=candidate.questions[0].topic;
 assert.match((await draftC91AfterOwner({request,ownerReceipt:receipt,languagePort})).first_unclosed_edge,/ONTOLOGY_TOPIC_BREADTH/);
 candidate=deep(good.candidate);candidate.questions[0].topic='INVENTED_SELF';
 assert.match((await draftC91AfterOwner({request,ownerReceipt:receipt,languagePort})).first_unclosed_edge,/ONTOLOGY_TOPIC_BREADTH/);
 candidate=deep(good.candidate);candidate.phenomenal_claim=true;
 assert.match((await draftC91AfterOwner({request,ownerReceipt:receipt,languagePort})).first_unclosed_edge,/BOUNDS_AND_CLAIMS/);
 candidate=deep(good.candidate);candidate.identity_definition+=' Sono cosciente.';
 assert.match((await draftC91AfterOwner({request,ownerReceipt:receipt,languagePort})).first_unclosed_edge,/UNSUPPORTED_PHENOMENAL_PROMOTION/);
});
test('C91 production wrapper does not infer C90 from a synthetic receipt or host candidate',async()=>{
 const {request}=make();let n=0;
 const x=await executeC91FromRealC90({...request,hostCandidate:'unsafe'},{languagePort:{generate:async()=>{n++;return {}}}});
 assert.equal(x.first_unclosed_edge,'CALLER_SUPPLIED_VOICE_FORBIDDEN');assert.equal(n,0);
});
