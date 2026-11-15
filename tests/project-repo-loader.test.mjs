import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {verifyRepositoryPlan,materializeRepositoryPlan,verifyLocalProjectSource} from '../scripts/project-repo-loader.mjs';
const git=(type,b)=>createHash('sha1').update(Buffer.from(`${type} ${b.length}\0`)).update(b).digest('hex');
function fixture(){
 const raw={'contracts/project-session-source.json':JSON.stringify({schema:'ikant-le-project-session-source/v1',paths:['a.mjs']}),'a.mjs':'export const value=1;\n'};
 const manifest=Buffer.from(raw['contracts/project-session-source.json']);const a=Buffer.from(raw['a.mjs']);
 const mb=git('blob',manifest),ab=git('blob',a);
 const ct=git('tree',Buffer.concat([Buffer.from('100644 project-session-source.json\0'),Buffer.from(mb,'hex')]));
 const rt=git('tree',Buffer.concat([Buffer.from('100644 a.mjs\0'),Buffer.from(ab,'hex'),Buffer.from('40000 contracts\0'),Buffer.from(ct,'hex')]));
 const head='a'.repeat(40);const tree=[{path:'a.mjs',sha:ab,type:'blob',mode:'100644'},{path:'contracts',sha:ct,type:'tree',mode:'040000'},{path:'contracts/project-session-source.json',sha:mb,type:'blob',mode:'100644'}];
 return{expected:{head,tree:rt},plan:{source_head:head,source_tree:rt,live_head:head,tree,truncated:false,files:Object.entries(raw).map(([p,c])=>({path:p,encoding:'base64',content:Buffer.from(c).toString('base64')}))}};
}
test('API tree and original blob bytes materialize without any ZIP and reopen',()=>{
 const {plan,expected}=fixture(),parent=fs.mkdtempSync(path.join(os.tmpdir(),'project-source-')),destination=path.join(parent,'source');
 try{assert.equal(verifyRepositoryPlan(plan,expected).files.size,2);materializeRepositoryPlan(plan,{...expected,destination});
 assert(verifyLocalProjectSource(destination,expected));assert.throws(()=>materializeRepositoryPlan(plan,{...expected,destination}),/FRESH/);
 fs.appendFileSync(path.join(destination,'a.mjs'),'bad');assert.throws(()=>verifyLocalProjectSource(destination,expected),/CHANGED/);
 }finally{fs.rmSync(parent,{recursive:true,force:true});}
});
test('stale, corrupt, missing, duplicate, traversal, orphan and truncated source fail closed',()=>{
 for(const mutate of [p=>p.live_head='b'.repeat(40),p=>p.files[0].content='YmFk',p=>p.files.pop(),p=>p.files.push(p.files[0]),p=>p.tree[0].path='../a',p=>p.tree[0].path='orphan/a',p=>p.truncated=true,p=>p.tree[0].sha='c'.repeat(40)]){
  const {plan,expected}=fixture();mutate(plan);assert.throws(()=>verifyRepositoryPlan(plan,expected));
 }
});
test('rewriting receipt hash or removing a source entry cannot bless tampered local code',()=>{
 const {plan,expected}=fixture(),parent=fs.mkdtempSync(path.join(os.tmpdir(),'project-source-')),destination=path.join(parent,'source');
 try{materializeRepositoryPlan(plan,{...expected,destination});const rp=path.join(destination,'.project-source-readback.json');const r=JSON.parse(fs.readFileSync(rp));
 fs.writeFileSync(path.join(destination,'a.mjs'),'tampered');r.files.find(x=>x.path==='a.mjs').git_blob_sha1=git('blob',Buffer.from('tampered'));fs.writeFileSync(rp,JSON.stringify(r));assert.throws(()=>verifyLocalProjectSource(destination,expected),/IDENTITY/);
 r.files=r.files.filter(x=>x.path!=='a.mjs');fs.writeFileSync(rp,JSON.stringify(r));assert.throws(()=>verifyLocalProjectSource(destination,expected),/INCOMPLETE/);
 }finally{fs.rmSync(parent,{recursive:true,force:true});}
});
