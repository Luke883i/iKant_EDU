import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {makeSyntheticGitHub} from './c94-full-transport.test.mjs';
import {adaptC95HostConnector,acquireC95FromInstalledBridge} from '../host/c95-host-connector-relay.mjs';
import {verifyC81SourceReachability} from '../host/c81-git-source-reachability.mjs';
import {verifyC90Source} from '../host/c90-source-boundary.mjs';
import {buildC94C84AutoPackage,acquireC94Artifact,createC94GitHubHTTPS} from '../host/c94-auto-artifact-carrier.mjs';
function installed(x){return {readGithubJSON:p=>x.client.json(p),readGithubArtifactBase64:async({artifact_id})=>({artifact_id,contentBase64:x.archive.toString('base64')})};}
test('C95 physical host callback generates C84 and executes C85, C81 and C90 source verifier',async()=>{
 const x=makeSyntheticGitHub(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c95-'));
 try{
  const r=await acquireC95FromInstalledBridge({sourceHead:x.head,hostBridge:installed(x),parentDir:dir});
  assert.equal(r.status,'C95_CONNECTOR_BYTES_IN_NODE_VERIFIED_NOT_OWNER_EXECUTED',JSON.stringify(r));
  assert.equal(r.c81_reachability_executed,true);assert.equal(r.c85_executed,true);
  assert.equal(r.c90_source_gate_executed,true);assert.equal(r.host_authenticated_origin,false);
  const raw=fs.readFileSync(r.package_path),p=JSON.parse(raw);
  const c81=verifyC81SourceReachability({expectedSourceHead:x.head,expectedManifestSha256:r.manifest_sha256,
   manifestBase64:p.manifestBase64,commitBase64:p.sourceProof.commitBase64,treeObjects:p.sourceProof.treeObjects});
  assert.equal(c81.status,'C81_GIT_REACHABILITY_VERIFIED');
  assert.equal(verifyC90Source({sourceHead:x.head,manifestSha256:r.manifest_sha256,packageSha256:r.package_sha256,packageBase64:raw.toString('base64')}).status,'C90_SOURCE_REACHABLE_NOT_HOST_ORIGIN_ATTESTED');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('no installed host callback is not a successful GitHub transport',async()=>{
 const x=makeSyntheticGitHub();const r=await acquireC95FromInstalledBridge({sourceHead:x.head});
 assert.equal(r.status,'C95_HOST_RELAY_STOP');assert.equal(r.first_unclosed_edge,'HOST_GITHUB_CONNECTOR_TO_NODE_HOOK_NOT_INSTALLED');
});
test('C95 connector rejects arbitrary API paths and modified bytes',async()=>{
 const x=makeSyntheticGitHub();const client=adaptC95HostConnector(installed(x));
 for(const p of ['/user','/secrets','/git/ref/heads/evil','/actions/artifacts/01/zip','/actions/artifacts/1/zip?foo=1']){
  await assert.rejects(async()=>client.json(p));if(p.includes('artifacts'))await assert.rejects(async()=>client.bytes(p));
 }
 const bad=adaptC95HostConnector({readGithubJSON:p=>x.client.json(p),readGithubArtifactBase64:async({artifact_id})=>({artifact_id,contentBase64:x.archive.toString('base64').slice(1)})});
 await assert.rejects(async()=>bad.bytes('/actions/artifacts/2002/zip'));
});
test('C94 ref changes during artifact transport must block C77 acquisition',async()=>{
 const x=makeSyntheticGitHub();let calls=0;
 const client={...x.client,async json(p){if(p==='/git/ref/heads/main'&&++calls===2)return {ref:'refs/heads/main',object:{sha:'f'.repeat(40)}};return x.client.json(p);}};
 const r=await acquireC94Artifact(client,{sourceHead:x.head});
 assert.equal(r.status,'C94_AUTO_HANDOFF_STOP');assert.equal(r.first_unclosed_edge,'HOST_GITHUB_REF_CHANGED_DURING_TRANSPORT');
});
test('C94 C84 rejects a modified Git Merkle object even if C77 bytes are identical',async()=>{
 const x=makeSyntheticGitHub();const client={...x.client,async json(p){const j=await x.client.json(p);if(p.startsWith('/git/trees/')&&Array.isArray(j?.tree))return {...j,sha:'f'.repeat(40)};return j;}};
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c95-neg-'));
 try{const r=await buildC94C84AutoPackage({sourceHead:x.head,client,parentDir:dir});assert.equal(r.status,'C94_AUTO_HANDOFF_STOP');assert.match(r.first_unclosed_edge,/C81_GIT_OBJECT_PROOF/);}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('Node HTTPS transport blocks all repository endpoints outside exact C77 C84 allowlist',async()=>{
 const https=createC94GitHubHTTPS({token:'TESTTOKEN_ONLY_FOR_LOCAL_UNIT'});
 for(const p of ['/user','/issues','/actions/runs/123/delete','/git/ref/heads/other','/git/trees/../../x'])
  await assert.rejects(async()=>https.json(p),/UNSAFE_API_PATH/);
 const x=makeSyntheticGitHub();const r=await acquireC94Artifact(x.client,{sourceHead:x.head,runLimit:1000});
 assert.equal(r.status,'C94_AUTO_HANDOFF_STOP');assert.equal(r.first_unclosed_edge,'GITHUB_RUN_LIMIT_UNSAFE');
});

test('tokenless cold host calls installed connector before attempting C93 owner',async()=>{
 const x=makeSyntheticGitHub();
 const {executeC94ColdHostTurn}=await import('../host/c94-cold-host-turn.mjs');
 const r=await executeC94ColdHostTurn({sourceHead:x.head,
  humanInput:'Definisci la tua natura operativa',selection:{status:'EXPERIMENTAL_SELECTED_NOT_RUNNING',selected_mode:'EXPERIMENTAL'},
  githubConnector:installed(x)});
 assert.equal(r.status,'C94_TURN_STOP');
 assert.notEqual(r.first_unclosed_edge,'GITHUB_ACTIONS_TOKEN_UNAVAILABLE_IN_NODE');
 assert.notEqual(r.first_unclosed_edge,'HOST_GITHUB_CONNECTOR_TO_NODE_HOOK_NOT_INSTALLED_OR_TOKEN_MISSING');
 assert.equal(r.active,false);
});
