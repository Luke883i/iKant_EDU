import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {computeBootstrapCuts} from '../scripts/project-bootstrap-cut-audit.mjs';

const names=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
 'host/project-c72-postaccept-reentry.mjs'];
const transit='host/project-c72-receipt-transit.mjs';
const seed='host/project-c72-coldstart-seed.mjs';
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0'))
 .update(b).digest('hex');
function write(root,p,content){
 const where=path.join(root,p);
 fs.mkdirSync(path.dirname(where),{recursive:true});
 fs.writeFileSync(where,content);
}
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-cut-'));
 const listed=s=>'export const '+s+'=Object.freeze(['+
  names.map(n=>"'"+n+"'").join(',')+']);\n';
 write(root,seed,listed('C72_COLDSTART_FILES'));
 write(root,'host/project-edu-h1-bound-port.mjs',listed('H1_FILES'));
 write(root,'scripts/project-c72-verified-staging.mjs',listed('NAMES'));
 write(root,transit,'// original transit fixture bytes\n');
 for(const p of names.filter(n=>n!=='BOOTSTRAP.json'))
  write(root,p,'file:'+p+'\n');
 write(root,'BOOTSTRAP.json',JSON.stringify({
  orientation_capsule:{paths:names.slice(0,5)},
  project_session:{postaccept_original_c72_transit_pin:{
   path:transit,blob_sha1:blob(fs.readFileSync(path.join(root,transit)))}}}));
 write(root,'contracts/project-session-source.json',JSON.stringify({
  paths:[...names,transit,seed]}));
 return root;
}
function atRoot(fn){
 const root=fixture();
 try{return fn(root);}finally{fs.rmSync(root,{force:true,recursive:true});}
}
test('positive: source-derived baseline and no owner claim',()=>atRoot(root=>{
 const before=fs.readdirSync(root,{recursive:true}).sort();
 const r=computeBootstrapCuts(root);
 const after=fs.readdirSync(root,{recursive:true}).sort();
 assert.deepEqual(after,before);
 assert.equal(r.current.c72.files,10);
 assert.equal(r.current.orientation.files,5);
 assert.equal(r.current.post_edu.files,10);
 assert.equal(r.original_owner_invoked,false);
 assert.equal(r.git_origin_attested,false);
 assert.equal(r.hypothetical.owner_related_subset.status,
  'NOT_EXECUTABLE_WITH_CURRENT_OWNER_GATE');
}));
test('negative: missing required Terms rejects',()=>atRoot(root=>{
 fs.rmSync(path.join(root,'TERMS.md'));
 assert.throws(()=>computeBootstrapCuts(root));
}));
test('negative: transit mutated rejects same-source pin',()=>atRoot(root=>{
 fs.appendFileSync(path.join(root,transit),'tampered');
 assert.throws(()=>computeBootstrapCuts(root),/TRANSIT_PIN_DRIFT/);
}));
test('negative: H1 and coldstart list divergence rejects',()=>atRoot(root=>{
 const p=path.join(root,'host/project-edu-h1-bound-port.mjs');
 fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('README.md','OTHER.md'));
 assert.throws(()=>computeBootstrapCuts(root),/C72_H1_STAGER_DRIFT/);
}));
test('negative: duplicate manifest path rejects',()=>atRoot(root=>{
 write(root,'contracts/project-session-source.json',
  JSON.stringify({paths:[...names,transit,seed,seed]}));
 assert.throws(()=>computeBootstrapCuts(root),/INVALID_PATH_SET/);
}));
test('negative: file symlink rejects',()=>atRoot(root=>{
 const f=path.join(root,'TERMS.md');
 fs.renameSync(f,path.join(root,'backup.txt'));
 fs.symlinkSync(path.join(root,'backup.txt'),f);
 assert.throws(()=>computeBootstrapCuts(root),/SYMLINK/);
}));
test('negative: missing manifest path rejects',()=>atRoot(root=>{
 write(root,'contracts/project-session-source.json',JSON.stringify({paths:[...names,seed]}));
 assert.throws(()=>computeBootstrapCuts(root),/MANIFEST_MISSING_C72/);
}));
test('mutational: 256 independently changed transit bytes never pass',()=>atRoot(root=>{
 const f=path.join(root,transit),base=fs.readFileSync(f);
 for(let i=0;i<256;i++){
  const mutant=Buffer.from(base);
  mutant[i%mutant.length]^=1+(i%255);
  fs.writeFileSync(f,mutant);
  assert.throws(()=>computeBootstrapCuts(root),/TRANSIT_PIN_DRIFT/);
 }
 fs.writeFileSync(f,base);
 assert.equal(computeBootstrapCuts(root).current.c72.files,10);
}));

/** Repo checkout control: Git commit/TREE/index sources are independent of
 * the local BOM calculator; this is NOT a Host tool or provider receipt. */
test('integrated checkout: 8 C72 + transit + seed, 190 EDU paths, exact byte budgets and Git HEAD blob identities',()=>{
 const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',
  maxBuffer:32*1024*1024,timeout:30000}).trim();
 const commit=git('rev-parse','HEAD');
 const tree=git('rev-parse','HEAD^{tree}');
 assert.match(commit,/^[a-f0-9]{40}$/u);
 assert.match(tree,/^[a-f0-9]{40}$/u);
 assert.equal(git('rev-parse',commit+'^{tree}'),tree);
 const report=computeBootstrapCuts(root);
 assert.deepEqual(report.current.orientation.paths,names.slice(0,5));
 assert.deepEqual(report.current.c72.paths,[...names,transit,seed]);
 assert.equal(report.current.orientation.files,5);
 assert.equal(report.current.orientation.bytes,107796);
 assert.equal(report.current.c72.files,10);
 assert.equal(report.current.c72.bytes,143817);
 assert.equal(report.current.post_edu.files,190);
 assert.equal(report.current.post_edu.bytes,1984502);
 assert.equal(report.overlap.c72_in_post_edu,10);
 assert.equal(report.hypothetical.owner_related_subset.status,
  'NOT_EXECUTABLE_WITH_CURRENT_OWNER_GATE');
 assert.equal(report.original_owner_invoked,false);
 assert.equal(report.native_provider_attested,false);
 const raw=execFileSync('git',['ls-tree','-r','-z',tree],{cwd:root,
  maxBuffer:32*1024*1024,timeout:30000});
 const gitBlobs=new Map();
 for(const line of raw.toString('utf8').split('\0').filter(Boolean)){
  const m=line.match(/^([0-7]{6}) blob ([a-f0-9]{40})\t(.+)$/u);
  if(m)gitBlobs.set(m[3],{mode:m[1],sha:m[2]});
 }
 const all=[...new Set([...report.current.orientation.paths,
  ...report.current.c72.paths,...report.current.post_edu.paths])];
 assert.equal(all.length,190,'all C72 files must be in Project EDU closure');
 let bytesChecked=0;
 for(const p of all){
  const entry=gitBlobs.get(p);
  assert.ok(entry,'missing pinned Git TREE path '+p);
  const full=path.join(root,p);
  assert.equal(fs.lstatSync(full).isSymbolicLink(),false,'symlink: '+p);
  assert.equal(fs.statSync(full).isFile(),true,'not a regular file: '+p);
  const bytes=fs.readFileSync(full);
  bytesChecked+=bytes.length;
  assert.equal(blob(bytes),entry.sha,'Git SHA-1 differs from local readback: '+p);
 }
 assert.equal(bytesChecked,1984502,'all 190 local source bytes verified against HEAD TREE');
});
