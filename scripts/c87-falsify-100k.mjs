import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
import {appendC87Turn,c87Event,reopenC87Ledger,verifyC87LedgerEntries} from '../host/c87-durable-ledger.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const src='a'.repeat(40),dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c87-test-')),file=path.join(dir,'ledger.jsonl');
const inputs=['first','second'];for(let i=0;i<2;i++){
 const receipt=appendC87Turn(file,{source_head:src,input_sha256:sha(inputs[i]),output_sha256:sha('answer-'+i),state:{turn:i+1}});
 assert.equal(receipt.status,'C87_LOCAL_DURABLE_READBACK_NOT_NATIVE_SESSION');
}
const read=reopenC87Ledger(file);assert.equal(read.status,'C87_LEDGER_CHAIN_VALID');assert.deepEqual(read.latest_state,{turn:2});
const cli=execFileSync(process.execPath,['--input-type=module','-e',`import {reopenC87Ledger} from ${JSON.stringify(new URL('../host/c87-durable-ledger.mjs',import.meta.url).href)};process.stdout.write(JSON.stringify(reopenC87Ledger(process.argv[1])))`,file],{encoding:'utf8'});
assert.equal(JSON.parse(cli).last_hash,read.last_hash);
assert.throws(()=>appendC87Turn(file,{source_head:src,input_sha256:sha('NaN'),output_sha256:sha('nan'),state:{bad:NaN}}),/C87_STATE_SIZE_OR_SHAPE/);
const base=fs.readFileSync(file,'utf8').trim().split('\n').map(JSON.parse);
let denied=0;const families=new Set();
for(let i=0;i<100000;i++){
 const k=i%10,n=Math.floor(i/10);const t=structuredClone(base);const target=t[k%2];
 if(k===0)target.sequence+=n+1;
 if(k===1)target.prev_hash='f'.repeat(64);
 if(k===2)target.input_sha256=sha('changed'+n);
 if(k===3)target.output_sha256=sha('changed output'+n);
 if(k===4)target.state={turn:n+100};
 if(k===5)target.record_sha256='e'.repeat(64);
 if(k===6)target.source_head='b'.repeat(40);
 if(k===7)target.active=true;
 if(k===8)target.native_session_persistence_attested=true;
 if(k===9)t.reverse();
 const q=verifyC87LedgerEntries(t);assert.equal(q.status,'C87_LEDGER_INVALID',JSON.stringify({i,q}));families.add(k);denied++;
}
const lock=file+'.lock';fs.writeFileSync(lock,'other-writer',{flag:'wx'});
assert.throws(()=>appendC87Turn(file,{source_head:src,input_sha256:sha('third'),output_sha256:sha('third reply'),state:{turn:3}}),/EEXIST/);
fs.unlinkSync(lock);
const bad=structuredClone(base);bad[1].state.turn=999;fs.writeFileSync(file,bad.map(x=>JSON.stringify(x)).join('\n')+'\n');
assert.throws(()=>appendC87Turn(file,{source_head:src,input_sha256:sha('third'),output_sha256:sha('third reply'),state:{turn:3}}),/C87_LEDGER_TAMPER/);
fs.rmSync(dir,{recursive:true,force:true});
console.log(JSON.stringify({slice:'C87',cases:100000,denied,unexpected_accepts:0,local_two_turn_readback:true,exclusive_writer_lock:true,altered_ledger_rejected:true}));
