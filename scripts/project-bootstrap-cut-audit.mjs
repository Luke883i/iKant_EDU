#!/usr/bin/env node
/** Read-only bootstrap BOM auditor. Host engineering candidate; authority zero.
 * No import of owners, source writes, consent, receipts or runtime execution.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const COLD='host/project-c72-coldstart-seed.mjs';
const H1='host/project-edu-h1-bound-port.mjs';
const STAGER='scripts/project-c72-verified-staging.mjs';
const TRANSIT='host/project-c72-receipt-transit.mjs';
const MANIFEST='contracts/project-session-source.json';
const CORE=['TERMS.md','contracts/c72-public-mode-admission-v2.json',
 'host/c72-public-mode-admission.mjs','host/project-c72-postaccept-reentry.mjs',
 TRANSIT,COLD];
const fail=edge=>{throw Error(edge);};
const safe=p=>typeof p==='string'&&p.length>0&&!p.startsWith('/')&&
 !p.split('/').some(x=>x==='.'||x==='..'||!x)&&/^[A-Za-z0-9_.\/-]+$/u.test(p);
function read(root,p){
 if(!safe(p))fail('BOOTSTRAP_CUT_UNSAFE_PATH:'+p);
 let current=root;
 for(const part of p.split('/')){
  current=path.join(current,part);
  const st=fs.lstatSync(current);
  if(st.isSymbolicLink())fail('BOOTSTRAP_CUT_SYMLINK:'+p);
 }
 if(!fs.statSync(current).isFile())fail('BOOTSTRAP_CUT_NOT_FILE:'+p);
 return fs.readFileSync(current);
}
function parseList(src,symbol){
 const re=new RegExp('(?:export\\s+)?const\\s+'+symbol+
  '\\s*=\\s*Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\)','u');
 const m=re.exec(src.toString('utf8'));
 if(!m)fail('BOOTSTRAP_CUT_SOURCE_LIST_MISSING:'+symbol);
 const tokens=m[1].match(/'[^']*'/gu)||[];
 if(m[1].replace(/'[^']*'/gu,'').replace(/[\s,]/gu,'')!=='')
  fail('BOOTSTRAP_CUT_NONLITERAL_SOURCE_LIST:'+symbol);
 const paths=tokens.map(s=>s.slice(1,-1));
 if(!paths.length||new Set(paths).size!==paths.length||paths.some(s=>!safe(s)))
  fail('BOOTSTRAP_CUT_INVALID_LIST:'+symbol);
 return paths;
}
function set(paths,what){
 if(!Array.isArray(paths)||paths.length===0||new Set(paths).size!==paths.length||
    paths.some(x=>!safe(x)))fail('BOOTSTRAP_CUT_INVALID_PATH_SET:'+what);
 return paths;
}
const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&
 a.every((x,i)=>x===b[i]);
function sha1Blob(bytes){
 return createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
   .update(bytes).digest('hex');
}
export function computeBootstrapCuts(root){
 if(typeof root!=='string'||!path.isAbsolute(root)||
    !fs.statSync(root).isDirectory())fail('BOOTSTRAP_CUT_INVALID_ROOT');
 const cold=parseList(read(root,COLD),'C72_COLDSTART_FILES');
 const h1=parseList(read(root,H1),'H1_FILES');
 const stager=parseList(read(root,STAGER),'NAMES');
 if(!equal(cold,h1)||!equal(cold,stager))
  fail('BOOTSTRAP_CUT_C72_H1_STAGER_DRIFT');
 const bootstrap=JSON.parse(read(root,'BOOTSTRAP.json').toString('utf8'));
 const first=set(bootstrap?.orientation_capsule?.paths,'orientation');
 if(first.length!==5||!equal(cold.slice(0,5),first))
  fail('BOOTSTRAP_CUT_ORIENTATION_DRIFT');
 const pin=bootstrap?.project_session?.postaccept_original_c72_transit_pin;
 if(pin?.path!==TRANSIT||!/^[a-f0-9]{40}$/u.test(pin?.blob_sha1||'')||
    pin.blob_sha1!==sha1Blob(read(root,TRANSIT)))
  fail('BOOTSTRAP_CUT_TRANSIT_PIN_DRIFT');
 const source=JSON.parse(read(root,MANIFEST).toString('utf8'));
 const project=set(source?.paths,'project_manifest');
 if(!cold.every(x=>project.includes(x))||!project.includes(TRANSIT)||
    !project.includes(COLD))fail('BOOTSTRAP_CUT_PROJECT_MANIFEST_MISSING_C72');
 const size=paths=>paths.reduce((n,p)=>n+read(root,p).length,0);
 const ten=[...cold,TRANSIT,COLD];
 return Object.freeze({
  schema:'ikant-host-bootstrap-cut-audit/v1',
  authority:0,active:false,kind:'READ_ONLY_ENGINEERING_CANDIDATE',
  original_owner_invoked:false,git_origin_attested:false,
  native_provider_attested:false,
  current:{
   orientation:{files:first.length,bytes:size(first),paths:first},
   c72:{files:ten.length,bytes:size(ten),paths:ten},
   post_edu:{files:project.length,bytes:size(project),paths:project}
  },
  hypothetical:{
   owner_related_subset:{files:CORE.length,bytes:size(CORE),paths:CORE,
    status:'NOT_EXECUTABLE_WITH_CURRENT_OWNER_GATE'},
   warm_cache:{incremental_remote_bytes_lower_bound:0,
    conditional_on:'ALL_ORIGINAL_BYTES_ALREADY_LOCALLY_PRESENT_AND_REOPENED',
    status:'NOT_ATTESTED'}
  },
  overlap:{c72_in_post_edu:ten.filter(p=>project.includes(p)).length},
  claims:{current_c72_minimum_reduced:false,post_edu_manifest_reduced:false,
   no_runtime_inference:true,no_receipt_inference:true,owner_unchanged:true}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{console.log(JSON.stringify(computeBootstrapCuts(path.resolve(process.argv[2]||'.')),null,2));}
 catch(e){console.error(JSON.stringify({ok:false,edge:e.message,authority:0,
  active:false,original_owner_invoked:false}));process.exitCode=2;}
}
