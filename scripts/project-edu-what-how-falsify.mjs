#!/usr/bin/env node
/** Reproducible host policy: 10k original C72 JS admissions and 100k adversarial
 * envelopes, NOT 10k Node workers or native ChatGPT/LLM calls. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createOneShellAdmissionFlow} from '../host/project-oneshell-phases.mjs';
import {planOneShellEduSource} from '../host/project-oneshell-edu.mjs';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,
 presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
const COUNT=Number(process.argv[2]||10000);
if(![10000,100000].includes(COUNT))throw Error('EXACT_10K_OR_100K_REQUIRED');
const SEED=0x103c72ea;let state=SEED;
const rand=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;};
const H='a'.repeat(40),hash=x=>createHash('sha256').update(x).digest('hex');
const offer=issueC72V2LinkedTermsOffer({sourceHead:H,termsDigest:hash('Terms fixture')});
const accepted=acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
const intro=presentC72V2Introduction(accepted);
const good=selectC72V2Mode({accepted,orientation:intro,humanMessage:'EDU'});
const canonical=selectC72V2Mode({accepted,orientation:intro,humanMessage:'CANONICAL'});
const sources=['SOURCE_ABSENT','PARTIAL_SOURCE_ONLY','SOURCE_UNKNOWN','FULL_SOURCE_VERIFIED'];
const bridges=['UNKNOWN','AVAILABLE','DEFINITIVELY_UNAVAILABLE'];
const manuals=['AUTO','EXPLICIT_MANUAL_POST_EDU'];
const firsts=['iniziamo','avvia iKant','ciao','I ACCEPT','EDU','Host: audit',''];
const trace=createHash('sha256'),rows=[];let errors=0,positives=0,stops=0,manualsCount=0,transitions=0;
const decisions={};
function oracle(valid,source,bridge,manual,node,extract){
 if(!valid||!node)return 'STOP';
 if(source==='FULL_SOURCE_VERIFIED')return 'START_C135_EDU';
 if(source==='SOURCE_UNKNOWN')return 'VERIFY_SOURCE';
 if(manual==='EXPLICIT_MANUAL_POST_EDU')return extract?'UPLOAD_PINNED_SOURCE_ZIP':'STOP';
 if(bridge==='UNKNOWN')return 'VERIFY_MACHINE_BRIDGE';
 if(bridge==='AVAILABLE')return 'API_TREE_SOURCE_MATERIALIZATION';
 return extract?'UPLOAD_PINNED_SOURCE_ZIP':'STOP';
}
for(let i=0;i<COUNT;i++){
 const a=rand(),b=rand(),c=rand();
 const source=sources[(a>>>1)%4],bridge=bridges[(b>>>4)%3],
 manual=manuals[(a>>>8)%2],node=(c&1)===1,extract=(c&2)===2;
 let valid=true,selection=good,phase='SELECTED';
 if(COUNT===10000){
  const flow=createOneShellAdmissionFlow({head:H,termsUtf8:'Terms fixture'});
  const first=flow.advance({humanMessage:firsts[(a>>>14)%firsts.length]});
  if(first.slots.NEXT!=='AWAIT_I_ACCEPT'||first.slots.A!=='NO_VOICE')errors++;
  const consent=(b&7)===0?'I ACCEPT ':'I ACCEPT',link=(b&15)!==1;
  const receipt=flow.advance({humanMessage:consent,termsLinkPresented:link});
  valid=consent==='I ACCEPT'&&link;
  if(valid){
   if(receipt.slots.NEXT!=='AWAIT_EDU')errors++;
   const mode=(c&15)===0?'CANONICAL':'EDU';
   const state=flow.advance({humanMessage:mode});selection=flow.selection();
   valid=mode==='EDU';if(state.slots.NEXT!==(valid?'VERIFY_SOURCE':'STOP'))errors++;
   transitions++;
  }else if(receipt.slots.NEXT!=='STOP')errors++;
  if(!valid){phase='C72_BLOCKED';selection=null;}
 }else{
  const fault=(a>>>11)%11;
  if(fault===0){selection={...good,receipt_sha256:'f'.repeat(64)};valid=false;phase='RECEIPT_TAMPER';}
  else if(fault===1){selection=canonical;valid=false;phase='WRONG_MODE';}
  else if(fault===2){selection=null;valid=false;phase='NO_CONSENT';}
  else if(fault===3){selection={...good,source_head:'f'.repeat(40)};valid=false;phase='SOURCE_DRIFT';}
 }
 const next=planOneShellEduSource({selection,sourceState:source,bridgeState:bridge,
  manualRoute:manual,nodeReady:node,manualExtractorReady:extract}).slots.NEXT;
 const want=oracle(valid,source,bridge,manual,node,extract);
 if(next!==want)errors++;
 if(next==='UPLOAD_PINNED_SOURCE_ZIP'&&(!valid||!node||!extract||
 source==='FULL_SOURCE_VERIFIED'||source==='SOURCE_UNKNOWN'||
 (manual!=='EXPLICIT_MANUAL_POST_EDU'&&bridge!=='DEFINITIVELY_UNAVAILABLE')))errors++;
 if(next==='START_C135_EDU'&&(!valid||source!=='FULL_SOURCE_VERIFIED'))errors++;
 if(next==='STOP')stops++;else positives++;
 if(next==='UPLOAD_PINNED_SOURCE_ZIP')manualsCount++;
 decisions[next]=(decisions[next]||0)+1;
 const row=JSON.stringify({i,phase,source,bridge,manual,node,extract,valid,next,want});
 trace.update(row+'\n');rows.push(row);
}
const result={schema:'ikant-le-edu-what-how-falsification/v1',seed:SEED.toString(16),
 cases:COUNT,kind:COUNT===10000?'C72_ORIGINAL_JS_FULL_SEMANTIC_GATE':'ADVERSARIAL_FINITE_HOST_POLICY',
 original_admission_transitions:transitions,positives,stops,manuals:manualsCount,
 distinct_case_envelopes:COUNT,distinct_structural_states_not_claimed:true,
 decisions:Object.fromEntries(Object.entries(decisions).sort()),
 discrepancies:errors,trace_sha256:trace.digest('hex'),
 limits:'FINITE_HOST_POLICY_NOT_NODE_OR_C135_PER_CASE_NOT_NATIVE_PROVIDER_OR_LLM'};
if(process.env.IKANT_EDU_ROUTE_TRACE_DIR){
 const dir=path.resolve(process.env.IKANT_EDU_ROUTE_TRACE_DIR);
 if(!fs.statSync(dir).isDirectory())throw Error('TRACE_DIR_REQUIRED');
 const suffix=COUNT===10000?'10k':'100k',dest=path.join(dir,'edu-what-how-'+suffix+'.jsonl.gz');
 if(fs.existsSync(dest))throw Error('FRESH_TRACE_DEST_REQUIRED');
 const raw=Buffer.from(rows.join('\n')+'\n','utf8'),gz=gzipSync(raw,{level:6,mtime:0});
 fs.writeFileSync(dest,gz,{flag:'wx',mode:0o600});
 if(!gunzipSync(fs.readFileSync(dest)).equals(raw))throw Error('TRACE_READBACK_MISMATCH');
 result.gzip_sha256=hash(gz);result.raw_sha256=hash(raw);result.trace_rows=rows.length;
 const summary=path.join(dir,'edu-what-how-'+suffix+'.json');
 fs.writeFileSync(summary,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 if(JSON.parse(fs.readFileSync(summary,'utf8')).trace_rows!==COUNT)throw Error('SUMMARY_READBACK_MISMATCH');
}
process.stdout.write(JSON.stringify(result)+'\n');if(errors)process.exitCode=1;
