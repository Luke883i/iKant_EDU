import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
import {makeC98ArchiveC82Carrier} from '../host/c98-archive-c82-port.mjs';
const archive=fs.readFileSync(new URL('./fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const HEAD='66f074b34f34455b3c4188703d83ad71316baa06';
const parsed=validateC94C77Archive(archive,{sourceHead:HEAD});
assert.equal(parsed.status,'C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN');
const manifest=parsed.manifest,manifestBase64=parsed.content.get('c77-manifest.json').toString('base64');
const artifactSha256=crypto.createHash('sha256').update(archive).digest('hex');
const base={sourceHead:HEAD,manifest,manifestBase64,manifestSha256:parsed.manifest_sha256};
const valid=()=>({sourceHead:HEAD,manifestSha256:parsed.manifest_sha256,artifactSha256,archiveBase64:archive.toString('base64')});
const port=readC77Archive=>makeC98ArchiveC82Carrier({...base,readC77Archive});
test('C98 one REAL historical C77 archive callback yields all 34 exact original members',async()=>{
 let calls=0;const r=port(async()=>{calls++;return valid();});
 const results=await Promise.all(manifest.files.map(f=>r.carrier.getFile(f.path)));
 assert.equal(results.length,34);assert.equal(calls,1);
 assert.equal(r.archiveStatistics().archive_callbacks_started,1);
 assert.equal(r.archiveStatistics().archive_source_bytes_verified,true);
 assert.equal(r.statistics().accepted,34);
 assert.equal(r.archiveStatistics().host_origin_attested,false);
});
test('C98 rejects altered bytes, forged hashes, extra claims, mismatched epoch and missing callback',async()=>{
 assert.throws(()=>port(undefined),/REAL_CALLBACK_REQUIRED/);
 for(const alter of [
  x=>({...x,artifactSha256:'0'.repeat(64)}),
  x=>({...x,sourceHead:'0'.repeat(40)}),
  x=>({...x,provenance_attested:true}),
  x=>({...x,manifestSha256:'f'.repeat(64)}),
  x=>({...x,archiveBase64:'%%%bad'}),
  x=>({...x,archiveBase64:archive.toString('base64').slice(0,-8)+'AAAAAAAA'}),
 ]){
  const r=port(async()=>alter(valid()));
  await assert.rejects(()=>r.carrier.getFile(manifest.files[0].path),/C98_ARCHIVE_/);
  assert.equal(r.statistics().accepted,0);
 }
});
test('C98 archive never claims the actual head or host origin and is cached after failing',async()=>{
 let calls=0;const r=port(async()=>{calls++;throw Error('HOST_REJECTED');});
 for(let i=0;i<5;i++)await assert.rejects(()=>r.carrier.getFile(manifest.files[i].path),/HOST_REJECTED/);
 assert.equal(calls,1);
 assert.equal(r.archiveStatistics().archive_source_bytes_verified,false);
});
