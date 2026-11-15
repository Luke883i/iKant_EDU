#!/usr/bin/env node
/** Authority-zero post-I ACCEPT admission from ONE originally verified source ZIP.
 * Only ORIGINAL C72/v2 can issue acceptance, introduction and mode receipts.
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const H40=/^[a-f0-9]{40}$/u;
const FIVE=Object.freeze(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
const fail=edge=>Object.freeze({ok:false,edge,original_owner_invoked:false,active:false,native_event_attested:false,authority:0});
const blob=b=>createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
const local=root=>p=>pathToFileURL(path.join(root,p)).href;
function seal(file,body){
 const b=Buffer.from(JSON.stringify(body)+'\n');
 const fd=fs.openSync(file,'wx',0o600);
 try{fs.writeFileSync(fd,b);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
 if(!fs.readFileSync(file).equals(b))throw Error('ONEZIP_RECEIPT_READBACK_FAILED');
}
export async function runOneZipOriginalAdmission(q={}){
 let attempted=false;
 try{
  if(q.schema!=='ikant-edu-onezip-admission/v1'||!['ACCEPT','EDU'].includes(q.action)||
    !H40.test(q.head||'')||q.humanTurnWitnessed!==true||q.ownerOutcome!=='NOT_INVOKED'||
    typeof q.sourceRoot!=='string'||!path.isAbsolute(q.sourceRoot)||
    typeof q.privateRoot!=='string'||!path.isAbsolute(q.privateRoot))return fail('ONEZIP_ORIGINAL_INPUT_INVALID');
  const st=fs.lstatSync(q.privateRoot);
  if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077)!==0)return fail('ONEZIP_PRIVATE_ROOT_REQUIRED');
  const source=JSON.parse(fs.readFileSync(path.join(q.sourceRoot,'.project-source-readback.json'),'utf8'));
  if(source.source_head!==q.head||!H40.test(source.source_tree||''))return fail('ONEZIP_SOURCE_LOCK_INVALID');
  const imported=local(q.sourceRoot);
  const loader=await import(imported('scripts/project-repo-loader.mjs'));
  loader.verifyLocalProjectSource(q.sourceRoot,{head:q.head,tree:source.source_tree});
  const original=await import(imported('host/c72-public-mode-admission.mjs'));
  if(q.action==='ACCEPT'){
    if(q.humanMessage!=='I ACCEPT'||q.liveHead!==q.head||
      q.distinctConsentTurnWitnessed!==true||q.firstTurnEvidence?.source_head!==q.head||
      q.firstTurnEvidence?.host_link_displayed!==true||
      q.firstTurnEvidence?.distinct_human_message_observed!==true)return fail('ONEZIP_EXACT_ACCEPT_GATE');
    const documents=FIVE.map(p=>({path:p,source_head:q.head,
      content:fs.readFileSync(path.join(q.sourceRoot,p),'utf8'),
      blob_sha1:q.firstTurnEvidence?.pinned_blob_shas?.[p]}));
    if(documents.some(d=>!H40.test(d.blob_sha1||'')||blob(Buffer.from(d.content,'utf8'))!==d.blob_sha1))
      return fail('ONEZIP_FIRST_TURN_SHA_MISMATCH');
    seal(path.join(q.privateRoot,'c72-attempt.json'),{head:q.head,action:'ACCEPT',state:'ATTEMPTED'});
    attempted=true;
    const reentry=await import(imported('host/project-c72-postaccept-reentry.mjs'));
    const result=reentry.reenterC72V2PostAccept({sourceHead:q.head,liveHead:q.liveHead,
      humanMessage:'I ACCEPT',priorTurnEvidence:q.firstTurnEvidence,documents});
    if(result.ok!==true||!original.validateC72V2Accepted(result.accepted)||
      !original.validateC72V2Orientation(result.introduction,result.accepted))
      return {...fail(result.first_edge||'ONEZIP_ORIGINAL_C72_DENIED'),original_owner_invoked:true};
    const receipt={schema:'ikant-edu-onezip-accepted/v1',head:q.head,
      accepted:result.accepted,introduction:result.introduction,original_owner_invoked:true,
      native_event_attested:false,authority:0,active:false};
    seal(path.join(q.privateRoot,'c72-accepted.json'),receipt);
    return Object.freeze({ok:true,...receipt});
  }
  if(q.humanMessage!=='EDU'||q.distinctModeTurnWitnessed!==true)
    return fail('ONEZIP_DISTINCT_EDU_GATE');
  const prior=JSON.parse(fs.readFileSync(path.join(q.privateRoot,'c72-accepted.json'),'utf8'));
  if(prior.head!==q.head||!original.validateC72V2Accepted(prior.accepted)||
     !original.validateC72V2Orientation(prior.introduction,prior.accepted))
     return fail('ONEZIP_ACCEPTANCE_READBACK_DENIED');
  seal(path.join(q.privateRoot,'c72-mode-attempt.json'),{head:q.head,action:'EDU',state:'ATTEMPTED'});
  attempted=true;
  const selection=original.selectC72V2Mode({accepted:prior.accepted,
    orientation:prior.introduction,humanMessage:'EDU'});
  if(!original.validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead:q.head}))
    return {...fail('ONEZIP_ORIGINAL_EDU_MODE_DENIED'),original_owner_invoked:true};
  const receipt={schema:'ikant-edu-onezip-selection/v1',head:q.head,selection,
    original_owner_invoked:true,native_event_attested:false,active:false,authority:0};
  seal(path.join(q.privateRoot,'c72-selection.json'),receipt);
  return Object.freeze({ok:true,...receipt});
 }catch(e){return {...fail(attempted?'ONEZIP_OWNER_OUTCOME_UNKNOWN_NO_RETRY':
   'ONEZIP_PREOWNER_STOP:'+String(e.message||'UNKNOWN').slice(0,90)),original_owner_invoked:attempted};}
}
