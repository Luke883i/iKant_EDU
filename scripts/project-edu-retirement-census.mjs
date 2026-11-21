#!/usr/bin/env node
/** HEAD-wide conservative inventory. Legacy candidate is review status, never deletion proof. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const json=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const d=json('contracts/edu-onezip-retirement-review.json');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64_000_000});
const treeRows=ref=>git('ls-tree','-r','-z',ref).split('\0').filter(Boolean).map(x=>{
 const m=/^(\d+) (\w+) ([a-f0-9]{40})\t([^\0]+)$/u.exec(x);
 assert(m,'UNEXPECTED_GIT_TREE_RECORD');
 const [mode,type,sha,path]=m.slice(1);return {mode,type,sha,path};
});
export function classifyEduMcpFile(p,manifest,candidates){
 if(manifest.has(p))return 'EDU_NAMED_EXECUTION_CLOSURE';
 if(['project/edu-oneshell/PROMPT_INNESCO.txt',
     'scripts/c131-build-project-bundle.py','scripts/project-edu-entrypoint.mjs'].includes(p))
   return 'EDU_DISTRIBUTION_DERIVED_KEEP';
 if(p.startsWith('project/plugins/ikant-le-session-chat/')||
    p==='project/release/render.mcp-standalone.candidate.yaml')return 'MCP_DIRECT_KEEP';
 if(candidates.has(p))return 'CANDIDATO_AL_RITIRO_DOCUMENTALE_REVIEW_REQUIRED';
 if(/(?:^|\/)(?:test[^/]*|[^/]*mcp[^/]*)/iu.test(p)&&/mcp|plugin|session-chat-runtime/iu.test(p))
   return 'MCP_ASSURANCE_KEEP';
 if((p.startsWith('tests/')||p.startsWith('.github/workflows/'))&&
    /edu|oneshell|project-session|project-source|c72|c87|c125|c135/iu.test(p)||
    p.startsWith('project/docs/EDU_ONEZIP_')||
    p==='scripts/project-edu-retirement-census.mjs'||p==='contracts/edu-onezip-retirement-review.json')
   return 'EDU_ASSURANCE_KEEP';
 return 'LEGACY_CANDIDATE_UNKNOWN_CONSUMERS_REVIEW_REQUIRED';
}
export function runEduMcpCensus(){
 const base=treeRows(d.source_main);
 assert.equal(git('rev-parse',d.source_main+'^{tree}').trim(),d.source_tree);
 assert.equal(base.length,d.base_file_count);
 const baseByPath=new Map(base.map(x=>[x.path,x]));
 const head=git('rev-parse','HEAD').trim();
 const tree=git('rev-parse','HEAD^{tree}').trim();
 const manifest=new Set(json('contracts/project-session-source.json').paths);
 const candidates=new Map(d.candidates.map(x=>[x.path,x]));
 for(const [p,c] of candidates){const r=baseByPath.get(p);
  assert(r&&r.sha===c.git_blob&&r.type==='blob'&&!manifest.has(p)&&p.startsWith('project/docs/'),
   'DOCUMENTED_CANDIDATE_BASE_NOT_PROVEN:'+p);
 }
 const counts={};
 const rows=treeRows(head).map(r=>{
  const status=classifyEduMcpFile(r.path,manifest,candidates);
  counts[status]=(counts[status]||0)+1;
  return {...r,status,...(candidates.has(r.path)?{reason:candidates.get(r.path).reason}:{})};
 });
 assert.equal(counts.CANDIDATO_AL_RITIRO_DOCUMENTALE_REVIEW_REQUIRED,candidates.size);
 assert.equal(rows.length,Object.values(counts).reduce((a,b)=>a+b,0));
 return {schema:'ikant-edu-mcp-every-file-census/v2',source_main:d.source_main,
  source_tree:d.source_tree,base_files:base.length,head,tree,files:rows.length,
  counts,external_consumers:'UNKNOWN',removal_authorized:false,
  status_semantics:'LEGACY_CANDIDATE_MEANS_INVESTIGATE_NOT_UNUSED_OR_SAFE_TO_DELETE',rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 console.log(JSON.stringify(runEduMcpCensus(),null,2));
