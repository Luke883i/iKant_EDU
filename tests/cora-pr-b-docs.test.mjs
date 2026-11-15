import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {qualifyDocumentSet,observePrBDocs} from '../scripts/cora-pr-b-docs.mjs';
import {verify as verifyAtlas} from '../scripts/ikant-document-atlas.mjs';
const contract=JSON.parse(fs.readFileSync(new URL('../contracts/cora-pr-b-documentation-v1.json',import.meta.url),'utf8'));
const base=Object.fromEntries(contract.documents.map(d=>[d.path,fs.readFileSync(
 new URL('../'+d.path,import.meta.url),'utf8')]));
const subject=()=>({c:structuredClone(contract),d:{...base},opts:{atlasExact:true,sourceQualified:true}});
const classify=x=>qualifyDocumentSet(x.c,x.d,x.opts);

test('PR-B contract reuses original source, no second runtime authority or false field receipt',()=>{
 assert.equal(contract.authority,0);
 assert.equal(contract.reuse.reticulum,'contracts/cora-reticular-hygiene-v1.json');
 assert.equal(contract.reuse.inventory,'scripts/v5b-repository-governance-audit.mjs');
 assert.equal(contract.documents.length,8);
 assert.equal(new Set(contract.documents.map(x=>x.path)).size,8);
 assert.deepEqual(contract.nodes.map(x=>x.id),['B01','B02','B03','B04','B05','B06','B07','B08']);
 assert.equal(contract.exit_cut.product,'EXTERNAL_OWNER_PROVIDER_HOLDOUT_NOT_IN_PR_B');
 assert(Object.values(contract.protections).every(v=>v===false));
 assert.equal(contract.review.human_decision,'NOT_ATTESTED');
});

test('revised documents have distinct repository, software, product and host proof boundaries',()=>{
 const r=classify(subject());
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.checked_documents,8);assert(r.pr_b_section_links_reopened>=10);
 assert.equal(r.reticular_dod.B08,'BLOCKED_EXTERNAL');
 assert.equal(r.original_reticulum.repo,'BLOCKED_EXTERNAL');
 assert.equal(r.original_reticulum.product,'BLOCKED_EXTERNAL');
 assert.equal(r.product_go,false);assert.equal(r.review_attested,false);
});

test('real generated Markdown atlas stays byte-exact; no parallel documentation registry',()=>{
 const r=verifyAtlas();
 assert.equal(r.atlas_exact,true,JSON.stringify(r));
 assert.equal(r.ok,true);
});

test('semantic negative families fail closed without changing original repository sources',()=>{
 const faults=[
  x=>x.c.authority=1,
  x=>x.c.status='APPROVED',
  x=>x.c.reuse.reticulum='contracts/alternative.json',
  x=>x.c.protections.new_owner=true,
  x=>x.c.result='PRODUCT_GO',
  x=>x.c.documents.pop(),
  x=>x.d['README.md']=x.d['README.md'].replace('<!-- cora-pr-b-docs:v1 -->',''),
  x=>x.d['docs/ARCHITECTURE.md']+='<!-- cora-pr-b-docs:v1 -->',
  x=>x.d['docs/IKANT_LOCAL_SETUP.md']=x.d['docs/IKANT_LOCAL_SETUP.md'].replace(
   'git clone https://github.com/Luke883i/iKant_EDU.git','git clone https://github.com/Luke883i/iKant_LE.git'),
  x=>x.d['docs/IKANT_LOCAL_SETUP.md']+=String.fromCharCode(10)+
    'scrivi esattamente '+String.fromCharCode(96)+'avvia iKant'+String.fromCharCode(96),
  x=>x.d['docs/IKANT_LOCAL_SETUP.md']+='\nhttps://github.com/Luke883i/iKant_LE/archive/old.zip',
  x=>x.d['docs/PRODUCT_POSITIONING.md']=x.d['docs/PRODUCT_POSITIONING.md'].replace('95%','100%'),
  x=>x.d['docs/PRODUCT_POSITIONING.md']=x.d['docs/PRODUCT_POSITIONING.md'].replace('NON ATTESTATO','DIMOSTRATO'),
  x=>x.d['docs/IKANT_DEVELOPMENT_HISTORY.md']=x.d['docs/IKANT_DEVELOPMENT_HISTORY.md'].replace('#218','#999'),
  x=>x.d['docs/GOVERNANCE.md']=x.d['docs/GOVERNANCE.md'].replaceAll('UNKNOWN','ASSENTE'),
  x=>x.d['docs/ARCHITECTURE.md']=x.d['docs/ARCHITECTURE.md'].replaceAll('C87','C00'),
  x=>x.d['README.md']=x.d['README.md'].replace('<!-- cora-pr-b-docs:v1 -->',
   '<!-- cora-pr-b-docs:v1 -->\n[inesistente](docs/FILE_DOES_NOT_EXIST.md)'),
  x=>x.opts.atlasExact=false,
  x=>x.opts.sourceQualified=false
 ];
 for(const [i,f] of faults.entries()){
  const x=subject();f(x);const r=classify(x);
  assert.equal(r.ok,false,'negative '+i+' incorrectly qualified');
  assert.equal(r.product_go,false);
  assert.equal(r.review_attested,false);
 }
});

test('10k seeded semantic fault choices are reproducible, every family rejected',()=>{
 const mutations=[
  x=>x.c.logical_rule='WEIGHTED',
  x=>x.c.unknown='UNKNOWN_IS_PASS',
  x=>x.c.protections.infer_active_from_CI=true,
  x=>x.c.documents[2].required.push('SOMETHING_IMPOSSIBLE'),
  x=>x.c.documents[4].marker='NO_MARKER',
  x=>x.c.documents[0].path=x.c.documents[1].path,
  x=>x.c.exit_cut.source_candidate=[],
  x=>x.d['docs/START_HERE.md']=x.d['docs/START_HERE.md'].replace('<!-- cora-pr-b-docs:v1 -->',''),
  x=>x.d['docs/IKANT_RUNTIME_AND_EVIDENCE.md']=x.d['docs/IKANT_RUNTIME_AND_EVIDENCE.md'].replaceAll('SOURCE_HEAD','OLD_HEAD'),
  x=>x.d['docs/IKANT_LOCAL_SETUP.md']=x.d['docs/IKANT_LOCAL_SETUP.md'].replace('cd iKant_EDU','cd iKant_LE'),
  x=>x.d['docs/PRODUCT_POSITIONING.md']=x.d['docs/PRODUCT_POSITIONING.md'].replace('NON ATTESTATO','PASS'),
  x=>x.opts.sourceQualified=false
 ];
 const run=()=>{
  let seed=20261104>>>0,rejected=0;const covered=new Set(),hash=crypto.createHash('sha256');
  for(let i=0;i<10000;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const index=i<mutations.length?i:seed%mutations.length;covered.add(index);
   const x=subject();mutations[index](x);
   const out=classify(x);assert.equal(out.ok,false,'seeded negative '+i);
   assert.equal(out.authority,0);assert.equal(out.product_go,false);
   rejected++;hash.update(i+':'+index+':'+out.first_edge+';');
  }
  return {rejected,families:covered.size,digest:hash.digest('hex')};
 };
 const a=run(),b=run();assert.deepEqual(a,b);
 assert.equal(a.rejected,10000);assert.equal(a.families,mutations.length);
});

test('real Git-indexed V5-B/CORA readback and documentation qualify on exact checkout',()=>{
 const r=observePrBDocs();
 assert.equal(r.ok,true,JSON.stringify(r.errors||r));
 assert.equal(r.checked_documents,8);
 assert.equal(r.authority,0);
 assert.equal(r.product_go,false);
 assert.equal(r.reticular_dod.B08,'BLOCKED_EXTERNAL');
});
