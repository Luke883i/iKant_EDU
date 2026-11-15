import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {unpackC94Zip} from '../host/c94-zip-c77.mjs';
import {inspectC99ManualC77Evidence} from '../host/c99-manual-c77-evidence.mjs';

const zip=fs.readFileSync(new URL('fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const mf=unpackC94Zip(zip).get('c77-manifest.json');
const manifest=JSON.parse(mf.toString('utf8'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const params={archiveBytes:zip,sourceHead:manifest.source_head,
 expectedArchiveSha256:sha(zip),expectedManifestSha256:sha(mf)};
const verify=x=>inspectC99ManualC77Evidence(x);

test('manual ZIP real bytes are verified via existing C94, NEVER promoted to C84/native',()=>{
 const r=verify({...params});
 assert.equal(r.status,'C99_USER_UPLOADED_C77_BYTES_VERIFIED_NOT_C84');
 assert.equal(r.source_head,manifest.source_head);
 assert.equal(r.verified_c77_members,manifest.files.length);
 assert.equal(r.manual_transport_only,true);
 for(const field of ['automatic_host_transfer_attested','source_origin_attested',
  'c81_verified','c84_owner_executed','native_delivery_attested','active'])
  assert.equal(r[field],false,field);
 assert.equal(r.first_unclosed_edge,'C81_RAW_GIT_PROOF_AND_C84_EXISTING_OWNER');
});
test('fail-closed: stale epoch, wrong artifact/manifest, ZIP byte mutation, no ZIP',()=>{
 const bad=[
 {...params,sourceHead:'a'.repeat(40)},
 {...params,expectedArchiveSha256:'0'.repeat(64)},
 {...params,expectedManifestSha256:'0'.repeat(64)},
 {...params,archiveBytes:Buffer.from('garbage')},
 {...params,archiveBytes:Buffer.concat([zip,Buffer.from('x')]),
   expectedArchiveSha256:sha(Buffer.concat([zip,Buffer.from('x')]))},
 ];
 for(const x of bad){const r=verify(x);assert.equal(r.status,'C99_MANUAL_C77_STOP');
  assert.equal(r.c84_owner_executed,false);assert.equal(r.active,false);}
});
test('untrusted root accessors and inherited records do not bypass preflight',()=>{
 let getterCalls=0;
 const x={...params};
 Object.defineProperty(x,'expectedArchiveSha256',{get(){getterCalls++;return sha(zip)},enumerable:true});
 assert.equal(verify(x).status,'C99_MANUAL_C77_STOP');
 assert.equal(getterCalls,0);
 assert.equal(verify(Object.assign(Object.create({fake:true}),params)).status,'C99_MANUAL_C77_STOP');
});
