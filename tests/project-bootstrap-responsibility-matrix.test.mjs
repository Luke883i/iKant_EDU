import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const original=p=>execFileSync('git',['show','HEAD:'+p],{encoding:'utf8'});
const matrix=JSON.parse(read('contracts/project-prompt-generation.json'));
const boot=JSON.parse(read('BOOTSTRAP.json')).project_session;
const routes=matrix.responsibility_registry;
const sourceCache=new Map(routes.map(x=>[x.module,read(x.module)]));
function ownerCheck(rows){
 if(!Array.isArray(rows)||rows.length!==13||new Set(rows.map(x=>x.route)).size!==rows.length)return false;
 for(const row of rows){
  if(row.authority!==0||row.provider_bound!==false||!row.scope||!row.boundary||!row.proof||
   !/^[A-Za-z0-9._/-]+$/.test(row.module||''))return false;
  let code;
  try{code=sourceCache.get(row.module);if(typeof code!=='string')return false}catch{return false}
  if(row.export===null){if(row.route!=='ENGINEERING'||!code.includes('HOST_ENGINEERING'))return false;continue}
  if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(row.export||'')||
   !new RegExp('export\\s+(?:async\\s+)?(?:function|const|class)\\s+'+row.export+'\\b').test(code))return false;
 }
 return true;
}
test('13 declarative routes map 1:1 to original exports or an explicit Host-only project prompt',()=>{
 assert.equal(ownerCheck(routes),true);
 assert.equal(boot.prompt,matrix.source_prompt);
 assert.equal(boot.runtime_entry,matrix.runtime_owner);
 assert.equal(boot.postaccept_host_recovery_executor,
  'host/project-c72-host-recovery.mjs#executeC72PostAcceptRecovery');
 assert.equal(boot.host_port_adapter,'host/project-c72-capability-port.mjs#bindC72Transport');
 assert.equal(boot.host_port_cli,'scripts/project-c72-portable-cli.mjs');
 assert.equal(matrix.host_port_not_native_hook,true);
 assert.equal(routes.find(x=>x.route==='C72_HOST_PORT').export,'runC72SelectedHostIngress');
 assert.equal(routes.find(x=>x.route==='C72_HOST_PORT').module,'host/project-c72-physical-ingress.mjs');
 assert.equal(boot.host_port_orchestrator,'host/project-c72-physical-ingress.mjs#runC72SelectedHostIngress');
 assert.equal(matrix.host_physical_orchestrator,boot.host_port_orchestrator);
 assert.equal(matrix.host_staging_cli,boot.host_port_staged_cli);
 assert.equal(boot.postaccept_reentry,'host/project-c72-postaccept-reentry.mjs#reenterC72V2PostAccept');
 assert.equal(routes.find(x=>x.route==='C72_POSTACCEPT_EXEC').module,'host/project-c72-host-recovery.mjs');
 assert.equal(routes.find(x=>x.route==='C72_REENTRY').module,'host/project-c72-postaccept-reentry.mjs');
 assert.equal(routes.find(x=>x.route==='C72_MODE').module,'host/c72-public-mode-admission.mjs');
 assert.equal(routes.find(x=>x.route==='EDU_START').module,boot.runtime_entry);
 assert.equal(routes.find(x=>x.route==='ONESHell_EMIT').module,'host/project-oneshell-emission.mjs');
 assert.equal(matrix.template_binding,'EXACT_GIT_HEAD_BLOB');
});
test('portable release and runtime reauthorization are not interchangeable',()=>{
 const p=matrix.release_protocol;
 assert.equal(p.canonical,'AFTER_HUMAN_MERGE_ON_MAIN_AND_EXPLICIT_HOST_REQUEST');
 assert.equal(p.human_action,'ONE_POSTMERGE_GENERATE_PROMPT_REQUEST_NO_C72_GATE_FOR_HOST_ENGINEERING');
 assert.equal(p.runtime_epoch,'EXPLICIT_REPIN_REQUIRES_FRESH_C72_NO_RECEIPT_LEDGER_OR_C135_TRANSFER');
 assert.equal(p.installed_equivalence,'UNKNOWN_UNLESS_REAL_PROJECT_PROMPT_BYTES_OBSERVED');
 assert.equal(p.no_auto_change_runtime,true);assert.equal(p.no_native_delivery_claim,true);
 assert.equal(matrix.no_auto_repin,true);
 assert.equal(boot.host_engineering,'SEPARATE_ENGINEERING_HEAD_NO_C72_OR_IKANT_RUNTIME');
 const prompt=read(matrix.source_prompt);
 assert(prompt.includes('PR merged + richiesta Host')&&prompt.includes('POST-MERGE'));
 assert(prompt.includes('EXPLICIT_REPIN_REQUIRES_FRESH_C72'));
 assert(prompt.includes('A1 CLASSIFICA.'));
 assert(prompt.includes('ESITO | A | B | PROVA | EDGE | NEXT'));
 assert.equal(Buffer.byteLength(prompt,'utf8')+210<=8000,true);
});
test('10,000 independently evaluated mutated mapping cases are rejected and traceable',()=>{
 // Exhaustive 10*10*10*10 synthetic indexing; no native-provider calls are claimed.
 const seen=new Set(),bad=['authority','provider_bound','scope','boundary','proof','module','export','route','duplicate','delete'];
 for(let i=0;i<10000;i++){
  const a=i%10,b=Math.floor(i/10)%10,c=Math.floor(i/100)%10,d=Math.floor(i/1000)%10;
  const mutated=structuredClone(routes),idx=(b+c*10+d*100)%mutated.length;
  const row=mutated[idx];
  switch(bad[a]){
   case 'authority':row.authority=1;break;
   case 'provider_bound':row.provider_bound=true;break;
   case 'scope':row.scope='';break;
   case 'boundary':row.boundary='';break;
   case 'proof':row.proof='';break;
   case 'module':row.module='../escape';break;
   case 'export':row.export='absent_export';break;
   case 'route':row.route=mutated[(idx+1)%mutated.length].route;break;
   case 'duplicate':mutated.push({...row});break;
   case 'delete':mutated.splice(idx,1);break;
  }
  assert.equal(ownerCheck(mutated),false,'unrejected mutation '+i);
  seen.add([a,b,c,d].join(':'));
 }
 assert.equal(seen.size,10000);
 // Real Git HEAD references remain byte-identical to the checkout on CI.
 assert.equal(original(matrix.source_prompt),read(matrix.source_prompt));
});


test('E16 Project host prompt distinguishes eight-source packet from ninth transit carrier',()=>{
 const prompt=read(matrix.source_prompt);
 assert(prompt.includes('sourcePacket (8 blob), transitSourcePacket (carrier)'));
 const pin=boot.postaccept_original_c72_transit_pin;
 assert.equal(pin?.path,'host/project-c72-receipt-transit.mjs');
 assert.match(pin?.blob_sha1||'',/^[0-9a-f]{40}$/u);
 assert.equal(pin?.source,'FIRST_TURN_BOOTSTRAP_SHA_VERIFIED');
});
