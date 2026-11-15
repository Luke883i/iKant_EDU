import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {buildPartialKit} from '../scripts/project-c72-partial-source-kit.mjs';
import {selectC72V2Mode,validateC72V2ModeSelection} from '../host/c72-public-mode-admission.mjs';
import {planOneShellEduSource} from '../host/project-oneshell-edu.mjs';
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const kit=buildPartialKit({head});
test('original C72 cold seed feeds separately selected original EDU and P1 decision, never auto-EDU',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'c72-next-'));
 try{
  fs.chmodSync(root,0o700);
  const seed=path.join(root,'seed.mjs');
  fs.writeFileSync(seed,Buffer.from(kit.seed.contentBase64,'base64'),{mode:0o600});
  const q={schema:'ikant-host-c72-coldstart/v1',humanMessage:'I ACCEPT',
   freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',liveHead:head,seedBlobSha1:kit.seed.blob_sha1,
   expectedBlobShas:Object.fromEntries(kit.files.map(d=>[d.path,d.blob_sha1])),
   priorTurnEvidence:{source_head:head,host_link_displayed:true,distinct_human_message_observed:true,
    terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md',
    pinned_blob_shas:Object.fromEntries(kit.files.slice(0,5).map(d=>[d.path,d.blob_sha1]))},
   sourcePacket:kit.files.map(d=>({path:d.path,contentBase64:d.contentBase64}))};
  const run=spawnSync(process.execPath,[seed],
   {cwd:root,input:JSON.stringify(q),encoding:'utf8',timeout:15000,maxBuffer:2000000});
  assert.equal(run.status,0,run.stdout+' '+run.stderr);
  const original=JSON.parse(run.stdout);
  assert.equal(original.ok,true);
  assert.equal(original.accepted.selection_pending,true);
  assert.equal(original.accepted.selected_mode,null);
  // A later separate exact human message is required in the actual Host.
  const edu=selectC72V2Mode({accepted:original.accepted,orientation:original.introduction,
   humanMessage:'EDU'});
  assert.equal(validateC72V2ModeSelection(edu,{mode:'EDU',sourceHead:head}),true);
  const unknown=planOneShellEduSource({selection:edu,sourceState:'SOURCE_ABSENT',
   bridgeState:'UNKNOWN',nodeReady:true,manualExtractorReady:true});
  assert.equal(unknown.slots.NEXT,'VERIFY_MACHINE_BRIDGE');
  const unavailable=planOneShellEduSource({selection:edu,sourceState:'SOURCE_ABSENT',
   bridgeState:'DEFINITIVELY_UNAVAILABLE',nodeReady:true,manualExtractorReady:true});
  assert.equal(unavailable.slots.NEXT,'UPLOAD_PINNED_SOURCE_ZIP');
  assert.equal(unavailable.slots.PROVA.includes(head),true);
  const noMode=planOneShellEduSource({sourceState:'SOURCE_ABSENT',
   bridgeState:'DEFINITIVELY_UNAVAILABLE',nodeReady:true,manualExtractorReady:true});
  assert.equal(noMode.slots.A,'NO_VOICE');
  assert.equal(noMode.slots.NEXT,'STOP');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
