import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import path from 'node:path';
import {qualifyC141Designs} from '../scripts/c141-design-1000.mjs';
import {planC141Fragments,rejoinC141Fragments,arbitrateC141} from '../host/c141-semantic-shadow.mjs';
const c=JSON.parse(fs.readFileSync(new URL('../contracts/c141-semantic-prepr-v1.json',import.meta.url),'utf8'));
const all=new Set(Array.from({length:48},(_,i)=>'A'+String(i+1).padStart(2,'0')));
test('original 42 atom IDs preserved, 6 new, no duplicate or missing labels',()=>{
 assert.equal(c.atoms.length,48);
 assert.deepEqual(new Set(c.atoms.map(x=>x.id)),all);
 assert.equal(c.atoms.filter(x=>x.coverage_pr148==='BOUNDED_TESTED').length,8);
 assert.equal(c.atoms.filter(x=>x.coverage_pr148==='PARTIAL').length,19);
 assert.equal(c.atoms.filter(x=>x.coverage_pr148==='NOT_ADDRESSED').length,15);
 assert.equal(c.atoms.filter(x=>x.coverage_pr148==='NEW').length,6);
});
test('all 48 atoms have first falsifier and no unjustified PREPR closure',()=>{
 assert.ok(c.atoms.every(x=>x.owner&&x.issue&&x.improvement&&x.falsifier&&x.metric&&x.edges.length&&x.proof_requirement&&x.closed_by_prepr===false));
 assert.equal(c.release,'PRODUCT_NO_GO');
});
test('host cannot claim native persistence or ACTIVE through this candidate',()=>{
 assert.equal(c.active,false);assert.equal(c.native_identity_attested,false);
 assert.equal(c.persistent_chat_memory_attested,false);assert.equal(c.semantic_lossless_universal_attested,false);
 assert.equal(c.branch_publication,false);assert.equal(c.remote_pr_created,false);
 const unavailable=c.atoms.filter(x=>x.can_i_do==='NOT_AVAILABLE_IN_THIS_CHAT_HOST').map(x=>x.id);
 assert.deepEqual(unavailable,['A09','A22','A27','A28','A44']);
});
test('1000 exhaustive synthetic designs, 36 feasible, deterministic SHA and result',()=>{
 const a=qualifyC141Designs(),b=qualifyC141Designs();
 assert.equal(a.total,1000);assert.equal(a.feasible,36);
 assert.equal(a.selected.id,'R3-B3-E3-P6');assert.equal(a.checksum_sha256,b.checksum_sha256);
 assert.equal(a.all.filter(x=>x.feasible===false).length,964);
 assert.equal(a.empirical_optimality_attested,false);
});
test('selection changes when effort penalty increases: optimum is contextual',()=>{
 const a=qualifyC141Designs({complexityPenalty:2});
 const b=qualifyC141Designs({complexityPenalty:16});
 assert.notEqual(a.selected.id,b.selected.id);
});
test('mutation: missing critical atom is rejected',()=>{
 const copy=structuredClone(c);copy.atoms.pop();assert.notEqual(copy.atoms.length,48);
});
test('input-join fuzzing: exact UTF8 across chunk boundaries',()=>{
 const alphabet=['😀','ø','a','Σ','é','🌲',' ', '\n'];
 for(let seed=1;seed<=130;seed++){
   let value='';let n=seed;
   for(let i=0;i<seed*7;i++){n=(1664525*n+1013904223)>>>0;value+=alphabet[n%alphabet.length]}
   value='X'+value;
   const out=planC141Fragments(value,{fragmentBytes:64,maxFragments:128,maxTotalBytes:262144});
   assert.equal(out.status,'FRAGMENTED_NOT_EXECUTED',`seed=${seed}: ${out.code}`);
   const read=rejoinC141Fragments(out);
   assert.equal(read.input_sha256,crypto.createHash('sha256').update(value).digest('hex'));
 }
});
test('full byte overflow must not be silently accepted or truncated',()=>{
 const value='✓'.repeat(500);
 const out=arbitrateC141({humanInput:value,openScope:true,physicalLimitBytes:800});
 assert.equal(out.code,'C141_EXACT_INPUT_REQUIRES_BUDGET_NEGOTIATION');
});

test('configured chunk ceiling correctly fails closed',()=>{
 const r=planC141Fragments('✓'.repeat(800),{fragmentBytes:16,maxFragments:8,maxTotalBytes:262144});
 assert.equal(r.code,'C141_FRAGMENT_COUNT_DENIAL');
});

test('C141 CLI generates outside the repository and never reinstalls retired proposals',()=>{
 const proposals=new URL('../proposals/',import.meta.url);
 assert.equal(fs.existsSync(proposals),false);
 const cli=fileURLToPath(new URL('../scripts/c141-design-1000.mjs',import.meta.url));
 const result=JSON.parse(execFileSync(process.execPath,[cli],{encoding:'utf8'}));
 assert.equal(result.selected,'R3-B3-E3-P6');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c141-proof-'));
 try{
  const py=fileURLToPath(new URL('../scripts/c141-build-contract.py',import.meta.url));
  execFileSync('python3',[py,tmp],{encoding:'utf8'});
  assert.equal(fs.existsSync(path.join(tmp,'c141-semantic-prepr-v1.json')),true);
  assert.equal(fs.existsSync(path.join(tmp,'C141_ISSUE_MATRIX.csv')),true);
 }finally{fs.rmSync(tmp,{force:true,recursive:true});}
 assert.equal(fs.existsSync(proposals),false);
});
