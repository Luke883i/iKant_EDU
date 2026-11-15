/** Non-native, gateway-issued per-user/per-session request fence for MCP.
 * The *trusted upstream* alone issues proof; cannot infer provider identity from metadata.
 * Persistent exclusive nonce reservations prevent replay across Node processes.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {isProxy} from 'node:util/types';
const no=reason=>Object.freeze({ok:false,reason,provider_identity_attested:false,active:false});
const atom=x=>typeof x==='string'&&/^[A-Za-z0-9_.:-]{8,128}$/.test(x);
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const configured=x=>typeof x==='string'&&Buffer.byteLength(x,'utf8')>=32&&Buffer.byteLength(x,'utf8')<=1024;
function safe(payload){if(!payload||typeof payload!=='object'||Array.isArray(payload)||isProxy(payload)||
 Object.getPrototypeOf(payload)!==Object.prototype)return false;
 const keys=Object.keys(payload).sort().join(',');return keys==='event,method,path,session,ts,user'&&
 ['event','session','user'].every(k=>atom(payload[k]))&&payload.path==='/mcp'&&
 ['POST','GET','DELETE'].includes(payload.method)&&Number.isSafeInteger(payload.ts);
}
export function signS06GatewayProof({payload,secret}={}){ // trusted reverse proxy only
 if(!safe(payload)||!configured(secret))throw Error('S06_SIGN_DENIED');
 const encoded=Buffer.from(JSON.stringify(payload),'utf8').toString('base64url');
 const mac=crypto.createHmac('sha256',secret).update(encoded).digest('hex');
 return encoded+'.'+mac;
}
export function verifyS06GatewayProof({proof,secret,method,path:resource='/mcp',now=Date.now(),nonceDirectory}={}){
 if(!configured(secret)||typeof nonceDirectory!=='string'||!path.isAbsolute(nonceDirectory))return no('S06_GATEWAY_NOT_CONFIGURED');
 if(typeof proof!=='string'||proof.length>1000||!/^[A-Za-z0-9_-]{20,920}\.[a-f0-9]{64}$/.test(proof))return no('S06_GATEWAY_PROOF_MISSING');
 const [encoded,signature]=proof.split('.');
 const expect=crypto.createHmac('sha256',secret).update(encoded).digest();
 if(!crypto.timingSafeEqual(Buffer.from(signature,'hex'),expect))return no('S06_GATEWAY_BAD_SIGNATURE');
 let payload;try{payload=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'))}catch{return no('S06_GATEWAY_INVALID_PAYLOAD')}
 if(!safe(payload)||payload.method!==method||payload.path!==resource||!Number.isSafeInteger(now)||
    payload.ts>now+5000||payload.ts<now-60000)return no('S06_GATEWAY_STALE_OR_SCOPE');
 // Directory must be provisioned by operator; neither request nor model creates it.
 let stat;try{stat=fs.lstatSync(nonceDirectory)}catch{return no('S06_GATEWAY_NONCE_STORE_UNAVAILABLE')}
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o022)!==0)return no('S06_GATEWAY_NONCE_STORE_UNSAFE');
 const noncePath=path.join(nonceDirectory,digest(payload.user+'\0'+payload.session+'\0'+payload.event));
 let fd;try{fd=fs.openSync(noncePath,fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_WRONLY|fs.constants.O_NOFOLLOW,0o600);
   fs.writeSync(fd,JSON.stringify({ts:payload.ts,expires_at:payload.ts+60000})+'\n');
 }catch{return no('S06_GATEWAY_REPLAY_OR_STORE_FAILURE')}finally{if(fd!==undefined)fs.closeSync(fd)}
 return Object.freeze({ok:true,status:'GATEWAY_HMAC_BOUND_ONLY',user:payload.user,session:payload.session,event:payload.event,
  provider_identity_attested:false,active:false});
}
