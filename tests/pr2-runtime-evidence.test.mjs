import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {capturePr2RuntimeReceipt,verifyPr2RuntimeReceipt,pr2ChildTestEnv} from '../scripts/pr2-runtime-evidence.mjs';
const source=()=>({
 head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim()
});
test('PR2 actual original Node owners + MCP policy execute and produce re-readable evidence', {timeout:180000},()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pr2-exec-'));
 try{
  const r=capturePr2RuntimeReceipt({destination:dir});
  assert.equal(r.readback.ok,true);assert.ok(r.readback.verified_test_count>=10);
  assert.equal(r.receipt.source.head,source().head);
  assert.equal(r.receipt.source.tree,source().tree);
  const logs=Object.fromEntries(r.receipt.suites.map(x=>[x.id,fs.readFileSync(path.join(dir,x.id+'.tap'),'utf8')]));
  const exact=()=>verifyPr2RuntimeReceipt(r.receipt,logs,{expectedHead:source().head,expectedTree:source().tree});
  assert.equal(exact().ok,true);
  const mutate=x=>JSON.parse(JSON.stringify(x));
  const wrongHead=mutate(r.receipt);wrongHead.source.head='0'.repeat(40);
  assert.equal(verifyPr2RuntimeReceipt(wrongHead,logs,{expectedHead:source().head,expectedTree:source().tree}).ok,false);
  const fakeNative=mutate(r.receipt);fakeNative.native_provider_attested=true;
  assert.equal(verifyPr2RuntimeReceipt(fakeNative,logs,{expectedHead:source().head,expectedTree:source().tree}).ok,false);
  const fakeGO=mutate(r.receipt);fakeGO.product_go=true;
  assert.equal(verifyPr2RuntimeReceipt(fakeGO,logs,{expectedHead:source().head,expectedTree:source().tree}).ok,false);
  const falseDod=mutate(r.receipt);falseDod.dod.M07='PASS';
  assert.equal(verifyPr2RuntimeReceipt(falseDod,logs,{expectedHead:source().head,expectedTree:source().tree}).ok,false);
  const fewer=mutate(r.receipt);delete fewer.dod.M08;
  assert.equal(verifyPr2RuntimeReceipt(fewer,logs,{expectedHead:source().head,expectedTree:source().tree}).ok,false);
  const forgedLog={...logs,PROJECT_OWNER:logs.PROJECT_OWNER.replace(/# pass (\d+)/,'# pass 0')};
  assert.equal(verifyPr2RuntimeReceipt(r.receipt,forgedLog,{expectedHead:source().head,expectedTree:source().tree}).ok,false);
  const payload=mutate(r.receipt);payload.suites[0].tap_sha256='f'.repeat(64);
  assert.equal(verifyPr2RuntimeReceipt(payload,logs,{expectedHead:source().head,expectedTree:source().tree}).ok,false);
  const wrongBlob=mutate(r.receipt);wrongBlob.source.test_blobs[0].sha256='0'.repeat(64);
  assert.equal(verifyPr2RuntimeReceipt(wrongBlob,logs,{expectedHead:source().head,expectedTree:source().tree}).ok,false);
  const deletedBlob=mutate(r.receipt);deletedBlob.source.test_blobs.pop();
  assert.equal(verifyPr2RuntimeReceipt(deletedBlob,logs,{expectedHead:source().head,expectedTree:source().tree}).ok,false);
  const duplicateBlob=mutate(r.receipt);duplicateBlob.source.test_blobs[0]=duplicateBlob.source.test_blobs[1];
  assert.equal(verifyPr2RuntimeReceipt(duplicateBlob,logs,{expectedHead:source().head,expectedTree:source().tree}).ok,false);
  assert.ok(r.readback.unresolved_ids.includes('M07'));
  assert.ok(r.readback.unresolved_ids.includes('M08'));
  assert.ok(r.readback.unresolved_ids.includes('T06'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('PR2 Node test runner identity must not leak into child node --test',()=>{
 const env=pr2ChildTestEnv({NODE_TEST_CONTEXT:'child-v8',NODE_TEST_WORKER_ID:'worker-1',PATH:'/usr/bin'});
 assert.equal('NODE_TEST_CONTEXT' in env,false);
 assert.equal('NODE_TEST_WORKER_ID' in env,false);
 assert.equal(env.NODE_ENV,'test');assert.equal(env.PATH,'/usr/bin');
});
