/** Bounds the C20 subprocess bridge. Failure after send has UNKNOWN write outcome. */
import {spawn} from 'node:child_process';
export const WRITE_OPS=new Set(['open','accept','turn','accept-limited','limited-turn']);
export const DEFAULT_TIMEOUT_MS=45_000;
export const MAX_STDIN_BYTES=256*1024;
export const MAX_STDOUT_BYTES=8*1024*1024;
export const MAX_STDERR_BYTES=256*1024;

export function runtimeBridgeError(op,reason){
 const unknown=WRITE_OPS.has(op);
 const error=new Error(unknown?'MCP_UNKNOWN_WRITE_RECONCILE':'MCP_RUNTIME_READ_FAILED');
 error.code=error.message;
 error.reason=reason; // only internal, never return stderr or secrets to HTTP client
 error.retry_allowed=false;
 error.authority=0;
 return error;
}

export function invokeRuntime({op,payload,cli,repoRoot,env=process.env,
 timeoutMs=DEFAULT_TIMEOUT_MS,spawnImpl=spawn}={}){
 return new Promise((resolve,reject)=>{
  if(typeof op!=='string'||![...WRITE_OPS].includes(op)||
    !Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>300000){
   reject(runtimeBridgeError(op,'invalid_operation_or_budget'));return;
  }
  let stdin;
  try{stdin=Buffer.from(JSON.stringify(payload),'utf8');}
  catch{reject(runtimeBridgeError(op,'serialization'));return;}
  if(stdin.length>MAX_STDIN_BYTES){reject(runtimeBridgeError(op,'input_limit'));return;}
  let child;
  try{child=spawnImpl(process.execPath,[cli,op],{
   cwd:repoRoot,env:{...env,IKANT_LE_REPO_ROOT:repoRoot},stdio:['pipe','pipe','pipe']});}
  catch{reject(runtimeBridgeError(op,'spawn_failed'));return;}
  let ended=false,stdout=[],stdoutN=0,stderrN=0;
  const close=(value,error)=>{
   if(ended)return;
   ended=true;clearTimeout(timer);
   if(error)reject(error);else resolve(value);
  };
  const stop=reason=>{
   try{child.kill('SIGKILL');}catch{}
   close(null,runtimeBridgeError(op,reason));
  };
  const timer=setTimeout(()=>stop('timeout'),timeoutMs);
  timer.unref?.();
  child.stdout.on('data',b=>{
   stdoutN+=Buffer.byteLength(b);
   if(stdoutN>MAX_STDOUT_BYTES){stop('stdout_limit');return;}
   stdout.push(b);
  });
  child.stderr.on('data',b=>{
   stderrN+=Buffer.byteLength(b);
   if(stderrN>MAX_STDERR_BYTES)stop('stderr_limit');
  });
  child.on('error',()=>stop('child_error'));
  child.stdin.on('error',()=>stop('stdin_error'));
  child.on('close',code=>{
   if(ended)return;
   if(code!==0){stop('process_nonzero');return;}
   try{close(JSON.parse(Buffer.concat(stdout.map(x=>Buffer.from(x))).toString('utf8')),null);}
   catch{stop('unparseable_output');}
  });
  child.stdin.end(stdin);
 });
}
