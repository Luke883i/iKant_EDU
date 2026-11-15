import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {PIN} from '../host/c107-carrier-consumer.mjs';
import {C124_SOURCE_EPOCH,C124_OVERLAY_GIT_BLOBS} from '../host/c124-source-overlay.mjs';
import {buildC127SourceCache,inspectC127SourceCache,loadC127SourceCache} from '../host/edu-c127-source-transport.mjs';
import {createC125ShellSession} from '../host/edu-c125-shell-session.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const H=x=>crypto.createHash('sha256').update(x).digest('hex');
const source=()=>({carrierBytes:fs.readFileSync(path.join(root,PIN.name)),
 c124OverlayBytes:Object.fromEntries(Object.keys(C124_OVERLAY_GIT_BLOBS).map(p=>[p,fs.readFileSync(path.join(root,p))]))});
const build=()=>{const x=buildC127SourceCache(source());assert.equal(x.ok,true,x.first_edge);return x};
test('C128 physical cache canonical bytes and single inode exact source readback',()=>{
 const x=build(),v=inspectC127SourceCache(x.bytes);assert.equal(v.ok,true,v.first_edge);
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'c128-bytes-')),f=path.join(parent,'source.json');
 try{fs.writeFileSync(f,x.bytes,{flag:'wx',mode:0o600});
  const w=loadC127SourceCache(f);assert.equal(w.ok,true,w.first_edge);
  assert.equal(w.single_inode_readback_verified,true);assert.equal(w.cache_sha256,x.sha256);
  const link=path.join(parent,'sym.json');fs.symlinkSync(f,link);
  assert.equal(loadC127SourceCache(link).ok,false);
 }finally{fs.rmSync(parent,{recursive:true,force:true})}
});
test('C128 rejects parse-equivalent ambiguous cache bytes and reordered payloads',()=>{
 const x=build(),o=JSON.parse(x.bytes.toString('utf8'));
 const variants=[
  Buffer.from(JSON.stringify(o,null,2)+'\n'),
  Buffer.from(JSON.stringify(o)+'\n\n'),
  Buffer.from(JSON.stringify({...o,overlays:[...o.overlays].reverse()})+'\n'),
  Buffer.from(' '+JSON.stringify(o)+'\n'),
  Buffer.from(JSON.stringify(o).replace('"schema":','"schema":"ikant-c127-project-source-cache/v1","schema":')+'\n'),
  Buffer.concat([Buffer.from(JSON.stringify(o)),Buffer.from([0xff,0x0a])])
 ];
 for(let i=0;i<variants.length;i++){const result=inspectC127SourceCache(variants[i]);
  assert.equal(result.ok,false,'variant '+i+' wrongly admitted');}
});
test('one actual cache file -> original C72 -> PR119/C70/C124/C126/C114/C87 -> C125 independent readback',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'c128-original-')),f=path.join(parent,'source.json'),outputs=[];
 const voice='La lettura allarga le prospettive e rende più articolata la comprensione di esperienze e argomenti.';
 const input='Che cosa rende utile leggere romanzi e saggi di filosofia?';let session,modelCalls=0;
 try{
  fs.writeFileSync(f,build().bytes,{flag:'wx'});
  session=await createC125ShellSession({c127CachePath:f,privateParent:parent,
   languagePort:t=>{modelCalls++;assert.equal(t.source_head,C124_SOURCE_EPOCH);
    assert.equal(t.c124_channels.channels.length,12);
    return {text:voice,ack_plan_sha256:t.guidance.plan_sha256,input_sha256:t.plan.input_sha256,
     ack_c124_channel_sha256:t.c124_channel_sha256};},
   send:s=>outputs.push(s),afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'}});
  assert.equal(session.ok,true,session.first_edge);
  assert.equal(session.runtime_ready,true,session.initial_edge);
  const staged=fs.readdirSync(parent).find(x=>x.startsWith('ikant-c107-source-'));
  assert.ok(staged);
  const sourceRoot=path.join(parent,staged);
  const c72=await import(pathToFileURL(path.join(sourceRoot,'host/c72-unified-mode-admission.mjs')).href);
  const offer=c72.issueC72TermsOffer({sourceHead:C124_SOURCE_EPOCH,
   termsDigest:H(fs.readFileSync(path.join(sourceRoot,'TERMS.md')))});
  const accepted=c72.acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
  const selection=c72.selectC72Mode({accepted,orientation:c72.presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
  const frame=nonce=>({humanInput:input,nonce,selection,priorMessages:[],resetContext:true,
   authorization:{human_mode_selected:true,opt_in_confirmed:true,separate_cohost_draft_authorized:true,provenance:'LOCAL_TEST_FIXTURE'}});
  const first=frame('c128-cache-owner-turn-0001');
  const result=await session.publishTurn({frame:first});
  assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.origin,'HOST_BOUND');
  assert.equal(outputs.length,1);assert.ok(outputs[0].includes(voice));
  assert.equal((await session.publishTurn({frame:first})).ok,false);assert.equal(outputs.length,1);
  const second=await session.publishTurn({frame:frame('c128-cache-owner-turn-0002')});
  assert.equal(second.ok,true,JSON.stringify(second));assert.equal(outputs.length,2);
  assert.equal(modelCalls,2);
 }finally{session?.close();fs.rmSync(parent,{recursive:true,force:true})}
});
test('parse equivalent but noncanonical cache cannot reach host callback or C87',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'c128-block-')),f=path.join(parent,'source.json');
 let count=0;try{
  const o=JSON.parse(build().bytes.toString('utf8'));o.overlays.reverse();
  fs.writeFileSync(f,JSON.stringify(o)+'\n');
  const host=await createC125ShellSession({c127CachePath:f,privateParent:parent,
   languagePort:()=>{count++;return null},send:()=>{count++},
   afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'}});
  assert.equal(host.ok,false);assert.equal(host.first_edge,'C128_CACHE_NONCANONICAL_SOURCE_ORDER');
  assert.equal(count,0);
 }finally{fs.rmSync(parent,{recursive:true,force:true})}
});
