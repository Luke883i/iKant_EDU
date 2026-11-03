import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {H1_SCHEMA,H1_FILES,H1_TRANSIT,H1_SEED,validateH1Gate,prepareH1OriginalSources,reserveH1HumanEvent} from '../host/project-edu-h1-bound-port.mjs';
const HEAD='a'.repeat(40),gitSha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function fixture(){
 const bytes=new Map([...H1_FILES,H1_TRANSIT,H1_SEED].map(p=>[p,Buffer.from('Original fixture '+p+'\n')]));
 bytes.set('BOOTSTRAP.json',Buffer.from(JSON.stringify({project_session:{
  postaccept_original_c72_transit_pin:{path:H1_TRANSIT,blob_sha1:gitSha(bytes.get(H1_TRANSIT)),source:'FIRST_TURN_BOOTSTRAP_SHA_VERIFIED'}
 }})));
 const priorTurnEvidence={source_head:HEAD,host_link_displayed:true,distinct_human_message_observed:true,
  terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+HEAD+'/TERMS.md',
  pinned_blob_shas:Object.fromEntries(H1_FILES.slice(0,5).map(p=>[p,gitSha(bytes.get(p))]))};
 const q={schema:H1_SCHEMA,sourceHead:HEAD,humanMessage:'I ACCEPT',freshHumanTurn:true,
  ownerOutcome:'NOT_INVOKED',priorTurnEvidence};
 const reads=[];
 const readMain=async()=>({object:{sha:HEAD}});
 const readPinned=async ({path:p,ref})=>{
  assert.equal(ref,HEAD);reads.push(p);const b=bytes.get(p);
  return b&&{content:b.toString('utf8'),encoding:'utf-8',sha:gitSha(b)};
 };
 const treeSha='c'.repeat(40);
 const readCommit=async ({ref})=>{assert.equal(ref,HEAD);return {sha:HEAD,tree:{sha:treeSha}}};
 const readTree=async ({sha,recursive})=>{
  assert.equal(sha,treeSha);assert.equal(recursive,true);
  return {sha:treeSha,truncated:false,tree:[...H1_FILES,H1_TRANSIT,H1_SEED].map(p=>({
   path:p,sha:gitSha(bytes.get(p)),type:'blob',mode:'100644'
  }))};
 };
 return {q,bytes,reads,readMain,readPinned,readCommit,readTree};
}
test('absent callbacks are not a connected capability',async()=>{
 const f=fixture();assert.equal((await prepareH1OriginalSources(f.q)).edge,'H1_CAPABILITY_NOT_BOUND');
});
test('human distinct consent, owner outcome, source epoch cannot be reconstructed',()=>{
 const f=fixture();
 assert.equal(validateH1Gate({...f.q,freshHumanTurn:false}),'H1_DISTINCT_ACCEPT_REQUIRED');
 assert.equal(validateH1Gate({...f.q,ownerOutcome:'UNKNOWN'}),'H1_OWNER_ATTEMPT_ALREADY_KNOWN_OR_UNKNOWN');
 assert.equal(validateH1Gate({...f.q,sourceHead:'f'.repeat(40)}),'STOP_SOURCE_LOCK_STALE');
 assert.equal(validateH1Gate({...f.q,priorTurnEvidence:{...f.q.priorTurnEvidence,terms_link:'https://github.com/Luke883i/iKant_LE/blob/'+HEAD+'/TERMS.md'}}),'H1_FIRST_TURN_WITNESS_INVALID');
});
test('live HEAD mismatch stops before any source acquisition',async()=>{
 const f=fixture(),r=await prepareH1OriginalSources(f.q,{
  ...f,readMain:async()=>({object:{sha:'f'.repeat(40)}}),readPinned:f.readPinned
 });
 assert.equal(r.edge,'STOP_SOURCE_LOCK_STALE');assert.equal(f.reads.length,0);
});
test('original eight plus one transit physically written and read back',async()=>{
 const f=fixture(),r=await prepareH1OriginalSources(f.q,f);
 assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.verified_file_count,9);
 assert.equal(f.reads.length,10);assert.equal(r.native_event_attested,false);
 for(const p of [...H1_FILES,H1_TRANSIT]){
  const file=path.join(r.stageDirectory,p);
  assert.equal(fs.lstatSync(file).mode&0o077,0);
  assert.deepEqual(fs.readFileSync(file),f.bytes.get(p));
 }
 fs.rmSync(r.stageDirectory,{recursive:true,force:true});
 fs.rmSync(r.transitDirectory,{recursive:true,force:true});
});
test('false source sha and partial source refuse to advance',async()=>{
 const f=fixture(),orig=f.readPinned;
 const wrong=await prepareH1OriginalSources(f.q,{...f,readPinned:async a=>({...await orig(a),sha:'e'.repeat(40)})});
 assert.equal(wrong.edge,'H1_SOURCE_BLOB_SHA_MISMATCH');
 const missing=await prepareH1OriginalSources(f.q,{...f,readPinned:async a=>a.path===H1_FILES[7]?undefined:orig(a)});
 assert.equal(missing.edge,'H1_SOURCE_RESPONSE_INVALID');
});
test('mismatching E16 BOOTSTRAP pin refuses to advance',async()=>{
 const f=fixture();f.bytes.set(H1_TRANSIT,Buffer.from('changed\n'));
 const r=await prepareH1OriginalSources(f.q,f);
 assert.equal(r.edge,'H1_E16_BOOTSTRAP_PIN_MISMATCH');
});
test('noncanonical base64 refused; canonical accepted',async()=>{
 const f=fixture(),orig=f.readPinned;
 const bad=await prepareH1OriginalSources(f.q,{...f,readPinned:async a=>
  a.path===H1_FILES[5]?{content:'not!base64',encoding:'base64',sha:gitSha(f.bytes.get(a.path))}:orig(a)});
 assert.equal(bad.edge,'H1_BASE64_NONCANONICAL');
 const good=await prepareH1OriginalSources(f.q,{...f,readPinned:async a=>{
  const o=await orig(a);return {...o,encoding:'base64',content:f.bytes.get(a.path).toString('base64')};
 }});
 assert.equal(good.ok,true);
 fs.rmSync(good.stageDirectory,{recursive:true,force:true});
 fs.rmSync(good.transitDirectory,{recursive:true,force:true});
});
test('stable write-once human event reservation denies replay',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'h1-event-test-'));fs.chmodSync(root,0o700);
 try{
  const q={privateRoot:root,sourceHead:HEAD,humanTurnRef:'stable-human-event-00001'};
  const a=reserveH1HumanEvent(q);assert.equal(a.ok,true);
  assert.equal(reserveH1HumanEvent(q).edge,'H1_EVENT_ALREADY_RESERVED_OR_UNKNOWN_NO_REPLAY');
  assert.equal(fs.lstatSync(path.join(a.directory,'h1-attempt.json')).mode&0o077,0);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('event reservation without a persistent root refuses',()=>{
 assert.equal(reserveH1HumanEvent({sourceHead:HEAD}).edge,'H1_DURABLE_EVENT_BINDING_REQUIRED');
});

test('self-consistent wrong blob for a different path is denied by HEAD tree',async()=>{
 const f=fixture(),victim=H1_FILES[5],wrong=f.bytes.get(H1_FILES[6]);
 const r=await prepareH1OriginalSources(f.q,{...f,readPinned:async a=>{
  if(a.path===victim)return {content:wrong.toString('utf8'),encoding:'utf-8',sha:gitSha(wrong)};
  return f.readPinned(a);
 }});
 assert.equal(r.edge,'H1_HEAD_PATH_BLOB_MISMATCH:'+victim);
});
test('truncated tree and mismatched commit are fail-closed before source read',async()=>{
 const f=fixture();const bad=await prepareH1OriginalSources(f.q,{
  ...f,readTree:async()=>({sha:'c'.repeat(40),truncated:true,tree:[]})
 });
 assert.equal(bad.edge,'H1_TREE_COMPLETENESS_UNVERIFIED');
 assert.equal(f.reads.length,0);
 const badCommit=await prepareH1OriginalSources(f.q,{
  ...f,readCommit:async()=>({sha:'f'.repeat(40),tree:{sha:'c'.repeat(40)}})
 });
 assert.equal(badCommit.edge,'H1_COMMIT_TREE_LINK_INVALID');
});
