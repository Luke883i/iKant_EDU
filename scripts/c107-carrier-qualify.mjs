#!/usr/bin/env node
/** CI FIXTURE, not real human consent or native ChatGPT message delivery. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {PIN,inspectC107Carrier,stageC107Carrier,qualifyC107Voice,c107Handoff} from '../host/c107-carrier-consumer.mjs';
const H=b=>crypto.createHash('sha256').update(b).digest('hex');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const must=(x,why)=>{if(!x)throw Error(why)};
export async function runCarrierQualification(){
 const raw=fs.readFileSync(path.join(root,PIN.name)),proof=inspectC107Carrier(raw);
 must(proof.ok,'CARRIER_DENIED:'+proof.first_unclosed_edge);
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'pr118-h2-'));
 try{
  const s=stageC107Carrier(raw,{parent});must(s.ok&&s.member_count===43,'C107_STAGE_FAILED:'+s.first_unclosed_edge);
  const dir=s.install_root;
  const a=await import(pathToFileURL(path.join(dir,'host/c72-unified-mode-admission.mjs')).href);
  const terms=fs.readFileSync(path.join(dir,'TERMS.md'));
  const accepted=a.acceptC72Terms({offer:a.issueC72TermsOffer({sourceHead:PIN.head,termsDigest:H(terms)}),
   humanMessage:'I ACCEPT',termsPresented:true});
  const introduction=a.presentC72Introduction(accepted);
  const selection=a.selectC72Mode({accepted,orientation:introduction,humanMessage:'EXPERIMENTAL'});
  must(selection.status==='EXPERIMENTAL_SELECTED_NOT_RUNNING','C72_FIXTURE_INVALID');
  const ledDir=path.join(dir,'.ikant-host');fs.mkdirSync(ledDir,{mode:0o700});
  const ledger=path.join(ledDir,'c107-observations.jsonl');
  const call=x=>{
   const p=spawnSync(process.execPath,['scripts/c107-turn-cli.mjs',ledger],{
    cwd:dir,encoding:'utf8',input:JSON.stringify(x),timeout:30000,maxBuffer:4000000});
   must(p.status===0,'ORIGINAL_NODE_PROCESS_FAILED:'+p.stderr);return JSON.parse(p.stdout);
  };
  const inputs=['Spiega il metodo di valutazione in due passaggi',
   'Quale criterio e coerente con quanto detto prima?',
   'Descrivi il confine tra un host e un runtime cognitivo'];
  const outcomes=[];
  for(let i=0;i<3;i++){
   const input=inputs[i],nonce='pr118-ci-turn-'+(i+1)+'-nonce-00001';
   const candidate=i===2?{input_sha256:H(Buffer.from(input)),
    text:'Bozza HOST di test, non voce autonoma iKant: testo fornito dalla fixture linguistica.'}:undefined;
   const request={sourceHead:PIN.head,selection,humanInput:input,optIn:true,
    ...(candidate?{modelCandidate:candidate}:{})};
   const receipt=call({nonce,request,priorMessages:inputs.slice(0,i),resetContext:i===0});
   const readback=call({action:'INSPECT'});
   const voice=qualifyC107Voice({turn:receipt,readback,humanInput:input,nonce,ledgerFile:ledger});
   must(receipt.status==='C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK'&&
    readback.count===i+1&&receipt.c70_ephemeral_turns===i+1&&
    voice.origin===(i===2?'HOST_BOUND':'ORIGINAL_DEMO'),'C70_C100_C87_NOT_PROVEN');
   const forgeries=[
    qualifyC107Voice({turn:receipt,readback,humanInput:input,nonce:'forged-nonce-12345678',ledgerFile:ledger}),
    qualifyC107Voice({turn:{...receipt,voice_utf8:receipt.voice_utf8+' tamper'},readback,humanInput:input,nonce,ledgerFile:ledger}),
    qualifyC107Voice({turn:receipt,readback,humanInput:input+' changed',nonce,ledgerFile:ledger}),
    qualifyC107Voice({turn:receipt,readback:{...readback,last_hash:'0'.repeat(64)},humanInput:input,nonce,ledgerFile:ledger})
   ];
   must(forgeries.every(x=>x.origin==='NO_VOICE'),'FORGED_VOICE_PROMOTED');
   outcomes.push({origin:voice.origin,input_sha256:receipt.input_sha256,
    voice_sha256:receipt.output_sha256,event_sha256:receipt.ledger_event_sha256,
    cognitive_turns:receipt.c70_ephemeral_turns,denied_forgeries:4});
  }
  const replay=call({nonce:'pr118-ci-turn-1-nonce-00001',
   request:{sourceHead:PIN.head,selection,humanInput:inputs[0],optIn:true},
   priorMessages:[],resetContext:true});
  must(replay.status==='C107_STOP'&&call({action:'INSPECT'}).count===3,'C87_NONCE_REPLAY_ACCEPTED');
  fs.appendFileSync(ledger,'{"tampered":true}\n');
  must(call({action:'INSPECT'}).status==='C107_STOP','C87_LEDGER_TAMPER_ACCEPTED');
  must(c107Handoff({attempts:2,newEvidence:false}).status==='MANUAL_SOURCE_HANDOFF','P04_HANDOFF');
  return {status:'C107_CARRIER_H2_ORIGINAL_VERIFIED',
   source_head:PIN.head,carrier_sha256:PIN.carrier_sha256,
   members:proof.member_count,turns:outcomes,replay_denied:true,corruption_denied:true,
   native_chatgpt_hook:false,provider_identity_attested:false,
   original_stage_owner:false,fixture_only:true,active:false,
   first_unclosed_edge:'NATIVE_CHATGPT_PER_TURN_DISPATCH'};
 }finally{fs.rmSync(parent,{recursive:true,force:true})}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await runCarrierQualification(),null,2))}
 catch(e){console.error('C107_CARRIER_QUALIFY_STOP',String(e));process.exitCode=1}
}
