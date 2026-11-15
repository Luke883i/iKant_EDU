/** Four Priority-0 risk controls: public copy, complexity, evidence, drift. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {selectC132Architecture} from './c132-decision-lattice.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function obj(p){return JSON.parse(read(p))}
export function qualifyC132Zero({publicCopy,productContract,releaseCatalog,architecture}={}){
 const failures=[];
 const contract=productContract||obj('contracts/v1-product-baseline.json');
 const catalog=releaseCatalog||obj('release/catalog.json');
 const prompt=publicCopy||read('README.md');
 const selected=architecture||selectC132Architecture();
 // P0a: beginner-facing copy with a concrete entry and visible limitations.
 for(const phrase of ['Cosa ottieni oggi','Cosa non e','docs/START_HERE.md','docs/PRODUCT_DASHBOARD.md'])
  if(!prompt.includes(phrase))failures.push('P0_PUBLIC_ACCESSIBILITY:'+phrase);
 // P0b: complexity; no competing product entry or autonomous promotion.
 if(catalog.source_of_truth.branch!=='main'||catalog.source_of_truth.pr_is_release_source!==false||
  selected.alternatives_admissible!==1)failures.push('P0_COMPLEXITY_OR_MULTIPLE_OWNERS');
 // P0c: byte integrity vs cognition independently qualified.
 if(contract.external_model_cognitive_uplift_attested!==false||
  contract.canonical_native_active_attested!==false||
  contract.canonical_manual_fallback_installed!==false)failures.push('P0_EVIDENCE_OVERCLAIM');
 // P0d: same declared pre-release status across product and distribution.
 if(contract.product_version!==catalog.product_version||
  contract.release_tier!=='EXPERIMENTAL_EDU_PRE_RELEASE'||
  catalog.publication.candidate_is_official!==false)failures.push('P0_DOC_VERSION_OR_RELEASE_DRIFT');
 return {schema:'ikant-c132-zero-gates/v1',status:failures.length?'FAIL':'PASS',
  checked:4,failures,claim:'STRUCTURAL_PUBLIC_AND_CLAIM_CHECKS_NOT_GLOBAL_UI_POLICING'};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const x=qualifyC132Zero();console.log(JSON.stringify(x));if(x.status!=='PASS')process.exitCode=1;
}
