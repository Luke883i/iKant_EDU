import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderC130PublicStatus,inspectC130PublicCopy} from '../host/c130-public-language.mjs';
import {scopeC130Question} from '../host/c130-subject-scope.mjs';
import {projectC130Ingress} from '../host/c130-ingress-projection.mjs';
const root=path.dirname(fileURLToPath(new URL('../package.json',import.meta.url)));
test('public copy always contains a plain explanation preceding a Cx annotation',()=>{
 for(const [phase,proofLevel] of [['ORIENTING','HOST_PLAN'],['COMPARING','HOST_PLAN'],['SOURCE_CHECK','HOST_PLAN'],['SOURCE_CONFIRMED','OWNER_REOPEN'],['VOICE_REOPENED','OWNER_REOPEN'],['WAITING_UPLOAD','HOST_PLAN'],['GUARD_BLOCKED','LOCAL_TEST'],['NATIVE_MISSING','HOST_PLAN'],['OWNER_FAILED','LOCAL_TEST']]){
  const r=renderC130PublicStatus({phase,proofLevel});assert.equal(r.ok,true);assert.equal(inspectC130PublicCopy(r.text).ok,true,r.text);
  assert.match(r.text,/^\p{L}+/u);assert.match(r.text,/\(C\d+: [^)]+\)$/);
 }
 assert.equal(renderC130PublicStatus({phase:'VOICE_REOPENED',proofLevel:'HOST_PLAN'}).ok,false);
 assert.equal(renderC130PublicStatus({phase:'UNRECOGNIZED',proofLevel:'OWNER_REOPEN'}).ok,false);
});
test('plain-language gate catches unexplained codes and raw tokens but not explained references',()=>{
 for(const s of ['Ho eseguito C87', 'STATUS=OWNER_VOICE_C87_ACTIVE', 'SHA 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'])
  assert.equal(inspectC130PublicCopy(s).ok,false,s);
 assert.equal(inspectC130PublicCopy('Ho verificato la registrazione (C87: controllo della traccia).').ok,true);
});
test('human ontology does not become iKant software self-ontology',()=>{
 assert.equal(scopeC130Question('Ciao, io sono Gianluca. Un uomo. Descrivi la mia natura ontologica.').scope,'HUMAN_PERSON');
 assert.equal(scopeC130Question('iKant, come sei fatto computazionalmente?').scope,'SOFTWARE_IKANT');
 assert.equal(scopeC130Question('Confronta la mia natura umana con la tua architettura iKant.').scope,'MIXED');
 assert.equal(scopeC130Question('Giudica il diritto e il pluralismo di un paese.').scope,'THIRD_PARTY');
 assert.equal(scopeC130Question('Perché?').scope,'UNRESOLVED');
});
test('EDU source ingress has zero implicit machine attempts',()=>{
 assert.equal(projectC130Ingress({mode:'EXPERIMENTAL',termsAccepted:true,modeSelected:true}).action,'REQUEST_ONE_MANUAL_PACKAGE');
 assert.equal(projectC130Ingress({mode:'EXPERIMENTAL',termsAccepted:false,modeSelected:true}).ok,false);
});
test('canonical requires native eligibility, distinct real owner results and stops on unknown or integrity',()=>{
 const b={mode:'CANONICAL',termsAccepted:true,modeSelected:true,nativeEligible:true};
 assert.equal(projectC130Ingress({...b,nativeEligible:false}).ok,false);
 assert.equal(projectC130Ingress({...b,attempts:[]}).remaining,3);
 const one={channel:'GITHUB_API',result:'REAL_FAILURE',ownerIssued:true};
 assert.equal(projectC130Ingress({...b,attempts:[one]}).remaining,2);
 assert.equal(projectC130Ingress({...b,attempts:[one,one]}).ok,false);
 const two={channel:'HOST_BRIDGE',result:'REAL_FAILURE',ownerIssued:true};
 const three={channel:'OWNER_PERMALINK',result:'REAL_FAILURE',ownerIssued:true};
 assert.equal(projectC130Ingress({...b,attempts:[one,two,three]}).action,'OWNER_MAY_OFFER_MANUAL_FALLBACK');
 assert.equal(projectC130Ingress({...b,attempts:[{...one,result:'UNKNOWN'},two,three]}).ok,false);
 assert.equal(projectC130Ingress({...b,attempts:[{...one,result:'INTEGRITY_MISMATCH'},two,three]}).ok,false);
 assert.equal(projectC130Ingress({...b,attempts:[{...one,result:'SUCCESS'}]}).action,'DELEGATE_TO_C59_OWNER_NOT_ACTIVE');
});
test('contracts explicitly do not claim actual installed canonical/manual fallback',()=>{
 for(const file of ['c130-contract-zero.json','c130-cognitive-freedom.json','c130-ingress-lattice.json']){
  const c=JSON.parse(fs.readFileSync(path.join(root,'contracts',file),'utf8'));assert.equal(c.authority,0);
  assert.match(c.status,/PROPOSED/);
 }
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'contracts/c130-ingress-lattice.json'),'utf8')).canonical.new_manual_fallback_issuer_proven,false);
});

test('advisory projections and status cannot be turned into authenticated source or owner receipts',()=>{
 const statuses=[renderC130PublicStatus({phase:'VOICE_REOPENED',proofLevel:'OWNER_REOPEN'}),
  projectC130Ingress({mode:'CANONICAL',termsAccepted:true,modeSelected:true,nativeEligible:true,
   attempts:['GITHUB_API','HOST_BRIDGE','OWNER_PERMALINK'].map(channel=>({channel,result:'REAL_FAILURE',ownerIssued:true}))})];
 assert.equal(statuses[0].proof_level_is_caller_attested,true);
 assert.equal(statuses[0].platform_wide_control,false);
 assert.equal(statuses[1].owner_receipts_authenticated,false);
 assert.equal(statuses[1].active,false);
 let reads=0;
 const hostile=new Proxy({},{get(){reads++;throw Error('UNTRUSTED_GETTER')}});
 assert.equal(renderC130PublicStatus(hostile).ok,false);
 assert.equal(projectC130Ingress(hostile).ok,false);
 assert.equal(reads,0);
 const hostileAttempt={channel:'GITHUB_API',result:'REAL_FAILURE',ownerIssued:true};
 const pr=new Proxy(hostileAttempt,{get(){reads++;throw Error('UNTRUSTED_GETTER')}});
 assert.equal(projectC130Ingress({mode:'CANONICAL',termsAccepted:true,modeSelected:true,nativeEligible:true,attempts:[pr]}).ok,false);
 assert.equal(reads,0);
});
