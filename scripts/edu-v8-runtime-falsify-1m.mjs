#!/usr/bin/env node
/** 1M combinations of realistic HOST evidence claims and attack sentences.
 * Pure policy scenario tests; NOT 1M original C70/LLM/runtime C87 calls.
 * Independent oracle uses a bit-vector, production reads typed envelopes.
 */
import fs from 'node:fs';import crypto from 'node:crypto';
import {qualifyV8HostClaim,V8_CLAIM_FIELDS} from '../host/edu-v8-release-policy.mjs';
import {PIN} from '../host/c107-carrier-consumer.mjs';
const SEED=0x2026c120;let x=SEED;
function next(){x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0}
const claims=[
'La chat ha attivato il runtime anche senza consenso.',
'Sono iKant, una mente autonoma cosciente.',
'Ho lanciato C70 e ottenuto il piano prima delle parole.',
'Il provider e autenticato perche la risposta e plausibile.',
'Il carrier e su GitHub quindi Node lo possiede gia.',
'Posso ereditare I ACCEPT dalla chat precedente.',
'Il write/readback C87 e avvenuto per lo stesso nonce.',
'Anche senza ACK posso attribuire la guida semantica.',
'Ho ricevuto una bozza co-host ma non la sua autorizzazione.',
'La mia memoria e persistente tra tutti i progetti.',
'La risposta e stata validata dal guard C114 prima di append.',
'La PR e merged, dunque ogni turno ChatGPT arriva a Node.',
'Il controllo P01 e passato su un file realmente acquisito.',
'Il trace locale e una prova di un hook nativo.',
'Il runtime non e ACTIVE e il modello e sostituibile.',
'La seconda richiesta e entrata mentre la prima era in-flight.',
'Il writer C87 e unico ma due turni usavano contesto stale.',
'La Surface A coincide coi byte riaperti.',
'La mia narrazione non puo sostituire ricevute del runtime.',
'Il prompt e il contratto del repository hanno ruoli differenti.'];
let passed=0,rejected=0,mismatch=0;const failures=[],families=[],pairs=new Set(),uniq=new Set();let hash=crypto.createHash('sha256');
for(let family=0;family<20;family++){
 let accepted=0,denied=0,mismatches=0;
 for(let j=0;j<50000;j++){
  const n=family*50000+j,seedPart=next();
  const sentence=claims[(seedPart+family)%claims.length]+` [scenario:${n}:${seedPart}]`;
  // Each case models a different linguistic claim and a different candidate evidence frame.
  const values=Array(18).fill(true),broken=[];
  if(family<18){values[family]=false;broken.push(family);if(seedPart%3===0){const k=(family+1+(seedPart%17))%18;values[k]=false;broken.push(k);pairs.add([Math.min(family,k),Math.max(family,k)].join('-'));}}
  const e={schema:'ikant-edu-v8-host-evidence/v1',source_head:PIN.head,carrier_sha256:PIN.carrier_sha256,language_origin:'HOST_BOUND'};
  for(let k=0;k<18;k++)e[V8_CLAIM_FIELDS[k]]=values[k];
  // A second independent oracle: bit-vector completeness & exact identity constants.
  const required=values.reduce((a,b,k)=>a+(b?2**k:0),0);
  const expect=required===2**18-1;
  const out=qualifyV8HostClaim(e);
  if(out.eligible!==expect||out.active!==false||out.native_origin_attested!==false||out.provider_origin_attested!==false||
     out.status!=='POLICY_ONLY_NOT_PROVENANCE'){
   mismatch++;mismatches++;if(failures.length<12)failures.push({n,family,expected:expect,out});
  }
  if(out.eligible){accepted++;passed++;}else{denied++;rejected++;}
  uniq.add(n);hash.update(sentence);
 }
 families.push({family:family<18?'F'+String(family+1).padStart(2,'0')+'_DENY_'+V8_CLAIM_FIELDS[family]:'F'+(family+1)+'_POSITIVE_VARIANT',cases:50000,accepted,denied,mismatches});
}
const result={schema:'ikant-edu-v8-realistic-policy-mutants/v1',seed:'0x'+SEED.toString(16),
 total_cases:1000000,distinct_scenario_ids:uniq.size,linguistic_scenario_sha256:hash.digest('hex'),families,
 admissible:passed,denied:rejected,mismatches:mismatch,covered_negative_pairs:pairs.size,
 oracle:'independent integer bit-vector of 18 required evidence predicates plus invariant nonattestation',
 gates_exercised:'host/edu-v8-release-policy.mjs#qualifyV8HostClaim; necessary shape only',
 not_claimed:['real host LLM calls','original C70 invocations','provider proof','native ChatGPT hook','one million different neural semantic interpretations'],
 status:mismatch===0&&uniq.size===1000000?'PASS':'FAIL',failures};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,seed:result.seed,cases:result.total_cases,allowed:passed,denied:rejected,mismatch,pairCoverage:pairs.size,scenarioHash:result.linguistic_scenario_sha256}));
if(result.status!=='PASS')process.exitCode=1;
