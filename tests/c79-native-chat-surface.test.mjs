import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {buildC77Capsule} from '../scripts/c77-build-capsule.mjs';
import {C78HostRelay} from '../host/c78-host-relay.mjs';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {prepareC79ChatSurface,validateC79ChatSurface,compareC79SurfaceAEcho} from '../host/c79-native-chat-surface.mjs';

const ROOT=new URL('../',import.meta.url);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
function mode(mode='EXPERIMENTAL'){
 const terms=fs.readFileSync(new URL('../TERMS.md',import.meta.url));
 const offer=issueC72TermsOffer({sourceHead,termsDigest:hash(terms)});
 const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 return selectC72Mode({accepted,orientation:presentC72Introduction(accepted),humanMessage:mode});
}
function arrange(){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c79-test-'));
 const out=path.join(tmp,'build');
 const build=buildC77Capsule({outDir:out});
 const manifestBytes=fs.readFileSync(path.join(out,'c77-manifest.json'));
 const selection=mode();
 const relay=new C78HostRelay({selection,sourceHead,expectedManifestSha256:build.bundle_manifest_sha256,
   manifestBase64:manifestBytes.toString('base64')});
 const files=JSON.parse(manifestBytes).files;
 for(const f of files){
  const bytes=fs.readFileSync(path.join(out,f.path));
  relay.stageFile({filePath:f.path,contentBase64:bytes.toString('base64'),
    sourceBlobSha1:f.original_source_blob_sha1});
 }
 relay.finalize();
 return {tmp,relay,selection,manifest:build.bundle_manifest_sha256};
}
function dismiss(t){t.relay.close();fs.rmSync(t.tmp,{force:true,recursive:true});}
const input='Confronta due alternative e indica una prova osservabile.';
test('C79 real subprocess C70/C71/C73 readback becomes the exact ordinary-chat draft packet (not a native UI event)',()=>{
 const t=arrange();try{
  const r=t.relay.dispatch({humanInput:input});
  assert.equal(r.status,'C78_NODE_RESPONSE_READY_HOST_DELIVERY_PENDING',JSON.stringify(r));
  const packet=prepareC79ChatSurface({selection:t.selection,sourceHead,
    expectedManifestSha256:t.manifest,currentHumanInput:input,relayReadback:r});
  assert.equal(packet.status,'C79_CHAT_PACKET_READY_NOT_DELIVERED',JSON.stringify(packet));
  assert.equal(validateC79ChatSurface(packet),true);
  assert.equal(packet.surface_a_chat.text,r.surface_a_chat.text);
  assert.equal(packet.bound_input_sha256,hash(Buffer.from(input)));
  assert.equal(packet.bound_output_sha256,hash(Buffer.from(packet.surface_a_chat.text)));
  assert.equal(packet.active,false);
  assert.equal(packet.native_chat_delivery_attested,false);
  assert.equal(packet.first_unclosed_edge,'HOST_GITHUB_ORIGIN_AUTHENTICATION');
  assert.equal(packet.next_unverified_edge,'HOST_NATIVE_CHAT_SURFACE_A_DELIVERY');
  assert.deepEqual(packet.surface_b_links,[]);
  const equal=compareC79SurfaceAEcho({packet,displayedText:packet.surface_a_chat.text});
  assert.equal(equal.matched,true);
  assert.equal(equal.native_chat_delivery_attested,false);
  assert.equal(equal.evidence_scope,'BYTES_ECHOED_NO_HOST_EVENT_ID');
  const changed=compareC79SurfaceAEcho({packet,displayedText:packet.surface_a_chat.text+'x'});
  assert.equal(changed.matched,false);
 }finally{dismiss(t);}
});
test('C79 2 genuinely executed Node turns remain distinct and do not create persisted/native session identity',()=>{
 const t=arrange();try{
  const texts=[input,'Proponi un controllo minimo senza eseguire azioni.'];
  const outputs=texts.map(x=>{
   const r=t.relay.dispatch({humanInput:x});
   return prepareC79ChatSurface({selection:t.selection,sourceHead,
      expectedManifestSha256:t.manifest,currentHumanInput:x,relayReadback:r});
  });
  assert.ok(outputs.every(x=>x.status==='C79_CHAT_PACKET_READY_NOT_DELIVERED'));
  assert.notEqual(outputs[0].bound_input_sha256,outputs[1].bound_input_sha256);
  for(const x of outputs){
   assert.equal(x.inter_turn_persistence_attested,false);
   assert.equal(x.native_chat_delivery_attested,false);
   assert.equal(x.source_origin_attested,false);
  }
 }finally{dismiss(t);}
});
test('C79 1000 semantic mutations of an ACTUALLY executed C78 readback fail closed',()=>{
 const t=arrange();let attempts=0;
 try{
  const r=t.relay.dispatch({humanInput:input});
  assert.equal(r.status,'C78_NODE_RESPONSE_READY_HOST_DELIVERY_PENDING');
  for(let i=0;i<1000;i++){
   const g=i%20,n=Math.floor(i/20);
   const x=structuredClone(r);const args={
    selection:t.selection,sourceHead,expectedManifestSha256:t.manifest,
    currentHumanInput:input,relayReadback:x};
   const falseSha=(n.toString(16).padStart(64,'0'));
   switch(g){
    case 0:x.status='ACTIVE';break;
    case 1:x.schema='ikant-le-c59-canonical-active-readback/v1';break;
    case 2:x.active=true;break;
    case 3:x.persistent=true;break;
    case 4:x.native_event_attested=true;break;
    case 5:x.source_origin_attested=true;break;
    case 6:x.host_native_chat_delivery_attested=true;break;
    case 7:x.host_docx_delivery_attested=true;break;
    case 8:x.owner_receipt_issued=true;break;
    case 9:x.executed_kernel=false;break;
    case 10:x.child_process_executed=false;break;
    case 11:x.child_process_exit_code=1;break;
    case 12:x.input_sha256=falseSha;break;
    case 13:x.output_sha256=falseSha;break;
    case 14:x.surface_a_chat.text+=' forged:'+n;break;
    case 15:x.surface_a_chat.kind='CANONICAL_SEALED';break;
    case 16:x.surface_b_links=[{url:'sandbox:/mnt/data/fake-'+n+'.docx'}];break;
    case 17:x.c73_status='C73_CANONICAL_FRAME_READY_NOT_HOST_DELIVERED';break;
    case 18:x.first_unclosed_edge='HOST_NATIVE_CHAT_SURFACE_A_DELIVERY';break;
    case 19:x.turn_dispatched_count=0;break;
   }
   const packet=prepareC79ChatSurface(args);
   assert.equal(packet.status,'C79_STOP','mutation '+i);
   assert.equal(packet.active,false);
   assert.equal(packet.surface_a_chat,null);
   assert.equal(packet.native_chat_delivery_attested,false);
   attempts++;
  }
  assert.equal(attempts,1000);
  const mismatched=prepareC79ChatSurface({
    selection:t.selection,sourceHead,expectedManifestSha256:t.manifest,
    currentHumanInput:input+' replay',relayReadback:r});
  assert.equal(mismatched.status,'C79_STOP');
  const wrongMode=prepareC79ChatSurface({
    selection:mode('CANONICAL'),sourceHead,expectedManifestSha256:t.manifest,
    currentHumanInput:input,relayReadback:r});
  assert.equal(wrongMode.status,'C79_STOP');
 }finally{dismiss(t);}
});
test('C79 1000 mutated display packets cannot claim host authority even with recomputed local checksums',()=>{
 const t=arrange();
 try{
  const readback=t.relay.dispatch({humanInput:input});
  const packet=prepareC79ChatSurface({selection:t.selection,sourceHead,
   expectedManifestSha256:t.manifest,currentHumanInput:input,relayReadback:readback});
  assert.equal(validateC79ChatSurface(packet),true);
  for(let i=0;i<1000;i++){
   const v=structuredClone(packet);
   const k=i%10,n=Math.floor(i/10);
   switch(k){
    case 0:v.active=true;break;
    case 1:v.persistent=true;break;
    case 2:v.authority=1;break;
    case 3:v.native_chat_delivery_attested=true;break;
    case 4:v.source_origin_attested=true;break;
    case 5:v.owner_receipt_issued=true;break;
    case 6:v.bound_output_sha256=n.toString(16).padStart(64,'0');break;
    case 7:v.surface_a_chat.text+=' malicious '+n;break;
    case 8:v.surface_b_links=[{url:'https://example.invalid/'+n+'.docx'}];break;
    case 9:v.first_unclosed_edge='NO_MISSING_EDGE';break;
   }
   const {packet_sha256,...payload}=v;
   v.packet_sha256=hash(Buffer.from(JSON.stringify(payload)));
   assert.equal(validateC79ChatSurface(v),false,'tampered packet '+i);
  }
 }finally{dismiss(t);}
});


test('C79 one-shot CLI emits exactly one input-bound JSON chat frame, never an ACTIVE or UI success claim',()=>{
 const t=arrange();try{
  const r=t.relay.dispatch({humanInput:input});
  const payload={schema:'ikant-le-c79-render-request/v1',
   selection:t.selection,sourceHead,expectedManifestSha256:t.manifest,
   currentHumanInput:input,relayReadback:r};
  const p=spawnSync(process.execPath,['scripts/c79-chat-frame-cli.mjs'],{
   cwd:ROOT,input:JSON.stringify(payload),encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
  assert.equal(p.status,0,p.stderr+' '+p.stdout?.slice(0,300));
  const frame=JSON.parse(p.stdout);
  assert.equal(frame.status,'C79_CHAT_PACKET_READY_NOT_DELIVERED');
  assert.equal(frame.surface_a_chat.text,r.surface_a_chat.text);
  assert.equal(frame.native_chat_delivery_attested,false);
  const forged=structuredClone(payload);
  forged.currentHumanInput='replayed input';
  const q=spawnSync(process.execPath,['scripts/c79-chat-frame-cli.mjs'],{
   cwd:ROOT,input:JSON.stringify(forged),encoding:'utf8',timeout:30000});
  assert.equal(q.status,2);
  assert.equal(JSON.parse(q.stdout).status,'C79_STOP');
 }finally{dismiss(t);}
});
