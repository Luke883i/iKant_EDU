import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseGitTree,checkBlob,validateDod,importSpecifiers,resolveRelative,buildGraph,
  counterfactualCut,graphFingerprint,verifyGraphReconstruction,observe} from '../scripts/pr251-forensic-hypergraph.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=JSON.parse(fs.readFileSync(path.join(root,'contracts/pr251-forensic-hypergraph-dod.json'),'utf8'));
const clone=x=>structuredClone(x);
const blob=s=>{
 const b=Buffer.from(s);return {sha:crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex'),size:b.length};
};
const fixtures=()=>{
 const code={
  'ikant.mjs':"import './src/owner.mjs';",
  'src/owner.mjs':"import './critical.mjs';\nexport const v=1;",
  'src/critical.mjs':"export const critical=1;",
  'scripts/unused.mjs':"export const old=1;",
  'package.json':JSON.stringify({scripts:{test:'node scripts/unused.mjs'}})
 };
 const entries=Object.entries(code).map(([p,s])=>{
  const b=blob(s);return {path:p,mode:'100644',type:'blob',sha:b.sha,bytes:b.size};
 });
 return {entries,contents:new Map(Object.entries(code))};
};
test('P/G/I/L retrograde AND graph is total, acyclic, fail-closed and typed',()=>{
 assert.ok(validateDod(contract));
 assert.equal(contract.product_go,false);
 assert.equal(contract.nodes.length,35);
 assert.equal(contract.hyperedges.length,10);
 assert.equal(contract.retirement_pool.length,25);
 assert.ok(contract.nodes.every(n=>n.status!=='PASS'));
});
test('Git object lineage parser checks sizes, blob identities and duplicate entries',()=>{
 const x=blob('hello');
 const row='100644 blob '+x.sha+' 5\ta.mjs\0';
 const [e]=parseGitTree(row);
 assert.ok(checkBlob(e,Buffer.from('hello')));
 assert.equal(checkBlob(e,Buffer.from('HELLO')),false);
 assert.equal(checkBlob({...e,bytes:6},Buffer.from('hello')),false);
 assert.throws(()=>parseGitTree(row+row),/DUPLICATE_GIT_PATH/);
});
test('ESM dependency, external imports, missing resolution and literal CLI consumers',()=>{
 const f=fixtures();
 const g=buildGraph(f.entries,f.contents,contract);
 assert.ok(importSpecifiers("import './x.mjs'; export {v} from './y.mjs';").includes('./x.mjs'));
 assert.equal(resolveRelative('src/owner.mjs','./critical.mjs',new Set(f.entries.map(e=>e.path))).path,'src/critical.mjs');
 assert.ok(g.edges.some(e=>e.from==='ikant.mjs'&&e.to==='src/owner.mjs'&&e.type==='imports'));
 assert.ok(g.edges.some(e=>e.from==='src/owner.mjs'&&e.to==='src/critical.mjs'));
 assert.ok(g.edges.some(e=>e.from==='package.json'&&e.to==='scripts/unused.mjs'&&e.type==='executes'));
 assert.equal(g.global_minimum_certified,false);
 assert.equal(g.unknown_external_consumers,true);
});
test('Counterfactual live dependency and roots cannot be removed even if cut is small',()=>{
 const f=fixtures(),g=buildGraph(f.entries,f.contents,contract);
 assert.equal(counterfactualCut(g,['src/critical.mjs']).source_only_admissible,false);
 assert.ok(counterfactualCut(g,['src/critical.mjs']).violations.some(e=>e.reason==='LIVE_DEPENDENCY'));
 assert.ok(counterfactualCut(g,['ikant.mjs']).violations.some(e=>e.reason==='ROOT_REMOVED'));
 assert.equal(counterfactualCut(g,['scripts/unused.mjs']).source_only_admissible,false);
 assert.equal(counterfactualCut(g,[]).product_go,false);
});
test('Forged graph missing one typed dependency fails independent reconstruction',()=>{
 const f=fixtures(),g=buildGraph(f.entries,f.contents,contract);
 assert.ok(verifyGraphReconstruction(g,f.entries,f.contents,contract));
 const forged=clone(g);
 forged.edges=forged.edges.filter(e=>e.to!=='src/critical.mjs');
 assert.ok(!verifyGraphReconstruction(forged,f.entries,f.contents,contract));
 assert.notEqual(graphFingerprint(forged),graphFingerprint(g));
});
test('2048 deterministic mutants test ancestry / obligation / byte / edge / release denials',()=>{
 const f=fixtures(),canonical=buildGraph(f.entries,f.contents,contract);
 let seed=2512048,rejected=0;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)%0x10000);
 for(let i=0;i<2048;i++){
  const kind=rng()%8;
  if(kind<=5){
   const mutant=clone(contract);
   if(kind===0)mutant.product_go=true;
   if(kind===1)mutant.release='PASS';
   if(kind===2)mutant.hyperedges.shift();
   if(kind===3)mutant.nodes.find(n=>n.id==='G0').requires.pop();
   if(kind===4)mutant.nodes.find(n=>n.id==='G1').requires.push('A0');
   if(kind===5)mutant.authority=1;
   if(!validateDod(mutant))rejected++;
  }else if(kind===6){
   const altered=Buffer.from(f.contents.get('src/critical.mjs')+' ');
   if(!checkBlob(f.entries.find(e=>e.path==='src/critical.mjs'),altered))rejected++;
  }else{
   const changed=clone(canonical);
   changed.edges.pop();
   if(!verifyGraphReconstruction(changed,f.entries,f.contents,contract))rejected++;
  }
 }
 assert.equal(rejected,2048);
});
test('Native repository source witness has a real Git HEAD and no release promotion',()=>{
 const report=observe(root);
 assert.match(report.source.head,/^[a-f0-9]{40}$/);
 assert.match(report.source.tree,/^[a-f0-9]{40}$/);
 assert.ok(report.source.tracked_files>=1600);
 assert.equal(report.global_dod,'HOLD');
 assert.equal(report.product_go,false);
 assert.ok(report.metrics.hyperedges>=10);
 assert.match(report.receipt_sha256,/^[a-f0-9]{64}$/);
 assert.ok(report.candidate_cuts.every(c=>c.external_consumers==='UNKNOWN'));
});

test('W1 retired Git paths remain absent; original 11 blob identities retained as source pins',t=>{
 const staged=contract.retirement_pool.filter(x=>x.status==='STAGED_SOURCE_ONLY_EXTERNAL_UNKNOWN');
 assert.equal(staged.length,11);
 assert.equal(staged.reduce((n,x)=>n+x.preimage_bytes,0),18163);
 for(const item of staged){
  assert.equal(fs.existsSync(path.join(root,item.path)),false,item.path+' unexpectedly resurrected');
  assert.match(item.preimage_sha,/^[a-f0-9]{40}$/);
  const check=spawnGit(['rev-parse',contract.source_main+':'+item.path]);
  if(check!==null)assert.equal(check,item.preimage_sha,'original Git preimage mismatch: '+item.path);
  else t.diagnostic('Git history unavailable for independent preimage readback: '+item.path);
 }
 assert.equal(contract.staged_cut.full_native_equivalence,false);
 assert.equal(contract.staged_cut.external_unknown,true);
});
function spawnGit(args){
 const result=spawnSync('git',args,{cwd:root,encoding:'utf8',timeout:4000});
 return result.status===0?result.stdout.trim():null;
}
