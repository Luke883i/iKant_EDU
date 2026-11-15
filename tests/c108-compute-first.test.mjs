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
import {buildC107Package,stageC107Package} from '../scripts/c107-pack.mjs';

const root=path.resolve(new URL('../',import.meta.url).pathname);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const offer=issueC72TermsOffer({sourceHead:head,
 termsDigest:sha(fs.readFileSync(path.join(root,'TERMS.md')))});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const selection=selectC72Mode({accepted,
 orientation:presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
const question='Descrivi il funzionamento di un oggetto quotidiano.';
const voice='Questa risposta linguistica considera la domanda e il piano calcolato dai kernel iKant.';
test('original C70 plan precedes host language and mismatch aborts before C87 append',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c107-precompute-'));
 try{
  const pack=buildC107Package({root,expectedHead:head});
  assert.equal(pack.status,'C107_PACKAGE_BUILT_NOT_TRANSPORTED');
  const staged=stageC107Package({payload:pack.payload,expectedSha256:pack.sha256,
   expectedHead:head,privateParent:temp});
  assert.equal(staged.status,'C107_PACKAGE_REOPENED_NOT_EXECUTED');
  const host=await import(pathToFileURL(path.join(staged.install_root,
   'host/c107-host-language-port.mjs')).href);
  const runtime=await import(pathToFileURL(path.join(staged.install_root,
   'host/c107-experimental-turn.mjs')).href);
  const dir=path.join(staged.install_root,'.ikant-host');fs.mkdirSync(dir);
  const ledgerFile=path.join(dir,'c107-observations.jsonl');
  const request={sourceHead:head,selection,humanInput:question,optIn:true};
  let invoked=0;
  const port={async generate(task){
   invoked++;
   assert.equal(task.input_sha256,sha(question));
   assert.equal(task.c70_plan.schema,'ikant-le-c107-c70-before-language/v1');
   assert.equal(task.c70_plan.input_sha256,sha(question));
   assert.match(task.c70_plan.c70_output_sha256,/^[a-f0-9]{64}$/);
   assert.equal(typeof task.c70_plan.central_mode,'string');
   assert.equal(typeof task.c70_plan.method,'string');
   assert.equal(task.c70_plan.cognitive_window_length,1);
   return voice;
  }};
  const first=await host.executeC107HostLanguageTurn({ledgerFile,
   nonce:'c107-compute-first-01',request,priorMessages:[],
   resetContext:true,languagePort:port});
  assert.equal(first.status,'C107_HOST_CALLBACK_LOCAL_RUNTIME_READBACK',JSON.stringify(first));
  assert.equal(first.voice_utf8,voice);
  assert.equal(first.output_sha256,sha(voice));
  assert.equal(runtime.inspectC107Ledger(ledgerFile).count,1);
  assert.equal(invoked,1);
  const wrong=runtime.executeC107Turn({
   ledgerFile,nonce:'c107-plan-drift-002',
   request:{...request,modelCandidate:{input_sha256:sha(question),text:voice}},
   priorMessages:[question],resetContext:false,requireHostLanguage:true,
   expectedC70OutputSha256:'0'.repeat(64)});
  assert.equal(wrong.status,'C107_STOP',JSON.stringify(wrong));
  assert.equal(wrong.first_unclosed_edge,'C107_COMPUTE_FIRST_C70_PLAN_DRIFT');
  assert.equal(runtime.inspectC107Ledger(ledgerFile).count,1);
  console.log('C107_COMPUTE_FIRST '+JSON.stringify({
   original_c70_before_language:true,model_callback_invoked:invoked,
   original_C100:true,original_C87:true,drift_rejected_before_append:true,
   native_delivery:false,real_model_provider_attested:false}));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
