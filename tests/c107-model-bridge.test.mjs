import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode}
 from '../host/c72-unified-mode-admission.mjs';
import {buildC107Package,stageC107Package,C107_FILES} from '../scripts/c107-pack.mjs';
import {inspectC107Ledger} from '../host/c107-experimental-turn.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:sha(fs.readFileSync(path.join(root,'TERMS.md')))});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const introduction=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation:introduction,humanMessage:'EXPERIMENTAL'});
const q1='Descrivi il funzionamento di un oggetto quotidiano.';
const q2='Spiega un secondo esempio collegato al primo.';
const v1='La risposta host per il primo oggetto usa parole flessibili e segue la domanda specifica corrente.';
const v2='La risposta host per il secondo esempio e differente e considera il contesto precedente.';
const req=humanInput=>({sourceHead:head,selection,humanInput,optIn:true});
test('installed-host STDIO handshake runs isolated original C70 C100 C87 with different generated voices',()=>{
 const work=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c107-port-'));
 try{
  const bundle=buildC107Package({root,expectedHead:head});
  assert.equal(bundle.status,'C107_PACKAGE_BUILT_NOT_TRANSPORTED',JSON.stringify(bundle));
  assert.ok(C107_FILES.includes('host/c107-host-language-port.mjs'));
  assert.ok(C107_FILES.includes('scripts/c107-model-stdio.mjs'));
  const staged=stageC107Package({payload:bundle.payload,expectedSha256:bundle.sha256,expectedHead:head,privateParent:work});
  assert.equal(staged.status,'C107_PACKAGE_REOPENED_NOT_EXECUTED',JSON.stringify(staged));
  const dir=path.join(staged.install_root,'.ikant-host');fs.mkdirSync(dir,{mode:0o700});
  const ledger=path.join(dir,'c107-observations.jsonl');
  const n1='c107-host-model-0001',n2='c107-host-model-0002',n3='c107-host-model-0003';
  const frames=[
   {op:'TURN',ledgerFile:ledger,nonce:n1,request:req(q1),priorMessages:[],resetContext:true},
   {op:'MODEL_REPLY',nonce:n1,input_sha256:sha(q1),text:v1},
   {op:'TURN',ledgerFile:ledger,nonce:n2,request:req(q2),priorMessages:[q1],resetContext:false},
   {op:'MODEL_REPLY',nonce:n2,input_sha256:sha(q2),text:v2},
   {op:'TURN',ledgerFile:ledger,nonce:n3,request:req('Terza domanda'),priorMessages:[q1,q2],resetContext:false},
   {op:'MODEL_REPLY',nonce:'wrong-nonce',input_sha256:sha('Terza domanda'),text:'Not bound to nonce'},
   {op:'INSPECT',ledgerFile:ledger}
  ];
  const run=spawnSync(process.execPath,['scripts/c107-model-stdio.mjs'],{
   cwd:staged.install_root,encoding:'utf8',timeout:60000,maxBuffer:3000000,
   input:frames.map(x=>JSON.stringify(x)).join('\n')+'\n'});
  assert.equal(run.status,0,run.stderr);
  const out=run.stdout.trim().split('\n').map(JSON.parse);
  assert.deepEqual(out.map(x=>x.event),[
   'MODEL_REQUEST','VOICE','OBSERVATION','MODEL_REQUEST','VOICE','OBSERVATION',
   'MODEL_REQUEST','STOP','LEDGER']);
  assert.equal(out[0].task.current_input_utf8,q1);
  assert.equal(out[0].task.prior_messages_utf8.length,0);
  assert.deepEqual(out[3].task.prior_messages_utf8,[q1]);
  assert.equal(out[1].text,v1);assert.equal(out[4].text,v2);
  assert.equal(out[2].receipt.output_sha256,sha(v1));
  assert.equal(out[5].receipt.output_sha256,sha(v2));
  assert.equal(out[5].receipt.cognitive_window_length,2);
  assert.equal(out[2].receipt.host_language_callback_invoked,true);
  assert.equal(out[2].receipt.model_provider_origin_attested,false);
  assert.equal(out[2].receipt.native_chatgpt_hook_attested,false);
  assert.equal(out[7].receipt.first_unclosed_edge,'ACTUAL_HOST_MODEL_CALL_FAILED');
  assert.equal(out[8].value.count,2);
  assert.equal(inspectC107Ledger(ledger).count,2);
  assert.equal(fs.readFileSync(ledger,'utf8').includes(v1),false);
  assert.equal(fs.readFileSync(ledger,'utf8').includes(q1),false);
  console.log('C107_LANG_RUNTIME '+JSON.stringify({head,isolated_files:bundle.file_count,
   model_requests:3,consumed_model_voices:2,ledger_entries:2,
   node_runtime_original:true,real_model_provider_attested:false,native_hook_attested:false}));
 }finally{fs.rmSync(work,{recursive:true,force:true});}
});

test('strict model port refuses guarded identity turn before any C87 append',async()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c107-guard-'));
 try{
  const dir=path.join(base,'.ikant-host');fs.mkdirSync(dir,{mode:0o700});
  const ledger=path.join(dir,'c107-observations.jsonl');
  const {executeC107HostLanguageTurn}=await import('../host/c107-host-language-port.mjs');
  const denied=await executeC107HostLanguageTurn({ledgerFile:ledger,
   nonce:'c107-guard-identity-01',request:req('chi sei?'),
   priorMessages:[],resetContext:true,
   languagePort:{async generate(){return 'Il modello propone una risposta, ma il kernel tutela la propria identita.';}}});
  assert.equal(denied.status,'C107_HOST_LANGUAGE_STOP',JSON.stringify(denied));
  assert.equal(denied.first_unclosed_edge,'C114_ONTOLOGY_DISCLOSURE_REQUIRED');
  assert.equal(inspectC107Ledger(ledger).count,0);
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});
