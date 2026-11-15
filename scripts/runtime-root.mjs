import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlobSha1=b=>{const x=Buffer.isBuffer(b)?b:Buffer.from(b);return crypto.createHash('sha1').update(Buffer.from(`blob ${x.length}\0`)).update(x).digest('hex')};
const canon=d=>JSON.stringify({schema:d.schema,source_head_binding:d.source_head_binding,member_count:d.member_count,source_bytes:d.source_bytes,loader:d.loader,shards:d.shards,members:d.members});
function build(){
 const bootPath=path.join(ROOT,'BOOTSTRAP.json'),boot=JSON.parse(fs.readFileSync(bootPath,'utf8')),current=boot.post_accept_fastboot.runtime_root;
 const loaderBytes=fs.readFileSync(path.join(ROOT,current.loader.path)),shards=[],rendered=[],memberByPath=new Map();
 for(const spec of [...current.shards].sort((a,b)=>a.index-b.index)){
  const shardPath=path.join(ROOT,spec.path),doc=JSON.parse(fs.readFileSync(shardPath,'utf8'));
  if(doc.schema!=='ikant-le-runtime-root-shard/v1'||doc.index!==spec.index||!Array.isArray(doc.members)||doc.members.length<1)throw new Error('invalid shard structure:'+spec.path);
  const seen=new Set(),rows=doc.members.map(row=>{if(seen.has(row.path))throw new Error('duplicate member:'+row.path);seen.add(row.path);const bytes=fs.readFileSync(path.join(ROOT,row.path));return{path:row.path,content:bytes.toString('utf8')}});
  const out=Buffer.from(JSON.stringify({schema:doc.schema,index:doc.index,members:rows})+'\n');rendered.push({path:spec.path,bytes:out});
  shards.push({index:spec.index,path:spec.path,member_count:rows.length,source_bytes:out.length,blob_sha1:gitBlobSha1(out)});
  for(const row of rows){const bytes=Buffer.from(row.content,'utf8');memberByPath.set(row.path,{path:row.path,blob_sha1:gitBlobSha1(bytes),bytes:bytes.length,shard:spec.index});}
 }
 if(memberByPath.size!==current.members.length)throw new Error('runtime member cardinality drift');const members=current.members.map(m=>{const x=memberByPath.get(m.path);if(!x||x.shard!==m.shard)throw new Error('runtime member ownership drift:'+m.path);return x});const descriptor={schema:current.schema,source_head_binding:current.source_head_binding,member_count:members.length,source_bytes:members.reduce((n,x)=>n+x.bytes,0),loader:{path:current.loader.path,blob_sha1:gitBlobSha1(loaderBytes)},shards,members};
 descriptor.runtime_root_sha256=sha256(Buffer.from(canon(descriptor)));return{boot,descriptor,rendered};
}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function preKernelBinding(boot,descriptor,loaderBytes){
 const k=boot.post_accept_fastboot?.pre_runtime_kernel;
 if(k?.reuses_runtime_root_loader!==true)return{applicable:false,match:true};
 return{applicable:true,match:k.path===descriptor.loader.path&&k.blob_sha1===descriptor.loader.blob_sha1&&k.bytes===loaderBytes.length};
}
function syncPreKernel(boot,descriptor,loaderBytes){
 const k=boot.post_accept_fastboot?.pre_runtime_kernel;
 if(k?.reuses_runtime_root_loader===true){k.path=descriptor.loader.path;k.blob_sha1=descriptor.loader.blob_sha1;k.bytes=loaderBytes.length;}
}
const mode=process.argv[2]||'verify';if(!['verify','regen'].includes(mode)){console.error('usage: node scripts/runtime-root.mjs [verify|regen]');process.exit(2)}
try{
 const x=build(),loaderBytes=fs.readFileSync(path.join(ROOT,x.descriptor.loader.path));
 if(mode==='verify'){
  const current=x.boot.post_accept_fastboot.runtime_root,pk=preKernelBinding(x.boot,x.descriptor,loaderBytes),shardMismatch=x.rendered.filter(s=>!fs.readFileSync(path.join(ROOT,s.path)).equals(s.bytes)).map(s=>s.path);
  if(shardMismatch.length||!equal(current,x.descriptor)||!pk.match){console.error(JSON.stringify({status:'FAIL',shard_mismatch:shardMismatch,descriptor_match:equal(current,x.descriptor),pre_runtime_kernel_binding_match:pk.match,expected_runtime_root_sha256:x.descriptor.runtime_root_sha256,current_runtime_root_sha256:current.runtime_root_sha256}));process.exit(1)}
  console.log(JSON.stringify({status:'PASS',member_count:x.descriptor.member_count,source_bytes:x.descriptor.source_bytes,runtime_root_sha256:x.descriptor.runtime_root_sha256}));
 }else{
  for(const s of x.rendered)fs.writeFileSync(path.join(ROOT,s.path),s.bytes);
  x.boot.post_accept_fastboot.runtime_root=x.descriptor;syncPreKernel(x.boot,x.descriptor,loaderBytes);fs.writeFileSync(path.join(ROOT,'BOOTSTRAP.json'),JSON.stringify(x.boot,null,2)+'\n');
  const y=build(),yLoader=fs.readFileSync(path.join(ROOT,y.descriptor.loader.path)),ypk=preKernelBinding(y.boot,y.descriptor,yLoader);if(!equal(y.boot.post_accept_fastboot.runtime_root,y.descriptor)||!ypk.match||y.rendered.some(s=>!fs.readFileSync(path.join(ROOT,s.path)).equals(s.bytes)))throw new Error('post-regeneration verification failed');
  console.log(JSON.stringify({status:'REGENERATED',member_count:y.descriptor.member_count,source_bytes:y.descriptor.source_bytes,runtime_root_sha256:y.descriptor.runtime_root_sha256}));
 }
}catch(e){console.error(String(e?.stack||e));process.exit(1)}
