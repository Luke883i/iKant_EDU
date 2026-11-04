import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=JSON.parse(fs.readFileSync(path.join(root,'contracts/v1-workflow-retention.json'),'utf8'));
test('retain every baseline workflow unless a new reviewed migration contract supersedes it',()=>{
 assert.equal(contract.schema,'ikant-le-v1-workflow-retention/v1');
 assert.equal(contract.authority,0);
 assert.equal(contract.policy,'NO_SILENT_WORKFLOW_DELETION');
 assert.equal(contract.require_explicit_review_before_removal,true);
 assert.equal(contract.paths.length,contract.baseline_count);
 assert.equal(new Set(contract.paths).size,contract.paths.length);
 assert.ok(contract.baseline_count>=80);
 const migration=contract.superseded_workflows||{};
 for(const p of Object.keys(migration))assert.ok(contract.paths.includes(p),'unknown supersession: '+p);
 for(const p of contract.paths){
  assert.match(p,/^\.github\/workflows\/[A-Za-z0-9_.-]+\.ya?ml$/);
  const m=migration[p];
  if(m){
   assert.equal(fs.existsSync(path.join(root,p)),false,'retired workflow still active: '+p);
   assert.ok(/^[A-Z][A-Z0-9_]*$/.test(m.status),'missing status: '+p);
   assert.ok(m.reason.length>=60,'no justification: '+p);
   assert.ok(m.replacements.length>=1&&m.tests.length>=1,'migration coverage missing: '+p);
   for(const q of m.replacements){assert.notEqual(p,q);assert.ok(!migration[q]);assert.ok(fs.statSync(path.join(root,q)).isFile());}
   for(const q of m.tests)assert.ok(fs.statSync(path.join(root,q)).isFile(),'preserved test missing: '+q);
  }else{
   const st=fs.lstatSync(path.join(root,p));
   assert.equal(st.isFile()&&!st.isSymbolicLink(),true,'missing unsuperseded workflow: '+p);
  }
 }
});

test('digit-bearing C98 retirement statuses are valid, malformed statuses are not',()=>{
 const pattern=/^[A-Z][A-Z0-9_]*$/;
 for(const good of ['SUBSUMED_C98_BASELINE','SUBSUMED_C98_PHASE2'])assert.equal(pattern.test(good),true);
 for(const bad of ['SUBSUMED-C98_BASELINE','SUBSUMED C98','9SUBSUMED','', 'subsumed_C98'])assert.equal(pattern.test(bad),false);
});
