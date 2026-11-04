import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {ROOT} from '../src/contract.mjs';

const HEAD='a'.repeat(40);
const blob=b=>{const x=Buffer.isBuffer(b)?b:Buffer.from(b);return crypto.createHash('sha1').update(Buffer.from('blob '+x.length+'\0')).update(x).digest('hex')};
const obj=p=>{const b=fs.readFileSync(path.join(ROOT,p));return{path:p,blob_sha1:blob(b),bytes:b.length}};
function preaccept(){
 const b=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8')),paths=b.post_accept_fastboot.reuse_preaccept_paths,rows=paths.map(obj),terms=rows.find(x=>x.path==='TERMS.md');
 const payloads=paths.map(p=>({path:p,content_utf8:fs.readFileSync(path.join(ROOT,p),'utf8')}));
 return{schema:'ikant-le-preaccept-handoff/v2',repository:'Luke883i/iKant_EDU',source_head:HEAD,terms_presented:true,terms_object:{...terms},frozen:true,breached:false,pending_intent:'inizializza',orientation_objects:rows,orientation_payloads:payloads,runtime_observed_terms_presentation:false,host_attested_terms_presentation:true,authority:0};
}
function copy(rel,to){const out=path.join(to,rel);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(path.join(ROOT,rel),out);}

test('C62 RAW5 evidence plus RUNTIME8 closes to C59 ACTIVE without orientation files in sink',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c62-')),workspace=path.join(parent,'cold'),sink=path.join(parent,'runtime');fs.mkdirSync(workspace,{recursive:true});
 try{
  const sourceBoot=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8')),loader=sourceBoot.post_accept_fastboot.pre_runtime_kernel.path,orientationPaths=sourceBoot.post_accept_fastboot.reuse_preaccept_paths;
  copy('BOOTSTRAP.json',workspace);copy(loader,workspace);
  for(const p of orientationPaths.filter(p=>p!=='BOOTSTRAP.json'))assert.equal(fs.existsSync(path.join(workspace,p)),false,p);
  const cold=await import(pathToFileURL(path.join(workspace,loader)).href+'?c62='+crypto.randomUUID()),pre=preaccept();
  const pv=cold.validatePreacceptKernelInput(pre,{workspace,sourceHead:HEAD});assert.equal(pv.ok,true);
  const manifest=cold.issueCanonicalRelayManifest({workspace,sourceHead:HEAD,preacceptHandoff:pre,humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:10,observedMonotonicMs:11});
  assert.equal(manifest.object_count,8);assert.deepEqual(manifest.objects.map(x=>x.path),sourceBoot.post_accept_fastboot.remote_paths);
  assert.equal(manifest.pre_acquisition_object_authority,'FROZEN_BOOTSTRAP_REMOTE_PATHS');assert.equal(manifest.manifest_role,'VERIFICATION_PROJECTION_OF_FROZEN_BOOTSTRAP');
  for(const p of orientationPaths)assert.equal(manifest.objects.some(x=>x.path===p),false,p);
  const observations=[];let tick=12;for(const row of manifest.objects){if(!fs.existsSync(path.join(workspace,row.path)))copy(row.path,workspace);const sourceBytes=fs.readFileSync(path.join(ROOT,row.path));observations.push(cold.issueCanonicalRelayObservation({workspace,sourceHead:HEAD,preacceptHandoff:pre,relayManifest:manifest,objectPath:row.path,sourceBytes,sourceObjectIdentity:'git:'+HEAD+':'+row.path,localObjectId:'scratch:'+row.path,observedMonotonicMs:tick++}));}
  const executor=cold.issueCanonicalActivationExecutor({workspace,sourceHead:HEAD,preacceptHandoff:pre,relayManifest:manifest,relayObservations:observations});
  assert.equal(executor.runtime_objects.length,8);assert.equal(executor.orientation_objects.length,5);
  const out=await cold.executeCanonicalColdBootstrap({workspace,sink,sourceHead:HEAD,preacceptHandoff:pre,relayManifest:manifest,relayObservations:observations,humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:10});
  assert.equal(out.active,true);assert.equal(out.canonical_active_readback.ok,true);assert.equal(out.canonical_active_readback.composition_authority,'C59_CANONICAL');
  for(const p of orientationPaths)assert.equal(fs.existsSync(path.join(sink,p)),false,p);
  const projection=JSON.parse(fs.readFileSync(path.join(sink,'.ikant','orientation-projection.json'),'utf8')),materialization=JSON.parse(fs.readFileSync(path.join(sink,'.ikant','materialization.json'),'utf8'));
  assert.equal(projection.schema,'ikant-le-orientation-runtime-projection/v1');assert.equal(projection.source_head,HEAD);assert.equal(projection.orientation_objects.length,5);assert.equal(projection.orientation_source_files_materialized,false);
  assert.equal(projection.terms_text,fs.readFileSync(path.join(ROOT,'TERMS.md'),'utf8'));assert.equal(projection.runtime_root_descriptor.runtime_root_sha256,sourceBoot.post_accept_fastboot.runtime_root.runtime_root_sha256);
  assert.equal(materialization.orientation_source_files_materialized,false);assert.equal(materialization.orientation_projection_receipt_sha256,projection.receipt_sha256);
 }finally{fs.rmSync(parent,{recursive:true,force:true});}
});

test('C62 rejects mutated frozen evidence before runtime relay',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c62-neg-')),workspace=path.join(parent,'cold');fs.mkdirSync(workspace,{recursive:true});
 try{
  const b=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8')),loader=b.post_accept_fastboot.pre_runtime_kernel.path;copy('BOOTSTRAP.json',workspace);copy(loader,workspace);
  const cold=await import(pathToFileURL(path.join(workspace,loader)).href+'?c62n='+crypto.randomUUID()),pre=preaccept();pre.orientation_payloads[0].content_utf8+='x';
  const v=cold.validatePreacceptKernelInput(pre,{workspace,sourceHead:HEAD});assert.equal(v.ok,false);assert.ok(v.errors.includes('orientation_payloads'));
  assert.throws(()=>cold.issueCanonicalRelayManifest({workspace,sourceHead:HEAD,preacceptHandoff:pre,humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:1,observedMonotonicMs:2}),/preaccept seed invalid/);
 }finally{fs.rmSync(parent,{recursive:true,force:true});}
});
