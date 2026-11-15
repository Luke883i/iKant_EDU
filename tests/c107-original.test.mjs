import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {buildC107Package,stageC107Package,C107_FILES} from '../scripts/c107-pack.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const terms=fs.readFileSync(new URL('../TERMS.md',import.meta.url));
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:sha(terms)});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const intro=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation:intro,humanMessage:'EXPERIMENTAL'});
const input1='Spiega il metodo di valutazione in due passaggi';
const input2='Quale criterio è coerente con quanto detto prima?';
const req=s=>({sourceHead:head,selection,humanInput:s,optIn:true});
const child=(cwd,ledger,x)=>{const p=spawnSync(process.execPath,['scripts/c107-turn-cli.mjs',ledger],{
 cwd,encoding:'utf8',input:JSON.stringify(x),timeout:30000,maxBuffer:1000000});
 assert.equal(p.status,0,p.stderr);return JSON.parse(p.stdout.trim());};
test('one minimal package executes original C70-C100-C87 two-turn cognition after process restart',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c107-ci-'));
 try{
  const pkg=buildC107Package({root,expectedHead:head});
  assert.equal(pkg.status,'C107_PACKAGE_BUILT_NOT_TRANSPORTED',JSON.stringify(pkg));
  assert.equal(pkg.file_count,C107_FILES.length);
  const ready=stageC107Package({payload:pkg.payload,expectedSha256:pkg.sha256,expectedHead:head,privateParent:temp});
  assert.equal(ready.status,'C107_PACKAGE_REOPENED_NOT_EXECUTED',JSON.stringify(ready));
  const dir=path.join(ready.install_root,'.ikant-host');fs.mkdirSync(dir,{mode:0o700});
  const ledger=path.join(dir,'c107-observations.jsonl');
  const a=child(ready.install_root,ledger,{nonce:'c107-original-0001',request:req(input1),
   priorMessages:[],resetContext:true});
  assert.equal(a.status,'C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK',JSON.stringify(a));
  assert.equal(a.cognitive_window_length,1);assert.equal(a.c70_ephemeral_turns,1);
  assert.equal(a.output_sha256,sha(a.voice_utf8));
  const b=child(ready.install_root,ledger,{nonce:'c107-original-0002',request:req(input2),
   priorMessages:[input1],resetContext:false});
  assert.equal(b.status,'C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK',JSON.stringify(b));
  assert.equal(b.cognitive_window_length,2);assert.equal(b.c70_ephemeral_turns,2);
  assert.equal(b.output_sha256,sha(b.voice_utf8));
  assert.notEqual(a.input_sha256,b.input_sha256);assert.equal(b.ledger_entries,2);
  const inspect=child(ready.install_root,ledger,{action:'INSPECT'});
  assert.equal(inspect.count,2);assert.equal(inspect.last_hash,b.ledger_event_sha256);
  assert.equal(child(ready.install_root,ledger,{nonce:'c107-original-0001',request:req(input1),
   priorMessages:[],resetContext:true}).status,'C107_STOP');
  const mismatch=child(ready.install_root,ledger,{nonce:'c107-original-0003',request:req('Nuova domanda'),
   priorMessages:['testo differente'],resetContext:false});
  assert.equal(mismatch.first_unclosed_edge,'COGNITIVE_WINDOW_NOT_BOUND_TO_LEDGER');
  assert.equal(child(ready.install_root,ledger,{action:'INSPECT'}).count,2);
  const stored=fs.readFileSync(ledger,'utf8');
  assert.equal(stored.includes(input1),false);assert.equal(stored.includes(input2),false);
  fs.appendFileSync(ledger,'{"tampered":true}\n');
  assert.equal(child(ready.install_root,ledger,{action:'INSPECT'}).status,'C107_STOP');
  console.log('C107_ORIGINAL_PROOF '+JSON.stringify({head,files:pkg.file_count,
   source_bytes:pkg.source_bytes,transport_bytes:pkg.transport_bytes,turns:2,
   second_c70_window:2,ledger_reopened:true,native_hook:false}));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
