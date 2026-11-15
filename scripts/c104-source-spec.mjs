import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const source=fs.readFileSync(path.join(root,'scripts/c77-build-capsule.mjs'),'utf8');
const segment=name=>{const x=source.match(new RegExp('const '+name+'=\\[([\\s\\S]*?)\\];'));
 if(!x)throw Error('C104_C77_BUILDER_FORMAT_CHANGED');
 return [...x[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);};
const code=segment('codePaths'),data=segment('dataPaths');
if(code.length!==25||data.length!==9)throw Error('C104_C77_SOURCE_SET_DRIFT');
const census=JSON.parse(fs.readFileSync(path.join(root,'contracts/c71-cx-execution-census.json'),'utf8'));
if(census.schema!=='ikant-le-c71-cx-execution-census/v1'||census.entries?.length!==70)
 throw Error('C104_C71_CENSUS_DRIFT');
const paths=new Set([...code,...data]);
for(let i=0;i<70;i++){const e=census.entries[i];
 if(e.id!=='C'+(i+1)||e.canonical_state_conferred!==false||e.anchor_is_execution_receipt!==false)
  throw Error('C104_CX_ANCHOR_INVALID');paths.add(e.implementation_anchor);
}
const head=git('rev-parse','HEAD');
const files=[...paths].sort().map(p=>{
 if(!/^(?:README\.md|(?:host|src|scripts|contracts|assets\/brand)\/[A-Za-z0-9_.\/-]+)$/.test(p)||p.includes('..'))
  throw Error('C104_PATH_DRIFT');
 const b=fs.readFileSync(path.join(root,p));const sha=git('rev-parse','HEAD:'+p);
 const actual=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
 if(actual!==sha)throw Error('C104_CHECKOUT_SOURCE_DRIFT:'+p);
 return {path:p,bytes:b.length,git_blob_sha1:sha};
});
if(files.length!==66)throw Error('C104_SOURCE_CENSUS_UNEXPECTED:'+files.length);
const spec={schema:'ikant-le-c104-source-spec/v1',source_head:head,
 authority:0,github_origin_attested:false,files};
const specSha256=crypto.createHash('sha256').update(JSON.stringify(spec)).digest('hex');
process.stdout.write(JSON.stringify({spec,specSha256,source_paths:code.length+data.length,anchor_declarations:70,distinct_source_blobs:files.length})+'\n');
