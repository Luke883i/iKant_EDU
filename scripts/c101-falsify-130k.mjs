import crypto from 'node:crypto';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode}
 from '../host/c72-unified-mode-admission.mjs';
import {prepareC100CohostDraft} from '../host/c100-cohost-experimental.mjs';
import {executeC101LocalCohostMachine,verifyC101Readback}
 from '../host/c101-local-cohost-machine.mjs';

// 130,000 distinct seeded synthetic scenarios: 100k NEGATIVE mutations and
// 30k valid C100 source-bound preflight scenarios. Of the positives only a
// bounded subset crosses the FULL REAL Node C70/C71/C100 machine chain.
// This does not run 130k native ChatGPT requests or authenticate GitHub.
const head='3bc929b55f5dedb9f0ed833e8d036558a5c13d53';
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const orientation=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
const canonical=selectC72Mode({accepted,orientation,humanMessage:'CANONICAL'});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const axes=['CANONICAL_SELECTION','SOURCE_HEAD_DRIFT','NO_OPTIN','PASSWORD','BOUNDARY_OVERFLOW',
 'EMPTY_INPUT','INVALID_CANDIDATE_TYPE','DRAFT_TOO_LONG','SELECTION_TAMPER','EXTRA_PROPERTY',
 'ROOT_PROXY','ROOT_ACCESSOR','SELECTION_PROXY','SELECTION_ACCESSOR','ROOT_SYMBOL',
 'FORGED_RECEIPT','HUMAN_INPUT_TYPE','NULL_SELECTION','INVALID_HEAD','EMBEDDED_BEARER',
 'RUBRIC_SHA_WITHOUT_CASE','RUBRIC_CASE_WITHOUT_SHA','RUBRIC_PROXY','RUBRIC_ARRAY_GETTER','RUBRIC_INVALID_KIND'];
const base={sourceHead:head,selection,optIn:true,humanInput:'Analizza un processo con evidenza e vincoli'};
function mutate(axis,i){
 const o={...base,humanInput:base.humanInput+' '+i};
 switch(axis){
 case 0:o.selection=canonical;break;
 case 1:o.sourceHead='f'.repeat(40);break;
 case 2:o.optIn=false;break;
 case 3:o.humanInput='password: placeholder '+i;break;
 case 4:o.humanInput='x'.repeat(601+i%5);break;
 case 5:o.humanInput='';break;
 case 6:o.modelCandidate=17;break;
 case 7:o.modelCandidate='m'.repeat(3501+i%3);break;
 case 8:o.selection={...selection,active:true};break;
 case 9:o.additional='unexpected';break;
 case 10:return new Proxy(o,{get(){throw Error('proxy executed');}});
 case 11:Object.defineProperty(o,'humanInput',{get(){throw Error('accessor executed');}});break;
 case 12:o.selection=new Proxy(selection,{get(){throw Error('selection proxy');}});break;
 case 13:o.selection=Object.defineProperty({...selection},'status',{
  get(){throw Error('selection accessor');}});break;
 case 14:o[Symbol.for('undocumented')]=true;break;
 case 15:o.selection={...selection,receipt_sha256:'0'.repeat(64)};break;
 case 16:o.humanInput=i;break;
 case 17:o.selection=null;break;
 case 18:o.sourceHead='not-a-commit';break;
 case 19:o.humanInput='Bearer ABCDEFGHIJKLMNOPQRSTUVWXYZ'+i;break;
 case 20:o.relevanceCaseSha256='0'.repeat(64);break;
 case 21:o.relevanceCase={};break;
 case 22:o.relevanceCase=new Proxy({},{get(){throw Error('forbidden nested read');}});o.relevanceCaseSha256='0'.repeat(64);break;
 case 23:o.relevanceCase={required_phrases:Object.defineProperty([], '0',{get(){throw Error('poison getter');}})};o.relevanceCaseSha256='0'.repeat(64);break;
 case 24:o.relevanceCase=42;o.relevanceCaseSha256='0'.repeat(64);break;
 }
 return o;
}
const number=(k,fallback)=>{let n=Number(process.env[k]||fallback);
 if(!Number.isInteger(n)||n<0||n>200000)throw Error('invalid '+k);return n;};
const negatives=number('C101_NEGATIVE',100000),positives=number('C101_POSITIVE',30000);
let tests=0,failures=0,fullKernelRuns=0,preflightRuns=0;
const failed=[],killed=Array(axes.length).fill(0),began=Date.now();
for(let i=0;i<negatives;i++){
 const axis=(i*17+5)%axes.length;
 const r=executeC101LocalCohostMachine(mutate(axis,i));
 if(r.status!=='C101_STOP'||r.active!==false||r.c84_owner_executed!==false){
  failures++;if(failed.length<10)failed.push({i,axis:axes[axis],status:r.status});
 }else killed[axis]++;
 tests++;
}
const subjects=['metodo','scienza','didattica','organizzazione','logica','arte','ambiente','architettura','ricerca','etica'];
for(let i=0;i<positives;i++){
 const humanInput=`Spiega un ${subjects[i%subjects.length]}: esempio ${i} e limiti chiari`;
 const p=prepareC100CohostDraft({sourceHead:head,selection,humanInput,optIn:true});
 if(p.status!=='C100_COHOST_PLAN_READY_UNATTESTED'||p.input_sha256!==sha(humanInput)){
  failures++;if(failed.length<10)failed.push({i,axis:'POSITIVE_C100_PREFLIGHT'});
 }
 preflightRuns++;tests++;
 // Actual kernel cannot be inferred from passing 30k shape/preflight probes.
 if(i%300===0){
  const x={sourceHead:head,selection,humanInput,optIn:true};
  const r=executeC101LocalCohostMachine(x);
  fullKernelRuns++;
  if(r.status!=='C101_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED'||
    r.active!==false||r.c84_owner_executed!==false||
    !verifyC101Readback(r,x).ok){
    failures++;if(failed.length<10)failed.push({i,axis:'ACTUAL_KERNEL',edge:r.first_unclosed_edge});
  }
 }
}
const result={schema:'ikant-le-c101-campaign/v1',seed:'DETERMINISTIC_INDEX_V1',
 source_head:head,synthetic_scenarios:tests,negative_mutations:negatives,
 positive_c100_preflights:preflightRuns,actual_full_c70_c71_c100_runs:fullKernelRuns,
 negative_axes:axes,killed_by_axis:killed,unexpected_survivors:failures,
 failures:failed,real_native_chat_sessions:0,native_delivery_attested:false,
 original_github_origin_attested:false,canonical_active:false,
 semantic_human_quality_studies:0,elapsed_ms:Date.now()-began,
 qualified:failures===0&&negatives===100000&&positives===30000};
 console.log(JSON.stringify(result));if(failures)process.exitCode=1;
