import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {buildC107Package,stageC107Package,C107_FILES} from '../scripts/c107-pack.mjs';

const root=path.resolve(new URL('../',import.meta.url).pathname);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const optin='AUTORIZZO BOZZE COHOST SPERIMENTALI NON VERIFICATE';
const questions=['Descrivi il funzionamento di un oggetto quotidiano.',
 'Spiega un secondo esempio collegato al primo.'];
const voices=['La prima risposta spiega il principio di funzionamento del primo oggetto con esempi chiari.',
 'La seconda risposta collega il nuovo esempio al contesto precedente con un confronto concreto.'];

test('C109 installed original Node capsule serves authentic terms, original C72, two C108 C70 C100 C87 turns, A/B',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c109-original-'));
 try{
  const pkg=buildC107Package({root,expectedHead:head});
  assert.equal(pkg.status,'C107_PACKAGE_BUILT_NOT_TRANSPORTED',JSON.stringify(pkg));
  for(const p of ['host/c109-chat-shell.mjs','host/c109-frame-policy.mjs',
   'contracts/c109-chat-shell.json','scripts/c109-chat-gateway.mjs'])assert.ok(C107_FILES.includes(p));
  const installed=stageC107Package({payload:pkg.payload,expectedSha256:pkg.sha256,expectedHead:head,privateParent:temp});
  assert.equal(installed.status,'C107_PACKAGE_REOPENED_NOT_EXECUTED',JSON.stringify(installed));
  const ldir=path.join(installed.install_root,'.ikant-host');fs.mkdirSync(ldir,{mode:0o700});
  const ledgerFile=path.join(ldir,'c107-observations.jsonl');
  const {createC109ChatShell}=await import(pathToFileURL(path.join(installed.install_root,'host/c109-chat-shell.mjs')).href);
  const {inspectC107Ledger}=await import(pathToFileURL(path.join(installed.install_root,'host/c107-experimental-turn.mjs')).href);
  let count=0;
  const languagePort={async generate(task){
   const i=questions.indexOf(task.current_input_utf8);
   assert.ok(i>=0);assert.equal(task.c70_plan.input_sha256,sha(questions[i]));
   assert.equal(task.c70_plan.cognitive_window_length,i+1);
   count++;return voices[i];
  }};
  const shell=createC109ChatShell({sourceHead:head,ledgerFile,languagePort});
  let x=await shell.send({text:'attiva iKant'});
  assert.equal(x.status,'C109_TERMS_PRESENTED');
  assert.equal(x.surface_a,fs.readFileSync(path.join(root,'TERMS.md'),'utf8'));
  assert.equal(x.surface_b.evidence.terms_sha256,sha(x.surface_a));
  x=await shell.send({text:questions[0]});assert.equal(x.status,'C109_STOP');
  x=await shell.send({text:'I ACCEPT'});assert.equal(x.status,'C109_C72_INTRO');
  x=await shell.send({text:'EXPERIMENTAL'});assert.equal(x.status,'C109_EXPERIMENTAL_SELECTED');
  x=await shell.send({text:questions[0]});assert.equal(x.status,'C109_STOP');
  x=await shell.send({text:optin});assert.equal(x.status,'C109_LOCAL_SHELL_READY');
  for(let i=0;i<2;i++){
   x=await shell.send({text:questions[i],nonce:'c109-verified-nonce-'+i});
   assert.equal(x.status,'C109_VERIFIED_LOCAL_VOICE_NOT_NATIVE',JSON.stringify(x));
   assert.equal(x.surface_a,voices[i]);
   assert.equal(x.surface_b.evidence.input_sha256,sha(questions[i]));
   assert.equal(x.surface_b.evidence.output_sha256,sha(voices[i]));
   assert.equal(x.surface_b.evidence.ledger_entries,i+1);
   assert.equal(x.surface_b.evidence.original_c70_executed,true);
   assert.equal(x.surface_b.native_event_attested,false);
   assert.equal(x.surface_b.documents.length,3);
   assert.equal(x.surface_b.documents[0].url,`https://github.com/Luke883i/iKant_EDU/tree/${head}`);
  }
  assert.equal(count,2);
  assert.equal(inspectC107Ledger(ledgerFile).count,2);
  const replay=await shell.send({text:questions[1],nonce:'c109-verified-nonce-1'});
  assert.equal(replay.status,'C109_STOP');assert.equal(inspectC107Ledger(ledgerFile).count,2);
  const s=await shell.send({text:'STOP BOZZE COHOST'});
  assert.equal(s.status,'C109_OPTIN_REVOKED');
  assert.equal((await shell.send({text:questions[0],nonce:'c109-verified-nonce-4'})).status,'C109_STOP');
  assert.equal(inspectC107Ledger(ledgerFile).count,2);
  console.log('C109_ORIGINAL_NODE '+JSON.stringify({head,isolated_package_files:pkg.file_count,
   turns:2,original_C70_C100_C87:true,model_callback_invocations:count,
   surfaceA_exact:true,surfaceB_pinned:true,ledger_reopened:true,native_chatgpt_hook:false}));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});

test('C109 without physical language port cannot claim an iKant voice or append C87',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c109-no-port-'));
 try{
  const dir=path.join(temp,'.ikant-host');fs.mkdirSync(dir);
  const ledgerFile=path.join(dir,'c107-observations.jsonl');
  const {createC109ChatShell}=await import('../host/c109-chat-shell.mjs');
  const shell=createC109ChatShell({sourceHead:head,ledgerFile});
  for(const text of ['avvia iKant','I ACCEPT','EXPERIMENTAL',optin])await shell.send({text});
  const r=await shell.send({text:questions[0],nonce:'c109-no-port-nonce-01'});
  assert.equal(r.status,'C109_STOP');assert.equal(r.surface_a,null);
  assert.equal(r.surface_b.first_unclosed_edge,'C108_NO_CALLABLE_HOST_MACHINE');
  assert.equal(fs.existsSync(ledgerFile),false);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
