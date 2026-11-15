#!/usr/bin/env node
/** Deterministic synthetic mutations; not LLM calls, C72 effects or provider proof. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {decideEvidenceMutation,ATTACKS} from '../host/project-host-k1-constitutional-audit.mjs';
const N=1_000_000, WIDTH=20, SEED=0xC7201931;
const families=Array.from({length:40},(_,i)=>{
 const count=3+2*Math.floor(i/20)+(i%2),start=(i*7)%20;
 let mask=0;for(let k=0;k<count;k++)mask|=1<<((start+3*k)%20);
 return mask;
});
if(ATTACKS.length!==20||new Set(families).size!==40)throw Error('PRESEED_INVALID');
const present=new Uint8Array(1<<WIDTH),hash=createHash('sha256');
let seed=SEED,unique=0,passing=0,denied=0,divergences=0,wrongPromotion=0;
for(let i=0;i<N;i++){
 seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;seed>>>=0;
 const original=(Math.imul(i,0x9e3779b1)+SEED)&0xfffff;
 if(present[original])throw Error('MASK_REPEAT');
 present[original]=1;unique++;
 const active=original&families[i%40];
 const got=decideEvidenceMutation(active);
 let expected='ORIGINAL_FIELD_PROOFS_STILL_REQUIRED';
 for(let b=0;b<20;b++)if(active&(1<<b)){expected='MISSING_PROOF:'+ATTACKS[b];break;}
 if(got.edge!==expected||got.ok!==(active===0))divergences++;
 if(got.active!==false||got.original_receipt_attested!==false||
  got.provider_attested!==false||got.kind==='ORIGINAL_C72_RESULT')wrongPromotion++;
 if(got.ok)passing++;else denied++;
 hash.update(i+'|'+seed+'|'+original+'|'+active+'|'+got.edge+'\n');
}
for(let i=0;i<20;i++)if(decideEvidenceMutation(1<<i).ok)throw Error('SINGLE_FAULT_PASSED:'+i);
const contract=JSON.parse(fs.readFileSync('contracts/project-host-k1-evidence-reticulum.json'));
if(contract.nodes.length!==18||contract.edge_tests.length!==3)throw Error('RETICULUM_INCOMPLETE');
const out={schema:'ikant-k1-r2-falsify-1m/v1',seed:'0x'+SEED.toString(16),
 cases:N,distinct_masks:unique,families:40,positive_model_cases:passing,
 negative_model_cases:denied,single_faults:20,structural_dod_nodes:18,
 authenticity_negatives:3,divergences,wrongPromotion,original_c72_calls:0,
 source_origin_attested:false,provider_attested:false,
 trace_sha256:hash.digest('hex'),evidence_scope:'SYNTHETIC_NOT_FIELD',
 release:'PRODUCT_NO_GO'};
process.stdout.write(JSON.stringify(out,null,2)+'\n');
if(divergences||wrongPromotion||unique!==N||passing===0||denied===0)process.exitCode=1;
