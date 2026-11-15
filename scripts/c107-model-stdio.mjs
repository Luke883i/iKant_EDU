#!/usr/bin/env node
import readline from 'node:readline';
import crypto from 'node:crypto';
import {executeC107HostLanguageTurn} from '../host/c107-host-language-port.mjs';
import {inspectC107Ledger} from '../host/c107-experimental-turn.mjs';

// Bidirectional bounded STDIO carrier for a host-installed model provider.
// No network API, fake provider identity, native ChatGPT hook or second ledger.
const sha=s=>crypto.createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const stop=e=>({schema:'ikant-le-c107-model-stdio/v1',status:'C107_HOST_STOP',
 first_unclosed_edge:e,active:false,native_delivery_attested:false,
 model_provider_origin_attested:false});
const emit=o=>process.stdout.write(JSON.stringify(o)+'\n');
const it=readline.createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false})[Symbol.asyncIterator]();
const read=async()=>{
 const x=await it.next();if(x.done)return null;
 if(Buffer.byteLength(x.value,'utf8')>130000)throw Error('OVERSIZE_FRAME');
 const f=JSON.parse(x.value);
 if(!f||typeof f!=='object'||Array.isArray(f))throw Error('BAD_FRAME');
 return f;
};
for(;;){
 let frame;
 try{frame=await read();}catch{emit(stop('INVALID_FRAME'));continue;}
 if(frame===null)break;
 if(frame.op==='INSPECT'){emit({event:'LEDGER',value:inspectC107Ledger(frame.ledgerFile)});continue;}
 if(frame.op!=='TURN'||typeof frame.nonce!=='string'){
  emit(stop('EXPLICIT_TURN_REQUIRED'));continue;
 }
 const languagePort={async generate(task){
  emit({event:'MODEL_REQUEST',nonce:frame.nonce,task});
  const reply=await read();
  if(!reply||reply.op!=='MODEL_REPLY'||reply.nonce!==frame.nonce||
   reply.input_sha256!==sha(task.current_input_utf8)||typeof reply.text!=='string')
   throw Error('MODEL_REPLY_NOT_BOUND');
  return reply.text;
 }};
 const receipt=await executeC107HostLanguageTurn({ledgerFile:frame.ledgerFile,
  nonce:frame.nonce,request:frame.request,priorMessages:frame.priorMessages||[],
  resetContext:frame.resetContext===true,languagePort});
 if(receipt.status==='C107_HOST_CALLBACK_LOCAL_RUNTIME_READBACK'){
  emit({event:'VOICE',nonce:frame.nonce,text:receipt.voice_utf8});
  const {voice_utf8,...meta}=receipt;
  emit({event:'OBSERVATION',nonce:frame.nonce,receipt:meta});
 }else emit({event:'STOP',nonce:frame.nonce,receipt});
}
