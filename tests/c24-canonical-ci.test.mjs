import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {canonicalPlan,receiptFor,verifyReceipts} from '../scripts/c24-canonical-ci.mjs';
const SHA='a'.repeat(40);
function fixture(plan){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c24-'));
 for(const s of plan.shards)fs.writeFileSync(path.join(dir,'c24-'+s.name+'.json'),JSON.stringify(receiptFor(s.name,SHA,plan)));
 return dir;
}
test('all original 36 canonical commands are covered once in order',()=>{
 const p=canonicalPlan();
 assert.equal(p.commands.length,36);assert.equal(p.shards.length,7);
 assert.deepEqual(p.shards.flatMap(s=>s.commands),p.commands);
 assert.deepEqual(p.shards.filter(s=>s.name.startsWith('recovery-')).map(s=>s.commands),
  [['npm run falsify:c42'],['npm run falsify:c43']]);
});
test('fail closed on missing, altered, forged or wrong-source receipt',()=>{
 const p=canonicalPlan(),dir=fixture(p);
 try{
  assert.equal(verifyReceipts(dir,SHA,p).status,'PASS');
  assert.throws(()=>verifyReceipts(dir,'b'.repeat(40),p),/Receipt changed/);
  const f=path.join(dir,'c24-foundation.json'),raw=fs.readFileSync(f,'utf8');
  fs.writeFileSync(f,raw.replace('PASS','SKIPPED'));
  assert.throws(()=>verifyReceipts(dir,SHA,p),/Receipt changed/);
  fs.writeFileSync(f,raw);fs.unlinkSync(f);
  assert.throws(()=>verifyReceipts(dir,SHA,p),/ENOENT/);
  fs.writeFileSync(f,raw);fs.writeFileSync(path.join(dir,'c24-forged.json'),'{}');
  assert.throws(()=>verifyReceipts(dir,SHA,p),/Unexpected receipt/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('canonical inventory changes require a new explicit plan',()=>{
 const p=canonicalPlan(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'c24-package-'));
 try{
  const out=x=>fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({scripts:{'qualify:canonical':x.join(' && ')}}));
  out(p.commands.slice(0,-1));assert.throws(()=>canonicalPlan(dir),/inventory changed/);
  out(p.commands.slice(0,29).concat(p.commands[30],p.commands[29],p.commands.slice(31)));
  assert.throws(()=>canonicalPlan(dir),/ordering changed|digest changed/);
  out(p.commands.slice(0,-1).concat('rm -rf /'));
  assert.throws(()=>canonicalPlan(dir),/inventory changed/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
