#!/usr/bin/env node
/** GitHub API byte ingress. Stdlib only; no archive, dependency install or network fallback. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const git=(type,b)=>createHash('sha1').update(Buffer.from(`${type} ${b.length}\0`)).update(b).digest('hex');
const safe=p=>typeof p==='string'&&p.length>0&&!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').some(x=>!x||x==='.'||x==='..')&&!p.includes('\0');
export function verifyRepositoryPlan(plan,{head,tree}={}){
 if(Number(process.versions.node.split('.')[0])<20)throw Error('NODE_20_REQUIRED');
 if(!/^[a-f0-9]{40}$/.test(head||'')||!/^[a-f0-9]{40}$/.test(tree||''))throw Error('SOURCE_LOCK_REQUIRED');
 if(plan?.source_head!==head||plan?.source_tree!==tree||plan?.live_head!==head)throw Error('STOP_SOURCE_LOCK_STALE');
 if(plan.truncated!==false||!Array.isArray(plan.tree)||!Array.isArray(plan.files))throw Error('COMPLETE_API_TREE_REQUIRED');
 const entries=new Map();
 for(const e of plan.tree){if(!safe(e.path)||entries.has(e.path)||!/^[a-f0-9]{40}$/.test(e.sha||'')||!['blob','tree','commit'].includes(e.type))throw Error('TREE_ENTRY_INVALID');entries.set(e.path,e);}
 for(const e of entries.values()){const p=path.posix.dirname(e.path);if(p!=='.'&&entries.get(p)?.type!=='tree')throw Error('ORPHAN_TREE_ENTRY');}
 const compute=dir=>{
  const rows=[...entries.values()].filter(e=>path.posix.dirname(e.path)===(dir||'.'));
  rows.sort((a,b)=>Buffer.compare(Buffer.from(path.posix.basename(a.path)+(a.type==='tree'?'/':'')),Buffer.from(path.posix.basename(b.path)+(b.type==='tree'?'/':''))));
  const blocks=rows.map(e=>{if(e.type==='tree'&&compute(e.path)!==e.sha)throw Error('TREE_IDENTITY_MISMATCH');const mode=e.mode==='040000'?'40000':e.mode;if(!['40000','100644','100755','120000','160000'].includes(mode))throw Error('TREE_MODE_INVALID');return Buffer.concat([Buffer.from(mode+' '+path.posix.basename(e.path)+'\0'),Buffer.from(e.sha,'hex')]);});
  return git('tree',Buffer.concat(blocks));
 };
 if(compute('')!==tree)throw Error('SOURCE_TREE_IDENTITY_MISMATCH');
 const files=new Map();
 for(const f of plan.files){if(!safe(f.path)||files.has(f.path)||f.encoding!=='base64'||typeof f.content!=='string')throw Error('FILE_ENVELOPE_INVALID');const b=Buffer.from(f.content.replace(/\s/g,''),'base64'),e=entries.get(f.path);if(!e||e.type!=='blob'||!['100644','100755'].includes(e.mode)||git('blob',b)!==e.sha)throw Error('SOURCE_BLOB_IDENTITY_MISMATCH');files.set(f.path,b);}
 const manifest=files.get('contracts/project-session-source.json');if(!manifest)throw Error('SOURCE_MANIFEST_REQUIRED');
 const m=JSON.parse(manifest);if(m.schema!=='ikant-le-project-session-source/v1'||!Array.isArray(m.paths)||new Set(m.paths).size!==m.paths.length||!m.paths.every(safe))throw Error('SOURCE_MANIFEST_INVALID');
 const required=new Set([...m.paths,'contracts/project-session-source.json']);
 if(files.size!==required.size||[...required].some(p=>!files.has(p)))throw Error('SOURCE_OBJECT_SET_INCOMPLETE');
 return{head,tree,files,scope:'REPOSITORY_NAMED_EXECUTION_CLOSURE_NOT_FULL_CHECKOUT'};
}
export function materializeRepositoryPlan(plan,{head,tree,destination}={}){
 const verified=verifyRepositoryPlan(plan,{head,tree});
 if(!destination||fs.existsSync(destination))throw Error('FRESH_SOURCE_DESTINATION_REQUIRED');
 // A failed or uncertain write is reconciled read-only by the HOST, never blindly replayed.
 fs.mkdirSync(destination,{recursive:true,mode:0o700});
 for(const [p,b] of verified.files){const out=path.join(destination,p);fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});fs.writeFileSync(out,b,{flag:'wx',mode:0o600});if(!fs.readFileSync(out).equals(b))throw Error('SOURCE_READBACK_MISMATCH');}
 const receipt={schema:'ikant-le-project-source-readback/v1',source_head:head,source_tree:tree,
  tree:plan.tree.map(({path,mode,type,sha})=>({path,mode,type,sha})),truncated:false,files:[...verified.files].map(([p,b])=>({path:p,git_blob_sha1:git('blob',b)})),
  scope:verified.scope,authority:0,active:false,provider_attested:false};
 const rp=path.join(destination,'.project-source-readback.json');fs.writeFileSync(rp,JSON.stringify(receipt),{flag:'wx',mode:0o600});
 if(fs.readFileSync(rp,'utf8')!==JSON.stringify(receipt))throw Error('SOURCE_RECEIPT_READBACK_MISMATCH');
 return receipt;
}
export function verifyLocalProjectSource(root,{head,tree}={}){
 const r=JSON.parse(fs.readFileSync(path.join(root,'.project-source-readback.json'),'utf8'));
 if(r.source_head!==head||r.source_tree!==tree||!Array.isArray(r.files))throw Error('LOCAL_SOURCE_BINDING_MISMATCH');
 for(const e of r.files){if(!safe(e.path))throw Error('LOCAL_PATH_INVALID');const f=path.join(root,e.path);let p=root;for(const part of e.path.split('/')){p=path.join(p,part);if(fs.lstatSync(p).isSymbolicLink())throw Error('LOCAL_SOURCE_SYMLINK');}if(git('blob',fs.readFileSync(f))!==e.git_blob_sha1)throw Error('LOCAL_SOURCE_CHANGED');}
 verifyRepositoryPlan({source_head:head,source_tree:tree,live_head:head,tree:r.tree,truncated:r.truncated,
  files:r.files.map(e=>({path:e.path,encoding:'base64',content:fs.readFileSync(path.join(root,e.path)).toString('base64')}))},{head,tree});
 return r;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const [planPath,destination,head,tree]=process.argv.slice(2);const r=materializeRepositoryPlan(JSON.parse(fs.readFileSync(planPath,'utf8')),{destination,head,tree});console.log(JSON.stringify({status:'SOURCE_REOPENED',source_head:r.source_head,source_tree:r.source_tree,objects:r.files.length,receipt_path:path.join(destination,'.project-source-readback.json'),active:false}));}catch(e){console.error(e.message);process.exitCode=1;}
}
