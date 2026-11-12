#!/usr/bin/env node
/** Original-owner test execution witness. This module is a reader, NOT an owner. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=s=>createHash('sha256').update(s).digest('hex');
const HEX40=/^[0-9a-f]{40}$/;
const HEX64=/^[0-9a-f]{64}$/;
const SUITES=Object.freeze([
 Object.freeze({id:'PROJECT_OWNER',files:Object.freeze([
  'tests/c72-public-mode-admission.test.mjs','tests/project-c72-coldstart-to-edu.test.mjs',
  'tests/c135-cognitive-edu-owner.test.mjs','tests/project-oneshell-continuous.test.mjs'])}),
 Object.freeze({id:'MCP_POLICY',files:Object.freeze([
  'tests/mcp-standalone-runtime-assurance.test.mjs','tests/s06-mcp-transport-security.test.mjs'])})
]);
const evidenceIds=['P03','P04','P05','P06','P07','P08','M03','M04','M05','M06','M07','M08','T01','T02','T03','T04','T06','T08','T09'];
const selectors=Object.freeze(Object.fromEntries(evidenceIds.map(id=>[id,
  ['M05','M07'].includes(id)?'SDK_HTTP_NOT_EXECUTED':
  id==='M08'?'SERVER_RESTART_NOT_EXECUTED':
  id==='T06'?'KNOWN_MULTILINGUAL_COUNTEREXAMPLE':
  ['T01','T02','T03'].includes(id)?'EXACT_HEAD_CI_SEPARATE':
  id.startsWith('M')?'MCP_POLICY':'PROJECT_OWNER'])));
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8',timeout:30000,maxBuffer:2500000}).trim();
const fail=edge=>Object.freeze({ok:false,first_edge:edge,product_go:false,native_provider_attested:false});
function tap(t){
 const num=x=>{const m=t.match(new RegExp('^# '+x+' (\\d+)\\s*$','m'));return m?Number(m[1]):null;};
 const tests=num('tests'),pass=num('pass'),failed=num('fail'),skipped=num('skipped');
 return tests!==null&&pass!==null&&failed!==null&&skipped!==null&&
 tests>0&&pass===tests&&failed===0&&skipped===0&&/^1\.\.\d+\s*$/m.test(t)
 ?{tests,pass,fail:failed,skipped}:null;
}
export function verifyPr2RuntimeReceipt(receipt,logs,{expectedHead,expectedTree}={}){
 if(!receipt||receipt.schema!=='ikant-pr2-runtime-receipt/v1'||receipt.product_go!==false||
  receipt.native_provider_attested!==false||receipt.human_review_attested!==false||
  receipt.content_truth_attested!==false||receipt.evidence_class!=='SCOPED_NODE_TEST_EXECUTION'||
  receipt.mcp_http_attested!==false||receipt.mcp_restart_attested!==false)
  return fail('PR2_AUTHORITY_PROMOTION_OR_INVALID_RECEIPT');
 if(!HEX40.test(receipt.source?.head||'')||!HEX40.test(receipt.source?.tree||'')||
  expectedHead!==receipt.source.head||expectedTree!==receipt.source.tree)
  return fail('PR2_SOURCE_HEAD_TREE_MISMATCH');
 if(!Array.isArray(receipt.suites)||receipt.suites.length!==SUITES.length||
  !receipt.dod||JSON.stringify(Object.keys(receipt.dod).sort())!==JSON.stringify([...evidenceIds].sort()))
  return fail('PR2_DENOMINATOR_OR_SUITE_MISMATCH');
 // Read the source from this exact checkout; a digest typed into the receipt
 // cannot substitute for independently reopening Git's current source object.
 const expectedFiles=[...new Set(SUITES.flatMap(s=>s.files))].sort();
 if(!Array.isArray(receipt.source.test_blobs)||receipt.source.test_blobs.length!==expectedFiles.length)
  return fail('PR2_SOURCE_BLOB_DENOMINATOR');
 const rows=new Map(receipt.source.test_blobs.map(x=>[x?.path,x]));
 if(rows.size!==expectedFiles.length)return fail('PR2_DUPLICATE_BLOB_WITNESS');
 for(const file of expectedFiles){
  const row=rows.get(file);
  if(!row||row.path!==file||!HEX40.test(row.git_blob_sha1||'')||!HEX64.test(row.sha256||''))
   return fail('PR2_SOURCE_BLOB_WITNESS_INVALID:'+file);
  try{
   const bytes=fs.readFileSync(path.join(ROOT,file));
   if(git('rev-parse','HEAD:'+file)!==row.git_blob_sha1||
      git('hash-object','--',file)!==row.git_blob_sha1||sha(bytes)!==row.sha256)
    return fail('PR2_SOURCE_BLOB_READBACK_MISMATCH:'+file);
  }catch{return fail('PR2_SOURCE_BLOB_NOT_REOPENED:'+file);}
 }
 for(const [i,s] of SUITES.entries()){
  const r=receipt.suites[i],body=logs?.[s.id];
  if(r?.id!==s.id||JSON.stringify(r.files)!==JSON.stringify(s.files)||
   r.exit_code!==0||!HEX64.test(r.tap_sha256||'')||
   typeof body!=='string'||sha(body)!==r.tap_sha256)
   return fail('PR2_SOURCE_OR_LOG_BYTES_MISMATCH:'+s.id);
  const result=tap(body);
  if(!result||JSON.stringify(result)!==JSON.stringify(r.tap))
   return fail('PR2_TEST_ORACLE_NOT_PROVEN:'+s.id);
 }
 for(const [id,tier] of Object.entries(selectors))
  if(receipt.dod[id]!==tier)
   return fail('PR2_DOD_PROOF_TIER_PROMOTION:'+id);
 return Object.freeze({ok:true,status:'SOURCE_BOUND_LOCAL_RUNTIME_ONLY',verified_suites:2,
  verified_test_count:receipt.suites.reduce((n,x)=>n+x.tap.tests,0),
  unresolved_ids:evidenceIds.filter(id=>!['PROJECT_OWNER','MCP_POLICY'].includes(selectors[id])),
  provider_attested:false,human_review_attested:false,product_go:false});
}
export function capturePr2RuntimeReceipt({destination,timeoutMs=90000}={}){
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 if(!HEX40.test(head)||!HEX40.test(tree)||!Number.isSafeInteger(timeoutMs)||timeoutMs<1000||
  timeoutMs>180000)throw Error('PR2_INVALID_SOURCE_OR_BUDGET');
 if(git('status','--porcelain','--untracked-files=no'))throw Error('PR2_DIRTY_TRACKED_SOURCE');
 const out=destination||fs.mkdtempSync(path.join(os.tmpdir(),'ikant-pr2-receipt-'));
 if(path.resolve(out)===ROOT||path.resolve(out).startsWith(ROOT+path.sep))
  throw Error('PR2_OUTPUT_INSIDE_SOURCE_FORBIDDEN');
 fs.mkdirSync(out,{recursive:true,mode:0o700});
 const source=[];
 for(const suite of SUITES)for(const file of suite.files){
  const bytes=fs.readFileSync(path.join(ROOT,file)),observed=git('rev-parse','HEAD:'+file);
  const inTree=git('hash-object','--',file);
  if(observed!==inTree)throw Error('PR2_TEST_BYTES_CHANGED:'+file);
  source.push({path:file,git_blob_sha1:observed,sha256:sha(bytes)});
 }
 const results=[],logs={};
 for(const suite of SUITES){
  const p=spawnSync(process.execPath,['--test','--test-concurrency=1',...suite.files],{
   cwd:ROOT,encoding:'utf8',timeout:timeoutMs,maxBuffer:8*1024*1024,
   env:{...process.env,NODE_ENV:'test'}});
  const stdout=p.stdout||'',stderr=p.stderr||'';
  const stats=tap(stdout);
  if(p.status!==0||p.signal||stderr.trim()||!stats)throw Error(
   'PR2_ORIGINAL_SUITE_FAILED:'+suite.id+':'+String(p.status)+':'+String(p.signal)+':'+stderr.slice(0,700));
  fs.writeFileSync(path.join(out,suite.id+'.tap'),stdout,{mode:0o600});
  logs[suite.id]=fs.readFileSync(path.join(out,suite.id+'.tap'),'utf8');
  results.push({id:suite.id,files:[...suite.files],exit_code:p.status,tap:stats,
   tap_sha256:sha(Buffer.from(stdout,'utf8'))});
 }
 const receipt={schema:'ikant-pr2-runtime-receipt/v1',
  source:{head,tree,test_blobs:source},suites:results,evidence_class:'SCOPED_NODE_TEST_EXECUTION',
  host:'local Node child processes; original source/test code',synthetic_language_port:true,
  native_provider_attested:false,human_review_attested:false,content_truth_attested:false,
  mcp_http_attested:false,mcp_restart_attested:false,product_go:false,
  dod:Object.fromEntries(Object.entries(selectors))};
 const check=verifyPr2RuntimeReceipt(receipt,logs,{expectedHead:head,expectedTree:tree});
 if(!check.ok)throw Error(check.first_edge);
 fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
 const reopened=JSON.parse(fs.readFileSync(path.join(out,'receipt.json'),'utf8'));
 const rechecked=verifyPr2RuntimeReceipt(reopened,Object.fromEntries(SUITES.map(s=>[
  s.id,fs.readFileSync(path.join(out,s.id+'.tap'),'utf8')])),{expectedHead:head,expectedTree:tree});
 if(!rechecked.ok)throw Error(rechecked.first_edge);
 return {receipt,readback:rechecked,output:out};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const opt=process.argv.find(x=>x.startsWith('--output='));
  const r=capturePr2RuntimeReceipt({destination:opt?opt.slice(9):undefined});
  process.stdout.write(JSON.stringify({status:r.readback.status,source:r.receipt.source,
   suites:r.receipt.suites.map(x=>({id:x.id,tests:x.tap.tests,sha256:x.tap_sha256})),
   unresolved_ids:r.readback.unresolved_ids,output:r.output,product_go:false})+'\n');
 }catch(e){console.error('PR2_RUNTIME_EVIDENCE_BLOCKED '+e.message);process.exitCode=1;}
}
