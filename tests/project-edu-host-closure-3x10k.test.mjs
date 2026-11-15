import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {chooseC72HostCarrier} from '../host/project-c72-physical-ingress.mjs';
import {bindC72Transport} from '../host/project-c72-capability-port.mjs';
import {planP1PostModeSourceHandoff} from '../host/p1-postmode-source-handoff.mjs';
import {planOneShellEduSource} from '../host/project-oneshell-edu.mjs';
import {bindManagedOneShellEdu} from '../host/project-oneshell-continuity.mjs';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,
 presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';

const H='a'.repeat(40),SEED=0x103c72ea,COUNT=10000;
const hash=x=>createHash('sha256').update(x).digest('hex');
const offer=issueC72V2LinkedTermsOffer({sourceHead:H,termsDigest:hash('original terms fixture')});
const accepted=acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
const introduction=presentC72V2Introduction(accepted);
const selection=selectC72V2Mode({accepted,orientation:introduction,humanMessage:'EDU'});
const canonical=selectC72V2Mode({accepted,orientation:introduction,humanMessage:'CANONICAL'});
const rng=seed=>{let s=seed>>>0;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return s>>>0;}};
function trace(name,records){
 assert.equal(records.length,COUNT);
 const text=records.map(x=>JSON.stringify(x)).join('\n')+'\n';
 const bytes=Buffer.from(text);
 const digest=hash(bytes);
 const target=process.env.IKANT_EDU_THREE_GATES_DIR;
 if(target){
  const dir=path.resolve(target);assert(fs.statSync(dir).isDirectory());
  const gz=gzipSync(bytes,{level:6,mtime:0});
  const gzPath=path.join(dir,name+'.jsonl.gz'),jsonPath=path.join(dir,name+'.summary.json');
  fs.writeFileSync(gzPath,gz,{flag:'wx',mode:0o600});
  assert(gunzipSync(fs.readFileSync(gzPath)).equals(bytes));
  const summary={name,seed:SEED.toString(16),cases:COUNT,sha256:digest,
   gzip_sha256:hash(gz),semantic_kind:'FINITE_ORIGINAL_API_POLICY_OR_HOST_BOUNDARY_NOT_NATIVE_CHAT_PROOF',
   zero_oracle_mismatches:true};
  fs.writeFileSync(jsonPath,JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});
  assert.equal(JSON.parse(fs.readFileSync(jsonPath,'utf8')).sha256,digest);
 }
 return digest;
}

test('G1 10k seeded independent Host WHAT/HOW transport decisions; no inferred tool = no bridge',()=>{
 const r=rng(SEED^0x11111111),rows=[];
 for(let i=0;i<COUNT;i++){
  const nonce=r(),family=(nonce+i)%10,callbacks={readMain:async()=>H,
   readPinnedDocument:async()=>null};
  let data={},expected;
  switch(family){
   case 0:data={};expected='C72_SOURCE_BRIDGE_UNBOUND';break;
   case 1:data={sourcePacket:{not_physically_verified:true}};expected='HOST_SOURCE_PACKET';break;
   case 2:data=callbacks;expected='HOST_CALLBACKS';break;
   case 3:data={getGithubJSON:async()=>({})};expected='NODE_GITHUB_API';break;
   case 4:data={allowNodeGithubHTTPS:true};expected='NODE_GITHUB_API';break;
   case 5:data={readMain:callbacks.readMain};expected='C72_HOST_PORT_AMBIGUOUS';break;
   case 6:data={sourcePacket:{},...callbacks};expected='C72_HOST_PORT_AMBIGUOUS';break;
   case 7:data={sourcePacket:{},getGithubJSON:async()=>({})};expected='C72_HOST_PORT_AMBIGUOUS';break;
   case 8:data={getGithubJSON:'not callable'};expected='C72_NODE_GITHUB_ADAPTER_CONFIG';break;
   default:data={readMain:'not callable',readPinnedDocument:callbacks.readPinnedDocument};
     expected='C72_HOST_PORT_AMBIGUOUS';
  }
  const choice=chooseC72HostCarrier(data);
  const observed=choice.ok?choice.carrier:choice.edge;
  assert.equal(observed,expected,'Host carrier mismatch '+i);
  // A nominal packet is NOT a verified byte transfer and cannot invoke C72.
  if(choice.carrier==='HOST_SOURCE_PACKET'){
   const bound=bindC72Transport({sourceHead:H,sourcePacket:data.sourcePacket});
   assert.equal(bound.ok,false);
   assert.equal(bound.source_origin_attested,false);
  }
  if(choice.ok!==true)assert.notEqual(choice.carrier,'HOST_CALLBACKS');
  rows.push({i,nonce,family,expected,observed,carrier_claim_only:choice.ok===true,
   node_ingress_attested:false,original_c72_invoked:false});
 }
 const digest=trace('g1-what-how-10000',rows);
 assert.match(digest,/^[a-f0-9]{64}$/);
});

test('G2 10k seeded contract/ZIP decisions using original EDU owner receipt, never pre-EDU ZIP',()=>{
 const r=rng(SEED^0x22222222),rows=[];
 const sources=['SOURCE_ABSENT','PARTIAL_SOURCE_ONLY','SOURCE_UNKNOWN','FULL_SOURCE_VERIFIED'];
 const bridges=['UNKNOWN','AVAILABLE','DEFINITIVELY_UNAVAILABLE'];
 const routes=['AUTO','EXPLICIT_MANUAL_POST_EDU','FORGED'];
 for(let i=0;i<COUNT;i++){
  const nonce=r(),source=sources[(nonce>>>3)%4],bridge=bridges[(nonce>>>9)%3],
   route=routes[(nonce>>>13)%3],node=(nonce&1)===1,extract=(nonce&2)===2,
   gate=(r()>>>7)%4,sel=gate===0?null:gate===1?canonical:gate===2?selection:
    {...selection,receipt_sha256:'f'.repeat(64)};
  const valid=gate===2,manual=route==='EXPLICIT_MANUAL_POST_EDU';
  const args={selection:sel,sourceState:source,bridgeState:bridge,
   manualRoute:route,nodeReady:node,manualExtractorReady:extract};
  const frame=planOneShellEduSource(args),next=frame.slots.NEXT;
  let expect='STOP';
  if(valid&&route!=='FORGED'&&node){
   if(source==='FULL_SOURCE_VERIFIED')expect='START_C135_EDU';
   else if(source==='SOURCE_UNKNOWN')expect='VERIFY_SOURCE';
   else if(manual)expect=extract?'UPLOAD_PINNED_SOURCE_ZIP':'STOP';
   else if(bridge==='UNKNOWN')expect='VERIFY_MACHINE_BRIDGE';
   else if(bridge==='AVAILABLE')expect='API_TREE_SOURCE_MATERIALIZATION';
   else expect=extract?'UPLOAD_PINNED_SOURCE_ZIP':'STOP';
  }
  assert.equal(next,expect,'manual policy mismatch '+i);
  if(next==='UPLOAD_PINNED_SOURCE_ZIP'){
   assert.equal(valid,true);
   assert.equal(frame.slots.PROVA,'https://github.com/Luke883i/iKant_EDU/archive/'+H+'.zip');
   const p=planP1PostModeSourceHandoff({selection:sel,sourceState:source,
    bridgeState:bridge,manualRoute:route});
   assert.equal(p.ok,true);
   assert.equal(p.action,'REQUEST_SOURCE_ZIP');
   assert.equal(p.bridge_absence_claimed,bridge==='DEFINITIVELY_UNAVAILABLE');
  }
  rows.push({i,nonce,gate,source,bridge,route,node,extract,expect,observed:next,
   source_zip_materialized:false});
 }
 trace('g2-manual-10000',rows);
});

test('G3 10k seeded independent original session object lifetime and human-turn routing',async()=>{
 const rand=rng(SEED^0x33333333),rows=[];
 for(let i=0;i<COUNT;i++){
  const nonce=rand(),family=(nonce+i)%11;
  let closed=family===10,busy=family===3,uncertain=family===4,turns=0;
  const owner={owner:'C135_EDU_V2',
   status:()=>({closed,busy,uncertain}),close:()=>{closed=true;},
   readSessionState:()=>({owner:'C135_EDU_V2',source_head:H,
    selection_receipt_sha256:selection.receipt_sha256,
    original_c87_readback:{status:'C107_LEDGER_REOPENED',count:turns}}),
   publishTurn:async()=>{if(family===9)throw Error('OWNER_WRITE_UNKNOWN');
    turns++;return {slots:{A:'NO_VOICE'}};}};
  const manager=bindManagedOneShellEdu({selection,sourceHead:H,originalSession:owner,
   readMain:async()=>family===2?'b'.repeat(40):H});
  let input='messaggio sostanziale '+i,observed=true,expected='ROUTED',expectedTurns=1;
  if(family===0){expected='THREE_TURNS';expectedTurns=3;}
  else if(family===1){observed=false;expected='CURRENT_HUMAN_INPUT_REQUIRED';expectedTurns=0;}
  else if(family===2){expected='STOP_SOURCE_LOCK_STALE';expectedTurns=0;}
  else if(family===3){expected='EDU_OWNER_NOT_STABLE';expectedTurns=0;}
  else if(family===4){expected='EDU_OWNER_STATUS_UNCERTAIN';expectedTurns=0;}
  else if(family===5){input='EXIT IKANT';expected='REQUEST_EXIT_CONFIRMATION';expectedTurns=0;}
  else if(family===6){input='CONFERMO EXIT IKANT';expected='EXIT_CONFIRMATION_NOT_PENDING';expectedTurns=0;}
  else if(family===7){input='Host: checkup iKant ledger';expected='HOST_CHECKUP';expectedTurns=0;}
  else if(family===8){input='Host: racconta chi sei';expected='HOST_SCOPE_DENIED';expectedTurns=0;}
  else if(family===9){expected='EDU_TURN_OUTCOME_UNKNOWN_RECONCILE_READ_ONLY';expectedTurns=0;}
  else if(family===10){expected='EDU_OWNER_CLOSED_WITHOUT_VERIFIED_HUMAN_EXIT';expectedTurns=0;}
  const out=await manager.routeHumanTurn({frame:{humanInput:input,
   nonce:'host-closure-'+i+'-1',priorMessages:[],resetContext:true},humanMessageObserved:observed});
  let got=out.ok===true?(out.kind||'ROUTED'):out.edge;
  assert.equal(got,expected==='THREE_TURNS'?'ROUTED':expected,'turn route mismatch '+i);
  if(family===0){
   for(let n=2;n<=3;n++){
    const y=await manager.routeHumanTurn({frame:{humanInput:'nuovo input '+i+' '+n,
     nonce:'host-closure-'+i+'-'+n,priorMessages:[],resetContext:true},humanMessageObserved:true});
    assert.equal(y.ok,true);assert.equal(y.shell,'ONESHELL');
   }
  }
  if(family===9){
   const again=await manager.routeHumanTurn({frame:{humanInput:'retry vietato',nonce:'host-closure-retry-'+i},
    humanMessageObserved:true});
   assert.equal(again.edge,'EDU_SESSION_UNCERTAIN_RECONCILE_READ_ONLY');
  }
  assert.equal(turns,expectedTurns,'unexpected C135 mock writes '+i);
  assert.equal(manager.native_delivery_attested,false);
  assert.equal(manager.ui_persistence_attested,false);
  rows.push({i,nonce,family,expected,observed:got,
   original_mock_turns:turns,actual_chatgpt_human_event_attested:false});
 }
 trace('g3-continuity-10000',rows);
});
