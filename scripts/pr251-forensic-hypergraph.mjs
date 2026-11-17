#!/usr/bin/env node
/** PR251: the V5-B/CORA source census is authoritative for the source graph.
 * This module derives typed DoD and bounded cuts; it does NOT reindex Git.
 * External and dynamic consumers are unknown, never proven unused. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {HISTORIC,mapR7SourcePath} from './r7-v13-epoch-bridge.mjs';
import {observeReticularCensusWithAudit} from './cora-minimal-absorption.mjs';
import {qualifyPr251SourceEpoch} from './v5b-repository-governance-audit.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const DOD='contracts/pr251-forensic-hypergraph-dod.json';
export function validateDod(c){
 if(c?.schema!=='ikant-pr251-forensic-hypergraph-dod/v2'||c.authority!==0||
    c.product_go!==false||c.release!=='HOLD'||!Array.isArray(c.gates)||
    !Array.isArray(c.leaves)||c.gates.length!==8||c.leaves.length!==25||
    c.source_delta!=='contracts/governance/changes/pr251-source-successor.json')return false;
 const gs=new Set(),ls=new Set(),used=new Set();
 for(const row of c.gates){
  if(!Array.isArray(row)||row.length!==3||!/^G[1-8]$/.test(row[0])||
     gs.has(row[0])||typeof row[1]!=='string'||!Array.isArray(row[2]))return false;
  gs.add(row[0]);
 }
 for(const row of c.leaves){
  if(!Array.isArray(row)||row.length!==2||!/^L\d\d$/.test(row[0])||
     ls.has(row[0])||typeof row[1]!=='string')return false;
  ls.add(row[0]);
 }
 for(const [, ,deps] of c.gates)for(const dep of deps){
  if(!ls.has(dep)||used.has(dep))return false;
  used.add(dep);
 }
 return gs.size===8&&ls.size===25&&used.size===25&&
  c.source_main==='e270c6e2cc772f960126eecea9f50501339e3656';
}
export function deriveHypergraph(c,audit){
 if(!validateDod(c)||!Array.isArray(audit?.consumer_index))throw Error('PR251_DOD_OR_V5B_CENSUS_INVALID');
 const nodes=[{id:'A0',type:'abstract'},{id:'G0',type:'global'},
  ...c.gates.map(([id])=>({id,type:'intermediate'})),
  ...c.leaves.map(([id])=>({id,type:'local'}))];
 const hyperedges=[{head:'A0',tails:['G0'],kind:'AND'},
  {head:'G0',tails:c.gates.map(([id])=>id),kind:'AND'},
  ...c.gates.map(([id,,tails])=>({head:id,tails,kind:'AND'}))];
 const paths=new Set(audit.consumer_index.map(x=>x.path)),edges=[];
 for(const row of audit.consumer_index)for(const dep of row.literal_dependencies||[])
  if(paths.has(dep))edges.push({from:row.path,to:dep,kind:'STATIC_IMPORT'});
 return {nodes,hyperedges,edges,source_files:audit.checked_files,
  dynamic_sites:audit.dependency_probe?.dynamic_site_candidates??null,
  roots:['ikant.mjs','package.json'],external_consumers:'UNKNOWN',
  product_go:false,global_minimum_certified:false};
}
/** Legacy V12 demanded physical retention. It is NOT a functional lower bound.
 * Keep original SHA history and fail closed on missing consumer/behavior evidence.
 * This routine never grants deletion or product authority.
 */
export function assessHistoricalRetirements(c,audit,originalPaths){
 if(!validateDod(c)||!Array.isArray(audit?.consumer_index)||!Array.isArray(originalPaths))
  throw Error('INVALID_HISTORICAL_SUPERGRAPH');
 const plan=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/r7-v11-seven-root-contract.json'),'utf8'));
 const present=new Set(audit.consumer_index.map(x=>x.path)),required=new Set(),missing=[];
 for(const old of originalPaths){
  const mapped=mapR7SourcePath(old,plan);
  if(!mapped||required.has(mapped))throw Error('HISTORIC_SOURCE_MAP_NOT_BIJECTIVE');
  required.add(mapped);
  if(!present.has(mapped))missing.push({source:old,path:mapped,
   status:'EVIDENCE_BLOCKED',proof_obligations:['recoverable_preimage','live_consumer_closure',
    'dynamic_and_external_consumer_closure','effects_and_authority_equivalence',
    'same_head_native_regression','independent_owner_review']});
 }
 missing.sort((a,b)=>a.path.localeCompare(b.path,'en'));
 return {historic_source_paths:required.size,retirement_candidates:missing,
  legacy_v12_physical_retention:missing.length?'REFUTED':'SATISFIED',
  historic_source_is_not_runtime_minimum:true,
  missing_proof_blocks_retirement:true,
  product_go:false,behavioral_equivalence:'NOT_ATTESTED'};
}
function historicalGitPaths(){
 const tree=execFileSync('git',['rev-parse',HISTORIC+'^{tree}'],{cwd:ROOT,encoding:'utf8'}).trim();
 if(tree!=='9b6b80d7fe2f8536b9ce8633e09810fc87b81c28')
  throw Error('V10_GIT_TREE_MISMATCH');
 const data=execFileSync('git',['ls-tree','-r','-z','--name-only',HISTORIC],{cwd:ROOT,maxBuffer:8*1024*1024});
 return data.toString('utf8').split('\0').filter(Boolean);
}
/** Exact exhaustive search over at most 16 candidate files; no runtime claims.
 * To delete a provider, every modeled consumer must also be deleted. */
export function exactBoundedCut(graph,candidates,keepOne=[]){
 const names=[...new Set(candidates)].sort(),ids=new Map(names.map((p,i)=>[p,i]));
 if(names.length>16)throw Error('CUT_EXCEEDS_BOUND_16');
 const blocked=new Set([...(graph.roots||[]),...(graph.locked_paths||[])]),required=names.map(()=>0);
 for(const e of graph.edges||[]){
  const target=ids.get(e.to);if(target===undefined)continue;
  const consumer=ids.get(e.from);
  if(consumer===undefined)blocked.add(e.to);
  else required[target]|=1<<consumer;
 }
 let best=-1,bestMask=0;
 for(let mask=0;mask<2**names.length;mask++){
  let ok=true,bytes=0;
  for(let i=0;i<names.length;i++)if(mask&(1<<i)){
   if(blocked.has(names[i])||(mask&required[i])!==required[i]){ok=false;break;}
   bytes+=graph.sizes?.[names[i]]||0;
  }
  for(const group of keepOne){
   if(group.length&&group.every(p=>ids.has(p))&&group.every(p=>mask&(1<<ids.get(p))))ok=false;
  }
  if(ok&&bytes>best){best=bytes;bestMask=mask;}
 }
 return {enumerated:2**names.length,selected:names.filter((_,i)=>bestMask&(1<<i)),
  bounded_static_bytes:best,global_minimum_certified:false,
  external_consumers:'UNKNOWN',product_go:false};
}
export function observe(){
 const c=JSON.parse(fs.readFileSync(path.join(ROOT,DOD),'utf8'));
 const {audit,census}=observeReticularCensusWithAudit(),epoch=qualifyPr251SourceEpoch();
 const graph=deriveHypergraph(c,audit),registry=JSON.parse(fs.readFileSync(path.join(ROOT,c.source_delta),'utf8'));
 const retention=assessHistoricalRetirements(c,audit,historicalGitPaths());
 const imported=new Set(graph.edges.map(x=>x.to));
 const possible=audit.consumer_index.filter(x=>x.path.startsWith('scripts/')&&
  /\.(?:mjs|js|sh|py)$/.test(x.path)&&!imported.has(x.path));
 const frontier=possible.slice(0,16).map(x=>x.path);
 const sizes=Object.fromEntries(frontier.map(p=>[p,fs.statSync(path.join(ROOT,p)).size]));
 // Source-only optimization is hypothesis generation; no original file is auto-approved.
 const cut=exactBoundedCut({...graph,sizes,locked_paths:[
  'host/c72-public-mode-admission.mjs','host/c135-edu-v2-owner.mjs',
  'host/c87-durable-ledger.mjs','host/c125-output-port.mjs']},frontier);
 return {schema:'ikant-pr251-typed-census/v2',source_status:audit.status,
  census_observed:census.ok===true,exact_source_epoch:epoch.ok===true,
  source_files:audit.checked_files,obligations:graph.nodes.length,
  hyperedges:graph.hyperedges.length,static_edges:graph.edges.length,
  dynamic_sites:graph.dynamic_sites,retired_paths:registry.paths.filter(x=>x.operation==='REMOVE').length,
  frontier_candidates:possible.length,cut,source_retirement:{historical_paths:retention.historic_source_paths,
  missing:retention.retirement_candidates,legacy_v12:retention.legacy_v12_physical_retention,
  behavioral_equivalence:retention.behavioral_equivalence,
  proof_blocked:retention.missing_proof_blocks_retirement},global_dod:'HOLD',product_go:false,
  external_consumers:'UNKNOWN'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const r=observe();console.log(JSON.stringify(r,null,2));
 if(!r.exact_source_epoch)process.exitCode=1;
}
