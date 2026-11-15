import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
import {makeC98C82Carrier} from '../host/c98-c82-connector-port.mjs';
const archive=fs.readFileSync(new URL('./fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const sourceHead='66f074b34f34455b3c4188703d83ad71316baa06';
const v=validateC94C77Archive(archive,{sourceHead});
const manifest=v.manifest,manifestBase64=v.content.get('c77-manifest.json').toString('base64');
const path=manifest.files[0].path;
const basic={sourceHead,manifestSha256:v.manifest_sha256,path,
 contentBase64:v.content.get(path).toString('base64')};
const wrap=cb=>makeC98C82Carrier({sourceHead,manifest,manifestBase64,
 manifestSha256:v.manifest_sha256,readC77Member:cb}).carrier.getFile(path);
test('an inherited callback packet must be denied even when own JSON keys appear valid',async()=>{
 const forged=Object.assign(Object.create({native_event_claim:true}),basic);
 await assert.rejects(()=>wrap(async()=>forged),/C98_HOST_MEMBER_ENVELOPE/);
});
test('getter-backed callback packet must be denied before evaluating getter side effects',async()=>{
 const o={...basic};let count=0;
 Object.defineProperty(o,'contentBase64',{enumerable:true,get(){count++;return basic.contentBase64}});
 await assert.rejects(()=>wrap(async()=>o),/C98_HOST_MEMBER_ENVELOPE/);
 assert.equal(count,0);
});
