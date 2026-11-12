/** PR3 root-to-leaf original-source readback; no product writer, no authority. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const load=x=>fs.readFileSync(path.join(ROOT,x));
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8',timeout:30000,maxBuffer:16*1024*1024}).trim();
const sha=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\\0')).update(b).digest('hex');
export function inspectPr3Cut(source=JSON.parse(load('contracts/pr3-repository-contraction.v1.json'))){
 const problems=[];
 const old=source.cut.source,to=source.cut.destination;
 const tracked=git('ls-files','-z').split('\\0').filter(Boolean);
 const set=new Set(tracked),root=tracked.filter(p=>!p.includes('/')).sort();
 const rootsOriginal=source.source_root_paths.slice().sort();
 const desired=rootsOriginal.filter(p=>p!==old);
 if(JSON.stringify(root)!==JSON.stringify(desired))problems.push('PR3_ROOT_DELTA_NOT_EXACT');
 if(set.has(old)||fs.existsSync(path.join(ROOT,old)))problems.push('PR3_LEGACY_ROOT_ALIAS_PRESENT');
 if(!set.has(to))problems.push('PR3_ARCHIVE_MISSING');
 else {
  const bytes=load(to);
  if(bytes.length!==source.cut.bytes||sha(bytes)!==source.cut.git_blob_sha1||
    git('hash-object','--',to)!==source.cut.git_blob_sha1||
    git('rev-parse','HEAD:'+to)!==source.cut.git_blob_sha1)
    problems.push('PR3_ARCHIVE_BLOB_MISMATCH');
 }
 if(source.product_go!==false||source.authority!==0||source.external_manual_render_config!=='UNKNOWN_REQUIRES_OPERATOR_REVIEW'||
    source.cut.old_path_not_present!==true||source.cut.content_mutation_allowed!==false)
  problems.push('PR3_AUTHORITY_PROMOTED');
 for(const [file,pin] of Object.entries(source.protected_original_owners||{})){
  if(!set.has(file)||git('rev-parse','HEAD:'+file)!==pin||git('hash-object','--',file)!==pin)
   problems.push('PR3_ORIGINAL_OWNER_CHANGED:'+file);
 }
 const historical=load('contracts/v5b-root-archive-plan.json').toString('utf8');
 if(!historical.includes('"path": "render.mcp-prepr.yaml"')||
    !historical.includes('"status": "CONDITIONAL_RETAIN"'))
  problems.push('PR3_HISTORICAL_HOLD_DECISION_REWRITTEN');
 const builder=load('scripts/oneshell-v1-build.py').toString('utf8');
 if(!/HEAD = "afb6f1cb75456c7cf8c82598bbcb6f954df9f629"/.test(builder)||
    !/return run_git\(repo, "show", HEAD \+ ":" \+ path\)/.test(builder))
  problems.push('PR3_HISTORICAL_BUILDER_INCORRECTLY_CLASSIFIED');
 const livePrefixes=['.github/workflows/','host/','src/','plugins/','project/','pilot/','release/'];
 const liveRefs=[];
 for(const p of tracked){
  if(!livePrefixes.some(pre=>p.startsWith(pre)))continue;
  if(!/\.(?:mjs|cjs|js|json|yaml|yml|md|txt)$/.test(p))continue;
  const b=load(p).toString('utf8');
  if(b.includes(old))liveRefs.push(p);
 }
 if(liveRefs.length)problems.push('PR3_LIVE_CONSUMER_OF_OLD_ROOT:'+liveRefs.join(','));
 const graph=source.consumer_assessment||[];
 if(graph.length!==5||new Set(graph.map(x=>x.path)).size!==5||
    graph.some(x=>!x.classification||!x.reason||!x.action))
  problems.push('PR3_CONSUMER_GRAPH_INCOMPLETE');
 return {ok:problems.length===0,status:problems.length?'FAIL':'SCOPED_PHYSICAL_ROOT_CONTRACTION',
  source_head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),
  before_root_count:rootsOriginal.length,after_root_count:root.length,root_delta:root.length-rootsOriginal.length,
  file_count:tracked.length,changed_owner_pins:0,root_paths:root,
  historical_builder_source_only:true,live_old_root_consumers:liveRefs,
  manual_provider_configuration:'UNKNOWN',remaining_roots_hold:root.length,product_go:false,errors:problems};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const a=inspectPr3Cut();
 process.stdout.write(JSON.stringify(a,null,2)+'\n');if(!a.ok)process.exitCode=1;
}
