#!/usr/bin/env node
/** Seeded structural falsification, not model/provider conversations. */
import {createHash} from 'node:crypto';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {makeOneShellChatPresentation} from '../host/project-oneshell-chat-presentation.mjs';
const seed=20261029,trace=createHash('sha256');
let pass=0,reject=0,fail=0;
for(let i=0;i<4096;i++){
 const n=(Math.imul(i+seed,1664525)+1013904223)>>>0;
 const f=oneShellFrame({esito:'BLOCCATO',b:'Host <script> '+(n%10000),prova:'SHA '+n,
  edge:'UNVERIFIED',next:'STOP'});
 const tampered=(n&3)===0;
 const input=tampered?{...f,slots:{...f.slots,A:'IO_SONO_IKANT'},voice_origin:'HOST_BOUND_LOCAL',
  original_voice_sha256:'a'.repeat(64)}:f;
 const r=makeOneShellChatPresentation({frame:input,humanInput:i%5?'Domanda':'Host: checkup su iKant'});
 if(tampered){
  if(r.ok||r.voice!=='NO_VOICE')fail++;else reject++;
 }else if(!r.ok||r.native_ui_attested!==false||r.slots.A!=='NO_VOICE'||
  r.view.B!==f.slots.B||r.render_plan.focus!=='A'||r.render_plan.compression.A!=='NEVER'||
  r.markdown_fallback_utf8.includes('<script>'))fail++;else pass++;
 trace.update([i,n,tampered,r.ok,r.ok?r.markdown_sha256:r.edge].join('|')+'\n');
}
const result={schema:'ikant-e13-chat-falsification/v1',seed,structural_cases:4096,pass,reject,fail,
 trace_sha256:trace.digest('hex'),actual_model_calls:0,provider_native_ui_tests:0};
console.log(JSON.stringify(result));if(fail)process.exitCode=1;
