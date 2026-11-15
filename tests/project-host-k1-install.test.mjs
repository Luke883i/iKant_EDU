import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {installK1Private,K1_INSTALL_FILES} from '../scripts/project-host-k1-install-cli.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
test('physical local installer: original Git closure, 12 exact SHA files, import, no owner/provider',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-k1-install-test-'));fs.chmodSync(root,0o700);
 try{
  const target=path.join(root,'private-install');
  const r=installK1Private({repo,head,target});
  assert.equal(r.ok,true,JSON.stringify(r));
  assert.equal(r.files_installed,K1_INSTALL_FILES.length);
  assert.equal(r.original_owner_invoked,false);
  assert.equal(r.provider_installation_attested,false);
  for(const row of r.installed){
   assert.ok(K1_INSTALL_FILES.includes(row.path));
   const calculated=execFileSync('git',['hash-object',path.join(target,row.path)],{cwd:repo,encoding:'utf8'}).trim();
   assert.equal(calculated,row.git_blob_sha1);
  }
  const m=await import(pathToFileURL(path.join(target,'host/project-host-k1-preowner.mjs')).href);
  assert.equal(typeof m.runK1PreOwner,'function');
  const again=installK1Private({repo,head,target});
  assert.equal(again.ok,false);assert.equal(again.edge,'K1_INSTALL_TARGET_ALREADY_EXISTS');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('installer rejects wrong commit and non-absolute path without an effect',()=>{
 assert.equal(installK1Private({repo,head:'BROKEN',target:'/tmp/k1-reject-should-not-exist'}).edge,'K1_INSTALL_INPUT_INVALID');
 assert.equal(installK1Private({repo,head,target:'relative'}).edge,'K1_INSTALL_INPUT_INVALID');
});
