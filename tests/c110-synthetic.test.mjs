import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
const digestText=x=>crypto.createHash('sha256').update(x,'utf8').digest('hex');
import {pathToFileURL} from 'node:url';
const H='a'.repeat(40);
const OPT='AUTORIZZO BOZZE COHOST SPERIMENTALI NON VERIFICATE';
const digest='b'.repeat(64);
const setup=()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c110-real-shell-fixture-'));
 for(const part of ['host','contracts'])fs.mkdirSync(path.join(dir,part));
 const root=path.resolve(new URL('../',import.meta.url).pathname);
 for(const file of ['host/c109-chat-shell.mjs','host/c109-frame-policy.mjs',
  'host/c110-experimental-lattice.mjs','contracts/c110-experimental-lattice.json']){
  const target=path.join(dir,file);fs.copyFileSync(path.join(root,file),target);
 }
 fs.writeFileSync(path.join(dir,'TERMS.md'),'Original source terms mock fixture');
 fs.writeFileSync(path.join(dir,'host/c72-unified-mode-admission.mjs'),`
 export const issueC72TermsOffer=x=>({...x,schema:'offer'});
 export const acceptC72Terms=x=>({schema:'ikant-le-c72-accepted/v1',receipt_sha256:'${digest}'});
 export const presentC72Introduction=x=>({schema:'ikant-le-c72-orientation/v1',receipt_sha256:'${digest}',text:'C72 orientation'});
 export const selectC72Mode=x=>({selected_mode:'EXPERIMENTAL',receipt_sha256:'${digest}'});
 `);
 fs.writeFileSync(path.join(dir,'host/c108-host-matrix.mjs'),`
 export const executeC108=async()=>({status:'C108_STOP',first_unclosed_edge:'ORIGINAL_CALLED'});
 `);
 fs.writeFileSync(path.join(dir,'host/c107-experimental-turn.mjs'),`
 export const inspectC107Ledger=()=>({status:'C107_LEDGER_REOPENED',count:0,last_hash:'0'.repeat(64)});
 `);
 fs.writeFileSync(path.join(dir,'package.json'),'{}\n');
 // .mjs uses ESM regardless of package.json
 return dir;
};
async function admit(shell){
 for(const [text,status] of [['attiva iKant','C109_TERMS_PRESENTED'],
 ['I ACCEPT','C109_C72_INTRO'],['EXPERIMENTAL','C109_EXPERIMENTAL_SELECTED'],
 [OPT,'C109_LOCAL_SHELL_READY']])assert.equal((await shell.send({text})).status,status);
}
test('synthetic voice is openly unverified, never invokes C108 or creates a ledger',async()=>{
 const base=setup();try{
 const {createC109ChatShell}=await import(pathToFileURL(path.join(base,'host/c109-chat-shell.mjs')).href);
 const file=path.join(base,'c107-observations.jsonl');const shell=createC109ChatShell({sourceHead:H,ledgerFile:file,allowSynthetic:true});
 await admit(shell);
 let q=await shell.send({text:'Descrivi il metodo',nonce:'c110-synth-nonce-0001',hostDraft:'Voce sintetica autorizzata.'});
 assert.equal(q.status,'C109_SYNTHETIC_HOST_DRAFT_NOT_IKANT_RUNTIME');
 assert.match(q.surface_a,/^\[BOZZA HOST SPERIMENTALE - C70\/C87 NON ESEGUITI\]\n/);
 assert.match(q.surface_a,/Voce sintetica autorizzata\./);
 assert.equal(q.surface_b.evidence.visible_voice_sha256,digestText(q.surface_a));
 const replay=await shell.send({text:'Altro esperimento',nonce:'c110-synth-nonce-0001',hostDraft:'Tentativo duplicato'});
 assert.equal(replay.status,'C109_STOP');
 assert.equal(replay.surface_b.first_unclosed_edge,'C110_SYNTHETIC_NONCE_REPLAY');
 assert.equal(q.surface_b.evidence.original_C70_executed,false);
 assert.equal(q.surface_b.evidence.C87_writer_invoked,false);
 assert.equal(q.surface_b.evidence.ledger_entries,null);
 assert.equal(q.surface_b.active,false);
 assert.equal(fs.existsSync(file),false);
 q=await shell.send({text:'STOP BOZZE COHOST'});assert.equal(q.status,'C109_OPTIN_REVOKED');
 q=await shell.send({text:'Nuovo turno',nonce:'c110-synth-nonce-0002',hostDraft:'Invalido'});
 assert.equal(q.status,'C109_STOP');assert.equal(q.surface_a,null);
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});
test('synthetic absent without separate flag; original callable failure cannot silently downgrade',async()=>{
 const base=setup();try{
 const {createC109ChatShell}=await import(pathToFileURL(path.join(base,'host/c109-chat-shell.mjs')).href);
 const file=path.join(base,'c107-observations.jsonl');
 const denied=createC109ChatShell({sourceHead:H,ledgerFile:file});await admit(denied);
 let a=await denied.send({text:'Spiega',nonce:'c110-no-flag-0001',hostDraft:'Fake'});
 assert.equal(a.status,'C109_STOP');assert.equal(a.surface_a,null);
 const withOriginal=createC109ChatShell({sourceHead:H,ledgerFile:file,allowSynthetic:true,
   languagePort:{async generate(){return 'mock';}}});await admit(withOriginal);
 a=await withOriginal.send({text:'Spiega',nonce:'c110-no-fallback-1',hostDraft:'Should not appear'});
 assert.equal(a.status,'C109_STOP');assert.equal(a.surface_a,null);
 assert.equal(fs.existsSync(file),false);
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});
