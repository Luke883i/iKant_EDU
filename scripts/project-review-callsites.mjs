/** Read-only lexical call-site census. Not a runtime reachability proof. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rx=/\b(import\s*\(|require\s*\(|import\.meta\.resolve\s*\(|execFile(?:Sync)?\s*\(|spawn(?:Sync)?\s*\(|fork\s*\(|new\s+Worker\s*\(|eval\s*\(|Function\s*\()/gu;
const digest=x=>createHash('sha256').update(x).digest('hex');
function expressionAt(src,pos){let i=pos,depth=1,quote='',escaped=false;for(;i<src.length&&i<pos+800;i++){let c=src[i];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote='';continue;}if(c==='"'||c===String.fromCharCode(39)||c===String.fromCharCode(96)){quote=c;continue;}if(c==='(')depth++;else if(c===')'&&--depth===0)break;}return src.slice(pos,i).trim();}
export function scanCallsites(source,file){const out=[];rx.lastIndex=0;for(const m of source.matchAll(rx)){const start=m.index+m[0].length,expr=expressionAt(source,start),literal=/^(['"])([^'"\r\n]+)\1$/u.exec(expr);const line=source.slice(0,m.index).split('\n').length;out.push({path:file,line,kind:m[0].trim().replace(/\s+/gu,' '),expression:expr.slice(0,180),target:literal?.[2]||null,qualification:literal?'LITERAL':'DYNAMIC_TARGET_UNKNOWN'});}return out;}
export function censusRepo(repo){const paths=execFileSync('git',['ls-files','-z'],{cwd:repo}).toString('utf8').split('\0').filter(Boolean).sort();const result=[];let parsed=0;for(const p of paths){if(!/\.(?:mjs|js|cjs|ts|mts)$/u.test(p))continue;const f=path.join(repo,p);const st=fs.lstatSync(f);if(!st.isFile()||st.isSymbolicLink())throw Error('SOURCE_FILE_UNSAFE:'+p);const src=fs.readFileSync(f,'utf8');parsed++;result.push(...scanCallsites(src,p));}const unknown=result.filter(x=>x.qualification==='DYNAMIC_TARGET_UNKNOWN');return {schema:'ikant-host-callsite-census/v1',authority:0,epistemic_status:'SOURCE_LEXICAL_CENSUS_NOT_RUNTIME_REACHABILITY',tracked_file_count:paths.length,js_files_parsed:parsed,callsite_count:result.length,unknown_target_count:unknown.length,source_sha256:digest(paths.join('\n')),callsites:result};}
/** Optional CLI-only Git source readback, not product/runtime or consumer closure. */
function verifyGitSource(repo){
 const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',maxBuffer:32000000});
 const parse=(kind,s)=>s.split('\0').filter(Boolean).map(line=>{
  const m=(kind==='index'?/^([0-7]{6}) ([a-f0-9]{40}) 0\t(.+)$/u:/^([0-7]{6}) blob ([a-f0-9]{40})\t(.+)$/u).exec(line);
  if(!m)throw Error('GIT_SOURCE_UNSUPPORTED_'+kind);
  return {mode:m[1],sha:m[2],path:m[3]};
 });
 const idx=parse('index',git('ls-files','--stage','-z'));
 const tree=parse('tree',git('ls-tree','-r','-z','HEAD'));
 if(idx.length!==tree.length)throw Error('GIT_SOURCE_INDEX_TREE_COUNT');
 const check=new Map(tree.map(x=>[x.path,x]));
 if(check.size!==tree.length)throw Error('GIT_SOURCE_TREE_DUPLICATE');
 let verified=0,workflow_count=0,bytes=0,generated_drift=0;
 const encoded=createHash('sha256');
 for(const x of idx){
  const t=check.get(x.path);
  if(!t||t.sha!==x.sha||t.mode!==x.mode)throw Error('GIT_SOURCE_INDEX_TREE_DRIFT:'+x.path);
  const filename=path.join(repo,x.path),st=fs.lstatSync(filename);
  if(!st.isFile()||st.isSymbolicLink())throw Error('GIT_SOURCE_UNSAFE_FILE:'+x.path);
  const data=fs.readFileSync(filename),sha=createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');
  if(sha!==x.sha){
   if(/^artifacts\/qualification\/[a-zA-Z0-9._/-]+\.json$/u.test(x.path))generated_drift++;
   else throw Error('GIT_SOURCE_WORKTREE_DRIFT:'+x.path);
  }
  encoded.update(x.mode+' '+x.sha+' '+x.path+'\n');
  if(x.path.startsWith('.github/workflows/'))workflow_count++;
  verified++;bytes+=data.length;
 }
 const head=git('rev-parse','HEAD').trim(),git_tree=git('rev-parse','HEAD^{tree}').trim();
 return {schema:'ikant-git-source-readback/v1',authority:0,head,tree:git_tree,
  tracked:verified,workflows:workflow_count,worktree_bytes:bytes,
  generated_worktree_drifts:generated_drift,source_worktree_drifts:0,
  index_tree_verified:true,git_index_sha256:encoded.digest('hex'),
  native_host_installation:'UNKNOWN',external_consumers:'UNKNOWN',
  archive_permitted:false,original_owner_invoked:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{const repoRoot=process.argv[2]?path.resolve(process.argv[2]):root;const report=censusRepo(repoRoot);report.git_source_readback=verifyGitSource(repoRoot);process.stdout.write(JSON.stringify(report,null,2)+'\n');}catch(e){console.error(String(e?.message||e));process.exitCode=1;}}
