import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(new URL('../',import.meta.url).pathname);
const contract=JSON.parse(fs.readFileSync(path.join(root,'contracts/c141-runtime-qualification-v2.json'),'utf8'));
const sha=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex');
const originals=JSON.parse(fs.readFileSync(path.join(root,'contracts/c141-semantic-prepr-v1.json'),'utf8'));
const lineage=JSON.parse(fs.readFileSync(path.join(root,'contracts/cora-pr-f-integrated-qualification-v1.json'),'utf8'));
const capsule=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/epochs/c141-prepr-source.json'),'utf8'));
const changes=JSON.parse(fs.readFileSync(path.join(root,'governance/changes/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz-r7-pilot-root-contraction.json'),'utf8'));
const registeredRetirements=new Set(changes.paths.filter(r=>r.operation==='REMOVE').map(r=>r.path));
test('all eleven pre-PR bytes and 48 issue atoms survive identical transfer',()=>{
 assert.equal(Object.keys(contract.prepr_transplant.file_blobs_sha1).length,11);
 for(const [p,h] of Object.entries(contract.prepr_transplant.file_blobs_sha1)){
  const live=fs.existsSync(path.join(root,p));
  if(!live)assert(registeredRetirements.has(p),'unregistered historical cut '+p);
  const archive=capsule.files.find(x=>x.path===p);
  if(!live){assert.ok(archive,'missing source byte capsule '+p);
   assert.equal(capsule.origin.original_before_tree,lineage.source.before_tree);
   assert.equal(archive.git_blob_sha1,h);}
  const bytes=live?fs.readFileSync(path.join(root,p)):Buffer.from(archive.utf8,'utf8');
  if(!live)assert.equal(bytes.length,archive.bytes);
  assert.equal(sha(bytes),h,p);
 }
 assert.equal(originals.atoms.length,48);
 assert.deepEqual(originals.atoms.map(x=>x.id),Array.from({length:48},(_,i)=>'A'+String(i+1).padStart(2,'0')));
});
test('issue coverage is total, disjoint and admits no invented product closure',()=>{
 const c=contract.issue_coverage;const keys=['fixed_bounded_tested','mitigated_not_closed','baseline_preserved_not_newly_fixed','requires_external_proof'];
 const ids=keys.flatMap(k=>c[k]);assert.equal(ids.length,48);assert.equal(new Set(ids).size,48);
 assert.ok(c.provider_only_unavailable_to_host.every(id=>c.requires_external_proof.includes(id)));
 assert.equal(contract.active,false);assert.equal(contract.runtime_path.no_native_identity,true);
 assert.equal(contract.runtime_path.no_cross_chat_persistence,true);
 assert.equal(contract.runtime_path.semantic_truth_attested,false);
});
test('owner chain is qualified only as software, not a native delivery proof',()=>{
 const s=fs.readFileSync(path.join(root,'host/c135-edu-v2-owner.mjs'),'utf8');
 assert.match(s,/c141\.arbitrateC141/);assert.match(s,/C141_EXACT_INPUT_REQUIRES_BUDGET_NEGOTIATION/);
 assert.match(s,/c141EpistemicDisclosure/);
 assert.equal(contract.readiness,'DRAFT_NOT_MERGED');assert.equal(contract.status,'SOFTWARE_CANDIDATE_PRODUCT_NO_GO');
 assert.equal(contract.approved_source_epoch.new_c72_admission_attested,false);
});
