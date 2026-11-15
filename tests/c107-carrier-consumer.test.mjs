import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PIN,inspectC107Carrier,stageC107Carrier,qualifyC107Voice,c107Handoff} from '../host/c107-carrier-consumer.mjs';
import {runCarrierQualification} from '../scripts/c107-carrier-qualify.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const real=fs.readFileSync(path.join(root,PIN.name));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let seed=20261013;const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0};
test('actual released 62448 bytes reopen 43 source members and original C107 package',()=>{
 const r=inspectC107Carrier(real);
 assert.equal(r.ok,true);assert.equal(r.member_count,43);assert.equal(r.source_bytes,251952);
 assert.equal(sha(r.package),PIN.package_sha256);
 assert.equal(r.files.some(f=>f.path==='scripts/c107-pack.mjs'),false);
});
test('128 seeded real single-bit transport mutations fail-closed',()=>{
 for(let i=0;i<128;i++){
  const b=Buffer.from(real);b[rnd()%b.length]^=1<<(rnd()%8);
  assert.equal(inspectC107Carrier(b).ok,false,'mutant '+i);
 }
});
test('64 recompressed frame/path/metadata/payload mutations all denied',()=>{
 const frame=zlib.brotliDecompressSync(real),metaLen=frame.readUInt32BE(8);
 for(let i=0;i<64;i++){
  const b=Buffer.from(frame),start=i%2===0?12:12+metaLen;
  const end=i%2===0?12+metaLen:b.length;
  b[start+(rnd()%(end-start))]^=1<<(rnd()%8);
  const compressed=zlib.brotliCompressSync(b,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:1}});
  assert.equal(inspectC107Carrier(compressed).ok,false,'frame mutant '+i);
 }
});
test('malformed carrier, empty buffer and high-entropy payload cannot stage',()=>{
 for(const b of [Buffer.alloc(0),Buffer.alloc(62448),Buffer.from('IKC10701'),Buffer.alloc(1000001)]){
  const q=inspectC107Carrier(b);assert.equal(q.ok,false);assert.equal(q.active,false);
  assert.equal(q.manual_source_url,PIN.manual_url);
 }
});
test('path traversal through symlinked staging parent blocked',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c107-path-test-'));
 try{
  const link=path.join(tmp,'sym');fs.symlinkSync(tmp,link);
  assert.equal(stageC107Carrier(real,{parent:link}).ok,false);
  assert.equal(stageC107Carrier(real,{parent:path.join(tmp,'missing')}).ok,false);
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
});
test('P04 retry only with new evidence, then exact pinned source URL',()=>{
 assert.equal(c107Handoff({attempts:1}).status,'HOST_PROBE_ALLOWED');
 assert.equal(c107Handoff({attempts:2}).status,'MANUAL_SOURCE_HANDOFF');
 assert.equal(c107Handoff({attempts:2,newEvidence:true}).status,'HOST_PROBE_ALLOWED');
 assert.equal(c107Handoff({attempts:3,newEvidence:true}).status,'HOST_PROBE_ALLOWED');
 assert.equal(c107Handoff({attempts:4,newEvidence:true}).url,PIN.manual_url);
 assert.throws(()=>c107Handoff({attempts:0}));
});
test('fake C107 surface does not produce ORIGINAL_DEMO',()=>{
 const x=qualifyC107Voice({turn:{status:'C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK',voice_utf8:'forged'},readback:{status:'C107_LEDGER_REOPENED'},nonce:'fake',humanInput:'hello',ledgerFile:'/none'});
 assert.equal(x.origin,'NO_VOICE');
});
test('original C70→C100→single C87 from carrier, 3 turns, replay and corruption denied',async()=>{
 const proof=await runCarrierQualification();
 assert.equal(proof.status,'C107_CARRIER_H2_ORIGINAL_VERIFIED');
 assert.deepEqual(proof.turns.map(x=>x.origin),['ORIGINAL_DEMO','ORIGINAL_DEMO','HOST_BOUND']);
 assert.deepEqual(proof.turns.map(x=>x.cognitive_turns),[1,2,3]);
 assert.ok(proof.turns.every(x=>x.denied_forgeries===4));
 assert.equal(proof.replay_denied,true);assert.equal(proof.corruption_denied,true);
 assert.equal(proof.native_chatgpt_hook,false);assert.equal(proof.active,false);
});
