import fs from 'node:fs';
import {executeC92ProductionTurn} from '../host/c92-owner-surface.mjs';
const STOP=x=>({schema:'ikant-le-c92-owner-surface/v1',status:'C92_STOP',
 first_unclosed_edge:x,active:false,native_chat_delivery_attested:false,authority:0});
let result;
try{
 const b=fs.readFileSync(0);if(b.length>9000000||!b.length)throw Error('REQUEST_SIZE');
 const q=JSON.parse(b.toString('utf8'));
 if(q?.schema!=='ikant-le-c92-host-input/v1'||!q.request||
   Object.keys(q).sort().join(',')!=='request,schema')throw Error('REQUEST_SHAPE');
 result=await executeC92ProductionTurn(q.request);
}catch{result=STOP('MALFORMED_INPUT_OR_EXECUTION');}
process.stdout.write(JSON.stringify(result)+'\n');
if(result.status!=='C92_EXPERIMENTAL_OWNER_ACCEPTED_SURFACE_A_STAGED_NOT_NATIVE_DELIVERED')
 process.exitCode=2;
