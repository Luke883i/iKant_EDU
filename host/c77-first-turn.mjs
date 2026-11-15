import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const H64=/^[0-9a-f]{64}$/;
function deny(edge,detail){
 return {schema:'ikant-le-c77-experimental-turn-result/v1',status:'C77_STOP',
  first_unclosed_edge:edge,detail:String(detail||'').slice(0,200),
  active:false,canonical_runtime:false,source_origin_attested:false,
  native_event_attested:false,persistent:false,native_delivery_attested:false,
  owner_receipt_issued:false,authority:0};
}
function verify(expected){
 if(!H64.test(String(expected||'')))throw Error('EXPECTED_MANIFEST_SHA256_REQUIRED');
 const bytes=fs.readFileSync(path.join(ROOT,'c77-manifest.json'));
 if(digest(bytes)!==expected)throw Error('BUNDLE_MANIFEST_DIGEST_MISMATCH');
 const m=JSON.parse(bytes);
 if(m.schema!=='ikant-le-c77-standalone-capsule/v1'||m.mode!=='EXPERIMENTAL'||
    m.authority!==0||m.active!==false||m.source_origin_attested!==false||
    !/^[0-9a-f]{40}$/.test(m.source_head)||m.cx_anchor_count!==70||
    !Array.isArray(m.files)||m.files.length<20)throw Error('BUNDLE_MANIFEST_INVALID');
 const names=new Set();
 for(const f of m.files){
  if(typeof f.path!=='string'||f.path.includes('..')||
    !/^(README\.md|(?:host|src|contracts|assets\/brand)\/[a-zA-Z0-9_.\/-]+)$/.test(f.path)||
    names.has(f.path)||!H64.test(f.sha256)||!Number.isInteger(f.bytes))
    throw Error('BUNDLE_FILE_MANIFEST_INVALID');
  names.add(f.path);
  const p=path.resolve(ROOT,f.path);
  if(!p.startsWith(ROOT+path.sep))throw Error('PATH_ESCAPES_BUNDLE');
  const b=fs.readFileSync(p);
  if(b.length!==f.bytes||digest(b)!==f.sha256)
    throw Error('BUNDLE_FILE_DIGEST_MISMATCH:'+f.path);
 }
 for(const p of ['README.md','contracts/c71-cx-execution-census.json',
  'contracts/c77-cx-build-proof.json','assets/brand/ikant-light.svg',
  'assets/brand/ikant-dark.svg','src/c71-experimental-host-draft.mjs',
  'src/c70-experimental-compute-preview.mjs','host/c77-qualified-census.mjs'])
  if(!names.has(p))throw Error('REQUIRED_MODULE_MISSING:'+p);
 const proof=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/c77-cx-build-proof.json')));
 if(proof.source_head!==m.source_head||proof.entries?.length!==70||
  digest(fs.readFileSync(path.join(ROOT,'contracts/c71-cx-execution-census.json')))!==proof.census_sha256)
  throw Error('C77_BUILD_QUALIFICATION_INVALID');
 return {manifest:m,receipt_sha256:expected};
}
export async function executeC77FirstTurn(input,expected){
 const ready=verify(expected);
 if(!input||typeof input!=='object'||Array.isArray(input)||
    input.schema!=='ikant-le-c77-experimental-turn-request/v1'||
    typeof input.human_input!=='string'||!input.human_input.trim()||
    Buffer.byteLength(input.human_input,'utf8')>600||
    (input.host_candidate!==undefined&&typeof input.host_candidate!=='string')||
    Object.keys(input).some(k=>!['schema','selection','human_input','host_candidate'].includes(k)))
  return deny('INPUT_ENVELOPE','C77 requires bounded post-consent input');
 const {validateC72ModeSelection}=await import('./c72-unified-mode-admission.mjs');
 const {issueC69ExperimentalOffer}=await import('./c69-capability-first-preview.mjs');
 const {routeC71HostDraft}=await import('../src/c71-experimental-host-draft.mjs');
 const {buildC73ProjectCapsule}=await import('./c73-project-capsule.mjs');
 if(!validateC72ModeSelection(input.selection,{mode:'EXPERIMENTAL',
   sourceHead:ready.manifest.source_head}))
  return deny('C72_EXPERIMENTAL_SELECTION','No validated common-gate selection');
 const b=fs.readFileSync(path.join(ROOT,'README.md'));
 const message=input.human_input;
 const x={sourceHead:ready.manifest.source_head,
  unifiedSelection:input.selection,
  offer:issueC69ExperimentalOffer({sourceHead:ready.manifest.source_head}),
  sourceObject:{path:'README.md',blob_sha1:gitBlob(b),content_base64:b.toString('base64')},
  messages:[message]};
 if(input.host_candidate!==undefined)x.drafts=[
  {input_sha256:digest(Buffer.from(message,'utf8')),text:input.host_candidate}];
 const c71=routeC71HostDraft(x);
 if(c71.status!=='EXPERIMENTAL_HOST_DRAFT')return deny(c71.first_unclosed_edge,c71.status);
 const c73=buildC73ProjectCapsule({selection:input.selection,experimentalResult:c71});
 if(c73.status!=='C73_EXPERIMENTAL_DRAFT_PRESENTATION_PLAN'||
    c73.surface_b_links.length!==0||c73.active!==false||c71.active!==false)
  return deny('CAPSULE_VALIDATION','C73 did not return bounded draft');
 if(c71.routed_turns[0].input_sha256!==digest(Buffer.from(message,'utf8')))
  return deny('INPUT_OUTPUT_BINDING','Input digest mismatch');
 return {schema:'ikant-le-c77-experimental-turn-result/v1',
  status:'EXPERIMENTAL_COMPUTE_CAPSULE_READY',mode:'EXPERIMENTAL',
  source_head:ready.manifest.source_head,
  bundle_manifest_sha256:ready.receipt_sha256,
  node_major:Number(process.versions.node.split('.')[0]),
  executed_repository_kernel:c71.executed_repository_kernel===true,
  c70_status:c71.c70_status,c71_status:c71.status,c73_status:c73.status,
  input_sha256:c71.routed_turns[0].input_sha256,
  output_sha256:c71.routed_turns[0].output_sha256,
  voice:c73.surface_a_chat.text,voice_source:c71.routed_turns[0].source,
  capsule_plan:c73,source_origin_attested:false,
  repo_source_blob_ids_build_qualified:true,
  externally_authenticated_build:false,
  native_event_attested:false,native_delivery_attested:false,
  persistent:false,active:false,canonical_runtime:false,owner_receipt_issued:false,
  first_unclosed_edge:'HOST_NATIVE_MESSAGE_ROUTING_AND_SOURCE_ORIGIN',
  authority:0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const idx=process.argv.indexOf('--expected-sha256');
 try{
  if(idx<0||!process.argv[idx+1])throw Error('EXPECTED_MANIFEST_SHA256_REQUIRED');
  const data=JSON.parse(fs.readFileSync(0,'utf8'));
  const result=await executeC77FirstTurn(data,process.argv[idx+1]);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.status!=='EXPERIMENTAL_COMPUTE_CAPSULE_READY')process.exitCode=2;
 }catch(e){process.stdout.write(JSON.stringify(deny('CAPSULE_EXECUTION',e.message))+'\n');process.exitCode=2;}
}
