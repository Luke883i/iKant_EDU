#!/usr/bin/env node
/** PR251 physical counterexample: source-graph candidates -> original native test.
 * The sole execution owner is Node's original tracked test in isolated Git worktrees.
 * Only the bounded documentary edge is witnessed; no product/deletion approval.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {minimizeFailure} from './pr251-causal-oracle.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const TEST='tests/ikant-document-atlas.test.mjs';
const ATLAS='project/docs/IKANT_DOCUMENT_ATLAS.md';
const SHA=/^[0-9a-f]{40}$/;
const TAP=/^not ok \d+ - all Markdown files appear exactly once in five ontological\/navigation tiers(?:\s|$)/m;
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const deny=s=>{throw Error('PR251_PHYSICAL_'+s);};
const exec=(program,args,cwd=ROOT,timeout=30000)=>{
  const p=spawnSync(program,args,{cwd,encoding:'utf8',timeout,maxBuffer:16*1024*1024,
    env:{...process.env,CI:'true'}});
  return {code:p.status,signal:p.signal,error:p.error?.code||null,
    output:(p.stdout||'')+(p.stderr||'')};
};
const git=(args,cwd=ROOT)=>{
  const r=exec('git',args,cwd);
  if(r.code!==0||r.error)deny('GIT_'+args[0]+'_'+r.output.slice(0,160));
  return r.output.trim();
};
const valid=p=>typeof p==='string'&&p.length>0&&!p.includes('\\')&&!p.startsWith('/')&&
  p.split('/').every(x=>x&&x!=='.'&&x!=='..');
/** Overlap between a lexical P/Q omission and the *generated* documentary index.
 * A file with no observed import can still be semantically consumed by the atlas.
 */
export function selectPhysicalCandidates(graph,atlas,{limit=2}={}){
  const rows=graph?.total_source_supergraph?.product_first_solution?.outside_paths;
  if(graph?.exact_source_epoch!==true||graph.product_go!==false||
    graph.total_source_supergraph.product_go!==false||
    graph.total_source_supergraph.external_consumers!=='UNKNOWN'||
    !SHA.test(graph.head||'')||!SHA.test(graph.tree||'')||
    !Array.isArray(rows)||!Number.isInteger(limit)||limit<2||limit>16||
    typeof atlas!=='string')deny('UNTRUSTED_SCOPE');
  const seen=new Set(),eligible=[];
  for(const row of rows){
    if(!row||!valid(row.path)||!SHA.test(row.sha||'')||
      !Number.isInteger(row.bytes)||row.bytes<0||seen.has(row.path))
      deny('INVALID_OUTSIDE_ROW');
    seen.add(row.path);
    if(/^project\/docs\/.+\.md$/.test(row.path)&&
      atlas.includes('- ['+row.path+']('+path.posix.basename(row.path)+')'))
      eligible.push({path:row.path,sha:row.sha,bytes:row.bytes,mode:row.mode||'100644'});
  }
  eligible.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  if(eligible.length<limit)deny('INSUFFICIENT_ATLAS_COUNTEREXAMPLES');
  return {candidates:eligible.slice(0,limit),eligible_count:eligible.length,
    producer:'scripts/ikant-document-atlas.mjs',
    original_consumer:TEST,generated_index:ATLAS,
    edge:'GENERATED_MARKDOWN_MEMBERSHIP_NOT_STATIC_IMPORT',
    consumer_proof_level:'HYPOTHESIS_UNTIL_NATIVE_EXECUTION',
    external_consumers:'UNKNOWN',product_go:false};
}
function requireExactTree(graph){
  const head=git(['rev-parse','HEAD']);
  const tree=git(['rev-parse','HEAD^{tree}']);
  if(head!==graph.head||tree!==graph.tree)deny('STALE_HEAD_OR_TREE');
  if(git(['status','--porcelain','--untracked-files=no'])!=='')
    deny('TRACKED_SOURCE_DIRTY');
  return {head,tree,oracle_blob:git(['rev-parse','HEAD:'+TEST]),
    atlas_blob:git(['rev-parse','HEAD:'+ATLAS])};
}
function executeNative(worktree,outputFile){
  const r=exec(process.execPath,['--test','--test-concurrency=1',TEST],worktree,90000);
  fs.writeFileSync(outputFile,r.output,'utf8');
  const first=(r.output.match(/^not ok \d+ - .+$/m)||[])[0]||'NONE';
  const status=r.error||r.signal||r.code===null?'UNKNOWN':
    r.code===0?'PASS':TAP.test(r.output)?'FAIL':'UNKNOWN';
  return {status,exit_code:r.code,signal:r.signal,error:r.error,
    first_tap:first.slice(0,220),log_sha256:digest(r.output)};
}
function executeProductSmoke(worktree,outputFile){
  const files=['tests/project-edu-complete-chain.test.mjs',
    'tests/mcp-standalone-runtime-assurance.test.mjs',
    'tests/project-session-e2e.test.mjs'];
  const r=exec(process.execPath,['--test','--test-concurrency=1',...files],worktree,180000);
  fs.writeFileSync(outputFile,r.output,'utf8');
  return {status:r.code===0&&!r.error&&!r.signal?'PASS':
    r.error||r.signal||r.code===null?'UNKNOWN':'FAIL',
    exit_code:r.code,signal:r.signal,error:r.error,
    first_tap:((r.output.match(/^not ok \d+ - .+$/m)||[])[0]||'NONE').slice(0,220),
    log_sha256:digest(r.output),oracles:files};
}
/** Drive Git's genuine tracked-file deletion in a *disposable* worktree,
 * read exact Git blob identity and staged candidate tree, never changing PR HEAD.
 */
export async function physicalProbeFactory(graph,selection,outDir){
  const identity=requireExactTree(graph),candidate=new Map(selection.candidates.map(x=>[x.path,x]));
  const attempts=[];let counter=0;
  async function probe(paths,{product=false}={}){
    if(!Array.isArray(paths)||new Set(paths).size!==paths.length||
      paths.some(p=>!candidate.has(p)))deny('CANDIDATE_OUTSIDE_PINNED_SET');
    const id=String(counter++).padStart(3,'0'),wd=path.join(outDir,'worktree-'+id);
    const details=[];
    let added=false;
    try{
      git(['worktree','add','--detach',wd,identity.head]);added=true;
      for(const p of paths){
        const source=candidate.get(p);
        if(git(['rev-parse','HEAD:'+p],wd)!==source.sha)deny('BLOB_MISMATCH');
        const f=path.resolve(wd,p);
        if(!f.startsWith(wd+path.sep)||!fs.lstatSync(f).isFile()||
          fs.lstatSync(f).isSymbolicLink()||
          fs.statSync(f).size!==source.bytes)deny('UNSAFE_SOURCE_PATH');
        git(['rm','--',p],wd);
        details.push({path:p,preimage_git_sha1:source.sha,bytes:source.bytes});
      }
      const staged=git(['diff','--cached','--name-only','-z'],wd)
        .split('\0').filter(Boolean).sort();
      if(JSON.stringify(staged)!==JSON.stringify([...paths].sort()))
        deny('PHYSICAL_DELETION_SET_MISMATCH');
      const candidateTree=git(['write-tree'],wd);
      const result=executeNative(wd,path.join(outDir,'trial-'+id+'-original.tap'));
      let productResult=null;
      if(product)productResult=executeProductSmoke(wd,path.join(outDir,'trial-'+id+'-product.tap'));
      const row={id,removed:details,removed_count:details.length,
        candidate_tree:candidateTree,source_head:identity.head,
        source_tree:identity.tree,original_native:result,
        product_native:productResult,source_dirty_expected:details.length>0,
        original_sha_preserved:true,external_consumers:'UNKNOWN',
        product_go:false,authorized_deletion:false};
      attempts.push(row);
      return row;
    }finally{
      if(added){
        const clean=exec('git',['worktree','remove','--force',wd]);
        if(clean.code!==0)deny('WORKTREE_CLEANUP_FAILED');
      }
    }
  }
  return {identity,attempts,probe};
}
export async function witness(graph,outDir) {
  fs.mkdirSync(outDir,{recursive:true});
  const index=git(['show','HEAD:'+ATLAS]);
  const selection=selectPhysicalCandidates(graph,index);
  const oracle=await physicalProbeFactory(graph,selection,outDir);
  const baseline=await oracle.probe([]);
  if(baseline.original_native.status!=='PASS')deny('BASELINE_ORIGINAL_NOT_PASS');
  const items=selection.candidates.map(x=>x.path);
  const reduced=await minimizeFailure(items,async members=>
    (await oracle.probe(members)).original_native.status,{maxProbes:12});
  let replay=null,emptyControl=null;
  if(reduced.status==='ONE_MINIMAL_FAILURE_KERNEL'){
    replay=await oracle.probe(reduced.kernel,{product:true});
    emptyControl=await oracle.probe([],{product:true});
  }
  const verified=reduced.status==='ONE_MINIMAL_FAILURE_KERNEL'&&
    reduced.kernel.length===1&&
    replay?.original_native.status==='FAIL'&&
    emptyControl?.original_native.status==='PASS'&&
    replay?.product_native?.status==='PASS'&&
    emptyControl?.product_native?.status==='PASS';
  return {schema:'ikant-pr251-physical-documentary-ddmin/v1',
    status:verified?'ONE_MINIMAL_NATIVE_DOCUMENTARY_COUNTEREXAMPLE':
      'NOT_ATTESTED_OR_INCONCLUSIVE',
    qualification:verified?'ORIGINAL_TEST_AND_POSITIVE_NEGATIVE_PRODUCT_CONTROLS':'HOLD',
    source:{head:graph.head,tree:graph.tree,source_epoch:graph.exact_source_epoch},
    oracle_identity:oracle.identity,consumer_hyperedge:selection.edge,
    consumer_producer:selection.producer,consumer_test:selection.original_consumer,
    candidate_count:selection.candidates.length,
    eligible_outside_closure:selection.eligible_count,
    candidates:selection.candidates,baseline:baseline.original_native,
    physical_minimization:reduced,replay:replay?.original_native||null,
    product_smoke_mutant:replay?.product_native||null,
    product_smoke_control:emptyControl?.product_native||null,
    materialized_trials:oracle.attempts,
    git_objects_not_deleted_from_pr:true,original_native_oracle_executed:true,
    observed_consumer_scope:'DOCUMENT_ATLAS_ONLY_NOT_COMPLETE_PRODUCT',
    dynamic_and_external_consumers:'UNKNOWN',independent_owner_review:'NOT_ATTESTED',
    full_behavioral_equivalence:'NOT_ATTESTED',global_dod:'HOLD',
    product_go:false,authorized_deletion:false,release_authorized:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const out=process.argv[3]||path.join(os.tmpdir(),'pr251-physical');
  try{
    if(process.argv.length!==4)deny('USAGE_GRAPH_OUTPUT_DIR');
    const graph=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
    const report=await witness(graph,out);
    fs.writeFileSync(path.join(out,'physical-ddmin.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({head:report.source.head,status:report.status,
      kernel:report.physical_minimization.kernel,
      trials:report.materialized_trials.length,
      product_control:report.product_smoke_control?.status,
      product_mutant:report.product_smoke_mutant?.status,global_dod:report.global_dod}));
    if(report.status!=='ONE_MINIMAL_NATIVE_DOCUMENTARY_COUNTEREXAMPLE')
      process.exitCode=1;
  }catch(e){
    fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'physical-error.json'),
      JSON.stringify({status:'FAIL_CLOSED',reason:String(e.message||e),
        global_dod:'HOLD',product_go:false})+'\n');
    console.error(String(e.stack||e));process.exitCode=1;
  }
}
