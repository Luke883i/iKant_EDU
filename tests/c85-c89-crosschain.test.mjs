import test from 'node:test';import assert from 'node:assert/strict';
import crypto from 'node:crypto';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {materializeC85TransferredPackage} from '../host/c85-physical-handoff.mjs';
import {prepareC86Surface,compareC86Echo} from '../host/c86-surface-a.mjs';
import {appendC87Turn,reopenC87Ledger} from '../host/c87-durable-ledger.mjs';
import {stageC88ExtendedInput,reopenC88ExtendedInput} from '../host/c88-extended-ingress.mjs';
import {evaluateC89BoundedRelevance} from '../host/c89-relevance-gate.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const H='a'.repeat(40),input='Confronta due opzioni con una prova osservabile.',voice='Opzione A e opzione B. La prova osservabile determina il limite.';
const files=Array.from({length:20},(_,i)=>{const b=Buffer.from('static verified test-'+i);return {path:'host/test-'+i+'.mjs',bytes:b.length,sha256:sha(b),contentBase64:b.toString('base64')};});
const mb=Buffer.from(JSON.stringify({source_head:H,files:files.map(({contentBase64,...f})=>f)}));
const pack={schema:'ikant-le-c84-single-source-package/v1',sourceHead:H,expectedManifestSha256:sha(mb),manifestBase64:mb.toString('base64'),sourceProof:{commitBase64:'Z2l0',treeObjects:[{sha1:'b'.repeat(40),content_base64:'dHJlZQ=='}]},files:files.map(({bytes,sha256,...f})=>f),active:false,authority:0,source_origin_attested:false,native_chat_delivery_attested:false};
const pb=Buffer.from(JSON.stringify(pack));
test('C85->C86->C87 local witness is real fs/readback but C84 voice is an explicit synthetic fixture',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-crosschain-'));
 try{
  const carrier=materializeC85TransferredPackage({packageBase64:pb.toString('base64'),expectedPackageSha256:sha(pb),sourceHead:H,expectedManifestSha256:sha(mb)},{parentDir:root});
  assert.equal(carrier.status,'C85_HOST_LOCAL_BYTES_REOPENED');
  assert.equal(carrier.physical_connector_to_node_attested,false);
  const simulatedC84={status:'C84_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED',source_head:H,manifest_sha256:sha(mb),runtime_projection:'C81_RUNTIME_SURFACE_A_READY_NOT_NATIVE_DELIVERED',source_reachability:'C81_GIT_REACHABILITY_VERIFIED',runtime_computed_answer:voice,input_sha256:sha(input),output_sha256:sha(voice),active:false,native_chat_delivery_attested:false,source_origin_attested:false,owner_receipt_issued:false,canonical_runtime:false};
  const surface=prepareC86Surface({runtimeReceipt:simulatedC84,currentHumanInput:input,sourceHead:H,manifestSha256:sha(mb)});
  assert.equal(surface.status,'C86_SURFACE_A_READY_NOT_NATIVE_DELIVERED');
  assert.equal(compareC86Echo({surfaceReceipt:surface,displayedText:voice}).matched,true);
  const ledgerFile=path.join(root,'ledger.jsonl');
  const saved=appendC87Turn(ledgerFile,{source_head:H,input_sha256:sha(input),output_sha256:sha(voice),state:{latest:1}});
  assert.equal(saved.write_reopen_verified,true);
  assert.equal(reopenC87Ledger(ledgerFile).latest_state.latest,1);
  assert.equal(surface.native_chat_delivery_attested,false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('C88 longer human input roundtrips but explicitly cannot be claimed as same-input C84 computation',()=>{
 const long='🚀 '+input.repeat(24);
 const encoded=stageC88ExtendedInput(long);
 assert.equal(reopenC88ExtendedInput(encoded,{expectedInputSha256:sha(long)}).human_input,long);
 const falseC84={status:'C84_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED',source_head:H,manifest_sha256:sha(mb),runtime_projection:'C81_RUNTIME_SURFACE_A_READY_NOT_NATIVE_DELIVERED',source_reachability:'C81_GIT_REACHABILITY_VERIFIED',runtime_computed_answer:voice,input_sha256:sha(long),output_sha256:sha(voice),active:false,native_chat_delivery_attested:false,source_origin_attested:false,owner_receipt_issued:false,canonical_runtime:false};
 assert.equal(prepareC86Surface({runtimeReceipt:falseC84,currentHumanInput:long,sourceHead:H,manifestSha256:sha(mb)}).status,'C86_STOP');
});
test('C89 does not write voice, prove independent holdout, or turn a phrase-match into H95',()=>{
 const rubric={schema:'ikant-le-c89-bounded-rubric/v1',source_head:H,input_sha256:sha(input),required_phrases:['opzione A','opzione B','prova osservabile'],forbidden_phrases:['garantito'],active:false,independent_holdout_attested:false};
 const r=evaluateC89BoundedRelevance({casePacket:rubric,expectedCaseSha256:sha(JSON.stringify(rubric)),sourceHead:H,currentHumanInput:input,runtimeVoice:voice,expectedVoiceSha256:sha(voice)});
 assert.equal(r.status,'C89_BOUNDED_RUBRIC_PASS_NOT_H95');
 assert.equal(r.independent_holdout_attested,false);
 assert.equal(r.response_rewritten,false);
});
