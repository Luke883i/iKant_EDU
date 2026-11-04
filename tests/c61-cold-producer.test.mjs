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
function preaccept(){const b=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8')),paths=b.post_accept_fastboot.reuse_preaccept_paths,rows=paths.map(obj),terms=rows.find(x=>x.path==='TERMS.md'),payloads=paths.map(p=>({path:p,content_utf8:fs.readFileSync(path.join(ROOT,p),'utf8')}));return{schema:'ikant-le-preaccept-handoff/v2',repository:'Luke883i/iKant_EDU',source_head:HEAD,terms_presented:true,terms_object:{...terms},frozen:true,breached:false,pending_intent:'inizializza',orientation_objects:rows,orientation_payloads:payloads,runtime_observed_terms_presentation:false,host_attested_terms_presentation:true,authority:0};}
function copy(rel,to){const out=path.join(to,rel);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(path.join(ROOT,rel),out);}

test('C61 scratch cold producer closes seed to C59 ACTIVE without fixture executor',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c61-')),workspace=path.join(parent,'cold'),sink=path.join(parent,'runtime');fs.mkdirSync(workspace,{recursive:true});
 try{
  const sourceBoot=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8')),loader=sourceBoot.post_accept_fastboot.pre_runtime_kernel.path;copy('BOOTSTRAP.json',workspace);copy(loader,workspace);
  const cold=await import(pathToFileURL(path.join(workspace,loader)).href+'?c61='+crypto.randomUUID()),pre=preaccept(),manifest=cold.issueCanonicalRelayManifest({workspace,sourceHead:HEAD,preacceptHandoff:pre,humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:10,observedMonotonicMs:11});
  assert.equal(manifest.object_count,8);assert.deepEqual(manifest.objects.map(x=>x.path),sourceBoot.post_accept_fastboot.remote_paths);assert.deepEqual(manifest.seed_objects,['BOOTSTRAP.json',loader]);
  const observations=[];let tick=12;for(const row of manifest.objects){if(!fs.existsSync(path.join(workspace,row.path)))copy(row.path,workspace);const sourceBytes=fs.readFileSync(path.join(ROOT,row.path));observations.push(cold.issueCanonicalRelayObservation({workspace,sourceHead:HEAD,preacceptHandoff:pre,relayManifest:manifest,objectPath:row.path,sourceBytes,sourceObjectIdentity:'git:'+HEAD+':'+row.path,localObjectId:'scratch:'+row.path,observedMonotonicMs:tick++}));}
  const executor=cold.issueCanonicalActivationExecutor({workspace,sourceHead:HEAD,preacceptHandoff:pre,relayManifest:manifest,relayObservations:observations});assert.equal(executor.acquisition_complete,true);assert.equal(executor.runtime_objects.length,8);assert.equal(executor.orientation_objects.length,5);
  const handoff=cold.issueCanonicalSessionChatCompositionFromExecutor({workspace,preacceptHandoff:pre,activationExecutor:executor,humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:10});assert.equal(handoff.canonical_activation_authority,true);
  const out=await cold.executeCanonicalColdBootstrap({workspace,sink,sourceHead:HEAD,preacceptHandoff:pre,relayManifest:manifest,relayObservations:observations,humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:10});assert.equal(out.active,true);assert.equal(out.canonical_active_readback.ok,true);assert.equal(out.canonical_active_readback.composition_authority,'C59_CANONICAL');assert.equal(out.activation_executor_receipt_sha256,executor.receipt_sha256);
 }finally{fs.rmSync(parent,{recursive:true,force:true});}
});

test('C61 producer rejects incomplete duplicate forged and tampered relay evidence',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c61-neg-')),workspace=path.join(parent,'cold');fs.mkdirSync(workspace,{recursive:true});
 try{
  const b=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8')),loader=b.post_accept_fastboot.pre_runtime_kernel.path;copy('BOOTSTRAP.json',workspace);copy(loader,workspace);const cold=await import(pathToFileURL(path.join(workspace,loader)).href+'?c61n='+crypto.randomUUID()),pre=preaccept(),manifest=cold.issueCanonicalRelayManifest({workspace,sourceHead:HEAD,preacceptHandoff:pre,humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:1,observedMonotonicMs:2}),obs=[];let tick=3;
  for(const row of manifest.objects){if(!fs.existsSync(path.join(workspace,row.path)))copy(row.path,workspace);obs.push(cold.issueCanonicalRelayObservation({workspace,sourceHead:HEAD,preacceptHandoff:pre,relayManifest:manifest,objectPath:row.path,sourceBytes:fs.readFileSync(path.join(ROOT,row.path)),sourceObjectIdentity:'src:'+row.path,localObjectId:'dst:'+row.path,observedMonotonicMs:tick++}));}
  assert.throws(()=>cold.issueCanonicalActivationExecutor({workspace,sourceHead:HEAD,preacceptHandoff:pre,relayManifest:manifest,relayObservations:obs.slice(1)}),/cardinality/);
  assert.throws(()=>cold.issueCanonicalActivationExecutor({workspace,sourceHead:HEAD,preacceptHandoff:pre,relayManifest:manifest,relayObservations:[...obs,obs[0]]}),/cardinality/);
  const forged=structuredClone(obs);forged[0].receipt_sha256='0'.repeat(64);assert.throws(()=>cold.issueCanonicalActivationExecutor({workspace,sourceHead:HEAD,preacceptHandoff:pre,relayManifest:manifest,relayObservations:forged}),/observation invalid/);
  fs.appendFileSync(path.join(workspace,manifest.objects.at(-1).path),'x');assert.throws(()=>cold.issueCanonicalActivationExecutor({workspace,sourceHead:HEAD,preacceptHandoff:pre,relayManifest:manifest,relayObservations:obs}),/observation invalid|reopen mismatch/);
 }finally{fs.rmSync(parent,{recursive:true,force:true});}
});
