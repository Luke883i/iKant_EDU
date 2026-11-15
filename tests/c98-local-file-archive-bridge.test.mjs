import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {makeC98LocalFileArchiveBridge} from '../host/c98-local-file-archive-bridge.mjs';
import {makeC98ArchiveC82Carrier} from '../host/c98-archive-c82-port.mjs';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
const HEAD='66f074b34f34455b3c4188703d83ad71316baa06';
const fixture=fs.readFileSync(new URL('./fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const parsed=validateC94C77Archive(fixture,{sourceHead:HEAD});
assert.equal(parsed.status,'C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const common={sourceHead:HEAD,manifestSha256:parsed.manifest_sha256,archiveSha256:sha(fixture)};
function setup(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'c98-physical-file-'));
 const archivePath=path.join(root,'c77.zip');
 fs.writeFileSync(archivePath,fixture);
 return {root,allowedRoot:root,archivePath,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
test('C98 real fd read/reopen of 108k-byte C77 file feeds 34 exact bytes to existing C82 carrier port',async()=>{
 const w=setup();try{
  const bridge=makeC98LocalFileArchiveBridge({...w,...common});
  const carrier=makeC98ArchiveC82Carrier({sourceHead:HEAD,manifest:parsed.manifest,
   manifestBase64:parsed.content.get('c77-manifest.json').toString('base64'),
   manifestSha256:parsed.manifest_sha256,readC77Archive:bridge.readC77Archive});
  const files=await Promise.all(parsed.manifest.files.map(x=>carrier.carrier.getFile(x.path)));
  assert.equal(files.length,34);
  assert.equal(bridge.statistics().successful_file_reads,1);
  assert.equal(carrier.archiveStatistics().archive_callbacks_started,1);
  assert.equal(carrier.statistics().accepted,34);
  assert.equal(bridge.statistics().github_ref_origin_attested,false);
  assert.equal(bridge.statistics().node_network_attempts,0);
 }finally{w.cleanup();}
});
test('C98 local file gate rejects wrong source/manifest, digest, size and outside file without IO promotion',async()=>{
 const w=setup();try{
  assert.throws(()=>makeC98LocalFileArchiveBridge({...w,...common,archivePath:'/etc/passwd'}),/OUTSIDE_ROOT/);
  assert.throws(()=>makeC98LocalFileArchiveBridge({...w,...common,archiveSha256:'bad'}),/CONFIG_BOUNDS/);
  const x=makeC98LocalFileArchiveBridge({...w,...common});
  await assert.rejects(()=>x.readC77Archive({sourceHead:'0'.repeat(40),manifestSha256:common.manifestSha256}),/EPOCH_DRIFT/);
  assert.equal(x.statistics().successful_file_reads,0);
  const y=makeC98LocalFileArchiveBridge({...w,...common,archiveSha256:'0'.repeat(64)});
  await assert.rejects(()=>y.readC77Archive({sourceHead:HEAD,manifestSha256:common.manifestSha256}),/ARCHIVE_SHA256_MISMATCH/);
  fs.writeFileSync(w.archivePath,'bad bytes');
  await assert.rejects(()=>x.readC77Archive({sourceHead:HEAD,manifestSha256:common.manifestSha256}),/ARCHIVE_SHA256_MISMATCH/);
 }finally{w.cleanup();}
});
test('C98 rejects file symlink, parent symlink, hardlink and nonregular files',async()=>{
 const w=setup();try{
  const l=path.join(w.root,'file-link.zip');fs.symlinkSync(w.archivePath,l);
  await assert.rejects(()=>makeC98LocalFileArchiveBridge({...w,...common,archivePath:l}).readC77Archive({sourceHead:HEAD,manifestSha256:common.manifestSha256}),/SYMLINK_PATH/);
  const parent=path.join(w.root,'actual');fs.mkdirSync(parent);
  const subFile=path.join(parent,'copy.zip');fs.copyFileSync(w.archivePath,subFile);
  fs.symlinkSync(parent,path.join(w.root,'alias'));
  await assert.rejects(()=>makeC98LocalFileArchiveBridge({...w,...common,archivePath:path.join(w.root,'alias','copy.zip')}).readC77Archive({sourceHead:HEAD,manifestSha256:common.manifestSha256}),/SYMLINK_PATH/);
  const hard=path.join(w.root,'hard.zip');fs.linkSync(w.archivePath,hard);
  await assert.rejects(()=>makeC98LocalFileArchiveBridge({...w,...common}).readC77Archive({sourceHead:HEAD,manifestSha256:common.manifestSha256}),/NOT_EXCLUSIVE_REGULAR_FILE/);
  await assert.rejects(()=>makeC98LocalFileArchiveBridge({...w,...common,archivePath:parent}).readC77Archive({sourceHead:HEAD,manifestSha256:common.manifestSha256}),/NOT_EXCLUSIVE_REGULAR_FILE/);
 }finally{w.cleanup();}
});

test('C98 rejects accessor-bearing callback request without invoking attacker getter',async()=>{
 const w=setup();try{
  const bridge=makeC98LocalFileArchiveBridge({...w,...common});
  let getterCalls=0;
  const forged={manifestSha256:common.manifestSha256};
  Object.defineProperty(forged,'sourceHead',{enumerable:true,get(){getterCalls++;return HEAD;}});
  await assert.rejects(()=>bridge.readC77Archive(forged),/REQUEST_SHAPE/);
  assert.equal(getterCalls,0);
 }finally{w.cleanup();}
});
