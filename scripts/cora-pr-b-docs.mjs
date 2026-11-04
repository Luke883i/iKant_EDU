#!/usr/bin/env node
/** PR-B: read-only documentation boundary. Not an original owner or review receipt. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verify as verifyAtlas} from './ikant-document-atlas.mjs';
import {observePrABacklog} from './cora-pr-a-backlog.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CONTRACT='contracts/cora-pr-b-documentation-v1.json';
const MARK='<!-- cora-pr-b-docs:v1 -->';
const CHECKS=Object.freeze([
 'SOURCE_DOCUMENT_SET','CURRENT_REPO_ORIENTATION','DOCUMENT_ROLES',
 'PRODUCT_EVIDENCE_BOUNDARY','NON_AUTHORITATIVE_HISTORY','LINKS_AND_ATLAS',
 'V5B_RETICULUM_NOT_REPLACED'
]);
const stop=(edge,errors=[])=>({ok:false,first_edge:edge,errors,
 authority:0,review_attested:false,product_go:false,active:false,
 permission_to_change:false});

/** One falsifiable textual projection, not a validator of reader comprehension. */
export function qualifyDocumentSet(c,docs,{atlasExact=false,sourceQualified=false}={}){
 if(!c||c.schema!=='ikant-cora-pr-b-documentation/v1'||c.authority!==0||
  c.status!=='HOST_ENGINEERING_CANDIDATE'||c.target!=='R_S_D_T_P_G_DOCUMENTATION_COHERENCE_WITHOUT_NEW_OWNER'||
  c.reuse?.reticulum!=='contracts/cora-reticular-hygiene-v1.json'||
  c.reuse?.inventory!=='scripts/v5b-repository-governance-audit.mjs'||
  c.reuse?.document_index!=='scripts/ikant-document-atlas.mjs'||
  c.logical_rule!=='ALL_OF_NOT_WEIGHTED'||c.unknown!=='UNKNOWN_BLOCKS_PRETENSE_NOT_LEARNING'||
  c.result!=='NO_REPOSITORY_OR_PRODUCT_RELEASE_CLAIM'||
  !c.protections||Object.values(c.protections).some(x=>x!==false)||
  !Array.isArray(c.documents)||c.documents.length!==8||
  !Array.isArray(c.nodes)||c.nodes.length!==8||
  !Array.isArray(c.exit_cut?.source_candidate)||c.exit_cut.source_candidate.length!==7)
  return stop('PR_B_CONTRACT_OR_AUTHORITY');
 const expected=new Set(['README.md','docs/START_HERE.md','docs/PRODUCT_POSITIONING.md',
  'docs/ARCHITECTURE.md','docs/IKANT_LOCAL_SETUP.md','docs/GOVERNANCE.md',
  'docs/IKANT_DEVELOPMENT_HISTORY.md','docs/IKANT_RUNTIME_AND_EVIDENCE.md']);
 const observed=new Set();const errors=[];let localLinks=0;
 const roles={'README.md':'ENTRY','docs/START_HERE.md':'PUBLIC_GUIDE',
  'docs/PRODUCT_POSITIONING.md':'PRODUCT_BOUNDARY','docs/ARCHITECTURE.md':'SOFTWARE_BOUNDARY',
  'docs/IKANT_LOCAL_SETUP.md':'EXECUTION_RUNBOOK','docs/GOVERNANCE.md':'AUTHORITY_BOUNDARY',
  'docs/IKANT_DEVELOPMENT_HISTORY.md':'HISTORICAL_LINEAGE',
  'docs/IKANT_RUNTIME_AND_EVIDENCE.md':'EVIDENCE_BOUNDARY'};
 const deps={B01:[],B02:['B01'],B03:['B02'],B04:['B02'],B05:['B02'],
  B06:['B03','B04','B05'],B07:['B06'],B08:['B07']};
 for(const [i,n] of c.nodes.entries()){
  const id='B'+String(i+1).padStart(2,'0');
  if(n?.id!==id||JSON.stringify(n?.needs)!==JSON.stringify(deps[id]))
   errors.push('PR_B_RETICULAR_EDGE_MISMATCH:'+id);
 }
 if(JSON.stringify(c.exit_cut.source_candidate)!==JSON.stringify(Object.keys(deps).slice(0,7))||
    JSON.stringify(c.exit_cut.engineering_complete)!==JSON.stringify(Object.keys(deps))||
    c.exit_cut.product!=='EXTERNAL_OWNER_PROVIDER_HOLDOUT_NOT_IN_PR_B')
  errors.push('PR_B_DOD_EXIT_CUT_DRIFT');
 if(c.review?.human_decision!=='NOT_ATTESTED'||
    c.review?.two_independent_engineers!=='NOT_ATTESTED'||
    c.review?.provider_delivery!=='NOT_ATTESTED')
  errors.push('PR_B_FALSE_EXTERNAL_REVIEW');
 for(const d of c.documents){
  if(!expected.has(d.path)||observed.has(d.path)||d.role!==roles[d.path]||d.marker!==MARK||
     !Array.isArray(d.required)||!d.required.length){
   errors.push('DOCUMENT_CONTRACT_ROW:'+d.path);continue;
  }
  observed.add(d.path);
  const value=docs?.[d.path];
  if(typeof value!=='string'||value.length<100||value.split(MARK).length!==2){
   errors.push('DOC_MISSING_OR_MARKER:'+d.path);continue;
  }
  // Only PR-B's new passage is checked, never claim to prove all historic links.
  const pos=value.indexOf(MARK)+MARK.length;const rest=value.slice(pos);
  const secondHeader=[...rest.matchAll(/^#{2,3} /gm)];
  const part=rest.slice(0,secondHeader.length>=2?secondHeader[1].index:
   secondHeader.length===1&&d.path==='README.md'?secondHeader[0].index:
   secondHeader.length===1&&d.path==='docs/IKANT_LOCAL_SETUP.md'?secondHeader[0].index:rest.length);
  // Scope terminology to this PR-B passage; old historical prose must not mask a regression.
  // The setup clone/turn commands are checked separately across the full runbook.
  const evidenceScope=d.path==='docs/IKANT_LOCAL_SETUP.md'?value:part;
  for(const token of d.required)if(typeof token!=='string'||
      !evidenceScope.toLocaleLowerCase('it').includes(token.toLocaleLowerCase('it')))
   errors.push('DOC_REQUIRED_TOKEN:'+d.path+':'+token);
  for(const m of part.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)){
   const url=m[1];if(/^(?:https?:|mailto:|#)/i.test(url))continue;
   let target;try{target=path.resolve(ROOT,path.dirname(d.path),decodeURIComponent(url))}
   catch{errors.push('LINK_INVALID:'+d.path+':'+url);continue}
   if(!target.startsWith(ROOT+path.sep)||!fs.existsSync(target)){
    errors.push('LINK_MISSING:'+d.path+':'+url);continue;
   }
   localLinks++;
  }
 }
 if(observed.size!==expected.size)errors.push('DOCUMENT_SCOPE_NOT_BIJECTIVE');
 const setup=docs?.['docs/IKANT_LOCAL_SETUP.md']||'';
 if(!setup.includes('git clone https://github.com/Luke883i/iKant_EDU.git')||
   !setup.includes('cd iKant_EDU')||
   /git clone https:\/\/github\.com\/Luke883i\/iKant_LE\.git/.test(setup)||
   /scrivi esattamente \`avvia iKant\`/.test(setup)||
   /https:\/\/github\.com\/Luke883i\/iKant_LE\/archive\//.test(setup))
  errors.push('STALE_INSTALLATION_ROUTING');
 if(!setup.includes('ORIENTATION')||!setup.includes('I ACCEPT')||
    !setup.includes('EDU')||!setup.includes('SOURCE_HEAD'))
  errors.push('CONSENT_OR_SOURCE_BOUNDARY_LOST');
 const product=docs?.['docs/PRODUCT_POSITIONING.md']||'';
 if(!product.includes('95%')||!product.includes('NON ATTESTATO')||
    !product.includes('../contracts/c72-product-value-promise.json'))
  errors.push('PRODUCT_VALUE_FALSLY_PROMOTED');
 const arch=docs?.['docs/ARCHITECTURE.md']||'';
 for(const owner of ['C72','C135','C87','C125','C59'])
  if(!arch.includes(owner))errors.push('OWNER_MISSING:'+owner);
 const history=docs?.['docs/IKANT_DEVELOPMENT_HISTORY.md']||'';
 for(let n=213;n<=218;n++)if(!history.includes('#'+n))errors.push('SOURCE_HISTORY_MISSING:'+n);
 if(!atlasExact)errors.push('GENERATED_MARKDOWN_ATLAS_DRIFT');
 if(!sourceQualified)errors.push('ORIGINAL_V5B_SOURCE_NOT_QUALIFIED');
 if(errors.length)return stop('PR_B_DOCUMENTATION_DOD_OPEN',errors);
 return {ok:true,status:'DOC_SOURCE_CANDIDATE_REQUIRES_INDEPENDENT_REVIEW',
   authority:0,active:false,product_go:false,review_attested:false,
   permission_to_change:false,checked_documents:observed.size,
   pr_b_section_links_reopened:localLinks,passed_local_checks:CHECKS,
   reticular_dod:{B01:'SOURCE_CANDIDATE',B02:'SOURCE_CANDIDATE',B03:'SOURCE_CANDIDATE',
    B04:'SOURCE_CANDIDATE',B05:'SOURCE_CANDIDATE',B06:'SOURCE_CANDIDATE',
    B07:'SOURCE_CANDIDATE_AFTER_TEST',B08:'BLOCKED_EXTERNAL'},
   original_reticulum:{source:'SOURCE_CANDIDATE',repo:'BLOCKED_EXTERNAL',product:'BLOCKED_EXTERNAL'},
   human_review:'NOT_ATTESTED',provider_delivery:'NOT_ATTESTED'};
}
export function observePrBDocs(){
 const c=JSON.parse(fs.readFileSync(path.join(ROOT,CONTRACT),'utf8'));
 const docs=Object.fromEntries(c.documents.map(x=>[x.path,fs.readFileSync(path.join(ROOT,x.path),'utf8')]));
 const original=observePrABacklog();
 if(!original.ok)return stop('PR_B_UPSTREAM_V5B_OR_CORA_NOT_QUALIFIED',[original.first_edge||'UNKNOWN']);
 const atlas=verifyAtlas();
 return qualifyDocumentSet(c,docs,{atlasExact:atlas.atlas_exact===true,sourceQualified:true});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('PR_B_UNKNOWN_ARG');
 const r=observePrBDocs();process.stdout.write(JSON.stringify(r,null,2)+'\n');
 if(!r.ok)process.exitCode=1;
}
