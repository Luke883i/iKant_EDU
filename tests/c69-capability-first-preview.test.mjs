import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {C69_EXPERIMENTAL_CONSENT,C69_EXPERIMENTAL_TERMS,
 issueC69ExperimentalOffer,qualifyC69ExperimentalPreview} from '../host/c69-capability-first-preview.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const HEAD='a'.repeat(40);
const readme=fs.readFileSync(path.join(ROOT,'README.md'));
const sha1=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const source=()=>({path:'README.md',blob_sha1:sha1(readme),content_base64:readme.toString('base64')});
const baseline=()=>({sourceHead:HEAD,offer:issueC69ExperimentalOffer({sourceHead:HEAD}),
 observedConsent:C69_EXPERIMENTAL_CONSENT,sourceObject:source()});
const resealOffer=o=>{const {offer_sha256,...material}=o;return {...material,offer_sha256:digest(material)};};

test('C69 text-only preview is consumable without pretending canonical iKant is ACTIVE',()=>{
 const x=qualifyC69ExperimentalPreview(baseline());
 assert.equal(x.status,'EXPERIMENTAL_SOURCE_PREVIEW');
 assert.equal(x.source_blob_identity_checked,true);
 assert.equal(x.local_samehash_verified,false);
 assert.equal(x.active,false);
 assert.equal(x.canonical_runtime,false);
 assert.equal(x.owner_receipt_issued,false);
 assert.equal(x.native_event_attested,false);
 assert.equal(x.github_host_origin_attested,false);
 assert.equal(x.native_delivery_attested,false);
 assert.equal(x.persistent,false);
 assert.equal(x.consent_basis,'LEGACY_EXACT_MODEL_OBSERVED_EXPERIMENTAL_TEXT');
 assert.deepEqual(x.permitted_operations,['REPOSITORY_STUDY','EXPERIMENTAL_DESIGN','DRAFT_USER_REQUESTED_OUTPUT']);
 assert.ok(C69_EXPERIMENTAL_TERMS.includes('No native message identity'));
});
test('C69 physical Node local reopen is ephemeral and proves only local samehash',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'c69-local-'));
 try{
  const x=qualifyC69ExperimentalPreview({...baseline(),sessionRoot:root});
  assert.equal(x.status,'EXPERIMENTAL_LOCAL_PREVIEW');
  assert.equal(x.local_samehash_verified,true);
  assert.equal(x.active,false);
  assert.equal(x.native_event_attested,false);
  assert.deepEqual(fs.readdirSync(root),[],'stage must be removed, no persistent writer');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('C69 without a real local sink does not manufacture samehash or fallback',()=>{
 const x=qualifyC69ExperimentalPreview({...baseline(),sessionRoot:'/does-not-exist/c69'});
 assert.equal(x.status,'EXPERIMENTAL_SINK_UNAVAILABLE');
 assert.equal(x.active,false);
 assert.deepEqual(x.permitted_operations,[]);
 assert.equal(x.first_unclosed_edge,'LOCAL_FILESYSTEM');
});
test('C69 100 deterministic semantic adversarial mutations reject all attempted scope/identity promotions',()=>{
 let refused=0;const total=100;
 for(let i=0;i<total;i++){
  const family=Math.floor(i/10),n=i%10;
  const x=structuredClone(baseline());
  switch(family){
   case 0: x.observedConsent=['I ACCEPT','I ACCEPT ','i accept experimental','I ACCEPT EXPERIMENTAL ','','I ACCEPT\nEXPERIMENTAL','I ACCEPT EXPERIMENTAL\n','I ACCEPT EXPERIMENTAL!','I ACCEPT EXPERIMENTAL AGAIN',null][n];break;
   case 1: x.offer.source_head='b'.repeat(39)+(n%10);x.offer=resealOffer(x.offer);break;
   case 2: x.offer.terms+=' Mutation '+n;x.offer=resealOffer(x.offer);break;
   case 3: x.offer.offer_sha256=(String(n%10).repeat(64));break;
   case 4: x.offer.scope+='_'+n;x.offer=resealOffer(x.offer);break;
   case 5: x.sourceObject.content_base64=Buffer.from('corrupt-'+n).toString('base64');break;
   case 6: x.sourceObject.blob_sha1='b'.repeat(39)+(n%10);break;
   case 7: x.sourceObject.path='README.md'+(n===0?' ':'/'+n);break;
   case 8:
    [{canonicalContinuation:true},{blockedRuntimeResume:true},
     {requestCanonicalRuntime:true},{acceptanceEventId:'native-id'},
     {acceptanceObservedMonotonicMs:0},{nativeOriginClaim:true},
     {claimActive:true},{canonicalContinuation:true,claimActive:true},
     {blockedRuntimeResume:true,nativeOriginClaim:true},
     {acceptanceEventId:null}].forEach((k,j)=>{if(j===n)Object.assign(x,k)});
    break;
   case 9:
    x.offer.prohibited[n%6]='ALLOW_CANONICAL_'+n;x.offer=resealOffer(x.offer);break;
  }
  const y=qualifyC69ExperimentalPreview(x);
  assert.notEqual(y.status,'EXPERIMENTAL_SOURCE_PREVIEW','case '+i+' family '+family);
  assert.notEqual(y.status,'EXPERIMENTAL_LOCAL_PREVIEW','case '+i);
  assert.equal(y.active,false,'false ACTIVE '+i);
  assert.equal(y.canonical_runtime,false,'false runtime '+i);
  assert.equal(y.owner_receipt_issued,false,'false owner '+i);
  assert.deepEqual(y.permitted_operations,[],'false capability '+i);
  refused++;
 }
 assert.equal(refused,total);
});
