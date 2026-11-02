import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {audit,verify} from '../scripts/ikant-document-atlas.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const load=p=>fs.readFileSync(path.join(ROOT,p));
const sha=buf=>crypto.createHash('sha1')
 .update(Buffer.from('blob '+buf.length+String.fromCharCode(0)))
 .update(buf).digest('hex');
const plan=JSON.parse(load('contracts/v5b-root-archive-plan.json'));

test('V5-B archive preserves four original Git blobs exactly and removes root aliases',()=>{
 assert.equal(plan.schema,'ikant-v5b-root-archive/v1');
 assert.equal(plan.authority,0);
 assert.equal(plan.decisions.length,4);
 assert.equal(plan.human_approval_attested,false);
 assert.equal(plan.product_release,'PRODUCT_NO_GO');
 for(const row of plan.decisions){
  assert.match(row.old_path,/^(?:README_C(?:94|96|98)_PREPR\.md|C94_BASE_LOCK\.json)$/);
  assert.equal(row.archive_path,'docs/archive/prepr/'+row.old_path);
  assert.equal(fs.existsSync(path.join(ROOT,row.old_path)),false,row.old_path);
  const original=load(row.archive_path);
  assert.equal(original.length,row.bytes,row.archive_path);
  assert.equal(sha(original),row.blob_sha1,row.archive_path);
  assert.equal(row.content_mutation_allowed,false);
 }
 assert.equal(new Set(plan.decisions.map(x=>x.old_path)).size,4);
});
test('generated document atlas remains exact and retains historical documents in L4',()=>{
 const v=verify();
 assert.equal(v.ok,true,JSON.stringify(v));
 assert.equal(v.atlas_exact,true);
 const a=audit();
 for(const row of plan.decisions.filter(x=>x.archive_path.endsWith('.md'))){
  const entry=a.rows.find(x=>x.path===row.archive_path);
  assert.equal(entry?.level,'L4',row.archive_path);
  assert.equal(entry?.role,'Storico',row.archive_path);
  assert.equal(a.rows.some(x=>x.path===row.old_path),false);
 }
 const source=load('docs/C96_GITHUB_TRANSPLANT_PROVENANCE.md').toString('utf8');
 assert.match(source,/\]\(archive\/prepr\/README_C96_PREPR\.md\)/);
 assert.equal(fs.existsSync(path.join(ROOT,'docs/archive/prepr/README_C96_PREPR.md')),true);
});
test('canonical roots and consumers remain unchanged; risky conditional moves are excluded',()=>{
 assert.deepEqual(plan.conditional_not_moved.map(x=>x.path),
  ['iKant_UI_shell.md','render.mcp-prepr.yaml']);
 for(const row of plan.conditional_not_moved){
  assert.equal(row.status,'CONDITIONAL_RETAIN');
  assert.equal(fs.existsSync(path.join(ROOT,row.path)),true,row.path);
  assert.ok(row.blockers.length>=1);
 }
 for(const p of plan.must_remain_root)assert.equal(fs.existsSync(path.join(ROOT,p)),true,p);
 const source=JSON.parse(load('contracts/project-session-source.json'));
 for(const row of plan.decisions)
  assert.equal(source.paths.includes(row.old_path),false,row.old_path);
 assert.equal(source.paths.includes('ikant.mjs'),true);
 assert.equal(source.paths.includes('stile_comunicativo.md'),true);
});
test('archive is a reviewed plan, not a released deletion or native receipt',()=>{
 assert.equal(plan.evidence.git_blob_readback_required,true);
 assert.equal(plan.evidence.atlas_regeneration_exact,true);
 assert.equal(plan.evidence.provider_delivery_attested,false);
 assert.equal(plan.v5b_policy,'REVIEW_REQUIRED_BEFORE_MERGE');
});
