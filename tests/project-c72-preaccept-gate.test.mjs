import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createProjectC72PreacceptGate} from '../host/project-c72-preaccept-gate.mjs';
import {validateC72V2Accepted,validateC72V2Orientation} from '../host/c72-public-mode-admission.mjs';
const H='05a389339d96cc82324ed95a5f756ed1828e8d29';
const files=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const blob=s=>{const b=Buffer.from(s);return createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex')};
const create=()=>{const calls=[];const gate=createProjectC72PreacceptGate({
 readMain:async()=>{calls.push('HEAD');return H},
 readDocument:async(path,head)=>{calls.push(path);assert.equal(head,H);
 const content=`original ${path}`;return{content,blob_sha1:blob(content)};}});
 return{calls,gate};};
test('complete preaccept: exactly HEAD + five pinned documents, freeze, original C72',async()=>{
 const {calls,gate}=create();const r=await gate.orient();
 assert.equal(r.ok,true);assert.deepEqual(calls,['HEAD',...files]);
 assert.equal(r.documents.length,5);assert.equal(r.terms_link,`https://github.com/Luke883i/iKant_EDU/blob/${H}/TERMS.md`);
 assert.equal(r.original_offer.terms_read_attested,false);
 assert.equal(gate.accept('I ACCEPT').ok,false); // link display has not been observed
 assert.equal(gate.attestTermsLinkDisplayed({actuallyDisplayed:true}).ok,true);
 assert.equal(gate.denySourceAction('LIST_TREE').ok,false);
 assert.equal((await gate.orient()).ok,false);
 assert.equal(gate.accept('I ACCEPT embedded').ok,false);
 const a=gate.accept('I ACCEPT');assert.equal(a.ok,true);
 assert(validateC72V2Accepted(a.accepted));
 assert(validateC72V2Orientation(a.introduction,a.accepted));
 assert.equal(a.introduction.text.includes('iKant è un runtime conversazionale'),true);
 assert.equal(gate.accept('I ACCEPT').ok,false);
 assert.deepEqual(calls,['HEAD',...files]); // no repository call after Terms, including accept
 assert.equal(gate.snapshot().external_host_tools_attested,false);
});
test('missing/mutated source cannot get owner receipt or intro',async()=>{
 let reads=0;
 const gate=createProjectC72PreacceptGate({readMain:async()=>H,readDocument:async(path)=>{
  reads++;return{content:'wrong bytes',blob_sha1:'0'.repeat(40)};}});
 assert.equal((await gate.orient()).edge,'PREACCEPT_ORIENTATION_SOURCE_UNVERIFIED');
 assert.equal(reads,1);assert.equal(gate.accept('I ACCEPT').ok,false);
 assert.equal(gate.snapshot().phase,'STOP');
});
test('10000 forbidden pseudo-tool calls never delegate to GitHub',async()=>{
 const {calls,gate}=create();await gate.orient();gate.attestTermsLinkDisplayed({actuallyDisplayed:true});
 for(let i=0;i<10000;i++){
  const r=gate.denySourceAction(['LIST_TREE','READ_ARBITRARY_REPOSITORY_FILE','READ_HISTORY',
   'CLONE_REPOSITORY','SEARCH_REPOSITORY'][i%5]);
  assert.equal(r.ok,false);assert.equal(r.edge,'ORIENTATION_FROZEN_NO_REPOSITORY_CALLS');
 }
 assert.deepEqual(calls,['HEAD',...files]);
});
