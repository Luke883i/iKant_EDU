import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {makeC98C82Carrier} from '../host/c98-c82-connector-port.mjs';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
import {materializeC82ParallelCarriers} from '../host/c82-experimental-carriers.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const H='66f074b34f34455b3c4188703d83ad71316baa06';
const zip=fs.readFileSync(path.join(here,'fixtures/c77-historical-head-66f074b3.zip'));
const unpack=validateC94C77Archive(zip,{sourceHead:H});
assert.equal(unpack.status,'C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN');
const manifest=unpack.manifest,manifestBase64=unpack.content.get('c77-manifest.json').toString('base64');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cb=async({path:p,sourceHead,manifestSha256})=>({path:p,sourceHead,manifestSha256,
 contentBase64:unpack.content.get(p).toString('base64')});
const opts={sourceHead:H,manifest,manifestBase64,manifestSha256:unpack.manifest_sha256};
const port=(readC77Member=cb,other={})=>makeC98C82Carrier({...opts,readC77Member,...other});

test('C98 attached to a historical REAL C77 manifest: 34 exact bound members accepted, no authority claims',async()=>{
 const r=port();assert.equal(r.expectedMemberCount,34);
 for(const f of manifest.files){const x=await r.carrier.getFile(f.path);
  assert.equal(sha(Buffer.from(x.contentBase64,'base64')),f.sha256);}
 assert.deepEqual(r.statistics(),{invoked:34,accepted:34,host_authenticated_origin:false,
  native_event_attested:false,owner_executed:false,active:false});
});
test('missing callback and arbitrary carrier names fail before a read',()=>{
 assert.throws(()=>port(null),/SOURCE_MANIFEST_OR_REAL_CALLBACK_MISSING/);
 assert.throws(()=>port(cb,{carrierName:'../../SECRET'}),/MANIFEST_OBJECT_OR_CARRIER_DRIFT/);
});
test('manifest source drift, byte drift and object drift fail closed',()=>{
 assert.throws(()=>port(cb,{sourceHead:'a'.repeat(40)}),/MANIFEST_OBJECT_OR_CARRIER_DRIFT/);
 assert.throws(()=>port(cb,{manifestSha256:'f'.repeat(64)}),/MANIFEST_HASH_DRIFT/);
 const m=structuredClone(manifest);m.files[0].sha256='f'.repeat(64);
 assert.throws(()=>port(cb,{manifest:m}),/MANIFEST_OBJECT_OR_CARRIER_DRIFT/);
});
test('host callback must bind requested head/path/manifest, no opaque status trusting',async()=>{
 for(const tamper of [o=>({...o,path:'README.md'}),o=>({...o,sourceHead:'a'.repeat(40)}),
  o=>({...o,manifestSha256:'a'.repeat(64)}),o=>({...o,attested:true}),o=>({...o,contentBase64:'AA=A'})]){
   let r=port(async q=>tamper(await cb(q)));
   await assert.rejects(()=>r.carrier.getFile(manifest.files[0].path),/HOST_MEMBER_ENVELOPE/);
   assert.equal(r.statistics().accepted,0);
  }
});
test('corrupted content never crosses C82 adapter; no fallback to unapproved source',async()=>{
 const r=port(async q=>{const x=await cb(q);return {...x,contentBase64:Buffer.from('tampered').toString('base64')}});
 await assert.rejects(()=>r.carrier.getFile(manifest.files[0].path),/CONTENT_SHA256_DRIFT/);
 await assert.rejects(()=>r.carrier.getFile('../evil'),/UNEXPECTED_PATH/);
});
test('C82-compatible test mirror consumes C98 carrier (SOURCE EXACT C82 REQUIRES MAIN REPLAY)',async()=>{
 const f=manifest.files, staged=new Map();const relay={_sourceHead:H,expectedPaths:f.map(x=>x.path),
  stageFile({filePath,contentBase64}){if(staged.has(filePath))throw Error('STAGED_TWICE');
   staged.set(filePath,Buffer.from(contentBase64,'base64'));},
  finalize(){return {all_bytes_reopened:staged.size===f.length&&f.every(x=>sha(staged.get(x.path))===x.sha256)};}};
 const p=port();const x=await materializeC82ParallelCarriers({relay,manifest,
  carriers:[p.carrier],parallelism:4,carrierTimeoutMs:500,hedgeDelayMs:0});
 assert.equal(x.status,'C82_C77_BYTES_MATERIALIZED_IN_NODE');assert.equal(staged.size,34);
 assert.equal(p.statistics().accepted,34);assert.equal(x.active,false);
 assert.equal(x.source_origin_attested,false);
 // In-memory test sink, not the real C78 writer: do NOT claim physical disk readback.
});
test('C82 controller with corrupted adapter callback reports incomplete, never materializes',async()=>{
 const relay={_sourceHead:H,expectedPaths:manifest.files.map(x=>x.path),stageFile(){throw Error('MUST_NOT_STAGE')},finalize(){throw Error('MUST_NOT_FINALIZE')}};
 const bad=port(async q=>{const x=await cb(q);return {...x,contentBase64:Buffer.from('bad').toString('base64')}});
 const x=await materializeC82ParallelCarriers({relay,manifest,carriers:[bad.carrier],parallelism:4,carrierTimeoutMs:500,hedgeDelayMs:0});
 assert.equal(x.status,'C82_CARRIER_STOP');assert.equal(x.active,false);
});
