import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {reopenC72Transit} from '../host/project-c72-receipt-transit.mjs';
import {materializeRepositoryPlan} from '../scripts/project-repo-loader.mjs';
import {openContinuousOneShell} from '../host/project-oneshell-continuous.mjs';
import {adjudicateE15,admitE15TransportEnvelope,E15_PROFILE} from '../host/project-oneshell-irred-e15.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const H='a'.repeat(40);
const files=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
 'host/project-c72-postaccept-reentry.mjs'];
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function packet(){
 const docs=files.map(p=>{const b=fs.readFileSync(path.join(ROOT,p));return {path:p,contentBase64:b.toString('base64'),sha:blob(b)};});
 const blobShas=Object.fromEntries(docs.map(x=>[x.path,x.sha]));
 const witness={source_head:H,host_link_displayed:true,distinct_human_message_observed:true,
  terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+H+'/TERMS.md',
  pinned_blob_shas:Object.fromEntries(docs.slice(0,5).map(x=>[x.path,x.sha]))};
 const transit=fs.readFileSync(path.join(ROOT,'host/project-c72-receipt-transit.mjs'));
 return {docs,blobShas,witness,transitBlobSha1:blob(transit),
  transitSourcePacket:{path:'host/project-c72-receipt-transit.mjs',contentBase64:transit.toString('base64')}};
}
function fullSourcePlan(){
 const names=[...JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/project-session-source.json'))).paths,
  'contracts/project-session-source.json'];
 const entries=new Map(names.map(p=>{const b=fs.readFileSync(path.join(ROOT,p));
  return [p,{path:p,type:'blob',mode:'100644',sha:blob(b)}];})),dirs=new Set();
 for(const p of names){let d=path.posix.dirname(p);while(d!=='.'){dirs.add(d);d=path.posix.dirname(d);}}
 const tree=dir=>{
  const rows=[...entries.values()].filter(e=>path.posix.dirname(e.path)===(dir||'.'))
   .sort((a,b)=>Buffer.compare(Buffer.from(path.posix.basename(a.path)+(a.type==='tree'?'/':'')),
    Buffer.from(path.posix.basename(b.path)+(b.type==='tree'?'/':''))));
  return createHash('sha1').update(Buffer.from('tree '+Buffer.concat(rows.map(e=>Buffer.concat([
   Buffer.from((e.type==='tree'?'40000':e.mode)+' '+path.posix.basename(e.path)+'\0'),
   Buffer.from(e.sha,'hex')]))).length+'\0'))
   .update(Buffer.concat(rows.map(e=>Buffer.concat([
   Buffer.from((e.type==='tree'?'40000':e.mode)+' '+path.posix.basename(e.path)+'\0'),
   Buffer.from(e.sha,'hex')])))).digest('hex');
 };
 for(const d of [...dirs].sort((a,b)=>b.split('/').length-a.split('/').length))
  entries.set(d,{path:d,type:'tree',mode:'040000',sha:tree(d)});
 const t=tree('');
 return {head:H,tree:t,plan:{source_head:H,live_head:H,source_tree:t,truncated:false,
  tree:[...entries.values()],files:names.map(p=>({path:p,encoding:'base64',
   content:fs.readFileSync(path.join(ROOT,p)).toString('base64')}))}};
}
function invoke(root,rel,q){
 const child=spawnSync(process.execPath,[path.join(root,rel)],{
  input:JSON.stringify(q),encoding:'utf8',maxBuffer:2*1024*1024,timeout:30000});
 assert.notEqual(child.status,null,'child must terminate: '+child.stderr);
 return JSON.parse(child.stdout.trim());
}
test('E15 sterile zero-checkout: accepted + EDU in distinct original-owner child processes; receipt reopened',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-e15-sterile-'));
 const privateRoot=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-e15-receipts-'));
 fs.chmodSync(root,0o700);fs.chmodSync(privateRoot,0o700);
 try{
  for(const name of ['host/project-c72-coldstart-seed.mjs','scripts/project-c72-cold-mode-cli.mjs']){
   const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});
   fs.copyFileSync(path.join(ROOT,name),target);
  }
  // Important: no adjacent C72 original modules or transit module in sterile launcher.
  assert.equal(fs.existsSync(path.join(root,'host/project-c72-receipt-transit.mjs')),false);
  assert.equal(fs.existsSync(path.join(root,'host/c72-public-mode-admission.mjs')),false);
  const f=packet(),extra={projectProfile:E15_PROFILE,transitDirectory:privateRoot,
   transitBlobSha1:f.transitBlobSha1,transitSourcePacket:f.transitSourcePacket};
  const missing=invoke(root,'host/project-c72-coldstart-seed.mjs',{
   schema:'ikant-host-c72-coldstart/v1',humanMessage:'I ACCEPT',freshHumanTurn:true,
   ownerOutcome:'NOT_INVOKED',liveHead:H,priorTurnEvidence:f.witness,
   expectedBlobShas:f.blobShas,sourcePacket:f.docs.map(({path,contentBase64})=>({path,contentBase64})),
   seedBlobSha1:blob(fs.readFileSync(path.join(root,'host/project-c72-coldstart-seed.mjs'))),
   projectProfile:E15_PROFILE,transitDirectory:privateRoot});
  assert.equal(missing.ok,false);assert.equal(missing.original_owner_invoked,false);
  const accept=invoke(root,'host/project-c72-coldstart-seed.mjs',{
   schema:'ikant-host-c72-coldstart/v1',humanMessage:'I ACCEPT',freshHumanTurn:true,
   ownerOutcome:'NOT_INVOKED',liveHead:H,priorTurnEvidence:f.witness,
   expectedBlobShas:f.blobShas,sourcePacket:f.docs.map(({path,contentBase64})=>({path,contentBase64})),
   seedBlobSha1:blob(fs.readFileSync(path.join(root,'host/project-c72-coldstart-seed.mjs'))),...extra});
  assert.equal(accept.ok,true,JSON.stringify(accept));assert.equal(accept.original_owner_invoked,true);
  const pinned=JSON.parse(fs.readFileSync(path.join(privateRoot,'c72-e16-source-pin.json'),'utf8'));
  assert.equal(pinned.schema,'ikant-c72-e16-transport-pin/v1');
  assert.equal(pinned.blob_sha1,f.transitBlobSha1);
  assert.equal(pinned.source_head,H);
  const forged=invoke(root,'scripts/project-c72-cold-mode-cli.mjs',{
   schema:'ikant-host-c72-later-mode/v1',humanMessage:'EDU',freshHumanTurn:true,
   priorAcceptanceObserved:true,ownerOutcome:'NOT_INVOKED',sourceHead:H,liveHead:H,
   expectedBlobShas:f.blobShas,
   sourcePacket:f.docs.slice(5,7).map(({path,contentBase64})=>({path,contentBase64})),
   ...extra,transitBlobSha1:'b'.repeat(40)});
  assert.equal(forged.ok,false);
  assert.equal(forged.original_owner_invoked,false,'bad pin must not consume original EDU');
  const mode=invoke(root,'scripts/project-c72-cold-mode-cli.mjs',{
   schema:'ikant-host-c72-later-mode/v1',humanMessage:'EDU',freshHumanTurn:true,
   priorAcceptanceObserved:true,ownerOutcome:'NOT_INVOKED',sourceHead:H,liveHead:H,
   expectedBlobShas:f.blobShas,
   sourcePacket:f.docs.slice(5,7).map(({path,contentBase64})=>({path,contentBase64})),...extra});
  assert.equal(mode.ok,true,JSON.stringify(mode));assert.equal(mode.original_owner_invoked,true);
  const reopened=reopenC72Transit({directory:privateRoot,sourceHead:H});
  assert.equal(reopened.ok,true,JSON.stringify(reopened));
  assert.equal(reopened.selection.receipt_sha256,mode.selection.receipt_sha256);
  assert.equal(reopened.accepted.receipt_sha256,accept.accepted.receipt_sha256);
  // Same original C72 receipts MUST survive the later full source handoff and
  // start original C135/C87 with no second acceptance or mode selection.
  const fsrc=fullSourcePlan();
  const sourceRoot=path.join(privateRoot,'source');
  materializeRepositoryPlan(fsrc.plan,{head:H,tree:fsrc.tree,destination:sourceRoot});
  const languagePort=async task=>{
   if(task.schema==='ikant-edu-v2-open-language-task/v1')
    return {text:'Scelta umana verificabile.',input_sha256:task.plan.input_sha256,
     ack_plan_sha256:task.plan.plan_sha256};
   return {text:'Risposta originale owner-bound.',...task.required_ack};
  };
  const owner=await openContinuousOneShell({projectProfile:E15_PROFILE,
   c72TransitDirectory:privateRoot,sourceHead:H,sourceTree:fsrc.tree,
   sourceRoot,privateRoot,readMain:async()=>H,languagePort});
  assert.equal(owner.ok,true,JSON.stringify(owner));
  try{
   const frame=await owner.publishHumanTurn({humanInput:'Conferma continuità E15.',
    nonce:'e15-physical-first-00001',humanMessageObserved:true});
   assert.equal(frame.ok,true,JSON.stringify(frame));
   assert.equal(frame.original_c87_count,1);
   assert.equal(frame.frame.slots.A,'Risposta originale owner-bound.');
  }finally{owner.close();}
  const again=invoke(root,'scripts/project-c72-cold-mode-cli.mjs',{
   schema:'ikant-host-c72-later-mode/v1',humanMessage:'EDU',freshHumanTurn:true,
   priorAcceptanceObserved:true,ownerOutcome:'NOT_INVOKED',sourceHead:H,liveHead:H,
   expectedBlobShas:f.blobShas,
   sourcePacket:f.docs.slice(5,7).map(({path,contentBase64})=>({path,contentBase64})),...extra});
  assert.equal(again.ok,false);assert.equal(again.original_owner_invoked,false);
 }finally{
  fs.rmSync(root,{recursive:true,force:true});fs.rmSync(privateRoot,{recursive:true,force:true});
 }
});
test('E15 cut-set denies missing source, original C72 and counterfeit delivery evidence',()=>{
 assert.equal(admitE15TransportEnvelope({projectProfile:E15_PROFILE}).ok,false);
 assert.equal(adjudicateE15({profile:E15_PROFILE,stage:'TURN',sourceHead:H,liveHead:'b'.repeat(40)}).edge,'STOP_SOURCE_LOCK_STALE');
 const a={profile:E15_PROFILE,stage:'TURN',sourceHead:H,liveHead:H,orientationWitness:true,
  transitReadback:true,originalAccepted:true,originalEduMode:true,sourceTreeBlobReadback:true,
  originalC135:true,originalC87Readback:true,originalC125S03:true,sixSlotsOriginal:true};
 assert.equal(adjudicateE15(a).ok,true);
 assert.equal(adjudicateE15({...a,originalC87Readback:false}).edge,'E15_ORIGINAL_C87_READBACK_REQUIRED');
 assert.equal(adjudicateE15({...a,stage:'DELIVERED',verifiedLogoOrTextFallback:true}).edge,'E15_HOST_DELIVERY_UNKNOWN');
 assert.equal(adjudicateE15({...a,stage:'RECOVERED'}).edge,'E15_RECOVERY_WORKER_FENCE_REQUIRED');
});
