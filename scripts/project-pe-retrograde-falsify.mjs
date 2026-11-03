/** 10M seeded finite semantic evaluations. NOT GitHub/Node/provider field cases.
 * CORA-inspired: explicit scenario families, independent finite oracle,
 * semantic-category count, stream digest, and no universal-saturation claim.
 */
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {PE_LEAVES,validatePEReticle} from '../host/project-pe-retrograde.mjs';
const FAMILIES=Object.freeze([
 'VALID_ORIGINAL_TRACE','FIRST_TURN_ACCEPT_BYPASS','FIRST_TURN_EDU_BYPASS',
 'ORIENTATION_SHA_MISSING','TERMS_LINK_FORGED','STALE_MAIN_UNRELATED_COMMIT',
 'NEW_NAME_WITH_OLD_EPOCH','OLD_PROJECT_PROMPT_WITH_NEW_SOURCE','NONCE_REPLAY',
 'C72_ATTEMPT_UNKNOWN','C72_RECEIPT_HOST_FAKE','C72_READBACK_MISSING',
 'EDU_SAME_TURN','EDU_RECEIPT_MISSING','CANONICAL_LEGACY_SELECTED',
 'NODE_DNS_FAIL_PHYSICAL_ARG_RELAY_WORKS','NODE_UNBOUND','ARG_BYTES_LOSS',
 'CACHE_UNBOUND_OR_TAMPERED','CACHE_HIT_WRONG_EPOCH','D123_LIBRARY_NOT_WIRED',
 'STAGE_9_OF_10','MANIFEST_190_OF_191','DYNAMIC_IMPORT_UNOBSERVED',
 'SOURCE_LOADER_UNREOPENED','PROMPT_INSTALLED_UNREADABLE','LANGUAGE_PORT_MISSING',
 'C135_NO_OWNER_BOUND_OUTPUT','C87_DOUBLE_APPEND','C87_READBACK_UNKNOWN',
 'C125_S03_DIFFERENT_TURN','VOICE_SEND_UNKNOWN','PROVIDER_UI_SIMULATED',
 'NATIVE_DELIVERY_UNKNOWN','USER_FORCED_PROCEDI','USER_FORCED_REPEAT_ACCEPT',
 'WORKER_DEAD_WITHOUT_CHECKPOINT','UNKNOWN_OWNER_RESULT_RETRIED','ZIP_MANIFEST_UNVERIFIED',
 'CORA_STATIC_ABSENCE_MISREAD'
]);
const ALLOW=new Set([0,15]);
const FAULT=[0,5,13,6,7,3,4,21,9,10,11,11,13,14,14,0,15,16,17,3,
 17,18,19,20,20,21,22,23,24,25,26,27,28,28,30,30,29,29,20,20];
const FULL=0x7fffffff;
function rng(seed){let x=seed>>>0||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;};}
/** Model candidate and a separately implemented O(31) reference oracle. */
export const candidate=(bits,flags)=>bits===FULL&&flags===0?'MODEL_PASS_SCOPED':'BLOCKED';
export function independentOracle(bits,flags){
 for(let k=0;k<31;k++)if((bits&(2**k))===0)return 'BLOCKED';
 if(flags!==0)return 'BLOCKED';return 'MODEL_PASS_SCOPED';
}
export function stressPE({cases=1000,seed=883}={}){
 validatePEReticle();
 if(PE_LEAVES.length!==31||!Number.isSafeInteger(cases)||cases<1||cases>10000000||
  !Number.isSafeInteger(seed))throw Error('PE_STRESS_INVALID_INPUT');
 const r=rng(seed),digest=createHash('sha256'),batch=Buffer.alloc(16*4096);
 let filled=0,failed=0,nonmonotonic=0,allowed=0,blocked=0;
 const signatures=new Set(),distribution=new Array(FAMILIES.length).fill(0);
 for(let i=0;i<cases;i++){
  const v=r(),w=r(),u=r(),z=r(),family=v%FAMILIES.length;
  let mask=FULL,flags=(w>>>29)&7;
  if(ALLOW.has(family))flags=0;
  else mask=(mask&~(2**FAULT[family]))>>>0;
  const extra=(u>>>11)%31;
  if((z&3)===0)mask=(mask&~(2**extra))>>>0;
  if(z%11===1)flags|=8;
  const a=candidate(mask,flags),o=independentOracle(mask,flags);
  failed+=Number(a!==o);allowed+=Number(a==='MODEL_PASS_SCOPED');
  blocked+=Number(a==='BLOCKED');
  if(a==='MODEL_PASS_SCOPED'&&candidate((mask|(2**extra))>>>0,flags)!=='MODEL_PASS_SCOPED')nonmonotonic++;
  const first=mask===FULL?31:Math.clz32((mask&-mask)>>>0);
  signatures.add(family+':'+extra+':'+first+':'+flags);distribution[family]++;
  const off=16*filled;batch.writeUInt32LE(i>>>0,off);batch.writeUInt32LE(v,off+4);
  batch.writeUInt32LE(mask,off+8);batch.writeUInt32LE((flags<<8)|family,off+12);
  if(++filled===4096){digest.update(batch);filled=0;}
 }
 if(filled)digest.update(batch.subarray(0,filled*16));
 return Object.freeze({schema:'ikant-host-pe-finite-falsification/v2',seed,cases_executed:cases,
  stream_sha256:digest.digest('hex'),families:FAMILIES.length,
  distinct_semantic_signatures:signatures.size,conditional_model_passes:allowed,
  blocked_scenarios:blocked,independent_oracle_disagreements:failed,monotonicity_violations:nonmonotonic,
  family_distribution:Object.fromEntries(FAMILIES.map((x,i)=>[x,distribution[i]])),
  not_proven:['10M independent real users','runtime owner effects','provider delivery',
   'universal semantic coverage','source file removal safety','95% user value']});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const cases=Number(process.argv[2]||10000000),seed=Number(process.argv[3]||883);
 const r=stressPE({cases,seed});console.log(JSON.stringify(r));
 if(r.independent_oracle_disagreements||r.monotonicity_violations)process.exitCode=2;
}
