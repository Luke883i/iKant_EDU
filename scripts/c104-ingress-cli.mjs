import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import {inspectC104,stageC104} from '../host/c104-resumable-materialization.mjs';
// The host supplies actual config bytes and transported member bytes. This
// script does NOT fetch GitHub, register ChatGPT hooks or mint native events.
const stop=edge=>({schema:'ikant-le-c104-ingress/v1',status:'C104_STOP',
 first_unclosed_edge:edge,active:false,authority:0,native_delivery_attested:false});
const args=process.argv.slice(2);
if(args.length!==3||args[0]!=='--config'||args[2]!=='--ndjson'||!path.isAbsolute(args[1])){
 process.stdout.write(JSON.stringify(stop('C104_EXPLICIT_CONFIG_REQUIRED'))+'\n');process.exitCode=2;
}else{
 let context;
 try {const bytes=fs.readFileSync(args[1]);if(bytes.length>80000)throw Error('OVERSIZE');context=JSON.parse(bytes.toString('utf8'));}
 catch{context=null;}
 const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false});
 for await(const line of rl){
  let result;
  try {if(Buffer.byteLength(line,'utf8')>1_600_000)throw Error('FRAME_OVERSIZE');
   const frame=JSON.parse(line);
   if(frame.op==='INSPECT'||frame.op==='NEXT'||frame.op==='COMPLETE')result=inspectC104(context);
   else if(frame.op==='STAGE')result=stageC104({context,filePath:frame.path,
     contentBase64:frame.contentBase64,carrierId:frame.carrierId});
   else result=stop('C104_UNKNOWN_FRAME');
  }catch{result=stop('C104_FRAME_INVALID');}
  if(result.status==='C104_SOURCE_BYTES_100PCT_NOT_RUNTIME'&&result.runtime_qualified!==false)
   result=stop('C104_ILLEGAL_RUNTIME_PROMOTION');
  process.stdout.write(JSON.stringify(result)+'\n');
 }
 // A transport EOF is not a terminal completion receipt. The next invocation
 // can re-open the exact cache and resume from the derived missing set.
}
