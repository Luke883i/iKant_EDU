import fs from 'node:fs';
import {executeC94ColdHostTurn} from '../host/c94-cold-host-turn.mjs';
const stop=e=>({schema:'ikant-le-c94-cold-host-turn/v1',status:'C94_TURN_STOP',first_unclosed_edge:e,
 owner_executed:false,native_delivery_attested:false,active:false,authority:0});
let result;
try{
 const bytes=fs.readFileSync(0);
 if(!bytes.length||bytes.length>12000)throw Error('HOST_INGRESS_SIZE');
 const o=JSON.parse(bytes.toString('utf8'));
 if(!o||o.schema!=='ikant-le-c94-host-ingress/v1'||
    Object.keys(o).sort().join(',')!=='request,schema'||
    !o.request||Object.keys(o.request).sort().join(',')!==['humanInput','selection','sourceHead'].sort().join(','))
  throw Error('HOST_INGRESS_SCHEMA');
 // This CLI intentionally lacks native delivery hooks. Only an actually installed
 // application host may call the JS API with its registered callback and key.
 result=await executeC94ColdHostTurn(o.request);
}catch(e){result=stop(String(e?.message||e).slice(0,90));}
process.stdout.write(JSON.stringify(result)+'\n');
if(result.status!=='C94_OWNER_GENERATED_EXPERIMENTAL_NOT_PLATFORM_ATTESTED')process.exitCode=2;
