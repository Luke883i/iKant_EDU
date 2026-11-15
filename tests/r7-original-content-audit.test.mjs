import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SCRIPT=path.join(ROOT,'scripts/r7-original-content-audit.py');
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const python=(...args)=>spawnSync('python3',[SCRIPT,...args],{encoding:'utf8',maxBuffer:8*1024*1024,timeout:120000});
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'ikant-r7-'));

function fixture() {
 const dir=temp();
 git(dir,'init','-q');
 git(dir,'config','user.email','r7@example.invalid');
 git(dir,'config','user.name','R7 Test');
 fs.mkdirSync(path.join(dir,'src'),{recursive:true});
 fs.mkdirSync(path.join(dir,'docs'),{recursive:true});
 fs.writeFileSync(path.join(dir,'src/a.mjs'),"import {beta} from './b.mjs'; export const alpha=beta;\n");
 fs.writeFileSync(path.join(dir,'src/b.mjs'),"export const beta = 1;\n");
 fs.writeFileSync(path.join(dir,'docs/README.md'),"# Intro\n[go](../src/a.mjs)\n");
 fs.writeFileSync(path.join(dir,'config.json'),'{"example":true}\n');
 fs.writeFileSync(path.join(dir,'events.jsonl'),'{"a":1}\n{"b":2}\n');
 git(dir,'add','.');
 git(dir,'commit','-qm','R7 adversarial fixture');
 return {dir,head:git(dir,'rev-parse','HEAD')};
}

test('R7 on actual Git source: every tracked original blob and 11 leaf obligations indexed',()=>{
 const dir=temp(),out=path.join(dir,'atlas.json'),head=git(ROOT,'rev-parse','HEAD');
 try{
  const run=python('--repo',ROOT,'--expected-head',head,'--out',out);
  assert.equal(run.status,0,run.stdout+' '+run.stderr);
  const report=JSON.parse(fs.readFileSync(out,'utf8'));
  const files=git(ROOT,'ls-files','-z').split('\0').filter(Boolean);
  assert.equal(report.source_head,head);
  assert.equal(report.measurements.file_count,files.length);
  assert.equal(report.cards.length,files.length);
  assert.equal(report.measurements.dimensions_total,files.length*11);
  assert.equal(report.measurements.dimensions_proved,0);
  assert.equal(report.measurements.all_original_bytes_reopened,true);
  assert.ok(report.cards.every(c=>c.dod_dimensions.length===11));
  assert.ok(report.cards.every(c=>c.semantic_status==='HYPOTHESIS_NOT_INDEPENDENTLY_PROVED'));
  assert.equal(report.all_file_semantics_proven,false);
  assert.equal(report.product_go,false);
  console.log('R7_ORIGINAL_SOURCE_ATLAS_SHA256='+digest(fs.readFileSync(out)));
  console.log('R7_ORIGINAL_FILE_COUNT='+files.length);
  console.log('R7_ORIGINAL_TYPED_EDGES='+report.measurements.typed_edges);
  console.log('R7_SOURCE_ONLY_UNCLOSED_DIMENSIONS='+report.measurements.dimensions_total);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('R7 independent oracle rejects false semantic closure and tampered source evidence',()=>{
 const {dir,head}=fixture(),out=path.join(dir,'../atlas-'+path.basename(dir)+'.json');
 try{
  const p=python('--repo',dir,'--expected-head',head,'--out',out);
  assert.equal(p.status,0,p.stdout+' '+p.stderr);
  const baseline=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(baseline.cards.length,5);
  assert.ok(baseline.edges.some(e=>e.consumer==='src/a.mjs'&&e.target==='src/b.mjs'));
  assert.ok(baseline.edges.some(e=>e.consumer==='docs/README.md'&&e.target==='src/a.mjs'));
  assert.equal(baseline.cards.find(c=>c.path==='events.jsonl').structure.status,'PARSED');
  const changes=[
   r=>{r.product_go=true},
   r=>{r.all_file_semantics_proven=true},
   r=>{r.retirement_authorized=true},
   r=>{r.cards[0].semantic_status='PROVEN'},
   r=>{r.cards[0].safe_to_retire=true},
   r=>{r.cards[0].dod_dimensions[0].status='PASS'},
   r=>{r.cards[0].git_sha1='0'.repeat(40)},
   r=>{r.cards[0].sha256='0'.repeat(64)},
   r=>{r.cards[0].role_hypothesis='CERTIFIED_RUNTIME'},
   r=>{r.cards[0].structure.units=['FORGED']},
   r=>{r.cards[0].incoming+=1},
   r=>{r.measurements.file_count=99},
   r=>{r.measurements.typed_edges=99},
   r=>{r.edges[0].consumer_blob='0'.repeat(40)},
   r=>{r.cards.pop()},
  ];
  for(let i=0;i<changes.length;i++){
   const altered=structuredClone(baseline);
   changes[i](altered);
   fs.writeFileSync(out,JSON.stringify(altered));
   const v=python('--repo',dir,'--expected-head',head,'--verify',out);
   assert.notEqual(v.status,0,'false PASS for mutant '+i+' '+v.stdout);
  }
  fs.writeFileSync(out,JSON.stringify(baseline));
  fs.appendFileSync(path.join(dir,'src/a.mjs'),'// source drift\n');
  const drift=python('--repo',dir,'--expected-head',head,'--out',out);
  assert.notEqual(drift.status,0,'dirty tracked source accepted');
  const mismatch=python('--repo',dir,'--expected-head','0'.repeat(40),'--verify',out);
  assert.notEqual(mismatch.status,0,'wrong source head accepted');
  console.log('R7_MUTANTS_KILLED='+changes.length+'/15; source-drift and epoch mismatch denied');
 }finally{
  fs.rmSync(dir,{recursive:true,force:true});
  fs.rmSync(out,{force:true});
 }
});
