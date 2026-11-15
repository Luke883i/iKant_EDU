#!/usr/bin/env node
/** Physical HOST-supplied stdin, or explicitly selected Node-local GitHub HTTPS.
 * Neither creates native ChatGPT hooks, consent events or C72 receipt owners.
 */
import {runC72SelectedHostIngress} from '../host/project-c72-physical-ingress.mjs';
let raw='';
try{
 for await(const chunk of process.stdin){
  raw+=chunk.toString('utf8');
  if(Buffer.byteLength(raw,'utf8')>750000)throw Error('C72_PORT_STDIN_BOUNDS');
 }
 const p=JSON.parse(raw);
 if(p?.schema!=='ikant-host-c72-port-request/v1'||p?.humanMessage!=='I ACCEPT'||
  p?.freshHumanTurn!==true||!p?.priorTurnEvidence||
  (p?.ownerOutcome&&p.ownerOutcome!=='NOT_INVOKED'))
  throw Error('C72_PORT_REQUEST_INVALID');
 // Legacy packet requests are preserved verbatim. HTTPS must be selected,
 // never tried automatically after a source transport or owner failure.
 const mode=p.transport??'HOST_SOURCE_PACKET';
 if(!['HOST_SOURCE_PACKET','NODE_GITHUB_API'].includes(mode)||
  (mode==='HOST_SOURCE_PACKET'&&!p.sourcePacket)||
  (mode==='NODE_GITHUB_API'&&p.sourcePacket!==undefined))
  throw Error('C72_PORT_CARRIER_INVALID');
 const r=await runC72SelectedHostIngress({
  humanMessage:p.humanMessage,freshHumanTurn:p.freshHumanTurn,
  priorTurnEvidence:p.priorTurnEvidence,
  carrier:mode,...(mode==='HOST_SOURCE_PACKET'?{sourcePacket:p.sourcePacket}:{}),
  ownerOutcome:'NOT_INVOKED'
 });
 process.stdout.write(JSON.stringify(r)+'\n');
 if(r.ok!==true)process.exitCode=2;
}catch(e){
 process.stdout.write(JSON.stringify({ok:false,kind:'STOP',
  edge:String(e.message||'C72_PORT_UNKNOWN').replace(/[^A-Z0-9_]/g,'').slice(0,90),
  original_owner_invoked:false,authority:0,native_event_attested:false})+'\n');
 process.exitCode=2;
}
