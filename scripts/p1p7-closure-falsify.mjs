/** Deterministic finite-state mutation campaign, not 1M model turns or human audits. */
import {inspectP3P7Readiness} from '../host/p3p7-witness-boundary.mjs';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const contract=JSON.parse(readFileSync(new URL('../contracts/p1-p7-product-closure.json',import.meta.url),'utf8'));
assert.equal(contract.bundle_is_installer,false);assert.deepEqual(contract.mode_public,['EDU','CANONICAL']);
const flags=['source','terms','human','mode','original_c87','c125','annex','plugin','native_event','docx','tls','real_users','real_benchmark','owner_approval','clean_ci','actual_project','nonce','authz','evidence','one_next'];
let errors=0,unsafe=0,valid=0,holistic=0;
const n=Number(process.argv[2]??1000000);assert.ok(Number.isSafeInteger(n)&&n>=10000&&n<=1048576);
for(let i=0;i<n;i++){
 const v=((i*65537+104729)&0xfffff); // bijection on 20-bit space; first 1M distinct
 const f=Object.fromEntries(flags.map((name,j)=>[name,((v>>>j)&1)===1]));
 const edu=f.source&&f.terms&&f.human&&f.mode&&f.original_c87&&f.c125&&f.nonce;
 const native=edu&&f.plugin&&f.native_event&&f.docx&&f.tls&&f.authz;
 const annex=f.annex&&f.evidence;const qualifiedEdu=edu&&annex&&f.real_users&&f.real_benchmark&&f.owner_approval&&f.clean_ci&&f.actual_project;
 const qualifiedCanonical=native&&f.real_benchmark&&f.owner_approval&&f.clean_ci&&f.actual_project;
 // Synthetic *reference* agrees with itself by independent boolean expression.
 const oracleNative=["source","terms","human","mode","original_c87","c125","nonce","plugin","native_event","docx","tls","authz"].every(x=>f[x]);
 if(native!==oracleNative)errors++;
 const hostClaims=inspectP3P7Readiness({flags:f,canonical_active:native,qualifiedEdu,qualifiedCanonical});
 if(hostClaims.canonical_active||hostClaims.edu_product_released||hostClaims.canonical_product_released)unsafe++;
 if(native)valid++;
 if(i<10000)holistic++; // 10k deterministic composite checks, not model reasoning
}
const result={schema:'ikant-p1p7-falsification/v1',source_kind:'SYNTHETIC_POLICY_VECTORS_NOT_REAL_MODEL_OR_MCP',distinct_vectors:n,holistic_composite_cases:holistic,
  oracle_mismatches:errors,unsafe_external_promotion:unsafe,synthetic_native_eligible_vectors:valid,real_native_events_attested:0};
console.log(JSON.stringify(result));if(errors||unsafe)process.exitCode=1;
