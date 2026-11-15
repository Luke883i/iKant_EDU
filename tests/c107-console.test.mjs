import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const OPTIN='AUTORIZZO BOZZE COHOST SPERIMENTALI NON VERIFICATE';
test('avvia iKant local shell: original Terms/C72 -> opt-in -> two original C70 turns -> C87 ledger',()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c107-shell-'));
 try{
  const folder=path.join(base,'.ikant-host');fs.mkdirSync(folder,{mode:0o700});
  const ledger=path.join(folder,'c107-observations.jsonl');
  const frames=['avvia iKant','I ACCEPT','EXPERIMENTAL',OPTIN,
   'Come descrivi un metodo sperimentale?','Quale prova useresti come controllo?','GET LEDGER','ESCI LAB'];
  const p=spawnSync(process.execPath,['scripts/c107-console.mjs','--head',head,'--ledger',ledger],{
   cwd:root,encoding:'utf8',input:frames.join('\n')+'\n',timeout:60000,maxBuffer:1500000});
  assert.equal(p.status,0,p.stderr);
  const statuses=p.stdout.split('\n').filter(s=>s.startsWith('iKant[LAB] ')).map(s=>JSON.parse(s.slice(11)));
  assert.equal(statuses.length,frames.length,JSON.stringify(statuses));
  assert.deepEqual(statuses.slice(0,4).map(x=>x.status),
   ['C107_TERMS','C107_INTRO','C107_EXPERIMENTAL_SELECTED','C107_LOCAL_READY_NOT_NATIVE']);
  const turns=statuses.filter(x=>x.status==='C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK');
  assert.equal(turns.length,2,JSON.stringify(statuses));
  assert.equal(turns[0].cognitive_window_length,1);
  assert.equal(turns[1].cognitive_window_length,2);
  assert.equal(turns[1].ledger_entries,2);
  assert.equal(turns[1].native_delivery_attested,false);
  assert.equal(statuses.at(-2).status,'C107_LEDGER_REOPENED');
  assert.equal(statuses.at(-2).count,2);
  assert.equal(statuses.at(-1).status,'C107_LOCAL_CLOSED');
  assert.ok(fs.existsSync(ledger));
  console.log('C107_LOCAL_SHELL_PROOF '+JSON.stringify({admission:'ORIGINAL_C72',turns:2,
   c70_window_second_turn:2,ledger_reopened:true,chatgpt_native_hook:false}));
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});
