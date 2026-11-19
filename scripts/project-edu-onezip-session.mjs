#!/usr/bin/env node
/** Host transport for one ORIGINAL C135 turn, with #179 portable C87 checkpoint.
 * Requires a physically interactive stdin/stdout session for languagePort.
 * Output is local original evidence, NOT native ChatGPT message delivery.
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {openLocalOneZip,sealLocalTurn} from './project-edu-onezip-local.mjs';
import {createOneShellLanguageStdio} from './project-edu-language-stdio.mjs';
const H40=/^[a-f0-9]{40}$/u;
const fail=edge=>Object.freeze({ok:false,edge,voice:'NO_VOICE',active:false,native_delivery_attested:false,authority:0});
const sha=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
/** A is only the original voice; the original C125 transport includes metadata.
 * This validates distinct byte boundaries, NOT provider-native delivery. */
export function verifyOneZipOriginalC125Evidence(frame,evidence){
 const voice=frame?.slots?.A, transport=evidence?.original_c125_utf8;
 if(frame?.voice_origin!=='HOST_BOUND_LOCAL'||typeof voice!=='string'||!voice.trim()||
    voice==='NO_VOICE'||typeof transport!=='string'||!transport.length||
    frame.original_voice_sha256!==sha(voice)||
    evidence.original_c125_sha256!==sha(transport)||
    !transport.includes('<<<VOICE_UTF8_START>>>\n'+voice+'\n<<<VOICE_UTF8_END>>>')||
    evidence.original_c87_readback?.status!=='C107_LEDGER_REOPENED')
    return false;
 return true;
}
function writeOnce(p,body){const b=Buffer.from(JSON.stringify(body)+'\n');const fd=fs.openSync(p,'wx',0o600);
 try{fs.writeFileSync(fd,b);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
 if(!fs.readFileSync(p).equals(b))throw Error('EDU_RECEIPT_READBACK_INVALID');}
export async function runOneZipOriginalTurn(q){
 let session=null,attempted=false,local=null;
 const view=q?.action==='REOPEN_VIEW';
 const useLocal=q?.continuity==='SESSION_LOCAL';
 try{
  if(q?.schema!=='ikant-edu-onezip-turn/v1'||(!view&&q.humanTurnWitnessed!==true)||
    (q.continuity!==undefined&&!useLocal)||(!useLocal&&view)||
    (useLocal&&q.resumeFrom!==undefined)||
    !H40.test(q.head||'')||(!view&&(typeof q.humanInput!=='string'||!q.humanInput.trim()||
    Buffer.byteLength(q.humanInput,'utf8')>12000||
    !/^[A-Za-z0-9._-]{12,128}$/.test(q.nonce||'')||
    !Array.isArray(q.priorMessages)||q.priorMessages.length>4||
    q.priorMessages.some(x=>typeof x!=='string'||Buffer.byteLength(x,'utf8')>12000)))||
    !path.isAbsolute(q.sourceRoot||'')||!path.isAbsolute(q.privateRoot||'')||
    (fs.lstatSync(q.privateRoot).mode&0o077)!==0)return fail('EDU_ONEZIP_TURN_GATE_INVALID');
  const dir=q.sourceRoot;
  const source=JSON.parse(fs.readFileSync(path.join(dir,'.project-source-readback.json'),'utf8'));
  if(source.source_head!==q.head||!H40.test(source.source_tree||''))return fail('EDU_SOURCE_EPOCH_INVALID');
  const loader=await import(pathToFileURL(path.join(dir,'scripts/project-repo-loader.mjs')).href);
  loader.verifyLocalProjectSource(dir,{head:q.head,tree:source.source_tree});
  const owner=await import(pathToFileURL(path.join(dir,'host/c72-public-mode-admission.mjs')).href);
  const c72=JSON.parse(fs.readFileSync(path.join(q.privateRoot,'c72-selection.json'),'utf8'));
  if(c72.head!==q.head||!owner.validateC72V2ModeSelection(c72.selection,{mode:'EDU',sourceHead:q.head}))
    return fail('EDU_C72_MODE_RECEIPT_INVALID');
  if(useLocal){
   const ledger=await import(pathToFileURL(path.join(dir,'host/c87-durable-ledger.mjs')).href);
   local=openLocalOneZip(q.privateRoot,{head:q.head,tree:source.source_tree,readLedger:ledger.reopenC87Ledger});
   if(view){
    if(!local.latest)return fail('EDU_LOCAL_VIEW_NOT_READY');
    const r=local.latest;
    return {ok:true,kind:'EDU_REOPENED_SESSION_VIEW',frame:r.frame,turn_index:r.turn_index,
     original_c87_last_hash:r.original_c87_last_hash,active:false,native_delivery_attested:false,authority:0};
   }
  }
  const priorMessages=local?.priorMessages??q.priorMessages;
  const one=await import(pathToFileURL(path.join(dir,'host/project-oneshell-edu.mjs')).href);
  session=await one.startOneShellEdu({selection:c72.selection,sourceRoot:dir,
    sourceBinding:{head:q.head,tree:source.source_tree},privateParent:q.privateRoot,
    languagePort:createOneShellLanguageStdio(),afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'},
    resumeFrom:local?local.resumeFrom:q.resumeFrom??null});
  if(!session.ok||!session.runtime_ready)return fail(session.frame?.slots?.EDGE||'EDU_C135_NOT_READY');
  writeOnce(path.join(q.privateRoot,'edu-turn-attempt-'+q.nonce+'.json'),{nonce:q.nonce,head:q.head,state:'ATTEMPTED'});
  attempted=true;
  const f=await session.publishTurn({humanInput:q.humanInput,nonce:q.nonce,
    priorMessages,resetContext:local?local.turnIndex===1:q.resetContext===true});
  const e=session.getLastEvidence();
  if(!verifyOneZipOriginalC125Evidence(f,e))
    return fail(f?.slots?.EDGE||'EDU_ORIGINAL_VOICE_NOT_REOPENED');
  const receipt={ok:true,schema:'ikant-edu-onezip-original-turn/v1',head:q.head,tree:source.source_tree,
    frame:f,owner:'C135_EDU_V2',original_c125_sha256:e.original_c125_sha256,original_voice_sha256:f.original_voice_sha256,
    active:false,native_delivery_attested:false,authority:0};
  if(local){
   const sealed=sealLocalTurn(receipt,{local,nonce:q.nonce,evidence:e,ledgerFile:session.readSessionState()?.ledger_file,humanInput:q.humanInput});
   writeOnce(path.join(q.privateRoot,'edu-turn-receipt-'+q.nonce+'.json'),sealed);
   return {...receipt,continuity:'SESSION_LOCAL',turn_index:sealed.turn_index,original_c87_last_hash:sealed.original_c87_last_hash};
  }
  const cp=session.exportPortableC87({priorMessages:[...priorMessages,q.humanInput].slice(-4)});
  if(cp?.schema!=='ikant-le-c135-portable-c87/v1')
   return {...fail(cp?.first_edge||'EDU_C87_CHECKPOINT_DENIED'),effect:'C87_COMMITTED_RECONCILE_READ_ONLY',retryable:false};
  const portable={...receipt,checkpoint:cp};
  writeOnce(path.join(q.privateRoot,'edu-turn-receipt-'+q.nonce+'.json'),portable);
  return portable;
 }catch(e){return fail(attempted?'EDU_OWNER_OUTCOME_UNKNOWN_NO_RETRY':'EDU_PREOWNER_STOP:'+String(e.message||'UNKNOWN').slice(0,90));}
 finally{try{if(session?.close)session.close();}finally{local?.close();}}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const qpath=process.argv[2];
 try{if(!path.isAbsolute(qpath||''))throw Error('ABSOLUTE_REQUEST_FILE_REQUIRED');
  const r=await runOneZipOriginalTurn(JSON.parse(fs.readFileSync(qpath,'utf8')));
  process.stdout.write(JSON.stringify(r)+'\n');if(!r.ok)process.exitCode=2;
 }catch(e){process.stdout.write(JSON.stringify(fail(String(e.message||'INPUT_INVALID')))+'\n');process.exitCode=2;}
}
