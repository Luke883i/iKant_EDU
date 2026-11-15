import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode}
 from '../host/c72-unified-mode-admission.mjs';
import {verifyC103HostAdapterWitness} from '../host/c103-host-adapter-conformance.mjs';
import {inspectC102Ledger} from '../host/c102-soft-host-bridge.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const head='3bc929b55f5dedb9f0ed833e8d036558a5c13d53';
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const orientation=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
const req=humanInput=>({sourceHead:head,selection,humanInput,optIn:true});
const nonce=n=>'c103-host-proof-'+String(n).padStart(8,'0');

test('original C101/C102/C87 path via physical Node child and C103 pure conformance',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c103-'));
 const dir=path.join(root,'.ikant-host');fs.mkdirSync(dir,{mode:0o700});
 const ledger=path.join(dir,'c102-soft-observations.jsonl');
 try{
  const a=req('Come distinguere le prove dalle ipotesi?');
  const b=req('Definisci un audit riproducibile');
  const frames=[{nonce:nonce(1),request:a},{nonce:nonce(2),request:{...a,optIn:false}},
    {nonce:nonce(3),request:b},{action:'INSPECT'}];
  const run=spawnSync(process.execPath,['scripts/c102-soft-host-cli.mjs','--ledger',ledger,'--ndjson'],{
   cwd:new URL('../',import.meta.url),encoding:'utf8',timeout:60000,
   input:frames.map(JSON.stringify).join('\n')+'\n',maxBuffer:4000000});
  assert.equal(run.status,0,run.stderr);
  const rows=run.stdout.trim().split('\n').map(JSON.parse);
  assert.equal(rows.length,4);
  assert.equal(rows[1].status,'C102_STOP');
  assert.equal(rows[0].status,'C102_ORIGINAL_C101_C87_LOCAL_READBACK');
  assert.equal(rows[2].status,'C102_ORIGINAL_C101_C87_LOCAL_READBACK');
  const v=verifyC103HostAdapterWitness({request:b,nonce:nonce(3),
    receipt:rows[2],inspection:rows[3]});
  assert.equal(v.status,'C103_ENVELOPE_CONFORMANT_NOT_HOST_ATTESTED',JSON.stringify(v));
  assert.equal(v.input_sha256,sha(b.humanInput));
  assert.equal(v.output_sha256,sha(v.voice_utf8));
  assert.equal(v.ledger_entries,2);
  assert.equal(v.native_delivery_attested,false);
  assert.equal(v.host_runtime_execution_attested,false);
  assert.equal(inspectC102Ledger(ledger).last_hash,v.ledger_event_sha256);
  assert.equal(verifyC103HostAdapterWitness({request:a,nonce:nonce(1),
    receipt:rows[0],inspection:rows[3]}).status,'C103_STOP');
  assert.equal(verifyC103HostAdapterWitness({request:b,nonce:nonce(3),
    receipt:{...rows[2],active:true},inspection:rows[3]}).status,'C103_STOP');
  assert.equal(verifyC103HostAdapterWitness({request:b,nonce:nonce(3),
    receipt:rows[2],inspection:{...rows[3],last_hash:'0'.repeat(64)}}).status,'C103_STOP');
  assert.equal(fs.readFileSync(ledger,'utf8').includes(b.humanInput),false);
  fs.appendFileSync(ledger,'{"corrupt":true}\n');
  assert.equal(inspectC102Ledger(ledger).status,'C102_STOP');
  console.log('C103_REAL_SOURCE '+JSON.stringify({c70:rows[2].c70_status,
   c71:rows[2].c71_status,c87:rows[2].ledger_status,c103:v.status,
   ledger_entries:v.ledger_entries,native_chat_hook_attested:false}));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
