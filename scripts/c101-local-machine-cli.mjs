import fs from 'node:fs';
import readline from 'node:readline';
import {executeC101LocalCohostMachine,verifyC101Readback} from '../host/c101-local-cohost-machine.mjs';
// One-shot stdin or explicit --ndjson local per-turn carrier. Neither mode
// installs a ChatGPT hook nor certifies host message origin/delivery.
const STOP=Object.freeze({schema:'ikant-le-c101-cli/v1',status:'C101_STOP',
 first_unclosed_edge:'C101_CLI_INPUT_OR_EXECUTION',active:false,authority:0});
function routeLine(source){
 try{
  if(Buffer.byteLength(source,'utf8')>90000)throw Error('C101_CLI_ENVELOPE_TOO_LARGE');
  const input=JSON.parse(source);
  const receipt=executeC101LocalCohostMachine(input);
  const readback=receipt.status==='C101_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED'?
    verifyC101Readback(receipt,input):{ok:false,first_unclosed_edge:receipt.first_unclosed_edge};
  return {receipt,readback};
 }catch{return {receipt:STOP,readback:{ok:false,first_unclosed_edge:STOP.first_unclosed_edge}};}
}
if(process.argv.slice(2).join(' ')==='--ndjson'){
 const lines=readline.createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false});
 // Each independently bounded line maps to exactly one response; no shared
 // cognitive state, no native event identity, no hidden retries.
 for await(const line of lines){
  // Even a blank frame consumes one slot and yields one typed STOP.
  const result=routeLine(line);
  process.stdout.write(JSON.stringify(result)+'\n');
 }
}else if(process.argv.length===2){
 let result;
 try{result=routeLine(fs.readFileSync(0).toString('utf8'));}
 catch{result={receipt:STOP,readback:{ok:false,first_unclosed_edge:STOP.first_unclosed_edge}};}
 process.stdout.write(JSON.stringify(result)+'\n');
 if(!result.readback.ok)process.exitCode=2;
}else{
 process.stdout.write(JSON.stringify({receipt:STOP,readback:{ok:false,first_unclosed_edge:'C101_CLI_UNKNOWN_FLAG'}})+'\n');
 process.exitCode=2;
}
