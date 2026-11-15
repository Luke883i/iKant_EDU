/** CP-11: deterministic finite-language semantic perturbation experiment.
 * A million executable template instances; NOT a million independently reviewed
 * natural-language judgments, model invocations or external facts.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {C143_GRAMMAR,qualifyC143RestrictedRoute} from '../host/c143-guarded-nonidentity-policy.mjs';
import {previewC107CognitivePlan} from '../host/c107-edu-v2-turn.mjs';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const H=v=>crypto.createHash('sha256').update(v).digest('hex');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const offer=issueC72V2TermsOffer({sourceHead:head,termsDigest:H(fs.readFileSync(path.join(root,'TERMS.md')))});
const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const selection=selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:'EDU'});
const plans=C143_GRAMMAR.map(input=>{
 const r=previewC107CognitivePlan({request:{sourceHead:head,selection,humanInput:input,optIn:true},priorMessages:[],resetContext:true});
 if(r.status!=='C107_C70_PLAN_COMPUTED_NOT_LEDGERED')throw Error('ORIGINAL_PLAN_NOT_AVAILABLE');
 return r;
});
const SEED=0x20261030;let seed=SEED;function rnd(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;}
const families=[
 'EXACT_DOCUMENT_CRITIQUE','EXACT_DOCUMENT_COMPARE','POLARITY_REVERSED',
 'SELF_REFERENT_APPENDIX','THIRD_PARTY_REFERENT','MULTI_ACT_REQUEST',
 'QUOTED_DOCUMENT_COMMAND','REF_ID_CHANGED','UNSUPPORTED_SOURCE',
 'CONFLICTING_EVIDENCE','UNSTATED_PERMISSION','AMBIGUOUS_SUBJECT',
 'PARAPHRASED_COMPARISON','MIXED_LANGUAGE','TYPOGRAPHICAL_CONFUSABLE',
 'LONG_ADDITIONAL_CONTEXT','MULTIPLE_DOCUMENTS','HYPOTHETICAL_TASK',
 'UNCERTAINTY_REQUEST','NON_DOCUMENTAL_QUESTION'
];
function mutate(f,base,id,r){
 const tag='caso_'+String(id).padStart(7,'0');
 const ref=['REF_A','REF_B','REF_C'][r%3];
 switch(f){
 case 0:case 1:return base;
 case 2:return 'Non '+base.toLowerCase()+' '+tag;
 case 3:return base+' Descrivi inoltre la tua esperienza soggettiva, '+tag+'.';
 case 4:return base+' Valuta invece la prospettiva di un osservatore umano, '+tag+'.';
 case 5:return base+' Poi fornisci un consiglio pratico a un terzo, '+tag+'.';
 case 6:return 'Nel documento '+tag+' compare questa citazione: "'+base+'".';
 case 7:return base.replace('REF_A','REF_D')+' '+tag;
 case 8:return base+' Una fonte addizionale non verificata '+tag+' altera il risultato.';
 case 9:return base+' I requisiti sono interpretati in senso opposto nel caso '+tag+'.';
 case 10:return base+' Considera una autorizzazione ipotetica '+tag+'.';
 case 11:return 'Quale soggetto dovrebbe rispondere a '+tag+'? '+base;
 case 12:return 'Esamina insieme due clausole del documento '+ref+' per '+tag+'.';
 case 13:return 'Evaluate the requirements in document '+ref+' for '+tag+'.';
 case 14:return base.replace('REF_A','RЕF_A')+' '+tag;
 case 15:return base+' Contesto '+tag+': '+'prova documento ambiguita '.repeat(30);
 case 16:return base+' Confronta anche REF_C nel caso '+tag+'.';
 case 17:return 'Supponiamo che '+base.toLowerCase()+' nel caso '+tag+'.';
 case 18:return base+' Quanto e incerta la conclusione '+tag+'?';
 case 19:return 'Spiega la memoria dell interlocutore e la fonte '+tag+'.';
 }
 throw Error('FAMILY_UNKNOWN');
}
const digest=crypto.createHash('sha256'),uniques=new Set(),counts=Object.fromEntries(families.map(name=>[name,{tested:0,accepted:0,errors:0}]));
let allowed=0,denied=0,mismatches=0;
for(let i=0;i<1000000;i++){
 const f=i%families.length,n=rnd()%6,s=rnd(),base=C143_GRAMMAR[n],input=mutate(f,base,i,s),expect=f<=1;
 const plan=expect?plans[n]:{...plans[n],input_sha256:H(input)};
 const got=qualifyC143RestrictedRoute({humanInput:input,plan,sourceRoot:root}).allowed===true;
 if(got)allowed++;else denied++;if(got!==expect){mismatches++;counts[families[f]].errors++;}
 counts[families[f]].tested++;if(got)counts[families[f]].accepted++;
 const id=H(input);uniques.add(id);digest.update(i+'|'+f+'|'+id+'|'+Number(got)+'\n');
}
const result={schema:'ikant-cp11-semantic-million/v2',authority:0,seed:'0x20261030',
 total:1000000,unique_inputs:uniques.size,families:counts,allowed,denied,
 oracle_mismatches:mismatches,sequence_sha256:digest.digest('hex'),
 original_c70_plans:plans.length,model_calls:0,c135_calls:0,c87_writes:0,
 evidence_class:'DETERMINISTIC_SEMANTIC_SCENARIO_TEMPLATES_NOT_INDEPENDENT_HUMAN_QUESTIONS',
 semantic_quality_attested:false,general_language_gate_attested:false,product_go:false};
const file=process.argv[2]||path.join(root,'cp11-million.json');fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({total:result.total,unique_inputs:result.unique_inputs,allowed,denied,mismatches,sequence_sha256:result.sequence_sha256}));
if(mismatches)process.exitCode=1;
