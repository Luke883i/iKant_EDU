import crypto from 'node:crypto';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode}
 from '../host/c72-unified-mode-admission.mjs';
import {planC99PostSelectionTurn as plan} from '../host/c99-postselection-planner.mjs';
const head='a05846cb58af8a6509299008674beb582020e318';
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:'b'.repeat(64)});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const orientation=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const inputs=['chi sei?','analizza queste ipotesi','questa e una prova?','confronta opzioni',
 'spiega il runtime','riconosci un errore','verifica incertezza','valuta rischi',
 'cosa cambia?','quale argomento?'];
const mk=i=>({sourceHead:head,selection:structuredClone(selection),
 humanInput:inputs[i%inputs.length]+' #'+String(i),cohostOptInObserved:true,
 cohostRevoked:false,carrierHints:[],
 previousFailedRoute:'NONE',failedEvidenceChanged:false});
const attacks=[
 x=>x.selection.status='INVALID', x=>x.sourceHead='f'.repeat(40),
 x=>x.cohostOptInObserved=false, x=>x.cohostRevoked=true,
 x=>x.humanInput='x'.repeat(12001), x=>x.humanInput='I ACCEPT',
 x=>x.carrierHints.push('EXTERNAL_OWNER'), x=>x.carrierHints=['C84','C84'],
 x=>x.carrierHints=['C84','C102','C100','UNKNOWN'], x=>x.previousFailedRoute='BAD',
 x=>x.failedEvidenceChanged='true', x=>x.selection.active=true,
 x=>x.selection.source_head='f'.repeat(40), x=>x.selection.receipt_sha256='a'.repeat(64),
 x=>x.selection.selected_mode='CANONICAL', x=>x.humanInput='',
 x=>x.humanInput='\ud800', x=>x.carrierHints={},
 x=>x.selection=null, x=>x.cohostOptInObserved=null
];
let failures=0;const counts=Array(attacks.length).fill(0),t=Date.now();
// Each invalid mutation starts from the E0 baseline and MUST yield C99_STOP.
for(let i=0;i<100000;i++){
 const x=mk(i),k=(i*13+7)%attacks.length;
 attacks[k](x);
 const r=plan(x); counts[k]++;
 if(r.status!=='C99_STOP')failures++;
 if(r.owner_executed!==false||r.local_runtime_executed!==false||
  r.active!==false||r.host_capabilities_attested!==false)failures++;
}
const routeCases=[['C84',false,['C84','C102','C100']],['C102',true,['C102','C100']],
 ['C100',true,['C100']],['E0_HOST_DRAFT',true,[]]];
for(let i=0;i<1000;i++){
 const [expected,consent,hints]=routeCases[i%4];
 const r=plan({...mk(i),cohostOptInObserved:consent,carrierHints:hints});
 if(r.route!==expected||r.status!=='C99_PLAN_ONLY_NOT_EXECUTED')failures++;
}
const receipt={schema:'ikant-le-c99-route-mutants/v1',synthetic:true,
 input_variants:100000,negative_mutations:100000,mutation_families:attacks.length,
 axis_counts:counts,positive_plans:1000,unexpected_promotions:failures,
 input_vector_sha256:sha(JSON.stringify({inputs,attackCount:attacks.length})),
 native_host_calls:0,host_hook_attested:false,qualified:failures===0,duration_ms:Date.now()-t};
console.log(JSON.stringify(receipt));if(failures)process.exitCode=1;
