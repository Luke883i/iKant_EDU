import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import {buildC77Capsule} from '../scripts/c77-build-capsule.mjs';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,
 selectC72Mode} from '../host/c72-unified-mode-admission.mjs';

const ROOT=new URL('../',import.meta.url);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function prepare(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c77-'));
 const receipt=buildC77Capsule({outDir:dir});
 const sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
 const terms=fs.readFileSync(new URL('../TERMS.md',import.meta.url));
 const offer=issueC72TermsOffer({sourceHead,termsDigest:sha(terms)});
 const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const introduction=presentC72Introduction(accepted);
 const selection=selectC72Mode({accepted,orientation:introduction,humanMessage:'EXPERIMENTAL'});
 return {dir,receipt,selection};
}
function execTrial(t,mutate={}){
 const body={schema:'ikant-le-c77-experimental-turn-request/v1',
   selection:t.selection,human_input:'Confronta due scelte e chiarisci i limiti.',...mutate};
 const p=spawnSync(process.execPath,[path.join(t.dir,'host/c77-first-turn.mjs'),
   '--expected-sha256',t.receipt.bundle_manifest_sha256],
   {input:JSON.stringify(body),encoding:'utf8',timeout:30000});
 const text=p.stdout.trim();
 let json;try{json=JSON.parse(text)}catch{throw Error('C77_BAD_JSON:'+text.slice(0,350)+' STDERR:'+p.stderr);}
 return {...p,result:json};
}
test('C77 standalone: build qualifies 70 source anchors but does not ship them',()=>{
 const t=prepare();try{
  assert.equal(t.receipt.qualified_cx_count,70);
  assert.equal(t.receipt.write_reopen_verified,true);
  assert.equal(t.receipt.source_origin_attested,false);
  assert.ok(t.receipt.file_count<40);
  assert.ok(t.receipt.bundle_payload_bytes<600000);
  assert.equal(fs.existsSync(path.join(t.dir,'src/runtime-command.mjs')),false);
  assert.equal(fs.existsSync(path.join(t.dir,'host/c63-canonical-parallel-bridge.mjs')),false);
  assert.equal(fs.existsSync(path.join(t.dir,'contracts/ikant-le.json')),false);
  assert.equal(fs.existsSync(path.join(t.dir,'assets/brand/ikant-light.svg')),true);
  assert.equal(fs.existsSync(path.join(t.dir,'assets/brand/ikant-dark.svg')),true);
  const proof=JSON.parse(fs.readFileSync(path.join(t.dir,'contracts/c77-cx-build-proof.json')));
  assert.equal(proof.entries.length,70);
  assert.equal(proof.origin_attested,false);
 }finally{fs.rmSync(t.dir,{recursive:true,force:true});}
});
test('C77 real isolated Node execution: C69 -> C70 -> C71 -> C73 binds first human turn',()=>{
 const t=prepare();try{
  const z=execTrial(t);
  assert.equal(z.status,0,z.stdout.slice(0,2000)+' '+z.stderr);
  const r=z.result;
  assert.equal(r.status,'EXPERIMENTAL_COMPUTE_CAPSULE_READY');
  assert.equal(r.executed_repository_kernel,true);
  assert.equal(r.c70_status,'EXPERIMENTAL_COMPUTE_PREVIEW');
  assert.equal(r.c71_status,'EXPERIMENTAL_HOST_DRAFT');
  assert.equal(r.c73_status,'C73_EXPERIMENTAL_DRAFT_PRESENTATION_PLAN');
  assert.equal(r.input_sha256,sha(Buffer.from('Confronta due scelte e chiarisci i limiti.')));
  assert.equal(r.voice,r.capsule_plan.surface_a_chat.text);
  assert.ok(r.voice.length>0);
  assert.equal(r.source_origin_attested,false);
  assert.equal(r.externally_authenticated_build,false);
  assert.equal(r.active,false);
  assert.equal(r.native_delivery_attested,false);
  assert.equal(r.persistent,false);
  assert.deepEqual(r.capsule_plan.surface_b_links,[]);
 }finally{fs.rmSync(t.dir,{recursive:true,force:true});}
});
test('C77 tampered executable or removed required module must block before cognitive import',()=>{
 const t=prepare();try{
  const file=path.join(t.dir,'src/cognition-core.mjs');
  fs.appendFileSync(file,'\n// adversarial content mutation\n');
  const x=execTrial(t);
  assert.equal(x.status,2);
  assert.equal(x.result.first_unclosed_edge,'CAPSULE_EXECUTION');
  assert.match(x.result.detail,/BUNDLE_FILE_DIGEST_MISMATCH/);
 }finally{fs.rmSync(t.dir,{recursive:true,force:true});}
});
test('C77 forged mode cannot route; invalid host text cannot become sealed output',()=>{
 const t=prepare();try{
  const a=execTrial(t,{selection:{...t.selection,status:'ACTIVE'}});
  assert.equal(a.status,2);
  assert.equal(a.result.first_unclosed_edge,'C72_EXPERIMENTAL_SELECTION');
  const b=execTrial(t,{host_candidate:'iKant ACTIVE'});
  assert.equal(b.status,2);
  assert.notEqual(b.result.status,'EXPERIMENTAL_COMPUTE_CAPSULE_READY');
  const c=execTrial(t,{human_input:'I ACCEPT'});
  assert.equal(c.status,2);
  const d=execTrial(t,{requestCanonicalRuntime:true});
  assert.equal(d.status,2);
  assert.equal(d.result.first_unclosed_edge,'INPUT_ENVELOPE');
 }finally{fs.rmSync(t.dir,{recursive:true,force:true});}
});
test('C77 mutation grid: 120 deterministic bundle mutations fail closed',()=>{
 const t=prepare();let attempted=0;
 try{
  const manifestPath=path.join(t.dir,'c77-manifest.json');
  const original=fs.readFileSync(manifestPath);
  for(let i=0;i<120;i++){
   const variant=Buffer.from(original);
   variant[20+i%60]=variant[20+i%60]===65?66:65;
   fs.writeFileSync(manifestPath,variant);
   const r=execTrial(t);
   assert.equal(r.status,2,String(i));
   assert.equal(r.result.active,false);
   attempted++;
  }
  assert.equal(attempted,120);
 }finally{fs.rmSync(t.dir,{recursive:true,force:true});}
});
