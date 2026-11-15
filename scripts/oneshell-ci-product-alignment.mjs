/** A checked CI boundary is not a real ChatGPT product release. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
export const ROOT=path.resolve(HERE,'..');
const TYPES=['EXTERNAL','PROMPT_ONLY','RUNTIME','RUNTIME_PARTIAL','UNIMPLEMENTED'];
const REGISTRY_SHA256='f71908dfdfae004d6772569e2195791b0dfab3c7d62c22446e543e03221fd8e2';
function csvRows(src){
 const all=[];let row=[],field='',quoted=false;
 for(let i=0;i<src.length;i++){const c=src[i];
  if(c==='"'){if(quoted&&src[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(field);field='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&src[i+1]==='\n')i++;row.push(field);if(row.some(Boolean))all.push(row);row=[];field='';}
  else field+=c;
 }
 if(quoted)throw Error('UNTERMINATED_SOURCE_CSV');
 if(field||row.length){row.push(field);all.push(row);}return all;
}
export function inspectProductCi({registry,workflow,root=ROOT,slideVersion=null,sourceCsv=null}={}){
 const failures=[];
 if(!registry||registry.schema!=='ikant-oneshell-product-ci-alignment/v1'||registry.authority!==0||
   registry.candidate_ci_is_not_product_release!==true||registry.external_witness_owner_only!==true||
   !Array.isArray(registry.issues)||registry.issues.length!==40)
   return {ok:false,first_edge:'REGISTRY_SCHEMA_OR_SIZE_DRIFT',failures:['REGISTRY_SCHEMA_OR_SIZE_DRIFT'],product_ready:false};
 const ids=new Set(),problems=new Set();
 let canonical=[];
 try{
  const text=sourceCsv??fs.readFileSync(path.join(root,'docs/ONESHell_HOST_40_ISSUES.csv'),'utf8');
  if(createHash('sha256').update(text).digest('hex')!==REGISTRY_SHA256)failures.push('CANONICAL_AUDIT_SOURCE_DRIFT');
  const rows=csvRows(text),expected=['id','priority','problem','session_signal','existing_attempt','fix','falsification'];
  if(rows.length!==41||JSON.stringify(rows[0])!==JSON.stringify(expected))failures.push('CANONICAL_CSV_SCHEMA_OR_SIZE');
  else canonical=rows.slice(1);
 }catch{failures.push('CANONICAL_CSV_UNREADABLE');}
 const invoked=workflow.split('\n').filter(line=>/^\s+(?:node --test|PYTHONDONTWRITEBYTECODE=1 python3 |python3 )/.test(line)&&
   !line.trimStart().startsWith('#')).join('\n');
 for(let i=0;i<40;i++){
  const x=registry.issues[i],id='UX'+String(i+1).padStart(2,'0');
  if(!x||x.id!==id||ids.has(x.id)||typeof x.problem!=='string'||x.problem.length<12||problems.has(x.problem)){
   failures.push('UNMAPPED_OR_DUPLICATE_PROBLEM:'+id);continue;
  }
  ids.add(x.id);problems.add(x.problem);
  const row=canonical[i];
  if(!row||row.length!==7||row[0]!==id||row[2]!==x.problem||row[5]!==x.expected_behavior||row[6]!==x.negative_case)
   failures.push('PRODUCT_REQUIREMENT_DIFFERENT_FROM_AUDIT:'+id);
  if(typeof x.expected_behavior!=='string'||x.expected_behavior.length<18||
    typeof x.negative_case!=='string'||x.negative_case.length<18||
    x.reference!=='docs/ONESHell_HOST_40_ISSUES.csv') failures.push('UNTRACEABLE_REQUIREMENT:'+id);
  if(!TYPES.includes(x.ci_scope)||!/^tests\/[A-Za-z0-9_.-]+\.(?:mjs|py)$/.test(x.local_test)||
    !fs.existsSync(path.join(root,x.local_test))) failures.push('NO_LOCAL_WITNESS:'+id);
  if(x.product_closed!==false||x.product_witness!==null)failures.push('FAKE_PRODUCT_CLOSURE:'+id);
  if(typeof x.local_test==='string'&&!invoked.includes(x.local_test))
   failures.push('TEST_NOT_EXECUTED_IN_PRODUCT_CI:'+id);
 }
 if(!Array.isArray(registry.required_external_witnesses)||registry.required_external_witnesses.length<6||
    new Set(registry.required_external_witnesses).size!==registry.required_external_witnesses.length)
    failures.push('EXTERNAL_PROOF_GATES_MISSING');
 for(const x of ['scripts/p2-build-oneshell-release.py','scripts/oneshell-ci-product-alignment.mjs',
   'tests/oneshell-ci-product-alignment.test.mjs','tests/host-handoff-rehydrate.test.py',
   'tests/s02-edu-v2-original-owner-e2e.test.mjs'])
  if(!workflow.includes(x))failures.push('CI_RUNTIME_LINK_MISSING:'+x);
 for(const x of ['build --out','verify --out','cmp ','candidate-only'])
  if(!workflow.includes(x))failures.push('CI_RELEASE_SEMANTIC_MISSING:'+x);
 const v=slideVersion??fs.readFileSync(path.join(root,'project/oneshell-v7/00_README.md'),'utf8')+
  fs.readFileSync(path.join(root,'project/oneshell-v7/03_SLIDES.md'),'utf8');
 if(/OneShell V6|OneShell — V6/.test(v)||!/OneShell V7/.test(v))failures.push('V7_DOCUMENTATION_DRIFT');
 return Object.freeze({schema:'ikant-oneshell-product-ci-witness/v1',ok:failures.length===0,
  mapped_issues:ids.size,local_test_links:registry.issues.length,
  locally_proven_product_issues:0,external_witness_count:0,
  software_candidate_status:failures.length===0?'CANDIDATE_QUALIFIED':'BLOCKED',
  product_status:'PRODUCT_NO_GO_EXTERNAL_WITNESSES_MISSING',product_ready:false,product_release_authorized:false,
  first_edge:failures[0]??'NATIVE_CHATGPT_UI_REAL_USER',failures});
}
export function evaluateCurrentProductCi(){
 return inspectProductCi({registry:JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/oneshell-40-product-ci.json'),'utf8')),
 workflow:fs.readFileSync(path.join(ROOT,'.github/workflows/p1-p7-oneshell-release.yml'),'utf8')});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const x=evaluateCurrentProductCi();
 process.stdout.write(process.argv[2]==='--json'?JSON.stringify(x,null,2)+'\n':
  'PRODUCT CI: '+x.software_candidate_status+'; ISSUES: '+x.mapped_issues+'/40; PRODUCT: '+x.product_status+'\n');
 if(!x.ok)process.exitCode=1;
}