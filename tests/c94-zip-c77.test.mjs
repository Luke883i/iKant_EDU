import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import path from 'node:path';
import {validateC94C77Archive,unpackC94Zip,stageC94C77Archive} from '../host/c94-zip-c77.mjs';
const source=process.env.C94_C77_TEST_ZIP||fileURLToPath(new URL('./fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const HEAD='66f074b34f34455b3c4188703d83ad71316baa06';
const available=fs.existsSync(source);
const original=available?fs.readFileSync(source):null;
test('real CI C77 ZIP: all source bytes verified against manifest, hash and original blob', {skip:!available},()=>{
 const r=validateC94C77Archive(original,{sourceHead:HEAD});
 assert.equal(r.status,'C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN');
 assert.equal(r.files,34);assert.equal(r.cx_anchors,70);
 assert.equal(r.c81_verified,false);assert.equal(r.source_origin_attested,false);
 assert.equal(unpackC94Zip(original).size,36);
});
test('wrong source epoch is stopped',{skip:!available},()=>{
 const r=validateC94C77Archive(original,{sourceHead:'f'.repeat(40)});
 assert.equal(r.status,'C94_C77_STOP');assert.equal(r.first_unclosed_edge,'C77_MANIFEST_SOURCE_OR_SET');
});
test('one modified original compressed byte cannot pass',{skip:!available},()=>{
 const changed=Buffer.from(original);changed[1200]^=1;
 assert.equal(validateC94C77Archive(changed,{sourceHead:HEAD}).status,'C94_C77_STOP');
});
test('physically write 35 files and read back',{skip:!available},()=>{
 const r=stageC94C77Archive(original,{sourceHead:HEAD});
 assert.equal(r.status,'C94_C77_STAGED_REOPENED_NOT_RUNTIME_EXECUTED');
 assert.equal(r.write_reopen_verified,true);assert.equal(r.files,35);
 assert.equal(fs.existsSync(path.join(r.output_dir,'host/c77-first-turn.mjs')),true);
 fs.rmSync(r.output_dir,{recursive:true,force:true});
});
test('archive reject size, trailing garbage, truncated end, malformed types',()=>{
 for(const b of [Buffer.alloc(0),Buffer.alloc(25),Buffer.alloc(5_000_001),
  ...(available?[Buffer.concat([original,Buffer.from('bad')]),original.subarray(0,original.length-3)]:[])]){
  const r=validateC94C77Archive(b,{sourceHead:HEAD});assert.equal(r.status,'C94_C77_STOP');
 }
});
