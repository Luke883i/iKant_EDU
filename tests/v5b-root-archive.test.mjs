import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {HISTORIC,reopenR7SourceEpoch} from '../scripts/r7-v13-epoch-bridge.mjs';
import {audit,verify} from '../scripts/ikant-document-atlas.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const load=p=>fs.readFileSync(path.join(ROOT,p));
const sha=buf=>crypto.createHash('sha1')
 .update(Buffer.from('blob '+buf.length+String.fromCharCode(0)))
 .update(buf).digest('hex');
const plan=JSON.parse(load('contracts/v5b-root-archive-plan.json'));
const show=(ref,p)=>execFileSync('git',['show',ref+':'+p],{cwd:ROOT});
const relinks={
 'README_C96_PREPR.md':[
  ['docs/C96_AUDIT_REPORT.md','project/docs/C96_AUDIT_REPORT.md']],
 'README_C98_PREPR.md':[
  ['docs/C98_REVERSE_DOD_AND_GAP_MATRIX.md','project/docs/C98_REVERSE_DOD_AND_GAP_MATRIX.md'],
  ['docs/C98_MATURATION_H95_AND_CLOSURE.md','project/docs/C98_MATURATION_H95_AND_CLOSURE.md'],
  ['project-baseline/PROJECT_PROMPT.txt','project/baseline/PROJECT_PROMPT.txt'],
  ['project-baseline/PROJECT_FILES/','project/baseline/PROJECT_FILES/'],
  ['project-baseline/INSTALL_EASY.md','project/baseline/INSTALL_EASY.md']]
};


test('V5-B archive preserves four original Git blobs exactly and removes root aliases',()=>{
 assert.equal(plan.schema,'ikant-v5b-root-archive/v1');
 assert.equal(plan.authority,0);
 assert.equal(plan.decisions.length,4);
 assert.equal(plan.human_approval_attested,false);
 assert.equal(plan.product_release,'PRODUCT_NO_GO');
 for(const row of plan.decisions){
  assert.match(row.old_path,/^(?:README_C(?:94|96|98)_PREPR\.md|C94_BASE_LOCK\.json)$/);
  assert.equal(row.archive_path,'project/docs/archive/prepr/'+row.old_path);
  assert.equal(fs.existsSync(path.join(ROOT,row.old_path)),false,row.old_path);
  const old='docs/archive/prepr/'+row.old_path;
  const historical=show(HISTORIC,old);
  assert.equal(historical.length,row.bytes,old);
  assert.equal(sha(historical),row.blob_sha1,old);
  const x=reopenR7SourceEpoch(old);
  assert.equal(x.ok,true,JSON.stringify(x));
  assert.equal(x.current_path,row.archive_path);assert.equal(x.historical_blob,row.blob_sha1);
  const current=load(row.archive_path);
  const before=historical.toString('utf8');
  const expected=(relinks[row.old_path]||[]).reduce((text,[a,b])=>{
    assert(text.includes(a),'ORIGINAL_REBIND_NOT_PRESENT:'+a);
    return text.replaceAll(a,b);
  },before);
  // Two historical prose files had only exact documented path rebinds.
  // This does NOT change their historical pins or imply a human review.
  assert.equal(current.toString('utf8'),expected,row.archive_path);
  assert.equal(x.byte_identical,(relinks[row.old_path]||[]).length===0);
  if(!x.byte_identical)assert.equal(x.approval,'NOT_ATTESTED');
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
 const source=load('project/docs/C96_GITHUB_TRANSPLANT_PROVENANCE.md').toString('utf8');
 assert.match(source,/\]\(archive\/prepr\/README_C96_PREPR\.md\)/);
 assert.equal(fs.existsSync(path.join(ROOT,'project/docs/archive/prepr/README_C96_PREPR.md')),true);
});
test('canonical roots and consumers remain unchanged; risky conditional moves are excluded',()=>{
 assert.deepEqual(plan.conditional_not_moved.map(x=>x.path),
  ['project/docs/iKant_UI_shell.md','render.mcp-prepr.yaml']);
 const successor=JSON.parse(load('contracts/pr3-repository-contraction.v1.json'));
 assert.equal(successor.schema,'ikant-pr3-repository-contraction/v1');
 assert.equal(successor.original_main,'36646712e5f27fef337784e1a00b3849dfb38b48');
 for(const row of plan.conditional_not_moved){
  // Historical HOLD remains original evidence. A later PR3 source epoch must
  // qualify the only permitted physical cut without rewriting that decision.
  assert.equal(row.status,'CONDITIONAL_RETAIN');
  assert.ok(row.blockers.length>=1);
  if(row.path===successor.cut.source){
   assert.equal(fs.existsSync(path.join(ROOT,row.path)),false,row.path);
   const archive=load(successor.cut.destination);
   assert.equal(archive.length,successor.cut.bytes);
   assert.equal(sha(archive),successor.cut.git_blob_sha1);
   // PR3 was previously performed in V10: original root alias is gone, and
   // V13 only transports the exact historical archive blob into project/docs.
   const old='docs/archive/prepr/render.mcp-prepr.yaml';
   const mapped=reopenR7SourceEpoch(old);
   assert.equal(mapped.ok,true);assert.equal(mapped.byte_identical,true);
   assert.equal(mapped.historical_blob,successor.cut.git_blob_sha1);
   assert.equal(mapped.current_path,successor.cut.destination);
   assert.equal(successor.cut.content_mutation_allowed,false);
   assert.equal(successor.external_manual_render_config,'UNKNOWN_REQUIRES_OPERATOR_REVIEW');
  }else{
   const mapped=reopenR7SourceEpoch('iKant_UI_shell.md');
   assert.equal(mapped.ok,true);assert.equal(mapped.current_path,row.path);
   assert.equal(mapped.approval,'NOT_ATTESTED');
   assert.equal(fs.existsSync(path.join(ROOT,row.path)),true,row.path);
  }
 }
 // V5-B roots are frozen at their original epoch. The seven-root candidate
 // preserves the mapped content with exact SHA/mode or declares review debt.
 const original=JSON.parse(show(HISTORIC,'contracts/v5b-root-archive-plan.json').toString('utf8'));
 assert.deepEqual(original.must_remain_root,plan.must_remain_root);
 for(const p of plan.must_remain_root){
  const historicalPath=p.startsWith('project/docs/')?'docs/'+p.slice('project/docs/'.length):
   p.startsWith('project/release/')?p.slice('project/release/'.length):
   p.startsWith('contracts/C12_')||p.startsWith('contracts/C13_')?p.slice('contracts/'.length):p;
  const witness=reopenR7SourceEpoch(historicalPath);
  assert.equal(witness.ok,true,historicalPath);
  assert.equal(witness.current_path,p,historicalPath);
  assert.equal(fs.existsSync(path.join(ROOT,p)),true,p);
  assert.equal(witness.approval,'NOT_ATTESTED');
 }
 const source=JSON.parse(load('contracts/project-session-source.json'));
 for(const row of plan.decisions)
  assert.equal(source.paths.includes(row.old_path),false,row.old_path);
 assert.equal(source.paths.includes('ikant.mjs'),true);
 assert.equal(source.paths.includes('project/docs/stile_comunicativo.md'),true);
});
test('archive is a reviewed plan, not a released deletion or native receipt',()=>{
 assert.equal(plan.evidence.git_blob_readback_required,true);
 assert.equal(plan.evidence.atlas_regeneration_exact,true);
 assert.equal(plan.evidence.provider_delivery_attested,false);
 assert.equal(plan.v5b_policy,'REVIEW_REQUIRED_BEFORE_MERGE');
});
