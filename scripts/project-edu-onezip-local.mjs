/** EDU only: filesystem custody, not user identity, provider persistence or a new ledger. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const H64=/^[a-f0-9]{64}$/u;
const NONCE=/^[A-Za-z0-9_-]{12,96}$/u;
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
const enforce=(x,edge)=>{if(!x)throw Error(edge);};
export const oneZipLocalTestScope='SESSION_PRIVATE_FILESYSTEM_NOT_NATIVE_WIDGET';

export function openLocalOneZip(root,{head,tree,readLedger}) {
 const info=fs.lstatSync(root);
 enforce(info.isDirectory()&&!info.isSymbolicLink()&&fs.realpathSync(root)===root&&(info.mode&0o077)===0,
  'EDU_LOCAL_ROOT_NOT_PRIVATE');
 const lock=path.join(root,'.edu-onezip-local-flight');
 let fd;
 try { fd=fs.openSync(lock,'wx',0o600); } catch { throw Error('EDU_LOCAL_FLIGHT_UNRESOLVED'); }
 let closed=false;
 const close=()=>{if(!closed){closed=true;fs.closeSync(fd);fs.unlinkSync(lock);}};
 try {
  const members=fs.readdirSync(root);
  const attempts=members.filter(n=>n.startsWith('edu-turn-attempt-'));
  const receipts=members.filter(n=>n.startsWith('edu-turn-receipt-'));
  enforce(attempts.length===receipts.length&&receipts.length<1000,'EDU_LOCAL_ATTEMPT_RECONCILE');
  const prior=receipts.map(n=>{
   const nonce=n.slice('edu-turn-receipt-'.length,-'.json'.length), f=path.join(root,n);
   const st=fs.lstatSync(f);
   enforce(n.endsWith('.json')&&NONCE.test(nonce)&&attempts.includes('edu-turn-attempt-'+nonce+'.json')&&
    st.isFile()&&!st.isSymbolicLink()&&st.nlink===1&&(st.mode&0o077)===0&&st.size<160000,
    'EDU_LOCAL_RECEIPT_UNSAFE');
   const text=fs.readFileSync(f,'utf8'), r=JSON.parse(text);
   const {local_seal,...body}=r;
   enforce(text===JSON.stringify(r)+'\n'&&local_seal===hash(JSON.stringify(body))&&r.ok===true&&
    r.head===head&&r.tree===tree&&r.continuity==='SESSION_LOCAL'&&r.nonce===nonce&&
    Number.isSafeInteger(r.turn_index)&&r.turn_index>0&&r.native_delivery_attested===false&&
    r.frame?.voice_origin==='HOST_BOUND_LOCAL'&&typeof r.frame.slots?.A==='string'&&
    r.original_voice_sha256===hash(r.frame.slots.A)&&r.original_c125_sha256===hash(r.original_c125_utf8||'')&&
    typeof r.oneshell_utf8==='string'&&r.oneshell_sha256===hash(r.oneshell_utf8)&&
    r.oneshell_utf8===['ESITO','A','B','PROVA','EDGE','NEXT'].map((k)=>
      ({A:'iKant (Superficie A)',B:'Host (Superficie B)'}[k]||k)+' | '+r.frame.slots?.[k]).join('\n')&&
    r.original_c125_utf8.includes('<<<VOICE_UTF8_START>>>\n'+r.frame.slots.A+'\n<<<VOICE_UTF8_END>>>')&&
    H64.test(r.original_c87_last_hash||'')&&Array.isArray(r.local_window)&&r.local_window.length<=4&&
    r.local_window.every(v=>typeof v==='string'&&v.trim()&&Buffer.byteLength(v,'utf8')<=12000),
    'EDU_LOCAL_RECEIPT_INVALID');
   return r;
  }).sort((a,b)=>a.turn_index-b.turn_index);
  for (let i=0;i<prior.length;i++) {
   enforce(prior[i].turn_index===i+1&&prior[i].prior_local_seal===(prior[i-1]?.local_seal??null)&&
    (i===0||prior[i].ledger_file===prior[i-1].ledger_file),'EDU_LOCAL_RECEIPT_CHAIN_INVALID');
  }
  const latest=prior.at(-1)??null;
  if(latest) {
   const f=latest.ledger_file, rel=typeof f==='string'?path.relative(root,f):'..';
   enforce(rel&&!rel.startsWith('..')&&!path.isAbsolute(rel)&&path.basename(f)==='c107-observations.jsonl'&&
    path.basename(path.dirname(f))==='.ikant-host'&&fs.realpathSync(f)===f,
    'EDU_LOCAL_LEDGER_PATH_INVALID');
   const st=fs.lstatSync(f);
   enforce(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1&&(st.mode&0o077)===0&&st.size<=5000000,
    'EDU_LOCAL_LEDGER_CAPACITY_OR_CUSTODY');
   const read=readLedger(f);
   enforce(read.status==='C87_LEDGER_CHAIN_VALID'&&read.count===latest.turn_index&&
    read.last_hash===latest.original_c87_last_hash&&read.latest_state?.nonce===latest.nonce,
    'EDU_LOCAL_LEDGER_RECONCILE');
  }
  return {close,latest,turnIndex:prior.length+1,priorMessages:latest?.local_window??[],
   resumeFrom:latest?{ledgerFile:latest.ledger_file,expectedCount:latest.turn_index,
     expectedLastHash:latest.original_c87_last_hash,previousWorkerGone:true}:null};
 } catch(e) { close();throw e; }
}

export function sealLocalTurn(receipt,{local,nonce,evidence,ledgerFile,humanInput}) {
 const read=evidence.original_c87_readback;
 enforce(typeof ledgerFile==='string'&&read.count===local.turnIndex&&H64.test(read.last_hash||'')&&
  (!local.latest||local.latest.ledger_file===ledgerFile),'EDU_LOCAL_COMMITTED_RECONCILE');
 const r={...receipt,continuity:'SESSION_LOCAL',nonce,turn_index:local.turnIndex,ledger_file:ledgerFile,
  original_c87_last_hash:read.last_hash,original_c125_utf8:evidence.original_c125_utf8,
  local_window:[...local.priorMessages,humanInput].slice(-4),prior_local_seal:local.latest?.local_seal??null};
 return {...r,local_seal:hash(JSON.stringify(r))};
}
