/** Original-owner integration test on checkout fixtures, NOT a ChatGPT event test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {H1_SCHEMA,H1_FILES,H1_TRANSIT,H1_SEED,runH1OriginalAdmission} from '../host/project-edu-h1-bound-port.mjs';
import {reopenC72Accepted} from '../host/project-c72-receipt-transit.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const gitSha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');

test('8+1 original Git bytes, C72/v2 accepted and introduction reopened; replay denied',async()=>{
 const sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 assert.match(sourceHead,/^[a-f0-9]{40}$/);
 const priorTurnEvidence={
  source_head:sourceHead,host_link_displayed:true,distinct_human_message_observed:true,
  terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+sourceHead+'/TERMS.md',
  pinned_blob_shas:Object.fromEntries(H1_FILES.slice(0,5).map(p=>[p,gitSha(fs.readFileSync(path.join(root,p)))]))
 };
 const privateRoot=fs.mkdtempSync(path.join(os.tmpdir(),'h1-original-checkout-'));
 fs.chmodSync(privateRoot,0o700);
 try{
  const q={schema:H1_SCHEMA,sourceHead,humanMessage:'I ACCEPT',freshHumanTurn:true,
   ownerOutcome:'NOT_INVOKED',humanTurnRef:'h1-original-checkout-event-0001',priorTurnEvidence};
  const readMain=async()=>({object:{sha:sourceHead}}); // fixture, NOT independent API witness
  const readPinned=async ({path:p,ref})=>{
   assert.equal(ref,sourceHead);
   assert.ok([...H1_FILES,H1_TRANSIT,H1_SEED].includes(p));
   const bytes=fs.readFileSync(path.join(root,p));
   return {encoding:'utf-8',content:bytes.toString('utf8'),sha:gitSha(bytes)};
  };
  const treeSha=execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim();
  const rawTree=execFileSync('git',['ls-tree','-r','-z','HEAD'],{cwd:root,encoding:'utf8'});
  const entries=rawTree.split('\0').filter(Boolean).map(line=>{
   const sep=line.indexOf('\t'),[mode,type,sha]=line.slice(0,sep).split(' ');
   return {mode,type,sha,path:line.slice(sep+1)};
  });
  const readCommit=async ({ref})=>{assert.equal(ref,sourceHead);return {sha:sourceHead,tree:{sha:treeSha}}};
  const readTree=async ({sha,recursive})=>{
   assert.equal(sha,treeSha);assert.equal(recursive,true);
   return {sha:treeSha,truncated:false,tree:entries};
  };
  const result=await runH1OriginalAdmission(q,{readMain,readPinned,readCommit,readTree,privateRoot});
  assert.equal(result.ok,true,JSON.stringify({kind:result.kind,edge:result.edge}));
  assert.equal(result.original_owner_invoked,true);
  assert.equal(result.verified_file_count,9);
  assert.equal(result.native_event_attested,false);
  assert.equal(result.native_delivery_attested,false);
  assert.equal(result.source_origin_attested,false);
  const reopened=reopenC72Accepted({directory:result.transitDirectory,sourceHead});
  assert.equal(reopened.ok,true,JSON.stringify(reopened));
  assert.deepEqual(reopened.accepted,result.accepted);
  assert.deepEqual(reopened.introduction,result.introduction);
  const replay=await runH1OriginalAdmission(q,{readMain,readPinned,readCommit,readTree,privateRoot});
  assert.equal(replay.ok,false);
  assert.equal(replay.edge,'H1_EVENT_ALREADY_RESERVED_OR_UNKNOWN_NO_REPLAY');
 }finally{fs.rmSync(privateRoot,{recursive:true,force:true});}
});
