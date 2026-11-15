import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode}
 from '../host/c72-unified-mode-admission.mjs';
import {buildC107Package,stageC107Package} from '../scripts/c107-pack.mjs';

const repo=path.resolve(new URL('../',import.meta.url).pathname);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const offer=issueC72TermsOffer({sourceHead:head,
 termsDigest:sha(fs.readFileSync(path.join(repo,'TERMS.md')))});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const selection=selectC72Mode({accepted,orientation:presentC72Introduction(accepted),
 humanMessage:'EXPERIMENTAL'});
const questions=[
 'Descrivi il funzionamento di un oggetto quotidiano.',
 'Spiega un secondo esempio collegato al primo.'
];
const voice=q=>'Una spiegazione specifica, controllabile e contestuale della domanda: '+q;
test('ten original C70 turns: bounded rolling context, C87 reopen, revocation and replay',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c108-ten-'));
 try{
  const pkg=buildC107Package({root:repo,expectedHead:head});
  assert.equal(pkg.status,'C107_PACKAGE_BUILT_NOT_TRANSPORTED');
  const stage=stageC107Package({payload:pkg.payload,expectedSha256:pkg.sha256,
   expectedHead:head,privateParent:dir});
  assert.equal(stage.status,'C107_PACKAGE_REOPENED_NOT_EXECUTED');
  const {executeC108}=await import(pathToFileURL(path.join(
   stage.install_root,'host/c108-host-matrix.mjs')).href);
  const {inspectC107Ledger}=await import(pathToFileURL(path.join(
   stage.install_root,'host/c107-experimental-turn.mjs')).href);
  const ledgerDir=path.join(stage.install_root,'.ikant-host');fs.mkdirSync(ledgerDir);
  const ledgerFile=path.join(ledgerDir,'c107-observations.jsonl');
  const history=[];let calls=0;
  const languagePort={async generate(task){
   calls++;assert.deepEqual(task.prior_messages_utf8,history.slice(-4));
   return voice(task.current_input_utf8);
  }};
  for(let i=0;i<10;i++){
   const q=questions[i%2],nonce='c108-ten-turn-'+String(i).padStart(4,'0');
   const r=await executeC108({
    request:{sourceHead:head,selection,humanInput:q,optIn:true},
    nonce,ledgerFile,priorMessages:history.slice(-4),
    resetContext:i===0,languagePort,prefer:'DIRECT'});
   assert.equal(r.status,'C108_LOCAL_RUNTIME_REOPENED_NOT_NATIVE',JSON.stringify({i,r}));
   assert.equal(r.ledger_entries,i+1);assert.equal(r.output_sha256,sha(voice(q)));
   assert.equal(r.voice_utf8,voice(q));
   assert.equal(r.native_delivery_attested,false);
   history.push(q);
   assert.equal(inspectC107Ledger(ledgerFile).count,i+1);
  }
  assert.equal(calls,10);
  const denied=await executeC108({
   request:{sourceHead:head,selection,humanInput:questions[0],optIn:false},
   nonce:'c108-revoked-001',ledgerFile,
   priorMessages:history.slice(-4),resetContext:false,languagePort});
  assert.equal(denied.status,'C108_STOP');
  assert.equal(inspectC107Ledger(ledgerFile).count,10);
  const replay=await executeC108({
   request:{sourceHead:head,selection,humanInput:questions[0],optIn:true},
   nonce:'c108-ten-turn-0000',ledgerFile,
   priorMessages:history.slice(-4),resetContext:false,languagePort});
  assert.equal(replay.status,'C108_STOP');
  assert.equal(inspectC107Ledger(ledgerFile).count,10);
  const raw=fs.readFileSync(ledgerFile,'utf8');
  assert.equal(raw.includes(questions[0]),false);
  assert.equal(raw.includes(voice(questions[0])),false);
  fs.appendFileSync(ledgerFile,'{"tampered":true}\n');
  const tampered=await executeC108({
   request:{sourceHead:head,selection,humanInput:questions[0],optIn:true},
   nonce:'c108-after-tamper',ledgerFile,
   priorMessages:history.slice(-4),resetContext:false,languagePort});
  assert.equal(tampered.status,'C108_STOP');
  console.log('C108_TEN_ORIGINAL '+JSON.stringify({turns:10,callback_calls:calls,
   rolling_history:4,original_source:true,ledger_reopened:true,
   replay_rejected:true,revocation_rejected:true,tamper_rejected:true,
   native_chatgpt:false}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
