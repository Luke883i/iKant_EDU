#!/usr/bin/env node
/** ONE MILLION *gate-level* negative scenarios against the actual host adapter.
 * NOT one million C70 executions and NOT a natural language accuracy estimate. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createLocalCohostAdapter} from '../host/edu-cohost-outcome.mjs';
let state=20261013;
const rng=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0};
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-1m-neg-'));
const raw=fs.readFileSync(path.join(dir,'release/v8/ikant-c107-source-c734bf934e33.ikc.br'));
const host=await createLocalCohostAdapter({carrierBytes:raw,privateParent:parent});
if(!host.ok)throw Error('P01 REAL CARRIER STAGE BLOCKED');
const a=await import(pathToFileURL(path.join(host.install_root,'host/c72-unified-mode-admission.mjs')));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const offer=a.issueC72TermsOffer({sourceHead:'c734bf934e33703a6a1f91f0f4d5df96eec96945',termsDigest:sha(fs.readFileSync(path.join(host.install_root,'TERMS.md')))});
const accepted=a.acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const selection=a.selectC72Mode({accepted,orientation:a.presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
const valid={human_mode_selected:true,opt_in_confirmed:true,provenance:'LOCAL_TEST_FIXTURE',separate_cohost_draft_authorized:false};
const count=1000000,per=100000,stats=[];let mismatch=0;
const rows=[
 ['MISSING_AUTH','P02_TEXT_MODE_OR_OPTIN_MISSING',f=>{delete f.authorization}],
 ['MISSING_MODE','P02_TEXT_MODE_OR_OPTIN_MISSING',f=>{f.authorization.human_mode_selected=false}],
 ['MISSING_OPTIN','P02_TEXT_MODE_OR_OPTIN_MISSING',f=>{f.authorization.opt_in_confirmed=false}],
 ['BAD_CONSENT_PROVENANCE','P02_CONSENT_ORIGIN_UNSUPPORTED',f=>{f.authorization.provenance='FORGED_NATIVE'}],
 ['BAD_SOURCE_EPOCH','P02_ORIGINAL_C72_SELECTION_INVALID',f=>{f.selection={}}],
 ['UNAUTHORIZED_DRAFT','P03_SEPARATE_HOST_DRAFT_OPTIN_MISSING',f=>{f.modelCandidate={input_sha256:sha(Buffer.from(f.humanInput)),text:'Draft host non autorizzato'}}],
 ['BLANK_INPUT','P02_INPUT_NONCE_INVALID',f=>{f.humanInput='  '}],
 ['BAD_NONCE','P02_INPUT_NONCE_INVALID',f=>{f.nonce=null}],
 ['MALFORMED_HISTORY','P02_HISTORY_INVALID',f=>{f.priorMessages=[true]}],
 ['PROXY_FRAME','HOST_FRAME_GETTER_PROXY_OR_SHAPE',f=>new Proxy(f,{get(){throw Error('hostile proxy getter')}})]
];
const failures=[];
try{
 for(let k=0;k<rows.length;k++){
  let fail=0;
  const [family,edge,mutate]=rows[k];
  for(let j=0;j<per;j++){
   const f={humanInput:"Diagnostica C87 caso "+(rng()%100003)+" in modalita sperimentale",
    nonce:"v9-neg-"+String(rng()).padStart(12,'0'),selection,
    authorization:{...valid},priorMessages:[],resetContext:true};
   const mutated=mutate(f)||f;
   let out;
   try{out=host.runTurn(mutated)}
   catch(e){fail++;if(failures.length<20)failures.push({family,reason:'THROWN',value:String(e)});continue}
   if(out.surface_a.origin!=='NO_VOICE'||out.surface_b.FIRST_EDGE!==edge){
    fail++;if(failures.length<20)failures.push({family,expected:edge,observed:out.surface_b.FIRST_EDGE});
   }
  }
  stats.push({family,seed:20261013,executions:per,mismatches:fail,expected:edge});
  mismatch+=fail;
 }
 if(fs.existsSync(host.ledger_file))throw Error('NEGATIVE_MUTATIONS_WROTE_LEDGER');
 const result={schema:'ikant-host-prepr-v9-gate-mutation/v1',seed:20261013,cases:count,families:stats.length,
  oracle:'strict expected FIRST_EDGE + NO_VOICE + zero C87 appends',mismatches:mismatch,failed_samples:failures,stats,
  caveat:'Actual adapter called 1M times on negative frames. Zero real C70 computations by design. Original positive cognitive turns are in separate 9-test integration suite.'};
 const out=process.argv[2];if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({status:mismatch===0?'PASS':'FAIL',cases:count,mismatches:mismatch,families:stats.length}));
 if(mismatch)process.exitCode=1;
}finally{host.dispose();fs.rmSync(parent,{recursive:true,force:true})}
