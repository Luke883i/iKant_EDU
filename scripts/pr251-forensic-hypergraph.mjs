#!/usr/bin/env node
/** PR251: the V5-B/CORA source census is authoritative for the source graph.
 * This module derives typed DoD and bounded cuts; it does NOT reindex Git.
 * External and dynamic consumers are unknown, never proven unused. */
import fs from 'node:fs';
import crypto from 'node:crypto';
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
 const registry=JSON.parse(fs.readFileSync(path.join(ROOT,c.source_delta),'utf8'));
 const retirements=new Map(registry.paths.filter(x=>x.operation==='REMOVE').map(x=>[x.path,x]));
 const unresolved=audit.dependency_probe?.unresolved_relative_imports||[];
 for(const old of originalPaths){
  const mapped=mapR7SourcePath(old,plan);
  if(!mapped||required.has(mapped))throw Error('HISTORIC_SOURCE_MAP_NOT_BIJECTIVE');
  required.add(mapped);
  if(!present.has(mapped)){
   const row=retirements.get(mapped);
   if(!row||!(/^[a-f0-9]{40}$/).test(row.before_sha||'')||
      row.after_sha!==null||!['100644','100755'].includes(row.before_mode))
     throw Error('UNREGISTERED_HISTORIC_RETIREMENT:'+mapped);
   const expected=execFileSync('git',['rev-parse',c.source_main+':'+mapped],
    {cwd:ROOT,encoding:'utf8'}).trim();
   if(expected!==row.before_sha||
      execFileSync('git',['cat-file','-t',expected],{cwd:ROOT,encoding:'utf8'}).trim()!=='blob')
     throw Error('RETIRED_PREIMAGE_SHA_INVALID:'+mapped);
   const known=unresolved.filter(e=>e.target===mapped).map(e=>e.from).sort();
   missing.push({source:old,path:mapped,preimage_sha:expected,
    preimage_proof:'GIT_OBJECT_PIN_VERIFIED',known_unresolved_static_consumers:known,
    status:known.length?'KNOWN_CONSUMER_BLOCKED':'EVIDENCE_BLOCKED',
    proof_obligations:['live_consumer_closure','dynamic_and_external_consumer_closure',
     'effects_and_authority_equivalence','same_head_native_regression','independent_owner_review']});
  }
 }
 missing.sort((a,b)=>a.path.localeCompare(b.path,'en'));
 return {historic_source_paths:required.size,retirement_candidates:missing,
  legacy_v12_physical_retention:missing.length?'REFUTED':'SATISFIED',
  historic_source_is_not_runtime_minimum:true,
  missing_proof_blocks_retirement:missing.length>0,
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


/** Backward product and assurance slices on the observed typed multigraph.
 * Conditional lexical closure, not proof of full-system equivalence. */
export function deriveProductSolution(inventory,relations){
 const paths=new Map(inventory.map(x=>[x.path,x])),bySource=new Map(inventory.map(x=>[x.path,[]]));
 for(const e of relations)if(bySource.has(e.from)&&paths.has(e.to))bySource.get(e.from).push(e);
 const product=['ikant.mjs','package.json','README.md','AGENTS.md','TERMS.md','ADMISSION.json',
  'BOOTSTRAP.json','project/session-chat/PROMPT.txt',
  'project/plugins/ikant-le-session-chat/server/server.mjs',
  'host/c72-public-mode-admission.mjs','host/c135-edu-v2-owner.mjs',
  'host/c87-durable-ledger.mjs','host/c125-output-port.mjs'].filter(x=>paths.has(x));
 const verify=inventory.filter(x=>x.path.startsWith('tests/')||
  x.path.startsWith('.github/workflows/')).map(x=>x.path);
 const allowed=new Set(['STATIC_IMPORT','SOURCE_LITERAL','PACKAGE_LITERAL',
  'WORKFLOW_LITERAL','TEST_LITERAL']);
 function visit(roots){
  const found=new Set(roots),queue=[...roots];
  for(let i=0;i<queue.length;i++)for(const e of bySource.get(queue[i])||[]){
   if(!allowed.has(e.type)||found.has(e.to))continue;
   found.add(e.to);queue.push(e.to);
  }
  return found;
 }
 const p=visit(product),q=visit(verify),pq=new Set([...p,...q]);
 const score=x=>[...x].reduce((n,k)=>n+(paths.get(k)?.bytes||0),0);
 const excluded=inventory.filter(x=>!pq.has(x.path));
 const docs=excluded.filter(x=>x.path.startsWith('project/docs/'));
 const candidates=new Set(docs.map(x=>x.path));
 const boundary=relations.filter(e=>candidates.has(e.to)&&!candidates.has(e.from));
 const dynamic=[...pq].filter(x=>paths.get(x)?.dynamic_site);
 return {schema:'ikant-pr251-product-first-cut/v1',
  product_roots:product,verification_roots:verify.length,
  product_observed_closure:{files:p.size,bytes:score(p)},
  verification_observed_closure:{files:q.size,bytes:score(q)},
  combined_observed_closure:{files:pq.size,bytes:score(pq)},
  outside_observed_closure:{files:excluded.length,bytes:score(excluded.map(x=>x.path))},
  outside_paths:excluded.map(x=>({path:x.path,sha:x.sha,bytes:x.bytes,tier:x.tier})),
  documentary_retirement_hypothesis:{files:docs.length,bytes:score(docs.map(x=>x.path)),
    boundary_edges:boundary.length,consumer_rewrites:[...new Set(boundary.map(x=>x.from))].sort()},
  dynamic_paths_inside_observed_closure:dynamic.length,
  dynamic_paths:dynamic,
  complete_runtime_coverage:false,independent_owner_acceptance:false,
  full_consumer_closure:false,global_optimum_proved:false,product_go:false};
}

/** FULL-HEAD readback. The entire 1,624-file tree is inspected, including bytes
 * and binary artifacts. Lexical code and path consumers are only a lower bound.
 * A cold documentary path is a RETIREMENT HYPOTHESIS, not safe-to-delete proof.
 */
export function buildTotalSupergraph(audit,{root=ROOT,treeText=null,read=null}={}){
 const records=treeText??execFileSync('git',['ls-tree','-r','-l','-z','HEAD'],{cwd:root,maxBuffer:32e6}).toString('utf8');
 const rows=records.split('\0').filter(Boolean).map(row=>{
  const m=/^(100644|100755|120000) +blob +([a-f0-9]{40}) +([0-9]+)\t(.+)$/.exec(row);
  if(!m)throw Error('INVALID_FULL_GIT_TREE_ENTRY');
  return {path:m[4],mode:m[1],sha:m[2],bytes:Number(m[3])};
 }).sort((a,b)=>a.path.localeCompare(b.path,'en'));
 const paths=new Map(rows.map(x=>[x.path,x]));if(paths.size!==rows.length)throw Error('DUPLICATE_FULL_TREE_PATH');
 const refs=new Map(rows.map(x=>[x.path,[]])),incoming=new Map(rows.map(x=>[x.path,[]]));
 const readBytes=read??(p=>execFileSync('git',['cat-file','blob',paths.get(p).sha],{cwd:root,maxBuffer:Math.max(1024*1024,paths.get(p).bytes+1024)}));
 const textExt=/\.(?:mjs|cjs|js|ts|mts|py|sh|c|md|txt|json|yml|yaml|html|css|csv|tsv|svg)$/i;
 const docs=p=>p.startsWith('project/docs/');
 const essential=new Set(['README.md','AGENTS.md','TERMS.md','ADMISSION.json','BOOTSTRAP.json',
  'ikant.mjs','package.json','project/session-chat/PROMPT.txt',
  'project/plugins/ikant-le-session-chat/server/server.mjs',
  'host/c72-public-mode-admission.mjs','host/c135-edu-v2-owner.mjs',
  'host/c87-durable-ledger.mjs','host/c125-output-port.mjs',
  'project/docs/IKANT_DOCUMENT_ATLAS.md','project/docs/START_HERE.md',
  'project/docs/IKANT_LOCAL_SETUP.md','project/docs/ARCHITECTURE.md',
  'project/docs/GOVERNANCE.md','project/docs/REPOSITORY_HEALTH_V10.md']);
 for(const x of rows)if(x.path.startsWith('.github/workflows/')||x.path.startsWith('src/runtime-root/'))
  essential.add(x.path);
 const strings=new Map(),shaErrors=[],effects=[],unknownSites=[],binary=[];
 for(const entry of rows){
  const buf=readBytes(entry.path);
  const sha=crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
  if(entry.bytes!==buf.length||entry.sha!==sha)shaErrors.push(entry.path);
  if(!textExt.test(entry.path)){binary.push(entry.path);continue;}
  const src=buf.toString('utf8');strings.set(entry.path,src);
  if(/\b(?:writeFile|appendFile|rename|unlink|rm|mkdir|execFile|spawn|fetch)\s*\(/.test(src)&&
     /\.(?:mjs|js|py)$/.test(entry.path))
   effects.push({path:entry.path,kind:'SIDE_EFFECT_SITE_NOT_EXECUTION_PROOF'});
  if(/\b(?:import\s*\(\s*(?!['"])|require\s*\(\s*(?!['"])|readFile\s*\(\s*(?!['"])|readdir\s*\()/.test(src))
   unknownSites.push(entry.path);
 }
 if(shaErrors.length)throw Error('HEAD_BLOB_READBACK_MISMATCH:'+shaErrors.slice(0,10).join(','));
 const edgeIds=new Set(),edges=[];
 function edge(from,to,type){
  if(!paths.has(from)||!paths.has(to)||from===to)return;
  const id=from+'\t'+to+'\t'+type;if(edgeIds.has(id))return;edgeIds.add(id);
  const e={from,to,type};edges.push(e);refs.get(from).push(e);incoming.get(to).push(e);
 }
 for(const row of audit.consumer_index||[])for(const dep of row.literal_dependencies||[])edge(row.path,dep,'STATIC_IMPORT');
 const literal=/(?:\.\.\/|\.\/)?[A-Za-z0-9_@.-]+(?:\/[A-Za-z0-9_@.-]+)*\.(?:mjs|cjs|js|json|md|txt|yml|yaml|sh|py|ts|html|svg|br|zip|csv)/g;
 for(const [from,src] of strings){
  const matches=new Set(src.match(literal)||[]);
  for(const token of matches){
   let target=token;
   if(!paths.has(target))target=path.posix.normalize(path.posix.join(path.posix.dirname(from),token));
   if(!paths.has(target))continue;
   const type=from.startsWith('.github/workflows/')?'WORKFLOW_LITERAL':
    from==='package.json'?'PACKAGE_LITERAL':
    from.startsWith('tests/')?'TEST_LITERAL':
    docs(from)?'DOCUMENT_LINK':'SOURCE_LITERAL';
   edge(from,target,type);
  }
 }
 const directConsumers=rows.filter(r=>essential.has(r.path)||r.path.startsWith('tests/')||
  r.path.startsWith('.github/workflows/')||r.path.startsWith('src/')||
  r.path.startsWith('host/')||r.path.startsWith('scripts/')).map(x=>x.path);
 const activeDocRefs=new Set();
 for(const source of directConsumers)for(const e of refs.get(source)||[])if(docs(e.to))activeDocRefs.add(e.to);
 const publicDocs=new Set([...essential].filter(docs));
 for(const source of ['README.md','AGENTS.md','BOOTSTRAP.json','ADMISSION.json','package.json',
  'project/session-chat/PROMPT.txt'])for(const e of refs.get(source)||[])if(docs(e.to))publicDocs.add(e.to);
 const coldDocs=rows.filter(x=>docs(x.path)&&!publicDocs.has(x.path)&&!activeDocRefs.has(x.path));
 const directLinks=rows.filter(x=>docs(x.path)&&activeDocRefs.has(x.path));
 const docPotentialBytes=coldDocs.reduce((n,x)=>n+x.bytes,0);
 const report=rows.map(x=>{
  const inEdges=incoming.get(x.path)||[],outEdges=refs.get(x.path)||[];
  const tier=essential.has(x.path)?'FOUNDATION_ROOT':
    x.path.startsWith('tests/')?'ASSURANCE':
    x.path.startsWith('.github/workflows/')?'CI_OWNER':
    x.path.startsWith('src/')||x.path.startsWith('host/')?'RUNTIME_OR_OWNER':
    docs(x.path)?(coldDocs.some(r=>r.path===x.path)?'DOCUMENTARY_ARCHIVE_HYPOTHESIS':'LIVE_DOCUMENT_REFERENCE'):
    x.path.startsWith('contracts/')?'CONTRACT_OR_PROVENANCE':
    x.path.startsWith('scripts/')?'TOOL_OR_LEGACY':'OTHER';
  return {...x,tier,incoming:inEdges.map(e=>[e.from,e.type]),
   outgoing:outEdges.map(e=>[e.to,e.type]),effect_site:effects.some(e=>e.path===x.path),
   dynamic_site:unknownSites.includes(x.path),
   consumer_complete:false,retirement_authorized:false};
 });
 return {schema:'ikant-pr251-total-source-supergraph/v1',
  analysis:'EXHAUSTIVE_TRACKED_BLOB_READBACK_HEURISTIC_CONSUMERS_NOT_CLOSED_WORLD',
  files:rows.length,tracked_bytes:rows.reduce((n,x)=>n+x.bytes,0),
  bytes_verified:rows.reduce((n,x)=>n+x.bytes,0),
  git_sha_errors:shaErrors.length,all_paths_classified:true,relation_count:edges.length,
  relation_types:Object.fromEntries([...new Set(edges.map(x=>x.type))].map(t=>[t,edges.filter(e=>e.type===t).length])),
  dynamic_sites:unknownSites,side_effect_sites:effects,binary_files:binary,
  cold_documentary_candidates:coldDocs.map(x=>({path:x.path,sha:x.sha,bytes:x.bytes,
    state:'HYPOTHESIS_NOT_APPROVED',rewrite_required:true})),
  cold_documentary_bytes:docPotentialBytes,cold_documentary_count:coldDocs.length,
  doc_product_references:directLinks.length,essential_root_count:essential.size,
  semantic_inventory:report,relations:edges,
  product_first_solution:deriveProductSolution(report,edges),
  archive_policy:'NO_CHANGE_TO_CURRENT_TREE_WITHOUT_LINK_REWRITE_AND_NATIVE_PROOF',
  runtime_equivalence:'NOT_ATTESTED',external_consumers:'UNKNOWN',global_minimum_certified:false,
  product_go:false};
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
 const exactHead=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
 const exactTree=execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:ROOT,encoding:'utf8'}).trim();
 return {schema:'ikant-pr251-typed-census/v2',head:exactHead,tree:exactTree,source_status:audit.status,
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
 const r=observe();
 if(process.argv.includes('--deep')){
  const {audit}=observeReticularCensusWithAudit();
  r.total_source_supergraph=buildTotalSupergraph(audit);
 }
 console.log(JSON.stringify(r,null,2));
 if(!r.exact_source_epoch)process.exitCode=1;
}
