/** D1-D3 non-authoritative Host source carrier. No consent, C72/C135/C87 owner,
 * new writer, native event or provider delivery. Original loaders/receipts only. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const H40=/^[a-f0-9]{40}$/u;
const C72=Object.freeze(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
 'host/project-c72-postaccept-reentry.mjs','host/project-c72-receipt-transit.mjs',
 'host/project-c72-coldstart-seed.mjs']);
const RECORD='ikant-host-d1-verified-cache/v1';
const sha256=b=>createHash('sha256').update(b).digest('hex');
const gitBlob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function stop(edge){throw Error(edge);}
function checkLock(head,tree,liveHead){if(!H40.test(head||'')||!H40.test(tree||''))stop('D123_SOURCE_LOCK_INVALID');if(head!==liveHead)stop('STOP_SOURCE_LOCK_STALE');}
function checkPath(p){if(typeof p!=='string'||p.length>400||!p.length||path.posix.isAbsolute(p)||
  p.includes('\\')||p.split('/').some(x=>!x||x==='.'||x==='..')||!/^[A-Za-z0-9._/-]+$/u.test(p))stop('D123_PATH_INVALID');}
function checkRoot(p){if(typeof p!=='string'||!path.isAbsolute(p)||path.resolve(p)!==p)stop('D123_PRIVATE_ROOT_INVALID');
 const s=fs.lstatSync(p);if(!s.isDirectory()||s.isSymbolicLink()||(s.mode&0o077)||fs.realpathSync(p)!==p||
 (process.getuid&&s.uid!==process.getuid()))stop('D123_PRIVATE_ROOT_UNSAFE');return p;}
function reopenPrivate(p,max=5*1024*1024){const st=fs.lstatSync(p);
 if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||(st.mode&0o077)||st.size<1||st.size>max||
  (process.getuid&&st.uid!==process.getuid()))stop('D123_PRIVATE_FILE_UNSAFE');
 const fd=fs.openSync(p,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));try{
  const a=fs.fstatSync(fd),b=fs.readFileSync(fd),c=fs.fstatSync(fd);
  if(a.dev!==st.dev||a.ino!==st.ino||a.size!==b.length||a.ctimeMs!==c.ctimeMs||a.mtimeMs!==c.mtimeMs)stop('D123_PRIVATE_READ_RACE');return b;
 }finally{fs.closeSync(fd);}}
function entry(e){if(!e||typeof e!=='object')stop('D123_ENTRY_INVALID');checkPath(e.path);
 if(!H40.test(e.sha||''))stop('D123_ENTRY_SHA_INVALID');return e;}
function cacheLocation(root,head,tree,e){checkRoot(root);entry(e);return path.join(root,sha256(Buffer.from([head,tree,e.path,e.sha].join('\0')))+'.json');}
export function reopenBootstrapCache({cacheRoot,head,tree,liveHead,entry:e}={}){
 checkLock(head,tree,liveHead);const file=cacheLocation(cacheRoot,head,tree,e);
 if(!fs.existsSync(file))return Object.freeze({status:'MISS',authority:0,active:false});
 const b=reopenPrivate(file);let r;try{r=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));}catch{stop('D1_RECORD_INVALID');}
 if(Object.keys(r).sort().join('|')!=='content|head|path|schema|sha|tree'||r.schema!==RECORD||
 r.head!==head||r.tree!==tree||r.path!==e.path||r.sha!==e.sha||JSON.stringify(r)+'\n'!==b.toString('utf8')||
 typeof r.content!=='string'||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(r.content))stop('D1_RECORD_BINDING_INVALID');
 const value=Buffer.from(r.content,'base64');if(!value.length||value.toString('base64')!==r.content||gitBlob(value)!==e.sha)stop('D1_CACHED_BLOB_INVALID');
 return Object.freeze({status:'HIT_REOPENED',bytes:value,sha:e.sha,authority:0,active:false,original_owner_invoked:false});
}
export function storeBootstrapCache({cacheRoot,head,tree,liveHead,entry:e,bytes}={}){
 checkLock(head,tree,liveHead);if(!Buffer.isBuffer(bytes)||!bytes.length||gitBlob(bytes)!==entry(e).sha)stop('D1_SOURCE_BLOB_INVALID');
 const existing=reopenBootstrapCache({cacheRoot,head,tree,liveHead,entry:e});
 if(existing.status==='HIT_REOPENED'){if(!existing.bytes.equals(bytes))stop('D1_CONFLICTING_EXISTING');return Object.freeze({status:'REUSED',written:0,authority:0,active:false});}
 const loc=cacheLocation(cacheRoot,head,tree,e),r={schema:RECORD,head,tree,path:e.path,sha:e.sha,content:bytes.toString('base64')};
 const encoded=Buffer.from(JSON.stringify(r)+'\n');let fd;
 try{fd=fs.openSync(loc,'wx',0o600);fs.writeFileSync(fd,encoded);fs.fsyncSync(fd);}
 finally{if(fd!==undefined)fs.closeSync(fd);}
 const after=reopenBootstrapCache({cacheRoot,head,tree,liveHead,entry:e});
 if(after.status!=='HIT_REOPENED'||!after.bytes.equals(bytes))stop('D1_CACHE_READBACK_FAILED');
 return Object.freeze({status:'STORED_REOPENED',written:bytes.length,authority:0,active:false});
}
const TRANSIT=Object.freeze({acceptAttempt:'c72-original-accept-attempt.json',accept:'c72-original-accepted.json',
 modeAttempt:'c72-original-mode-attempt.json',mode:'c72-original-selected.json'});
/** D2 never manufactures or replays an original owner event; only original reader imports. */
export async function reconcileC72Original({directory,head,tree,liveHead}={}){
 checkLock(head,tree,liveHead);checkRoot(directory);
 const snapshot=()=>Object.fromEntries(Object.entries(TRANSIT).map(([k,n])=>{
  const f=path.join(directory,n);return [k,fs.existsSync(f)?sha256(reopenPrivate(f,25000)):null];}));
 const before=snapshot();let stage='PREOWNER_ONLY',edge='NONE';
 if(before.accept&&!before.acceptAttempt)stop('D2_ACCEPT_FENCE_MISSING');
 if(before.modeAttempt&&!before.accept)stop('D2_MODE_BEFORE_ACCEPT');
 if(before.mode&&!before.modeAttempt)stop('D2_MODE_FENCE_MISSING');
 if(before.acceptAttempt&&!before.accept){stage='RECONCILE_NO_REPLAY';edge='D2_ACCEPT_OUTCOME_UNKNOWN';}
 else if(before.accept){
  const original=await import('../host/project-c72-receipt-transit.mjs');
  const acc=original.reopenC72Accepted({directory,sourceHead:head});
  if(acc.ok!==true){stage='RECONCILE_NO_REPLAY';edge='D2_ORIGINAL_ACCEPT_REOPEN_INVALID';}
  else if(before.modeAttempt&&!before.mode){stage='RECONCILE_NO_REPLAY';edge='D2_MODE_OUTCOME_UNKNOWN';}
  else if(before.mode){const sel=original.reopenC72Transit({directory,sourceHead:head});
   if(sel.ok===true){stage='EDU_ORIGINAL_READBACK_ONLY';edge='NONE';}
   else {stage='RECONCILE_NO_REPLAY';edge='D2_ORIGINAL_EDU_REOPEN_INVALID';}
  }else stage='ACCEPT_ORIGINAL_READBACK_ONLY';
 }
 if(JSON.stringify(snapshot())!==JSON.stringify(before))stop('D2_TRANSIT_CHANGED_DURING_READ');
 return Object.freeze({status:stage,edge,source_head:head,observed_hashes:before,
  owner_invoked:false,new_receipt_issued:false,native_event_attested:false,authority:0,active:false,
  next:stage==='PREOWNER_ONLY'?'ORIGINAL_PREFLIGHT_ONLY':stage==='RECONCILE_NO_REPLAY'?'STOP_NO_OWNER_REPLAY':'AWAIT_ORIGINAL_NEXT_HUMAN_GATE'});
}
/** D3: fetch only manifest + misses, then invoke the ORIGINAL verified loader.
 * No shadow receipt/loader. TREE and bytes are verified by original loader.
 * Caller MUST bind an actual GitHub HEAD reader; callback fixture != provider proof. */
export async function materializeD123WithOriginalLoader({cacheRoot,head,tree,liveHead,
  treeEntries,entries,manifestPaths,fetchPinned,readMain,destination}={}){
 checkLock(head,tree,liveHead);checkRoot(cacheRoot);
 if(typeof fetchPinned!=='function'||typeof readMain!=='function'||!Array.isArray(treeEntries)||
 !Array.isArray(entries)||!Array.isArray(manifestPaths)||entries.length!==190||manifestPaths.length!==190||
 new Set(manifestPaths).size!==190||entries.some((e,i)=>e.path!==manifestPaths[i])||
 C72.some(p=>!manifestPaths.includes(p)))stop('D3_ORIGINAL_MANIFEST_SET_INVALID');
 if(typeof destination!=='string'||!path.isAbsolute(destination)||path.resolve(destination)!==destination||
 fs.existsSync(destination))stop('D3_DESTINATION_NOT_FRESH');checkRoot(path.dirname(destination));
 if(await readMain()!==head)stop('STOP_SOURCE_LOCK_STALE');
 const treeMap=new Map(treeEntries.filter(x=>x.type==='blob').map(x=>[x.path,x]));
 if(treeMap.size<191||entries.some(e=>!treeMap.has(e.path)||treeMap.get(e.path).sha!==e.sha))stop('D3_TREE_BINDING_INVALID');
 const manifestName='contracts/project-session-source.json',manifestEntry=treeMap.get(manifestName);
 if(!manifestEntry||!H40.test(manifestEntry.sha||''))stop('D3_MANIFEST_NOT_IN_TREE');
 const bytes=new Map();let transferred=0,count=0,reused=0;
 for(const e of entries){entry(e);let b;const cached=reopenBootstrapCache({cacheRoot,head,tree,liveHead,entry:e});
  if(cached.status==='HIT_REOPENED'){b=cached.bytes;reused++;}
  else{b=await fetchPinned(e.path,{head,tree,blob_sha1:e.sha});count++;if(!Buffer.isBuffer(b))stop('D3_FETCH_NONBYTES');transferred+=b.length;}
  if(!b.length||gitBlob(b)!==e.sha)stop('D3_PINNED_BLOB_INVALID:'+e.path);bytes.set(e.path,b);
 }
 const m=await fetchPinned(manifestName,{head,tree,blob_sha1:manifestEntry.sha});
 if(!Buffer.isBuffer(m)||gitBlob(m)!==manifestEntry.sha)stop('D3_MANIFEST_BLOB_INVALID');transferred+=m.length;count++;
 let obj;try{obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(m));}catch{stop('D3_MANIFEST_INVALID');}
 if(obj.schema!=='ikant-le-project-session-source/v1'||JSON.stringify(obj.paths)!==JSON.stringify(manifestPaths))stop('D3_MANIFEST_CONTENT_DRIFT');
 bytes.set(manifestName,m);
 if(await readMain()!==head)stop('STOP_SOURCE_LOCK_STALE');
 const original=await import('./project-repo-loader.mjs');
 const plan={source_head:head,source_tree:tree,live_head:head,truncated:false,tree:treeEntries,
  files:[...bytes].map(([p,b])=>({path:p,encoding:'base64',content:b.toString('base64')}))};
 // Original verifier MUST run before any write. Original materializer may leave partial
 // staging on uncertain write; preserve it for read-only reconciliation, never replay.
 original.verifyRepositoryPlan(plan,{head,tree});
 const receipt=original.materializeRepositoryPlan(plan,{head,tree,destination});
 const reopened=original.verifyLocalProjectSource(destination,{head,tree});
 if(reopened.files.length!==191||receipt.files.length!==191)stop('D3_ORIGINAL_LOADER_REOPEN_MISMATCH');
 if(await readMain()!==head)stop('STOP_SOURCE_LOCK_STALE_AFTER_SOURCE_WRITE');
 return Object.freeze({status:'ORIGINAL_LOADER_SOURCE_REOPENED',source_head:head,source_tree:tree,
  total_original_loader_files:191,manifest_paths:190,reused_files:reused,
  fetched_files:count,fetched_bytes:transferred,original_loader_invoked:true,
  original_owner_invoked:false,original_c72_receipt_issued:false,native_provider_attested:false,authority:0,active:false});
}
