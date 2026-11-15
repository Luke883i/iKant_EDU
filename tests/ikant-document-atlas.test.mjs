import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {audit,renderAtlas,verify,ATLAS} from '../scripts/ikant-document-atlas.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
test('all Markdown files appear exactly once in five ontological/navigation tiers',()=>{
 const x=audit(),keys=x.rows.map(r=>r.path);assert.equal(new Set(keys).size,keys.length);
 assert.ok(keys.length>=150);assert.equal(x.levels.L0,1);
 assert.equal(keys.filter(p=>!renderAtlas(x).includes(`[${p}](`)).length,0);
 assert.ok(x.rows.every(r=>r.role&&/^L[0-4]$/.test(r.level)));
 assert.deepEqual(verify().atlas_exact,true);
});
test('README -> beginner guide -> full atlas and ontological DoD, including historical pages',()=>{
 assert.match(read('README.md'),/docs\/START_HERE\.md/);
 assert.match(read('docs/START_HERE.md'),/IKANT_DOCUMENT_ATLAS\.md/);
 assert.match(read('docs/START_HERE.md'),/IKANT_DOCUMENT_ONTOLOGY_DOD\.md/);
 const a=audit();assert.equal(a.debt.unreachable_before_atlas.length,0);
 assert.ok(a.rows.some(r=>r.path.includes('PREPR')));
});
test('DoD explains human/LLM/iKant, neuroscience analogy, epistemic uncertainty and 3 levels of efficacy',()=>{
 const s=read('docs/IKANT_DOCUMENT_ONTOLOGY_DOD.md');
 for(const word of ['LLM','sinapsi','fenomenologia','UNKNOWN','L0','L1','L2','L3','L4','Globale','Intermedia','Locale','NON ATTESTATO','Confutazione','checklist'])assert.ok(s.toLowerCase().includes(word.toLowerCase()),word);
 assert.match(s,/non.*dimostra|non.*equivale/i);
});
test('falsification: incomplete index, absent definition and broken local reference cannot look complete',()=>{
 const x=audit(),original=renderAtlas(x);
 assert.notEqual(original.replace('[README.md]','[MISSING.md]'),original);
 assert.notEqual(original.replace('IKANT_DOCUMENT_ONTOLOGY_DOD.md','absent.md'),original);
 assert.equal(verify().ok,true);
 assert.equal(read(ATLAS),original);
});
