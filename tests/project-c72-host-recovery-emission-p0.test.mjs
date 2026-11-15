import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {planC72HostRecovery} from '../host/project-c72-host-recovery.mjs';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {emitVerifiedHostOneShell} from '../host/project-oneshell-emission.mjs';
const H='b6dc3f6e22149ef9f96348ce8e677af034cd2377f26450af18d51bc5c43ae633';
const inputs=['I ACCEPT','I ACCEPT\n','EDU','Scelgo EDU','CANONICAL','ciao','\0',' I ACCEPT','I ACCEPT\t','EXIT IKANT'];
const cases=['CATALOG_EMPTY','NODE_UNKNOWN','NODE_AVAILABLE','NODE_ABSENT_PROVED','API_UNKNOWN','API_AVAILABLE','API_ABSENT_PROVED','PRIOR_WITNESS_MISSING','RECEIPT_UNKNOWN','RECEIPT_VERIFIED'];
const presentations=['LIGHT','DARK','NARROW','MOBILE','HTML_INJECTION','LONG_TEXT','UTF8','STOP','READY','HOST_DOC'];
test('P0 exactly one official SVG in the repository-controlled final HTML emission',()=>{
 const frame=oneShellFrame({esito:'ORIENTATION',b:'<script>unsafe</script> 🔐',prova:'immutable',edge:'C72_PENDING',next:'AWAIT_I_ACCEPT'});
 const r=emitVerifiedHostOneShell(frame);
 assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.brand_sha256,H);assert.equal(r.brand_attested,true);
 assert.equal(r.native_avatar_attested,false);assert.equal(r.native_delivery_attested,false);
 assert(r.content.indexOf('ikant-brand-mark')<r.content.indexOf('<strong>iKant · OneShell</strong>'));
 assert.equal((r.content.match(/class="ikant-brand-mark"/g)||[]).length,1);
 assert.equal((r.content.match(/data-slot=/g)||[]).length,6);
 assert(r.content.includes('&lt;script&gt;'));assert(!r.content.includes('<script>'));
 const text=emitVerifiedHostOneShell(frame,{format:'TEXT'});
 assert.equal(text.ok,true);assert.equal(text.brand_attested,false);assert.equal(text.brand_state,'TEXT_FALLBACK_NO_SVG');
 assert.equal(emitVerifiedHostOneShell(frame,{format:'BMP'}).ok,false);
 assert.equal(emitVerifiedHostOneShell({...frame,slots:{...frame.slots,A:'invented owner'}}).ok,false);
});
test('human experience: exact consent, automatic diagnosis and no fake owner receipt',()=>{
 const good={freshHumanTurn:true,humanMessage:'I ACCEPT',termsLinkShown:true,priorSourceWitness:true,
   node:'AVAILABLE',apiTransport:'AVAILABLE',catalog:'EMPTY'};
 const a=planC72HostRecovery(good);
 assert.equal(a.kind,'AUTO');assert.equal(a.action,'INVOKE_PINNED_C72_POSTACCEPT_REENTRY');
 assert.equal(a.original_receipt_issued,false);
 for(const m of ['Scelgo EDU','EDU','I ACCEPT\n','ciao']){
  const d=planC72HostRecovery({...good,humanMessage:m});
  assert.equal(d.kind,'HUMAN_GATE');assert.equal(d.action,'AWAIT_I_ACCEPT');
 }
 const pending=planC72HostRecovery({...good,phase:'ACCEPTANCE_PENDING',ownerOutcome:'UNKNOWN'});
 assert.equal(pending.kind,'STOP');assert.equal(pending.edge,'C72_OWNER_OUTCOME_UNKNOWN');
 const unavailable=planC72HostRecovery({...good,node:'UNAVAILABLE_VERIFIED'});
 assert.equal(unavailable.kind,'STOP');assert.match(unavailable.human_next,/Nessuna azione tecnica richiesta a te/);
 const mode=planC72HostRecovery({phase:'AWAIT_MODE',ownerAcceptanceVerified:true,
 freshHumanTurn:true,humanMessage:'Scelgo EDU'});
 assert.equal(mode.action,'AWAIT_EDU');
 assert.equal(planC72HostRecovery({...good,catalog:'EMPTY',node:'UNKNOWN'}).action,'VERIFY_NODE_20');
});
test('1000 executed adversarial E2E combinations: recovery + canonical glyph + trace readback',()=>{
 const svg=readFileSync(new URL('../assets/brand/ikant-light.svg',import.meta.url));
 assert.equal(createHash('sha256').update(svg).digest('hex'),H);
 let successes=0,notYet=0,denials=0;const seen=new Set(),traces=[];
 for(let i=0;i<1000;i++){
  const a=i%10,b=Math.floor(i/10)%10,c=Math.floor(i/100)%10;
  const phrase=inputs[a],scenario=cases[b],surface=presentations[c];
  const raw={phase:'AWAIT_ACCEPTANCE',humanMessage:phrase,freshHumanTurn:true,termsLinkShown:true,
   priorSourceWitness:true,node:'AVAILABLE',apiTransport:'AVAILABLE',catalog:'EMPTY'};
  if(scenario==='NODE_UNKNOWN')raw.node='UNKNOWN';
  if(scenario==='NODE_ABSENT_PROVED')raw.node='UNAVAILABLE_VERIFIED';
  if(scenario==='API_UNKNOWN')raw.apiTransport='UNKNOWN';
  if(scenario==='API_ABSENT_PROVED')raw.apiTransport='UNAVAILABLE_VERIFIED';
  if(scenario==='PRIOR_WITNESS_MISSING')raw.priorSourceWitness=false;
  if(scenario==='RECEIPT_UNKNOWN')raw.ownerOutcome='UNKNOWN';
  if(scenario==='RECEIPT_VERIFIED')raw.ownerAcceptanceVerified=true;
  const decision=planC72HostRecovery(raw);
  assert(['AUTO','STOP','HUMAN_GATE'].includes(decision.kind));
  if(scenario==='CATALOG_EMPTY'&&phrase==='I ACCEPT')assert.equal(decision.action,'INVOKE_PINNED_C72_POSTACCEPT_REENTRY');
  if(decision.kind==='AUTO')successes++;else if(decision.kind==='HUMAN_GATE')notYet++;else denials++;
  assert.equal(decision.native_event_attested,false);assert.equal(decision.original_receipt_issued,false);
  assert(!decision.human_next.includes('verificare il gateway'));
  const escaped=surface==='HTML_INJECTION'?'<script>alert(1)</script>':surface==='UTF8'?'🤖 Ω 👤':'scenario '+surface;
  const f=oneShellFrame({esito:decision.kind==='STOP'?'BLOCCATO':'ORIENTATION',
   b:decision.human_next+' '+escaped,prova:'case:'+i,
   edge:decision.edge,next:decision.kind==='AUTO'?'VERIFY_NODE_20':decision.action==='AWAIT_I_ACCEPT'?'AWAIT_I_ACCEPT':'STOP'});
  const view=emitVerifiedHostOneShell(f);
  assert.equal(view.ok,true,JSON.stringify({i,edge:view.first_edge}));
  assert.equal(view.brand_sha256,H);assert.equal(view.brand_attested,true);
  assert.equal((view.html.match(/class="ikant-brand-mark"/g)||[]).length,1);
  assert.equal((view.html.match(/data-slot=/g)||[]).length,6);
  assert(!view.html.includes('<button'));assert(!view.html.includes('<script>'));
  assert.equal(f.slots.A,'NO_VOICE');
  const evidence={index:i,phrase,scenario,surface,edge:decision.edge,
   action:decision.action,kind:decision.kind,glifo_sha256:view.brand_sha256,
   html_sha256:view.content_sha256,slots:6,native_claim:false};
  const key=[phrase,scenario,surface].join('|');assert(!seen.has(key));seen.add(key);
  traces.push(JSON.stringify(evidence));
 }
 assert.equal(successes+notYet+denials,1000);assert.equal(seen.size,1000);
 const bytes=traces.join('\n')+'\n',hash=createHash('sha256').update(bytes).digest('hex');
 const dir=process.env.IKANT_P0_TRACE_DIR;
 if(dir){mkdirSync(dir,{recursive:true});const file=join(dir,'p0-c72-brand-1000.jsonl');
  writeFileSync(file,bytes,{flag:'wx'});assert.equal(readFileSync(file,'utf8'),bytes);
  const receipt={schema:'ikant-le-host-p0-adversarial/v1',cases:1000,
   completed:{auto:successes,human_gate:notYet,stopped:denials},trace_sha256:hash,
   native_chatgpt_runs:0,brand_verified:true,original_c72_receipt_issued:false};
  const target=join(dir,'RECEIPT.json');writeFileSync(target,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  assert.deepEqual(JSON.parse(readFileSync(target,'utf8')),receipt);}
 console.log('P0_ADVERSARIAL_1000_SHA256='+hash+' AUTO='+successes+' HUMAN='+notYet+' STOP='+denials);
});
