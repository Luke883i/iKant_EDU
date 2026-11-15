import test from 'node:test';
import assert from 'node:assert/strict';
import {checkC93SourceEpoch} from '../host/c93-source-epoch.mjs';
import {checkC92Request,executeC92ProductionTurn} from '../host/c92-owner-surface.mjs';
import {sha,makeC93Fixture,C93_TEST_HEAD} from './c93-fixture.mjs';

test('new post-merge source epoch can enter bounded preflight without compile-time SHA',()=>{
 const q=makeC93Fixture();const v=checkC93SourceEpoch(q);
 assert.equal(v.status,'C93_SOURCE_BYTES_BOUND_C81_STILL_REQUIRED');
 assert.equal(v.source_head,C93_TEST_HEAD);assert.equal(v.source_reachability_verified,false);
 assert.equal(v.github_ref_origin_attested,false);assert.equal(checkC92Request(q),null);
});
test('source epoch rejects a mutated SHA without provider invocation',()=>{
 const q=makeC93Fixture();for(const bad of [{...q,sourceHead:'c'.repeat(40)},{...q,packageSha256:sha('drift')},{...q,manifestSha256:sha('drift')},{...q,packageBase64:'not-base64'}]){
  assert.equal(checkC93SourceEpoch(bad).status,'C93_SOURCE_STOP');
  assert.equal(checkC92Request(bad),'C93_SOURCE_EPOCH_INVALID');
 }
});
test('unverified complete-looking package is explicitly NOT GitHub-ref or C81 proof',()=>{
 const q=makeC93Fixture();assert.equal(checkC93SourceEpoch(q).status,'C93_SOURCE_BYTES_BOUND_C81_STILL_REQUIRED');
 assert.equal(checkC93SourceEpoch(q).source_reachability_verified,false);
});
test('live owner refuses positive output without physically connected models',async()=>{
 const q=makeC93Fixture();const r=await executeC92ProductionTurn(q);
 assert.equal(r.status,'C92_STOP');assert.equal(r.first_unclosed_edge,'REAL_PROVIDER_CONFIGURATION_MISSING');
 assert.equal(r.surface_a,null);assert.equal(r.active,false);
});
test('host projection does not fabricate a Surface A when provider is absent',async()=>{
 const {executeC93HostProjection}=await import('../host/c93-experimental-projection.mjs');
 const r=await executeC93HostProjection(makeC93Fixture());
 assert.equal(r.status,'C93_PROJECTION_STOP');assert.equal(r.first_unclosed_edge,'REAL_PROVIDER_CONFIGURATION_MISSING');
 assert.equal(r.surface_a_exact,null);assert.equal(r.active,false);
});
test('real local handoff file has byte reopen, but no Git or native proof',async()=>{
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');
 const {inspectC93Handoff}=await import('../scripts/c93-handoff-preflight-cli.mjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c93-fixture-'));
 try{
  const p=path.join(dir,'source-package.json'),q=makeC93Fixture();
  fs.writeFileSync(p,Buffer.from(q.packageBase64,'base64'));
  const r=inspectC93Handoff(p,q.sourceHead);
  assert.equal(r.status,'C93_HANDOFF_REOPENED_SOURCE_BYTES_NOT_EXECUTED');
  assert.equal(r.physically_read_and_reopened,true);
  assert.equal(r.c81_reachability_attested,false);
  assert.equal(inspectC93Handoff(p,'d'.repeat(40)).status,'C93_HANDOFF_STOP');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('malformed null request and null manifest stop without throwing',()=>{
 assert.equal(checkC93SourceEpoch(null).status,'C93_SOURCE_STOP');
 const q=makeC93Fixture();const p=JSON.parse(Buffer.from(q.packageBase64,'base64').toString('utf8'));
 const b=Buffer.from('null');p.manifestBase64=b.toString('base64');p.expectedManifestSha256=q.manifestSha256=sha(b);
 const raw=Buffer.from(JSON.stringify(p));q.packageBase64=raw.toString('base64');q.packageSha256=sha(raw);
 assert.equal(checkC93SourceEpoch(q).status,'C93_SOURCE_STOP');
});
