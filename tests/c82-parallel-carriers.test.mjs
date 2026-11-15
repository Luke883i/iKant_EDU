import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {buildC77Capsule} from '../scripts/c77-build-capsule.mjs';
import {C78HostRelay} from '../host/c78-host-relay.mjs';
import {materializeC82ParallelCarriers} from '../host/c82-experimental-carriers.mjs';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const terms=fs.readFileSync(new URL('../TERMS.md',import.meta.url));
function setup(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c82-builder-'));
 const receipt=buildC77Capsule({outDir:dir});
 const mbytes=fs.readFileSync(path.join(dir,'c77-manifest.json'));
 const manifest=JSON.parse(mbytes.toString('utf8'));
 const offered=issueC72TermsOffer({sourceHead:receipt.head,termsDigest:hash(terms)});
 const accepted=acceptC72Terms({offer:offered,humanMessage:'I ACCEPT',termsPresented:true});
 const orientation=presentC72Introduction(accepted);
 const selection=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
 const makeRelay=()=>new C78HostRelay({selection,sourceHead:receipt.head,
 expectedManifestSha256:receipt.bundle_manifest_sha256,manifestBase64:mbytes.toString('base64')});
 return {dir,receipt,manifest,makeRelay};
}
const good=t=>async filePath=>({contentBase64:fs.readFileSync(path.join(t.dir,filePath)).toString('base64')});
test('C82 parallel carrier materializes full qualified capsule with a single C78 writer',async()=>{
 const t=setup(),relay=t.makeRelay();try{
  const corrupted={name:'PRIMARY_FAULTY',getFile:async p=>({contentBase64:Buffer.from('tampered '+p).toString('base64')})};
  const legacy={name:'LEGACY_ZIP_SAMEHASH',getFile:good(t)};
  const r=await materializeC82ParallelCarriers({relay,manifest:t.manifest,
   carriers:[corrupted,legacy],parallelism:4});
  assert.equal(r.status,'C82_C77_BYTES_MATERIALIZED_IN_NODE',JSON.stringify(r));
  assert.equal(r.files,t.manifest.files.length);
  assert.equal(r.all_bytes_reopened,true);
  assert.equal(r.source_origin_attested,false);
  assert.equal(r.active,false);
  assert.ok(r.selected_carriers.every(x=>x.carrier==='LEGACY_ZIP_SAMEHASH'));
 }finally{relay.close();fs.rmSync(t.dir,{recursive:true,force:true});}
});
test('C82 incomplete or false bytes never cause partial staging',async()=>{
 const t=setup(),relay=t.makeRelay();try{
  const r=await materializeC82ParallelCarriers({relay,manifest:t.manifest,
   carriers:[{name:'CORRUPT_ONLY',getFile:async p=>({contentBase64:Buffer.from(p).toString('base64')})}]});
  assert.equal(r.status,'C82_CARRIER_STOP');
  assert.equal(r.first_unclosed_edge,'C82_INCOMPLETE_CARRIER_COVERAGE');
  assert.equal(relay.receivedCount,0);
 }finally{relay.close();fs.rmSync(t.dir,{recursive:true,force:true});}
});
test('C82 invalid selection, manifest, or missing carriers fail closed',async()=>{
 const t=setup(),relay=t.makeRelay();try{
  const cases=[{carriers:[]},{carriers:[{name:'NO_FUNCTION'}]},
   {carriers:[{name:'A',getFile:good(t)},{name:'A',getFile:good(t)}]},
   {carriers:[{name:'A',getFile:good(t)}],manifest:{...t.manifest,source_head:'0'.repeat(40)}}];
  for(const v of cases){
   const r=await materializeC82ParallelCarriers({relay,manifest:t.manifest,...v});
   assert.equal(r.status,'C82_CARRIER_STOP');
   assert.equal(relay.receivedCount,0);
  }
 }finally{relay.close();fs.rmSync(t.dir,{recursive:true,force:true});}
});
