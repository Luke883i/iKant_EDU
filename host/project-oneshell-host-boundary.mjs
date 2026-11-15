/** Post-EDU HOST scope: only explicit iKant checkup or explicit HOST documentation.
 * No language answer fallback on original owner stop; no new iKant authority.
 */
import {oneShellFrame,renderOneShell} from './project-oneshell-edu.mjs';
import {emitVerifiedHostOneShell} from './project-oneshell-emission.mjs';
const check=/(?:checkup|audit|stato|diagnos|problemi|error[ei]|rifiut|bootstrap|runtime|ledger|verific|ricevut|sorgent|preflight|perch[eé])/iu;
const docs=/(?:documenta|documentazione|specifica|contrattualizz|formalizz|requisit|pr\b|patch|test|dod\b|metric|checklist|falsific|rifattorizz)/iu;
export function classifyOneShellHumanDestination(input){
 if(typeof input!=='string'||input.length>16000)return Object.freeze({target:'DENIED',edge:'HUMAN_INPUT_INVALID'});
 if(['EXIT IKANT','CONFERMO EXIT IKANT','ANNULLA EXIT IKANT'].includes(input))
  return Object.freeze({target:'CONTROL',edge:'ORIGINAL_EXIT_PROTOCOL'});
 const explicit=/^(?:Host:|@Host\s+)/u.exec(input);
 if(!explicit){return Object.freeze({target:'IKANT',edge:'ORIGINAL_C135_REQUIRED'});}
 const body=input.slice(explicit[0].length).trim();
 if(!body)return Object.freeze({target:'DENIED',edge:'HOST_EMPTY_REQUEST'});
 if(/ikant/iu.test(body)&&check.test(body))
  return Object.freeze({target:'HOST_CHECKUP',edge:'HOST_DIAGNOSTIC_ONLY'});
 if(docs.test(body))return Object.freeze({target:'HOST_DOCUMENTATION',edge:'HOST_EXPLICIT_DOCUMENTATION_ONLY'});
 return Object.freeze({target:'DENIED',edge:'HOST_SCOPE_DENIED'});
}
export function presentOneShellHostOnly({humanInput,originalFrame,hostText}={}){
 renderOneShell(originalFrame);
 const gate=classifyOneShellHumanDestination(humanInput);
 if(gate.target!=='HOST_CHECKUP'&&gate.target!=='HOST_DOCUMENTATION')
  return Object.freeze({ok:false,target:gate.target,edge:gate.edge,frame:originalFrame});
 if(originalFrame.slots.A!=='NO_VOICE')return Object.freeze({ok:false,target:gate.target,
  edge:'HOST_CANNOT_REPLACE_OWNER_VOICE',frame:originalFrame});
 if(typeof hostText!=='string'||!hostText.trim()||Buffer.byteLength(hostText,'utf8')>2048)
  return Object.freeze({ok:false,target:gate.target,edge:'HOST_TEXT_REQUIRES_REOPENED_ANNEX',frame:originalFrame});
 const frame=oneShellFrame({esito:originalFrame.slots.ESITO,b:hostText,
  prova:originalFrame.slots.PROVA,edge:originalFrame.slots.EDGE,next:originalFrame.slots.NEXT});
 const emission=emitVerifiedHostOneShell(frame);
 if(emission.ok!==true)return Object.freeze({ok:false,target:gate.target,edge:emission.first_edge,frame});
 return Object.freeze({ok:true,target:gate.target,edge:'NONE',frame,emission});
}
