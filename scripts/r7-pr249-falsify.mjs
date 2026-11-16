import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// Contract-level mutants. Real Git and native tests are separate non-compensatory gates.
export const NAMES = Object.freeze([
 'REAL_MAIN_HEAD_MISMATCH','V13_SOURCE_HEAD_MISSING','SOURCE_TREE_DRIFT','UNREACHABLE_ANCESTRY',
 'EIGHTH_ROOT','ROOT_FILE_EXTRA','ROOT_FILE_MISSING','ROOT_SYMLINK',
 'SOURCE_PATH_LOST','MAPPING_DUPLICATE','FILE_MODE_DRIFT','GOVERNANCE_SOURCE_MUTATED',
 'STATIC_IMPORT_BROKEN','MARKDOWN_TARGET_BROKEN','WORKFLOW_TARGET_STALE','UNKNOWN_CONSUMER_PROMOTED',
 'EDU_OWNER_REPLACED','MCP_OWNER_REPLACED','OWNER_REVIEW_MISSING','CROSS_PRODUCT_AUTHORITY',
 'NATIVE_SUITE_FAIL','CI_SHA_STALE','PRODUCT_SMOKE_MISSING','SKIP_HIDDEN',
 'CORA_REPORT_MISSING','CORA_BLOCKED_MISCLASSIFIED','CORA_REPLAY_UNBOUND','RECEIPT_WRITER_UNTRUSTED',
 'ROLLBACK_UNAVAILABLE','ROOT_MAPPING_NOT_CAUSAL','PROVIDER_EVENT_INVENTED','GLOBAL_GATE_FALSE_PASS'
]);

const HEX40=/^[a-f0-9]{40}$/u;
const MAIN='8cb80d2230919220ac4b7a1cfcd80950d8467848';
const SRC='86e20abb714fa4000352b61a0c0abf8795775318';
const TREE='07f135d6d54ff69b78cc9e7215daa0bdafa9f84c';
const ROOTS=['.github','contracts','host','project','scripts','src','tests'];
const FILES=['.gitignore','ADMISSION.json','AGENTS.md','BOOTSTRAP.json','LICENSE','README.md','TERMS.md','ikant.mjs','package.json'];
function same(a,b){return Array.isArray(a)&&a.length===b.length&&a.every((x,i)=>x===b[i]);}
export function baseline(){return {
 main:MAIN,source:SRC,sourceTree:TREE,mainAncestor:true,roots:[...ROOTS],rootFiles:[...FILES],rootModesValid:true,
 sourceFiles:1630,uniqueDestinations:1630,modeDrift:0,governanceDrift:0,brokenImports:0,brokenLinks:0,staleWorkflows:0,
 unknownConsumers:'UNKNOWN',eduOwner:'ORIGINAL_OWNER',mcpOwner:'ORIGINAL_OWNER',ownerReview:'APPROVED_EXTERNAL',crossAuthority:false,
 native:'PASS',ciSha:TREE,smokes:2,reportedSkips:2,actualSkips:2,
 coraReport:'PRESENT',cora:'PASS',coraReplay:'BOUND_TO_HEAD',receiptWriter:'ORIGINAL',rollback:true,
 causalMap:'VERIFIED',providerEvent:'NOT_ATTESTED',global:false
};}
export function evaluate(x){
 if(x.main!==MAIN)return 'REAL_MAIN_HEAD_MISMATCH';
 if(x.source!==SRC||!HEX40.test(x.source))return 'V13_SOURCE_HEAD_MISSING';
 if(x.sourceTree!==TREE)return 'SOURCE_TREE_DRIFT';
 if(x.mainAncestor!==true)return 'UNREACHABLE_ANCESTRY';
 if(x.roots.length>7||x.roots.some(y=>!ROOTS.includes(y)))return 'EIGHTH_ROOT';
 if(x.rootFiles.length>9||x.rootFiles.some(y=>!FILES.includes(y)))return 'ROOT_FILE_EXTRA';
 if(!same(x.rootFiles,FILES)||!same(x.roots,ROOTS))return 'ROOT_FILE_MISSING';
 if(x.rootModesValid!==true)return 'ROOT_SYMLINK';
 if(x.sourceFiles!==1630)return 'SOURCE_PATH_LOST';
 if(x.uniqueDestinations!==1630)return 'MAPPING_DUPLICATE';
 if(x.modeDrift!==0)return 'FILE_MODE_DRIFT';
 if(x.governanceDrift!==0)return 'GOVERNANCE_SOURCE_MUTATED';
 if(x.brokenImports!==0)return 'STATIC_IMPORT_BROKEN';
 if(x.brokenLinks!==0)return 'MARKDOWN_TARGET_BROKEN';
 if(x.staleWorkflows!==0)return 'WORKFLOW_TARGET_STALE';
 if(x.unknownConsumers!=='UNKNOWN')return 'UNKNOWN_CONSUMER_PROMOTED';
 if(x.eduOwner!=='ORIGINAL_OWNER')return 'EDU_OWNER_REPLACED';
 if(x.mcpOwner!=='ORIGINAL_OWNER')return 'MCP_OWNER_REPLACED';
 if(x.ownerReview!=='APPROVED_EXTERNAL')return 'OWNER_REVIEW_MISSING';
 if(x.crossAuthority!==false)return 'CROSS_PRODUCT_AUTHORITY';
 if(x.native!=='PASS')return 'NATIVE_SUITE_FAIL';
 if(x.ciSha!==TREE)return 'CI_SHA_STALE';
 if(x.smokes!==2)return 'PRODUCT_SMOKE_MISSING';
 if(x.reportedSkips!==x.actualSkips)return 'SKIP_HIDDEN';
 if(x.coraReport!=='PRESENT')return 'CORA_REPORT_MISSING';
 if(x.cora!=='PASS')return 'CORA_BLOCKED_MISCLASSIFIED';
 if(x.coraReplay!=='BOUND_TO_HEAD')return 'CORA_REPLAY_UNBOUND';
 if(x.receiptWriter!=='ORIGINAL')return 'RECEIPT_WRITER_UNTRUSTED';
 if(x.rollback!==true)return 'ROLLBACK_UNAVAILABLE';
 if(x.causalMap!=='VERIFIED')return 'ROOT_MAPPING_NOT_CAUSAL';
 if(x.providerEvent!=='NOT_ATTESTED')return 'PROVIDER_EVENT_INVENTED';
 if(x.global!==false)return 'GLOBAL_GATE_FALSE_PASS';
 return 'SOURCE_MODEL_SATISFIED_NOT_REALWORLD_CERTIFICATION';
}
export function mutate(input,n,variant){
 const x={...input,roots:[...input.roots],rootFiles:[...input.rootFiles]};
 switch(n){
 case 0:x.main='0'.repeat(40);break;
 case 1:x.source='f'.repeat(40);break;
 case 2:x.sourceTree='1'.repeat(40);break;
 case 3:x.mainAncestor=false;break;
 case 4:x.roots.push(['assets','governance','runtime-root'][variant%3]);break;
 case 5:x.rootFiles.push(`CANDIDATE_${variant%1000}.json`);break;
 case 6:x.rootFiles.splice(variant%x.rootFiles.length,1);break;
 case 7:x.rootModesValid=false;break;
 case 8:x.sourceFiles=1629-(variant%2);break;
 case 9:x.uniqueDestinations=1629;break;
 case 10:x.modeDrift=1+variant%9;break;
 case 11:x.governanceDrift=1+variant%50;break;
 case 12:x.brokenImports=1+variant%25;break;
 case 13:x.brokenLinks=1+variant%20;break;
 case 14:x.staleWorkflows=1+variant%116;break;
 case 15:x.unknownConsumers='FALSE_PASS';break;
 case 16:x.eduOwner='HOST_PROXY';break;
 case 17:x.mcpOwner='PROJECT_PROXY';break;
 case 18:x.ownerReview='SELF_ATTESTED';break;
 case 19:x.crossAuthority=true;break;
 case 20:x.native=variant%2?'FAIL':'NOT_RUN';break;
 case 21:x.ciSha='f'.repeat(40);break;
 case 22:x.smokes=variant%2;break;
 case 23:x.reportedSkips=0;break;
 case 24:x.coraReport='MISSING';break;
 case 25:x.cora='DEBT_BLOCKED_EXIT_ZERO';break;
 case 26:x.coraReplay='UNBOUND';break;
 case 27:x.receiptWriter='HOST_INVENTED';break;
 case 28:x.rollback=false;break;
 case 29:x.causalMap='UNQUALIFIED_MOVE';break;
 case 30:x.providerEvent='INVENTED_BY_CI';break;
 case 31:x.global=true;break;
 default:throw Error('CASE_RANGE');
 }
 return x;
}
function next32(z){z^=z<<13;z^=z>>>17;z^=z<<5;return z>>>0;}
export function falsify(count=1_000_000,seed=249202611){
 if(!Number.isSafeInteger(count)||count<1||count>2_000_000)throw Error('CASE_COUNT_INVALID');
 let state=seed>>>0,found=Array(NAMES.length).fill(0),lastNew=-1,killed=0,misses=[],digest=createHash('sha256');
 const pure=baseline();if(evaluate(pure)!=='SOURCE_MODEL_SATISFIED_NOT_REALWORLD_CERTIFICATION')throw Error('BASELINE_ORACLE_INVALID');
 for(let i=0;i<count;i++){
   state=next32(state);const n=state%NAMES.length;
   state=next32(state);const variant=state;
   const observed=evaluate(mutate(pure,n,variant));
   if(observed!==NAMES[n]){if(misses.length<20)misses.push({i,n,expected:NAMES[n],actual:observed});}
   else killed++;
   if(found[n]===0)lastNew=i;
   found[n]++;
   const b=Buffer.allocUnsafe(8);b.writeUInt32LE(n,0);b.writeUInt32LE(observed===NAMES[n]?1:0,4);digest.update(b);
 }
 return {schema:'ikant-r7-pr249-falsification/v1',seed,cases:count,synthetic_not_physical:true,
  mutant_families:NAMES.length,observed_families:found.filter(v=>v>0).length,killed,
  survivors:count-killed,last_new_family_index:lastNew,coverage:found,
  observation_sha256:digest.digest('hex'),misses,pass:misses.length===0&&killed===count&&found.every(n=>n>0),
  authorizations:{owner_review:'NOT_ATTESTED',remote_ci:'NOT_ATTESTED',provider_runtime:'NOT_ATTESTED',product_go:false}};
}
const isCli=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(isCli){
 const arg=name=>{const ix=process.argv.indexOf(name);return ix>=0?process.argv[ix+1]:null;};
 const n=Number(arg('--cases')??1_000_000),seed=Number(arg('--seed')??249202611),dest=arg('--output');
 const a=falsify(n,seed),b=falsify(10000,(seed+1)>>>0);
 const r={...a,post_m_window:{cases:10000,seed:(seed+1)>>>0,novel_families:b.observed_families-a.observed_families,all_known_families_revisited:b.observed_families===NAMES.length},
   global_dod:'HOLD_UNTIL_OWNER_CI_CORA_AND_STATIC_EVIDENCE',product_go:false};
 const out=JSON.stringify(r,null,2)+'\n';if(dest)fs.writeFileSync(dest,out);else process.stdout.write(out);
 if(!a.pass||!r.post_m_window.all_known_families_revisited)process.exitCode=1;
}
