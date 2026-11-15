import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
const gitBlob=x=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+x.length+'\0'),x])).digest('hex');
const read=p=>fs.readFileSync(path.join(ROOT,p));
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD');
const codePaths=[
 'host/c69-capability-first-preview.mjs','host/c72-unified-mode-admission.mjs',
 'host/c73-project-capsule.mjs','host/c77-qualified-census.mjs','host/c77-first-turn.mjs',
 'src/c70-experimental-compute-preview.mjs','src/c124-channel-bridge.mjs','src/c71-experimental-host-draft.mjs',
 'src/cognition-core.mjs','src/cognition-surface.mjs','src/c82-experimental-answer.mjs',
 'src/c83-semantic-router.mjs','src/contract.mjs',
 'src/deadline-integrity.mjs','src/fastboot-convergence.mjs','src/host-consumption-frame.mjs',
 'src/psyche.mjs','src/runtime-availability.mjs','src/runtime-dispatch.mjs',
 'src/self-world-core.mjs','src/self-world-state.mjs','src/self-world.mjs',
 'src/semantic-morphogenesis.mjs','src/session-shell.mjs','src/state.mjs'
];
const dataPaths=[
 'README.md','contracts/c71-cx-execution-census.json',
 'contracts/c72-unified-mode-admission.json','contracts/cognitive-kernel.json',
 'contracts/host-shell.json','contracts/psyche-kernel.json',
 'contracts/self-world-kernel.json',
 'assets/brand/ikant-light.svg','assets/brand/ikant-dark.svg'
];
const allPaths=new Set([...codePaths,...dataPaths]);
const relative=(source,rel)=>path.posix.normalize(path.posix.join(path.posix.dirname(source),rel));
const importRe=/\b(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g;
function validateSources(){
 for(const p of allPaths){
  if(!/^(?:README\.md|(?:host|src|contracts|assets\/brand)\/[a-zA-Z0-9_.\/-]+)$/.test(p)||p.includes('..'))
   throw Error('INVALID_BUNDLE_PATH:'+p);
  const b=read(p);
  const source=git('rev-parse','HEAD:'+p);
  if(source!==gitBlob(b))throw Error('GIT_CHECKOUT_BLOB_DRIFT:'+p);
 }
 for(const p of codePaths){
  const source=read(p).toString('utf8');
  if(/\brequire\s*\(/.test(source))throw Error('DYNAMIC_MODULE_LOAD_NOT_QUALIFIED:'+p);
  const dynamicPattern=/\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g;
  const dynamic=[...source.matchAll(dynamicPattern)].map(x=>relative(p,x[1]));
  if(p==='host/c77-first-turn.mjs'){
   const expected=['host/c72-unified-mode-admission.mjs','host/c69-capability-first-preview.mjs',
     'src/c71-experimental-host-draft.mjs','host/c73-project-capsule.mjs'];
   if(dynamic.length!==expected.length||dynamic.some((x,i)=>x!==expected[i]))
    throw Error('C77_POST_VERIFICATION_IMPORT_DRIFT');
  }else if(dynamic.length)throw Error('UNDECLARED_DYNAMIC_IMPORT:'+p);
  if(/\bimport\s*\(/.test(source.replace(dynamicPattern,'')))
   throw Error('UNBOUNDED_DYNAMIC_IMPORT:'+p);
  for(const match of source.matchAll(importRe)){
   const dep=relative(p,match[1]);
   if(!allPaths.has(dep))throw Error('UNCLOSED_STATIC_IMPORT:'+p+':'+dep);
  }
 }
}
function qualifiedCxProof(){
 const b=read('contracts/c71-cx-execution-census.json'),c=JSON.parse(b);
 if(c.schema!=='ikant-le-c71-cx-execution-census/v1'||c.entries?.length!==70)
  throw Error('INVALID_CX_CENSUS');
 const entries=c.entries.map((e,i)=>{
  if(e.id!=='C'+(i+1)||!/^((src|host|scripts|contracts)\/)[a-zA-Z0-9_.\/-]+$/.test(e.implementation_anchor)||
     e.implementation_anchor.includes('..')||e.canonical_state_conferred!==false||
     e.anchor_is_execution_receipt!==false)throw Error('INVALID_CX_ANCHOR:'+i);
  const bytes=read(e.implementation_anchor);
  const gitSha=git('rev-parse','HEAD:'+e.implementation_anchor);
  if(gitBlob(bytes)!==gitSha)throw Error('CX_ANCHOR_DRIFT:'+e.id);
  return {id:e.id,path:e.implementation_anchor,git_blob_sha1:gitSha};
 });
 return {schema:'ikant-le-c77-qualified-cx-census/v1',source_head:head,
  census_sha256:sha256(b),origin_attested:false,
  proof_scope:'BUILD_TIME_SOURCE_BLOBS_NOT_HOST_NATIVE_ORIGIN',
  entries,authority:0};
}
function deriveC71(source){
 const exact="!fs.existsSync(new URL('../'+e.implementation_anchor,import.meta.url))||";
 if(source.split(exact).length!==2)throw Error('C71_QUALIFIER_PATTERN_DRIFT');
 return "import {validateC77CensusAnchor} from '../host/c77-qualified-census.mjs';\n"+
  source.replace(exact,"!validateC77CensusAnchor(e,x)||");
}
export function buildC77Capsule({outDir}={}){
 if(typeof outDir!=='string'||!path.isAbsolute(outDir))throw Error('ABSOLUTE_OUTPUT_REQUIRED');
 const target=path.resolve(outDir),rel=path.relative(ROOT,target);
 if(!rel.startsWith('..')&& !path.isAbsolute(rel))throw Error('OUTPUT_INSIDE_SOURCE_FORBIDDEN');
 if(fs.existsSync(target)&&fs.readdirSync(target).length)throw Error('OUTPUT_MUST_BE_EMPTY');
 validateSources();
 const cx=qualifiedCxProof();
 fs.mkdirSync(target,{recursive:true});
 const files=[];
 for(const p of [...codePaths,...dataPaths]){
  const source=read(p);
  const payload=p==='src/c71-experimental-host-draft.mjs'
   ? Buffer.from(deriveC71(source.toString('utf8'))):source;
  const dest=path.join(target,p);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,payload,{flag:'wx',mode:0o600});
  const reRead=fs.readFileSync(dest);
  if(!reRead.equals(payload))throw Error('CAPSULE_WRITE_REOPEN_DRIFT:'+p);
  files.push({path:p,bytes:payload.length,sha256:sha256(payload),
   original_source_blob_sha1:gitBlob(source),
   generated_derivative:p==='src/c71-experimental-host-draft.mjs'});
 }
 const proofPath='contracts/c77-cx-build-proof.json';
 const p=Buffer.from(JSON.stringify(cx,null,2)+'\n');
 fs.writeFileSync(path.join(target,proofPath),p,{flag:'wx',mode:0o600});
 files.push({path:proofPath,bytes:p.length,sha256:sha256(p),original_source_blob_sha1:null,
   generated_derivative:true});
 files.sort((a,b)=>a.path.localeCompare(b.path));
 const manifest={schema:'ikant-le-c77-standalone-capsule/v1',
  source_head:head,manifest_role:'LOCAL_INTEGRITY_NOT_GITHUB_ORIGIN_ATTESTATION',
  mode:'EXPERIMENTAL',authority:0,active:false,canonical_runtime:false,
  persistent:false,native_event_attested:false,owner_receipt_issued:false,
  ci_builder_source:'scripts/c77-build-capsule.mjs',
  input_contract:'ikant-le-c77-experimental-turn-request/v1',
  cx_anchor_count:cx.entries.length,files,source_origin_attested:false};
 const manifestBytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(target,'c77-manifest.json'),manifestBytes,{flag:'wx',mode:0o600});
 const manifestHash=sha256(fs.readFileSync(path.join(target,'c77-manifest.json')));
 return {schema:'ikant-le-c77-build-receipt/v1',head,output_directory:target,
  bundle_manifest_sha256:manifestHash,
  file_count:files.length,bundle_payload_bytes:files.reduce((a,f)=>a+f.bytes,0),
  qualified_cx_count:cx.entries.length,actual_git_blob_checks:files.filter(f=>f.original_source_blob_sha1).length,
  write_reopen_verified:true,source_origin_attested:false,active:false,authority:0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const i=process.argv.indexOf('--out');
 if(i<0||!process.argv[i+1])throw Error('USE --out /absolute/empty/directory');
 const receipt=buildC77Capsule({outDir:process.argv[i+1]});
 process.stdout.write(JSON.stringify(receipt)+'\n');
}
