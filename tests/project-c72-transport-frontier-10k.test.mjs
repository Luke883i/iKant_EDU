import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseC72HostTransport,chooseEDUSourceTransport,C72_TRANSPORT_ORDER,c72ParetoFrontier,C72_MODEL_COSTS} from '../host/project-c72-transport-frontier.mjs';
const SHA='a'.repeat(40);
const base=()=>({phase:'POST_ACCEPT',humanMessage:'I ACCEPT',freshHumanTurn:true,
 ownerOutcome:'NOT_INVOKED',sourceHead:SHA,liveHead:SHA,firstTurnWitnessVerified:true,
 node:'AVAILABLE',githubApi:'AVAILABLE',carriers:{CALLBACKS:'UNKNOWN',NODE_HTTPS:'UNKNOWN',HOST_PACKET:'UNKNOWN',HOST_FILE:'UNKNOWN'}});
const seed=20261026;
const rnd=()=>{let x=seed;return()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296)};
test('P0 frontiers: best executable observed carrier, or non-owner probe',()=>{
 const q=base();q.carriers.HOST_FILE='CALLABLE_UNTESTED';
 assert.deepEqual([chooseC72HostTransport(q).kind,chooseC72HostTransport(q).carrier],['PROBE','HOST_FILE']);
 q.carriers.HOST_FILE='OBSERVED';
 assert.equal(chooseC72HostTransport(q).action,'STAGE_EIGHT_PRIVATE_FILES_THEN_RUN_ORIGINAL_COLD_SEED');
 q.carriers.HOST_PACKET='OBSERVED';
 assert.equal(chooseC72HostTransport(q).carrier,'HOST_PACKET');
 q.carriers.NODE_HTTPS='OBSERVED';
 assert.equal(chooseC72HostTransport(q).carrier,'NODE_HTTPS');
 q.carriers.CALLBACKS='OBSERVED';
 assert.equal(chooseC72HostTransport(q).carrier,'CALLBACKS');
});
test('post-EDU P1 mechanical pinned ZIP only on separately verified original mode and explicit manual route',()=>{
 const q={phase:'POST_EDU',originalEduSelectionVerified:true,sourceHead:SHA,liveHead:SHA,
 node:'AVAILABLE',source:'ABSENT',manualRoute:'EXPLICIT_MANUAL_POST_EDU',extractorVerified:true,hostBridge:'UNKNOWN'};
 assert.equal(chooseEDUSourceTransport(q).action,'REQUEST_ORIGINAL_PINNED_ZIP');
 assert.equal(chooseEDUSourceTransport({...q,originalEduSelectionVerified:false}).kind,'STOP');
 assert.equal(chooseEDUSourceTransport({...q,phase:'POST_ACCEPT'}).kind,'STOP');
 assert.equal(chooseEDUSourceTransport({...q,manualRoute:'AUTO'}).kind,'STOP');
 assert.equal(chooseEDUSourceTransport({...q,source:'FULL_VERIFIED'}).action,'START_ORIGINAL_C135_WITH_SAME_INSTANCE_READBACK');
});
test('exactly 10,000 seeded complete structural scenarios: no owner/ACTIVE forgery, no pre-consent ZIP, observed carrier dominates probes',()=>{
 const random=rnd();const states=['OBSERVED','CALLABLE_UNTESTED','UNAVAILABLE_VERIFIED','UNKNOWN'];
 const names=C72_TRANSPORT_ORDER;
 let stops=0,probes=0,executes=0,mutations=0;const ladder={};
 for(let i=0;i<10000;i++){
  const q=base();for(const n of names)q.carriers[n]=states[Math.floor(random()*4)];
  const mutation=Math.floor(random()*10);mutations++;
  if(mutation===0)q.humanMessage='EDU';
  if(mutation===1)q.freshHumanTurn=false;
  if(mutation===2)q.ownerOutcome='UNKNOWN';
  if(mutation===3)q.sourceHead='x';
  if(mutation===4)q.firstTurnWitnessVerified=false;
  if(mutation===5)q.node='UNKNOWN';
  if(mutation===6)q.githubApi='UNKNOWN';
  if(mutation===7)q.carriers.HOST_FILE='CALLABLE_UNTESTED';
  if(mutation===8)q.carriers.CALLBACKS='OBSERVED';
  if(mutation===9)q.carriers.NODE_HTTPS='UNAVAILABLE_VERIFIED';
  const r=chooseC72HostTransport(q);
  assert.equal(r.authority,0);assert.equal(r.active,false);assert.equal(r.owner_invoked,false);
  assert(!Object.hasOwn(r,'receipt_sha256'));
  if(mutation<6)assert.equal(r.kind,'STOP');
  if(r.kind==='EXECUTE'){
   executes++;
   assert.equal(q.carriers[r.carrier],'OBSERVED');
   assert(r.carrier==='NODE_HTTPS'||q.githubApi==='AVAILABLE');
   const candidates=Object.fromEntries(names.filter(n=>n==='NODE_HTTPS'||q.githubApi==='AVAILABLE').map(n=>[n,q.carriers[n]]));
   assert(c72ParetoFrontier(candidates).includes(r.carrier),'chosen must be nondominated');
  } else if(r.kind==='PROBE'){
   probes++;assert.equal(q.carriers[r.carrier],'CALLABLE_UNTESTED');
   assert.equal(names.filter(n=>q.carriers[n]==='OBSERVED'&&(n==='NODE_HTTPS'||q.githubApi==='AVAILABLE')).length,0);
  } else {stops++;assert.equal(r.kind,'STOP');}
  const e=chooseEDUSourceTransport({phase:'POST_ACCEPT',sourceHead:SHA,liveHead:SHA,
   originalEduSelectionVerified:true,node:'AVAILABLE',source:'ABSENT',manualRoute:'EXPLICIT_MANUAL_POST_EDU',extractorVerified:true});
  assert.notEqual(e.action,'REQUEST_ORIGINAL_PINNED_ZIP');
  if([1,10,100,1000,10000].includes(i+1))ladder[i+1]={stops,probes,executes};
 }
 assert.deepEqual(Object.keys(ladder),['1','10','100','1000','10000']);
 assert.equal(mutations,10000);assert.equal(stops+probes+executes,10000);
 console.log('PARETO_10K',JSON.stringify({seed,cases:10000,stops,probes,executes,ladder,model:'finite structural, not 10000 native chats'}));
});
