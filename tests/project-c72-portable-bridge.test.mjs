import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {validateC72V2Accepted,validateC72V2Orientation} from '../host/c72-public-mode-admission.mjs';
import {executeC72PostAcceptRecovery,describeC72BridgeEvidence} from '../host/project-c72-host-recovery.mjs';
import {bindC72Transport} from '../host/project-c72-capability-port.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD');
const paths=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const docs=paths.map(path=>({path,source_head:head,
 blob_sha1:git('rev-parse','HEAD:'+path),
 content:execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'})}));
const packet=()=>({schema:'ikant-host-c72-source-packet/v1',
 source_head:head,live_head:head,carrier_kind:'HOST_OPAQUE_TRANSFER',
 source_origin_attested:false,native_event_attested:false,
 documents:structuredClone(docs)});
const witness=()=>({source_head:head,host_link_displayed:true,
 distinct_human_message_observed:true,
 terms_link:`https://github.com/Luke883i/iKant_EDU/blob/${head}/TERMS.md`,
 pinned_blob_shas:Object.fromEntries(docs.map(d=>[d.path,d.blob_sha1]))});
const args=()=>({humanMessage:'I ACCEPT',freshHumanTurn:true,
 priorTurnEvidence:witness(),sourcePacket:packet()});
test('Host-selected packet path executes unmodified original C72 owner',async()=>{
 const r=await executeC72PostAcceptRecovery(args());
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.transport_kind,'HOST_SOURCE_PACKET');
 assert.equal(r.source_origin_attested,false);
 assert.equal(r.native_event_attested,false);
 assert.equal(r.original_owner_invoked,true);
 assert(validateC72V2Accepted(r.accepted));
 assert(validateC72V2Orientation(r.introduction,r.accepted));
 assert.equal(r.active,false);
 assert.equal(r.trace.filter(x=>x.startsWith('READ_PINNED:')).length,5);
});
test('legacy actual callbacks are still supported without ABI break',async()=>{
 const r=await executeC72PostAcceptRecovery({...args(),sourcePacket:undefined,
  readMain:async()=>head,
  readPinnedDocument:async path=>docs.find(d=>d.path===path)});
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.transport_kind,'HOST_CALLBACKS');
});
test('two carriers are ambiguous; no carrier stays UNBOUND, not ABSENT',async()=>{
 const dual=await executeC72PostAcceptRecovery({...args(),readMain:async()=>head});
 assert.equal(dual.edge,'C72_HOST_PORT_AMBIGUOUS');
 const none=await executeC72PostAcceptRecovery({...args(),sourcePacket:undefined});
 assert.equal(none.edge,'C72_SOURCE_BRIDGE_UNBOUND');
 assert.equal(none.original_owner_invoked,false);
});
test('different byte, duplicated path, wrong HEAD and absent native event all fail closed',async()=>{
 const x=args();x.sourcePacket.documents[4].content+='tamper';
 assert.equal((await executeC72PostAcceptRecovery(x)).edge,
   'C72_PINNED_DOCUMENT_BLOB_INVALID');
 const y=args();y.sourcePacket.documents[1].path='README.md';
 assert.equal((await executeC72PostAcceptRecovery(y)).edge,'C72_HOST_PACKET_INVALID');
 const z=args();z.sourcePacket.live_head='0'.repeat(40);
 assert.equal((await executeC72PostAcceptRecovery(z)).edge,'STOP_SOURCE_LOCK_STALE');
 const q=args();q.sourcePacket.native_event_attested=true;
 assert.equal((await executeC72PostAcceptRecovery(q)).edge,'C72_HOST_PACKET_INVALID');
});
test('one-shot physical stdin Node process verifies full original receipts',()=>{
 const req={schema:'ikant-host-c72-port-request/v1',...args()};
 const child=spawnSync(process.execPath,['scripts/project-c72-portable-cli.mjs'],
  {encoding:'utf8',input:JSON.stringify(req),maxBuffer:2_000_000});
 assert.equal(child.status,0,child.stderr+' '+child.stdout);
 const r=JSON.parse(child.stdout);
 assert(validateC72V2Accepted(r.accepted));
 assert(validateC72V2Orientation(r.introduction,r.accepted));
 const tamper=structuredClone(req);tamper.sourcePacket.documents[3].content+='x';
 const bad=spawnSync(process.execPath,['scripts/project-c72-portable-cli.mjs'],
  {encoding:'utf8',input:JSON.stringify(tamper),maxBuffer:2_000_000});
 assert.equal(bad.status,2);
 assert.equal(JSON.parse(bad.stdout).ok,false);
});
test('100k deterministic 5-axis port mutation cells: reject any invalid evidence',()=>{
 let negative=0,positive=0;
 const baseline=packet();
 for(let i=0;i<100000;i++){
  const p={...baseline,documents:[...baseline.documents]},a=i%10,b=Math.floor(i/10)%10,c=Math.floor(i/100)%10,
   d=Math.floor(i/1000)%10,e=Math.floor(i/10000)%10;
  if(a>=5)p.source_head='f'.repeat(40);
  if(b>=5)p.live_head='not-a-sha';
  if(c>=5)p.carrier_kind='DECLARED_ONLY';
  if(d>=5)p.documents[4]={...p.documents[4],path:'README.md'};
  if(e>=5)p.native_event_attested=true;
  const r=bindC72Transport({sourceHead:head,sourcePacket:p});
  if(a>=5||b>=5||c>=5||d>=5||e>=5){
   assert.equal(r.ok,false);negative++;
  }else{
   assert.equal(r.ok,true);positive++;
   assert.equal(r.source_origin_attested,false);
   assert.equal(r.native_event_attested,false);
  }
 }
 assert.equal(negative+positive,100000);
 assert(negative>0&&positive>0);
});

test('live-split diagnosis: connector and Node availability do not mean physical handoff',async()=>{
 const r=await executeC72PostAcceptRecovery({...args(),sourcePacket:undefined});
 assert.equal(r.ok,false);assert.equal(r.edge,'C72_SOURCE_BRIDGE_UNBOUND');
 assert.equal(r.original_owner_invoked,false);
 assert.equal(r.bridge_evidence.node_check_observed,true);
 assert.equal(r.bridge_evidence.node_carrier_bound,false);
 assert.equal(r.bridge_evidence.records_ingested,0);
 assert.equal(r.bridge_evidence.cross_tool_transfer_failure_observed,false);
 assert.equal(r.bridge_evidence.github_connector_to_node_origin_attested,false);
 const positive=await executeC72PostAcceptRecovery(args());
 assert.equal(positive.ok,true);
 assert.equal(positive.bridge_evidence.node_carrier_kind,'HOST_SOURCE_PACKET');
 assert.equal(positive.bridge_evidence.records_ingested,5);
 assert.equal(positive.bridge_evidence.github_connector_to_node_origin_attested,false);
 assert.equal(positive.bridge_evidence.native_human_event_attested,false);
});

test('10k four-axis field observations never launder fixture bindings into provider proof',()=>{
 let cases=0;
 const carriers=[null,'TRANSPORT:HOST_CALLBACKS','TRANSPORT:HOST_SOURCE_PACKET',
  null,null,'TRANSPORT:HOST_CALLBACKS',null,'TRANSPORT:HOST_SOURCE_PACKET',null,null];
 for(let a=0;a<10;a++)for(let b=0;b<10;b++)for(let c=0;c<10;c++)for(let d=0;d<10;d++){
  const trace=[];
  if(a%2===0)trace.push('VERIFY_NODE_20');
  if(b%2===0)trace.push('VERIFY_PINNED_API_TRANSPORT');
  if(carriers[c])trace.push(carriers[c]);
  for(let k=0;k<d%6;k++)trace.push('READ_PINNED:synthetic-'+k);
  const e=describeC72BridgeEvidence(trace);
  assert.equal(e.node_carrier_bound,carriers[c]!==null);
  assert.equal(e.records_ingested,d%6);
  assert.equal(e.github_connector_to_node_origin_attested,false);
  assert.equal(e.native_human_event_attested,false);
  assert.equal(e.cross_tool_transfer_failure_observed,false);
  cases++;
 }
 assert.equal(cases,10000);
});
