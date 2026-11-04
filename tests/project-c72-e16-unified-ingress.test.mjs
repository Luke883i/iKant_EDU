import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {planC72ProjectE16Ingress,runC72ProjectE16Ingress,E16_INGRESS_SCHEMA}
 from '../host/project-c72-e16-unified-ingress.mjs';
import {C72_COLDSTART_FILES} from '../host/project-c72-coldstart-seed.mjs';
const H='a'.repeat(40),SHA='b'.repeat(40);
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const carrier=Buffer.from('export const transit=1;\n');
const witness={source_head:H,host_link_displayed:true,distinct_human_message_observed:true,
 terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+H+'/TERMS.md',
 pinned_blob_shas:Object.fromEntries(C72_COLDSTART_FILES.slice(0,5).map(p=>[p,SHA]))};
const states={CALLBACKS:'UNKNOWN',NODE_HTTPS:'UNKNOWN',HOST_PACKET:'OBSERVED',HOST_FILE:'UNKNOWN'};
function input(extra={}){return {
 schema:E16_INGRESS_SCHEMA,phase:'POST_ACCEPT',projectProfile:'PROJECT_EDU_E15',
 humanMessage:'I ACCEPT',freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',
 sourceHead:H,liveHead:H,node:'AVAILABLE',githubApi:'AVAILABLE',
 priorTurnEvidence:witness,carriers:states,
 expectedBlobShas:Object.fromEntries(C72_COLDSTART_FILES.map(p=>[p,SHA])),
 seedBlobSha1:SHA,sourcePacket:C72_COLDSTART_FILES.map(p=>({path:p,contentBase64:'YQ=='})),
 transitDirectory:'/tmp/ikant-e16-fixture',transitBlobSha1:blob(carrier),
 transitSourcePacket:{path:'host/project-c72-receipt-transit.mjs',contentBase64:carrier.toString('base64')},
 ...extra};}
test('one E16 normalized packet selects only original cold seed route, without minting receipts',()=>{
 const p=planC72ProjectE16Ingress(input());
 assert.equal(p.ok,true);assert.equal(p.kind,'READY');assert.equal(p.carrier,'HOST_PACKET');
 assert.equal(p.original_owner_invoked,false);assert.equal(p.native_delivery_attested,false);
});
test('observed private file transport is normalized before the original owner',()=>{
 const p=planC72ProjectE16Ingress(input({sourcePacket:undefined,
  stageDirectory:'/tmp/c72-e16-source',carriers:{...states,HOST_PACKET:'UNKNOWN',HOST_FILE:'OBSERVED'}}));
 assert.equal(p.kind,'READY');assert.equal(p.carrier,'HOST_FILE');
});
test('observed DNS failure never blocks observed packet or private files; unnormalized HTTPS cannot issue C72',()=>{
 const dns={runtimeEpoch:'a',nodeDns:{status:'FAILED_OBSERVED',host:'api.github.com',epoch:'a'}};
 assert.equal(planC72ProjectE16Ingress(input({networkObservation:dns,
  carriers:{...states,NODE_HTTPS:'OBSERVED'}})).carrier,'HOST_PACKET');
 const onlyHttp=planC72ProjectE16Ingress(input({sourcePacket:undefined,
  carriers:{...states,HOST_PACKET:'UNKNOWN',NODE_HTTPS:'OBSERVED'},networkObservation:dns}));
 assert.equal(onlyHttp.kind,'STOP');assert.equal(onlyHttp.edge,'E16_CARRIER_NORMALIZATION_REQUIRED');
 assert.equal(onlyHttp.original_owner_invoked,false);
});
test('untested and unmaterialized are never silently promoted; real file may supersede unbound packet',()=>{
 assert.equal(planC72ProjectE16Ingress(input({carriers:{...states,HOST_PACKET:'CALLABLE_UNTESTED'}})).kind,'PROBE');
 assert.equal(planC72ProjectE16Ingress(input({carriers:{...states,HOST_PACKET:'UNKNOWN'}})).kind,'STOP');
 assert.equal(planC72ProjectE16Ingress(input({sourcePacket:undefined})).kind,'STOP');
 const r=planC72ProjectE16Ingress(input({sourcePacket:undefined,
 stageDirectory:'/tmp/c72-e16-source',carriers:{...states,HOST_FILE:'OBSERVED'}}));
 assert.equal(r.kind,'READY');assert.equal(r.carrier,'HOST_FILE');
});
test('consent, drift, missing pin, envelope tamper and unknown owner stop before any original owner effect',async()=>{
 for(const extra of [
  {humanMessage:'EDU'},{freshHumanTurn:false},{ownerOutcome:'UNKNOWN'},
  {liveHead:'c'.repeat(40)},{sourceHead:'bad'},
  {priorTurnEvidence:{...witness,host_link_displayed:false}},
  {priorTurnEvidence:{...witness,pinned_blob_shas:{...witness.pinned_blob_shas,'TERMS.md':'bad'}}},
  {projectProfile:'LEGACY'},{transitDirectory:'relative'},
  {transitBlobSha1:'c'.repeat(40)},{transitSourcePacket:{path:'wrong',contentBase64:'YQ=='}},
  {expectedBlobShas:{...input().expectedBlobShas,'TERMS.md':'bad'}},
  {seedBlobSha1:'bad'}, {carriers:{...states,HOST_PACKET:'UNKNOWN'}},
  {carriers:{...states,HOST_PACKET:'CALLABLE_UNTESTED'}}]){
  const r=await runC72ProjectE16Ingress(input(extra));
  assert.equal(r.ok,false,JSON.stringify(extra));assert.equal(r.original_owner_invoked,false);
 }
});
test('proxy and accessor inputs cannot trigger effects',async()=>{
 let hits=0;const x=input();
 const proxy=new Proxy(x,{get(){hits++;throw Error('SIDE_EFFECT');}});
 const r=await runC72ProjectE16Ingress(proxy);
 assert.equal(r.ok,false);assert.equal(hits,0);
 const z=input();Object.defineProperty(z,'carriers',{get(){hits++;throw Error('SIDE_EFFECT');}});
 const a=await runC72ProjectE16Ingress(z);
 assert.equal(a.ok,false);assert.equal(hits,0);
});
