import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(new URL('../package.json',import.meta.url)));
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(text(p));
test('one V1 experimental version across packaging, governance, README',()=>{
 const pkg=json('package.json'),catalog=json('release/catalog.json'),v=json('contracts/v1-product-baseline.json');
 assert.equal(pkg.version,'1.0.0-edu.1');assert.equal(pkg.version,catalog.product_version);assert.equal(pkg.version,v.product_version);
 assert.equal(v.source_of_truth,'COMMIT_ON_MAIN_AFTER_MERGE_AND_SEPARATE_RELEASE');
 assert.equal(v.canonical_native_active_attested,false);assert.equal(v.external_model_cognitive_uplift_attested,false);
 assert.equal(v.canonical_manual_fallback_installed,false);assert.equal(catalog.publication.candidate_is_official,false);
 assert.equal(v.historical_prs_are_release_sources,false);assert.equal(v.editions_are_separate_products,false);
 assert.ok(text('project/edu-oneshell/PROMPT_INNESCO.txt').includes(pkg.version));
});
test('README invites a beginner first then gives exact technical provenance',()=>{
 const r=text('README.md');assert.match(r,/# iKant.*risposte guidate/u);
 for(const x of ['Cosa ottieni oggi','Cosa non e','docs/START_HERE.md','docs/PRODUCT_DASHBOARD.md','docs/V1_PRODUCT_DECISIONS.md','docs/V1_E2E_TRACEABILITY.md','TERMS.md','npm test','npm run check'])assert.ok(r.includes(x),x);
 assert.ok(!r.includes('CANONICAL ACTIVE ottenuto'), 'unproven claim');
 // Full standalone root README explicitly approved by the human owner.
 // The former <4300 byte shortcut has been replaced by a bounded content DoD:
 // no unlimited prose, no source/authority promotion, and all four pillars.
 const rootBytes=Buffer.byteLength(r,'utf8');
 assert.ok(rootBytes>=16000&&rootBytes<=48000, 'README complete but bounded product/architecture envelope');
 for(const required of [
  'natura, ratio e utilità', 'Cosa non e', 'infrastruttura cognitiva verificabile',
  '## Modalità e bootstrap', '## Tre domande di ricerca',
  '## Metodo end-to-end, sviluppo e lettori', 'Node.js **20+**',
  'C4', 'C5', 'C8/C11', 'neuroni', 'sinapsi', 'UNKNOWN',
  'C87', 'C125', 'docs/IKANT_COGNITIVE_SUBSTRATE.md',
  'docs/IKANT_DEVELOPMENT_HISTORY.md', 'docs/IKANT_SEMANTIC_RETICULUM.md'
 ])assert.ok(r.includes(required),'standalone DoD missing '+required);
 assert.match(r,/<details>[\s\S]*<summary>[\s\S]*<\/details>/);
 assert.ok(!r.includes('CANONICAL ACTIVE ottenuto'),'no unproven native activation');
});
test('documentation links and declared local witnesses exist, but proofs are graded',()=>{
 for(const f of ['docs/V1_PRODUCT_DECISIONS.md','docs/V1_E2E_TRACEABILITY.md','docs/START_HERE.md','release/catalog.json','contracts/v1-product-baseline.json'])assert.ok(fs.statSync(path.join(root,f)).isFile(),f);
 const map=text('docs/V1_E2E_TRACEABILITY.md');for(let i=1;i<=13;i++)assert.ok(map.includes('V1-'+String(i).padStart(2,'0')));
 assert.match(map,/NON DIMOSTRATO/);assert.match(map,/NON INSTALLATO/);
});
test('runtime semantic kernel version may differ from distribution version but is explicit',()=>{
 const kernel=json('contracts/ikant-le.json');const v=json('contracts/v1-product-baseline.json');
 assert.equal(kernel.version,'0.9.0');assert.equal(v.runtime_contract_version,kernel.version);
});
test('auditor is read-only, refuses to mint a release and finds same public paths',()=>{
 const r=JSON.parse(execFileSync(process.execPath,['scripts/v1-product-audit.mjs'],{cwd:root,encoding:'utf8'}));
 assert.equal(r.status,'PASS');assert.equal(r.release,'NOT_PUBLISHED');assert.equal(r.native_active_attested,false);
 assert.ok(r.checked_test_files>=90);
});
