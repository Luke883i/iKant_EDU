import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {executeC102SoftTurn,inspectC102Ledger} from '../host/c102-soft-host-bridge.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const sourceBlobs=[['host/c101-local-cohost-machine.mjs','a2416118447fb10fbc71e9ad864e7ea0fd298d41'],['host/c87-durable-ledger.mjs','9d4fd4038bd7e109bdbc5e0441f9e9acf497c846']];
const head='3bc929b55f5dedb9f0ed833e8d036558a5c13d53';
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const intro=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation:intro,humanMessage:'EXPERIMENTAL'});
const req=text=>({sourceHead:head,selection,humanInput:text,optIn:true});
const nonce=(n)=>'c102-frozen-'+String(n).padStart(8,'0');
test('original C101 cognitive machine + original C87 physical ledger; restart, replay and tamper fail-closed',()=>{
 for(const [file,expected] of sourceBlobs){const bytes=fs.readFileSync(new URL('../'+file,import.meta.url));assert.equal(gitBlob(bytes),expected,'SOURCE_BLOB_DRIFT: '+file);}
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c102-real-'));
 const session=path.join(dir,'.ikant-host');fs.mkdirSync(session,{mode:0o700});
 const ledger=path.join(session,'c102-soft-observations.jsonl');
 try{
  const a=req('Spiega un metodo di audit riproducibile');
  const b=req('Come distinguere test ed evidenza?');
  const invalid={...b,optIn:false};
  const frames=[{nonce:nonce(1),request:a},{nonce:nonce(2),request:invalid},{nonce:nonce(3),request:b},{action:'INSPECT'}];
  const run=spawnSync(process.execPath,['scripts/c102-soft-host-cli.mjs','--ledger',ledger,'--ndjson'],{
   cwd:new URL('../',import.meta.url),encoding:'utf8',timeout:60000,
   input:frames.map(x=>JSON.stringify(x)).join('\n')+'\n',maxBuffer:4000000});
  assert.equal(run.status,0,run.stderr);
  const rows=run.stdout.trim().split('\n').map(JSON.parse);
  assert.equal(rows.length,4);
  for(const [i,input] of [[0,a],[2,b]]){
   const r=rows[i];assert.equal(r.status,'C102_ORIGINAL_C101_C87_LOCAL_READBACK',JSON.stringify(r));
   assert.equal(r.actual_local_c101_c87_invoked,true);
   assert.equal(r.c70_status,'EXPERIMENTAL_COMPUTE_PREVIEW');
   assert.equal(r.c71_status,'EXPERIMENTAL_HOST_DRAFT');
   assert.equal(r.input_sha256,sha(input.humanInput));
   assert.equal(r.output_sha256,sha(r.voice_utf8));
   assert.equal(r.active,false);assert.equal(r.persistent,false);
   assert.equal(r.native_delivery_attested,false);
  }
  assert.equal(rows[1].status,'C102_STOP');
  assert.equal(rows[3].status,'C102_LEDGER_REOPENED');
  assert.equal(rows[3].count,2);
  assert.equal(rows[2].ledger_entries,2);
  assert.equal(rows[3].last_hash,rows[2].ledger_event_sha256);
  console.log('C102_ORIGINAL_SOURCE_PROOF '+JSON.stringify({c101_git_blob:sourceBlobs[0][1],c87_git_blob:sourceBlobs[1][1],readback_1:rows[0].status,readback_2:rows[2].status,ledger_reopened:rows[3].status,ledger_entries:rows[3].count,source_head:head,active:false,native_hook_attested:false}));
  const stored=fs.readFileSync(ledger,'utf8');
  assert.equal(stored.includes(a.humanInput),false);
  assert.equal(stored.includes(b.humanInput),false);
  assert.equal(stored.includes(rows[0].voice_utf8),false);
  // Persistence survives process termination: observations, NOT C70 psyche continuity.
  assert.equal(inspectC102Ledger(ledger).count,2);
  assert.equal(executeC102SoftTurn({ledgerFile:ledger,nonce:nonce(1),request:a}).status,'C102_STOP');
  assert.equal(inspectC102Ledger(ledger).count,2);
  const replay=spawnSync(process.execPath,['scripts/c102-soft-host-cli.mjs','--ledger',ledger,'--ndjson'],{
   cwd:new URL('../',import.meta.url),encoding:'utf8',timeout:60000,
   input:JSON.stringify({nonce:nonce(1),request:a})+'\n'});
  assert.equal(JSON.parse(replay.stdout.trim()).status,'C102_STOP');
  assert.equal(inspectC102Ledger(ledger).count,2);
  fs.appendFileSync(ledger,'{"tamper":true}\n');
  assert.equal(inspectC102Ledger(ledger).status,'C102_STOP');
  assert.equal(executeC102SoftTurn({ledgerFile:ledger,nonce:nonce(4),request:a}).status,'C102_STOP');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
