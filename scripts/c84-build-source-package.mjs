import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createC81LocalGitProof} from './c81-create-git-proof.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const strictDir=x=>typeof x==='string'&&path.isAbsolute(x)&&fs.statSync(x).isDirectory();
export function buildC84SourcePackage({capsuleDir,outputPath}={}){
 if(!strictDir(capsuleDir)||typeof outputPath!=='string'||!path.isAbsolute(outputPath))
  throw Error('C84_ABSOLUTE_PATHS_REQUIRED');
 const root=fs.realpathSync(capsuleDir);
 const manifestFile=path.join(root,'c77-manifest.json');
 const manifestBytes=fs.readFileSync(manifestFile);
 if(manifestBytes.length>100000)throw Error('C84_MANIFEST_LIMIT');
 const manifest=JSON.parse(manifestBytes);
 const proof=createC81LocalGitProof({manifestPath:manifestFile});
 if(proof.verification.status!=='C81_GIT_REACHABILITY_VERIFIED')
  throw Error('C84_REAL_SOURCE_PROOF_REQUIRED');
 if(!Array.isArray(manifest.files)||manifest.files.length<20||manifest.files.length>50)
  throw Error('C84_MANIFEST_FILE_COUNT');
 const files=manifest.files.map(f=>{
  const resolved=path.resolve(root,f.path);
  if(!resolved.startsWith(root+path.sep)||fs.realpathSync(resolved)!==resolved)
   throw Error('C84_SOURCE_PATH_ESCAPE');
  const bytes=fs.readFileSync(resolved);
  if(bytes.length!==f.bytes||sha(bytes)!==f.sha256)
   throw Error('C84_PACKAGE_BYTE_DRIFT:'+f.path);
  return {path:f.path,contentBase64:bytes.toString('base64')};
 });
 const payload={schema:'ikant-le-c84-single-source-package/v1',
  sourceHead:manifest.source_head,
  expectedManifestSha256:sha(manifestBytes),
  manifestBase64:manifestBytes.toString('base64'),
  sourceProof:{commitBase64:proof.proof.commitBase64,
   treeObjects:proof.proof.treeObjects},
  files,active:false,source_origin_attested:false,
  native_chat_delivery_attested:false,authority:0};
 const bytes=Buffer.from(JSON.stringify(payload)+'\n','utf8');
 if(bytes.length>6_000_000)throw Error('C84_PACKAGE_TOO_LARGE');
 fs.writeFileSync(outputPath,bytes,{flag:'wx',mode:0o600});
 if(!fs.readFileSync(outputPath).equals(bytes))throw Error('C84_PACKAGE_READBACK');
 return {schema:'ikant-le-c84-package-build-receipt/v1',
  status:'C84_PACKAGE_WRITTEN_REOPENED_NOT_HOST_DELIVERED',
  source_head:manifest.source_head,manifest_sha256:sha(manifestBytes),
  package_sha256:sha(bytes),package_bytes:bytes.length,files:files.length,
  package_path:outputPath,write_reopen_verified:true,
  source_reachability:proof.verification.status,
  native_chat_delivery_attested:false,source_origin_attested:false,
  active:false,authority:0};
}
if(process.argv[1]&&process.argv[1].endsWith('/c84-build-source-package.mjs')){
 let receipt;
 try{
  const args=process.argv.slice(2);
  if(args.length!==4||args[0]!=='--capsule'||args[2]!=='--output')
   throw Error('C84_USE_CAPSULE_OUTPUT');
  receipt=buildC84SourcePackage({capsuleDir:args[1],outputPath:args[3]});
 }catch(e){receipt={status:'C84_PACKAGE_STOP',first_unclosed_edge:String(e?.message||e).slice(0,120),active:false,authority:0};process.exitCode=2;}
 process.stdout.write(JSON.stringify(receipt)+'\n');
}
