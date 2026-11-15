/** Optional bounded OS-only Needle worker. Never dispatches a tool or original iKant owner. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const worker=resolve(root,'scripts/needle-shadow-worker.py');
const fixture=resolve(root,'tests/fixtures/needle-shadow-hang.py');
let inFlight=false;
export async function completeWithLocalNeedle(input,{python='python3',timeoutMs=2000,testFixture=false}={}){
 if(inFlight)throw Error('NEEDLE_BUSY');
 if(typeof input!=='string'||!input.length||Buffer.byteLength(input,'utf8')>8192||input.includes('\0'))throw Error('NEEDLE_INPUT_DENIED');
 if(!Number.isInteger(timeoutMs)||timeoutMs<50||timeoutMs>2000||!['python','python3'].includes(python))throw Error('NEEDLE_BUDGET_OR_PYTHON_DENIED');
 if(testFixture!==false&&!(testFixture===true&&process.env.IKANT_NEEDLE_FIXTURE_TEST==='1'))throw Error('NEEDLE_TEST_FIXTURE_DENIED');
 inFlight=true;
 const file=testFixture?fixture:worker;
 try{
  return await new Promise((resolveResult,rejectResult)=>{
   let child;try{
    child=spawn(python,['-I',file],{stdio:['pipe','pipe','ignore'],shell:false,windowsHide:true,env:{
      PATH:process.env.PATH||'/usr/bin',NEEDLE_TELEMETRY:'0',DO_NOT_TRACK:'1',
      HF_HUB_OFFLINE:'1',TRANSFORMERS_OFFLINE:'1',PYTHONDONTWRITEBYTECODE:'1',
    }});
   }catch{rejectResult(Error('NEEDLE_SPAWN_DENIED'));return;}
   let done=false,timedOut=false,tooBig=false,bytes=0,chunks=[];
   const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);clearTimeout(watchdog);if(error)rejectResult(error);else resolveResult(value);};
   const timer=setTimeout(()=>{timedOut=true;child.kill('SIGKILL');},timeoutMs);
   const watchdog=setTimeout(()=>{child.kill('SIGKILL');finish(Error('NEEDLE_PROCESS_EXIT_UNCONFIRMED'));},timeoutMs+500);
   child.stdout.on('data',chunk=>{bytes+=chunk.length;if(bytes>4096){tooBig=true;child.kill('SIGKILL');}else chunks.push(chunk);});
   child.on('error',()=>{child.kill('SIGKILL');finish(Error('NEEDLE_PROCESS_FAILED'));});
   child.on('close',code=>{
    if(timedOut)return finish(Error('NEEDLE_WORKER_TIMEOUT_EXITED'));
    if(tooBig)return finish(Error('NEEDLE_STDOUT_OVER_BUDGET_EXITED'));
    if(code!==0)return finish(Error('NEEDLE_WORKER_REFUSED'));
    try{
     const raw=Buffer.concat(chunks).toString('utf8');
     if(!raw.endsWith('\n')||raw.trim().includes('\n'))throw Error('framing');
     const value=JSON.parse(raw);finish(null,value);
    }catch{finish(Error('NEEDLE_INVALID_WORKER_JSON'));}
   });
   child.stdin.on('error',()=>{child.kill('SIGKILL');});
   child.stdin.end(JSON.stringify({input})+'\n');
  });
 }finally{inFlight=false;}
}
