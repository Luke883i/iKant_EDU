import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const ROOT=path.resolve(new URL('../',import.meta.url).pathname);
const HEAD='a'.repeat(40);
const OPTIN='AUTORIZZO BOZZE COHOST SPERIMENTALI NON VERIFICATE';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
test('gateway turns ordinary text into bound synthetic A/B with fresh host-owned nonces',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c110-gateway-'));
 try{
  for(const folder of ['host','scripts','contracts'])fs.mkdirSync(path.join(dir,folder));
  for(const p of ['host/c109-chat-shell.mjs','host/c109-frame-policy.mjs',
   'host/c110-experimental-lattice.mjs','contracts/c110-experimental-lattice.json',
   'scripts/c109-chat-gateway.mjs'])fs.copyFileSync(path.join(ROOT,p),path.join(dir,p));
  fs.writeFileSync(path.join(dir,'TERMS.md'),'Fixture Terms: NOT original GitHub evidence');
  fs.writeFileSync(path.join(dir,'host/c72-unified-mode-admission.mjs'),
   "export const issueC72TermsOffer=x=>({...x,schema:'offer'});export const acceptC72Terms=()=>({schema:'ikant-le-c72-accepted/v1',receipt_sha256:'abc'});export const presentC72Introduction=()=>({schema:'ikant-le-c72-orientation/v1',receipt_sha256:'abc',text:'C72 intro'});export const selectC72Mode=()=>({selected_mode:'EXPERIMENTAL',receipt_sha256:'abc'});");
  fs.writeFileSync(path.join(dir,'host/c108-host-matrix.mjs'),"export const executeC108=async()=>({status:'C108_STOP'});");
  fs.writeFileSync(path.join(dir,'host/c107-experimental-turn.mjs'),"export const inspectC107Ledger=()=>({status:'C107_LEDGER_REOPENED',count:0});");
  fs.writeFileSync(path.join(dir,'host/c92-live-provider.mjs'),"export const inspectC92C107LanguageConfig=()=>({configured:false});export const makeC92C107LanguagePort=()=>{throw Error('NO_PROVIDER');};");
  const frames=[{text:'attiva iKant'},{text:'I ACCEPT'},{text:'EXPERIMENTAL'},{text:OPTIN},
   {text:'Prima domanda',hostDraft:'Prima voce host'},{text:'Seconda domanda',hostDraft:'Seconda voce host'}];
  const ledger=path.join(dir,'never-created.jsonl');
  const run=spawnSync(process.execPath,['scripts/c109-chat-gateway.mjs','--head',HEAD,'--ledger',ledger,'--allow-synthetic'],{
   cwd:dir,encoding:'utf8',input:frames.map(x=>JSON.stringify(x)).join('\n')+'\n',timeout:20000});
  assert.equal(run.status,0,run.stderr);
  const out=run.stdout.trim().split('\n').map(JSON.parse);
  assert.deepEqual(out.slice(0,4).map(x=>x.status),['C109_TERMS_PRESENTED','C109_C72_INTRO','C109_EXPERIMENTAL_SELECTED','C109_LOCAL_SHELL_READY']);
  for(const r of out.slice(4)){
   assert.equal(r.status,'C109_SYNTHETIC_HOST_DRAFT_NOT_IKANT_RUNTIME');
   assert.match(r.surface_a,/^\[BOZZA HOST SPERIMENTALE - C70\/C87 NON ESEGUITI\]/);
   assert.equal(r.surface_b.evidence.visible_voice_sha256,sha(r.surface_a));
   assert.equal(r.surface_b.evidence.c70_original_executed,false);
   assert.equal(r.surface_b.evidence.C87_writer_invoked,false);
  }
  assert.notEqual(out[4].surface_b.evidence.nonce_sha256,out[5].surface_b.evidence.nonce_sha256);
  assert.equal(fs.existsSync(ledger),false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
