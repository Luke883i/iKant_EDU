import crypto from 'node:crypto';
import {serializeGitHubTree,gitSha} from './c94-git-api-proof.mjs';
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
const H40=/^[0-9a-f]{40}$/;
const stop=e=>({status:'C94_CX_ANCHOR_STOP',first_unclosed_edge:e,cx_git_reachability_verified:false,
 native_github_ref_origin_attested:false,active:false,authority:0});
/** Independently validates all 70 C77 build-census original blobs are reachable
 * through SHA-1 validated raw Git tree objects from the pinned commit root.
 * C81 still independently verifies its own narrower manifest paths. */
export async function verifyC94CxAnchorReachability({sourceHead,proofBytes,commitBase64,gitApi}={}){
 try{
  if(!H40.test(sourceHead||'')||!Buffer.isBuffer(proofBytes)||typeof gitApi!=='function')return stop('SOURCE_OR_API');
  const proof=JSON.parse(proofBytes.toString('utf8'));
  if(proof.source_head!==sourceHead||proof.entries?.length!==70)return stop('C77_CX_PROOF_FORMAT');
  const commit=Buffer.from(commitBase64||'','base64');
  if(gitSha('commit',commit)!==sourceHead)return stop('SOURCE_RAW_COMMIT_SHA');
  const root=commit.toString('utf8').split('\n')[0].split(' ')[1];
  if(!H40.test(root||''))return stop('ROOT_TREE_MISSING');
  const cache=new Map();let calls=0;
  const get=async sha=>{
   if(cache.has(sha))return cache.get(sha);
   if(++calls>50)throw Error('GIT_TREE_LOOKUP_BUDGET');
   const t=await gitApi(`/git/trees/${sha}`);
   const raw=serializeGitHubTree(t,sha);
   if(gitSha('tree',raw)!==sha)throw Error('TREE_HASH_DRIFT');
   cache.set(sha,t.tree);return t.tree;
  };
  for(let i=0;i<70;i++){
   const q=proof.entries[i];
   if(!q||q.id!==`C${i+1}`||!H40.test(q.git_blob_sha1||'')||
      !/^(?:src|host|scripts|contracts)\/[A-Za-z0-9_.\/-]+$/.test(q.path||'')||
      q.path.split('/').some(z=>!z||z==='.'||z==='..'))return stop('CX_ANCHOR_ID_PATH');
   const parts=q.path.split('/');let tree=root;
   for(let j=0;j<parts.length;j++){
    const entries=await get(tree);const e=entries.find(x=>x.path===parts[j]);
    if(!e)return stop('CX_ANCHOR_NOT_REACHABLE');
    if(j===parts.length-1){if(e.type!=='blob'||e.sha!==q.git_blob_sha1)return stop('CX_ANCHOR_BLOB_CHANGED');}
    else{if(e.type!=='tree')return stop('CX_ANCHOR_DIR_TYPE');tree=e.sha;}
   }
  }
  return {schema:'ikant-le-c94-cx-anchors/v1',status:'C94_CX_70_GIT_ANCHORS_REACHABLE_NOT_GITHUB_NATIVE_ORIGIN',
   source_head:sourceHead,census_sha256:proof.census_sha256,anchored_entries:70,
   unique_verified_git_trees:cache.size,cx_git_reachability_verified:true,
   native_github_ref_origin_attested:false,active:false,authority:0};
 }catch(e){return stop(String(e?.message||e).slice(0,110));}
}
