import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync,execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
test('real candidate Git archive -> full source plan -> original Node full-tree physical readback',()=>{
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'oneshell-git-cold-'));
 const zip=path.join(tmp,'original.zip'),treeFile=path.join(tmp,'tree.json'),plan=path.join(tmp,'plan.json'),dest=path.join(tmp,'source');
 try{
  const archive=spawnSync('git',['archive','--format=zip','--prefix=iKant_EDU-'+head+'/','HEAD','-o',zip],{cwd:root,encoding:'utf8'});
  assert.equal(archive.status,0,archive.stderr);
  const entries=execFileSync('git',['ls-tree','-r','-t','-z','HEAD'],{cwd:root});
  const rows=entries.toString('utf8').split('\0').filter(Boolean).map(v=>{
   const split=v.indexOf('\t');
   assert(split>0);
   const [mode,type,sha]=v.slice(0,split).split(' ');
   return {path:v.slice(split+1),mode,type,sha};
  });
  assert(rows.length>100);
  fs.writeFileSync(treeFile,JSON.stringify({source_head:head,source_tree:tree,live_head:head,truncated:false,tree:rows}));
  const py=spawnSync('python3',[path.join(root,'scripts/project-manual-source.py'),
   '--source-zip',zip,'--api-tree',treeFile,'--head',head,'--tree',tree,'--output-plan',plan],{encoding:'utf8'});
  assert.equal(py.status,0,py.stderr+py.stdout);
  const saved=JSON.parse(fs.readFileSync(plan,'utf8'));
  assert.equal(saved.files.length,JSON.parse(fs.readFileSync(path.join(root,'contracts/project-session-source.json'))).paths.length+1);
  const node=spawnSync(process.execPath,[path.join(root,'scripts/project-repo-loader.mjs'),plan,dest,head,tree],{encoding:'utf8'});
  assert.equal(node.status,0,node.stderr+node.stdout);
  const reopen=JSON.parse(fs.readFileSync(path.join(dest,'.project-source-readback.json')));
  assert.equal(reopen.source_head,head);
  assert.equal(reopen.source_tree,tree);
  assert.equal(reopen.files.length,saved.files.length);
  assert.equal(fs.readFileSync(path.join(dest,'host/project-oneshell-edu.mjs'),'utf8'),
    fs.readFileSync(path.join(root,'host/project-oneshell-edu.mjs'),'utf8'));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
