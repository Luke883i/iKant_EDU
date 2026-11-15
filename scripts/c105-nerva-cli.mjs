import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import {dispatchC105Nerva} from '../host/c105-nerva.mjs';

// Host explicitly supplies CONFIG and starts Node. Never an automatic ChatGPT
// hook; a JSON frame contains a closed human-readable command and typed args.
const stop=e=>({schema:'ikant-le-c105-nerva-cli/v1',status:'C105_STOP',
 first_unclosed_edge:e,active:false,authority:0,native_delivery_attested:false});
const a=process.argv.slice(2);
if(a.length!==3||a[0]!=='--config'||a[2]!=='--ndjson'||!path.isAbsolute(a[1])){
 process.stdout.write(JSON.stringify(stop('C105_CONFIG_AND_NDJSON_REQUIRED'))+'\n');process.exitCode=2;
}else{
 let config;
 try{
  const bytes=fs.readFileSync(a[1]);if(bytes.length>160000)throw Error('CONFIG_TOO_LARGE');
  config=JSON.parse(bytes.toString('utf8'));
  if(!config||typeof config!=='object'||!config.context||typeof config.ledgerFile!=='string')
   throw Error('CONFIG_MISSING');
 }catch{config=null;}
 const lines=readline.createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false});
 for await(const line of lines){
  let result;
  try{
   if(!config||Buffer.byteLength(line,'utf8')>1800000)throw Error('CONFIG_OR_FRAME');
   const frame=JSON.parse(line);
   if(!frame||typeof frame.command!=='string'||!Object.hasOwn(frame,'command'))
    throw Error('COMMAND');
   // Per-turn data is explicit. No host-inferred consent or hidden chat memory.
   result=await dispatchC105Nerva({...frame,context:config.context,
    ledgerFile:config.ledgerFile,capsuleDir:config.capsuleDir,
    manifestSha256:config.manifestSha256});
  }catch{result=stop('C105_CLI_FRAME_OR_EXECUTION');}
  process.stdout.write(JSON.stringify(result)+'\n');
 }
}
