import {isProxy} from 'node:util/types';
const control=new Set(['I ACCEPT','EXPERIMENTAL','CANONICAL','STOP BOZZE COHOST',
 'AUTORIZZO BOZZE COHOST SPERIMENTALI NON VERIFICATE','ESCI LAB','MOSTRA STATO',
 'avvia iKant','attiva iKant']);
const nonceRe=/^[A-Za-z0-9_-]{12,96}$/;
const sensitive=/(?:\bpassword\s*[:=]|\bapi[_ -]?key\s*[:=]|\bbearer\s+[a-z0-9._~+-]{12,}|\bprivate[_ -]?key\s*[:=])/i;
const shaLike=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const plain=(x,allowed)=>{try{return x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 !isProxy(x)&&Object.getPrototypeOf(x)===Object.prototype&&
 Reflect.ownKeys(x).every(k=>typeof k==='string'&&allowed.includes(k)&&
 Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));}catch{return false;}};
/** Shared by real C109 turn path and 1M mutation executable. */
export function checkC109TurnFrame({text,nonce,candidate}={}){
 if(typeof text!=='string'||!text.trim()||Buffer.byteLength(text,'utf8')>600||
  Buffer.from(text,'utf8').toString('utf8')!==text||sensitive.test(text)||control.has(text))
  return 'C109_SUBSTANTIVE_SAFE_INPUT_REQUIRED';
 if(typeof nonce!=='string'||!nonceRe.test(nonce))return 'C109_HOST_NONCE_BOUNDARY';
 if(candidate!==undefined&&(!plain(candidate,['input_sha256','text'])||
   Reflect.ownKeys(candidate).length!==2||!shaLike(candidate.input_sha256)||
   typeof candidate.text!=='string'||!candidate.text.trim()||
   Buffer.byteLength(candidate.text,'utf8')>16000||sensitive.test(candidate.text)))
  return 'C109_HOST_CANDIDATE_BOUNDARY';
 return null;
}
