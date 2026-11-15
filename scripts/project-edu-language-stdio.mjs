/** Experimental Host-supplied text transport for ORIGINAL C135 languagePort.
 * The owner creates the actual cognitive task; this module does not generate
 * language, edit the task, issue model ACKs, append C87, or claim provider API.
 * The Host must hand the returned task to its model, and send the answer in the
 * SAME physical invocation; UNKNOWN is terminal, never an automatic retry.
 */
import {createHash} from 'node:crypto';
import {createInterface} from 'node:readline';
const sha=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
export function createOneShellLanguageStdio({input=process.stdin,output=process.stdout}={}){
 const rx=createInterface({input,crlfDelay:Infinity});
 const queue=[];let waiter=null,broken=false,busy=false,seq=0;
 rx.on('line',line=>{if(Buffer.byteLength(line,'utf8')>150000){broken=true;rx.close();return;}
   if(waiter){const f=waiter;waiter=null;f(line);}else queue.push(line);});
 rx.on('close',()=>{broken=true;if(waiter){const f=waiter;waiter=null;f(null);}});
 const receive=()=>queue.length?Promise.resolve(queue.shift()):broken?Promise.resolve(null):new Promise(resolve=>waiter=resolve);
 return async (task,hostHumanistContext=null)=>{
   if(busy||broken||!plain(task))throw Error('LANGUAGE_BRIDGE_BUSY_OR_UNAVAILABLE');
   busy=true;
   try{
     const msg=JSON.stringify(task),taskId=sha(msg+':'+(++seq));
     if(Buffer.byteLength(msg,'utf8')>128000)throw Error('LANGUAGE_TASK_TOO_LARGE');
     output.write(JSON.stringify({schema:'ikant-edu-host-language-task/v1',task_id:taskId,
       task,...(hostHumanistContext?.schema==='ikant-host-humanist-guidance/v1'&&
       hostHumanistContext.authority===0&&hostHumanistContext.no_owner_override===true
        ?{humanist_context:hostHumanistContext}:{}),
       model_binding:'HOST_WITNESSED_ONLY',original_owner_receipt:false})+'\n');
     const line=await receive();
     if(line===null)throw Error('LANGUAGE_BRIDGE_REPLY_UNKNOWN');
     let answer;try{answer=JSON.parse(line);}catch{throw Error('LANGUAGE_REPLY_INVALID_JSON');}
     if(!plain(answer)||answer.schema!=='ikant-edu-host-language-reply/v1'||
        answer.task_id!==taskId||typeof answer.text!=='string'||
        !answer.text.trim()||Buffer.byteLength(answer.text,'utf8')>12000)
       throw Error('LANGUAGE_REPLY_OR_CORRELATION_INVALID');
     // Return verbatim to the ORIGINAL C135 owner, which independently checks
     // ACK, language policy and the right to commit C87/C125. Never synthesize.
     const {schema,task_id,...originalResponse}=answer;
     return Object.freeze(originalResponse);
   }finally{busy=false;}
 };
}
