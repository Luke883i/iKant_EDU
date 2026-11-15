#!/usr/bin/env node
/** V10: a narrow, original-owner-preserving source maintenance gate.
 * Not a runtime, a new owner, a CI attestation or a product release gate.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {censusRepo} from './project-review-callsites.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SPEC=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/repository-health-v10.json'),'utf8'));
const IDs=Object.freeze(['P','I','O','Q','L','R']);
const patterns=Object.freeze([
 ['from',/\bfrom\s*['"]([.]{1,2}\/[^'"]+)['"]/gu],
 ['side',/\bimport\s*['"]([.]{1,2}\/[^'"]+)['"]/gu],
 ['dynamic',/\bimport\s*\(\s*['"]([.]{1,2}\/[^'"]+)['"]\s*\)/gu],
 ['require',/\brequire\s*\(\s*['"]([.]{1,2}\/[^'"]+)['"]\s*\)/gu],
 ['url',/\bnew\s+URL\s*\(\s*['"]([.]{1,2}\/[^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/gu]
]);
const TRUSTED_BASELINE_TREE='4cff62ed12f79390a059784bcbf9770788a3a4d1';
const LEGACY_LEDGER_SHA256='e78fc3a665ee926b69abcfb9d97301fa294e5ae3a6f75b876729a80caad27c28';
const REQUIRED_OWNER_PATHS=Object.freeze([
 'host/c72-public-mode-admission.mjs','host/c135-edu-v2-owner.mjs',
 'host/c87-durable-ledger.mjs','host/c125-output-port.mjs',
 'src/session-shell.mjs','plugins/ikant-le-session-chat/server/server.mjs',
 'plugins/ikant-le-session-chat/plugin.json','project/session-chat/PROMPT.txt',
 'BOOTSTRAP.json'
]);
const h40=/^[a-f0-9]{40}$/u;
const digest=b=>createHash('sha256').update(b).digest('hex');
const blobSha=b=>createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
const git=(...args)=>{
 const p=spawnSync('git',args,{cwd:ROOT,encoding:'buffer',timeout:35000,maxBuffer:32*1024*1024});
 if(p.error||p.status!==0)throw Error('GIT_COMMAND_FAILED:'+args.slice(0,2).join(':'));
 return p.stdout;
};
function tracked(){
 const raw=git('ls-files','--stage','-z').toString('utf8');
 const out=[];
 for(const row of raw.split('\0').filter(Boolean)){
  const m=/^([0-7]{6}) ([a-f0-9]{40}) 0\t(.+)$/u.exec(row);
  if(!m)throw Error('GIT_STAGE_NOT_ZERO');
  out.push({mode:m[1],sha:m[2],path:m[3]});
 }
 return out;
}
export function inspectGitContent(rows=tracked()){
 const tree=git('ls-tree','-r','-z','HEAD').toString('utf8').split('\0').filter(Boolean);
 const table=new Map();
 for(const t of tree){
  const m=/^([0-7]{6}) blob ([a-f0-9]{40})\t(.+)$/u.exec(t);
  if(!m)throw Error('GIT_UNEXPECTED_TREE_ENTRY');
  if(table.has(m[3]))throw Error('GIT_DUPLICATE_TREE_PATH');
  table.set(m[3],{mode:m[1],sha:m[2]});
 }
 const errors=[];
 if(table.size!==rows.length)errors.push('INDEX_TREE_COUNT_MISMATCH');
 let bytes=0;
 for(const r of rows){
  const t=table.get(r.path);
  if(!t||r.mode!==t.mode||r.sha!==t.sha){errors.push('INDEX_TREE_DRIFT:'+r.path);continue;}
  const full=path.join(ROOT,r.path),st=fs.lstatSync(full);
  if(!st.isFile()||st.isSymbolicLink()){errors.push('UNSAFE_SOURCE_FILE:'+r.path);continue;}
  const data=fs.readFileSync(full);bytes+=data.length;
  if(blobSha(data)!==r.sha)errors.push('CONTENT_BLOB_MISMATCH:'+r.path);
 }
 return {ok:errors.length===0,errors,tracked:rows.length,bytes,
   head:git('rev-parse','HEAD').toString('utf8').trim(),
   tree:git('rev-parse','HEAD^{tree}').toString('utf8').trim()};
}
export function scanLiteralRelative(root,paths){
 const edges=[];
 for(const p of paths){
  if(!/\.(?:mjs|cjs|js|ts|mts)$/u.test(p))continue;
  const source=fs.readFileSync(path.join(root,p));
  const text=source.toString('utf8'),source_blob=blobSha(source);
  for(const [kind,rx] of patterns){
   rx.lastIndex=0;
   for(const m of text.matchAll(rx)){
    const specifier=m[1];
    const target=path.resolve(root,path.dirname(p),specifier.split('?')[0].split('#')[0]);
    const inside=target.startsWith(root+path.sep)||target===root;
    const valid=inside&&fs.existsSync(target);
    edges.push({source:p,source_blob,kind,specifier,valid});
   }
  }
 }
 return edges;
}
const edgeKey=x=>JSON.stringify([x.source,x.source_blob,x.kind,x.specifier]);
export function newUnresolved(edges,baseline){
 const allowed=new Map();
 for(const x of baseline){const k=edgeKey(x);allowed.set(k,(allowed.get(k)||0)+1);}
 const unexpected=[];
 for(const e of edges){if(e.valid)continue;const k=edgeKey(e),n=allowed.get(k)||0;
  if(n>0)allowed.set(k,n-1);else unexpected.push(e);
 }
 return unexpected;
}
export function validateSourceContract(c){
 const ownerKeys=Object.keys(c?.protected_owner_blobs||{});
 return c?.schema==='ikant-v10-repository-health-minimal/v1'&&
  c?.baseline_tree===TRUSTED_BASELINE_TREE&&
  c?.baseline_main==='8cb80d2230919220ac4b7a1cfcd80950d8467848'&&
  c?.normative_scope==='SOURCE_MAINTENANCE_ONLY_NOT_PRODUCT_GO'&&
  c?.authority===0&&c?.product_go===false&&
  c?.baseline_tracked_files===1626&&c?.existing_roots===15&&
  c?.inherited_unresolved_count===32&&
  Array.isArray(c?.inherited_unresolved_lexical_edges)&&
  c.inherited_unresolved_lexical_edges.length===32&&
  digest(JSON.stringify(c.inherited_unresolved_lexical_edges))===LEGACY_LEDGER_SHA256&&
  JSON.stringify(ownerKeys)===JSON.stringify(REQUIRED_OWNER_PATHS)&&
  REQUIRED_OWNER_PATHS.every(p=>h40.test(c.protected_owner_blobs[p]));
}
function ownerCheck(rows){
 const indexed=new Map(rows.map(x=>[x.path,x.sha]));
 const changed=[];
 for(const p of REQUIRED_OWNER_PATHS){
  let expected=null;
  try{expected=git('rev-parse',TRUSTED_BASELINE_TREE+':'+p).toString('utf8').trim();}catch{}
  if(!h40.test(expected)||indexed.get(p)!==expected||SPEC.protected_owner_blobs[p]!==expected)changed.push(p);
 }
 return {ok:changed.length===0,protected_count:REQUIRED_OWNER_PATHS.length,changed};
}
function legibility(){
 const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
 const a=read('README.md'),d=read('docs/REPOSITORY_HEALTH_V10.md'),pkg=JSON.parse(read('package.json'));
 const missing=[];
 if(!a.includes('docs/REPOSITORY_HEALTH_V10.md'))missing.push('README_LINK');
 for(const key of ['PROJECT EDU','MCP STANDALONE','ROLLBACK','UNKNOWN','HEALTH COMMAND'])if(!d.includes(key))missing.push('GUIDE:'+key);
 if(pkg.scripts['maintain:verify']!=='node scripts/repository-health-v10.mjs --run-native')missing.push('NPM_ENTRYPOINT');
 return {ok:missing.length===0,missing};
}
function rollbackCheck(){
 const commits=git('rev-list','HEAD').toString('utf8').trim().split('\n');
 const matching=commits.filter(c=>git('rev-parse',c+'^{tree}').toString('utf8').trim()===SPEC.baseline_tree);
 return {ok:matching.length>=1,baseline_tree:SPEC.baseline_tree,ancestor_commit:matching[0]||null,
  reconstructed_source_commit_not_github_main:true};
}
const commands=Object.freeze([
 ['npm',['run','runtime-root:verify']],['npm',['run','check:mcp']],['npm',['run','check']],
 ['node',['--test','tests/repository-health-v10.test.mjs']],
 ['node',['--test','--test-concurrency=1',
  'tests/mcp-external-contract.test.mjs',
  'tests/mcp-standalone-runtime-assurance.test.mjs',
  'tests/project-session-capsule.test.mjs',
  'tests/project-session-e2e.test.mjs',
  'tests/project-edu-complete-chain.test.mjs']]
]);
function scopedNative(run){
 if(!run)return {ok:false,status:'NOT_RUN',checks:[]};
 const checks=[];
 for(const [cmd,args] of commands){
  const p=spawnSync(cmd,args,{cwd:ROOT,encoding:'utf8',timeout:90000,maxBuffer:12*1024*1024,env:{...process.env,CI:'true'}});
  checks.push({command:[cmd,...args].join(' '),exit_code:p.status??-1,
   output_sha256:digest((p.stdout||'')+(p.stderr||'')),output_excerpt:((p.stdout||'')+(p.stderr||'')).slice(-480),
   timed_out:p.error?.code==='ETIMEDOUT'});
 }
 return {ok:checks.every(c=>c.exit_code===0&&!c.timed_out),status:'EXECUTED_LOCAL',checks};
}
export function evaluateMinimalDoD(gates){
 const out=Object.fromEntries(IDs.map(id=>[id,gates[id]===true?'PASS':(gates[id]===false?'FAIL':'HOLD')]));
 return {passed:IDs.every(id=>out[id]==='PASS'),gates:out,
   status:IDs.every(id=>out[id]==='PASS')?'PASS_SCOPED_SOURCE_MAINTENANCE':'HOLD_OR_REFUTED'};
}
export function proofOfMinimum(){
 // Each gate has one orthogonal failure family; 2^6 exhaustive subset check.
 const full=(1<<IDs.length)-1,passing=[];
 for(let mask=0;mask<=full;mask++){
  const selected=Object.fromEntries(IDs.map((x,i)=>[x,Boolean(mask&(1<<i))]));
  if(evaluateMinimalDoD(selected).passed)passing.push(mask);
 }
 return {six_gates:IDs,subsets:64,passing_masks:passing,unique_minimum:passing.length===1&&passing[0]===full,
   claim_scope:'MINIMUM_FOR_SIX_DEFINED_FAULT_FAMILIES_NOT_GLOBAL_SOFTWARE_OPTIMUM'};
}
export function auditV10({runNative=false}={}){
 const rows=tracked(),gitBefore=inspectGitContent(rows),ids=rows.map(x=>x.path);
 const edges=scanLiteralRelative(ROOT,ids),unresolved=edges.filter(x=>!x.valid),fresh=newUnresolved(edges,SPEC.inherited_unresolved_lexical_edges),rollback=rollbackCheck(),manifest_valid=validateSourceContract(SPEC),owner=ownerCheck(rows),docs=legibility();
 const native=scopedNative(runNative),gitAfter=inspectGitContent(tracked());
 const sameHeadAndTree=gitBefore.head===gitAfter.head&&gitBefore.tree===gitAfter.tree;
 const census=censusRepo(ROOT);
 const result=evaluateMinimalDoD({
  P:gitBefore.ok&&gitAfter.ok&&sameHeadAndTree,
  I:manifest_valid&&fresh.length===0,
  O:manifest_valid&&owner.ok,
  Q:runNative?native.ok:undefined,
  L:docs.ok,
  R:rollback.ok
 });
 return {schema:'ikant-v10-repository-health-receipt/v1',scope:'SOURCE_ONLY',
  status:result.status,abstract_dod:'REPOSITORY_MAINTAINED_SCOPED',
  baseline_main:SPEC.baseline_main,baseline_tree:SPEC.baseline_tree,
  head:gitAfter.head,tree:gitAfter.tree,
  original_commit_history_recovered:false,source_reconstruction_tree_verified:true,
  gate_results:result.gates,source_git:{...gitAfter},legacy_unresolved:unresolved.length,
  new_unresolved:fresh.map(x=>({source:x.source,kind:x.kind,specifier:x.specifier})),
  import_lexical_edges:edges.length,contract_integrity:manifest_valid,owner,directories:15,docs,rollback,
  dynamic_census:{js_files_parsed:census.js_files_parsed,callsite_count:census.callsite_count,
   unknown_target_count:census.unknown_target_count,
   epistemic_status:census.epistemic_status},
  native,minimum:proofOfMinimum(),
  external_consumers:'UNKNOWN_REVIEW_REQUIRED',native_project_edu:'NOT_ATTESTED',
  native_mcp_uses:'NOT_ATTESTED',ci_on_candidate:'NOT_RUN',
  active:false,authority:0,product_go:false,passed:result.passed};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const runNative=process.argv.includes('--run-native');const out=auditV10({runNative});
  process.stdout.write(JSON.stringify(out,null,2)+'\n');if(!out.passed)process.exitCode=20;
 }catch(e){process.stderr.write(String(e?.stack||e)+'\n');process.exitCode=21;}
}
