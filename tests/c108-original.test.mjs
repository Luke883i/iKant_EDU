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
import {buildC107Package,stageC107Package,C107_FILES} from '../scripts/c107-pack.mjs';

const root=path.resolve(new URL('../',import.meta.url).pathname);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const offer=issueC72TermsOffer({sourceHead:head,
 termsDigest:sha(fs.readFileSync(path.join(root,'TERMS.md')))});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const selection=selectC72Mode({accepted,orientation:presentC72Introduction(accepted),
 humanMessage:'EXPERIMENTAL'});
const questions=['Descrivi il funzionamento di un oggetto quotidiano.',
 'Spiega un secondo esempio collegato al primo.'];
const voices=['Il primo oggetto viene descritto con un testo linguistico specifico per questa domanda.',
 'Il secondo esempio considera il contesto della domanda precedente in modo pertinente.'];
const req=i=>({sourceHead:head,selection,humanInput:questions[i],optIn:true});

test('three original C107 machine implementations match on deterministic generator and same prior C87',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c108-original-'));
 try{
  const pkg=buildC107Package({root,expectedHead:head});
  assert.equal(pkg.status,'C107_PACKAGE_BUILT_NOT_TRANSPORTED',JSON.stringify(pkg));
  assert.equal(pkg.file_count,C107_FILES.length);
  for(const x of ['host/c108-host-matrix.mjs','host/c108-stdio-relay.mjs',
   'contracts/c108-machine-matrix.json'])assert.ok(C107_FILES.includes(x));
  const results=[];
  for(const machine of ['DIRECT','BOUND','STDIO']){
   const stage=stageC107Package({payload:pkg.payload,expectedSha256:pkg.sha256,
    expectedHead:head,privateParent:dir});
   assert.equal(stage.status,'C107_PACKAGE_REOPENED_NOT_EXECUTED',JSON.stringify(stage));
   const {executeC108}=await import(pathToFileURL(
    path.join(stage.install_root,'host/c108-host-matrix.mjs')).href);
   const {makeC108StdioRelay}=await import(pathToFileURL(
    path.join(stage.install_root,'host/c108-stdio-relay.mjs')).href);
   const ldir=path.join(stage.install_root,'.ikant-host');fs.mkdirSync(ldir,{mode:0o700});
   const ledgerFile=path.join(ldir,'c107-observations.jsonl');
   let calls=0;const languagePort={async generate(task){
    calls++;const i=questions.indexOf(task.current_input_utf8);
    assert.ok(i>=0);assert.equal(task.input_sha256,sha(questions[i]));return voices[i];
   }};
   const receipts=[];
   for(let i=0;i<2;i++){
    const receipt=await executeC108({
     request:req(i),nonce:'c108-original-'+String(i).padStart(4,'0'),
     ledgerFile,priorMessages:i?[questions[0]]:[],resetContext:i===0,
     prefer:machine,
     languagePort:machine==='DIRECT'?languagePort:undefined,
     relayPort:machine==='STDIO'?makeC108StdioRelay({languagePort}):undefined,
     candidate:machine==='BOUND'?{input_sha256:sha(questions[i]),text:voices[i]}:undefined});
    assert.equal(receipt.status,'C108_LOCAL_RUNTIME_REOPENED_NOT_NATIVE',JSON.stringify(receipt));
    assert.equal(receipt.voice_utf8,voices[i]);assert.equal(receipt.output_sha256,sha(voices[i]));
    assert.equal(receipt.ledger_entries,i+1);assert.equal(receipt.native_delivery_attested,false);
    assert.equal(receipt.original_c70_executed,true);assert.equal(receipt.original_c87_reopened,true);
    receipts.push(receipt);
   }
   assert.equal(calls,machine==='BOUND'?0:2);
   results.push({machine,receipts});
  }
  for(const other of results.slice(1))for(let i=0;i<2;i++){
   assert.equal(other.receipts[i].input_sha256,results[0].receipts[i].input_sha256);
   assert.equal(other.receipts[i].output_sha256,results[0].receipts[i].output_sha256);
   assert.equal(other.receipts[i].ledger_event_sha256,results[0].receipts[i].ledger_event_sha256);
  }
  console.log('C108_ORIGINAL_NODE '+JSON.stringify({head,files:pkg.file_count,
   source_bytes:pkg.source_bytes,transport_bytes:pkg.transport_bytes,
   machines:results.map(x=>x.machine),turns:6,exact_equivalence:true,
   provider_authenticated:false,chatgpt_native_hook:false}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('C108 reject missing provider, wrong consent, and forged relay without C87 write',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c108-negative-'));
 try{
  const {executeC108}=await import('../host/c108-host-matrix.mjs');
  const sub=path.join(dir,'.ikant-host');fs.mkdirSync(sub);
  const ledgerFile=path.join(sub,'c107-observations.jsonl');
  const base={request:req(0),nonce:'c108-negative-0001',ledgerFile,
   priorMessages:[],resetContext:true};
  const noPort=await executeC108(base);
  assert.equal(noPort.status,'C108_STOP');
  const fake=await executeC108({...base,relayPort:{async turn(){return{
   status:'C107_HOST_CALLBACK_LOCAL_RUNTIME_READBACK',
   voice_utf8:'simulated',input_sha256:sha(questions[0]),output_sha256:sha('simulated'),
   c87_event_sha256:'a'.repeat(64),ledger_entries:1,c70_original_executed:true,
   c100_original_bound:true,c87_original_writer_executed:true,c87_reopened:true};}}});
  assert.equal(fake.status,'C108_STOP');
  const missingConsent=await executeC108({...base,request:{...req(0),optIn:false},
   languagePort:{async generate(){return voices[0];}}});
  assert.equal(missingConsent.status,'C108_STOP');
  const inspect=await import('../host/c107-experimental-turn.mjs');
  assert.equal(inspect.inspectC107Ledger(ledgerFile).count,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
