/** Original-only Host cache-to-stager adapter. Strictly POST_ACCEPT / POST_EDU.
 * Not an owner, no new source protocol, no consent, no native provider hook.
 * Original E16/C72 and original Project loader remain the only consumers.
 */
import {createHash} from 'node:crypto';
import {initializeRelay,putRelayBlob,verifyRelay,validateRelayManifest} from './project-c72-verified-staging.mjs';
import {reopenBootstrapCache,storeBootstrapCache,reconcileC72Original,
 materializeD123WithOriginalLoader} from './project-bootstrap-d123.mjs';
const H40=/^[a-f0-9]{40}$/u;
const FILES=Object.freeze(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
 'host/project-c72-postaccept-reentry.mjs']);
const hash=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const stop=edge=>Object.freeze({ok:false,edge,authority:0,active:false,original_owner_invoked:false,
 native_provider_attested:false,voice:'NO_VOICE'});
function h(x){return typeof x==='string'&&H40.test(x);}
function head(x){return typeof x==='string'?x:x?.object?.sha||x?.sha;}
/** Pre-owner effect: actual pinned byte read → original D1 reopen/cache → original C72 stager.
 * Never calls original admission, never automatically replays after any uncertain effect.
 */
export async function preparePEC72Stage(q={},port={}){
 if(q.humanMessage!=='I ACCEPT'||q.freshHumanTurn!==true||q.ownerOutcome!=='NOT_INVOKED')
  return stop('PE_EXACT_ACCEPT_AND_UNATTEMPTED_OWNER_REQUIRED');
 if(!h(q.sourceHead)||!h(q.sourceTree)||q.liveHead!==q.sourceHead||
 typeof port.readMain!=='function'||typeof port.readPinned!=='function'||
 typeof port.readCommit!=='function'||typeof port.readTree!=='function')
  return stop('PE_SOURCE_OR_CARRIER_NOT_BOUND');
 const manifest={schema:'ikant-host-c72-verified-staging/v1',source_head:q.sourceHead,
  priorTurnEvidence:q.priorTurnEvidence,expectedBlobShas:q.expectedBlobShas,
  stageDirectory:q.stageDirectory};
 if(validateRelayManifest(manifest))return stop('PE_ORIGINAL_STAGER_MANIFEST_INVALID');
 let files,tree,commit;
 try{
  if(head(await port.readMain())!==q.sourceHead)return stop('STOP_SOURCE_LOCK_STALE');
  [commit,tree]=await Promise.all([port.readCommit(q.sourceHead),port.readTree(q.sourceTree)]);
  const commitTree=commit?.tree?.sha||commit?.tree?.object?.sha;
  if(commitTree!==q.sourceTree||tree?.sha!==q.sourceTree||tree?.truncated!==false||!Array.isArray(tree.tree))
   return stop('PE_SOURCE_TREE_NOT_INDEPENDENTLY_READ');
  const seen=new Map();for(const e of tree.tree){if(seen.has(e.path))return stop('PE_SOURCE_TREE_DUPLICATE');seen.set(e.path,e);}
  for(const p of FILES){const e=seen.get(p);
   if(e?.type!=='blob'||!h(e.sha)||e.sha!==q.expectedBlobShas[p])return stop('PE_ORIGINAL_PATH_BLOB_DRIFT');}
  files=[];let fetched=0,reused=0,bytesFetched=0;
  for(const p of FILES){
   const entry={path:p,sha:q.expectedBlobShas[p]};
   const cached=reopenBootstrapCache({cacheRoot:q.cacheRoot,head:q.sourceHead,tree:q.sourceTree,
    liveHead:q.liveHead,entry});
   let bytes;
   if(cached.status==='HIT_REOPENED'){bytes=cached.bytes;reused++;}
   else{
    bytes=await port.readPinned(p,q.sourceHead);
    if(!Buffer.isBuffer(bytes)||hash(bytes)!==entry.sha)return stop('PE_PINNED_SOURCE_MISMATCH:'+p);
    fetched++;bytesFetched+=bytes.length;
    // Cache is a transport optimization; record is never a C72 receipt.
    storeBootstrapCache({cacheRoot:q.cacheRoot,head:q.sourceHead,tree:q.sourceTree,liveHead:q.liveHead,
     entry,bytes});
   }
   if(!Buffer.isBuffer(bytes)||hash(bytes)!==entry.sha)return stop('PE_CACHED_SOURCE_MISMATCH:'+p);
   files.push({path:p,bytes});
  }
  if(head(await port.readMain())!==q.sourceHead)return stop('STOP_SOURCE_LOCK_STALE');
  // Physical source operation starts only after all 8 pinned bytes are verified.
  initializeRelay(manifest);
  for(const f of files)putRelayBlob({schema:'ikant-host-c72-verified-put/v1',
   stageDirectory:q.stageDirectory,path:f.path,contentBase64:f.bytes.toString('base64')});
  const verified=verifyRelay({schema:'ikant-host-c72-verified-verify/v1',stageDirectory:q.stageDirectory});
  if(verified.ok!==true||verified.verified_count!==FILES.length)return stop('PE_ORIGINAL_8_OF_8_NOT_REOPENED');
  if(head(await port.readMain())!==q.sourceHead)return stop('STOP_SOURCE_LOCK_STALE');
  return Object.freeze({ok:true,phase:'ORIGINAL_C72_STAGE_READY_NOT_ADMITTED',
   source_head:q.sourceHead,source_tree:q.sourceTree,stageDirectory:q.stageDirectory,
   source_files:FILES.length,original_stager_readback:true,reused,fetched,bytesFetched,
   owner_next:'ORIGINAL_E16_COLDSEED_ONLY_WITH_TRANSIT_SEED_ATTEMPT_FENCE',
   original_owner_invoked:false,authority:0,active:false,native_provider_attested:false});
 }catch(e){
  // The Host MUST retain partially materialized private files after uncertain writes.
  return stop('PE_PREOWNER_STAGE_OR_CACHE_UNKNOWN_NO_REPLAY:'+String(e.message||'UNKNOWN'));
 }
}
/** After independent original C72 EDU selection, reuse D1 bytes and the original
 * 191-object Project loader; never manufacture selection or original C135.
 */
export async function preparePEPostEdu(q={},port={}){
 if(!h(q.sourceHead)||!h(q.sourceTree)||q.liveHead!==q.sourceHead||
 typeof port.readMain!=='function'||typeof port.readPinned!=='function')
  return stop('PE_EDU_SOURCE_NOT_BOUND');
 let a;
 try{a=await reconcileC72Original({directory:q.transitDirectory,head:q.sourceHead,
  tree:q.sourceTree,liveHead:q.liveHead});}
 catch{return stop('PE_ORIGINAL_EDU_RECEIPT_NOT_REOPENED');}
 if(a.status!=='EDU_ORIGINAL_READBACK_ONLY')return stop(a.edge||'PE_EDU_NOT_ORIGINALLY_SELECTED');
 try{
  const result=await materializeD123WithOriginalLoader({
   cacheRoot:q.cacheRoot,head:q.sourceHead,tree:q.sourceTree,liveHead:q.liveHead,
   treeEntries:q.treeEntries,entries:q.entries,manifestPaths:q.manifestPaths,
   fetchPinned:async (path,request)=>port.readPinned(path,request.head),
   readMain:async()=>head(await port.readMain()),destination:q.destination});
  return Object.freeze({...result,original_edu_selection_reopened:true,
   original_owner_invoked:false,native_provider_attested:false,active:false,authority:0});
 }catch(e){return stop('PE_ORIGINAL_LOADER_UNKNOWN_NO_REPLAY:'+String(e.message||'UNKNOWN'));}
}
