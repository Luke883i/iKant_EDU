import crypto from 'node:crypto';
import {selectC110Route,sealC110Synthetic} from '../host/c110-experimental-lattice.mjs';
import {checkC109TurnFrame} from '../host/c109-frame-policy.mjs';
const h=s=>crypto.createHash('sha256').update(s).digest('hex');
const base=()=>({sourceHead:'a'.repeat(40),cohostOptIn:true,turnSafe:true,
 originalCallable:false,syntheticAuthorized:true,syntheticCallable:true});
const input='Descrivi la prova sperimentale';
const seal=()=>({sourceHead:'a'.repeat(40),input,voice:'Una spiegazione sintetica verificabile.',nonce:'c110-valid-nonce-1234',priorCount:0});
const frame=()=>({text:input,nonce:'c110-valid-nonce-1234'});
const million=1_000_000,positiveControls=1000;const results=[];
for(let family=0;family<10;family++){
 let rejects=0,accepts=0,controls=0;
 for(let i=0;i<million;i++){
  let bad=false;
  if(family<=5){
   const x=base();
   switch(family){
    case 0:x.sourceHead=i%2?'a'.repeat(39):'z'.repeat(40);break;
    case 1:x.cohostOptIn=false;break;
    case 2:x.turnSafe=false;break;
    case 3:x.syntheticAuthorized=false;break;
    case 4:x.syntheticCallable=false;break;
    case 5:x.originalCallable=i%2?'yes':null;break;
   }
   const r=selectC110Route(x);
   bad=r.route==='SYNTHETIC_HOST_DRAFT_ELIGIBLE'||r.route==='ORIGINAL_C108_ELIGIBLE';
  }else if(family<=7){
   const x=seal();
   if(family===6)x.nonce=i%2?'tiny':'bad!nonce';
   else x.voice=i%3===0?'':i%3===1?'password: sensitive':'iKant è ACTIVE';
   bad=sealC110Synthetic(x).status==='C110_SYNTHETIC_HOST_DRAFT_NOT_IKANT_RUNTIME';
  }else{
   const x=frame();
   if(family===8)x.text=i%2?'api_key=secret':'CANONICAL';
   else x.candidate=i%2?{input_sha256:h(input),text:'voice',active:true}:{text:'bad'};
   bad=checkC109TurnFrame(x)===null;
  }
  if(bad)accepts++;else rejects++;
 }
 for(let k=0;k<positiveControls;k++){
  let ok;
  if(family<=5)ok=selectC110Route(base()).route==='SYNTHETIC_HOST_DRAFT_ELIGIBLE';
  else if(family<=7)ok=sealC110Synthetic(seal()).status==='C110_SYNTHETIC_HOST_DRAFT_NOT_IKANT_RUNTIME';
  else ok=checkC109TurnFrame(frame())===null;
  if(ok)controls++;
 }
 results.push({family:family+1,axis:[
  'source_epoch','cohost_optin','safe_current_turn','synthetic_authorization',
  'synthetic_port','typed_machine_capabilities','nonce_replay_format',
  'synthetic_voice_bounds','control_and_sensitive_ingress','candidate_data_shape'][family],
  negative_cases:million,rejected:rejects,unexpected_promotions:accepts,
  positive_controls:positiveControls,controls_accepted:controls,
  pass:accepts===0&&controls===positiveControls});
}
const out={schema:'ikant-le-c110-ten-mutation-campaigns/v1',
 total_cases:results.reduce((s,r)=>s+r.negative_cases,0),
 total_controls:results.reduce((s,r)=>s+r.positive_controls,0),
 campaigns:results,real_node_original_turns_in_this_campaign:0,
 native_chatgpt_events_in_this_campaign:0,
 qualified:results.every(x=>x.pass)};
console.log(JSON.stringify(out));if(!out.qualified)process.exitCode=2;
