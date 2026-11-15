#!/usr/bin/env node
/** 2048 deterministic structural masks; never 2048 provider/chat/model sessions. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createHash} from 'node:crypto';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {materializeOneShellFocusApp} from '../host/project-oneshell-focus-app.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-focus-2048-'));fs.chmodSync(root,0o700);
const trace=createHash('sha256');let accepted=0,rejected=0,errors=0;const seed=20261029;
try{
 for(let i=0;i<2048;i++){
  const mask=(Math.imul(i,1103515245)+seed)>>>0,valid=(mask&7)===0;
  const dir=path.join(root,String(i));fs.mkdirSync(dir,{mode:0o700});
  const b='Scelta umana & <script>forged</script> '+i+' '+('Q'.repeat(mask%19));
  const original=oneShellFrame({esito:'EDU',b,prova:'Evidence '+hash(b),edge:'FIRST_EDGE',next:'STOP'});
  const frame=valid?original:{...original,voice_origin:'HOST_BOUND_LOCAL',slots:{...original.slots,A:'FAKE_IKANT'},original_voice_sha256:'a'.repeat(64)};
  const r=materializeOneShellFocusApp({frame,outputDirectory:dir,reportName:'r'+i});
  if(r.ok){accepted++;if(!valid||r.native_ui_attested!==false||r.persistent_ui_attested!==false||
    hash(fs.readFileSync(r.app_path))!==r.app_sha256||hash(fs.readFileSync(r.report_path))!==r.report_sha256)errors++;}
  else{rejected++;if(valid||r.voice!=='NO_VOICE'||fs.existsSync(path.join(dir,'r'+i+'.html')))errors++;}
  trace.update([i,mask,valid,r.ok,r.ok?r.app_sha256:r.edge].join('|')+'\n');
 }
}finally{fs.rmSync(root,{recursive:true,force:true});}
const result={schema:'ikant-oneshell-e12-focus-falsification/v1',seed,structural_cases:2048,accepted,rejected,errors,trace_sha256:trace.digest('hex'),model_calls:0,native_client_sessions:0,pass:errors===0};
console.log(JSON.stringify(result,null,2));if(errors)process.exitCode=1;
