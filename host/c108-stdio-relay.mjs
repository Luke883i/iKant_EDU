import {spawn} from 'node:child_process';
import readline from 'node:readline';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {isProxy} from 'node:util/types';

const file=fileURLToPath(new URL('../scripts/c107-model-stdio.mjs',import.meta.url));
const sha=s=>crypto.createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const stopped=e=>({schema:'ikant-le-c107-host-language-port/v1',
 status:'C107_HOST_LANGUAGE_STOP',first_unclosed_edge:e,
 active:false,native_delivery_attested:false,model_provider_origin_attested:false});
const validPort=x=>{
 try{return !!x&&typeof x==='object'&&!Array.isArray(x)&&!isProxy(x)&&
 Object.getPrototypeOf(x)===Object.prototype&&
 Reflect.ownKeys(x).length===1&&
 Object.hasOwn(Object.getOwnPropertyDescriptor(x,'generate'),'value')&&
 typeof x.generate==='function';}catch{return false;}
};
// No shell, no untrusted executable path, no provider credentials.
// This is an actual child process, not an emulated C107 receipt.
export function makeC108StdioRelay({languagePort,timeoutMs=30000}={}){
 if(!validPort(languagePort)||!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>60000)
 throw Error('C108_STDIO_CALLABLE_LANGUAGE_PORT_REQUIRED');
 return {async turn({request,nonce,ledgerFile,priorMessages,resetContext}){
  return await new Promise(resolve=>{
   const child=spawn(process.execPath,[file],{
    stdio:['pipe','pipe','pipe'],env:{LANG:'C.UTF-8',TZ:'UTC'},shell:false});
   let settled=false,voice=null,frames=0,bytes=0,modelCalled=false;
   const done=r=>{if(settled)return;settled=true;clearTimeout(timer);
    try{child.stdin.end();}catch{}child.kill();resolve(r);};
   const timer=setTimeout(()=>done(stopped('C108_STDIO_TIMEOUT')),timeoutMs);
   const send=frame=>{if(settled)return;try{child.stdin.write(JSON.stringify(frame)+'\n');}
    catch{done(stopped('C108_STDIO_WRITE_FAILURE'));}};
   const rl=readline.createInterface({input:child.stdout,crlfDelay:Infinity});
   rl.on('line',async line=>{
    if(settled)return;frames++;bytes+=Buffer.byteLength(line,'utf8');
    if(frames>9||bytes>100000)return done(stopped('C108_STDIO_FRAME_BOUNDS'));
    let r;try{r=JSON.parse(line);}catch{return done(stopped('C108_STDIO_JSON'));}
    if(r.event==='MODEL_REQUEST'){
     if(modelCalled||r.nonce!==nonce||r.task?.input_sha256!==sha(request.humanInput))
      return done(stopped('C108_STDIO_MODEL_TASK_INPUT_NONCE'));
     modelCalled=true;
     let text;try{text=await languagePort.generate(r.task);}
     catch{return done(stopped('C108_STDIO_MODEL_CALLBACK_FAILURE'));}
     if(typeof text!=='string'||!text.trim()||Buffer.byteLength(text,'utf8')>16000)
      return done(stopped('C108_STDIO_MODEL_OUTPUT_BOUNDS'));
     send({op:'MODEL_REPLY',nonce,input_sha256:r.task.input_sha256,text});
    }else if(r.event==='VOICE'){
     if(r.nonce!==nonce||!modelCalled||typeof r.text!=='string')
      return done(stopped('C108_STDIO_VOICE_NONCE'));
     voice=r.text;
    }else if(r.event==='OBSERVATION'){
     if(r.nonce!==nonce||voice===null||r.receipt?.output_sha256!==sha(voice))
      return done(stopped('C108_STDIO_OBSERVATION_BINDING'));
     done({...r.receipt,voice_utf8:voice});
    }else if(r.event==='STOP')done(r.receipt||stopped('C108_STDIO_C107_STOP'));
    else done(stopped('C108_STDIO_UNRECOGNIZED_EVENT'));
   });
   child.on('error',()=>done(stopped('C108_STDIO_PROCESS_FAILURE')));
   child.on('close',()=>{if(!settled)done(stopped('C108_STDIO_EOF'));});
   child.stderr.on('data',()=>{});
   send({op:'TURN',request,nonce,ledgerFile,priorMessages,resetContext});
  });
 }};
}
