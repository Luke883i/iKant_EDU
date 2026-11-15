import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const H40=/^[a-f0-9]{40}$/;const H64=/^[a-f0-9]{64}$/;
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const ZERO='0'.repeat(64);
const pureJSON=(x,depth=0)=>{
 if(depth>12)return false;
 if(x===null||typeof x==='string'||typeof x==='boolean')return true;
 if(typeof x==='number')return Number.isFinite(x);
 if(Array.isArray(x))return x.length<=200&&x.every(v=>pureJSON(v,depth+1));
 if(typeof x==='object'){const proto=Object.getPrototypeOf(x);return (proto===Object.prototype||proto===null)&&
  Object.keys(x).length<=100&&Object.entries(x).every(([k,v])=>
   !['__proto__','prototype','constructor'].includes(k)&&pureJSON(v,depth+1));}
 return false;
};

function recordDigest(r){const {record_sha256,...body}=r;return sha(JSON.stringify(body));}
export function verifyC87LedgerEntries(entries){
 if(!Array.isArray(entries)||entries.length>20000)return {status:'C87_LEDGER_INVALID',index:-1};
 let previous=ZERO;
 for(let i=0;i<entries.length;i++){
  const r=entries[i];
  if(!r||r.schema!=='ikant-le-c87-ledger-event/v1'||r.sequence!==i+1||
   r.prev_hash!==previous||!H40.test(r.source_head||'')||
   !H64.test(r.input_sha256||'')||!H64.test(r.output_sha256||'')||
   r.active!==false||r.native_session_persistence_attested!==false||
   !r.state||typeof r.state!=='object'||Array.isArray(r.state)||!pureJSON(r.state)||
   JSON.stringify(r.state).length>4096||r.record_sha256!==recordDigest(r))
    return {status:'C87_LEDGER_INVALID',index:i};
  previous=r.record_sha256;
 }
 return {status:'C87_LEDGER_CHAIN_VALID',count:entries.length,last_hash:previous,
  native_session_persistence_attested:false};
}
export function c87Event({sequence,prev_hash=ZERO,source_head,input_sha256,output_sha256,state={}}){
 const body={schema:'ikant-le-c87-ledger-event/v1',sequence,prev_hash,source_head,
  input_sha256,output_sha256,state,active:false,native_session_persistence_attested:false};
 return {...body,record_sha256:sha(JSON.stringify(body))};
}
function read(file){
 if(!fs.existsSync(file))return [];
 if(fs.lstatSync(file).isSymbolicLink())throw Error('C87_SYMLINK_LEDGER');
 const data=fs.readFileSync(file,'utf8');
 if(!data)return [];
 if(!data.endsWith('\n'))throw Error('C87_TORN_LEDGER');
 const entries=data.trimEnd().split('\n').map(s=>JSON.parse(s));
 if(verifyC87LedgerEntries(entries).status!=='C87_LEDGER_CHAIN_VALID')throw Error('C87_LEDGER_TAMPER');
 return entries;
}
/** One exclusive lock, append/fsync, reopen/hash. No ChatGPT durable storage implied. */
export function appendC87Turn(file,{source_head,input_sha256,output_sha256,state={}},{atomicGuard=null}={}){
 if(typeof file!=='string'||!path.isAbsolute(file)||
  !H40.test(source_head||'')||!H64.test(input_sha256||'')||!H64.test(output_sha256||''))
  throw Error('C87_SOURCE_OR_PATH_INVALID');
 const dir=path.dirname(file);if(!fs.statSync(dir).isDirectory())throw Error('C87_PARENT_MISSING');
 if(!state||typeof state!=='object'||Array.isArray(state)||!pureJSON(state)||
  JSON.stringify(state).length>4096)throw Error('C87_STATE_SIZE_OR_SHAPE');
 const lock=file+'.lock';let fd;
 try{
  fd=fs.openSync(lock,'wx',0o600);
  const prior=read(file);
  // Compare nonce/epoch/prior hash under the SAME writer lock as append+fsync.
  if(atomicGuard!==null){
   if(!atomicGuard||typeof atomicGuard!=='object'||!H40.test(atomicGuard.source_head||'')||
    typeof atomicGuard.nonce!=='string'||atomicGuard.nonce.length<12||
    !H64.test(atomicGuard.expected_prior_hash||''))throw Error('C87_ATOMIC_GUARD_INVALID');
   if(atomicGuard.expected_prior_hash!==(prior.at(-1)?.record_sha256||ZERO))
    throw Error('C87_PRIOR_LEDGER_CHANGED');
   if(prior.some(x=>x.source_head!==atomicGuard.source_head))
    throw Error('C87_SOURCE_EPOCH_DRIFT');
   if(prior.some(x=>x.state?.nonce===atomicGuard.nonce))
    throw Error('C87_NONCE_REPLAY');
  }
  const r=c87Event({sequence:prior.length+1,prev_hash:prior.at(-1)?.record_sha256||ZERO,
   source_head,input_sha256,output_sha256,state});
  const next=[...prior,r];
  if(verifyC87LedgerEntries(next).status!=='C87_LEDGER_CHAIN_VALID')throw Error('C87_EVENT_INVALID');
  const h=fs.openSync(file,'a',0o600);
  try{const bytes=Buffer.from(JSON.stringify(r)+'\n');if(fs.writeSync(h,bytes)!==bytes.length)throw Error('C87_SHORT_WRITE');fs.fsyncSync(h);}finally{fs.closeSync(h);}
  const reread=read(file);
  if(reread.length!==next.length||reread.at(-1).record_sha256!==r.record_sha256)
   throw Error('C87_POST_WRITE_READBACK');
  return {status:'C87_LOCAL_DURABLE_READBACK_NOT_NATIVE_SESSION',sequence:r.sequence,
   event_sha256:r.record_sha256,ledger_entries:reread.length,
   write_reopen_verified:true,native_session_persistence_attested:false,active:false};
 }finally{if(fd!==undefined){fs.closeSync(fd);fs.unlinkSync(lock);}}
}
export function reopenC87Ledger(file){
 const e=read(file);const v=verifyC87LedgerEntries(e);
 return {...v,latest_state:e.at(-1)?.state||null,native_session_persistence_attested:false};
}
