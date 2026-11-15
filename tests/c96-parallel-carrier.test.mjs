import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
import {firstContactC96Plan,planC96PostAccept,acquireC96PostAccept} from '../host/c96-parallel-carrier.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const zip=fs.readFileSync(path.join(root,'fixtures/c77-historical-head-66f074b3.zip'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const H='66f074b34f34455b3c4188703d83ad71316baa06';
const v=validateC94C77Archive(zip,{sourceHead:H});
if(v.status!=='C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN')throw Error('HISTORICAL_C77_ZIP_BAD');
const selection={selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'};
const props={sourceHead:H,manifest:v.manifest,manifestBase64:v.content.get('c77-manifest.json').toString('base64'),expectedManifestSha256:v.manifest_sha256,selection};
const candidate=(id,readArchive,estimatedMs=2)=>({id,kind:'HOST_GITHUB_ARTIFACT',estimatedMs,readArchive});
test('pre-consent stops after exactly five pinned files, no Cx/runtime reads',()=>{
 const x=firstContactC96Plan('iniziamo');
 assert.equal(x.status,'C96_ONLY_FIVE_PINNED_READS_THEN_TERMS_STOP');
 assert.deepEqual(x.ordered_paths,['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
 assert.equal(x.automatic_runtime_acquisition_allowed,false);
});
test('none of the 70 Cx requires a duplicate download by identifier',()=>{
 const p=planC96PostAccept({...props,carriers:[candidate('ARTIFACT_A',async()=>zip)]});
 assert.equal(p.status,'C96_AUTOMATIC_PLAN_HOST_CAPABILITY_NOT_AUTHENTICATED');
 assert.equal(p.unique_members,34);assert.equal(p.cx_anchors_to_verify,70);
 assert.equal(p.expected_member_sha256.length,34);
});
test('no installed callback -> only explicit manual-last-resort possibility, not auto upload',()=>{
 const p=planC96PostAccept({...props,carriers:[]});
 assert.equal(p.status,'C96_NO_REGISTERED_AUTOMATIC_CARRIER');
 assert.equal(p.manually_selectable_only_after_explicit_user_decision,true);
 assert.equal(p.manual_zip_auto_selected,false);
});
test('reject mode, stale epoch, unsafe carrier identifiers and over-concurrency',()=>{
 for(const q of [
  {...props,selection:{...selection,selected_mode:'CANONICAL'}},
  {...props,sourceHead:'b'.repeat(40)},
  {...props,carriers:[{id:'../../bad',kind:'HOST_GITHUB_ARTIFACT',estimatedMs:1,readArchive:async()=>zip}]},
  {...props,concurrency:50}
 ])assert.equal(planC96PostAccept(q).status,'C96_STOP');
});
test('actual historical C77 ZIP is read only once, all 34 unique bytes reopened',async()=>{
 let reads=0;const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c96-trial-'));
 try{
  const r=await acquireC96PostAccept({...props,carriers:[candidate('ZIP_PRIMARY',async()=>{reads++;return zip})],parentDir:dir});
  assert.equal(r.status,'C96_C77_FILES_REOPENED_C81_STILL_REQUIRED');
  assert.equal(r.unique_members,34);assert.equal(r.cx_anchors_to_verify,70);assert.equal(r.archive_reads_started,1);assert.equal(reads,1);
  assert.equal(r.active,false);assert.equal(r.host_origin_attested,false);
  for(const f of r.files)assert.equal(sha(fs.readFileSync(path.join(r.output_dir,f.path))),f.sha256);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('hedged auto carrier succeeds when one complete provider fails, without manual fallback',async()=>{
 let primary=0,secondary=0;const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c96-hedge-'));
 try{
  const r=await acquireC96PostAccept({...props,parentDir:dir,carriers:[
    candidate('BAD_A',async()=>{primary++;throw Error('UNAVAILABLE')},1),
    candidate('GOOD_B',async()=>{secondary++;return zip},2)]});
  assert.equal(r.status,'C96_C77_FILES_REOPENED_C81_STILL_REQUIRED');assert.equal(primary,1);assert.equal(secondary,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('one missing member prevents publication, cannot escalate to manual by itself',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c96-negative-'));
 try{
  const r=await acquireC96PostAccept({...props,parentDir:dir,carriers:[{id:'BLOB',kind:'HOST_GITHUB_FILE',estimatedMs:1,
   readFile:async ({path:p})=>p===v.manifest.files[0].path?Buffer.from('modified'):v.content.get(p)}]});
  assert.equal(r.status,'C96_STOP');assert.equal(r.first_unclosed_edge,'AUTOMATIC_MEMBER_ACQUISITION_INCOMPLETE');
  assert.equal(r.verified_members,33);assert.equal(r.manual_zip_suggested,false);
  assert.equal(fs.readdirSync(dir).length,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('file-level callbacks really run in parallel and materialize independently',async()=>{
 let active=0,peak=0,reads=0;const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c96-parallel-'));
 try{
  const r=await acquireC96PostAccept({...props,concurrency:5,parentDir:dir,carriers:[{id:'HOSTFILES',kind:'HOST_GITHUB_FILE',estimatedMs:1,
    readFile:async ({path:p})=>{reads++;active++;peak=Math.max(peak,active);await new Promise(ok=>setTimeout(ok,1));active--;return v.content.get(p);}}]});
  assert.equal(r.status,'C96_C77_FILES_REOPENED_C81_STILL_REQUIRED');assert.equal(reads,34);
  assert.ok(peak>1&&peak<=5);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('manifest traversal and duplicated member paths reject before any host reads',()=>{
 for(const mutate of [m=>{m.files[0].path='../escape'},m=>{m.files[1].path=m.files[0].path}]){
  const m=structuredClone(v.manifest);mutate(m);
  assert.equal(planC96PostAccept({...props,manifest:m,carriers:[candidate('ZIP',async()=>zip)]}).status,'C96_STOP');
 }
});

test('the second hedge prefers a different real transport kind over correlated same-kind candidates',()=>{
 const p=planC96PostAccept({...props,carriers:[
  candidate('ZIP_A',async()=>zip,1),candidate('ZIP_B',async()=>zip,2),
  {id:'BLOB_C',kind:'HOST_GITHUB_FILE',estimatedMs:3,readFile:async({path:p})=>v.content.get(p)}]});
 assert.equal(p.status,'C96_AUTOMATIC_PLAN_HOST_CAPABILITY_NOT_AUTHENTICATED');
 assert.deepEqual(p.carrier_ids.slice(0,2),['ZIP_A','BLOB_C']);
});
