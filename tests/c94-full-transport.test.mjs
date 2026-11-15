import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {unpackC94Zip,validateC94C77Archive} from '../host/c94-zip-c77.mjs';
import {buildC94C84AutoPackage} from '../host/c94-auto-artifact-carrier.mjs';
import {gitSha} from '../host/c94-git-api-proof.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const zipPath=process.env.C94_C77_TEST_ZIP||fileURLToPath(new URL('./fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const available=fs.existsSync(zipPath);
function crc32(b){let c=-1;for(const x of b){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^(0xedb88320&-(c&1));}return(c^-1)>>>0;}
function zipStore(files){
 const locals=[],centers=[];let offset=0;
 for(const [name,content]of files){
  const n=Buffer.from(name),raw=Buffer.from(content);
  const l=Buffer.alloc(30);l.writeUInt32LE(0x04034b50,0);l.writeUInt16LE(20,4);
  l.writeUInt16LE(0,6);l.writeUInt16LE(0,8);l.writeUInt32LE(crc32(raw),14);
  l.writeUInt32LE(raw.length,18);l.writeUInt32LE(raw.length,22);l.writeUInt16LE(n.length,26);
  locals.push(l,n,raw);
  const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);
  c.writeUInt32LE(crc32(raw),16);c.writeUInt32LE(raw.length,20);c.writeUInt32LE(raw.length,24);
  c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);
  centers.push(c,n);offset+=l.length+n.length+raw.length;
 }
 const cc=Buffer.concat(centers),last=Buffer.alloc(22);last.writeUInt32LE(0x06054b50,0);
 last.writeUInt16LE(files.size,8);last.writeUInt16LE(files.size,10);
 last.writeUInt32LE(cc.length,12);last.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,cc,last]);
}
function treeFor(node,map){
 const sorted=Object.keys(node).sort((a,b)=>Buffer.compare(Buffer.from(a+(typeof node[a]==='string'?'':'/')),Buffer.from(b+(typeof node[b]==='string'?'':'/'))));
 const entries=sorted.map(name=>{const d=typeof node[name]!=='string',sub=d?treeFor(node[name],map):null;
  return {path:name,mode:d?'040000':'100644',type:d?'tree':'blob',sha:d?sub:node[name]};});
 const raw=Buffer.concat(entries.map(e=>Buffer.concat([Buffer.from(`${e.type==='tree'?'40000':'100644'} ${e.path}\0`),Buffer.from(e.sha,'hex')])));
 const id=gitSha('tree',raw);map.set(id,{sha:id,tree:entries,truncated:false});return id;
}
export function makeSyntheticGitHub(){
 const b=unpackC94Zip(fs.readFileSync(zipPath));const manifest=JSON.parse(b.get('c77-manifest.json').toString('utf8'));
 const sourceFiles=manifest.files.filter(f=>f.original_source_blob_sha1);
 const nodes={};const buildProof=JSON.parse(b.get('contracts/c77-cx-build-proof.json').toString('utf8'));
 const refFiles=[...sourceFiles.map(f=>({path:f.path,sha:f.original_source_blob_sha1})),
  ...buildProof.entries.map(e=>({path:e.path,sha:e.git_blob_sha1}))];
 for(const f of refFiles){let c=nodes;const seg=f.path.split('/');for(const part of seg.slice(0,-1))c=c[part]??=(Object.create(null));
  if(c[seg.at(-1)]&&c[seg.at(-1)]!==f.sha)throw Error('SYNTHETIC_TREE_ANCHOR_DRIFT');c[seg.at(-1)]=f.sha;}
 const trees=new Map(),root=treeFor(nodes,trees);
 const payload=`tree ${root}\nauthor Test <test@example.org> 1 +0000\ncommitter Test <test@example.org> 1 +0000\n\nSynthetic fixture commit for C94, not GitHub\n`;
 const head=gitSha('commit',Buffer.from(payload));
 const cx=JSON.parse(b.get('contracts/c77-cx-build-proof.json').toString());cx.source_head=head;
 const cxBytes=Buffer.from(JSON.stringify(cx));b.set('contracts/c77-cx-build-proof.json',cxBytes);
 manifest.source_head=head;
 const cxSpec=manifest.files.find(f=>f.path==='contracts/c77-cx-build-proof.json');
 cxSpec.sha256=sha(cxBytes);cxSpec.bytes=cxBytes.length;
 const manifestBytes=Buffer.from(JSON.stringify(manifest));b.set('c77-manifest.json',manifestBytes);
 b.set('c77-build-receipt.json',Buffer.from(JSON.stringify({head,bundle_manifest_sha256:sha(manifestBytes),file_count:manifest.files.length})));
 const archive=zipStore(new Map([...b].map(([name,v])=>[name==='c77-build-receipt.json'?name:'c77-standalone/'+name,v])));
 assert.equal(validateC94C77Archive(archive,{sourceHead:head}).status,'C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN');
 let calls=0;
 const client={async json(p){calls++;
  if(p.includes('/git/ref/heads/main'))return {ref:'refs/heads/main',object:{sha:head}};
  if(p.includes('/actions/workflows/'))return {workflow_runs:[{id:1001,head_sha:head,status:'completed',conclusion:'success'}]};
  if(p.includes('/actions/runs/'))return {artifacts:[{id:2002,name:'c77-qualified-standalone-microcapsule',expired:false,size_in_bytes:archive.length}]};
  if(p.includes('/git/commits/'))return {sha:head,tree:{sha:root},verification:{payload}};
  if(p.includes('/git/trees/'))return trees.get(p.split('/').at(-1));
  throw Error('UNKNOWN_API');},async bytes(){calls++;return archive;}};
 return {head,archive,manifest,client,getCalls:()=>calls};
}
test('real C77 original source bytes can travel through automatic synthetic GitHub API and create valid C84 package', {skip:!available},async()=>{
 const x=makeSyntheticGitHub();const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c94-auto-test-'));
 try{
  const out=await buildC94C84AutoPackage({sourceHead:x.head,client:x.client,parentDir:dir});
  assert.equal(out.status,'C94_C84_PACKAGE_REOPENED_C90_NOT_EXECUTED',JSON.stringify(out));
  assert.equal(out.staged_files,35);assert.equal(out.physical_download_and_reopen,true);
  assert.equal(out.c81_executed,true);assert.equal(out.native_chat_delivery_attested,false);
  assert.ok(x.getCalls()>5);
  const raw=fs.readFileSync(out.package_path),p=JSON.parse(raw.toString());
  assert.equal(sha(raw),out.package_sha256);assert.equal(p.sourceProof.treeObjects.length,6);
  assert.equal(p.files.length,34);assert.equal(p.sourceHead,x.head);
  assert.equal(gitSha('commit',Buffer.from(p.sourceProof.commitBase64,'base64')),x.head);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
