import {isC98JSONDataTree,isC98PlainDataRecord} from './c98-c82-connector-port.mjs';
import {executeC98FileBackedC84} from './c98-file-backed-c84-entry.mjs';

// Injectable server-side App port; not a registered ChatGPT App by itself.
// No user/model-supplied current input, source or proof may bypass this port.
// A callable port is not proof that ChatGPT authenticated its original event.
const H40=/^[a-f0-9]{40}$/, H64=/^[a-f0-9]{64}$/;
const fields=['allowedRoot','archivePath','archiveSha256','sourceHead','manifestSha256',
 'manifest','manifestBase64','humanInput','selection','sourceProof'];
const stop=(edge)=>Object.freeze({schema:'ikant-le-c98-installed-app-ingress/v1',
 status:'C98_HOST_APP_STOP',first_unclosed_edge:edge,
 owner_executed:false,host_installed_attested:false,
 original_human_event_attested:false,source_origin_attested:false,
 native_delivery_attested:false,active:false,authority:0});
const exact=(x,ks)=>isC98PlainDataRecord(x)&&
 Object.keys(x).sort().join(',')===ks.slice().sort().join(',');
const timed=(fn,ms)=>{let t;return Promise.race([
 Promise.resolve().then(fn),new Promise((_,reject)=>{t=setTimeout(()=>reject(Error('HOST_PORT_TIMEOUT')),ms);})
 ]).finally(()=>clearTimeout(t));};

export async function executeC98RegisteredAppTurn({registeredHostPort,timeoutMs=5000}={}){
 if(!exact(registeredHostPort,['readCurrentTurnEnvelope'])||
   typeof registeredHostPort.readCurrentTurnEnvelope!=='function')
  return stop('HOST_APP_CALLBACK_NOT_INSTALLED');
 if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>15000)
  return stop('HOST_APP_TIMEOUT_ENVELOPE');
 let packet;
 try{packet=await timed(()=>registeredHostPort.readCurrentTurnEnvelope(),timeoutMs);}
 catch{return stop('HOST_APP_CURRENT_TURN_CALLBACK_FAILED_OR_TIMED_OUT');}
 if(!exact(packet,fields)||!isC98JSONDataTree(packet))
  return stop('HOST_APP_UNTRUSTED_ENVELOPE');
 if(typeof packet.humanInput!=='string'||!packet.humanInput.trim()||
    Buffer.byteLength(packet.humanInput,'utf8')>600||
    !H40.test(packet.sourceHead)||!H64.test(packet.manifestSha256)||
    !H64.test(packet.archiveSha256)||
    typeof packet.manifestBase64!=='string'||packet.manifestBase64.length>160000)
  return stop('HOST_APP_CURRENT_INPUT_OR_SOURCE_BOUNDS');
 // No arbitrary callback/owner receipt is accepted in the data envelope.
 // Reuse the existing C98 physical file receiver and C84 runtime owner.
 let result;
 try{result=await executeC98FileBackedC84(packet);}
 catch{return stop('HOST_APP_C84_RUNTIME_ERROR');}
 if(result?.status!=='C98_EXISTING_C84_OWNER_RECEIPT_READY_NOT_HOST_DELIVERED')
  return stop(result?.first_unclosed_edge||'C84_SAME_INPUT_OWNER_UNAVAILABLE');
 return Object.freeze({schema:'ikant-le-c98-installed-app-ingress/v1',
  status:'C98_OWNER_EXECUTED_APP_PORT_NOT_NATIVE_DELIVERED',
  source_head:packet.sourceHead,
  input_sha256:result.current_input_sha256,
  output_sha256:result.owner_receipt?.output_sha256,
  owner_receipt:result.owner_receipt,
  owner_executed:true,
  host_installed_attested:false,original_human_event_attested:false,
  source_origin_attested:false,native_delivery_attested:false,
  active:false,authority:0,
  first_unclosed_edge:'INDEPENDENT_HOST_APP_INSTALLATION_AND_NATIVE_DELIVERY_WITNESS'});
}
