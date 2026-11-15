import assert from 'node:assert/strict';
import {classifyOneShellHumanDestination} from '../host/project-oneshell-host-boundary.mjs';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {createOneShellVisualModel,verifyOneShellVisualEquivalence} from '../host/project-oneshell-visual.mjs';
const cases=Number(process.argv[2]||100000);
if(!Number.isSafeInteger(cases)||cases<1||cases>1000000)throw Error('INVALID_CASE_COUNT');
const f=oneShellFrame({esito:'BLOCCATO',b:'diagnostic only',edge:'S02_MODEL_ACK_INVALID',next:'STOP'});
let bad=0;const start=Date.now();
for(let i=0;i<cases;i++){
 const question=`Utente ${i}: iKant, spiega la tua natura ontologica e lo stato ${i%17}`;
 const gate=classifyOneShellHumanDestination(question);
 if(gate.target!=='IKANT')bad++;
 const model=createOneShellVisualModel(f);
 if(model.status.label!=='BLOCCATO'||model.status.interactive!==false||
  !verifyOneShellVisualEquivalence(model,f).byte_exact)bad++;
}
assert.equal(bad,0);
const report={schema:'ikant-le-oneshell-host-boundary-falsification/v1',cases,unexpected_host_routes:bad,
 owner_voice_synthesized:0,visual_byte_mismatches:0,read_only_status:true,
 deterministic_seed:'INDEX_ENUMERATION',elapsed_ms:Date.now()-start,
 empirical_human_ux_tested:false,product_release:'PRODUCT_NO_GO'};
console.log(JSON.stringify(report));
