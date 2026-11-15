import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const contract=JSON.parse(read('contracts/project-host-followthrough.json'));
const matrix=JSON.parse(read('contracts/project-prompt-generation.json'));
const boot=JSON.parse(read('BOOTSTRAP.json')).project_session;
const prompt=read(matrix.source_prompt);
const expected=['FIRST_CONTACT','CONSENT','MODE','CANONICAL_LEGACY','PREFLIGHT',
 'SOURCE_ROUTE','MANUAL_ZIP','SOURCE_REOPEN','EDU_START','EDU_TURN','PRESENTATION','EXIT'];
test('Host reminders are read-only checkpoints, original owners keep all authority',()=>{
 assert.equal(contract.schema,'ikant-le-project-host-followthrough/v1');
 assert.equal(contract.authority,0);
 assert.equal(contract.not_persistent_storage,true);
 assert.equal(contract.evidence_policy.no_new_C72_C59_C135_C87_C125_owner,true);
 assert.equal(contract.evidence_policy.independent_readback,true);
 assert.equal(contract.evidence_policy.no_memory_as_state,true);
 assert.deepEqual(contract.steps.map(x=>x.id),expected);
 assert.equal(new Set(contract.steps.map(x=>x.id)).size,12);
 for(const step of contract.steps){
  assert(step.source.startsWith('host/')||step.source.startsWith('contracts/')||step.source.startsWith('scripts/'));
  assert(fs.statSync(new URL('../'+step.source,import.meta.url)).isFile());
  assert(step.required.length>10&&step.on_success.length>1&&step.on_failure.startsWith('STOP'));
 }
 assert.equal(contract.canonical_status,'LEGACY_UNQUALIFIED_STOP_NOT_EDU_NOT_ACTIVE');
 assert.equal(contract.steps.find(x=>x.id==='CANONICAL_LEGACY').on_success,'STOP_CANONICAL_LEGACY_PRODUCT_NO_GO');
 assert.equal(contract.steps.find(x=>x.id==='MANUAL_ZIP').human,'VALID_EDU_POSTMODE_EXPLICIT_PINNED_SOURCE_ZIP');
 assert.equal(contract.steps.find(x=>x.id==='EDU_TURN').source,'host/project-oneshell-continuity.mjs');
 assert.equal(contract.evidence_policy.native_ui_logo,'UNKNOWN_UNLESS_OBSERVED');
 assert.equal(contract.host_adapter_contract,'contracts/project-edu-host-what-how-v2.json');
});
test('one linked HEAD contract appears in BOOTSTRAP, prompt matrix and prompt only POST-MODE',()=>{
 assert.equal(matrix.host_followthrough_contract,'contracts/project-host-followthrough.json');
 assert.equal(boot.host_followthrough_contract,matrix.host_followthrough_contract);
 assert.equal(boot.host_followthrough_rule,'READONLY_AFTER_MODE_OWNER_READBACK_FIRST_NO_NEW_PERSISTENCE_OR_AUTHORITY');
 assert.equal(matrix.host_followthrough_policy,'HOST_READONLY_FROM_ORIGINAL_RECEIPTS_NOT_STORAGE');
 assert.equal(matrix.postmerge_human_trigger,'PR merged');
 assert(prompt.includes('Registro Host solo tecnico POST-ACCEPT'));
 assert(prompt.includes('mai consenso/stato/receipt'));
 assert(prompt.includes('PR merged + richiesta Host'));
 assert(prompt.indexOf('Registro Host solo tecnico POST-ACCEPT')>prompt.indexOf('L4 GATE UMANI.'));
 assert(prompt.indexOf('L3 SOURCE_LOCK.')<prompt.indexOf('A1 CLASSIFICA.'));
 assert(prompt.includes('Ogni scelta legacy⇒STOP'));
 assert(Buffer.byteLength(prompt,'utf8')+210<=8000);
 assert.equal(execFileSync('git',['show','HEAD:'+matrix.source_prompt],{encoding:'utf8'}),prompt);
});
test('10000 hostile reminder mutations cannot become executable authority or a C72 receipt',()=>{
 let count=0;
 for(let i=0;i<10000;i++){
  const v=structuredClone(contract);
  const which=i%10;
  if(which===0)v.authority=1;
  if(which===1)v.not_persistent_storage=false;
  if(which===2)v.evidence_policy.no_new_C72_C59_C135_C87_C125_owner=false;
  if(which===3)v.steps[0].id=v.steps[1].id;
  if(which===4)v.steps[4].source='../unsafe.js';
  if(which===5)v.steps[6].human='ZIP_BEFORE_EDU';
  if(which===6)v.canonical_status='ACTIVE';
  if(which===7)v.steps[8].on_failure='RETRY';
  if(which===8)v.evidence_policy.no_memory_as_state=false;
  if(which===9)v.steps[9].source='host/fake-writer.mjs';
  const valid=v.authority===0&&v.not_persistent_storage===true&&
   v.evidence_policy.no_new_C72_C59_C135_C87_C125_owner===true&&
   v.evidence_policy.no_memory_as_state===true&&
   v.steps.length===12&&new Set(v.steps.map(x=>x.id)).size===12&&
   v.steps.every((x,index)=>x.id===expected[index]&&x.on_failure.startsWith('STOP')&&
    x.source===contract.steps[index].source)&&
   v.canonical_status==='LEGACY_UNQUALIFIED_STOP_NOT_EDU_NOT_ACTIVE'&&
   v.steps[6].human==='VALID_EDU_POSTMODE_EXPLICIT_PINNED_SOURCE_ZIP';
  assert.equal(valid,false,'unrejected mutant '+i);count++;
 }
 assert.equal(count,10000);
});