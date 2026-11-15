import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assessRenameSourceCandidate,buildRenameSourceCandidate,
 RENAME_OLD,RENAME_NEW,RENAME_REPOSITORY_ID} from '../scripts/repository-rename-source-phase.mjs';
import {c72SourceRepository,c72LinkedTermsURL} from '../host/c72-public-mode-admission.mjs';
import {executeC72Coldstart} from '../host/project-c72-coldstart-seed.mjs';
import {buildPartialKit} from '../scripts/project-c72-partial-source-kit.mjs';

const head='a'.repeat(40),tree='b'.repeat(40);
test('both future source phases have exactly one name, always authority zero',()=>{
 for(const phase of ['OLD','NEW']){
  const x=buildRenameSourceCandidate(phase,head,tree);
  assert.equal(x.repo_id,RENAME_REPOSITORY_ID);
  assert.deepEqual(x.aliases,[phase==='OLD'?RENAME_OLD:RENAME_NEW]);
  const r=assessRenameSourceCandidate(x);
  assert.equal(r.ok,true);
  assert.equal(r.status,'STRUCTURAL_SOURCE_CONSISTENT_ONLY');
  assert.equal(r.rename_go,false);
  assert.equal(r.provider_proven,false);
  assert.equal(r.native_owner_proven,false);
  assert.equal(r.authority,0);
  const fork={...x,observed_full_name:x.observed_full_name+'-evil'};
  assert.equal(assessRenameSourceCandidate(fork).ok,false);
  const duplicate={...x,aliases:[RENAME_OLD,RENAME_NEW]};
  assert.equal(assessRenameSourceCandidate(duplicate).edge,'DUAL_CANONICAL_OR_ALIAS');
 }
});
test('C72 current canonical source is NEW and the historical OLD alias cannot be promoted',()=>{
 const boot=JSON.parse(fs.readFileSync(new URL('../BOOTSTRAP.json',import.meta.url)));
 const admission=JSON.parse(fs.readFileSync(new URL('../ADMISSION.json',import.meta.url)));
 const c=JSON.parse(fs.readFileSync(new URL('../contracts/c72-public-mode-admission-v2.json',import.meta.url)));
 assert.equal(boot.canonical_repository,RENAME_NEW);
 assert.equal(admission.repository,RENAME_NEW);
 assert.equal(c.source_identity.canonical_repository,RENAME_NEW);
 assert.equal(c.source_identity.repository_id,RENAME_REPOSITORY_ID);
 assert.equal(c72SourceRepository(),RENAME_NEW);
 assert.equal(c72LinkedTermsURL(head),'https://github.com/'+RENAME_NEW+'/blob/'+head+'/TERMS.md');
 assert.notEqual(c72LinkedTermsURL(head),'https://github.com/'+RENAME_OLD+'/blob/'+head+'/TERMS.md');
});
test('OLD Terms witness on NEW eight Git-verified source blobs stops before owner',async()=>{
 const gitHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const kit=buildPartialKit({head:gitHead});
 const blobs=Object.fromEntries(kit.files.map(f=>[f.path,f.blob_sha1]));
 const q={schema:'ikant-host-c72-coldstart/v1',humanMessage:'I ACCEPT',
  freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',liveHead:gitHead,
  seedBlobSha1:kit.seed.blob_sha1,expectedBlobShas:blobs,
  priorTurnEvidence:{source_head:gitHead,host_link_displayed:true,
    distinct_human_message_observed:true,
    terms_link:'https://github.com/'+RENAME_OLD+'/blob/'+gitHead+'/TERMS.md',
    pinned_blob_shas:Object.fromEntries(kit.files.slice(0,5).map(f=>[f.path,f.blob_sha1]))},
  sourcePacket:kit.files.map(f=>({path:f.path,contentBase64:f.contentBase64}))};
 const r=await executeC72Coldstart(q);
 assert.equal(r.ok,false);
 assert.equal(r.edge,'C72_ORIENTATION_WITNESS_MISSING');
 assert.equal(r.original_owner_invoked,false);
 assert.equal(r.native_event_attested,false);
 assert.equal(r.authority,0);
});
