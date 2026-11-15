/** Fail-closed local product contract check: does not issue a release receipt. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(new URL('../package.json',import.meta.url)));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=p=>JSON.parse(read(p));
const catalog=load('release/catalog.json'),v1=load('contracts/v1-product-baseline.json'),pkg=load('package.json');
const failures=[];
const assert=(cond,description)=>{if(!cond)failures.push(description)};
assert(pkg.version===catalog.product_version&&pkg.version===v1.product_version,'product version mismatch');
assert(pkg.version==='1.0.0-edu.1','unexpected version');
assert(v1.release_tier==='EXPERIMENTAL_EDU_PRE_RELEASE','unverified guarantee promotion');
assert(v1.canonical_native_active_attested===false&&v1.external_model_cognitive_uplift_attested===false&&v1.canonical_manual_fallback_installed===false,'false capability claim');
assert(catalog.publication.candidate_is_official===false,'candidate incorrectly official');
assert(catalog.source_of_truth.branch==='main'&&!catalog.source_of_truth.pr_is_release_source,'wrong product provenance');
for(const p of ['README.md',...Object.values(catalog.public_entrypoints),v1.public_home,v1.one_operator_path,v1.evidence_matrix,v1.decisions]){
 assert(!p.startsWith('/')&&!p.split('/').includes('..'),'unsafe public path: '+p);
 try{const f=path.join(root,p);assert(!fs.lstatSync(f).isSymbolicLink()&&fs.statSync(f).isFile(),'bad file '+p)}catch{failures.push('missing public path '+p)}
}
const prompt=read('project/edu-oneshell/PROMPT_INNESCO.txt');
assert(prompt.includes(pkg.version),'prompt and product version drift');
const readme=read('README.md');
for(const word of ['# iKant','Cosa ottieni oggi','C72/v1','CANONICAL','GitHub API only','README.md -> BOOTSTRAP.json','docs/START_HERE.md','docs/V1_E2E_TRACEABILITY.md','release/catalog.json'])
 assert(readme.includes(word),'missing beginner-level README invariant: '+word);
const m=read('docs/V1_E2E_TRACEABILITY.md');
for(let i=1;i<=13;i++)assert(m.includes('V1-'+String(i).padStart(2,'0')),'missing DoD edge '+i);
const tests=fs.readdirSync(path.join(root,'tests')).filter(x=>x.endsWith('.test.mjs'));
assert(tests.length>=90,'unexpected missing regression coverage');
const output={schema:'ikant-le-v1-product-audit/v1',status:failures.length?'FAIL':'PASS',release:'NOT_PUBLISHED',native_active_attested:false,product_version:pkg.version,checked_test_files:tests.length,public_paths:Object.keys(catalog.public_entrypoints).length,failures};
process.stdout.write(JSON.stringify(output)+'\n');
if(failures.length)process.exitCode=1;
