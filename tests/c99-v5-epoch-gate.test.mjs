import test from 'node:test';
import assert from 'node:assert/strict';
import {gateC99ExperimentalEntry,gateC99SourceHandoff} from '../host/c99-route-policy.mjs';
const HEAD='a'.repeat(40),OTHER='b'.repeat(40);
const base=()=>({sourceHead:HEAD,selection:{selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING',source_head:HEAD},humanInput:'ciao',readC77Archive:async()=>{throw Error('must not run')}});
test('same source epoch remains shape-only and never authorizes native or execution',()=>{
 const r=gateC99ExperimentalEntry(base());assert.equal(r.status,'C99_CALLBACK_SHAPE_ONLY_NOT_AUTHENTICATED');assert.equal(r.owner_executed,false);assert.equal(r.source_origin_attested,false);
});
test('stale C72 epoch stops before C82/C84 or any byte transport',()=>{
 const x=base();x.selection.source_head=OTHER;const r=gateC99ExperimentalEntry(x);assert.equal(r.status,'C99_STOP');assert.equal(r.first_unclosed_edge,'C72_SELECTION_SOURCE_EPOCH_MISMATCH');
});
test('malformed explicit epoch never passes as current head',()=>{
 for(const val of ['',null,42,'B'.repeat(40),HEAD+'a',OTHER]){const x=base();x.selection.source_head=val;assert.equal(gateC99ExperimentalEntry(x).status,'C99_STOP',String(val));}
});
test('accessor epoch is rejected with zero getter execution',()=>{
 let getters=0;const x=base();Object.defineProperty(x.selection,'source_head',{enumerable:true,get(){getters++;return HEAD;}});const r=gateC99ExperimentalEntry(x);assert.equal(r.status,'C99_STOP');assert.equal(r.first_unclosed_edge,'C99_SELECTION_SOURCE_EPOCH_ACCESSOR');assert.equal(getters,0);
});
test('transport is still unavailable without host callback even with valid epoch',()=>{
 const x=base();delete x.readC77Archive;const r=gateC99ExperimentalEntry(x);assert.equal(r.first_unclosed_edge,'HOST_CONNECTOR_TO_NODE_BYTE_CALLBACK_UNAVAILABLE_NO_NODE_DNS_RETRY');assert.equal(r.owner_executed,false);
});
test('C81 raw Git proof remains separate; fake raw proof stays unverified',()=>{
 const r=gateC99SourceHandoff({sourceHead:HEAD,manifestSha256:'c'.repeat(64),sourceProof:{commitBase64:'x',treeObjects:[{}]}});assert.equal(r.status,'C99_C81_PROOF_SHAPE_ONLY_NOT_VERIFIED');assert.equal(r.source_origin_attested,false);
});
