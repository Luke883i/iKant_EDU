#!/usr/bin/env node
/** V5-A: HOST engineering check, not C72 admission, owner, provider or installation. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const SOURCE='project/session-chat/PROMPT.txt';
export const ALIAS='project/edu-oneshell/PROMPT_INNESCO.txt';
export const VERSION_TRAILER=v=>'\n\nDISTRIBUTION_VERSION='+v+'; C131_LEGACY_BUNDLE_PROJECTION_ONLY; PROJECT_SOURCE='+SOURCE+'; NOT_INSTALLED; NOT_ORIGINAL_OWNER.\n';
const HASH=x=>crypto.createHash('sha256').update(x).digest('hex');
const bad=edge=>Object.freeze({ok:false,edge,authority:0,active:false,owner_receipt:false});
function own(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;}
/** Machine policy: provenance assertions are graph edges, never narrative slogans. */
export function evaluateEntrypointGraph(x){
 try{
  if(!own(x))return bad('V5A_GRAPH_SHAPE');
  if(x.bootstrap!==SOURCE||x.generator!==SOURCE||x.catalog!==SOURCE)
   return bad('V5A_SOURCES_DISAGREE');
  if(x.c131_member!==ALIAS||x.alias_origin!==SOURCE||x.alias_derivation!=='EXACT_BYTES_PLUS_VERSION_TRAILER')
   return bad('V5A_ALIAS_NOT_DERIVED');
  if(x.first_turn!=='ORIENTATION'||x.accept_turn!=='I ACCEPT'||x.mode_turn!=='EDU'||x.distinct_human_turns!==true)
   return bad('V5A_HUMAN_GATE_DRIFT');
  if(x.original_c72!==true||x.original_c135!==true||x.original_c87!==true||x.original_c125_s03!==true)
   return bad('V5A_OWNER_BYPASS');
  if(x.native_install_claim!==false||x.ci_is_product_receipt!==false||x.release_claim!==false)
   return bad('V5A_EVIDENCE_PROMOTION');
  if(x.owner_file_mutated!==false||x.first_turn_reads_extra!==false||x.external_waiver_bypasses_owner!==false)
   return bad('V5A_FORBIDDEN_SIDE_EFFECT');
  if(x.source_bytes_match!==true||x.alias_bytes_match!==true||x.catalog_path_exists!==true||x.docs_consistent!==true)
   return bad('V5A_MISSING_READBACK');
  return Object.freeze({ok:true,status:'V5A_HOST_GRAPH_CONSISTENT_NOT_PROVIDER_ATTESTED',authority:0,active:false,owner_receipt:false});
 }catch{return bad('V5A_UNSAFE_GRAPH');}
}
export function expectedGraph(){return Object.freeze({bootstrap:SOURCE,generator:SOURCE,catalog:SOURCE,
 c131_member:ALIAS,alias_origin:SOURCE,alias_derivation:'EXACT_BYTES_PLUS_VERSION_TRAILER',
 first_turn:'ORIENTATION',accept_turn:'I ACCEPT',mode_turn:'EDU',distinct_human_turns:true,
 original_c72:true,original_c135:true,original_c87:true,original_c125_s03:true,
 native_install_claim:false,ci_is_product_receipt:false,release_claim:false,
 owner_file_mutated:false,first_turn_reads_extra:false,external_waiver_bypasses_owner:false,
 source_bytes_match:true,alias_bytes_match:true,catalog_path_exists:true,docs_consistent:true});}
export function deriveLegacyAlias(sourceBytes,version){
 if(!Buffer.isBuffer(sourceBytes)||sourceBytes.length===0||sourceBytes.length>8000||
  !/^\d+\.\d+\.\d+-edu\.\d+$/.test(version))throw Error('V5A_ALIAS_INPUT_INVALID');
 const trailer=Buffer.from(VERSION_TRAILER(version),'utf8');
 return Buffer.concat([sourceBytes,trailer]);
}
export function auditRepository(root){
 const r=p=>fs.readFileSync(path.join(root,p));
 const json=p=>JSON.parse(r(p).toString('utf8'));
 const boot=json('BOOTSTRAP.json'),generation=json('contracts/project-prompt-generation.json');
 const catalog=json('release/catalog.json'),pkg=json('package.json');
 const source=r(SOURCE),alias=r(ALIAS);
 const start=r('docs/START_HERE.md').toString('utf8'),readme=r('README.md').toString('utf8');
 const bundle=r('scripts/c131-build-project-bundle.py').toString('utf8');
 const expected=deriveLegacyAlias(source,pkg.version);
 const docs=start.includes('primo messaggio')&&start.includes('I ACCEPT')&&start.includes('EDU')&&
  !start.includes('Sono necessari tre nuovi messaggi distinti: `avvia iKant`')&&
  readme.includes('**Come iniziare EDU:**')&&readme.includes('primo messaggio')&&
  !readme.includes('`avvia iKant` → lettura');
 const graph={...expectedGraph(),bootstrap:boot.project_session?.prompt,
  generator:generation.source_prompt,catalog:catalog.public_entrypoints?.edu_prompt,
  c131_member:bundle.includes("'PROMPT_INNESCO.txt':'project/edu-oneshell/PROMPT_INNESCO.txt'")?ALIAS:null,
  alias_origin:SOURCE,source_bytes_match:source.length>0&&source.length<=8000&&
   source.toString('utf8').includes('PRIMO messaggio umano di nuova chat'),
  alias_bytes_match:alias.equals(expected),catalog_path_exists:fs.statSync(path.join(root,catalog.public_entrypoints.edu_prompt)).isFile(),
  docs_consistent:docs};
 const decision=evaluateEntrypointGraph(graph);
 return Object.freeze({...decision,schema:'ikant-v5a-source-entrypoint-audit/v1',
  source_sha256:HASH(source),alias_sha256:HASH(alias),alias_expected_sha256:HASH(expected),
  source_bytes:source.length,alias_bytes:alias.length,source_path:SOURCE,legacy_bundle_path:ALIAS,
  product_release:'PRODUCT_NO_GO',installed_prompt_equivalence_attested:false,
  ...(decision.ok?{}:{observed:graph})});
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const mode=process.argv[2]||'verify';
 if(!['verify','emit-alias'].includes(mode))throw Error('V5A_MODE_INVALID');
 if(mode==='emit-alias'){
  const buf=deriveLegacyAlias(fs.readFileSync(path.join(root,SOURCE)),JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version);
  process.stdout.write(buf);
 }else{
  const result=auditRepository(root);process.stdout.write(JSON.stringify(result,null,2)+'\n');if(!result.ok)process.exitCode=1;
 }
}
