import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
const blobHash=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const paths=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md','contracts/c72.json','host/c72.mjs','host/postaccept.mjs','host/transit.mjs'];
const SEED=0x1926a11;
let x=SEED;function random(){x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;}
test('100 physical mutations fail independent commit/TREE path binding',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-r6-physical-'));
 try{
  git(root,'init','-q');const original=new Map();
  for(const [i,p] of paths.entries()){
   const b=Buffer.from('original source #'+String(i)+' '+p+'\n');original.set(p,b);
   const target=path.join(root,p);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b);
  }
  git(root,'add','.');git(root,'-c','user.name=R6','-c','user.email=r6@example.invalid','commit','-qm','immutable fixture');
  const pinned=Object.fromEntries(git(root,'ls-tree','-r','HEAD').split('\n').map(line=>{
   const [metadata,p]=line.split('\t');return [p,metadata.split(' ')[2]];
  }));
  assert.equal(Object.keys(pinned).length,9);
  let rejected=0,readbacks=0;
  for(let i=0;i<100;i++){
   const victim=paths[random()%paths.length],other=paths[(paths.indexOf(victim)+1)%paths.length];
   const stage=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-r6-mut-'));
   try{
    const target=path.join(stage,'candidate');
    if(i%10===0){fs.symlinkSync(path.join(root,other),target);assert.equal(fs.lstatSync(target).isSymbolicLink(),true);rejected++;continue;}
    let b=Buffer.from(i%3===0?original.get(other):original.get(victim));
    if(i%3!==0)b[0]^=1+(i%7);
    fs.writeFileSync(target,b,{flag:'wx',mode:0o600});
    const reopened=fs.readFileSync(target);assert.deepEqual(reopened,b);readbacks++;
    assert.notEqual(blobHash(reopened),pinned[victim]);rejected++;
   }finally{fs.rmSync(stage,{recursive:true,force:true});}
  }
  assert.equal(rejected,100);assert.equal(readbacks,90);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
