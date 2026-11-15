import fs from 'node:fs';
import {executeC107Turn,inspectC107Ledger} from '../host/c107-experimental-turn.mjs';
const f=process.argv[2];
if(!f){console.log(JSON.stringify({status:'C107_STOP',first_unclosed_edge:'LEDGER_REQUIRED'}));process.exit(2);}
try{
 const x=JSON.parse(fs.readFileSync(0,'utf8'));
 const r=x.action==='INSPECT'?inspectC107Ledger(f):executeC107Turn({...x,ledgerFile:f});
 process.stdout.write(JSON.stringify(r)+'\n');
}catch{console.log(JSON.stringify({status:'C107_STOP',first_unclosed_edge:'INVALID_TURN_FRAME'}));process.exitCode=2;}
