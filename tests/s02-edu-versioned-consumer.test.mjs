import test from 'node:test';
import assert from 'node:assert/strict';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {qualifyS02EduIngress,dispatchS02EduTurn} from '../host/s02-edu-versioned-consumer.mjs';
const current='a973079beab243e535ab907937857ed1f6684cf1';
const historical='6648e1f58157224cbd6440a04764d3df34aa0cfd';
const offer=issueC72V2TermsOffer({sourceHead:current,termsDigest:'a'.repeat(64)});
const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const orientation=presentC72V2Introduction(accepted);
const edu=selectC72V2Mode({accepted,orientation,humanMessage:'EDU'});
const canonical=selectC72V2Mode({accepted,orientation,humanMessage:'CANONICAL'});
test('S02 verifies public EDU selection but refuses historical cache reuse as live HEAD',()=>{
 const r=qualifyS02EduIngress({selection:edu,sourceHead:current,cacheEpoch:historical});
 assert.equal(r.first_edge,'S02_HISTORIC_CACHE_SOURCE_EPOCH_MISMATCH');
 assert.equal(r.dispatch_authorized,false);assert.equal(r.writer_invocations,0);assert.equal(r.active,false);
 assert.equal(qualifyS02EduIngress({selection:edu,sourceHead:current,cacheEpoch:current}).first_edge,'S02_C107_CONSUMER_REQUIRES_GENUINE_EDU_V2_OWNER');
 assert.equal(qualifyS02EduIngress({selection:canonical,sourceHead:current,cacheEpoch:current}).first_edge,'S02_C72_V2_SELECTION_UNVERIFIED');
 assert.equal(qualifyS02EduIngress({selection:edu,sourceHead:historical,cacheEpoch:historical}).first_edge,'S02_CURRENT_SOURCE_HEAD_NOT_BOUND');
});
test('S02 forbids cross-version receipt substitution and injected callbacks',()=>{
 const bad=[{...edu,selected_mode:'EXPERIMENTAL'}, {...edu,active:true}, {...edu,schema:'ikant-le-c72-mode-selection/v1'}];
 for(const sel of bad)assert.equal(qualifyS02EduIngress({selection:sel,sourceHead:current,cacheEpoch:current}).dispatch_authorized,false);
 const args={selection:edu,sourceHead:current,cacheEpoch:historical,nonce:'demo-nonce-0000001'};
 assert.equal(dispatchS02EduTurn({...args,legacyReceipt:{}}).first_edge,'S02_UNSAFE_OR_UNEXPECTED_DISPATCH_ENVELOPE');
 assert.equal(dispatchS02EduTurn({...args,carrier:()=>{throw Error('called')}}).first_edge,'S02_UNSAFE_OR_UNEXPECTED_DISPATCH_ENVELOPE');
 const proxy=new Proxy(args,{get(){throw Error('not executed')}});
 assert.equal(dispatchS02EduTurn(proxy).first_edge,'S02_UNSAFE_OR_UNEXPECTED_DISPATCH_ENVELOPE');
});
test('S02 30 distinct EDU input nonces cannot bypass original owner and produce zero writes',()=>{
 const nonces=new Set();let writes=0;
 for(let i=0;i<30;i++){
  const nonce=`s02-edu-turn-${String(i).padStart(3,'0')}`;nonces.add(nonce);
  const r=dispatchS02EduTurn({selection:edu,sourceHead:current,cacheEpoch:historical,nonce});
  assert.equal(r.dispatch_authorized,false);writes+=r.writer_invocations;
  assert.equal(r.first_edge,'S02_HISTORIC_CACHE_SOURCE_EPOCH_MISMATCH');
 }
 assert.equal(nonces.size,30);assert.equal(writes,0);
});
