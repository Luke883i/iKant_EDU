import crypto from 'node:crypto';
const gitSha=(type,body)=>crypto.createHash('sha1').update(Buffer.from(`${type} ${body.length}\0`)).update(body).digest('hex');
const sha256=body=>crypto.createHash('sha256').update(body).digest('hex');
const H40=/^[a-f0-9]{40}$/;
const exactPath=s=>typeof s==='string'&&/^[A-Za-z0-9_.-]+$/.test(s)&&s!=='.'&&s!=='..';
const stop=e=>({schema:'ikant-le-c94-git-api-proof/v1',status:'C94_GIT_STOP',first_unclosed_edge:e,github_native_ref_attested:false,active:false,authority:0});
export {gitSha};
/** Rebuilds the actual raw Git tree from GitHub Git Tree API metadata; validate SHA. */
export function serializeGitHubTree(t,shaExpected){
 if(!t||!Array.isArray(t.tree)||!H40.test(shaExpected||'')||t.truncated===true||t.sha!==shaExpected)throw Error('GIT_TREE_JSON');
 if(t.tree.length>2500)throw Error('GIT_TREE_OVERLIMIT');
 const names=new Set();
 const entries=t.tree.map(e=>{
  if(!e||!exactPath(e.path)||names.has(e.path)||!H40.test(e.sha||'')||
     ![['tree','040000'],['blob','100644'],['blob','100755']].some(([type,mode])=>type===e.type&&mode===e.mode))throw Error('GIT_TREE_ENTRY');
  names.add(e.path);
  return {mode:e.type==='tree'?'40000':e.mode,name:e.path,sha:e.sha,dir:e.type==='tree'};
 });
 entries.sort((a,b)=>Buffer.compare(Buffer.from(a.name+(a.dir?'/':'')),Buffer.from(b.name+(b.dir?'/':''))));
 const raw=Buffer.concat(entries.map(e=>Buffer.concat([Buffer.from(`${e.mode} ${e.name}\0`),Buffer.from(e.sha,'hex')])));
 if(raw.length>500000||gitSha('tree',raw)!==shaExpected)throw Error('GIT_TREE_MERKLE_MISMATCH');
 return raw;
}
/** GitHub API has commit verification.payload and signature. Raw unsigned and
 * signed commits are reconstructed and checked against the actual SHA-1. */
export function serializeGitHubCommit(j,expectedSha){
 if(!j||j.sha!==expectedSha||!H40.test(expectedSha||''))throw Error('GIT_COMMIT_IDENTITY');
 const payload=j.verification?.payload;
 if(typeof payload!=='string'||payload.length>150000||!payload.includes('\n\n')||
   !/^tree [a-f0-9]{40}\n/m.test(payload)||!payload.includes('\nauthor ')||
   !payload.includes('\ncommitter '))throw Error('GIT_COMMIT_PAYLOAD');
 const split=payload.indexOf('\n\n');
 let raw=payload;
 const sig=j.verification?.signature;
 if(sig){
  if(typeof sig!=='string'||sig.length>40000||/\r/.test(sig))throw Error('GIT_COMMIT_SIGNATURE');
  const lines=sig.replace(/\n$/,'').split('\n');
  if(!lines.length||!lines[0].startsWith('-----BEGIN ')||
    !lines.at(-1).startsWith('-----END '))throw Error('GIT_COMMIT_SIGNATURE_FORMAT');
  const header='gpgsig '+lines.join('\n ');
  raw=payload.slice(0,split)+'\n'+header+payload.slice(split);
 }
 const bytes=Buffer.from(raw,'utf8');
 if(gitSha('commit',bytes)!==expectedSha)throw Error('GIT_COMMIT_RECONSTRUCTION_MISMATCH');
 return bytes;
}
/** Caller supplies API GET function bound to an actual GitHub host transport.
 * The result is Git reachability evidence; transport claims stay separate. */
export async function assembleC94GitProof({sourceHead,manifest,manifestBytes,gitApi}={}){
 try{
  if(!H40.test(sourceHead||'')||!manifest||!Buffer.isBuffer(manifestBytes)||
     typeof gitApi!=='function')return stop('GIT_API_CONTRACT');
  const commitObject=await gitApi(`/git/commits/${sourceHead}`);
  const rawCommit=serializeGitHubCommit(commitObject,sourceHead);
  const root=commitObject.tree?.sha;
  if(!H40.test(root||''))return stop('GIT_ROOT_TREE');
  const paths=new Set(['']);
  for(const f of manifest.files){
   if(!f.original_source_blob_sha1)continue;
   const parts=f.path.split('/');
   for(let i=1;i<parts.length;i++)paths.add(parts.slice(0,i).join('/'));
  }
  const objectByPath=new Map([['',root]]),treeMap=new Map(),treeJson=new Map(),pathSorted=[...paths].sort((a,b)=>a.split('/').length-b.split('/').length);
  for(const p of pathSorted){
   const sha=objectByPath.get(p);
   if(!H40.test(sha||''))return stop('MISSING_ANCESTOR_TREE');
   const response=await gitApi(`/git/trees/${sha}`);
   const raw=serializeGitHubTree(response,sha);
   treeMap.set(sha,raw);treeJson.set(sha,response);
   for(const item of response.tree.filter(x=>x.type==='tree')){
    const child=p?p+'/'+item.path:item.path;
    if(paths.has(child))objectByPath.set(child,item.sha);
   }
  }
  for(const f of manifest.files){
   if(!f.original_source_blob_sha1)continue;
   const parts=f.path.split('/'),dirname=parts.slice(0,-1).join('/'),tSha=objectByPath.get(dirname);
   const obj=treeJson.get(tSha);
   if(!obj)return stop('GIT_MISSING_TREE_READBACK');
   const file=obj.tree.find(x=>x.path===parts.at(-1));
   if(!file||file.type!=='blob'||file.sha!==f.original_source_blob_sha1)return stop('GIT_BLOB_NOT_REACHABLE');
  }
  if(treeMap.size>50)return stop('GIT_TREE_PROOF_TOO_LARGE');
  return {schema:'ikant-le-c94-git-api-proof/v1',status:'C94_GIT_RAW_OBJECTS_RECONSTRUCTED_AND_VERIFIED',
   source_head:sourceHead,manifest_sha256:sha256(manifestBytes),
   commitBase64:rawCommit.toString('base64'),
   treeObjects:[...treeMap].map(([sha,raw])=>({sha1:sha,content_base64:raw.toString('base64')})),
   tree_objects:treeMap.size,original_source_blobs:manifest.files.filter(x=>x.original_source_blob_sha1).length,
   github_native_ref_attested:false,host_transport_authenticated_by_git_hash:false,
   c81_verification_still_required:true,authority:0,active:false};
 }catch(e){return stop(String(e?.message||e).slice(0,120));}
}
