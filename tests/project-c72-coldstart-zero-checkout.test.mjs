import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {buildPartialKit} from '../scripts/project-c72-partial-source-kit.mjs';

const gitBlob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const kit=buildPartialKit({head});
test('actual cold process: seed from original kit, no repo checkout in process cwd',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c72-no-checkout-'));
 try{
  fs.chmodSync(root,0o700);
  const seedPath=path.join(root,'seed.mjs');
  const seed=Buffer.from(kit.seed.contentBase64,'base64');
  fs.writeFileSync(seedPath,seed,{flag:'wx',mode:0o600});
  assert.equal(gitBlob(fs.readFileSync(seedPath)),kit.seed.blob_sha1);
  assert.deepEqual(fs.readdirSync(root),['seed.mjs']);
  const q={schema:'ikant-host-c72-coldstart/v1',humanMessage:'I ACCEPT',
   freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',liveHead:head,
   seedBlobSha1:kit.seed.blob_sha1,
   expectedBlobShas:Object.fromEntries(kit.files.map(f=>[f.path,f.blob_sha1])),
   priorTurnEvidence:{source_head:head,host_link_displayed:true,
    distinct_human_message_observed:true,
    terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md',
    pinned_blob_shas:Object.fromEntries(kit.files.slice(0,5).map(f=>[f.path,f.blob_sha1]))},
   sourcePacket:kit.files.map(f=>({path:f.path,contentBase64:f.contentBase64}))};
  const p=spawnSync(process.execPath,[seedPath],
   {cwd:root,input:JSON.stringify(q),encoding:'utf8',maxBuffer:2000000,timeout:15000});
  assert.equal(p.error,undefined);
  assert.equal(p.status,0,p.stdout+' '+p.stderr);
  const out=JSON.parse(p.stdout);
  assert.equal(out.ok,true);
  assert.equal(out.verified_file_count,8);
  assert.equal(out.original_owner_invoked,true);
  assert.equal(out.introduction.acceptance_receipt_sha256,out.accepted.receipt_sha256);
  assert.equal(out.active,false);
  assert.equal(out.native_event_attested,false);
  assert.deepEqual(fs.readdirSync(root),['seed.mjs']);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
