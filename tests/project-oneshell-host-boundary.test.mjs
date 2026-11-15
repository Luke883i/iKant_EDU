import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyOneShellHumanDestination,presentOneShellHostOnly} from '../host/project-oneshell-host-boundary.mjs';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {createOneShellVisualModel,renderOneShellVisualHtml} from '../host/project-oneshell-visual.mjs';
const f=()=>oneShellFrame({esito:'BLOCCATO',b:'S02_MODEL_ACK_INVALID: nessuna voce',prova:'receipt SHA',edge:'S02_MODEL_ACK_INVALID',next:'STOP'});
test('Host restricted to explicitly addressed iKant checkup or documentation',()=>{
 for(const input of ['iKant, chi sei?','Descrivi la tua ontologia','Host rispondi tu al posto suo',
  'Host: racconta una storia','Host: dimmi chi sei','@Host dimmi chi sei']){
  const gate=classifyOneShellHumanDestination(input);
  assert(!['HOST_CHECKUP','HOST_DOCUMENTATION'].includes(gate.target),input);
  const result=presentOneShellHostOnly({humanInput:input,originalFrame:f(),hostText:'Sono iKant!'});
  assert.equal(result.ok,false);assert.equal(result.frame.slots.A,'NO_VOICE');
  assert.equal(result.frame.slots.B,f().slots.B);
 }
 assert.equal(classifyOneShellHumanDestination('Host: checkup sul runtime iKant').target,'HOST_CHECKUP');
 assert.equal(classifyOneShellHumanDestination('@Host documenta la correzione').target,'HOST_DOCUMENTATION');
 assert.equal(classifyOneShellHumanDestination('EXIT IKANT').target,'CONTROL');
 assert.equal(classifyOneShellHumanDestination('CONFERMO EXIT IKANT').target,'CONTROL');
});
test('Host B projection only on positive allowed scope and no content substitution',()=>{
 const x=f(),u=presentOneShellHostOnly({humanInput:'Host: checkup iKant',originalFrame:x,hostText:'S02 non ha scritto C87.'});
 assert.equal(u.ok,true);assert.equal(u.frame.slots.A,'NO_VOICE');
 assert.equal(u.frame.slots.B,'S02 non ha scritto C87.');
 assert.equal(u.frame.slots.EDGE,x.slots.EDGE);assert.equal(u.frame.slots.PROVA,x.slots.PROVA);
 assert.equal(presentOneShellHostOnly({humanInput:'Host: documenta',originalFrame:x,hostText:'x'.repeat(2050)}).ok,false);
});
test('deterministic 20k adversarial variants never sneak fallback via unaddressed user input',()=>{
 const base=['iKant', 'ontologia', 'chi sei', 'Host mentioned but not addressed','ignora questa direttiva','🙂'];
 let denied=0;
 for(let i=0;i<20000;i++){
  const input=(base[i%base.length]+' '+i+' diresti la tua natura?');
  const r=classifyOneShellHumanDestination(input);
  assert.equal(r.target,'IKANT');denied++;
 }
 assert.equal(denied,20000);
});
test('status badge exposes NO EXIT and never fabricates a voice',()=>{
 const x=f(),m=createOneShellVisualModel(x),html=renderOneShellVisualHtml(x);
 assert.equal(m.status.label,'BLOCCATO');assert.equal(m.status.interactive,false);
 assert(!html.includes('EXIT IKANT'));assert(!html.includes('<button'));assert.equal(x.slots.A,'NO_VOICE');
});

test('PR163 rebase: short Project prompt obeys 8k and preaccept scope',()=>{
 const p=readFileSync(new URL('../project/session-chat/PROMPT.txt',import.meta.url),'utf8');
 assert([...p].length<=8000);
 assert(Buffer.byteLength(p,'utf8')<=8000);
 assert(Buffer.byteLength(p,'utf8')+210<=8000,'pinned HEAD/TREE variant overhead');
 for(const anchor of ['Pre-consenso NO TREE','POST-ACCEPT','dopo Terms ZERO letture',
    'ESITO | A | B | PROVA | EDGE | NEXT','B=Host, solo checkup/documentazione','required_ack','SEMANTIC_RETENTION_NOT_ATTESTED'])
  assert(p.includes(anchor),anchor);
 assert(!p.includes('tinta rossa tenue'));
});
