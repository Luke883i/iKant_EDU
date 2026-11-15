import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {selectContracts,verifyReadme,falsifyReadme} from '../scripts/readme-contract-select.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');

test('100 deterministic editorial contracts, scoped winner, no empirical claim',()=>{
 const a=selectContracts(),b=selectContracts();
 assert.deepEqual(a,b);
 assert.equal(a.count,100);
 assert.equal(new Set(a.candidates.map(x=>x.id)).size,100);
 assert.equal(a.winner.id,'DOC001');
 assert.equal(a.winner.score,100);
 assert.equal(a.rubric.empirical_study,false);
 assert.ok(a.candidates.some(x=>!x.eligible));
});
test('README human-first route and local links, all original owners untouched',()=>{
 assert.deepEqual(verifyReadme(readme,root),{ok:true,errors:[]});
 for(const p of ['docs/IKANT_RUNTIME_AND_EVIDENCE.md','docs/IKANT_RESEARCH_QUESTIONS.md','docs/IKANT_LOCAL_SETUP.md'])
   assert.ok(fs.statSync(path.join(root,p)).size>1000);
});
test('100 altered semantic anchors fail closed, never accepted as original contract',()=>{
 const v=falsifyReadme(readme,root);
 assert.equal(v.count,100);
 assert.equal(v.rejected,100);
 assert.equal(v.accepted,0);
 assert.equal(v.unique_mutated_texts,100);
});
test('semantic deletion handles repeated required anchors in a standalone README',()=>{
 const redundant=readme+'\n\ninfrastruttura cognitiva verificabile\nUmano:\nLLM:\niKant:\nHOST:\nRQ1\n';
 const v=falsifyReadme(redundant,root);
 assert.equal(v.count,100);
 assert.equal(v.rejected,100);
 assert.equal(v.accepted,0);
});
test('false ACTIVE and imaginary consciousness are rejected',()=>{
 assert.equal(verifyReadme(readme+'\nMCP connesso implica ACTIVE',root).ok,false);
 assert.equal(verifyReadme(readme+'\nè una coscienza dimostrata',root).ok,false);
});
test('relative doc links must exist, and no silent experimental-v2 conflation',()=>{
 assert.equal(verifyReadme(readme+'\n[rottura](docs/NOT_AN_ACTUAL_FILE.md)',root).ok,false);
 assert.ok(readme.includes('C72/v1'));
 assert.ok(readme.includes('C72/v2'));
});
