#!/usr/bin/env node
/** PR251 causal negative-evidence oracle.
 * This is an independent classifier of the *existing* counterfactual receipts.
 * It cannot run target oracles, grant source deletion or promote product authority.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const HEX40=/^[0-9a-f]{40}$/;
const fail=(message)=>{throw new Error('PR251_CAUSAL_ORACLE_'+message);};
function gate(g) {
  if(!g||typeof g!=='object'||!('exit_code' in g))fail('MISSING_NATIVE_GATE');
  const c=g.exit_code;
  if(c==='TIMEOUT')return 'UNKNOWN';
  if(!Number.isInteger(c)||c<0||c>255)fail('INVALID_EXIT_CODE');
  return c===0?'PASS':'FAIL';
}
function nativePair(row) {
  if(!row||typeof row!=='object'||!row.gates)fail('MISSING_NATIVE_PAIR');
  return {native:gate(row.gates.native),contract:gate(row.gates.contract)};
}
function testedPass(row){
  const r=nativePair(row);
  if(typeof row.pass!=='boolean'||row.pass!==(r.native==='PASS'&&r.contract==='PASS'))
    fail('FORGED_PASS:'+String(row.key??'?'));
  return r;
}
function validSourcePath(p){
  return typeof p==='string'&&p.length>0&&!p.includes('\\')&&
    !p.startsWith('/')&&!p.split('/').some(x=>x==='..'||x==='.'||x==='');
}
/** Input is the exact GitHub-hosted adaptive JSON; this function does not trust workflow success. */
export function certifyCounterfactual(report, radicalVerdict) {
  if(!report||report.schema!=='ikant-pr251-adaptive-counterfactual/v1'||
    !HEX40.test(report.head||'')||!HEX40.test(report.tree||'')||
    report.external_unknown!==true||report.product_go!==false||
    report.global_equivalence!=='NOT_ATTESTED'||!Number.isInteger(report.candidate_total)||
    report.candidate_total<0||!Array.isArray(report.strata)||!Array.isArray(report.accepted))
    fail('REPORT_SCOPE_OR_AUTHORITY');
  if(!['REJECTED_BY_NATIVE_OR_CONTRACT','NATIVE_PASS_EXTERNAL_UNKNOWN'].includes(radicalVerdict))
    fail('UNKNOWN_RADICAL_VERDICT');
  if(report.baseline?.key!=='baseline'||report.baseline.removed!==0||
    report.baseline.bytes!==0||testedPass(report.baseline).native!=='PASS'||
    report.baseline.pass!==true)
    fail('NONQUALIFIED_BASELINE');
  const seenKeys=new Set(),classified=[];
  for(const row of report.strata){
    if(typeof row.key!=='string'||!row.key||seenKeys.has(row.key)||
      !Number.isInteger(row.group_files)||row.group_files<0||
      !Number.isInteger(row.removed)||row.removed<0||
      !Number.isInteger(row.bytes)||row.bytes<0)fail('INVALID_STRATUM');
    seenKeys.add(row.key);
    const outcomes=testedPass(row);
    classified.push({key:row.key,removed:row.removed,bytes:row.bytes,
      ...outcomes,acceptance:row.pass?'PASS_NATIVE_BOUNDED':'REJECTED_OR_UNOBSERVED'});
  }
  const paths=new Set();let sumBytes=0;
  for(const a of report.accepted){
    if(!a||!validSourcePath(a.path)||paths.has(a.path)||
      !Number.isInteger(a.bytes)||a.bytes<0)fail('INVALID_ACCEPTED_PATH');
    paths.add(a.path);sumBytes+=a.bytes;
  }
  if(report.accepted_files!==paths.size||report.accepted_bytes!==sumBytes||
    report.accepted_files>report.candidate_total)fail('FORGED_ACCEPTANCE_COUNTS');
  if(report.strata.length===0&&report.accepted_files!==0)fail('UNTESTED_ACCEPTANCE');
  if(report.accepted_files>0&&!report.strata.some(x=>x.pass===true))
    fail('ACCEPTED_WITHOUT_POSITIVE_STRATUM');
  return {schema:'ikant-pr251-causal-counterfactual-certificate/v1',
    head:report.head,tree:report.tree,baseline:'PASS_NATIVE_AND_CONTRACT',
    radical_cut:radicalVerdict,adaptive_strata:classified,
    accepted_files:report.accepted_files,accepted_bytes:report.accepted_bytes,
    accepted_status:report.accepted_files>0?'BOUNDED_NATIVE_ONLY':'NO_POSITIVE_CUT',
    external_consumers:'UNKNOWN',behavioral_equivalence:'NOT_ATTESTED',
    independent_owner_review:'NOT_ATTESTED',global_dod:'HOLD',
    product_go:false,authorized_deletion:false,
    witness_type:'RECLASSIFIED_EXISTING_CI_REPORT_NOT_NEW_EXECUTION'};
}
function signature(items){
  return crypto.createHash('sha256').update(JSON.stringify(items)).digest('hex');
}
/** Zeller-style delta debugging plus a final one-deletion check.
 * FAIL means the original counterexample reproduced. UNKNOWN is never PASS.
 * ONE_MINIMAL is relative to the tested oracle, never global or external equivalence.
 */
export async function minimizeFailure(items, oracle, {maxProbes=64}={}) {
  if(!Array.isArray(items)||!items.length||items.some(x=>typeof x!=='string'||!x)||
     new Set(items).size!==items.length||typeof oracle!=='function'||
     !Number.isInteger(maxProbes)||maxProbes<2||maxProbes>1024)
    fail('INVALID_DDMIN_ARGUMENTS');
  const cache=new Map(),observations=[];
  let uncertain=false;
  async function check(group) {
    const digest=signature(group);
    if(cache.has(digest))return cache.get(digest);
    if(observations.length>=maxProbes)return 'BUDGET';
    const result=await oracle([...group]);
    if(!['PASS','FAIL','UNKNOWN'].includes(result))fail('INVALID_ORACLE_OUTCOME');
    if(result==='UNKNOWN')uncertain=true;
    const row={sha256:digest,count:group.length,result};
    observations.push(row);cache.set(digest,result);
    return result;
  }
  let current=[...items],initial=await check(current);
  if(initial!=='FAIL')return {schema:'ikant-pr251-ddmin/v1',status:'NOT_REPRODUCED',
    input_count:items.length,kernel:[],observations,global_dod:'HOLD',product_go:false};
  let n=2, budget=false;
  while(current.length>=2) {
    let reduced=false;
    const parts=[];
    for(let i=0;i<n;i++){
      const start=Math.floor(i*current.length/n),end=Math.floor((i+1)*current.length/n);
      if(start<end)parts.push({start,end,subset:current.slice(start,end)});
    }
    for(const part of parts) {
      const complement=current.filter((_,i)=>i<part.start||i>=part.end);
      if(!complement.length)continue;
      const verdict=await check(complement);
      if(verdict==='BUDGET'){budget=true;break;}
      if(verdict==='FAIL'){current=complement;n=Math.max(2,n-1);reduced=true;break;}
    }
    if(budget)break;
    if(!reduced)for(const part of parts) {
      const verdict=await check(part.subset);
      if(verdict==='BUDGET'){budget=true;break;}
      if(verdict==='FAIL'){current=part.subset;n=2;reduced=true;break;}
    }
    if(budget)break;
    if(reduced)continue;
    if(n>=current.length)break;
    n=Math.min(current.length,n*2);
  }
  // Do not call a subset one-minimal without confirming every single deletion.
  let verified=false;
  if(!budget){
    verified=true;
    for(let i=0;i<current.length;i++){
      const r=await check(current.filter((_,j)=>j!==i));
      if(r==='BUDGET'){budget=true;verified=false;break;}
      if(r!=='PASS'){verified=false;uncertain=true;break;}
    }
  }
  return {schema:'ikant-pr251-ddmin/v1',
    status:budget?'INCONCLUSIVE_BUDGET':uncertain||!verified?'INCONCLUSIVE_UNKNOWN':'ONE_MINIMAL_FAILURE_KERNEL',
    input_count:items.length,kernel:current,kernel_sha256:signature(current),
    observations,probes:observations.length,global_minimum_proven:false,
    original_native_oracle_independent:false,external_consumers:'UNKNOWN',
    global_dod:'HOLD',product_go:false,authorized_deletion:false};
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
  try {
    if(process.argv.length!==5)fail('USAGE_REPORT_VERDICT_OUTPUT');
    const [, ,reportPath,verdictPath,outPath]=process.argv;
    const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
    const verdict=fs.readFileSync(verdictPath,'utf8').trim();
    const liveHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
    const liveTree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
    if(report.head!==liveHead||report.tree!==liveTree)fail('STALE_CANDIDATE_SHA');
    const cert=certifyCounterfactual(report,verdict);
    fs.writeFileSync(outPath,JSON.stringify(cert,null,2)+'\n');
    const sentence='PR251 counterfactual: radical='+cert.radical_cut+
      ', adaptive='+cert.accepted_status+', accepted='+cert.accepted_files+
      ', G0='+cert.global_dod+', external='+cert.external_consumers;
    process.stdout.write(sentence+'\n');
    if(process.env.GITHUB_STEP_SUMMARY)
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### Causal experiment (not a product gate)\n\n'+sentence+'\n\n');
  }catch(error){process.stderr.write(String(error.stack||error)+'\n');process.exitCode=1;}
}
