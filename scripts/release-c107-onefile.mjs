#!/usr/bin/env node
// C107 one-file release. Original SOURCE_HEAD is fixed independently of branch head.
// Only the signed source commit's exact tree and 43 source objects may be compressed.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const SHA='c734bf934e33703a6a1f91f0f4d5df96eec96945';
const TREE='7b1e8b87f43b5995b9c6d1079254918f22549e01';
const EXPECT='d17195881d6567524f1cdf358c991be5ff0d68e92aea2ba14273f0ea2cf74c6d';
const DEC='65f8a39574786afdfa20e521927004b1709f973b3a1c572daed32586e2cb77b1';
const OUT='release/v8/ikant-c107-source-c734bf934e33.ikc.br';
const H=b=>crypto.createHash('sha256').update(b).digest('hex');
const G=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const source=path.resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('frozen source checkout required');
const rev=execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim();
const tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:source,encoding:'utf8'}).trim();
if(rev!==SHA||tree!==TREE)throw Error('pinned source Git HEAD/tree mismatch');
const {C107_FILES}=await import(pathToFileURL(path.join(source,'scripts/c107-pack.mjs')).href);
if(C107_FILES.length!==43)throw Error('C107_FILES changed unexpectedly');
const files=[],bytes=[];
for(const p of C107_FILES){
 if(!/^(?:README\.md|TERMS\.md|(?:host|src|scripts|contracts)\/[A-Za-z0-9._/-]+)$/.test(p)||p.split('/').some(x=>!x||x==='..'||x==='.'))throw Error('unsafe original path');
 const b=fs.readFileSync(path.join(source,p));
 const expected=execFileSync('git',['rev-parse','HEAD:'+p],{cwd:source,encoding:'utf8'}).trim();
 if(G(b)!==expected)throw Error('source Git blob mismatch');
 files.push({path:p,bytes:b.length,sha256:H(b),git_blob_sha1:expected,content_base64:b.toString('base64')});
 bytes.push(b);
}
const pkg=Buffer.from(JSON.stringify({schema:'ikant-le-c107-minimal-package/v1',source_head:SHA,files,active:false,authority:0})+'\n');
if(H(pkg)!==DEC)throw Error('source package SHA256 mismatch');
const meta=Buffer.from(JSON.stringify({schema:'ikant-le-c107-source-carrier/v1',source_head:SHA,source_tree:TREE,files:files.map(({path,bytes})=>({path,bytes})),decoded_package_sha256:DEC,active:false,authority:0}));
const hdr=Buffer.alloc(12);
Buffer.from('IKC10701').copy(hdr);hdr.writeUInt32BE(meta.length,8);
const frame=Buffer.concat([hdr,meta,...bytes]);
const carrier=zlib.brotliCompressSync(frame,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11,[zlib.constants.BROTLI_PARAM_SIZE_HINT]:frame.length}});
if(carrier.length!==62448||H(carrier)!==EXPECT||!zlib.brotliDecompressSync(carrier).equals(frame))throw Error('pinned carrier output SHA256/size mismatch');
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,carrier);
console.log(JSON.stringify({status:'PINNED_SINGLE_CARRIER_BUILT',source_head:SHA,source_tree:TREE,path:OUT,sha256:H(carrier),bytes:carrier.length,files:43}));
