#!/usr/bin/env node
/**
 * PR251: typed source hypergraph and conservative counterfactual cut census.
 * Scope: exact checkout Git blobs, lexical imports, commands, CI references,
 * and declared DoD hyperedges. NOT dynamic/runtime/external completeness.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const POSIX=path.posix;
const BLOB=(bytes)=>crypto.createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');
const SHA256=(bytes)=>crypto.createHash('sha256').update(bytes).digest('hex');
const EXTS=['','.mjs','.js','.cjs','.json','.ts','.py','/index.mjs','/index.js'];

export function parseGitTree(raw){
 const entries=[];
 for(const part of Buffer.from(raw).toString('utf8').split('\0')){
  if(!part)continue;
  const match=/^([0-7]{6}) (blob|commit) ([a-f0-9]{40}) ([0-9]+|-)\t(.+)$/.exec(part);
  if(!match)throw Error('INVALID_GIT_TREE_RECORD');
  entries.push({mode:match[1],type:match[2],sha:match[3],
   bytes:match[4]==='-'?null:Number(match[4]),path:match[5]});
 }
 entries.sort((a,b)=>a.path.localeCompare(b.path,'en'));
 if(new Set(entries.map(x=>x.path)).size!==entries.length)throw Error('DUPLICATE_GIT_PATH');
 return entries;
}
export function checkBlob(entry,bytes){
 return entry.type==='blob'&&Number.isSafeInteger(entry.bytes)&&entry.bytes===bytes.length&&BLOB(bytes)===entry.sha;
}
export function validateDod(contract){
 if(!contract||contract.schema!=='ikant-pr251-forensic-hypergraph-dod/v1'||
    contract.product_go!==false||contract.authority!==0||contract.release!=='HOLD')return false;
 const nodes=new Map((contract.nodes||[]).map(n=>[n.id,n]));
 if(nodes.size!==(contract.nodes||[]).length||!nodes.has('A0')||!nodes.has('G0'))return false;
 if(nodes.get('A0').kind!=='AND'||nodes.get('G0').kind!=='AND')return false;
 const hyp=contract.hyperedges||[],seen=new Set();
 for(const edge of hyp){
  if(edge.type!=='requires_all'||!nodes.has(edge.head)||!Array.isArray(edge.tails)||
   edge.tails.length===0||seen.has(edge.head)||new Set(edge.tails).size!==edge.tails.length||
   !edge.tails.every(t=>nodes.has(t)))return false;
  seen.add(edge.head);
  if(JSON.stringify(nodes.get(edge.head).requires)!==JSON.stringify(edge.tails))return false;
 }
 if(seen.size!==(contract.nodes||[]).filter(n=>n.kind==='AND').length)return false;
 const visiting=new Set(),finished=new Set();
 function visit(id){
  if(visiting.has(id))return false;
  if(finished.has(id))return true;
  visiting.add(id);
  for(const child of nodes.get(id).requires||[])if(!nodes.has(child)||!visit(child))return false;
  visiting.delete(id);finished.add(id);return true;
 }
 return visit('A0')&&finished.size===nodes.size;
}
export function importSpecifiers(s){
 const out=[];
 const re=/(?:\b(?:import|export)\s+(?:[^'"\n]{0,240}?\s+from\s*)?['"]([^'"\n]+)['"])|(?:\b(?:import|require)\s*\(\s*['"]([^'"\n]+)['"]\s*\))/g;
 let m;while((m=re.exec(s))!==null)out.push(m[1]||m[2]);
 return [...new Set(out)].sort();
}
export function resolveRelative(from,spec,known){
 if(!spec.startsWith('.'))return null;
 const base=POSIX.normalize(POSIX.join(POSIX.dirname(from),spec));
 if(base==='..'||base.startsWith('../')||POSIX.isAbsolute(base))return {missing:base,escape:true};
 for(const ext of EXTS){const candidate=base+ext;if(known.has(candidate))return {path:candidate};}
 return {missing:base,escape:false};
}
export function buildGraph(entries,contents,contract){
 if(!validateDod(contract))throw Error('DOD_HYPERGRAPH_INVALID');
 const paths=new Set(entries.map(x=>x.path));
 const nodes=entries.map(x=>({id:x.path,type:'git_blob',sha:x.sha,size:x.bytes,mode:x.mode}));
 const edges=[],missing=[],external=new Set(),dynamic=[];
 const pushed=new Set();
 function add(from,to,type,witness){
  const key=[from,to,type].join('|');
  if(!pushed.has(key)){pushed.add(key);edges.push({from,to,type,witness});}
 }
 for(const entry of entries){
  const p=entry.path;
  if(!/\.(mjs|js|cjs|ts)$/.test(p))continue;
  const s=contents.get(p);if(s===undefined)continue;
  for(const spec of importSpecifiers(s)){
   if(spec.startsWith('.')){
    const resolved=resolveRelative(p,spec,paths);
    if(resolved?.path)add(p,resolved.path,'imports','lexical_static_specifier');
    else missing.push({from:p,spec,attempt:resolved?.missing||null});
   }else external.add(spec);
  }
  if(/\bimport\s*\(\s*[^'"\s]/.test(s))dynamic.push({path:p,reason:'dynamic_import'});
  if(/\b(?:readFileSync|existsSync|createRequire|require\.resolve)\s*\(\s*(?!['"])/.test(s))
    dynamic.push({path:p,reason:'computed_filesystem_or_module_path'});
 }
 for(const entry of entries){
  const p=entry.path;
  if(p!=='package.json'&&!p.startsWith('.github/workflows/'))continue;
  const s=contents.get(p)||'';
  const re=/(?:^|[\s'"])(?:node|python3?|bash|sh)\s+((?:scripts|src|tests|project|host)\/[\w./-]+\.(?:mjs|js|py|sh))/gm;
  let m;while((m=re.exec(s))!==null){if(paths.has(m[1]))add(p,m[1],'executes','literal_cli_path');else missing.push({from:p,spec:m[1],attempt:m[1]});}
 }
 const liveRoots=['ikant.mjs','package.json','project/session-chat/PROMPT.txt','project/plugins/ikant-le-session-chat/server/server.mjs',
   ...entries.filter(e=>e.path.startsWith('.github/workflows/')&&e.path.endsWith('.yml')).map(e=>e.path)].filter(p=>paths.has(p));
 const adjacency=new Map();for(const e of edges){if(!adjacency.has(e.from))adjacency.set(e.from,[]);adjacency.get(e.from).push(e.to);}
 const reached=new Set(liveRoots),queue=[...liveRoots];
 for(let i=0;i<queue.length;i++)for(const dep of adjacency.get(queue[i])||[])if(!reached.has(dep)){reached.add(dep);queue.push(dep);}
 const references=[];
 for(const item of contract.retirement_pool||[]){
  const exact=item.path,base=POSIX.basename(exact),refs=[];
  for(const [from,s] of contents){
   if(from===exact||!s.includes(base)&&!s.includes(exact))continue;
   const kind=from.endsWith('.md')||from.endsWith('.txt')?'documentary':
      from.startsWith('contracts/governance/')?'historical_registry':
      from.startsWith('tests/')?'test':
      from==='package.json'||from.startsWith('.github/workflows/')?'automation':'source_or_unknown';
   refs.push({path:from,kind});
  }
  const live=refs.filter(r=>['automation','source_or_unknown'].includes(r.kind)&&!r.path.endsWith('pr251-forensic-hypergraph-dod.json'));
  references.push({path:exact,tracked:paths.has(exact),bytes:entries.find(e=>e.path===exact)?.bytes||0,
    static_references:refs.length,live_or_unknown_references:live,
    source_cut:'CANDIDATE_ONLY',external_consumers:'UNKNOWN',
    reachability:reached.has(exact)?'REACHED':'NOT_REACHED_BY_KNOWN_ROOTS'});
 }
 const dupes=new Map();
 for(const e of entries){if(!dupes.has(e.sha))dupes.set(e.sha,[]);dupes.get(e.sha).push(e.path);}
 const duplicateClusters=[...dupes.values()].filter(x=>x.length>1);
 const sortedEdges=edges.sort((a,b)=>(a.from+'|'+a.to+'|'+a.type).localeCompare(b.from+'|'+b.to+'|'+b.type,'en'));
 const nodesDOD=contract.nodes.map(n=>({id:n.id,type:'obligation',status:n.status||'NOT_ATTESTED'}));
 const hyperedges=contract.hyperedges.map(h=>({head:h.head,tails:h.tails,type:h.type,evidence:'normative_not_runtime'}));
 return {nodes:nodes.concat(nodesDOD),edges:sortedEdges,hyperedges,
  missing:missing.sort((a,b)=>a.from.localeCompare(b.from,'en')),dynamic,external:[...external].sort(),
  roots:liveRoots,reachable:reached.size,duplicate_clusters:duplicateClusters,
  cut_candidates:references,unknown_external_consumers:true,global_minimum_certified:false,
  release:'HOLD',product_go:false};
}
export function graphFingerprint(graph){
 const minimal={nodes:graph.nodes,edges:graph.edges,hyperedges:graph.hyperedges,roots:graph.roots,
  cut_candidates:graph.cut_candidates,missing:graph.missing,dynamic:graph.dynamic};
 return SHA256(Buffer.from(JSON.stringify(minimal)));
}
export function verifyGraphReconstruction(candidate,entries,contents,contract){
 return graphFingerprint(candidate)===graphFingerprint(buildGraph(entries,contents,contract));
}
export function counterfactualCut(graph,remove){
 const removed=new Set(remove),violations=[];
 const known=new Set(graph.nodes.filter(n=>n.type==='git_blob').map(n=>n.id));
 for(const p of removed)if(!known.has(p))violations.push({path:p,reason:'CUT_SOURCE_NOT_PRESENT'});
 for(const edge of graph.edges)if(removed.has(edge.to)&&!removed.has(edge.from))
   violations.push({path:edge.to,reason:'LIVE_DEPENDENCY',consumer:edge.from});
 for(const p of removed)if(graph.roots.includes(p))violations.push({path:p,reason:'ROOT_REMOVED'});
 const cut=graph.cut_candidates.filter(c=>removed.has(c.path));
 for(const c of cut)if(c.live_or_unknown_references.length)
   violations.push({path:c.path,reason:'UNRESOLVED_LITERAL_CONSUMER',count:c.live_or_unknown_references.length});
 const bytes=cut.reduce((s,c)=>s+c.bytes,0);
 return {deleted_paths:[...removed].sort(),source_bytes_reduction:bytes,source_only_admissible:violations.length===0,
  violations,external:'UNKNOWN',release:'HOLD',product_go:false,
  global_equivalence:false};
}

/** Exact exhaustive search on <=16 file candidates, NOT global minimality.
 * x[target] <= x[consumer] for known dependency arcs: a deleted provider
 * cannot retain a live consumer. Additional keep-one hyperedges are enforced.
 */
export function exactBoundedCut(graph,candidates,keepOneGroups=[]){
 const list=[...new Set(candidates)].sort();
 if(list.length>16)throw Error('BOUNDED_CUT_TOO_LARGE');
 const ids=new Map(list.map((p,i)=>[p,i]));
 const nodes=new Map(graph.nodes.filter(n=>n.type==='git_blob').map(n=>[n.id,n]));
 if(list.some(p=>!nodes.has(p)))throw Error('CUT_MISSING_SOURCE');
 const blocked=new Set(graph.roots||[]),need=new Array(list.length).fill(0);
 for(const e of graph.edges){
  const i=ids.get(e.to);if(i===undefined)continue;
  const prereq=ids.get(e.from);
  if(prereq===undefined)blocked.add(e.to);else need[i]|=(1<<prereq);
 }
 const keep=keepOneGroups.map(group=>{
  if(!Array.isArray(group)||!group.length||group.some(p=>!nodes.has(p)))throw Error('BAD_KEEP_ONE_HYPEREDGE');
  return group.reduce((mask,p)=>mask|(ids.has(p)?1<<ids.get(p):0),0);
 }).filter(mask=>mask!==0);
 const weight=list.map(p=>nodes.get(p).size||0);
 let inspected=0,bestMask=0,bestWeight=0;
 const n=1<<list.length;
 for(let mask=0;mask<n;mask++){
  inspected++;let valid=true,score=0;
  for(let i=0;i<list.length;i++)if(mask&(1<<i)){
   if(blocked.has(list[i])||(need[i]&mask)!==need[i]){valid=false;break;}
   score+=weight[i];
  }
  if(!valid||keep.some(group=>(mask&group)===group))continue;
  if(score>bestWeight){bestWeight=score;bestMask=mask;}
 }
 return {schema:'ikant-pr251-exact-bounded-static-cut/v1',candidate_count:list.length,
  enumerated_subsets:inspected,selected:list.filter((p,i)=>bestMask&(1<<i)),
  maximum_reclaimable_source_bytes_within_model:bestWeight,
  exact_for_declared_static_subgraph:true,global_minimum_certified:false,
  external_and_dynamic_consumers:'UNKNOWN',release:'HOLD',product_go:false};
}
/** Candidate discovery is deliberately hypothesis-generating, never authority. */
export function discoverBoundedFrontier(graph,limit=16){
 const inbound=new Set(graph.edges.map(e=>e.to));
 const candidates=graph.nodes.filter(n=>n.type==='git_blob'&&
  n.id.startsWith('scripts/')&&/\.(?:mjs|js|py|sh)$/.test(n.id)&&
  !inbound.has(n.id)&&!graph.roots.includes(n.id)&&
  !n.id.includes('pr251-forensic-hypergraph')).sort((a,b)=>b.size-a.size||a.id.localeCompare(b.id,'en'));
 return {observed_unreferenced_scripts:candidates.length,
  candidate_status:'SOURCE_GRAPH_ONLY_NOT_EXTERNAL_UNUSED',
  ...exactBoundedCut(graph,candidates.slice(0,limit).map(n=>n.id))};
}

export function readCheckout(root=ROOT){
 const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim();
 const entries=parseGitTree(execFileSync('git',['ls-tree','-r','-z','-l','HEAD'],{cwd:root,maxBuffer:20*1024*1024}));
 const content=new Map(),drift=[],readErrors=[];
 for(const entry of entries){
  try{
   if(entry.type!=='blob')continue;
   const bytes=fs.readFileSync(path.join(root,entry.path));
   if(!checkBlob(entry,bytes)){drift.push(entry.path);continue;}
   if(bytes.length<=1024*1024&&!/\.(zip|br|png|jpg|jpeg|woff|pdf)$/i.test(entry.path))
     content.set(entry.path,bytes.toString('utf8'));
  }catch(e){readErrors.push({path:entry.path,error:e.code||'READ_FAILED'});}
 }
 return {head,tree,entries,content,drift,readErrors};
}
export function observe(root=ROOT){
 const source=readCheckout(root);
 const contract=JSON.parse(fs.readFileSync(path.join(root,'contracts/pr251-forensic-hypergraph-dod.json'),'utf8'));
 const graph=buildGraph(source.entries,source.content,contract);
 const candidateSubset=graph.cut_candidates.filter(c=>c.tracked&&!c.live_or_unknown_references.length&&!graph.roots.includes(c.path)).map(c=>c.path);
 const certificate=counterfactualCut(graph,candidateSubset);
 const boundedFrontier=discoverBoundedFrontier(graph);
 const payload={schema:'ikant-pr251-source-hypergraph-report/v1',source:{head:source.head,tree:source.tree,
    tracked_files:source.entries.length,tracked_bytes:source.entries.reduce((n,e)=>n+(e.bytes||0),0),
    verified_blobs:source.entries.length-source.drift.length-source.readErrors.length,
    source_drift:source.drift,read_errors:source.readErrors},metrics:{nodes:graph.nodes.length,
    edges:graph.edges.length,hyperedges:graph.hyperedges.length,roots:graph.roots.length,
    reachable:graph.reachable,missing_static_imports:graph.missing.length,
    dynamic_path_observations:graph.dynamic.length,external_specifiers:graph.external.length,
    exact_duplicate_groups:graph.duplicate_clusters.length},candidate_cuts:graph.cut_candidates,
   bounded_cut:certificate,bounded_frontier:boundedFrontier,unresolved_imports:graph.missing.slice(0,100),duplicate_clusters:graph.duplicate_clusters,
   global_dod:'HOLD',product_go:false,external_consumer_coverage:'UNKNOWN',
   limits:['lexical graph is incomplete','no runtime or provider observation','a static cut is not safe for external consumers',
   'cost optimum cannot be asserted','source drift blocks exact-readback proof']};
 const reproducible=JSON.stringify(payload);
 return {...payload,receipt_sha256:SHA256(Buffer.from(reproducible))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=observe();
 const json=JSON.stringify(report,null,2)+'\n';
 const index=process.argv.indexOf('--output');
 if(index>=0&&process.argv[index+1])fs.writeFileSync(process.argv[index+1],json,'utf8');
 else process.stdout.write(json);
 if(report.source.source_drift.length||report.source.read_errors.length)process.exitCode=2;
}
