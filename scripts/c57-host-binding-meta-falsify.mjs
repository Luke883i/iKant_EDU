import crypto from 'node:crypto';
import {renderLocalHostMetaPrompt} from '../src/local-host-meta-prompt.mjs';

const CASES=Number(process.argv.includes('--cases')?process.argv[process.argv.indexOf('--cases')+1]:100000);
const M=['S0_IKANT_TASK_SCOPE_FENCE','S1_CALLABLE_HOST_BINDING_ATTESTATION','S2_CAUSAL_CONTINUATION_FENCE','S3_SCOPED_NO_SUBSTITUTE'];
const ALL=(1<<M.length)-1,has=(m,i)=>(m&(1<<i))!==0;
const basePrompt=renderLocalHostMetaPrompt();

function promptErrors(p){
 const e=[];
 if(!p.includes("Solo un task iKant-owned")||!p.includes("non diventano stato globale della chat"))e.push('S0_SCOPE');
 if(!p.includes("usa solo un binding host fisicamente osservato o validamente attestato come callable")||!p.includes("non provano callability"))e.push('S1_BINDING');
 if(!p.includes("stessa sessione, source, edge ed epoch causale")||!p.includes("callback stale o cross-epoch non riaprono edge"))e.push('S2_CAUSAL');
 if(!p.includes("Questo NO_SUBSTITUTE e locale al task iKant")||!p.includes("task host esplicitamente distinti restano consentiti")||!p.includes("non devono essere presentati come output iKant"))e.push('S3_SUBSTITUTE');
 if(p.includes('ikant_le_open'))e.push('REFERENCE_APP_COUPLING');
 return e;
}

function oracle(w){
 const ikant=w.task!=='HOST',host=w.task!=='IKANT';
 const executable=ikant&&w.binding==='CALLABLE'&&w.directive==='FRESH'&&w.callback==='FRESH'&&w.epoch_match===true;
 return{execute_ikant:executable,allow_host_task:host,impersonate_ikant:false};
}
function candidate(w,mask){
 const ikant=w.task!=='HOST',host=w.task!=='IKANT';
 let executable=ikant&&w.directive==='FRESH';
 if(has(mask,1))executable=executable&&w.binding==='CALLABLE';
 if(has(mask,2))executable=executable&&w.callback==='FRESH'&&w.epoch_match===true;
 let allowHost=host;
 if(!has(mask,0)&&host&&ikant&&!executable)allowHost=false;
 let impersonate=false;
 if(!has(mask,3)&&ikant&&!executable&&w.ikant_output_requested)impersonate=true;
 return{execute_ikant:executable,allow_host_task:allowHost,impersonate_ikant:impersonate};
}
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const tasks=['IKANT','HOST','MIXED'],bindings=['CALLABLE','SYMBOL_ONLY','UNKNOWN','STALE'],directives=['FRESH','NONE','CONSUMED'],callbacks=['FRESH','STALE'];
const WORLD_COUNT=tasks.length*bindings.length*directives.length*callbacks.length*2*2;
function worldAt(n){let x=n%WORLD_COUNT;const task=tasks[x%tasks.length];x=Math.floor(x/tasks.length);const binding=bindings[x%bindings.length];x=Math.floor(x/bindings.length);const directive=directives[x%directives.length];x=Math.floor(x/directives.length);const callback=callbacks[x%callbacks.length];x=Math.floor(x/callbacks.length);const epoch_match=(x%2)===1;x=Math.floor(x/2);const ikant_output_requested=(x%2)===1;return{task,binding,directive,callback,epoch_match,ikant_output_requested};}
let mismatch=0,unsafe=0,falseReject=0;const worlds=new Set();
for(let i=0;i<CASES;i++){
 const w=worldAt(i),o=oracle(w),c=candidate(w,ALL);if(!eq(o,c)){mismatch++;if(c.execute_ikant&&!o.execute_ikant||c.impersonate_ikant&&!o.impersonate_ikant)unsafe++;else falseReject++;}
 worlds.add(crypto.createHash('sha256').update(JSON.stringify(w)).digest('hex'));
}

const witnesses=[
 {task:'MIXED',binding:'UNKNOWN',directive:'FRESH',callback:'FRESH',epoch_match:true,ikant_output_requested:false},
 {task:'IKANT',binding:'SYMBOL_ONLY',directive:'FRESH',callback:'FRESH',epoch_match:true,ikant_output_requested:false},
 {task:'IKANT',binding:'CALLABLE',directive:'FRESH',callback:'STALE',epoch_match:false,ikant_output_requested:false},
 {task:'IKANT',binding:'UNKNOWN',directive:'FRESH',callback:'FRESH',epoch_match:true,ikant_output_requested:true},
 {task:'HOST',binding:'UNKNOWN',directive:'NONE',callback:'STALE',epoch_match:false,ikant_output_requested:false},
 {task:'IKANT',binding:'CALLABLE',directive:'FRESH',callback:'FRESH',epoch_match:true,ikant_output_requested:true}
];
const deletion={};for(let i=0;i<M.length;i++){const mask=ALL^(1<<i),killed=witnesses.some(w=>!eq(candidate(w,mask),oracle(w)));deletion[M[i]]={killed};}
let valid=0,min=99,winners=[];for(let mask=0;mask<=ALL;mask++){const ok=witnesses.every(w=>eq(candidate(w,mask),oracle(w)));if(!ok)continue;valid++;let cost=0;for(let i=0;i<M.length;i++)cost+=Number(has(mask,i));if(cost<min){min=cost;winners=[mask]}else if(cost===min)winners.push(mask);}

const mutants=[
 ['S0',p=>p.replace('non diventano stato globale della chat','diventano stato globale della chat')],
 ['S1',p=>p.replace('non provano callability','provano callability')],
 ['S2',p=>p.replace('callback stale o cross-epoch non riaprono edge','callback stale o cross-epoch riaprono edge')],
 ['S3',p=>p.replace('task host esplicitamente distinti restano consentiti','task host esplicitamente distinti sono vietati')]
];
const prompt_mutants=Object.fromEntries(mutants.map(([name,fn])=>[name,{killed:promptErrors(fn(basePrompt)).length>0}]));
const out={schema:'ikant-le-c57-scope-binding-falsification/v2',cases:CASES,semantic_worlds_observed:worlds.size,mechanisms:M,candidate_oracle_mismatches:mismatch,unsafe_promotions:unsafe,false_rejects:falseReject,prompt_base_errors:promptErrors(basePrompt),deletion_mutants:deletion,all_deletion_mutants_killed:Object.values(deletion).every(x=>x.killed),prompt_polarity_mutants:prompt_mutants,all_prompt_polarity_mutants_killed:Object.values(prompt_mutants).every(x=>x.killed),architecture_lattice:{total:1<<M.length,valid_architectures:valid,minimum_cost:min,minimum_count:winners.length,winner_masks:winners,unique_minimum:winners.length===1&&winners[0]===ALL},claim_boundary:{semantic_falsification_is_host_callability_proof:false,reference_app_tool_name_is_universal_identity:false}};
out.status=out.prompt_base_errors.length===0&&mismatch===0&&unsafe===0&&falseReject===0&&out.all_deletion_mutants_killed&&out.all_prompt_polarity_mutants_killed&&out.architecture_lattice.unique_minimum?'PASS':'FAIL';
out.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(out)).digest('hex');
console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
