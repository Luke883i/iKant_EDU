import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {buildC77Capsule} from '../scripts/c77-build-capsule.mjs';
import {buildC84SourcePackage} from '../scripts/c84-build-source-package.mjs';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode}
 from '../host/c72-unified-mode-admission.mjs';
import {executeC90HostRelease} from '../host/c90-physical-delivery.mjs';
import {appendC87Turn,reopenC87Ledger} from '../host/c87-durable-ledger.mjs';
import {appendC90ScratchContinuation} from '../host/c90-continuity.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
test('C90 positive: real C77 -> C81 -> C78/C79 -> C84/C86 -> voice then backlog and real JSON/GZIP',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c90-full-'));
 try{
  const cap=path.join(temp,'cap');
  const b=buildC77Capsule({outDir:cap});
  const packagePath=path.join(temp,'source-package.json');
  const packed=buildC84SourcePackage({capsuleDir:cap,outputPath:packagePath});
  assert.equal(packed.status,'C84_PACKAGE_WRITTEN_REOPENED_NOT_HOST_DELIVERED');
  const termsDigest=sha(fs.readFileSync(new URL('../TERMS.md',import.meta.url)));
  const offer=issueC72TermsOffer({sourceHead:b.head,termsDigest});
  const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
  const selection=selectC72Mode({accepted,orientation:presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
  assert.equal(selection.status,'EXPERIMENTAL_SELECTED_NOT_RUNNING');
  const packageBase64=fs.readFileSync(packagePath).toString('base64');
  const inputs=['Confronta due alternative e indica una prova osservabile.',
    'Spiega due opzioni e indica un criterio falsificabile.'];
  const hashes=[];
  for(const humanInput of inputs){
   const q={selection,sourceHead:b.head,manifestSha256:b.bundle_manifest_sha256,
    packageBase64,packageSha256:packed.package_sha256,humanInput,inputSha256:sha(humanInput)};
   const out=await executeC90HostRelease(q,{evidenceDir:temp});
   assert.equal(out.status,'C90_HOST_RELEASE_READY_NOT_NATIVE_PRESENTED',JSON.stringify(out));
   assert.equal(out.input_sha256,sha(humanInput));
   assert.equal(out.output_sha256,sha(out.surface_a_exact));
   assert.equal(out.backlog.canonical_backlog,false);
   assert.equal(out.evidence.byte_identical_decompression_verified,true);
   assert.equal(out.native_chat_delivery_attested,false);
   assert.equal(out.canonical_active,false);
   const full=fs.readFileSync(out.evidence.files[0].absolute_path);
   const gz=fs.readFileSync(out.evidence.files[1].absolute_path);
   assert.ok(zlib.gunzipSync(gz).equals(full));
   assert.equal(JSON.parse(full).surface_a_exact,out.surface_a_exact);
   assert.ok(out.host_text_exact.startsWith('iKant | EXPERIMENTAL |'));
   assert.ok(out.host_text_exact.indexOf(out.surface_a_exact)<out.host_text_exact.indexOf('DEBUG (HOST-OWNED)'));
   assert.ok(out.host_text_exact.indexOf('DEBUG (HOST-OWNED)')<out.host_text_exact.indexOf('BACKLOG EXPERIMENTAL'));
   hashes.push(out.input_sha256);
  }
  assert.notEqual(hashes[0],hashes[1]);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('C90 negative: forged package and voice cannot become runtime release',async()=>{
 const base={sourceHead:'a'.repeat(40),manifestSha256:'b'.repeat(64),
  packageSha256:'c'.repeat(64),packageBase64:'Z2l0',
  selection:{selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'},
  humanInput:'Verify',inputSha256:sha('Verify')};
 const out=await executeC90HostRelease(base);
 assert.equal(out.status,'C90_HOST_RELEASE_STOP');
 assert.equal(out.native_chat_delivery_attested,false);
 assert.equal(out.active,false);
});
test('C90 concurrency hardening: C87 nonce and prior digest under exclusive lock',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c90-lock-'));
 const file=path.join(temp,'ledger.jsonl'),head='a'.repeat(40);
 const a={file,sourceHead:head,inputSha256:sha('input'),outputSha256:sha('output'),nonce:'event_nonce_00001'};
 try{
  const first=appendC90ScratchContinuation(a);
  assert.equal(first.status,'C90_LOCAL_SCRATCH_READBACK_UNAUTHENTICATED');
  assert.equal(appendC90ScratchContinuation(a).first_unclosed_edge,'C90_NONCE_REPLAY');
  assert.equal(reopenC87Ledger(file).count,1);
  const stale={source_head:head,input_sha256:sha('another'),output_sha256:sha('response'),state:{nonce:'event_nonce_00002'}};
  assert.throws(()=>appendC87Turn(file,stale,{atomicGuard:{source_head:head,nonce:'event_nonce_00002',expected_prior_hash:'0'.repeat(64)}}),/C87_PRIOR_LEDGER_CHANGED/);
  assert.equal(reopenC87Ledger(file).count,1);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
