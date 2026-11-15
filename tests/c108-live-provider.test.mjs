import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {inspectC92C107LanguageConfig,makeC92C107LanguagePort}
 from '../host/c92-live-provider.mjs';

test('C92 reused actual provider configuration fails closed without credentials',()=>{
 const missing={};
 const status=inspectC92C107LanguageConfig(missing);
 assert.equal(status.configured,false);
 assert.equal(status.actual_provider_invocation,false);
 assert.equal(status.native_chatgpt_hook_attested,false);
 assert.throws(()=>makeC92C107LanguagePort(missing),/C92_C107_ACTUAL_PROVIDER_CREDENTIALS_REQUIRED/);
});
test('C92 C107 provider validates original compute-first plan before HTTP request',async()=>{
 const port=makeC92C107LanguagePort({
  IKANT_C92_GENERATOR_MODEL:'model-test',
  IKANT_C92_GENERATOR_KEY:'dummy-test-credential-never-sent'});
 assert.equal(typeof port.generate,'function');
 await assert.rejects(port.generate({schema:'invented'}),/C92_C107_ORIGINAL_C70_PLAN_REQUIRED/);
 await assert.rejects(port.generate({
  schema:'ikant-le-c107-language-task/v1',
  current_input_utf8:'ciao',input_sha256:'0'.repeat(64),
  prior_messages_utf8:[],c70_plan:{schema:'ikant-le-c107-c70-before-language/v1',
   input_sha256:'0'.repeat(64),c70_output_sha256:'0'.repeat(64)}
 }),/C92_C107_ORIGINAL_C70_PLAN_REQUIRED/);
});
test('one-shot CLI stops without host-supplied real model credentials and does not create ledger',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c108-provider-'));
 try{
  const ledger=path.join(dir,'c107-observations.jsonl');
  const payload={request:{sourceHead:'a'.repeat(40),humanInput:'test',optIn:true,selection:{}},
   nonce:'c108-provider-0001',ledgerFile:ledger,priorMessages:[],resetContext:true};
  const p=spawnSync(process.execPath,['scripts/c108-live-turn.mjs'],{
   cwd:path.resolve(new URL('../',import.meta.url).pathname),
   encoding:'utf8',input:JSON.stringify(payload),timeout:12000,
   env:{PATH:process.env.PATH,LANG:'C.UTF-8'}});
  assert.equal(p.status,2,p.stderr);
  const result=JSON.parse(p.stdout.trim());
  assert.equal(result.status,'C108_LIVE_STOP');
  assert.equal(result.first_unclosed_edge,'HOST_MODEL_CREDENTIALS_NOT_INSTALLED');
  assert.equal(result.native_delivery_attested,false);
  assert.equal(fs.existsSync(ledger),false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
