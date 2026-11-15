#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {executeC107Turn,inspectC107Ledger} from '../host/c107-experimental-turn.mjs';
const args=process.argv.slice(2),opt={};
for(let i=0;i<args.length;i+=2)opt[args[i]]=args[i+1];
const head=opt['--head'],file=opt['--ledger'];
if(args.length!==4||!/^([a-f0-9]{40})$/.test(head||'')||typeof file!=='string'||!path.isAbsolute(file)){
 console.log(JSON.stringify({status:'C107_STOP',first_unclosed_edge:'EXPLICIT_SOURCE_HEAD_AND_ABSOLUTE_LEDGER_REQUIRED'}));
 process.exit(2);
}
const terms=fs.readFileSync(new URL('../TERMS.md',import.meta.url),'utf8');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const CONSENT='AUTORIZZO BOZZE COHOST SPERIMENTALI NON VERIFICATE';
let phase='COLD',accepted=null,intro=null,selection=null,prior=[];
const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false});
for await(const line of rl){
 let result,voice=null;
 try{
  const frame=line.startsWith('{')?JSON.parse(line):{humanInput:line};
  const raw=frame.humanInput;
  if(typeof raw!=='string')throw Error('INPUT');
  if(phase==='COLD'){
   if(raw.toLowerCase().trim()!=='avvia ikant')throw Error('EXACT_START');
   phase='TERMS';result={status:'C107_TERMS',text:terms};
  }else if(phase==='TERMS'){
   if(raw!=='I ACCEPT')throw Error('LATER_ACCEPT');
   const offer=issueC72TermsOffer({sourceHead:head,termsDigest:sha(Buffer.from(terms,'utf8'))});
   accepted=acceptC72Terms({offer,humanMessage:raw,termsPresented:true});
   intro=presentC72Introduction(accepted);phase='MODE';result={status:'C107_INTRO',text:intro.text};
  }else if(phase==='MODE'){
   if(raw!=='EXPERIMENTAL')throw Error('EXPERIMENTAL_ONLY');
   selection=selectC72Mode({accepted,orientation:intro,humanMessage:raw});
   phase='OPTIN';result={status:'C107_EXPERIMENTAL_SELECTED',next:CONSENT};
  }else if(raw==='STOP BOZZE COHOST'){
   prior=[];phase='OPTIN';result={status:'C107_OPTIN_REVOKED'};
  }else if(phase==='OPTIN'){
   if(raw!==CONSENT)throw Error('SEPARATE_OPTIN_REQUIRED');
   phase='READY';result={status:'C107_LOCAL_READY_NOT_NATIVE'};
  }else if(phase==='READY'){
   if(raw==='ESCI LAB'){phase='CLOSED';result={status:'C107_LOCAL_CLOSED'};}
   else if(raw==='GET LEDGER'){result=inspectC107Ledger(file);}
   else{
    const nonce=crypto.randomUUID();
    const r=executeC107Turn({ledgerFile:file,nonce,
     request:{sourceHead:head,selection,humanInput:raw,optIn:true,modelCandidate:frame.modelCandidate},
     priorMessages:prior,resetContext:prior.length===0});
    if(r.status!=='C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK')result=r;
    else{
     const check=inspectC107Ledger(file);
     if(check.status!=='C107_LEDGER_REOPENED'||check.last_hash!==r.ledger_event_sha256)
      throw Error('INDEPENDENT_LEDGER_MISMATCH');
     prior=[...prior,raw].slice(-4);voice=r.voice_utf8;
     const {voice_utf8,...evidence}=r;result=evidence;
    }
   }
  }else result={status:'C107_STOP',first_unclosed_edge:'SESSION_CLOSED'};
 }catch(e){result={status:'C107_STOP',first_unclosed_edge:'SHELL_'+String(e.message||e).slice(0,70)};}
 if(voice!==null)process.stdout.write(voice+'\n');
 if(result.text)process.stdout.write(result.text+'\n');
 const {text,...meta}=result;process.stdout.write('iKant[LAB] '+JSON.stringify(meta)+'\n');
 if(phase==='CLOSED')break;
}
