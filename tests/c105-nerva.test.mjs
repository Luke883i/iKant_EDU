import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {runC104HostWorkers} from '../host/c104-resumable-materialization.mjs';
import {buildC77Capsule} from '../scripts/c77-build-capsule.mjs';
import {dispatchC105Nerva} from '../host/c105-nerva.mjs';

const root=path.resolve(new URL('../',import.meta.url).pathname);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const spec=JSON.parse(execFileSync(process.execPath,['scripts/c104-source-spec.mjs'],{cwd:root,encoding:'utf8'}));
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:'b'.repeat(64)});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const orientation=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
const tmp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c105-nerva-'));
const context=cacheRoot=>({sourceHead:head,selection,spec:spec.spec,specSha256:spec.specSha256,cacheRoot});
const text='Definisci un criterio falsificabile';
test('NERVA composes original C104 -> C77 -> C99 -> C102/C87 -> C103 with real local bytes', async()=>{
 const base=tmp(),cache=path.join(base,'cache'),capsule=path.join(base,'capsule');
 const obs=path.join(base,'.ikant-host'),ledger=path.join(obs,'c102-soft-observations.jsonl');
 fs.mkdirSync(cache);fs.mkdirSync(obs);
 const ctx=context(cache);
 const frame=props=>({...props,context:ctx,ledgerFile:ledger,capsuleDir:capsule,
   manifestSha256:build?.bundle_manifest_sha256});
 let build;
 try{
  const before=await dispatchC105Nerva(frame({command:'GET STATE'}));
  assert.equal(before.status,'C105_OBSERVATION_NOT_EXECUTION');
  assert.equal(before.verified,0);
  const next=await dispatchC105Nerva(frame({command:'GET NEXT'}));
  assert.equal(next.next_batch.length,8);
  const first=spec.spec.files[0];
  const staged=await dispatchC105Nerva(frame({command:'PUT BLOB',filePath:first.path,
   contentBase64:fs.readFileSync(path.join(root,first.path)).toString('base64'),carrierId:'TEST_LOCAL'}));
  assert.equal(staged.status,'C105_SOURCE_STAGE_LOCAL_REOPENED');
  assert.equal(staged.verified,1);
  assert.equal((await dispatchC105Nerva(frame({command:'GET MISSING'}))).missing.length,65);
  assert.equal((await dispatchC105Nerva(frame({command:'RUN TURN'}))).status,'C105_STOP');
  const r=await runC104HostWorkers({context:ctx,carrierId:'TEST_LOCAL',
   carrierEvidenceSha256:sha('real checked-out files'),concurrency:8,
   readFile:async f=>fs.readFileSync(path.join(root,f.path))});
  assert.equal(r.status,'C104_SOURCE_BYTES_100PCT_NOT_RUNTIME');
  build=buildC77Capsule({outDir:capsule});
  const request={sourceHead:head,selection,humanInput:text,optIn:true};
  const nonce='c105-nerva-test-0001';
  const executed=await dispatchC105Nerva(frame({command:'RUN TURN',nonce,request}));
  assert.equal(executed.status,'C105_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED',JSON.stringify(executed));
  assert.equal(executed.c103_status,'C103_ENVELOPE_CONFORMANT_NOT_HOST_ATTESTED');
  assert.equal(executed.actual_local_kernel_invoked,true);
  assert.equal(executed.host_execution_independently_attested,false);
  assert.equal(executed.native_delivery_attested,false);
  assert.equal(executed.active,false);
  assert.equal(executed.input_sha256,sha(text));
  assert.equal(executed.output_sha256,sha(executed.voice_utf8));
  assert.equal(executed.ledger_entries,1);
  assert.equal((await dispatchC105Nerva(frame({command:'GET LEDGER'}))).ledger_entries,1);
  assert.equal((await dispatchC105Nerva(frame({command:'RUN TURN',nonce,request}))).status,'C105_STOP');
  const d=fs.readFileSync(ledger,'utf8');
  assert.equal(d.includes(text),false);assert.equal(d.includes(executed.voice_utf8),false);
  assert.equal((await dispatchC105Nerva(frame({command:'SET ACTIVE'}))).first_unclosed_edge,'C105_FIXED_LEXICON_ONLY');
  assert.equal((await dispatchC105Nerva(frame({command:'GET STATE; DELETE LEDGER'}))).status,'C105_STOP');
  assert.equal((await dispatchC105Nerva(frame({command:'RUN TURN',nonce:'c105-nerva-test-0002',
   request:{...request,optIn:false}}))).status,'C105_STOP');
  fs.appendFileSync(ledger,'{"tamper":true}\n');
  assert.equal((await dispatchC105Nerva(frame({command:'GET LEDGER'}))).status,'C105_STOP');
  console.log('C105_REAL_SOURCE '+JSON.stringify({head,c104:r.status,
   c77:executed.c77_status,c102:executed.c102_status,c103:executed.c103_status,
   ledger_before_tamper:1,native_hook:false,active:false}));
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});
test('NERVA explicit CLI reads one frame per line, no inferred native event or background continuation',()=>{
 const base=tmp(),ledgerDir=path.join(base,'.ikant-host');
 fs.mkdirSync(ledgerDir);
 const config={context:context(base),ledgerFile:path.join(ledgerDir,'c102-soft-observations.jsonl'),
  capsuleDir:path.join(base,'capsule'),manifestSha256:'0'.repeat(64)};
 const file=path.join(base,'config.json');fs.writeFileSync(file,JSON.stringify(config));
 try{
  const run=spawnSync(process.execPath,['scripts/c105-nerva-cli.mjs','--config',file,'--ndjson'],{
   cwd:root,encoding:'utf8',input:['GET STATE','GET NEXT','DROP LEDGER'].map(command=>JSON.stringify({command})).join('\n')+'\n',timeout:20000});
  assert.equal(run.status,0,run.stderr);
  const rows=run.stdout.trim().split('\n').map(JSON.parse);
  assert.equal(rows.length,3);
  assert.equal(rows[0].status,'C105_OBSERVATION_NOT_EXECUTION');
  assert.equal(rows[1].status,'C105_OBSERVATION_NOT_EXECUTION');
  assert.equal(rows[2].status,'C105_STOP');
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});
