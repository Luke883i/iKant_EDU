import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildPartialKit} from '../scripts/project-c72-partial-source-kit.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const kit=buildPartialKit({head});
const modeCli=path.join(root,'scripts/project-c72-cold-mode-cli.mjs');
const shas=Object.fromEntries(kit.files.map(f=>[f.path,f.blob_sha1]));
function spawn(file,q,cwd){
 const p=spawnSync(process.execPath,[file],{cwd,input:JSON.stringify(q),
  encoding:'utf8',timeout:25000,maxBuffer:3500000});
 return {code:p.status,signal:p.signal,result:JSON.parse(p.stdout||'{}'),stderr:p.stderr};
}
function accept(temp){
 const seed=path.join(temp,'original-seed.mjs');
 fs.writeFileSync(seed,Buffer.from(kit.seed.contentBase64,'base64'),{mode:0o600});
 const q={schema:'ikant-host-c72-coldstart/v1',humanMessage:'I ACCEPT',
  freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',liveHead:head,
  seedBlobSha1:kit.seed.blob_sha1,expectedBlobShas:shas,
  priorTurnEvidence:{source_head:head,host_link_displayed:true,distinct_human_message_observed:true,
    terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md',
    pinned_blob_shas:Object.fromEntries(kit.files.slice(0,5).map(x=>[x.path,x.blob_sha1]))},
  sourcePacket:kit.files.map(f=>({path:f.path,contentBase64:f.contentBase64}))};
 const run=spawn(seed,q,temp);
 assert.equal(run.code,0,JSON.stringify(run));assert.equal(run.result.ok,true);
 return run.result;
}
function request(accepted,introduction){
 return {schema:'ikant-host-c72-later-mode/v1',humanMessage:'EDU',
 freshHumanTurn:true,priorAcceptanceObserved:true,ownerOutcome:'NOT_INVOKED',
 sourceHead:head,liveHead:head,accepted,introduction,expectedBlobShas:shas,
 sourcePacket:kit.files.filter(x=>['contracts/c72-public-mode-admission-v2.json',
   'host/c72-public-mode-admission.mjs'].includes(x.path))
   .map(x=>({path:x.path,contentBase64:x.contentBase64}))};
}
test('real original C72 accepts in first Node subprocess and selects EDU in a later separate cold subprocess',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'c72-phases-'));
 try{
  fs.chmodSync(d,0o700);
  const first=accept(d),q=request(first.accepted,first.introduction);
  const later=spawn(modeCli,q,d);
  assert.equal(later.code,0,JSON.stringify(later));
  assert.equal(later.result.status,'C72_ORIGINAL_EDU_MODE_VERIFIED');
  assert.equal(later.result.original_owner_invoked,true);
  assert.equal(later.result.verified_file_count,2);
  assert.equal(later.result.selection.selected_mode,'EDU');
  assert.equal(later.result.selection.acceptance_receipt_sha256,first.accepted.receipt_sha256);
  assert.equal(later.result.selection.orientation_receipt_sha256,first.introduction.receipt_sha256);
  assert.equal(later.result.active,false);
  assert.equal(later.result.native_event_attested,false);
  assert.equal(fs.existsSync(path.join(d,'host','c72-public-mode-admission.mjs')),false);
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
test('later EDU cannot bypass owner, exact message, first-turn source or bytes',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'c72-mode-reject-'));
 try{
  fs.chmodSync(d,0o700);const first=accept(d),q=request(first.accepted,first.introduction);
  const bad=[
   {...q,humanMessage:'I ACCEPT'},
   {...q,humanMessage:'CANONICAL'},
   {...q,freshHumanTurn:false},
   {...q,priorAcceptanceObserved:false},
   {...q,liveHead:'f'.repeat(40)},
   {...q,ownerOutcome:'UNKNOWN'},
   {...q,sourcePacket:[q.sourcePacket[0]]},
   {...q,sourcePacket:q.sourcePacket.map((x,i)=>i===1?{...x,contentBase64:'Zg=='}:x)},
   {...q,accepted:{...q.accepted,receipt_sha256:'0'.repeat(64)}},
   {...q,introduction:{...q.introduction,text:'host invented introduction'}},
   {...q,sourcePacket:[...q.sourcePacket].reverse()}
  ];
  for(const x of bad){const r=spawn(modeCli,x,d);
   assert.notEqual(r.code,0,JSON.stringify(x));
   assert.equal(r.result.ok,false);
   assert.notEqual(r.result.original_owner_invoked,true);
  }
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
