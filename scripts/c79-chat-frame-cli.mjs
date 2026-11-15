import fs from 'node:fs';
import {prepareC79ChatSurface} from '../host/c79-native-chat-surface.mjs';

function emit(v){process.stdout.write(JSON.stringify(v)+'\n');}
let content='';
try{
 const b=fs.readFileSync(0);
 if(b.length>80_000)throw Error('C79_INPUT_ENVELOPE_TOO_LARGE');
 content=b.toString('utf8');
 const x=JSON.parse(content);
 if(!x||x.schema!=='ikant-le-c79-render-request/v1'||
    Object.keys(x).some(k=>!['schema','selection','sourceHead','expectedManifestSha256','currentHumanInput','relayReadback'].includes(k)))
  throw Error('C79_RENDER_ENVELOPE_INVALID');
 const result=prepareC79ChatSurface(x);
 emit(result);
 if(result.status!=='C79_CHAT_PACKET_READY_NOT_DELIVERED')process.exitCode=2;
}catch(e){
 emit({schema:'ikant-le-c79-render-error/v1',
  status:'C79_STOP',first_unclosed_edge:'C79_RENDER_ENVELOPE',
  detail:String(e?.message||e).slice(0,140),
  active:false,native_chat_delivery_attested:false,authority:0});
 process.exitCode=2;
}
