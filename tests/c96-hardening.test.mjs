import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
import {planC96PostAccept} from '../host/c96-parallel-carrier.mjs';
const zip=fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'fixtures/c77-historical-head-66f074b3.zip'));
const H='66f074b34f34455b3c4188703d83ad71316baa06';
const c=validateC94C77Archive(zip,{sourceHead:H});
const base={sourceHead:H,manifest:c.manifest,manifestBase64:c.content.get('c77-manifest.json').toString('base64'),expectedManifestSha256:c.manifest_sha256,
 selection:{selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'}};
test('kind smuggling: HOST_GITHUB_FILE cannot provide an undeclared archive callback',()=>{
 const r=planC96PostAccept({...base,carriers:[{id:'MIXED',kind:'HOST_GITHUB_FILE',estimatedMs:1,
  readFile:async()=>Buffer.alloc(1),readArchive:async()=>zip}]});
 assert.equal(r.status,'C96_STOP');assert.equal(r.first_unclosed_edge,'CARRIER_DESCRIPTOR_INVALID');
});
test('kind smuggling: HOST_GITHUB_ARTIFACT cannot claim file-only reads',()=>{
 const r=planC96PostAccept({...base,carriers:[{id:'MIXED',kind:'HOST_GITHUB_ARTIFACT',estimatedMs:1,
  readArchive:async()=>zip,readFile:async()=>Buffer.alloc(1)}]});
 assert.equal(r.status,'C96_STOP');assert.equal(r.first_unclosed_edge,'CARRIER_DESCRIPTOR_INVALID');
});

test('manifest object must match its own frozen original bytes',()=>{
 const m=structuredClone(base.manifest);
 m.files[0].sha256='f'.repeat(64);
 const r=planC96PostAccept({...base,manifest:m,carriers:[{id:'ZIP',kind:'HOST_GITHUB_ARTIFACT',estimatedMs:1,readArchive:async()=>zip}]});
 assert.equal(r.status,'C96_STOP');assert.equal(r.first_unclosed_edge,'MANIFEST_OBJECT_DRIFT');
});
