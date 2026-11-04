/** H1 bound Host port. Authority zero; not a provider hook or a C72 issuer. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const H1_SCHEMA='ikant-project-edu-h1-bound-port/v1';
export const H1_FILES=Object.freeze([
 'README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json',
 'host/c72-public-mode-admission.mjs','host/project-c72-postaccept-reentry.mjs'
]);
export const H1_TRANSIT='host/project-c72-receipt-transit.mjs';
export const H1_SEED='host/project-c72-coldstart-seed.mjs';
const SHA=/^[a-f0-9]{40}$/u;
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const digest=s=>createHash('sha256').update(s).digest('hex');
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const stop=(edge,extra={})=>Object.freeze({ok:false,kind:'STOP',edge,authority:0,original_owner_invoked:false,
 native_event_attested:false,native_delivery_attested:false,source_origin_attested:false,...extra});
const FIRST=H1_FILES.slice(0,5);

/** Prior human witness is Host-observed, never authenticated as native. */
export function validateH1Gate(q){
 if(!plain(q)||q.schema!==H1_SCHEMA||q.humanMessage!=='I ACCEPT'||q.freshHumanTurn!==true)
  return 'H1_DISTINCT_ACCEPT_REQUIRED';
 if(q.ownerOutcome!=='NOT_INVOKED')return 'H1_OWNER_ATTEMPT_ALREADY_KNOWN_OR_UNKNOWN';
 const w=q.priorTurnEvidence;
 if(!plain(w)||!plain(w.pinned_blob_shas)||!SHA.test(w.source_head||'')||
   w.host_link_displayed!==true||w.distinct_human_message_observed!==true||
   w.terms_link!=='https://github.com/Luke883i/iKant_EDU/blob/'+w.source_head+'/TERMS.md'||
   FIRST.some(p=>!SHA.test(w.pinned_blob_shas[p]||'')))
  return 'H1_FIRST_TURN_WITNESS_INVALID';
 if(!SHA.test(q.sourceHead||'')||q.sourceHead!==w.source_head)return 'STOP_SOURCE_LOCK_STALE';
 return null;
}
function exactBytes(v){
 if(!plain(v)||typeof v.content!=='string'||!SHA.test(v.sha||''))throw Error('H1_SOURCE_RESPONSE_INVALID');
 let b;
 if(v.encoding==='utf-8')b=Buffer.from(v.content,'utf8');
 else if(v.encoding==='base64'){
  const e=v.content.replace(/\s+/gu,'');
  if(!e||e.length%4!==0||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(e))
    throw Error('H1_BASE64_NONCANONICAL');
  b=Buffer.from(e,'base64');
  if(b.toString('base64')!==e)throw Error('H1_BASE64_NONCANONICAL');
 }else throw Error('H1_SOURCE_ENCODING_UNSUPPORTED');
 if(b.length<1||b.length>256000||sha(b)!==v.sha)throw Error('H1_SOURCE_BLOB_SHA_MISMATCH');
 const s=new TextDecoder('utf-8',{fatal:true}).decode(b);
 if(!Buffer.from(s,'utf8').equals(b))throw Error('H1_UTF8_LOSS');
 return b;
}
function privateDir(prefix){
 const p=fs.mkdtempSync(path.join(os.tmpdir(),prefix));fs.chmodSync(p,0o700);return p;
}
function writeReopen(root,p,bytes){
 const file=path.join(root,p);
 fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
 fs.writeFileSync(file,bytes,{flag:'wx',mode:0o600});
 const st=fs.lstatSync(file);
 if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||(st.mode&0o077)!==0||
    !fs.readFileSync(file).equals(bytes)||sha(fs.readFileSync(file))!==sha(bytes))
  throw Error('H1_NODE_PHYSICAL_READBACK_FAILED');
}

/** Actual callback invocation and physical same-process Node readback.
 * The caller supplies a function, NOT a boolean claiming it is OBSERVED.
 * Checksums authenticate consistency only, not callback/GitHub origin.
 */
export async function prepareH1OriginalSources(q,{readMain,readPinned,readCommit,readTree}={}){
 const edge=validateH1Gate(q);if(edge)return stop(edge);
 if([readMain,readPinned,readCommit,readTree].some(fn=>typeof fn!=='function'))return stop('H1_CAPABILITY_NOT_BOUND');
 let stageDirectory=null,transitDirectory=null;
 try{
  const h=await readMain(),head=typeof h==='string'?h:h?.object?.sha;
  if(!SHA.test(head||'')||head!==q.sourceHead)return stop('STOP_SOURCE_LOCK_STALE');
  // Independent Git commit -> TREE -> path -> blob lookup, not the content callback.
  // GitHub API responses must be authenticated by the actual deployment. SHA alone
  // does not prove provider identity. This is a read-only pre-owner preflight.
  const commit=await readCommit({ref:head});
  const treeSha=commit?.tree?.sha;
  if(commit?.sha!==head||!SHA.test(treeSha||''))throw Error('H1_COMMIT_TREE_LINK_INVALID');
  const tree=await readTree({sha:treeSha,recursive:true});
  if(tree?.sha!==treeSha||tree?.truncated!==false||!Array.isArray(tree.tree))
   throw Error('H1_TREE_COMPLETENESS_UNVERIFIED');
  const entryMap=new Map();
  for(const entry of tree.tree){
   if(typeof entry?.path!=='string'||!SHA.test(entry.sha||'')||
      !['blob','tree','commit'].includes(entry.type)||entryMap.has(entry.path))
    throw Error('H1_TREE_ENTRY_UNTRUSTED');
   entryMap.set(entry.path,entry);
  }
  for(const file of [...H1_FILES,H1_TRANSIT,H1_SEED]){
   const entry=entryMap.get(file);
   if(entry?.type!=='blob'||!['100644','100755'].includes(entry.mode))
    throw Error('H1_REQUIRED_PATH_NOT_IN_HEAD_TREE:'+file);
  }
  const got=new Map();let total=0;
  for(const p of [...H1_FILES,H1_TRANSIT,H1_SEED]){
   const answer=await readPinned({path:p,ref:head}),bytes=exactBytes(answer);
   // Reject even a self-consistent SHA/content pair if it belongs to another path.
   if(answer.sha!==entryMap.get(p).sha)throw Error('H1_HEAD_PATH_BLOB_MISMATCH:'+p);
   total+=bytes.length;if(total>750000)throw Error('H1_SOURCE_TOTAL_LIMIT');
   if(FIRST.includes(p)&&answer.sha!==q.priorTurnEvidence.pinned_blob_shas[p])
    throw Error('H1_FIRST_TURN_BLOB_DRIFT');
   got.set(p,{bytes,sha:answer.sha});
  }
  const bootstrap=JSON.parse(got.get('BOOTSTRAP.json').bytes.toString('utf8'));
  const pin=bootstrap?.project_session?.postaccept_original_c72_transit_pin;
  if(pin?.path!==H1_TRANSIT||pin.blob_sha1!==got.get(H1_TRANSIT).sha||
     pin.source!=='FIRST_TURN_BOOTSTRAP_SHA_VERIFIED')
   throw Error('H1_E16_BOOTSTRAP_PIN_MISMATCH');
  stageDirectory=privateDir('ikant-h1-stage-');
  transitDirectory=privateDir('ikant-h1-transit-');
  for(const p of H1_FILES)writeReopen(stageDirectory,p,got.get(p).bytes);
  writeReopen(stageDirectory,H1_TRANSIT,got.get(H1_TRANSIT).bytes);
  return {ok:true,kind:'SOURCE_PREPARED',sourceHead:head,stageDirectory,transitDirectory,
   expectedBlobShas:Object.fromEntries(H1_FILES.map(p=>[p,got.get(p).sha])),
   seedBlobSha1:got.get(H1_SEED).sha,transitBlobSha1:got.get(H1_TRANSIT).sha,
   transitSourcePacket:{path:H1_TRANSIT,contentBase64:got.get(H1_TRANSIT).bytes.toString('base64')},
   verified_file_count:9,authority:0,original_owner_invoked:false,
   source_origin_attested:false,native_event_attested:false,native_delivery_attested:false};
 }catch(e){
  if(stageDirectory)fs.rmSync(stageDirectory,{recursive:true,force:true});
  if(transitDirectory)fs.rmSync(transitDirectory,{recursive:true,force:true});
  return stop(String(e?.message||'H1_SOURCE_ACQUISITION_UNKNOWN'));
 }
}
/** Stable event fence. New random directories per call would permit C72 replay.
 * HumanTurnRef is supplied by a deployed Host and not native-proof by itself.
 */
export function reserveH1HumanEvent({privateRoot,sourceHead,humanTurnRef}={}){
 if(typeof privateRoot!=='string'||!path.isAbsolute(privateRoot)||!SHA.test(sourceHead||'')||
    typeof humanTurnRef!=='string'||!/^[A-Za-z0-9_-]{16,160}$/u.test(humanTurnRef))
  return stop('H1_DURABLE_EVENT_BINDING_REQUIRED');
 try{
  const st=fs.lstatSync(privateRoot);
  if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077)!==0||
     fs.realpathSync(privateRoot)!==privateRoot||
     (process.getuid&&st.uid!==process.getuid()))return stop('H1_PRIVATE_ROOT_INVALID');
  const dir=path.join(privateRoot,'accept-'+digest(sourceHead+'\0'+humanTurnRef));
  fs.mkdirSync(dir,{mode:0o700}); // EEXIST is terminal, no blind retry.
  const record={schema:'ikant-h1-human-event-attempt/v1',source_head:sourceHead,
   human_turn_ref_sha256:digest(humanTurnRef),original_receipt_issued:false,
   native_event_attested:false,authority:0};
  const bytes=Buffer.from(JSON.stringify(record)+'\n','utf8');
  const fd=fs.openSync(path.join(dir,'h1-attempt.json'),'wx',0o600);
  try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  if(!fs.readFileSync(path.join(dir,'h1-attempt.json')).equals(bytes))
   return stop('H1_DURABLE_RESERVATION_READBACK_UNKNOWN');
  return Object.freeze({ok:true,kind:'H1_EVENT_RESERVED',directory:dir,authority:0,
   native_event_attested:false,original_owner_invoked:false});
 }catch{return stop('H1_EVENT_ALREADY_RESERVED_OR_UNKNOWN_NO_REPLAY');}
}

/** Original effect only. No E16 issuer replacement or alternative owner injection. */
function preflightDurableEvent(q,port){
 const root=port?.privateRoot,ref=q?.humanTurnRef;
 if(typeof root!=='string'||!path.isAbsolute(root)||typeof ref!=='string'||
    !/^[A-Za-z0-9_-]{16,160}$/u.test(ref))return stop('H1_DURABLE_EVENT_BINDING_REQUIRED');
 try{
  const st=fs.lstatSync(root);
  if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077)!==0||
     fs.realpathSync(root)!==root||
     (process.getuid&&st.uid!==process.getuid()))return stop('H1_PRIVATE_ROOT_INVALID');
  const name=digest(q.sourceHead+'\0'+ref);
  if(fs.existsSync(path.join(root,'accept-'+name)))
   return stop('H1_EVENT_ALREADY_RESERVED_OR_UNKNOWN_NO_REPLAY');
 }catch{return stop('H1_PRIVATE_ROOT_INVALID');}
 return null;
}
export async function runH1OriginalAdmission(q,port){
 const gate=validateH1Gate(q);if(gate)return stop(gate);
 const preflight=preflightDurableEvent(q,port);if(preflight)return preflight;
 let original,files;
 try{
  ({runC72ProjectE16Ingress:original}=await import('./project-c72-e16-unified-ingress.mjs'));
  ({C72_COLDSTART_FILES:files}=await import('./project-c72-coldstart-seed.mjs'));
 }catch{return stop('H1_ORIGINAL_CLOSURE_NOT_INSTALLED');}
 if(files.length!==H1_FILES.length||H1_FILES.some((p,i)=>p!==files[i]))
  return stop('H1_ORIGINAL_SOURCE_ORDER_DRIFT');
 const prepared=await prepareH1OriginalSources(q,port);
 if(prepared.ok!==true)return prepared;
 try{
  const local=fs.readFileSync(new URL('./project-c72-coldstart-seed.mjs',import.meta.url));
  if(sha(local)!==prepared.seedBlobSha1){
   fs.rmSync(prepared.stageDirectory,{recursive:true,force:true});
   fs.rmSync(prepared.transitDirectory,{recursive:true,force:true});
   return stop('H1_INSTALLED_SEED_MISMATCH');
  }
 }catch{
  fs.rmSync(prepared.stageDirectory,{recursive:true,force:true});
  fs.rmSync(prepared.transitDirectory,{recursive:true,force:true});
  return stop('H1_INSTALLED_SEED_NOT_READABLE');
 }
 const reservation=reserveH1HumanEvent({privateRoot:port?.privateRoot,
  sourceHead:prepared.sourceHead,humanTurnRef:q.humanTurnRef});
 fs.rmSync(prepared.transitDirectory,{recursive:true,force:true});
 if(reservation.ok!==true){
  fs.rmSync(prepared.stageDirectory,{recursive:true,force:true});return reservation;
 }
 const args={schema:'ikant-host-c72-e16-unified-ingress/v1',phase:'POST_ACCEPT',
  projectProfile:'PROJECT_EDU_E15',humanMessage:'I ACCEPT',freshHumanTurn:true,
  ownerOutcome:'NOT_INVOKED',sourceHead:prepared.sourceHead,liveHead:prepared.sourceHead,
  priorTurnEvidence:q.priorTurnEvidence,node:'AVAILABLE',githubApi:'AVAILABLE',
  carriers:{CALLBACKS:'UNKNOWN',NODE_HTTPS:'UNKNOWN',HOST_PACKET:'UNKNOWN',HOST_FILE:'OBSERVED'},
  stageDirectory:prepared.stageDirectory,transitDirectory:reservation.directory,
  transitSourcePacket:prepared.transitSourcePacket,transitBlobSha1:prepared.transitBlobSha1,
  seedBlobSha1:prepared.seedBlobSha1,expectedBlobShas:prepared.expectedBlobShas};
 let result;
 try{result=await original(args);}
 catch{return stop('H1_ORIGINAL_OWNER_OUTCOME_UNKNOWN_NO_RETRY',
  {original_owner_invoked:'UNKNOWN',transitDirectory:reservation.directory});}
 finally{fs.rmSync(prepared.stageDirectory,{recursive:true,force:true});}
 return Object.freeze({...result,transitDirectory:reservation.directory,verified_file_count:9,
  source_origin_attested:false,native_event_attested:false,native_delivery_attested:false});
}
