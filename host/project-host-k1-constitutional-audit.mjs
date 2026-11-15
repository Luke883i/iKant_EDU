/** R2 P0/K1 local technical audit only. No owner, consent, remote-origin or delivery claims. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {isProxy} from 'node:util/types';
import {K1_ORIGINAL_PATHS} from './project-host-k1-preowner.mjs';
import {reopenC72Accepted} from './project-c72-receipt-transit.mjs';
import {renderOneShell} from './project-oneshell-edu.mjs';
export const ATTACKS=Object.freeze(['PRECONSENT_IO','MISSING_WITNESS','STALE_HEAD','UNBOUND_ORIGIN',
 'BAD_COMMIT','BAD_TREE','PATH_SWAP','BAD_BLOB','UNOBSERVED_RELAY','PUBLIC_FILE',
 'NO_READBACK','REPLAY','OWNER_UNKNOWN','FAKE_C72','FAKE_C135','EPOCH_MISMATCH',
 'CI_PROMOTED_TO_PROVIDER','SELF_CERTIFIED_PASS','MISSING_CONSENT','SYMLINK_HARDLINK']);
const SHA=/^[0-9a-f]{40}$/u,NONCE=/^[A-Za-z0-9_-]{12,96}$/u;
const stop=edge=>Object.freeze({ok:false,kind:'STOP',edge,authority:0,active:false,
 original_receipt_attested:false,provider_attested:false,owner_invoked:false});
const digest=b=>createHash('sha256').update(b).digest('hex');
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function privateRoot(p){
 if(typeof p!=='string'||!path.isAbsolute(p)||path.resolve(p)!==p)throw Error('BAD_ROOT');
 const s=fs.lstatSync(p);
 if(!s.isDirectory()||s.isSymbolicLink()||fs.realpathSync(p)!==p||
   (s.mode&0o077)!==0||(process.getuid&&s.uid!==process.getuid()))throw Error('UNSAFE_ROOT');
 return p;
}
function reread(file){
 const s=fs.lstatSync(file);
 if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||(s.mode&0o077)!==0||
    s.size<40||s.size>4096)throw Error('UNSAFE_RECORD');
 const fd=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
 try{
  const a=fs.fstatSync(fd),data=fs.readFileSync(fd),b=fs.fstatSync(fd);
  if(a.ino!==s.ino||a.dev!==s.dev||a.size!==data.length||
    a.mtimeMs!==b.mtimeMs||a.ctimeMs!==b.ctimeMs)throw Error('RACE');
  const text=new TextDecoder('utf-8',{fatal:true}).decode(data),x=JSON.parse(text);
  if(text!==JSON.stringify(x)+'\n'||x.schema!=='ikant-k1-technical-attempt/v1'||
   x.kind!=='ATTEMPT_NOT_RECEIPT'||x.owner_invoked!==false||
   x.authority!==0||x.active!==false)throw Error('HOST_FALSE_RECEIPT');
  return x;
 }finally{fs.closeSync(fd);}
}
export function reserveTechnicalAttempt({phase,privateRoot:root,sourceHead,nonce}={}){
 if(phase!=='POST_ACCEPT'||!SHA.test(sourceHead||'')||!NONCE.test(nonce||''))
  return stop('PRECONSENT_OR_EPOCH_UNBOUND');
 try{
  const file=path.join(privateRoot(root),'k1-attempt-'+nonce+'.json');
  const item={schema:'ikant-k1-technical-attempt/v1',kind:'ATTEMPT_NOT_RECEIPT',
   source_head:sourceHead,nonce,owner_invoked:false,authority:0,active:false};
  const bytes=Buffer.from(JSON.stringify(item)+'\n');
  const fd=fs.openSync(file,'wx',0o600);
  try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  if(JSON.stringify(reread(file))!==JSON.stringify(item))throw Error('REOPEN_CHANGED');
  return Object.freeze({ok:true,kind:'TECHNICAL_ATTEMPT_RESERVED',file,
   sha256:digest(bytes),authority:0,owner_invoked:false,
   original_receipt_attested:false,provider_attested:false,active:false,
   edge:'HOST_ATTEMPT_ONLY_ORIGINAL_CAUSALITY_UNKNOWN'});
 }catch{return stop('ATTEMPT_HELD_OR_WRITE_UNKNOWN_NO_REPLAY');}
}
export function reopenTechnicalAttempt({phase,privateRoot:root,sourceHead,nonce}={}){
 if(phase!=='POST_ACCEPT'||!SHA.test(sourceHead||'')||!NONCE.test(nonce||''))
  return stop('TECHNICAL_REOPEN_INPUT');
 try{
  const r=reread(path.join(privateRoot(root),'k1-attempt-'+nonce+'.json'));
  if(r.source_head!==sourceHead||r.nonce!==nonce)return stop('ATTEMPT_EPOCH_MISMATCH');
  return Object.freeze({ok:true,kind:'HOST_ATTEMPT_REOPENED_NOT_RECEIPT',
    authority:0,owner_invoked:false,original_receipt_attested:false,active:false});
 }catch{return stop('ATTEMPT_READBACK_UNKNOWN');}
}
/** Read immutable Git objects, not caller's self-consistent SHA. Not proof of remote provider origin. */
export function verifyLocalGitOriginals({phase,repoRoot,sourceHead,sourceTree}={}){
 if(phase!=='POST_ACCEPT'||!SHA.test(sourceHead||'')||!SHA.test(sourceTree||''))
  return stop('SOURCE_LOCK_REQUIRED');
 try{
  const root=fs.realpathSync(repoRoot),s=fs.lstatSync(repoRoot);
  if(root!==path.resolve(repoRoot)||!s.isDirectory()||s.isSymbolicLink())return stop('REPO_UNSAFE');
  const git=(...a)=>execFileSync('git',a,{cwd:root,timeout:10000,maxBuffer:1024*1024});
  if(git('rev-parse','--verify','HEAD^{commit}').toString().trim()!==sourceHead)
   return stop('STOP_SOURCE_LOCK_STALE');
  if(git('rev-parse',sourceHead+'^{tree}').toString().trim()!==sourceTree)
   return stop('TREE_PIN_MISMATCH');
  if(K1_ORIGINAL_PATHS.length!==10||new Set(K1_ORIGINAL_PATHS).size!==10)
   return stop('ORIGINAL_PATH_SET_INVALID');
  let count=0;
  for(const p of K1_ORIGINAL_PATHS){
   if(!/^[A-Za-z0-9._/-]+$/u.test(p)||p.split('/').includes('..'))
    return stop('SOURCE_PATH_UNSAFE');
   const m=git('ls-tree',sourceHead,'--',p).toString().trim()
    .match(/^100644 blob ([a-f0-9]{40})\t([^\n]+)$/u);
   if(!m||m[2]!==p)return stop('GIT_PATH_MISSING:'+p);
   if(blob(git('show',sourceHead+':'+p))!==m[1])return stop('GIT_OBJECT_MISMATCH:'+p);
   count++;
  }
  return Object.freeze({ok:true,kind:'LOCAL_GIT_OBJECTS_ONLY',verified_original_count:count,
   authority:0,owner_invoked:false,original_receipt_attested:false,
   source_origin_attested:false,provider_attested:false,active:false,
   edge:'REMOTE_GITHUB_CONNECTOR_ORIGIN_NOT_ATTESTED'});
 }catch{return stop('GIT_LOCAL_READBACK_UNKNOWN');}
}
/** ORIGINAL transit projection, not new C72 issuer, not proof of native human event. */
export function verifyOriginalC72Projection({phase,directory,sourceHead,accepted,introduction}={}){
 if(phase!=='POST_ACCEPT'||!SHA.test(sourceHead||''))return stop('C72_PROOF_PHASE_INVALID');
 const r=reopenC72Accepted({directory,sourceHead});
 if(r.ok!==true)return stop('ORIGINAL_C72_RECEIPT_NOT_REOPENED');
 if(JSON.stringify(r.accepted)!==JSON.stringify(accepted)||
    JSON.stringify(r.introduction)!==JSON.stringify(introduction))
  return stop('FAKE_C72_CLAIM_REJECTED');
 return Object.freeze({ok:true,kind:'ORIGINAL_TRANSIT_MATCH_NOT_ISSUER_PROOF',
  authority:0,owner_invoked:false,original_receipt_attested:false,active:false,
  edge:'C72_OWNER_CAUSALITY_REQUIRES_ORIGINAL_CALL_WITNESS'});
}
/** Original renderer checks a private WeakSet, unlike a hash-only caller. */
export function verifyOriginalOwnerVoice({phase,frame,claimedA}={}){
 if(phase!=='EDU_OWNER_TURN'||typeof claimedA!=='string')return stop('VOICE_PHASE_INVALID');
 try{
  renderOneShell(frame);
  if(frame.voice_origin!=='HOST_BOUND_LOCAL'||frame.slots.A!==claimedA)
   return stop('OWNER_VOICE_NOT_BOUND');
  return Object.freeze({ok:true,kind:'ORIGINAL_OWNER_FRAME_ONLY',authority:0,active:false,
   owner_invoked:false,provider_attested:false,edge:'PROVIDER_DELIVERY_NOT_ATTESTED'});
 }catch{return stop('FAKE_C135_VOICE_REJECTED_BY_ORIGINAL_GATE');}
}
export function decideEvidenceMutation(mask){
 if(!Number.isInteger(mask)||mask<0||mask>=2**20)return stop('MUTANT_INVALID');
 for(let i=0;i<ATTACKS.length;i++)if(mask&(1<<i))
  return stop('MISSING_PROOF:'+ATTACKS[i]);
 return Object.freeze({ok:true,kind:'MODEL_PREOWNER_ONLY',authority:0,active:false,
   original_receipt_attested:false,provider_attested:false,owner_invoked:false,
   edge:'ORIGINAL_FIELD_PROOFS_STILL_REQUIRED'});
}
