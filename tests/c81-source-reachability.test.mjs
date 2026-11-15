import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {buildC77Capsule} from '../scripts/c77-build-capsule.mjs';
import {createC81LocalGitProof} from '../scripts/c81-create-git-proof.mjs';
import {verifyC81SourceReachability} from '../host/c81-git-source-reachability.mjs';

const ROOT=new URL('../',import.meta.url);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function fixture(){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c81-'));
 const dir=path.join(temp,'capsule');
 const built=buildC77Capsule({outDir:dir});
 const content=createC81LocalGitProof({manifestPath:path.join(dir,'c77-manifest.json')});
 const proof=content.proof;
 return {temp,dir,built,proof,verification:content.verification};
}
const cleanup=t=>fs.rmSync(t.temp,{recursive:true,force:true});
const safe=p=>verifyC81SourceReachability(p);
test('C81 genuine checked out commit SHA and actual raw tree bytes reach every original C77 module',()=>{
 const t=fixture();
 try{
  const result=safe(t.proof);
  assert.equal(result.status,'C81_GIT_REACHABILITY_VERIFIED',JSON.stringify(result));
  assert.equal(result.expected_source_head,execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim());
  assert.ok(result.reachable_original_git_blobs>=25);
  assert.ok(result.unique_tree_objects>=5);
  assert.equal(result.git_object_hashes_matched,true);
  assert.equal(result.git_paths_reachable,true);
  assert.equal(result.origin_independently_attested,false);
  assert.equal(result.build_derivation_independently_attested,false);
  assert.equal(result.first_unclosed_edge,'HOST_PINNED_GITHUB_REF_ORIGIN');
  assert.equal(result.active,false);
  assert.equal(t.verification.status,'C81_GIT_REACHABILITY_VERIFIED');
 }finally{cleanup(t);}
});
test('C81 actual subprocess produces independently recheckable Git object proof',()=>{
 const t=fixture();
 try{
  const out=path.join(t.temp,'c81.json');
  const p=spawnSync(process.execPath,['scripts/c81-create-git-proof.mjs',
   '--manifest',path.join(t.dir,'c77-manifest.json'),'--output',out],{
   cwd:ROOT,encoding:'utf8',timeout:60000,maxBuffer:3e6});
  assert.equal(p.status,0,p.stderr+' '+p.stdout.slice(0,450));
  const data=JSON.parse(fs.readFileSync(out));
  assert.equal(safe(data.proof).status,'C81_GIT_REACHABILITY_VERIFIED');
  assert.equal(data.github_native_origin_attested,false);
  assert.equal(data.active,false);
 }finally{cleanup(t);}
});
test('C81 1000 deterministic true Git object and C77 manifest mutation attempts must be rejected',()=>{
 const t=fixture();let count=0;
 try{
  const proof=t.proof;
  for(let i=0;i<1000;i++){
   const mutated=structuredClone(proof),n=Math.floor(i/10),kind=i%10;
   const bad=n.toString(16).padStart(40,'0');
   switch(kind){
    case 0: mutated.expectedSourceHead=bad;break;
    case 1: mutated.expectedManifestSha256=n.toString(16).padStart(64,'0');break;
    case 2:{
     const b=Buffer.from(mutated.commitBase64,'base64');b[20+n%b.length]^=1;
     mutated.commitBase64=b.toString('base64');break;
    }
    case 3:{
     const obj=mutated.treeObjects[n%mutated.treeObjects.length];
     const b=Buffer.from(obj.content_base64,'base64');b[(n*17)%b.length]^=1;
     obj.content_base64=b.toString('base64');break;
    }
    case 4: mutated.treeObjects.splice(n%mutated.treeObjects.length,1);break;
    case 5: mutated.treeObjects.push(structuredClone(mutated.treeObjects[0]));break;
    case 6:{
     const m=JSON.parse(Buffer.from(mutated.manifestBase64,'base64'));
     const target=m.files.find(x=>x.path==='README.md');
     target.original_source_blob_sha1='f'.repeat(40);
     const b=Buffer.from(JSON.stringify(m));
     mutated.manifestBase64=b.toString('base64');
     mutated.expectedManifestSha256=sha(b);break;
    }
    case 7:{
     const m=JSON.parse(Buffer.from(mutated.manifestBase64,'base64'));
     const target=m.files.find(x=>x.path==='README.md');
     target.path='README-'+n+'.md';
     const b=Buffer.from(JSON.stringify(m));
     mutated.manifestBase64=b.toString('base64');
     mutated.expectedManifestSha256=sha(b);break;
    }
    case 8: mutated.treeObjects[0].sha1=bad;break;
    case 9:{
     const m=JSON.parse(Buffer.from(mutated.manifestBase64,'base64'));
     m.source_head='a'.repeat(40);
     const b=Buffer.from(JSON.stringify(m));
     mutated.manifestBase64=b.toString('base64');
     mutated.expectedManifestSha256=sha(b);break;
    }
   }
   const result=safe(mutated);
   assert.equal(result.status,'C81_STOP',JSON.stringify({i,kind,result}));
   assert.equal(result.active,false);
   assert.equal(result.origin_independently_attested,false);
   count++;
  }
  assert.equal(count,1000);
 }finally{cleanup(t);}
});
test('C81 negative controls: synthetic reference SHA cannot confer GitHub provenance',()=>{
 const t=fixture();
 try{
  const ok=safe(t.proof);
  assert.equal(ok.status,'C81_GIT_REACHABILITY_VERIFIED');
  assert.equal(ok.origin_independently_attested,false);
  assert.equal(ok.native_chat_delivery_attested,false);
  const modified=structuredClone(t.proof);
  modified.expectedSourceHead='0'.repeat(40);
  assert.equal(safe(modified).status,'C81_STOP');
  assert.equal(safe({...t.proof,treeObjects:[]}).status,'C81_STOP');
 }finally{cleanup(t);}
});
