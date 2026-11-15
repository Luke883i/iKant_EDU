import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {verifyLocalProjectSource} from './project-repo-loader.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const S='ikant-le-c107-minimal-package/v1';
export const C107_FILES=Object.freeze([
 'README.md','TERMS.md','contracts/c72-unified-mode-admission.json',
 'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
 'contracts/cognitive-kernel.json','contracts/host-shell.json','contracts/psyche-kernel.json',
 'contracts/self-world-kernel.json','host/c69-capability-first-preview.mjs','host/c69-edu-v2-preview.mjs',
 'host/c72-unified-mode-admission.mjs','host/c100-cohost-experimental.mjs','host/c100-edu-v2-draft.mjs',
 'host/c87-durable-ledger.mjs','host/c107-experimental-turn.mjs','host/c107-edu-v2-turn.mjs','host/c107-host-language-port.mjs',
 'host/c114-ontology-language-policy.mjs',
 'host/c132-reasoning-candidate.mjs','host/c141-semantic-shadow.mjs','host/c142-semantic-owner-guard.mjs','host/c140-open-edu-turn.mjs','host/c139-epistemic-policy.mjs','host/c139-edu-v2-turn.mjs',
 'host/c143-guarded-nonidentity-policy.mjs','host/c143-edu-v2-turn.mjs',
 'host/c108-host-matrix.mjs','host/c108-stdio-relay.mjs',
 'host/c92-live-provider.mjs','scripts/c108-live-turn.mjs',
 'contracts/c108-machine-matrix.json',
 'src/c70-experimental-compute-preview.mjs','src/c70-edu-v2-compute-preview.mjs','src/c124-channel-bridge.mjs','src/cognition-core.mjs',
 'src/c82-experimental-answer.mjs','src/psyche.mjs','src/state.mjs',
 'src/self-world-state.mjs','src/runtime-dispatch.mjs','src/contract.mjs',
 'src/cognition-surface.mjs','src/c83-semantic-router.mjs',
 'src/self-world-core.mjs','src/semantic-morphogenesis.mjs','src/self-world.mjs',
 'scripts/c107-turn-cli.mjs','scripts/c107-console.mjs',
 'scripts/c107-model-stdio.mjs',
 'contracts/c109-chat-shell.json','host/c109-chat-shell.mjs',
 'host/c109-frame-policy.mjs','scripts/c109-chat-gateway.mjs',
 'host/c110-experimental-lattice.mjs','contracts/c110-experimental-lattice.json',
 'host/c111-host-edge.mjs','scripts/c111-host-edge-cli.mjs'
]);
const stop=e=>({schema:S,status:'C107_PACKAGE_STOP',first_unclosed_edge:e,active:false,native_delivery_attested:false});
const safe=p=>typeof p==='string'&&/^(?:README\.md|TERMS\.md|(?:host|src|scripts|contracts)\/[a-zA-Z0-9_.\/-]+)$/.test(p)&&p.split('/').every(v=>v&&v!=='.'&&v!=='..');
export function buildC107Package({root,expectedHead,sourceTree=null}={}){
 try{
  if(!path.isAbsolute(root)||!/^[a-f0-9]{40}$/.test(expectedHead||''))return stop('ABSOLUTE_ROOT_AND_PINNED_HEAD');
  const api=sourceTree!==null?verifyLocalProjectSource(root,{head:expectedHead,tree:sourceTree}):null;
  const head=api?api.source_head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  if(head!==expectedHead)return stop('SOURCE_EPOCH_DRIFT');
  const files=[];
  for(const p of C107_FILES){
   if(!safe(p))return stop('INVALID_PATH');
   const b=fs.readFileSync(path.join(root,p));
   const git=api?api.files.find(e=>e.path===p)?.git_blob_sha1:execFileSync('git',['rev-parse','HEAD:'+p],{cwd:root,encoding:'utf8'}).trim();
   if(gitBlob(b)!==git)return stop('WORKTREE_VERSUS_GIT_BLOB_DRIFT');
   files.push({path:p,bytes:b.length,sha256:sha(b),git_blob_sha1:git,content_base64:b.toString('base64')});
  }
  const payload=Buffer.from(JSON.stringify({schema:S,source_head:head,files,active:false,authority:0})+'\n');
  return {schema:S,status:'C107_PACKAGE_BUILT_NOT_TRANSPORTED',payload,
   sha256:sha(payload),file_count:files.length,source_bytes:files.reduce((n,x)=>n+x.bytes,0),
   transport_bytes:payload.length,source_origin_attested:false,active:false};
 }catch{return stop('ORIGINAL_GIT_SOURCE_GRAPH_MISSING');}
}
export function stageC107Package({payload,expectedSha256,expectedHead,privateParent}={}){
 let out=null;
 try{
  if(!Buffer.isBuffer(payload)||sha(payload)!==expectedSha256||!path.isAbsolute(privateParent))
   return stop('PACKAGE_BYTE_DIGEST_OR_PARENT');
  const m=JSON.parse(payload.toString('utf8'));
  if(m.schema!==S||m.source_head!==expectedHead||m.active!==false||m.authority!==0||
   m.files.length!==C107_FILES.length||new Set(m.files.map(x=>x.path)).size!==C107_FILES.length||
   C107_FILES.some(x=>!m.files.some(y=>y.path===x)))return stop('PACKAGE_MANIFEST_DRIFT');
  out=fs.mkdtempSync(path.join(privateParent,'ikant-c107-'));fs.chmodSync(out,0o700);
  for(const entry of m.files){
   if(!safe(entry.path)||typeof entry.content_base64!=='string')throw Error('PATH');
   const data=Buffer.from(entry.content_base64,'base64');
   if(data.toString('base64')!==entry.content_base64||data.length!==entry.bytes||
    sha(data)!==entry.sha256||gitBlob(data)!==entry.git_blob_sha1)throw Error('INTEGRITY');
   const target=path.resolve(out,entry.path);if(!target.startsWith(out+path.sep))throw Error('ESCAPE');
   fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});
   const fd=fs.openSync(target,'wx',0o600);
   try{fs.writeSync(fd,data);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
   if(!fs.readFileSync(target).equals(data))throw Error('REOPEN');
  }
  return {schema:S,status:'C107_PACKAGE_REOPENED_NOT_EXECUTED',install_root:out,
   source_head:expectedHead,source_files:m.files.length,
   source_bytes:m.files.reduce((n,x)=>n+x.bytes,0),
   source_origin_attested:false,native_delivery_attested:false,active:false};
 }catch{if(out)fs.rmSync(out,{recursive:true,force:true});return stop('REOPEN_OR_MANIFEST_INTEGRITY');}
}
