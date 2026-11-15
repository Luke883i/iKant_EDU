/** Exhaustive Git file census; tracked does not mean semantically reviewed. */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function roleFor(p){
 if(['AGENTS.md','TERMS.md','BOOTSTRAP.json','ADMISSION.json'].includes(p))return 'FIRST_CONTACT';
 if(p==='README.md'||p==='package.json'||p.startsWith('release/')||p.startsWith('project/edu-oneshell/'))return 'PRODUCT_DISTRIBUTION';
 if(p.startsWith('src/runtime-')||p.startsWith('src/session-local-')||p.startsWith('contracts/session-chat-'))return 'CANONICAL_RUNTIME';
 if(p.startsWith('host/edu-')||p.startsWith('host/c1')||p.startsWith('src/c7')||p.startsWith('src/c8'))return 'EXPERIMENTAL_RUNTIME_OR_COMPAT';
 if(p.startsWith('tests/')||p.startsWith('.github/')||p.startsWith('scripts/'))return 'VERIFICATION_OR_TOOL';
 if(p.startsWith('contracts/'))return 'CONTRACT_OR_HISTORICAL';
 if(p.startsWith('docs/'))return 'DOC_OR_HISTORICAL';
 if(p.startsWith('artifacts/'))return 'EVIDENCE_SNAPSHOT';
 return 'REVIEW_REQUIRED';
}
export function censusGold({cwd=root}={}){
 const contract=JSON.parse(fs.readFileSync(path.join(cwd,'contracts/v1-gold-ownership.json'),'utf8'));
 if(contract.schema!=='ikant-le-v1-gold-ownership/v1'||contract.authority!==0)throw Error('gold contract invalid');
 const head=execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim();
 const raw=execFileSync('git',['ls-tree','-r','-z','HEAD'],{cwd,encoding:'buffer'}).toString('utf8');
 const paths=new Map();
 for(const record of raw.split('\0')){
  if(!record)continue;
  const m=/^([0-7]{6}) blob ([a-f0-9]{40})\t(.+)$/s.exec(record);
  if(!m)continue;
  if(paths.has(m[3]))throw Error('duplicate git path');
  paths.set(m[3],{git_blob_sha1:m[2],role:roleFor(m[3])});
 }
 const curated=new Map();
 for(const item of contract.gold){
  if(curated.has(item.path)||!paths.has(item.path)||!contract.dispositions[item.decision])throw Error('missing or invalid gold path: '+item.path);
  curated.set(item.path,item);
 }
 const members=[...paths].sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0).map(([p,data])=>({path:p,...data,disposition:curated.get(p)?.decision||'NOT_CURATED',reviewed_for_value:curated.has(p)}));
 const category_counts={};for(const e of members)category_counts[e.role]=(category_counts[e.role]||0)+1;
 return {schema:'ikant-le-v1-gold-census/v1',authority:0,head,tracked_files:members.length,
  curated_gold:curated.size,unreviewed_files:members.length-curated.size,
  claim:'GIT_FILE_CENSUS_NOT_INDEPENDENT_SEMANTIC_VALUE_REVIEW',category_counts,members};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.stdout.write(JSON.stringify(censusGold())+'\n');}catch(e){console.error(e.message);process.exitCode=1;}
}
