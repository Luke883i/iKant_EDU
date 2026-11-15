/** P1 explicitly versioned HOST study overlay. Never patch originals or C134's
 * immutable overlay. Caller must stage verified C134 in an isolated fixture first.
 * Neither source overlay nor its hash implies runtime installation or human consent.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {qualifyC134Source} from './c134-source-epoch.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const originalPath='host/c114-ontology-language-policy.mjs';
// Pin exact reviewed overlay; string-presence checks are not an integrity boundary.
const EXPECTED_OVERLAY_SHA256='18e925bb51ffad40946fce491eb7432879b53c0bf91f3e6465f31ab9102503a0';
const EXPECTED_OVERLAY_GIT_BLOB='988da5ae52552edef57c104d7896eb28bc7b3066';
const overlayPath=path.join(root,'tests/fixtures/epochs/p1-composite-epoch/overlays',originalPath);
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const stop=edge=>({ok:false,first_edge:edge,authority:0,native_provider_attested:false,active:false});
/** Read-only qualification against published C134 overlay, explicit limited delta. */
export function qualifyP1CompositeOverlay(){
 const parent=qualifyC134Source();
 if(!parent.ok)return stop('P1_C134_SOURCE_UNQUALIFIED');
 const member=parent.members.find(m=>m.path===originalPath);
 if(!member)return stop('P1_C134_PIN_MISSING');
 const b=fs.readFileSync(overlayPath),base=fs.readFileSync(path.join(root,'tests/fixtures/epochs/c134-epoch/overlays',originalPath));
 if(gitBlob(base)!==member.next_git_blob_sha1||sha(base)!==member.next_sha256)
  return stop('P1_C134_OVERLAY_DRIFT');
 if(sha(b)!==EXPECTED_OVERLAY_SHA256||gitBlob(b)!==EXPECTED_OVERLAY_GIT_BLOB)
  return stop('P1_UNREVIEWED_OVERLAY_BYTES');
 return Object.freeze({ok:true,source_sha256:sha(b),source_git_blob_sha1:gitBlob(b),
  parent_c134_epoch:parent.composite_epoch_id,base_c134_git_blob_sha1:member.next_git_blob_sha1,
  staged:false,authority:0,native_provider_attested:false,active:false});
}
/** One isolated physical overwrite allowed. Check state first, then verify reopened bytes. */
export function stageP1CompositeOverlay({isolatedRoot}={}){
 const proof=qualifyP1CompositeOverlay();if(!proof.ok)return proof;
 try{
  if(typeof isolatedRoot!=='string'||!path.isAbsolute(isolatedRoot)||
     fs.realpathSync(isolatedRoot)!==isolatedRoot||isolatedRoot===root||
     !fs.existsSync(path.join(isolatedRoot,'.c134-isolated-fixture')))
    return stop('P1_ISOLATED_C134_STAGE_REQUIRED');
  const dst=path.join(isolatedRoot,originalPath),st=fs.lstatSync(dst);
  if(!st.isFile()||st.isSymbolicLink()||
     fs.realpathSync(path.dirname(dst))!==path.dirname(dst)||
     gitBlob(fs.readFileSync(dst))!==proof.base_c134_git_blob_sha1)
    return stop('P1_PARENT_C134_READBACK_MISMATCH');
  const content=fs.readFileSync(overlayPath),tmp=dst+'.p1-'+process.pid;
  fs.writeFileSync(tmp,content,{flag:'wx',mode:0o600});
  try{fs.renameSync(tmp,dst)}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp)}
  if(sha(fs.readFileSync(dst))!==proof.source_sha256)return stop('P1_POSTWRITE_REOPEN_UNKNOWN');
  return Object.freeze({...proof,ok:true,staged:true,independent_reopen:true});
 }catch{return stop('P1_STAGE_IO_OR_UNKNOWN_WRITE');}
}
