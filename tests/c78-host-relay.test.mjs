import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import {buildC77Capsule} from '../scripts/c77-build-capsule.mjs';
import {C78HostRelay} from '../host/c78-host-relay.mjs';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
const ROOT=new URL('../',import.meta.url);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
const termsDigest=sha(fs.readFileSync(new URL('../TERMS.md',import.meta.url)));
function selection(mode='EXPERIMENTAL'){
 const offer=issueC72TermsOffer({sourceHead,termsDigest});
 const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const orientation=presentC72Introduction(accepted);
 return selectC72Mode({accepted,orientation,humanMessage:mode});
}
function setup(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c78-test-'));
 const capsule=path.join(dir,'capsule');
 const receipt=buildC77Capsule({outDir:capsule});
 const manifestBytes=fs.readFileSync(path.join(capsule,'c77-manifest.json'));
 const manifest=JSON.parse(manifestBytes.toString('utf8'));
 const packets=manifest.files.map(f=>({
  filePath:f.path,
  contentBase64:fs.readFileSync(path.join(capsule,f.path)).toString('base64'),
  sourceBlobSha1:f.original_source_blob_sha1
 }));
 const request={schema:'ikant-le-c78-opaque-host-transfer/v1',authority:0,
   selection:selection(),source_head:sourceHead,
   expected_manifest_sha256:receipt.bundle_manifest_sha256,
   manifest_base64:manifestBytes.toString('base64'),files:packets,
   human_input:'Confronta due scelte e chiarisci i limiti.'};
 return {dir,capsule,receipt,manifest,manifestBytes,packets,request};
}
const clean=t=>fs.rmSync(t.dir,{force:true,recursive:true});
const make=t=>new C78HostRelay({selection:t.request.selection,sourceHead,
  expectedManifestSha256:t.receipt.bundle_manifest_sha256,
  manifestBase64:t.manifestBytes.toString('base64')});
test('C78 physically stages connector-shaped byte packets in a new Node directory, readback then executes C70/C71/C73',()=>{
 const t=setup();let b;
 try{
  b=make(t);
  for(const packet of [...t.packets].reverse()){
   const v=b.stageFile(packet);
   assert.equal(v.readback_verified,true);
   assert.equal(v.source_origin_attested,false);
  }
  const receipt=b.finalize();
  assert.equal(receipt.staged_files,t.packets.length);
  assert.equal(receipt.first_unclosed_edge,'HOST_GITHUB_ORIGIN_AUTHENTICATION');
  assert.equal(receipt.source_origin_attested,false);
  const x=b.dispatch({humanInput:t.request.human_input});
  assert.equal(x.status,'C78_NODE_RESPONSE_READY_HOST_DELIVERY_PENDING',JSON.stringify(x));
  assert.equal(x.executed_kernel,true);
  assert.equal(x.child_process_executed,true);
  assert.equal(x.c70_status,'EXPERIMENTAL_COMPUTE_PREVIEW');
  assert.equal(x.c71_status,'EXPERIMENTAL_HOST_DRAFT');
  assert.equal(x.c73_status,'C73_EXPERIMENTAL_DRAFT_PRESENTATION_PLAN');
  assert.equal(x.input_sha256,sha(Buffer.from(t.request.human_input)));
  assert.equal(x.output_sha256,sha(Buffer.from(x.surface_a_chat.text)));
  assert.equal(x.surface_a_chat.kind,'ORDINARY_CHAT_UNSEALED_DRAFT');
  assert.equal(x.first_unclosed_edge,'HOST_GITHUB_ORIGIN_AUTHENTICATION');
  assert.equal(x.downstream_unverified_edge,'HOST_NATIVE_CHAT_SURFACE_A_DELIVERY');
  assert.deepEqual(x.surface_b_links,[]);
  assert.equal(x.host_native_chat_delivery_attested,false);
  assert.equal(x.active,false);
  assert.equal(x.persistent,false);
 }finally{b?.close();clean(t);}
});
test('C78 one-shot CLI accepts real opaque transport packets but cannot claim native Surface A presentation',()=>{
 const t=setup();
 try{
  const p=spawnSync(process.execPath,['scripts/c78-node-relay-cli.mjs'],
   {cwd:ROOT,input:JSON.stringify(t.request),encoding:'utf8',timeout:45000,maxBuffer:2e6});
  assert.equal(p.status,0,p.stdout?.slice(0,1400)+' '+p.stderr);
  const x=JSON.parse(p.stdout);
  assert.equal(x.status,'C78_NODE_RESPONSE_READY_HOST_DELIVERY_PENDING');
  assert.equal(x.materialization_staged_files,t.packets.length);
  assert.equal(x.materialization_receipt_sha256,t.receipt.bundle_manifest_sha256);
  assert.equal(x.host_native_chat_delivery_attested,false);
  assert.equal(x.source_origin_attested,false);
 }finally{clean(t);}
});
test('C78 post-consent selection is required before a new staging directory is created',()=>{
 const t=setup();
 try{
  const before=fs.readdirSync(os.tmpdir()).filter(x=>x.startsWith('ikant-c78-')).length;
  assert.throws(()=>new C78HostRelay({...{
   selection:selection('CANONICAL'),sourceHead,expectedManifestSha256:t.receipt.bundle_manifest_sha256,
   manifestBase64:t.manifestBytes.toString('base64')}}),/POST_CONSENT/);
  assert.throws(()=>new C78HostRelay({sourceHead,
   expectedManifestSha256:t.receipt.bundle_manifest_sha256,
   manifestBase64:t.manifestBytes.toString('base64')}),/POST_CONSENT/);
  const after=fs.readdirSync(os.tmpdir()).filter(x=>x.startsWith('ikant-c78-')).length;
  assert.equal(after,before);
 }finally{clean(t);}
});
test('C78 explicitly refuses duplicates, traversal, out-of-bundle code and missing bytes',()=>{
 const t=setup();let b;
 try{
  b=make(t);
  assert.throws(()=>b.stageFile({filePath:'../../owner.mjs',contentBase64:''}),/UNLISTED_PATH/);
  assert.throws(()=>b.stageFile({filePath:'src/runtime-command.mjs',contentBase64:''}),/UNLISTED_PATH/);
  b.stageFile(t.packets[0]);
  assert.throws(()=>b.stageFile(t.packets[0]),/DUPLICATE_PATH/);
  assert.throws(()=>b.finalize(),/INCOMPLETE_BYTE_TRANSFER/);
  assert.throws(()=>b.dispatch({humanInput:'hello'}),/BYTES_NOT_QUALIFIED/);
 }finally{b?.close();clean(t);}
});
test('C78 160 actual malformed packets fail closed without creating owner ACTIVE',()=>{
 const t=setup();let stopped=0;
 try{
  for(let i=0;i<160;i++){
   let b=null;
   try{
    const kind=i%8,at=(i*17)%t.packets.length;
    if(kind===0){
     assert.throws(()=>new C78HostRelay({selection:t.request.selection,
      sourceHead,expectedManifestSha256:'0'.repeat(64),
      manifestBase64:t.request.manifest_base64}),/MANIFEST_DIGEST/);
    }else if(kind===1){
     assert.throws(()=>new C78HostRelay({selection:t.request.selection,
      sourceHead,expectedManifestSha256:t.receipt.bundle_manifest_sha256,
      manifestBase64:'$$bad'}),/INVALID_BASE64/);
    }else{
     b=make(t);
     const corrupted={...t.packets[at]};
     if(kind===2)corrupted.contentBase64='a';
     if(kind===3)corrupted.contentBase64=Buffer.from('evil').toString('base64');
     if(kind===4)corrupted.filePath='src/../../tmp/injected';
     if(kind===5)corrupted.filePath='contracts/not-listed-'+i+'.json';
     if(kind===6)corrupted.sourceBlobSha1='0'.repeat(40);
     if(kind===7)corrupted.contentBase64=corrupted.contentBase64.slice(0,-4)+'AAAA';
     assert.throws(()=>b.stageFile(corrupted),/C78_/);
    }
    stopped++;
   }finally{b?.close();}
  }
  assert.equal(stopped,160);
 }finally{clean(t);}
});
test('C78 two sequential local calls execute but never attest persistence between actual native chat turns',()=>{
 const t=setup();let b;
 try{
  b=make(t);for(const f of t.packets)b.stageFile(f);b.finalize();
  const first=b.dispatch({humanInput:'Quali prove mancano alla mia richiesta?'});
  const second=b.dispatch({humanInput:'Spiega due alternative verificabili.'});
  for(const result of [first,second]){
   assert.equal(result.status,'C78_NODE_RESPONSE_READY_HOST_DELIVERY_PENDING',JSON.stringify(result));
   assert.equal(result.inter_turn_persistence_attested,false);
   assert.equal(result.active,false);
  }
  assert.equal(second.turn_dispatched_count,2);
  assert.notEqual(first.input_sha256,second.input_sha256);
 }finally{b?.close();clean(t);}
});
