/** 10M deterministic policy-mask perturbations, 64 unique classes.
 * Algebraic rejection proof only; NEVER represent as real human or UI tests.
 */
import {permittedVoiceMask,VOICE_MASK} from '../host/p1-app-exclusive-shell.mjs';
import assert from 'node:assert/strict';
const n=Number(process.argv[2]??10000000);
if(!Number.isSafeInteger(n)||n<1||n>10000000)throw Error('BOUNDED_MUTATION_COUNT_REQUIRED');
let accepted=0,rejected=0,missed=0,forged=0;const classes=new Set();
for(let i=0;i<n;i++){
 const bits=i%64,expected=(bits===VOICE_MASK),got=permittedVoiceMask(bits);
 classes.add(bits);if(got)accepted++;else rejected++;
 if(expected&&!got)missed++;if(!expected&&got)forged++;
}
assert.equal(missed,0);assert.equal(forged,0);assert.equal(accepted+rejected,n);
assert.equal(classes.size,Math.min(64,n));
process.stdout.write(JSON.stringify({status:'MASK_BOUNDARY_PASS',iterations:n,distinct_cases:classes.size,
 accepted,rejected,forged,missed,real_humans:0,provider_native_attested:false,
 qualitative_semantic_saturation_claimed:false})+'\n');
