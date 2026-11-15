import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildC77Capsule} from '../scripts/c77-build-capsule.mjs';
import {buildC84SourcePackage} from '../scripts/c84-build-source-package.mjs';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {executeC84ExperimentalTurn} from '../host/c84-experimental-transport.mjs';
import {createC81LocalGitProof} from '../scripts/c81-create-git-proof.mjs';
import {materializeC85TransferredPackage} from '../host/c85-physical-handoff.mjs';
import {prepareC86Surface,compareC86Echo} from '../host/c86-surface-a.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
test('main transplant C77=>C84=>C85=>C86 real Node positive, without host delivery claim',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c85-real-'));
 try{
  const capsuleDir=path.join(dir,'capsule');
  const build=buildC77Capsule({outDir:capsuleDir});
  const manifestBytes=fs.readFileSync(path.join(capsuleDir,'c77-manifest.json'));
  const proof=createC81LocalGitProof({manifestPath:path.join(capsuleDir,'c77-manifest.json')});
  const pkgPath=path.join(dir,'source.json');
  const packageReceipt=buildC84SourcePackage({capsuleDir,outputPath:pkgPath});
  assert.equal(packageReceipt.status,'C84_PACKAGE_WRITTEN_REOPENED_NOT_HOST_DELIVERED');
  const offer=issueC72TermsOffer({sourceHead:build.head,termsDigest:sha(fs.readFileSync(new URL('../TERMS.md',import.meta.url)))});
  const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
  const selection=selectC72Mode({accepted,orientation:presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
  assert.equal(selection.status,'EXPERIMENTAL_SELECTED_NOT_RUNNING');
  const request={sourceHead:build.head,expectedManifestSha256:build.bundle_manifest_sha256,
   packageBase64:fs.readFileSync(pkgPath).toString('base64'),expectedPackageSha256:packageReceipt.package_sha256};
  const staged=materializeC85TransferredPackage(request,{parentDir:dir});
  assert.equal(staged.status,'C85_HOST_LOCAL_BYTES_REOPENED');
  assert.equal(staged.physical_connector_to_node_attested,false);
  const input='Confronta due alternative e indica una prova osservabile.';
  const runtime=await executeC84ExperimentalTurn({
   selection,sourceHead:build.head,expectedManifestSha256:build.bundle_manifest_sha256,
   manifestBase64:manifestBytes.toString('base64'),sourceProof:proof.proof,
   carriers:[{name:'LOCAL_EXACT_SOURCE',getFile:async file=>({
    contentBase64:fs.readFileSync(path.join(capsuleDir,file)).toString('base64')})}],
   humanInput:input});
  assert.equal(runtime.status,'C84_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED',JSON.stringify(runtime));
  const surface=prepareC86Surface({runtimeReceipt:runtime,currentHumanInput:input,
   sourceHead:build.head,manifestSha256:build.bundle_manifest_sha256});
  assert.equal(surface.status,'C86_SURFACE_A_READY_NOT_NATIVE_DELIVERED',JSON.stringify(surface));
  assert.equal(surface.input_sha256,sha(input));
  assert.equal(surface.output_sha256,sha(surface.surface_a_text));
  const echo=compareC86Echo({surfaceReceipt:surface,displayedText:runtime.runtime_computed_answer});
  assert.equal(echo.matched,true);
  assert.equal(echo.native_chat_delivery_attested,false);
  assert.equal(surface.active,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
