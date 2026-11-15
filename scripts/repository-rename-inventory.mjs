#!/usr/bin/env node
/**
 * S00: full tracked-source rename census. Read-only, never a rename authorization.
 * Classifies text occurrences; only external owners can prove external closure.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OLD='Luke883i/iKant_LE';
const CORE=new Set([
 'BOOTSTRAP.json','ADMISSION.json','README.md','AGENTS.md','TERMS.md',
 'contracts/orientation-capsule.json','project/session-chat/PROMPT.txt',
 'release/catalog.json','plugins/ikant-le-session-chat/plugin.json'
]);
export function classify(pathname){
 if(CORE.has(pathname)||/^host\/.*c72/i.test(pathname)||/^src\/(first-contact|admission|runtime-root-verified)\.mjs$/.test(pathname))return 'ORIGINAL_OR_ENTRY_CRITICAL';
 if(pathname.startsWith('.github/workflows/'))return 'CI_WORKFLOW_REVIEW';
 if(pathname.startsWith('tests/'))return 'TEST_REGRESSION';
 if(pathname.startsWith('docs/archive/'))return 'HISTORICAL_PRESERVE';
 if(pathname.startsWith('docs/')||pathname.startsWith('governance/'))return 'DOCUMENTATION_REVIEW';
 if(/^(src|host|scripts|contracts|project|plugins|release|assets)\//.test(pathname))return 'ACTIVE_CODE_REVIEW';
 return 'UNCLASSIFIED_REVIEW';
}
const matchesLine=s=>/Luke883i\/iKant_LE|ikant[_-]le/i.test(s);
export function scanSource(root=ROOT){
 const raw=execFileSync('git',['ls-files','-z'],{cwd:root,maxBuffer:64*1024*1024});
 const paths=raw.toString('utf8').split('\0').filter(Boolean);
 const rows=[],skippedBinary=[],actionCallers=[],counts={};
 for(const pathname of paths){
  const full=path.join(root,pathname);
  let bytes;
  try{bytes=fs.readFileSync(full);}catch(e){throw Error('S00_TRACKED_UNREADABLE:'+pathname+':'+e.message);}
  if(bytes.includes(0)){skippedBinary.push(pathname);continue;}
  const content=bytes.toString('utf8');
  if(!/Luke883i\/iKant_LE|ikant[_-]le/i.test(content))continue;
  const category=classify(pathname),lines=content.split('\n'),samples=[];
  let exactCount=0, tokenCount=0;
  for(let i=0;i<lines.length;i++){
   const line=lines[i];
   if(!matchesLine(line))continue;
   exactCount+=(line.match(/Luke883i\/iKant_LE/ig)||[]).length;
   tokenCount+=(line.match(/ikant[_-]le/ig)||[]).length;
   if(/uses:\s*Luke883i\/iKant_LE\//i.test(line))
    actionCallers.push({file:pathname,line:i+1});
   if(samples.length<3)samples.push({line:i+1,excerpt:line.slice(0,150)});
  }
  rows.push({path:pathname,category,exact_references:exactCount,name_tokens:tokenCount,samples});
  counts[category]=(counts[category]||0)+1;
 }
 const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim();
 return {
  schema:'ikant-rename-s00-source-census/v1',
  authority:0,source_head:head,source_tree:tree,
  canonical_old_name:OLD,planned_new_name:'Luke883i/iKant_EDU',
  tracked_paths:paths.length,matching_files:rows.length,
  exact_references:rows.reduce((n,x)=>n+x.exact_references,0),
  token_occurrences:rows.reduce((n,x)=>n+x.name_tokens,0),
  classes:counts,source_action_callers:actionCallers,
  skipped_binary:skippedBinary,rows,
  external_action_callers:'UNKNOWN_REQUIRES_EXTERNAL_OWNER_EVIDENCE',
  github_pages_packages_webhooks:'UNKNOWN_REQUIRES_PROVIDER_EVIDENCE',
  chatgpt_project_installed_prompt:'UNKNOWN_REQUIRES_PROVIDER_READBACK',
  c72_linked_terms_migrated:false,
  human_admin_cutover_authorized:false,
  status:'NOT_READY_FOR_RENAME',
  first_unclosed_edge:'S00_EXTERNAL_CONSUMER_CLOSURE_UNKNOWN',
  no_owner_invoked:true,rename_performed:false,active:false
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=scanSource();
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
