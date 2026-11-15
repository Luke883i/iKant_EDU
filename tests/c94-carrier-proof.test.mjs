import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {acquireC94Artifact,buildC94C84AutoPackage,createC94GitHubHTTPS} from '../host/c94-auto-artifact-carrier.mjs';
import {serializeGitHubTree,serializeGitHubCommit,assembleC94GitProof,gitSha} from '../host/c94-git-api-proof.mjs';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
const SHA='66f074b34f34455b3c4188703d83ad71316baa06';
const artifactPath=process.env.C94_C77_TEST_ZIP||fileURLToPath(new URL('./fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const available=fs.existsSync(artifactPath);
const artifact=available?fs.readFileSync(artifactPath):null;
function mockActions({ref=SHA,runHead=SHA,expired=false,modify=false}={}){
 const records=[];
 return {records,async json(p){records.push(p);if(p.includes('/git/ref/heads/main'))return {ref:'refs/heads/main',object:{sha:ref}};
  if(p.includes('/actions/workflows/'))return {workflow_runs:[{id:12345,head_sha:runHead,status:'completed',conclusion:'success'}]};
  if(p.includes('/actions/runs/'))return {artifacts:[{id:56789,name:'c77-qualified-standalone-microcapsule',expired,size_in_bytes:artifact.length}]};
  throw Error('UNEXPECTED_API '+p);},async bytes(p){records.push(p);const b=Buffer.from(artifact);if(modify)b[1200]^=1;return b;}};
}
function buildFakeGitTree(node){
 const names=Object.keys(node).sort((a,b)=>Buffer.compare(Buffer.from(a+(typeof node[a]==='string'?'':'/')),Buffer.from(b+(typeof node[b]==='string'?'':'/'))));
 const children=names.map(name=>{
  const dir=typeof node[name]!=='string';const child=dir?buildFakeGitTree(node[name]):null;
  return {path:name,mode:dir?'040000':'100644',type:dir?'tree':'blob',sha:dir?child.sha:node[name],...(dir?{child}: {})};
 });
 const raw=Buffer.concat(children.map(x=>Buffer.concat([Buffer.from(`${x.type==='tree'?'40000':'100644'} ${x.path}\0`),Buffer.from(x.sha,'hex')])));
 return {sha:gitSha('tree',raw),json:{tree:children.map(({path,mode,type,sha})=>({path,mode,type,sha})),truncated:false},children,raw};
}
test('Git API tree proof truly reconstructs Git native SHA-1 bytes',()=>{
 const leaf='b'.repeat(40);const sub=buildFakeGitTree({'child.mjs':leaf});
 const tree=buildFakeGitTree({'src':{'child.mjs':leaf},'README.md':'c'.repeat(40)});
 assert.equal(serializeGitHubTree({...tree.json,sha:tree.sha},tree.sha).equals(tree.raw),true);
 assert.throws(()=>serializeGitHubTree({...tree.json,sha:'f'.repeat(40)},'f'.repeat(40)),/MISMATCH/);
 const payload=`tree ${tree.sha}\nauthor Test <test@example.org> 1 +0000\ncommitter Test <test@example.org> 1 +0000\n\nmessage\n`;
 const hash=gitSha('commit',Buffer.from(payload));
 assert.equal(serializeGitHubCommit({sha:hash,verification:{payload}},hash).toString(),payload);
 const signature='-----BEGIN PGP SIGNATURE-----\nxyz\n-----END PGP SIGNATURE-----\n';
 const raw=payload.replace('\n\n','\ngpgsig -----BEGIN PGP SIGNATURE-----\n xyz\n -----END PGP SIGNATURE-----\n\n');
 const hashSig=gitSha('commit',Buffer.from(raw));
 assert.equal(serializeGitHubCommit({sha:hashSig,verification:{payload,signature}},hashSig).toString(),raw);
});
test('C94 can assemble real-object SHA-consistent C81 material from fake REST object replies',async()=>{
 const tree=buildFakeGitTree({'src':{'core.mjs':'a'.repeat(40)},'docs':{'note.md':'b'.repeat(40)}});
 const root=tree.sha;
 const payload=`tree ${root}\nauthor Test <test@example.org> 1 +0000\ncommitter Test <test@example.org> 1 +0000\n\nmessage\n`;
 const sha=gitSha('commit',Buffer.from(payload));
 const maps=new Map();function flatten(node){maps.set(node.sha,{...node.json,sha:node.sha});for(const x of node.children)if(x.child)flatten(x.child);}flatten(tree);
 const api=async p=>p.includes('/git/commits/')?{sha,tree:{sha:root},verification:{payload}}:maps.get(p.split('/').at(-1));
 const m={files:[{path:'src/core.mjs',original_source_blob_sha1:'a'.repeat(40)},{path:'docs/note.md',original_source_blob_sha1:'b'.repeat(40)}]};
 const r=await assembleC94GitProof({sourceHead:sha,manifest:m,manifestBytes:Buffer.from('fixture'),gitApi:api});
 assert.equal(r.status,'C94_GIT_RAW_OBJECTS_RECONSTRUCTED_AND_VERIFIED');
 assert.equal(r.tree_objects,3);assert.equal(r.c81_verification_still_required,true);
 assert.equal(gitSha('commit',Buffer.from(r.commitBase64,'base64')),sha);
});
test('authorized carrier selects exact HEAD and ZIP content; stale, expired, tampered fail closed',{skip:!available},async()=>{
 const good=await acquireC94Artifact(mockActions(),{sourceHead:SHA});
 assert.equal(good.status,'C94_ACTIONS_ARTIFACT_BYTES_OBSERVED');
 assert.equal(good.sourceHead,SHA);assert.equal(good.github_ref_cryptographically_authenticated,false);
 for(const q of [{ref:'c'.repeat(40)},{runHead:'d'.repeat(40)},{expired:true},{modify:true}]){
  const bad=await acquireC94Artifact(mockActions(q),{sourceHead:SHA});
  assert.equal(bad.status,'C94_AUTO_HANDOFF_STOP');
 }
});
test('C84 composition rejects missing Git objects; it must not promote artifact readback',{skip:!available},async()=>{
 const q=mockActions();q.json=async p=>p.includes('/git/commits/')?null:mockActions().json(p);
 const r=await buildC94C84AutoPackage({sourceHead:SHA,client:q});
 assert.equal(r.status,'C94_AUTO_HANDOFF_STOP');
 assert.match(r.first_unclosed_edge,/C81_GIT_OBJECT_PROOF/);
});
test('missing Github credential means no automatic carrier, not success',()=>{
 assert.equal(createC94GitHubHTTPS({token:null}),null);
 assert.equal(createC94GitHubHTTPS({token:'bad'}),null);
});
