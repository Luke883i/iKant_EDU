import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
import {makeC98ArchiveC82Carrier} from '../host/c98-archive-c82-port.mjs';
import {makeC98C82Carrier} from '../host/c98-c82-connector-port.mjs';
import crypto from 'node:crypto';
const HEAD='66f074b34f34455b3c4188703d83ad71316baa06';
const zip=fs.readFileSync(new URL('./fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const v=validateC94C77Archive(zip,{sourceHead:HEAD});
const manifest=v.manifest,manifestBase64=v.content.get('c77-manifest.json').toString('base64');
const base={sourceHead:HEAD,manifest,manifestBase64,manifestSha256:v.manifest_sha256};
const envelope={sourceHead:HEAD,manifestSha256:v.manifest_sha256,artifactSha256:crypto.createHash('sha256').update(zip).digest('hex'),archiveBase64:zip.toString('base64')};
const getArchive=async()=>({ ...envelope });
const first=manifest.files[0].path;
test('C98 archive refuses inherited properties without trusting prototype-less packet',async()=>{
 const out=Object.assign(Object.create({host_origin_attested:true}),envelope);
 const p=makeC98ArchiveC82Carrier({...base,readC77Archive:async()=>out});
 await assert.rejects(()=>p.carrier.getFile(first),/C98_ARCHIVE_ENVELOPE/);
});
test('C98 archive refuses getter-backed packets without invoking getters',async()=>{
 let counter=0; const e={...envelope};
 Object.defineProperty(e,'archiveBase64',{enumerable:true,get(){counter++;return zip.toString('base64');}});
 const p=makeC98ArchiveC82Carrier({...base,readC77Archive:async()=>e});
 await assert.rejects(()=>p.carrier.getFile(first),/C98_ARCHIVE_ENVELOPE/);
 assert.equal(counter,0);
});
test('C98 archive refuses proxied callback packets before property traps',async()=>{
 let traps=0;
 const proxy=new Proxy({...envelope},{get(target,k,receiver){if(k!=='then')traps++;return Reflect.get(target,k,receiver);}});
 const p=makeC98ArchiveC82Carrier({...base,readC77Archive:async()=>proxy});
 await assert.rejects(()=>p.carrier.getFile(first),/C98_ARCHIVE_ENVELOPE/);
 assert.equal(traps,0);
});
test('C98 member adapter refuses manifest with malicious nested accessors without invoking',()=>{
 const forged=JSON.parse(JSON.stringify(manifest));let counter=0;
 Object.defineProperty(forged.files[0],'bytes',{enumerable:true,get(){counter++;return manifest.files[0].bytes;}});
 assert.throws(()=>makeC98C82Carrier({...base,manifest:forged,readC77Member:async()=>({})}),/C98_/);
 assert.equal(counter,0);
});
test('C98 member adapter refuses a proxied manifest before JS traps',()=>{
 let traps=0;
 const forged=new Proxy(manifest,{get(target,k,receiver){if(k!=='then')traps++;return Reflect.get(target,k,receiver);}});
 assert.throws(()=>makeC98C82Carrier({...base,manifest:forged,readC77Member:async()=>({})}),/C98_/);
 assert.equal(traps,0);
});
test('safe genuine callback packet and manifest remain accepted',async()=>{
 const p=makeC98ArchiveC82Carrier({...base,readC77Archive:getArchive});
 const file=await p.carrier.getFile(first);
 assert.equal(file.contentBase64,v.content.get(first).toString('base64'));
});
