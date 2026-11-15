import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {inspectC104,stageC104,runC104HostWorkers,qualifyC104C77Handoff} from '../host/c104-resumable-materialization.mjs';
import {buildC77Capsule} from '../scripts/c77-build-capsule.mjs';
import {executeC102SoftTurn,inspectC102Ledger} from '../host/c102-soft-host-bridge.mjs';
import {verifyC103HostAdapterWitness} from '../host/c103-host-adapter-conformance.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex');
const repo=path.resolve(new URL('../',import.meta.url).pathname);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
const terms=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
const accepted=acceptC72Terms({offer:terms,humanMessage:'I ACCEPT',termsPresented:true});
const orientation=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
const manifest=JSON.parse(execFileSync(process.execPath,['scripts/c104-source-spec.mjs'],{cwd:repo,encoding:'utf8'}));
const tmp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c104-test-'));
const ctx=root=>({sourceHead:head,selection,spec:manifest.spec,specSha256:manifest.specSha256,cacheRoot:root});
const read=f=>fs.readFileSync(path.join(repo,f.path));

test('exact-head inventory consists of the 34 C77 source paths and 70 Cx anchors, 66 unique blobs',()=>{
 assert.equal(manifest.source_paths,34);assert.equal(manifest.anchor_declarations,70);
 assert.equal(manifest.distinct_source_blobs,66);assert.equal(manifest.spec.files.length,66);
});

test('resumable host-local workers, no premature completion and physical readback',async()=>{
 const root=tmp();const c=ctx(root);let calls=0,parallel=0,peak=0;
 try{
  const first=inspectC104(c);
  assert.equal(first.verified,0);assert.equal(first.missing.length,66);
  assert.equal(first.compute_priority,'SOURCE_MATERIALIZATION');
  // A bad Git blob must not contribute to progress.
  assert.equal(stageC104({context:c,filePath:manifest.spec.files[0].path,
   contentBase64:Buffer.from('tamper').toString('base64'),carrierId:'LOCAL_FS'}).status,'C104_STOP');
  const selected=manifest.spec.files.slice(0,3);
  for(const f of selected){const r=stageC104({context:c,filePath:f.path,
    contentBase64:read(f).toString('base64'),carrierId:'LOCAL_FS'});
   assert.equal(r.verified,selected.indexOf(f)+1);assert.notEqual(r.status,'C104_SOURCE_BYTES_100PCT_NOT_RUNTIME');}
  const afterRestart=inspectC104(ctx(root));assert.equal(afterRestart.verified,3);
  const run=await runC104HostWorkers({context:c,carrierId:'REAL_LOCAL_SOURCE_READ',carrierEvidenceSha256:sha('source checkout observed'),concurrency:8,
   readFile:async f=>{calls++;parallel++;peak=Math.max(peak,parallel);
    await new Promise(ok=>setTimeout(ok,1));parallel--;return read(f);}});
  assert.equal(run.status,'C104_SOURCE_BYTES_100PCT_NOT_RUNTIME');
  assert.equal(run.actual_callback_invocations,63);assert.equal(calls,63);
  assert.ok(peak>1&&peak<=8);assert.equal(run.verified,66);
  assert.equal(run.runtime_qualified,false);assert.equal(run.native_host_hook_attested,false);
  assert.equal(inspectC104(ctx(root)).verified,66);
  assert.equal((await runC104HostWorkers({context:c,carrierEvidenceSha256:sha('source checkout observed'),readFile:async()=>{throw Error('CALL_NOT_EXPECTED')}})).actual_callback_invocations,0);
  const file=path.join(root,'c104-'+head+'-'+manifest.specSha256.slice(0,24),'objects',selected[0].path);
  fs.appendFileSync(file,'corrupt');
  const tamper=inspectC104(ctx(root));assert.equal(tamper.verified,65);assert.deepEqual(tamper.corrupt,[selected[0].path]);
  assert.notEqual(tamper.status,'C104_SOURCE_BYTES_100PCT_NOT_RUNTIME');
  assert.equal(stageC104({context:c,filePath:selected[0].path,contentBase64:read(selected[0]).toString('base64'),carrierId:'LOCAL_FS'}).status,'C104_STOP');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('original C77 builder and Node cognition after verified source graph, not from a C104 claim',async()=>{
 const cache=tmp(),out=tmp();const capsule=path.join(out,'capsule');
 try{
  const c=ctx(cache);
  const r=await runC104HostWorkers({context:c,carrierId:'REAL_LOCAL_CHECKOUT',carrierEvidenceSha256:sha('checkout current branch'),concurrency:8,readFile:async f=>read(f)});
  assert.equal(r.status,'C104_SOURCE_BYTES_100PCT_NOT_RUNTIME');
  // This original C77 build independently enforces git HEAD:blob identity.
  const build=buildC77Capsule({outDir:capsule});
  assert.equal(build.file_count,35);
  assert.equal(build.qualified_cx_count,70);
  const result=await qualifyC104C77Handoff({context:c,capsuleDir:capsule,
   manifestSha256:build.bundle_manifest_sha256,humanInput:'Definisci un criterio falsificabile'});
  assert.equal(result.status,'C104_ORIGINAL_C77_LOCAL_COGNITION_EXECUTED',JSON.stringify(result));
  assert.equal(result.local_c77_invoked,true);
  assert.equal(result.runtime_qualified,true);
  assert.equal(result.input_sha256,sha(Buffer.from('Definisci un criterio falsificabile')));
  assert.equal(result.output_sha256,sha(Buffer.from(result.voice_utf8)));
  assert.equal(result.active,false);assert.equal(result.native_delivery_attested,false);
  // Same physical host test connects the cognitive readback to original
  // C101/C102/C87 and checks the existing minimum C103 envelope contract.
  const session=path.join(cache,'.ikant-host');fs.mkdirSync(session,{mode:0o700});
  const ledger=path.join(session,'c102-soft-observations.jsonl');
  const nonce='c104-c103-local-adapter-0001';
  const request={sourceHead:head,selection,
    humanInput:'Definisci un criterio falsificabile',optIn:true};
  const bound=executeC102SoftTurn({ledgerFile:ledger,nonce,request});
  assert.equal(bound.status,'C102_ORIGINAL_C101_C87_LOCAL_READBACK',JSON.stringify(bound));
  const reopened=inspectC102Ledger(ledger);
  assert.equal(reopened.status,'C102_LEDGER_REOPENED');
  const minimum=verifyC103HostAdapterWitness({request,nonce,receipt:bound,inspection:reopened});
  assert.equal(minimum.status,'C103_ENVELOPE_CONFORMANT_NOT_HOST_ATTESTED',JSON.stringify(minimum));
  assert.equal(minimum.input_sha256,result.input_sha256);
  assert.equal(minimum.native_delivery_attested,false);
  assert.equal(minimum.host_runtime_execution_attested,false);
  console.log('C104_C103_ORIGINAL_HOST_ADAPTER '+JSON.stringify({
   c102:bound.status,c103:minimum.status,c87:reopened.status,
   ledger_entries:reopened.count,localhost_execution:true,
   native_chatgpt_hook:false}));
  console.log('C104_ORIGINAL_EXECUTION '+JSON.stringify({source_objects:66,
   materialization:r.status,c77_build:build.file_count,
   kernel:result.status,c70:result.c70_status,c71:result.c71_status,
   host_native_hook:false,active:false}));
 }finally{fs.rmSync(cache,{recursive:true,force:true});fs.rmSync(out,{recursive:true,force:true});}
});


test('unchanged failed carrier evidence is suppressed across local invocations; new capability evidence can recover',async()=>{
 const root=tmp(),c=ctx(root),f=manifest.spec.files[0];let failedCalls=0;
 try{
  const reader=async ({path:p})=>{if(p===f.path){failedCalls++;throw Error('NO_PHYSICAL_PORT_BYTES');}return read({path:p});};
  const first=await runC104HostWorkers({context:c,carrierId:'HOST_FILE_PORT',
   carrierEvidenceSha256:sha('bridge unqualified epoch 1'),concurrency:8,readFile:reader});
  assert.equal(first.verified,65);assert.equal(first.status,'C104_MATERIALIZATION_NEXT_REQUIRED');
  assert.equal(failedCalls,1);
  const second=await runC104HostWorkers({context:ctx(root),carrierId:'HOST_FILE_PORT',
   carrierEvidenceSha256:sha('bridge unqualified epoch 1'),concurrency:8,readFile:reader});
  assert.equal(second.verified,65);assert.equal(second.actual_callback_invocations,0);
  assert.equal(second.skipped_unchanged_failed_carrier,1);
  assert.equal(failedCalls,1);
  const third=await runC104HostWorkers({context:c,carrierId:'HOST_FILE_PORT',
   carrierEvidenceSha256:sha('bridge real capability changed epoch 2'),concurrency:8,
   readFile:async()=>read(f)});
  assert.equal(third.verified,66);assert.equal(third.status,'C104_SOURCE_BYTES_100PCT_NOT_RUNTIME');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('actual host-built NDJSON adapter stages exact source bytes and survives process restart',()=>{
 const root=tmp(),config=path.join(root,'context.json'),c=ctx(root),first=manifest.spec.files[0];
 try{
  fs.writeFileSync(config,JSON.stringify(c),{mode:0o600});
  const packet=[{op:'INSPECT'},{op:'STAGE',path:first.path,
   contentBase64:read(first).toString('base64'),carrierId:'REAL_STDIN_PORT'},
   {op:'NEXT'},{op:'COMPLETE'}];
  const cmd=['scripts/c104-ingress-cli.mjs','--config',config,'--ndjson'];
  const launched=spawnSync(process.execPath,cmd,{cwd:repo,encoding:'utf8',timeout:120000,
   input:packet.map(JSON.stringify).join('\n')+'\n',maxBuffer:3e6});
  assert.equal(launched.status,0,launched.stderr);
  const rows=launched.stdout.trim().split('\n').map(JSON.parse);
  assert.equal(rows.length,4);assert.equal(rows[0].verified,0);
  assert.equal(rows[1].verified,1);assert.equal(rows[2].verified,1);
  assert.equal(rows[3].status,'C104_MATERIALIZATION_NEXT_REQUIRED');
  assert.equal(rows[3].runtime_qualified,false);
  const second=spawnSync(process.execPath,cmd,{cwd:repo,encoding:'utf8',timeout:120000,
   input:'{"op":"INSPECT"}\n'});
  const reread=JSON.parse(second.stdout.trim());assert.equal(reread.verified,1);
  assert.equal(reread.missing.length,65);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
