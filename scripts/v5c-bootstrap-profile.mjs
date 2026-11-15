#!/usr/bin/env node
/** Physical CI runner timing of unmodified original tests, not native ChatGPT bootstrap latency. */
import {spawnSync,execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
import {performance} from 'node:perf_hooks';
const groups=[
 ['original_c72_zero_checkout_and_transit',['tests/project-c72-coldstart-zero-checkout.test.mjs',
 'tests/project-c72-coldstart-to-edu.test.mjs','tests/project-c72-receipt-transit.test.mjs']],
 ['original_source_c135_c87_c125_s03',['tests/project-repo-loader.test.mjs',
 'tests/project-session-e2e.test.mjs','tests/s03-owner-bound-presentation.test.mjs']]
];
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const results=[];
for(const [id,files] of groups){
 const start=performance.now();
 const child=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{
  encoding:'utf8',maxBuffer:12_000_000,timeout:180000});
 const duration_ms=Math.round((performance.now()-start)*1000)/1000;
 results.push({group:id,files,elapsed_ms:duration_ms,
  exit_code:child.status,signal:child.signal??null,execution_error:child.error?.code??null,
  output_sha256:crypto.createHash('sha256').update(child.stdout??'').digest('hex'),
  stdout_bytes:Buffer.byteLength(child.stdout??''),
  passed:child.status===0&&!child.error});
 if(child.status!==0||child.error){
  console.error((child.stderr??'').slice(-4000));
  console.error((child.stdout??'').slice(-4000));
  break;
 }
}
const out={schema:'ikant-v5c-original-test-process-timing/v1',source_head:head,node:process.version,
 platform:process.platform,scope:'CI_PROCESS_WALL_CLOCK_NOT_HUMAN_FIRST_TURN_NOT_PROVIDER_NATIVE',
 repetitions:1,results,all_passed:results.length===groups.length&&results.every(x=>x.passed),
 c72_owner_human_event_attested:false,c135_native_delivery_attested:false,
 global_dod_attested:false,release:'PRODUCT_NO_GO'};
process.stdout.write(JSON.stringify(out,null,2)+'\n');
if(!out.all_passed)process.exitCode=1;
