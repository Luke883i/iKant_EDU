import crypto from 'node:crypto';

const H40=/^[0-9a-f]{40}$/;
const H64=/^[0-9a-f]{64}$/;
const MAX_COMMIT=200000,MAX_TREE=500000,MAX_TREES=50;
const sha1Git=(type,body)=>crypto.createHash('sha1')
 .update(Buffer.from(type+' '+body.length+'\0')).update(body).digest('hex');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const result=(status,edge,extras={})=>({
 schema:'ikant-le-c81-source-reachability/v1',status,
 first_unclosed_edge:edge,...extras,authority:0,active:false,
 origin_independently_attested:false,native_chat_delivery_attested:false,
 build_derivation_independently_attested:false,canonical_runtime:false
});
function base64(s,max){
 if(typeof s!=='string'||s.length===0||s.length%4!==0||
    s.length>Math.ceil(max/3)*4+4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))
  throw Error('C81_BASE64_INVALID');
 const b=Buffer.from(s,'base64');
 if(b.length>max||b.toString('base64')!==s)throw Error('C81_BASE64_NONCANONICAL');
 return b;
}
function cleanPath(p){
 return typeof p==='string'&&p.length>0&&p.length<180&&
 !p.startsWith('/')&&!p.includes('\\')&&!p.includes('\0')&&
 p.split('/').every(s=>s.length>0&&s!=='.'&&s!=='..'&&/^[a-zA-Z0-9_.-]+$/.test(s));
}
function entries(raw){
 const found=new Map();
 let i=0;
 while(i<raw.length){
  const space=raw.indexOf(32,i),nullAt=raw.indexOf(0,i);
  if(space<=i||space>=nullAt||nullAt<0||nullAt+21>raw.length)
   throw Error('C81_GIT_TREE_MALFORMED');
  const mode=raw.subarray(i,space).toString('ascii');
  const name=raw.subarray(space+1,nullAt).toString('utf8');
  if(!['40000','100644','100755'].includes(mode)||
     !cleanPath(name)||name.includes('/')||found.has(name))
   throw Error('C81_UNSAFE_GIT_TREE_ENTRY');
  const object=raw.subarray(nullAt+1,nullAt+21).toString('hex');
  found.set(name,{mode,object});
  i=nullAt+21;
 }
 if(i!==raw.length)throw Error('C81_GIT_TREE_TRAILING_BYTES');
 return found;
}
function commitRoot(raw){
 const text=raw.toString('utf8');
 const first=text.slice(0,text.indexOf('\n'));
 if(!/^tree [0-9a-f]{40}$/.test(first)||
    !text.includes('\n\n')||!text.includes('\nauthor '))
  throw Error('C81_COMMIT_TREE_INVALID');
 return first.slice(5);
}
function sourceEntries(manifest){
 if(!manifest||manifest.schema!=='ikant-le-c77-standalone-capsule/v1'||
    manifest.mode!=='EXPERIMENTAL'||manifest.authority!==0||
    manifest.active!==false||manifest.source_origin_attested!==false||
    manifest.cx_anchor_count!==70||!Array.isArray(manifest.files)||
    manifest.files.length<20||manifest.files.length>50)
  throw Error('C81_C77_MANIFEST_INVALID');
 const seen=new Set(),out=[];
 for(const f of manifest.files){
  if(!f||!cleanPath(f.path)||seen.has(f.path)||!H64.test(String(f.sha256))||
     !Number.isInteger(f.bytes)||f.bytes<=0||f.bytes>1000000||
     typeof f.generated_derivative!=='boolean')throw Error('C81_C77_FILE_INVALID');
  seen.add(f.path);
  if(f.original_source_blob_sha1===null){
   if(f.path!=='contracts/c77-cx-build-proof.json'||!f.generated_derivative)
    throw Error('C81_NON_SOURCE_BLOB_UNQUALIFIED');
  }else{
   if(!H40.test(String(f.original_source_blob_sha1)))
    throw Error('C81_SOURCE_BLOB_FORMAT');
   out.push({path:f.path,sha:f.original_source_blob_sha1});
  }
 }
 for(const p of ['host/c77-first-turn.mjs','src/c70-experimental-compute-preview.mjs',
   'src/c71-experimental-host-draft.mjs','contracts/c71-cx-execution-census.json']){
  if(!seen.has(p))throw Error('C81_REQUIRED_C77_SOURCE_MISSING');
 }
 return out;
}
/**
 * Proof of Git SHA-1 object reachability from a caller-frozen commit.
 * Does not authenticate the GitHub API/ref response, C77 builder derivation,
 * or native ChatGPT execution. Use only after C72 EXPERIMENTAL consent.
 */
export function verifyC81SourceReachability({
 expectedSourceHead,expectedManifestSha256,
 manifestBase64,commitBase64,treeObjects
}={}){
 try{
  if(!H40.test(String(expectedSourceHead))||!H64.test(String(expectedManifestSha256)))
   return result('C81_STOP','PINNED_SOURCE_OR_MANIFEST_REQUIRED');
  const manifestBytes=base64(manifestBase64,120000);
  if(sha256(manifestBytes)!==expectedManifestSha256)
   return result('C81_STOP','C77_MANIFEST_HASH_MISMATCH');
  const manifest=JSON.parse(manifestBytes.toString('utf8'));
  if(manifest.source_head!==expectedSourceHead)
   return result('C81_STOP','SOURCE_HEAD_MISMATCH');
  const wanted=sourceEntries(manifest);
  const commit=base64(commitBase64,MAX_COMMIT);
  if(sha1Git('commit',commit)!==expectedSourceHead)
   return result('C81_STOP','GIT_COMMIT_HASH_MISMATCH');
  const root=commitRoot(commit);
  if(!Array.isArray(treeObjects)||treeObjects.length>MAX_TREES||
      !treeObjects.length)return result('C81_STOP','TREE_OBJECT_SET_INVALID');
  const objects=new Map();
  for(const item of treeObjects){
   if(!item||Object.keys(item).sort().join(',')!=='content_base64,sha1'||
       !H40.test(String(item.sha1))||objects.has(item.sha1))
    return result('C81_STOP','TREE_OBJECT_IDENTITY_INVALID');
   const bytes=base64(item.content_base64,MAX_TREE);
   if(sha1Git('tree',bytes)!==item.sha1)
    return result('C81_STOP','TREE_OBJECT_HASH_MISMATCH');
   objects.set(item.sha1,entries(bytes));
  }
  const visited=new Set();
  for(const file of wanted){
   const parts=file.path.split('/');
   let node=root;
   for(let i=0;i<parts.length;i++){
    const t=objects.get(node);
    if(!t)return result('C81_STOP','MISSING_REACHABLE_TREE_OBJECT',{missing_sha1:node});
    visited.add(node);
    const entry=t.get(parts[i]);
    if(!entry)return result('C81_STOP','PATH_NOT_IN_COMMIT',{missing_path:file.path});
    if(i===parts.length-1){
     if(!['100644','100755'].includes(entry.mode)||entry.object!==file.sha)
      return result('C81_STOP','SOURCE_BLOB_UNREACHABLE',{missing_path:file.path});
    }else{
     if(entry.mode!=='40000')return result('C81_STOP','GIT_PATH_TYPE_MISMATCH');
     node=entry.object;
    }
   }
  }
  if(visited.size!==objects.size)
   return result('C81_STOP','UNUSED_UNQUALIFIED_TREE_OBJECTS');
  return result('C81_GIT_REACHABILITY_VERIFIED','HOST_PINNED_GITHUB_REF_ORIGIN',{
    expected_source_head:expectedSourceHead,
    manifest_sha256:expectedManifestSha256,
    reachable_original_git_blobs:wanted.length,
    unique_tree_objects:visited.size,
    git_object_hashes_matched:true,git_paths_reachable:true,
    trust_scope:'GIT_SHA1_MERKLE_REACHABILITY_ONLY_NOT_NATIVE_GITHUB_PROVENANCE'
  });
 }catch(e){
  return result('C81_STOP',/C81_/.test(String(e?.message))?String(e.message):'C81_MALFORMED_PROOF');
 }
}
