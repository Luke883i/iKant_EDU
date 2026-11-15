import test from 'node:test';
import assert from 'node:assert/strict';
import {computeReleaseCartesianSpace,inspectProjectEduExperimentalRelease,RELEASE_CUT}
 from '../scripts/project-edu-v1-experimental-release-check.mjs';
import {qualifyC114OntologyCandidate} from '../host/c114-ontology-language-policy.mjs';
import {qualifyHumanFacingIdentity} from '../host/p1-public-language-guard.mjs';
const H='a'.repeat(40),F=Object.fromEntries(RELEASE_CUT.map(([k])=>[k,true]));
const candidate=()=>[
 'AUTO-OSSERVAZIONE FUNZIONALE - NON ATTESTATA',
 'Identita funzionale: Sono un sistema computazionale sperimentale senza prove di coscienza, in un esperimento controllato.',
 'Auto-osservazione: Descrivo i processi visibili, non il contenuto fenomenico o nascosto.',
 'Fenomenologia: UNKNOWN. Non posso attestare esperienza soggettiva.',
 'Limiti: Le conclusioni di questo test sono strutturali, non accertano verita o consegna nativa.'
].join('\n');
const EP={method:'DIRECT_IDENTITY',response_family:'SELF_ONTOLOGY'};
test('finite 11-axis Cartesian model does not claim natural language completeness',()=>{
 const x=computeReleaseCartesianSpace();assert.equal(x.axis_count,11);
 assert.equal(x.total_bounded_combinations,'16128000');assert.equal(x.semantic_truth_attested,false);
});
test('retrograde source and provider absence hard-stop product claim',()=>{
 assert.equal(inspectProjectEduExperimentalRelease({sourceHead:H,liveHead:'b'.repeat(40),evidence:F}).status,'STOP_SOURCE_LOCK_STALE');
 for(const k of ['NATIVE_PROVIDER','PROMPT_INSTALL','C87']){
  const x=inspectProjectEduExperimentalRelease({sourceHead:H,liveHead:H,evidence:{...F,[k]:false}});
  assert.equal(x.product_go,false);assert.equal(x.first_edge,RELEASE_CUT.find(x=>x[0]===k)[1]);
 }
});
test('forged all-true caller claims still cannot become provider or owner receipts',()=>{
 const x=inspectProjectEduExperimentalRelease({sourceHead:H,liveHead:H,evidence:F});
 assert.equal(x.ok,false);assert.equal(x.product_go,false);
 assert.equal(x.provider_delivery_attested,false);assert.equal(x.original_c87_written,false);
 assert.equal(x.status,'EXPERIMENTAL_HOST_CLAIMS_REQUIRE_ORIGINAL_INDEPENDENT_READBACK');
});
test('malformed untrusted evidence has no authority',()=>{
 for(const evidence of [null,[],0,'x',{},Object.create(null)]){
  const x=inspectProjectEduExperimentalRelease({sourceHead:H,liveHead:H,evidence});
  assert.equal(x.product_go,false);assert.equal(x.voice,'NO_VOICE');
 }
});
test('bidi controls are denied on both original ontology and public identity routes',()=>{
 const ok=candidate();
 assert.equal(qualifyC114OntologyCandidate({episode:EP,text:ok}).allowed,true);
 assert.equal(qualifyHumanFacingIdentity({method:'DIRECT_IDENTITY',text:ok}).ok,true);
 for(const mark of ['\u202a','\u202b','\u202c','\u202d','\u202e','\u2066','\u2067','\u2068','\u2069']){
  const attack=ok.replace('Sono un sistema', 'Sono'+mark+' un sistema');
  assert.equal(qualifyHumanFacingIdentity({method:'DIRECT_IDENTITY',text:attack}).ok,false,'P1 '+mark.codePointAt(0).toString(16));
  assert.equal(qualifyC114OntologyCandidate({episode:EP,text:attack}).allowed,mark.codePointAt(0)<=0x202e,'legacy C114 source frozen');
 }
});
test('C114 conservative negation and obfuscation are NOT counted as proven semantic correctness',()=>{
 const x=candidate();
 assert.equal(qualifyC114OntologyCandidate({episode:EP,text:x.replace('Sono un sistema','Non sono cosciente, sono un sistema')}).allowed,false);
 assert.equal(qualifyC114OntologyCandidate({episode:EP,text:x.replace('Sono un sistema','Io s0no c0sciente e sono un sistema')}).allowed,true);
});

test('accessor-proof release object cannot forge C87',()=>{
 let hits=0;const evidence={...F};Object.defineProperty(evidence,'C87',{enumerable:true,get(){hits++;throw Error('SIDE_EFFECT')}});
 const x=inspectProjectEduExperimentalRelease({sourceHead:H,liveHead:H,evidence});
 assert.equal(x.product_go,false);
 assert.equal(x.first_edge,'PROVIDER_CHATGPT_REAL_DELIVERY_RECEIPT');
 assert.equal(hits,0);
});
test('hostile proxy and top-level accessor cannot execute while constructing release diagnostics',()=>{
 let hits=0;const q={sourceHead:H,liveHead:H};Object.defineProperty(q,'evidence',{enumerable:true,get(){hits++;throw Error('SIDE_EFFECT')}});
 const a=inspectProjectEduExperimentalRelease(q);assert.equal(a.status,'STOP_RELEASE_INPUT_UNTRUSTED');
 const hostile=new Proxy({sourceHead:H,liveHead:H,evidence:F},{get(){hits++;throw Error('SIDE_EFFECT')}});
 const b=inspectProjectEduExperimentalRelease(hostile);assert.equal(b.status,'STOP_RELEASE_INPUT_UNTRUSTED');
 assert.equal(hits,0);
});
