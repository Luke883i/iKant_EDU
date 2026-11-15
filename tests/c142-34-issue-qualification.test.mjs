import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {qualifyC142} from '../scripts/c142-34issue-qualify.mjs';
import {arbitrateC141} from '../host/c141-semantic-shadow.mjs';
import {qualifyC142OwnerGuard} from '../host/c142-semantic-owner-guard.mjs';
const arb=(humanInput,openScope=true)=>qualifyC142OwnerGuard({humanInput,c141Decision:arbitrateC141({humanInput,c107Family:'SELF_ONTOLOGY',c132Route:'GENERAL_ONTOLOGY',openScope,physicalLimitBytes:12000})});
test('C142: 34 issue references and 14 external exclusions are exact, without false fix claims',()=>{
 const x=qualifyC142();assert.deepEqual(x.violations,[]);
 assert.equal(x.status,'SOURCE_TRACE_COVERED_NOT_ISSUE_CLOSED');
 assert.deepEqual([x.scoped,x.fixed_bounded,x.mitigated_open,x.baseline_retained,x.external_excluded],[34,3,14,17,14]);
});
test('C142: even with C132 GENERAL_ONTOLOGY, cross-language first-person identity keeps frozen C114 owner',()=>{
 for(const text of ['¿Tienes conciencia?','¿Eres consciente?','Qui es-tu?','Es-tu consciente?',
   'Bist du bewusst?','Hast du Bewusstsein?', 'Você tem consciência?', 'Quem é você?',
   'Hai una vita interiore?', 'Tu provi sensazioni?']) {
    const r=arb(text);assert.equal(r.status,'OWNER_RETAINED',text);assert.equal(r.route,'C114_OWNER',text);
   }
});
test('C142: long cross-language self-identity remains typed STOP before C87, no fake C114 execution',()=>{
 for(const q of ['¿Tienes conciencia?', 'Hast du Bewusstsein?', 'Tu provi esperienze?']){
  const r=arb(q+' Esamina la questione epistemologica '.repeat(25));
  assert.equal(r.status,'STOP',q);assert.equal(r.code,'C141_LONG_IDENTITY_OWNER_GAP',q);
  assert.equal(r.original_c70_executed,false,q);
 }
});
test('C142: general consciousness and scientific epistemology stay eligible for topic-neutral open scope',()=>{
 for(const q of ['La coscienza negli insetti ha prove riproducibili?',
 'Quale rapporto hanno previsione e verità per una teoria falsa?',
 '¿Qué sabemos de la conciencia de los pulpos?',
 'Ist Bewusstsein beim Menschen messbar?']){
  const r=arb(q);assert.equal(r.route,'C140_OPEN_EDU_CANDIDATE',q);assert.equal(r.c132_authority,false,q);
 }
});
test('C142: exact budget denies oversize without truncation and does not grant persistence',()=>{
 const r=arb('x'.repeat(12001));assert.equal(r.status,'STOP');
 assert.equal(r.code,'C141_EXACT_INPUT_REQUIRES_BUDGET_NEGOTIATION');
 const audit=qualifyC142();assert.equal(audit.native_event_attested,false);
 assert.equal(audit.universal_semantics_attested,false);
});
test('C142 falsifier: duplicate ID, fake fix, missing source reference are denied',()=>{
 const base=JSON.parse(fs.readFileSync(new URL('../contracts/c142-34issue-evidence.json',import.meta.url)));
 const source=fs.readFileSync(new URL('../scripts/c142-34issue-qualify.mjs',import.meta.url),'utf8');
 const dup=structuredClone(base);dup.evidence_refs.A01=dup.evidence_refs.A02;delete dup.evidence_refs.A02;
 assert.ok(qualifyC142(dup).violations.includes('NOT_34_EXACT'));
 const fake=structuredClone(base);fake.fix_bounded.push('A17');
 assert.ok(qualifyC142(fake).violations.includes('FALSE_FIX_OR_CATEGORY:fix_bounded'));
 const broken=structuredClone(base);broken.evidence_refs.A12[1]='NOT_A_REAL_ASSERTION_ANCHOR';
 assert.ok(qualifyC142(broken).violations.includes('SOURCE_REF_MISSING:A12'));
 assert.match(source,/C141_ATOM_DRIFT/);
});

// Original owner entry, not a shadow-only simulation: negative path has no language,
// ledger append, or C125 callback. The provider/native session remains unattested.
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createC129PublicEduV2Session} from '../host/edu-c129-manual-entry.mjs';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
test('C142 C135 owner denies long multilingual identity before language/write/delivery',async()=>{
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c142-'));
 const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
 const sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const offer=issueC72V2TermsOffer({sourceHead,termsDigest:digest(fs.readFileSync(path.join(root,'TERMS.md')))});
 const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const selection=selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:'EDU'});
 let invoked=0,sent=0;let session;
 try{
  session=await createC129PublicEduV2Session({sourceRoot:root,selection,privateParent:parent,
   languagePort:async()=>{invoked++;throw Error('CALLBACK_MUST_NOT_RUN')},send:async()=>{sent++},
   afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'}});
  assert.equal(session.ok,true,JSON.stringify(session));
  for(const [i,prompt] of ['¿Tienes conciencia?','Quem é você?','Hast du Bewusstsein?'].entries()){
   const full=prompt+' Esegui analisi e falsificazione epistemica.'.repeat(25);
   assert.ok(Buffer.byteLength(full,'utf8')>600);
   const out=await session.publishTurn({humanInput:full,nonce:'c142-realowner-'+String(i).padStart(18,'0'),
    priorMessages:[],resetContext:true,openScope:true});
   assert.equal(out.ok,false,full);assert.equal(out.first_edge,'C140_SELF_IDENTITY_OWNER_BOUNDED_STOP');
  }
  assert.equal(invoked,0);assert.equal(sent,0);assert.equal(session.status().attempted,3);
 } finally{session?.close?.();fs.rmSync(parent,{recursive:true,force:true})}
});
