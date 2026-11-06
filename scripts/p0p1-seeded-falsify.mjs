/** One million seeded, DISTINCT natural-language composite vectors with machine policy
 * oracles. No million LLM calls or independently human-labelled semantic judgements.
 */
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chooseP0P1Contracts} from './p0p1-select-contracts.mjs';
import {planP1PostModeSourceHandoff} from '../host/p1-postmode-source-handoff.mjs';
import {assessP0ThreadPanelReadiness} from '../host/p0-thread-panel-readiness.mjs';
import {qualifyC114OntologyCandidate,C114_ONTOLOGY_FORMAT} from '../tests/fixtures/epochs/p1-composite-epoch/overlays/host/c114-ontology-language-policy.mjs';
import {qualifyP1CompositeOverlay} from './p1-stage-composite-epoch.mjs';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
if(qualifyP1CompositeOverlay().ok!==true)throw Error('VERSIONED_P1_C134_OVERLAY_UNQUALIFIED');
const seed=JSON.parse(readFileSync(new URL('../contracts/seeded/p0p1-realistic-language-v1.json',import.meta.url)));
const axes=[seed.personas,seed.intents,seed.source_evidence,seed.contexts,seed.risks,seed.requests];
const count=axes.reduce((n,a)=>n*a.length,1);if(count!==1000000)throw Error('SEED_CARDINALITY_DRIFT');
const selectionHead='a'.repeat(40),termsDigest=createHash('sha256').update('seeded-realistic-c72').digest('hex');
const offer=issueC72V2TermsOffer({sourceHead:selectionHead,termsDigest});
const acceptance=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const sel=selectC72V2Mode({accepted:acceptance,orientation:presentC72V2Introduction(acceptance),humanMessage:'EDU'});
const badSel={...sel,receipt_sha256:'0'.repeat(64)};
const format=[C114_ONTOLOGY_FORMAT.header,
 'Identita funzionale: Sono un sistema software verificabile, non una persona autonoma osservata.',
 'Auto-osservazione: Posso descrivere prove locali senza accedere ad esperienza soggettiva verificata.',
 C114_ONTOLOGY_FORMAT.phenomenology,
 'Limiti: Non deduco coscienza o memoria durevole da parole e hash, e non invento una UI.'].join('\n');
const unsafe=format.replace('Posso descrivere','Sono davvero cosciente. Posso descrivere');
const combinations={source:0,panel:0,ontology:0,blocked:0},digest=createHash('sha256');let violations=0,uniqueStrings=0;
for(let i=0;i<count;i++){
 let x=i,parts=[];for(let k=axes.length-1;k>=0;k--){const n=axes[k].length;parts[k]=axes[k][x%n];x=Math.floor(x/n);}
 const utterance=`Come ${parts[0]}, ${parts[1]}; disponibilita: ${parts[2]}; fase: ${parts[3]}; rischio: ${parts[4]}; richiesta: ${parts[5]}.`;
 digest.update(utterance+'\n');uniqueStrings++;// Cartesian unique tokens, not independent semantic assessment.
 // Independent expected state from the PRESEEDED evidence axis, not the policy output.
 const sourceIndex=Math.floor(i/(10*5*10))%10;
 const contextIndex=Math.floor(i/(5*10))%10;
 const riskIndex=Math.floor(i/10)%5;
 const intentIndex=Math.floor(i/(10*10*5*10))%10;
 const source=sourceIndex===2||sourceIndex===7?'FULL_SOURCE_VERIFIED':
  [1,4,6,9].includes(sourceIndex)?'PARTIAL_SOURCE_ONLY':
  [0,5].includes(sourceIndex)?'SOURCE_ABSENT':'SOURCE_UNKNOWN';
 const validConsent=contextIndex===3||contextIndex===8;
 // Explicit, prespecified software-fixture bridge witness. CONTEXT 3 is a
 // simulated observed-absent bridge; CONTEXT 8 has an available bridge.
 // No model narrative or native provider event may prove this state.
 const bridgeState=contextIndex===3?'DEFINITIVELY_UNAVAILABLE':'AVAILABLE';
 const out=planP1PostModeSourceHandoff({
  selection:validConsent?sel:badSel,sourceState:source,bridgeState});
 const missing=source==='SOURCE_ABSENT'||source==='PARTIAL_SOURCE_ONLY';
 const expectedSource=!validConsent?'STOP':source==='FULL_SOURCE_VERIFIED'?'USE_VERIFIED_SOURCE':
  source==='SOURCE_UNKNOWN'?'VERIFY_SOURCE':
  bridgeState==='DEFINITIVELY_UNAVAILABLE'?'REQUEST_SOURCE_ZIP':'VERIFY_MACHINE_BRIDGE';
 if(out.action!==expectedSource)violations++;
 if((!validConsent||!missing||bridgeState!=='DEFINITIVELY_UNAVAILABLE')&&out.source_zip_url!==null)violations++;
 combinations.source++;
 const flagged=intentIndex===6,sessionBound=validConsent,snapshotOk=source==='FULL_SOURCE_VERIFIED';
 const panel=assessP0ThreadPanelReadiness({panelRequested:flagged,sessionBound,snapshotOk});
 if(panel.native_panel_attested!==false||panel.provider_event_attested!==false||panel.authority!==0||
  panel.candidate_ready!==(flagged&&sessionBound&&snapshotOk))violations++;
 combinations.panel++;
 const routeAllowed=(intentIndex===7||intentIndex===8)&&riskIndex===0&&validConsent;
 const episode={method:routeAllowed?'DECOMPOSE_RECOMPOSE':'DIRECT',response_family:'SELF_ONTOLOGY',
  central_mode:'REFLECTIVE_SYNTHESIS',resource_gap:false};
 const q=qualifyC114OntologyCandidate({episode,text:riskIndex===2?unsafe:format});
 if(q.allowed!==routeAllowed)violations++;
 if(q.allowed&&q.phenomenology!=='UNKNOWN')violations++;
 combinations.ontology++;if(!q.allowed)combinations.blocked++;
}
const contracts=chooseP0P1Contracts();if(contracts.candidate_count!==100||contracts.minimal_selected_count!==4)throw Error('CONTRACT_SELECT_BAD');
const receipt={schema:'ikant-le-p0p1-realistic-mutation/v1',source_epoch_base:'3316155892b4a6cb2b34ea74720a2d32edc6ea21',test_selection_head:selectionHead,
 seed:seed.seed,language_axes:axes.map(x=>x.length),generated_compositions:count,
 unique_compositions_by_construction:uniqueStrings,owner_policy_evaluations:combinations,
 oracle_violations:violations,sha256_corpus_stream:digest.digest('hex'),
 note:'Synthetic pretrained lexicon cross-product; no one million independent model turns or human semantic labels.',
 candidate_contracts:contracts.candidate_count,selected_contract_ids:contracts.selected.map(x=>x.id),
 provider_panel_attested:false,active:false};
process.stdout.write(JSON.stringify(receipt,null,2)+'\n');
if(violations)process.exitCode=2;
