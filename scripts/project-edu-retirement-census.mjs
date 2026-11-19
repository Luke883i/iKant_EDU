#!/usr/bin/env node
/** File-level conservative census. Missing runtime/documentary proof never means retirement. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const json=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const d=json('contracts/edu-onezip-retirement-review.json');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64_000_000});
const rows=git('ls-tree','-r','-z',d.source_main).split('\0').filter(Boolean).map(x=>{
 const [mode,type,sha,path]=/^(\d+) (\w+) ([a-f0-9]{40})\t([^\0]+)$/u.exec(x).slice(1);
 return {mode,type,sha,path};
});
assert.equal(git('rev-parse',d.source_main+'^{tree}').trim(),d.source_tree);
assert.equal(rows.length,d.base_file_count);
const manifest=new Set(JSON.parse(git('show',d.source_main+':contracts/project-session-source.json')).paths);
const candidates=new Map(d.candidates.map(x=>[x.path,x]));const counts={};
const result=rows.map(r=>{
 const c=candidates.get(r.path);
 if(c)assert.ok(c.git_blob===r.sha&&!manifest.has(r.path)&&r.type==='blob'&&r.path.startsWith('project/docs/'));
 const status=manifest.has(r.path)?'EDU_NAMED_EXECUTION_CLOSURE':
  r.path.startsWith('project/plugins/ikant-le-session-chat/')||r.path==='project/release/render.mcp-standalone.candidate.yaml'?'MCP_DIRECT_KEEP':
  c?'CANDIDATO_AL_RITIRO_DOCUMENTALE_REVIEW_REQUIRED':'HOLD_UNCLASSIFIED_NOT_RETIRED';
 counts[status]=(counts[status]||0)+1;
 return {...r,status,...(c?{reason:c.reason}:{})};
});
assert.equal(counts.CANDIDATO_AL_RITIRO_DOCUMENTALE_REVIEW_REQUIRED,candidates.size);
console.log(JSON.stringify({source_main:d.source_main,files:rows.length,counts,removal_authorized:false,rows:result},null,2));
