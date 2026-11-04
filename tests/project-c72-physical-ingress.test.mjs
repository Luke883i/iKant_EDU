import test from 'node:test';
import {screenC72HostIngress} from '../host/project-c72-negative-entry.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {validateC72V2Accepted,validateC72V2Orientation} from '../host/c72-public-mode-admission.mjs';
import {createC72NodeGithubCallbacks,runC72SelectedHostIngress,chooseC72HostCarrier} from '../host/project-c72-physical-ingress.mjs';
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const names=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const docs=names.map(path=>({path,source_head:head,
 blob_sha1:execFileSync('git',['rev-parse','HEAD:'+path],{encoding:'utf8'}).trim(),
 content:execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'})}));
const witness=()=>({source_head:head,host_link_displayed:true,
 distinct_human_message_observed:true,
 terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md',
 pinned_blob_shas:Object.fromEntries(docs.map(x=>[x.path,x.blob_sha1]))});
const packet=()=>({schema:'ikant-host-c72-source-packet/v1',source_head:head,
 live_head:head,carrier_kind:'HOST_OPAQUE_TRANSFER',
 source_origin_attested:false,native_event_attested:false,documents:structuredClone(docs)});
const getJSON=({tamper=null,calls=[]}={})=>async path=>{
 calls.push(path);
 if(path==='/repos/Luke883i/iKant_EDU/git/ref/heads/main')
  return {ref:'refs/heads/main',object:{type:'commit',sha:head}};
 const m=path.match(/^\/repos\/Luke883i\/iKant_EDU\/contents\/(README\.md|BOOTSTRAP\.json|ADMISSION\.json|AGENTS\.md|TERMS\.md)\?ref=([a-f0-9]{40})$/);
 if(!m||m[2]!==head)throw Error('C72_TEST_REQUEST_UNEXPECTED');
 const d=docs.find(x=>x.path===m[1]);
 const content=Buffer.from(d.content,'utf8');
 let response={type:'file',path:d.path,sha:d.blob_sha1,size:content.length,
  encoding:'base64',content:content.toString('base64').replace(/.{64}/g,'$&\n')};
 if(tamper&&d.path===tamper.path)response={...response,...tamper.set};
 return response;
};
const inp=()=>({humanMessage:'I ACCEPT',freshHumanTurn:true,priorTurnEvidence:witness()});
test('three carrier paths use one unchanged C72 original owner',async()=>{
 const calls=[];
 const r=await runC72SelectedHostIngress({...inp(),carrier:'NODE_GITHUB_API',getGithubJSON:getJSON({calls})});
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.host_carrier_selected,'NODE_GITHUB_API');
 assert.equal(calls.length,6);assert(calls[0].endsWith('/git/ref/heads/main'));
 assert(validateC72V2Accepted(r.accepted));
 assert(validateC72V2Orientation(r.introduction,r.accepted));
 assert.equal(r.original_owner_invoked,true);
 assert.equal(r.provider_source_event_attested,false);
 assert.equal(r.native_delivery_attested,false);
 const packetR=await runC72SelectedHostIngress({...inp(),carrier:'HOST_SOURCE_PACKET',sourcePacket:packet()});
 assert.equal(packetR.ok,true);assert(validateC72V2Accepted(packetR.accepted));
 const callbacks=await runC72SelectedHostIngress({...inp(),carrier:'HOST_CALLBACKS',
  readMain:async()=>head,readPinnedDocument:async p=>docs.find(d=>d.path===p)});
 assert.equal(callbacks.ok,true);assert(validateC72V2Orientation(callbacks.introduction,callbacks.accepted));
});
test('Host cannot infer network, trigger early reads, or retry an unknown owner',async()=>{
 const calls=[];
 const adapter=getJSON({calls});
 assert.equal((await runC72SelectedHostIngress({...inp(),carrier:'NODE_GITHUB_API',
  humanMessage:'EDU',getGithubJSON:adapter})).edge,'C72_EXACT_NEW_CONSENT_REQUIRED');
 assert.equal((await runC72SelectedHostIngress({...inp(),carrier:'NODE_GITHUB_API',
  ownerOutcome:'UNKNOWN',getGithubJSON:adapter})).edge,'C72_OWNER_OUTCOME_UNKNOWN');
 assert.equal((await runC72SelectedHostIngress({...inp(),carrier:'UNBOUND'})).edge,'C72_SOURCE_BRIDGE_UNBOUND');
 assert.equal((await runC72SelectedHostIngress({...inp(),carrier:'NODE_GITHUB_API',
  sourcePacket:packet(),getGithubJSON:adapter})).edge,'C72_HOST_PORT_AMBIGUOUS');
 assert.equal(calls.length,0);
});
test('REST response path, size, SHA, encoding and bytes are separately checked',async()=>{
 for(const set of [{sha:'0'.repeat(40)},{path:'AGENTS.md'},{encoding:'utf8'},
  {size:999},{content:'not_base64#'},{content:'YWJjZA=='}]){
  const r=await runC72SelectedHostIngress({...inp(),carrier:'NODE_GITHUB_API',
   getGithubJSON:getJSON({tamper:{path:'README.md',set}})});
  assert.equal(r.ok,false,JSON.stringify({set,r}));
  assert.equal(r.original_owner_invoked,false);
  assert.match(r.edge,/^C72_(PINNED_DOCUMENT_BLOB_INVALID|SOURCE_READ_OUTCOME_UNKNOWN):README\.md$/);
 }
});
test('Node request rejection and stale HEAD never reach original owner',async()=>{
 const a=createC72NodeGithubCallbacks({sourceHead:head,getJSON:getJSON()});
 await assert.rejects(()=>a.readPinnedDocument('../secret',head),/REQUEST_DENIED/);
 await assert.rejects(()=>a.readPinnedDocument('README.md','0'.repeat(40)),/REQUEST_DENIED/);
 const r=await runC72SelectedHostIngress({...inp(),carrier:'NODE_GITHUB_API',
  getGithubJSON:async path=>path.endsWith('/git/ref/heads/main')?
   {ref:'refs/heads/main',object:{sha:'f'.repeat(40),type:'commit'}}:null});
 assert.equal(r.edge,'STOP_SOURCE_LOCK_STALE');
 assert.equal(r.original_owner_invoked,false);
});
test('10k preaccept/no-capability adversaries cause zero I/O or original invocation',async()=>{
 let touched=0;
 const fetch=async()=>{touched++;throw Error('must never fetch');};
 for(let i=0;i<10000;i++){
  const message=['EDU','I ACCEPT ','CANONICAL','x','','exit','I accept','I ACCEPT\n','0','I ACCEPT'][i%10];
  const fresh=i%7===0?false:true;
  const outcome=i%13===0?'UNKNOWN':'NOT_INVOKED';
  const carrier=i%5===0?'UNBOUND':'NODE_GITHUB_API';
  if(message==='I ACCEPT'&&fresh&&outcome==='NOT_INVOKED'&&carrier==='NODE_GITHUB_API')continue;
  const r=await runC72SelectedHostIngress({...inp(),humanMessage:message,freshHumanTurn:fresh,
    carrier,ownerOutcome:outcome,getGithubJSON:fetch});
  assert.equal(r.ok,false);assert.equal(r.original_owner_invoked,false);
 }
 assert.equal(touched,0);
});

test('AUTO binds one observed capability without inventing a bridge or silently retrying',async()=>{
 const none=chooseC72HostCarrier({});
 assert.equal(none.ok,false);assert.equal(none.edge,'C72_SOURCE_BRIDGE_UNBOUND');
 assert.equal(chooseC72HostCarrier({allowNodeGithubHTTPS:true}).carrier,'NODE_GITHUB_API');
 assert.equal(chooseC72HostCarrier({sourcePacket:packet()}).carrier,'HOST_SOURCE_PACKET');
 const packetR=await runC72SelectedHostIngress({...inp(),carrier:'AUTO',sourcePacket:packet()});
 assert.equal(packetR.ok,true);assert.equal(packetR.host_carrier_selected,'HOST_SOURCE_PACKET');
 const network=await runC72SelectedHostIngress({...inp(),carrier:'AUTO',getGithubJSON:getJSON()});
 assert.equal(network.ok,true);assert.equal(network.host_carrier_selected,'NODE_GITHUB_API');
 let calls=0;
 const broken=await runC72SelectedHostIngress({...inp(),carrier:'AUTO',
  getGithubJSON:async()=>{calls++;throw Error('DNS unreachable')}});
 assert.equal(broken.ok,false);assert.equal(broken.edge,'C72_HEAD_READ_OUTCOME_UNKNOWN');
 assert.equal(calls,1);assert.equal(broken.original_owner_invoked,false);
 assert.equal(chooseC72HostCarrier({sourcePacket:packet(),
  getGithubJSON:getJSON()}).edge,'C72_HOST_PORT_AMBIGUOUS');
});
test('20k deterministic Host auto-selection cases: no fake native evidence',()=>{
 let n=0;
 for(let i=0;i<20000;i++){
  const a=i%5,b=Math.floor(i/5)%5,c=Math.floor(i/25)%8,d=Math.floor(i/200)%100;
  const req={allowNodeGithubHTTPS:(a%2)===0};
  if(b===0)req.sourcePacket=packet();
  if(b===1){req.readMain=async()=>head;req.readPinnedDocument=async()=>docs[0]}
  if(b===2)req.getGithubJSON=getJSON();
  if(c===5)req.readMain=async()=>head;
  if(d===7)req.sourcePacket=packet();
  const picked=chooseC72HostCarrier(req);
  assert.equal(typeof picked.ok,'boolean');
  if(picked.ok)assert(['NODE_GITHUB_API','HOST_SOURCE_PACKET','HOST_CALLBACKS'].includes(picked.carrier));
  else assert(['C72_SOURCE_BRIDGE_UNBOUND','C72_HOST_PORT_AMBIGUOUS'].includes(picked.edge));
  n++;
 }
 assert.equal(n,20000);
});

test('R3 same-epoch DNS denial executes before network callback; packet remains valid',async()=>{
 let calls=0;
 const networkObservation={runtimeEpoch:'R3',nodeDns:{status:'FAILED_OBSERVED',host:'api.github.com',epoch:'R3'}};
 const reject=await runC72SelectedHostIngress({...inp(),carrier:'NODE_GITHUB_API',
  getGithubJSON:async()=>{calls++;throw Error('should not reach transport')},networkObservation});
 assert.equal(reject.ok,false);assert.equal(reject.edge,'R3_SAME_EPOCH_NODE_DNS_REPROBE_DENIED');
 assert.equal(calls,0);assert.equal(reject.original_owner_invoked,false);
 const valid=await runC72SelectedHostIngress({...inp(),carrier:'HOST_SOURCE_PACKET',
  sourcePacket:packet(),networkObservation});
 assert.equal(valid.ok,true,JSON.stringify(valid));
 assert.equal(validateC72V2Accepted(valid.accepted),true);
 assert.equal(validateC72V2Orientation(valid.introduction,valid.accepted),true);
});
test('R3 rejects fake witness before callback; does not claim owner receipt',async()=>{
 let calls=0;
 const q=inp();q.priorTurnEvidence.pinned_blob_shas['TERMS.md']='not-a-sha';
 const result=await runC72SelectedHostIngress({...q,carrier:'NODE_GITHUB_API',
  getGithubJSON:async()=>{calls++;throw Error('must not call')}});
 assert.equal(result.edge,'R3_C72_FIRST_TURN_OR_CARRIER_UNVERIFIED');
 assert.equal(result.original_owner_invoked,false);assert.equal(calls,0);
 const gate=screenC72HostIngress({...inp(),ownerOutcome:'NOT_INVOKED',carrier:'HOST_SOURCE_PACKET'});
 assert.equal(gate.disposition,'PASS_TO_ORIGINAL_CHECK');
 assert.equal(gate.permission_granted,false);assert.equal(gate.owner_receipt_issued,false);
});
