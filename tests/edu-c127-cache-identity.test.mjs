import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PIN} from '../host/c107-carrier-consumer.mjs';
import {C124_OVERLAY_GIT_BLOBS,C124_SOURCE_EPOCH} from '../host/c124-source-overlay.mjs';
import {buildC127SourceCache,inspectC127SourceCache,loadC127SourceCache} from '../host/edu-c127-source-transport.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function bytes(){return {carrierBytes:fs.readFileSync(path.join(root,PIN.name)),c124OverlayBytes:Object.fromEntries(Object.keys(C124_OVERLAY_GIT_BLOBS).map(p=>[p,fs.readFileSync(path.join(root,p))]))}}
test('four real content-addressed source regions pass and reopen from file',()=>{
 const r=buildC127SourceCache(bytes());assert.equal(r.ok,true,r.first_edge);
 const again=inspectC127SourceCache(r.bytes);assert.equal(again.ok,true,again.first_edge);
 assert.equal(again.member_count,4);assert.equal(again.source_head,C124_SOURCE_EPOCH);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c127-'));try{const dest=path.join(dir,'source.json');fs.writeFileSync(dest,r.bytes);
 const local=loadC127SourceCache(dest);assert.equal(local.ok,true);assert.equal(local.cache_sha256,r.sha256)}
 finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('one-byte corruption in carrier or each of three overlays is rejected',()=>{
 const r=buildC127SourceCache(bytes());assert.equal(r.ok,true);
 for(let i=0;i<4;i++){const j=JSON.parse(r.bytes.toString('utf8'));
  const k=i===0?j.carrier_base64:j.overlays[i-1].base64;
  const b=Buffer.from(k,'base64');b[12]^=1;
  if(i===0)j.carrier_base64=b.toString('base64');else j.overlays[i-1].base64=b.toString('base64');
  assert.equal(inspectC127SourceCache(Buffer.from(JSON.stringify(j)+'\n')).ok,false,String(i));
 }
});
