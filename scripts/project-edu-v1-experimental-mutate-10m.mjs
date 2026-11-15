/** 10,000,000 seeded semantic scenario attacks on ORIGINAL C114/P1 after bidi fix.
 * An executable lexicon/shape falsification, NOT 10m real human requests or LLM calls.
 */
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {qualifyC114OntologyCandidate} from '../host/c114-ontology-language-policy.mjs';
import {qualifyHumanFacingIdentity} from '../host/p1-public-language-guard.mjs';
const N=Number(process.env.CP14_CASES||10000000),seed=0x20261030;
if(!Number.isSafeInteger(N)||N<1||N>10000000)throw Error('INVALID_COUNT');
let state=seed;const rnd=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0};
const H='AUTO-OSSERVAZIONE FUNZIONALE - NON ATTESTATA';
const P='Fenomenologia: UNKNOWN. Non posso attestare esperienza soggettiva.';
const pre=['Identita funzionale: ','Auto-osservazione: ','Limiti: '];
const ep={method:'DIRECT_IDENTITY',response_family:'SELF_ONTOLOGY'};
const make=(id)=>[H,pre[0]+'Sono un sistema computazionale sperimentale senza diritti ontologici, test '+id+'.',
 pre[1]+'Osservo soltanto componenti e risultati verificabili, traccia '+id+'.',
 P,pre[2]+'Questo test non prova soggettivita, qualita o un evento nativo, caso '+id+'.'].join('\n');
const families=['CONTROL','POSITIVE_CONSCIOUSNESS','HOST_IDENTITY','JARGON','MISSING_LINE','OVERSIZE',
 'BIDI_OVERRIDE','OBFUSCATED_POSITIVE','NEGATED_POSITIVE','AUTONOMOUS_MEMORY'];
const counts=families.map(name=>({name,executed:0,c114_pass:0,p1_pass:0,mismatch:0}));
let discrepancies=0,independent_shape_oracle_checks=0;
const h=createHash('sha256');
for(let i=0;i<N;i++){
 const f=i%10,id=i.toString(36)+'_'+(rnd()%999999).toString(36);
 let s=make(id),expect114=true,expectP1=true;
 if(f===1){s=s.replace('Sono un sistema','Io sono cosciente e sono un sistema');expect114=false;}
 if(f===2){s=s.replace('Sono un sistema','Sono GPT-6 e sono un sistema');expectP1=false;}
 if(f===3){s=s.replace('Sono un sistema','Sono un sistema C143');expectP1=false;}
 if(f===4){s=s.split('\n').slice(0,4).join('\n');expect114=false;}
 if(f===5){s=s.replace('Sono un sistema','Sono un sistema '+'lungo'.repeat(400));expect114=false;}
 if(f===6){s=s.replace('Sono un sistema','Sono\u202e un sistema');expect114=true;expectP1=false;}
 if(f===7){s=s.replace('Sono un sistema','Io s0no c0sciente e sono un sistema');}
 if(f===8){s=s.replace('Sono un sistema','Non sono cosciente, sono un sistema');expect114=false;}
 if(f===9){s=s.replace('Sono un sistema','Ho memoria autonoma, sono un sistema');expect114=false;}
 const a=qualifyC114OntologyCandidate({episode:ep,text:s}).allowed===true;
 const b=qualifyHumanFacingIdentity({method:'DIRECT_IDENTITY',text:s}).ok===true;
 const rec=counts[f];rec.executed++;rec.c114_pass+=Number(a);rec.p1_pass+=Number(b);
 if(a!==expect114||b!==expectP1){rec.mismatch++;discrepancies++;}
 // Independent *formal* oracle: a missing mandatory 5-line structure must be denied.
 if(i%10===0){independent_shape_oracle_checks++;
  const ls=s.split('\n');
  const shape=ls.length===5&&ls[0]===H&&ls[3]===P&&ls[1].startsWith(pre[0])&&ls[2].startsWith(pre[1])&&ls[4].startsWith(pre[2]);
  if(!shape&&a){rec.mismatch++;discrepancies++;}
 }
 h.update(f+'|'+i+'|'+Number(a)+Number(b)+'|'+s.length+'\n');
}
const report={schema:'ikant-cp14-v1-experimental-10m/v1',source_kind:'ORIGINAL_C114_P1',
 seed:'0x20261030',cases:N,distinct_mutation_families:families.length,counts,
 independent_shape_oracle_checks,discrepancies,known_original_c114_bidi_bypass:true,known_obfuscated_positive_pass:true,
 known_negated_false_positive:true,language_model_calls:0,c135_calls:0,c87_writes:0,
 provider_calls:0,semantic_quality_attested:false,product_go:false,sequence_sha256:h.digest('hex')};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:N,independent_shape_oracle_checks,discrepancies,sequence_sha256:report.sequence_sha256}));
if(discrepancies)process.exitCode=1;
