/** C134 source evolution, not a Git commit or a native HOST hook. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const H=b=>crypto.createHash('sha256').update(b).digest('hex');
const G=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const sorted=x=>Array.isArray(x)?x.map(sorted):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sorted(x[k])])):x;
export function qualifyC134Source({root=ROOT}={}){
 try{
  const m=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/epochs/c134-epoch/manifest.json'),'utf8'));
  if(m.schema!=='ikant-c134-versioned-cognitive-overlay/v1'||m.authority!==0||
     m.parent_main_commit!=='016fe816099cf66e7a5931e27c586e3fad7fa9eb'||
     m.source_kind!=='EXPERIMENTAL_COMPOSITE_NOT_GIT_COMMIT'||
     m.historic_c107_c124_pins_preserved!==true||m.canonical_active!==false||
     m.native_hook_attested!==false||m.general_llm_uplift_attested!==false||
     m.overlays?.length!==4)return {ok:false,edge:'C134_MANIFEST_INVALID'};
  const material=Object.fromEntries(Object.entries(m).filter(([k])=>k!=='composite_epoch_id'));
  const epoch=H(Buffer.from(JSON.stringify(sorted(material)))).slice(0,40);
  if(epoch!==m.composite_epoch_id)return {ok:false,edge:'C134_EPOCH_ID_DRIFT'};
  const seen=new Set();
  for(const o of m.overlays){
   if(!/^(?:host|src)\/[a-z0-9-]+\.mjs$/.test(o.path)||seen.has(o.path))
    return {ok:false,edge:'C134_PATH_OR_DUPLICATE'};
   seen.add(o.path);
   const file=path.join(root,'tests/fixtures/epochs/c134-epoch/overlays',o.path),st=fs.lstatSync(file);
   if(st.isSymbolicLink()||!st.isFile()||
      fs.realpathSync(path.dirname(file))!==path.dirname(file))
    return {ok:false,edge:'C134_OVERLAY_PATH_UNSAFE'};
   const b=fs.readFileSync(file);
   if(b.length!==o.bytes||G(b)!==o.next_git_blob_sha1||H(b)!==o.next_sha256||
      !/^[a-f0-9]{40}$/.test(o.original_git_blob_sha1))
    return {ok:false,edge:'C134_OVERLAY_BLOB_MISMATCH'};
  }
  for(const p of ['src/c83-semantic-router.mjs','host/c114-ontology-language-policy.mjs',
                   'host/c107-experimental-turn.mjs','host/edu-c70-method-v7.mjs'])
   if(!seen.has(p))return {ok:false,edge:'C134_REQUIRED_SOURCE_MISSING'};
  return {ok:true,composite_epoch_id:epoch,members:m.overlays,
   source_kind:m.source_kind,git_commit_attested:false,active:false,
   model_quality_uplift_attested:false};
 }catch{return {ok:false,edge:'C134_SOURCE_NOT_READABLE'}}
}
export function stageC134Source({root=ROOT,isolatedRoot}={}){
 const q=qualifyC134Source({root});if(!q.ok)return q;
 try{
  if(typeof isolatedRoot!=='string'||!path.isAbsolute(isolatedRoot)||
     fs.realpathSync(isolatedRoot)!==isolatedRoot||isolatedRoot===root||
     !fs.statSync(isolatedRoot).isDirectory()||
     !fs.existsSync(path.join(isolatedRoot,'.c134-isolated-fixture')))
    return {ok:false,edge:'C134_ISOLATED_STAGE_REQUIRED'};
  // Check ALL four original blobs before any staging side effects.
  for(const m of q.members){
   const target=path.join(isolatedRoot,m.path),dir=path.dirname(target);
   if(fs.realpathSync(dir)!==dir||fs.lstatSync(target).isSymbolicLink()||
      !fs.lstatSync(target).isFile()||G(fs.readFileSync(target))!==m.original_git_blob_sha1)
    return {ok:false,edge:'C134_HISTORIC_BASE_MISMATCH'};
  }
  for(const m of q.members){
   const target=path.join(isolatedRoot,m.path),b=fs.readFileSync(path.join(root,'tests/fixtures/epochs/c134-epoch/overlays',m.path));
   const tmp=target+'.c134-'+process.pid;
   fs.writeFileSync(tmp,b,{flag:'wx',mode:0o600});
   try{fs.renameSync(tmp,target)}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp)}
   if(G(fs.readFileSync(target))!==m.next_git_blob_sha1)
    return {ok:false,edge:'C134_REOPEN_MISMATCH'};
  }
  return {ok:true,source_epoch:q.composite_epoch_id,source_kind:q.source_kind,
    staged:4,reopened:true,legacy_cache_unchanged:true,canonical_active:false,
    git_commit_attested:false};
 }catch{return {ok:false,edge:'C134_STAGE_IO_DENIED'}}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const x=qualifyC134Source();console.log(JSON.stringify(x));if(!x.ok)process.exitCode=1;
}
