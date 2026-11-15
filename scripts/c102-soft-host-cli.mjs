import fs from 'node:fs';
import readline from 'node:readline';
import {executeC102SoftTurn,inspectC102Ledger} from '../host/c102-soft-host-bridge.mjs';
const STOP=(edge)=>({schema:'ikant-le-c102-cli/v1',status:'C102_STOP',first_unclosed_edge:edge,active:false,authority:0});
const args=process.argv.slice(2);
if(args.length!==3||args[0]!=='--ledger'||args[2]!=='--ndjson'){
 process.stdout.write(JSON.stringify(STOP('C102_EXPLICIT_FLAGS_REQUIRED'))+'\n');process.exitCode=2;
}else{
 const ledgerFile=args[1];
 const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false});
 for await(const line of rl){
  let output;
  try{if(Buffer.byteLength(line,'utf8')>90000)throw Error('oversize');const req=JSON.parse(line);
   output=req?.action==='INSPECT'?inspectC102Ledger(ledgerFile):executeC102SoftTurn({ledgerFile,nonce:req?.nonce,request:req?.request});
  }catch{output=STOP('C102_INPUT_FRAME_INVALID');}
  process.stdout.write(JSON.stringify(output)+'\n');
 }
}
