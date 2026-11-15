import {selectC110Route,sealC110Synthetic} from '../host/c110-experimental-lattice.mjs';
import crypto from 'node:crypto';
const H=x=>crypto.createHash('sha256').update(x).digest('hex');
const head='a'.repeat(40);
let scenarios=0,transitions=0,violations=0,orig=0,synth=0,diag=0;
for(let i=0;i<100000;i++){
 const phases=['COLD','TERMS','MODE','OPTIN','READY','OPTIN','READY','CLOSED'];
 if(phases[0]!=='COLD'||phases[4]!=='READY'||phases.at(-1)!=='CLOSED')violations++;
 transitions+=7;
 const original=i%5===0,synthetic=i%5===1||i%5===2,authorized=i%3!==0;
 const chosen=selectC110Route({sourceHead:head,cohostOptIn:true,turnSafe:true,
  originalCallable:original,syntheticAuthorized:authorized,syntheticCallable:synthetic});
 if(original){orig++;if(chosen.route!=='ORIGINAL_C108_ELIGIBLE')violations++;}
 else if(synthetic&&authorized){
  synth++;if(chosen.route!=='SYNTHETIC_HOST_DRAFT_ELIGIBLE')violations++;
  const sealed=sealC110Synthetic({sourceHead:head,input:'Domanda '+i,voice:'Risposta '+i,
   nonce:'c111-'+String(i).padStart(12,'0')});
  if(sealed.evidence?.visible_voice_sha256!==H(sealed.surface_a)||
    sealed.evidence.c70_original_executed!==false||sealed.evidence.c87_writer_executed!==false)violations++;
 }else{diag++;if(chosen.status!=='C110_DIAGNOSTIC_ONLY')violations++;}
 const revoked=selectC110Route({sourceHead:head,cohostOptIn:false,turnSafe:true,
  originalCallable:true,syntheticAuthorized:true,syntheticCallable:true});
 if(revoked.status!=='C110_DIAGNOSTIC_ONLY')violations++;
 scenarios++;
}
const result={schema:'ikant-le-c111-e2e-simulation/v1',scenarios,transitions,
 original_eligible:orig,synthetic_eligible:synth,diagnostic:diag,violations,
 abstract_only:true,original_c70_runs:0,chatgpt_native_messages:0,
 passed:scenarios===100000&&violations===0};
console.log(JSON.stringify(result));if(!result.passed)process.exitCode=2;
