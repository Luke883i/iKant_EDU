import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderC131OperatorStage,presentC131ManualSessionCard} from '../host/c131-operator-surface.mjs';
import {inspectC130PublicCopy} from '../host/c130-public-language.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('source catalog gives exactly one public product root and leaves release authority external',()=>{
 const x=JSON.parse(read('release/catalog.json'));
 assert.equal(x.source_of_truth.branch,'main');assert.equal(x.source_of_truth.pr_is_release_source,false);
 assert.equal(x.packaging.bundle_is_runtime_installation,false);
 assert.equal(x.publication.candidate_is_official,false);
 for(const p of Object.values(x.public_entrypoints))assert.equal(fs.statSync(path.join(root,p)).isFile(),true,p);
 assert.match(read('README.md'),/docs\/START_HERE\.md/);
 assert.match(read('README.md'),/release\/catalog\.json/);
});
test('operator presentation defaults to accessible short explanations, always a non-authoritative projection',()=>{
 const stages=['NEEDS_UPLOAD','CHECKING_SOURCE','READY_FOR_INPUT','PROCESSING','CLOSED','BLOCKED'];
 for(const s of stages){
  const p=renderC131OperatorStage(s);
  assert.equal(p.ok,true);assert.equal(p.active,false);assert.equal(p.native_ui_control,false);
  assert.equal(p.evidence,'PRESENTER_PROJECTION_ONLY');
  assert.equal(inspectC130PublicCopy(p.text).ok,true,p.text);
  assert.ok(p.text.length<240);
 }
 assert.equal(renderC131OperatorStage('ACTIVE').ok,false);
 assert.equal(renderC131OperatorStage('OWNER_VOICE').ok,false);
 assert.equal(renderC131OperatorStage('UNKNOWN').ok,false);
});
test('operator status denies getter/proxy and does not mint a receipt',()=>{
 assert.equal(presentC131ManualSessionCard(()=>({closed:false,busy:false})).ok,true);
 assert.match(presentC131ManualSessionCard(()=>({closed:true,busy:false})).text,/chiusa/);
 assert.match(presentC131ManualSessionCard(()=>({closed:false,busy:true})).text,/elaborando/);
 assert.match(presentC131ManualSessionCard(()=>new Proxy({},{get(){throw Error('evil')}})).text,/non ha autorizzato/);
 assert.equal(presentC131ManualSessionCard(()=>({closed:false})).evidence,'PRESENTER_PROJECTION_ONLY');
});
test('the audience descriptor is a presentation preference and never stores personal classification',()=>{
 const x=JSON.parse(read('contracts/c131-operator-experience.json'));
 assert.equal(x.default_audience,'NON_SPECIALIST_OPERATOR');
 assert.equal(x.do_not_persist_personal_classification,true);
 assert.equal(x.native_chatgpt_ui_control_attested,false);
 assert.equal(x.applies_to.includes('HOST_INTERIM_MESSAGE'),true);
 assert.equal(x.applies_to.includes('HOST_FINAL_MESSAGE'),true);
});
test('bundle recipe points to existing exact source files and isolates the historical runtime',()=>{
 const f=read('scripts/c131-build-project-bundle.py');
 assert.match(f,/runtime\/C128_PROJECT_SOURCE_CACHE.json/);
 assert.match(f,/sort(ed)?\(/);
 assert.match(f,/CANDIDATE_NOT_RUNTIME_INSTALLATION/);
 const c=read('scripts/c131-build-source-cache.mjs');
 assert.match(c,/loadC127SourceCache/);
 assert.equal(JSON.parse(read('release/catalog.json')).source_of_truth.sources_after_merge_only,true);
});

import {qualifyC131ReleaseCandidate} from '../host/c131-product-release-gate.mjs';
test('release qualification never mints official publication from caller data',()=>{
 const h='a'.repeat(40),candidate={branch:'main',sourceCommit:h,promptCommit:h,bundleCommit:h,
  bundleSha256:'a'.repeat(64),manifestVerified:true,testsPassed:true,ownerIdentityVerified:true};
 const ok=qualifyC131ReleaseCandidate(candidate);
 assert.equal(ok.eligible,true);assert.equal(ok.published,false);
 assert.equal(ok.source_authentication,'CALLER_ATTESTED_ONLY');
 for(const [field,value] of [['branch','feature'],['sourceCommit','x'],['promptCommit','b'.repeat(40)],
 ['bundleCommit','b'.repeat(40)],['bundleSha256','x'],['manifestVerified',false],
 ['testsPassed',false],['ownerIdentityVerified',false]]){
  const z=qualifyC131ReleaseCandidate({...candidate,[field]:value});
  assert.equal(z.eligible,false,field);assert.equal(z.published,false);
 }
 const pr=new Proxy(candidate,{get(){throw Error('Evil')}});
 assert.equal(qualifyC131ReleaseCandidate(pr).eligible,false);
});
