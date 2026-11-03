import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {reopenC72Accepted,reopenC72Transit,storeC72Accepted,storeC72Selected} from '../host/project-c72-receipt-transit.mjs';
import {makeOneShellChatPresentation} from '../host/project-oneshell-chat-presentation.mjs';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
 'host/project-c72-postaccept-reentry.mjs'];
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function call(relative,q){
 const x=spawnSync(process.execPath,[path.join(ROOT,relative)],{input:JSON.stringify(q),encoding:'utf8',maxBuffer:2*1024*1024});
 const v=JSON.parse(x.stdout.trim());return {exit:x.status,...v};
}
function fixture(){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c72-transit-'));
 fs.chmodSync(directory,0o700);
 const head='a'.repeat(40),docs=files.map(p=>{const b=fs.readFileSync(path.join(ROOT,p));return {path:p,contentBase64:b.toString('base64'),sha:blob(b)};});
 const expectedBlobShas=Object.fromEntries(docs.map(d=>[d.path,d.sha]));
 const witness={source_head:head,host_link_displayed:true,distinct_human_message_observed:true,
  terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md',
  pinned_blob_shas:Object.fromEntries(docs.slice(0,5).map(d=>[d.path,d.sha]))};
 const seed=fs.readFileSync(path.join(ROOT,'host/project-c72-coldstart-seed.mjs'));
 return {directory,head,docs,expectedBlobShas,witness,seedBlobSha1:blob(seed)};
}
test('three separate Node processes transfer ORIGINAL accepted, intro, and EDU then block replay',()=>{
 const f=fixture();try{
  const a=call('host/project-c72-coldstart-seed.mjs',{schema:'ikant-host-c72-coldstart/v1',
   humanMessage:'I ACCEPT',freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',
   liveHead:f.head,priorTurnEvidence:f.witness,expectedBlobShas:f.expectedBlobShas,
   sourcePacket:f.docs.map(({path,contentBase64})=>({path,contentBase64})),
   seedBlobSha1:f.seedBlobSha1,transitDirectory:f.directory});
  assert.equal(a.ok,true,JSON.stringify(a));assert.equal(a.original_owner_invoked,true);
  const accepted=reopenC72Accepted({directory:f.directory,sourceHead:f.head});
  assert.equal(accepted.ok,true);
  assert.equal(reopenC72Transit({directory:f.directory,sourceHead:f.head}).ok,false);
  const m=call('scripts/project-c72-cold-mode-cli.mjs',{schema:'ikant-host-c72-later-mode/v1',
   humanMessage:'EDU',freshHumanTurn:true,priorAcceptanceObserved:true,ownerOutcome:'NOT_INVOKED',
   sourceHead:f.head,liveHead:f.head,expectedBlobShas:f.expectedBlobShas,
   sourcePacket:f.docs.slice(5,7).map(({path,contentBase64})=>({path,contentBase64})),
   transitDirectory:f.directory});
  assert.equal(m.ok,true,JSON.stringify(m));
  const r=call('scripts/project-c72-receipt-reopen-cli.mjs',{directory:f.directory,sourceHead:f.head});
  assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.selection.receipt_sha256,m.selection.receipt_sha256);
  assert.equal(r.accepted.receipt_sha256,a.accepted.receipt_sha256);
  const duplicateAccept=call('host/project-c72-coldstart-seed.mjs',{
   schema:'ikant-host-c72-coldstart/v1',humanMessage:'I ACCEPT',freshHumanTurn:true,
   ownerOutcome:'NOT_INVOKED',liveHead:f.head,priorTurnEvidence:f.witness,
   expectedBlobShas:f.expectedBlobShas,sourcePacket:f.docs.map(({path,contentBase64})=>({path,contentBase64})),
   seedBlobSha1:f.seedBlobSha1,transitDirectory:f.directory});
  assert.equal(duplicateAccept.ok,false);assert.equal(duplicateAccept.original_owner_invoked,false);
  const duplicateMode=call('scripts/project-c72-cold-mode-cli.mjs',{
   schema:'ikant-host-c72-later-mode/v1',humanMessage:'EDU',freshHumanTurn:true,
   priorAcceptanceObserved:true,ownerOutcome:'NOT_INVOKED',sourceHead:f.head,liveHead:f.head,
   expectedBlobShas:f.expectedBlobShas,sourcePacket:f.docs.slice(5,7).map(({path,contentBase64})=>({path,contentBase64})),
   transitDirectory:f.directory});
  assert.equal(duplicateMode.ok,false);assert.equal(duplicateMode.original_owner_invoked,false);
  assert.equal(storeC72Accepted({directory:f.directory,sourceHead:f.head,
   accepted:r.accepted,introduction:r.introduction}).ok,false,'no second acceptance write');
  assert.equal(storeC72Selected({directory:f.directory,sourceHead:f.head,selection:r.selection}).ok,false,'no second mode write');
  assert.equal(reopenC72Transit({directory:f.directory,sourceHead:'b'.repeat(40)}).ok,false);
  const loc=path.join(f.directory,'c72-original-selected.json');const record=JSON.parse(fs.readFileSync(loc));
  record.payload.selection.selected_mode='CANONICAL';fs.writeFileSync(loc,JSON.stringify(record)+'\n');
  assert.equal(reopenC72Transit({directory:f.directory,sourceHead:f.head}).ok,false,'tamper fails closed');
 }finally{fs.rmSync(f.directory,{recursive:true,force:true});}
});
test('rich host emission contains original verified SVG, Markdown never claims native mount',()=>{
 const frame=oneShellFrame({esito:'EDU_SELECTED',b:'Host only',prova:'HASH',edge:'PENDING',next:'STOP'});
 const rich=makeOneShellChatPresentation({frame,richUiAvailable:true});
 assert.equal(rich.ok,true,JSON.stringify(rich));assert.equal(rich.slots.A,'NO_VOICE');
 assert.equal((rich.verified_host_html_utf8.match(/class="ikant-brand-mark"/g)||[]).length,1);
 assert.equal(rich.verified_host_brand_sha256,rich.render_plan.brand.sha256);
 assert.equal(rich.native_ui_attested,false);
 const fallback=makeOneShellChatPresentation({frame});
 assert.equal(fallback.ok,true);assert.equal(fallback.verified_host_html_utf8,null);
});
