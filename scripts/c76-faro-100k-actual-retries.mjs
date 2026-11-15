import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {issueC69ExperimentalOffer,qualifyC69ExperimentalPreview} from '../host/c69-capability-first-preview.mjs';
import {runC70ExperimentalComputePreview} from '../src/c70-experimental-compute-preview.mjs';
import {routeC71HostDraft} from '../src/c71-experimental-host-draft.mjs';
import {buildC73ProjectCapsule} from '../host/c73-project-capsule.mjs';
import {runCanonicalSessionChat} from '../src/runtime-command.mjs';

const ROOT=new URL('../',import.meta.url);
const COUNT=100000,HEAD=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
const readme=fs.readFileSync(new URL('../README.md',import.meta.url));
const terms=fs.readFileSync(new URL('../TERMS.md',import.meta.url));
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
const blob=x=>crypto.createHash('sha1').update(Buffer.from('blob '+x.length+'\0')).update(x).digest('hex');
const offer=issueC72TermsOffer({sourceHead:HEAD,termsDigest:sha256(terms)});
const source={path:'README.md',blob_sha1:blob(readme),content_base64:readme.toString('base64')};
const expectedBlob=execFileSync('git',['hash-object','README.md'],{cwd:ROOT,encoding:'utf8'}).trim();
if(expectedBlob!==source.blob_sha1)throw Error('README_GIT_OBJECT_NOT_BOUND');
if(!/^v(20|2[1-9]|[3-9]\d)\./.test(process.version))throw Error('NODE_MAJOR_BELOW_20');

const human=['I ACCEPT','I ACCEPT','I ACCEPT','I ACCEPT','I ACCEPT','I ACCEPT','I ACCEPT',
 'I ACCEPT ','I ACCEPT EXPERIMENTAL','i accept'];
const choices=['EXPERIMENTAL','CANONICAL','EXPERIMENTAL','CANONICAL','EXPERIMENTAL',
 'CANONICAL','EXPERIMENTAL','CANONICAL','ACTIVE','EXPERIMENTAL '];
const messages=[
 'Confronta due scelte e chiarisci i limiti.',
 'Quali ipotesi possono essere falsificate?',
 'Valuta un piano operativo senza eseguire azioni.',
 'Identifica rischi e opportunita per un prototipo.',
 'Distingui fatti osservati e congetture.',
 'Esamina una proposta e le alternative.',
 'Quale prova concreta manca alla richiesta?',
 'Riepiloga i costi epistemici di un metodo.',
 'Verifica le assunzioni del modello.',
 'Proponi un controllo di integrita senza privilegi.'
];
const rootClasses=new Map(),statusCounts=new Map(),coverage=new Map();
let lastNoveltyIndex=-1,firstNovelty=[],invalidActive=0,leakedDocx=0;
let realC69=0,realC69DiskReopens=0,realC70=0,realC71=0,realC73=0,realCanonicalCalls=0;
let failMismatch=0,exceptionExamples=[],attempts=0;
const count=(map,k)=>map.set(k,(map.get(k)||0)+1);
function observe(kind,status,root,i){
 const key=kind+':'+status;
 count(statusCounts,key);
 count(rootClasses,root);
 if(!coverage.has(key)){coverage.set(key,i);lastNoveltyIndex=i;firstNovelty.push({attempt:i+1,key,root});}
}
function fail(err,i){failMismatch++;if(exceptionExamples.length<10)exceptionExamples.push({attempt:i+1,reason:String(err?.stack||err).slice(0,1000)});}

const start=performance.now();
for(let i=0;i<COUNT;i++){
 // Multiplicative bijection: exactly all 10^5 Cartesian tuples, order dispersed.
 const v=(i*31337+54321)%COUNT;
 const H=Math.floor(v/10000),B=Math.floor(v/1000)%10,
       S=Math.floor(v/100)%10,P=Math.floor(v/10)%10,C=v%10;
 const presented=P<8;
 const reply=human[C],chosen=choices[S];
 attempts++;
 try{
  const a=acceptC72Terms({offer,humanMessage:reply,termsPresented:presented});
  if(a.schema!=='ikant-le-c72-accepted/v1'){
   if(a.active!==false)throw Error('FALSE_ACTIVE_ADMISSION_DENIAL');
   observe('ADMISSION',a.status,a.first_unclosed_edge||'ADMISSION',i);continue;
  }
  const intro=presentC72Introduction(a);
  if(intro.schema!=='ikant-le-c72-orientation/v1')throw Error('ORIENTATION_REAL_CODE_DID_NOT_RUN');
  const selection=selectC72Mode({accepted:a,orientation:intro,humanMessage:chosen});
  if(selection.schema!=='ikant-le-c72-mode-selection/v1'){
   if(selection.active!==false)throw Error('FALSE_ACTIVE_SELECTION');
   observe('CHOICE',selection.status,selection.first_unclosed_edge||'CHOICE',i);continue;
  }
  if(selection.active!==false)throw Error('CANONICAL_MODE_CHOICE_IS_ACTIVE');
  if(chosen==='CANONICAL'){
   if(H<7){
    realCanonicalCalls++;
    let caught=null;
    try{runCanonicalSessionChat('I ACCEPT')}catch(e){caught=e}
    if(!caught||!/canonical composition handoff required/.test(String(caught.message)))
     throw Error('CANONICAL_HANDOFF_BYPASSED');
    observe('CANONICAL','DENIED_NO_HANDOFF','HOST_MESSAGE_INGRESS',i);
   }else{
    const p=buildC73ProjectCapsule({selection,
       ownerResult:{state:'ACTIVE'},hostFrame:{state:'ACTIVE'}});
    if(p.active!==false||p.surface_b_links.length)throw Error('FORGED_CANONICAL_FRAME_ACCEPTED');
    observe('CANONICAL',p.status,p.first_unclosed_edge,i);
   }
   continue;
  }
  const obj=B>=8?{...source,blob_sha1:String(B).repeat(40)}:source;
  const x={sourceHead:HEAD,offer:issueC69ExperimentalOffer({sourceHead:HEAD}),
    unifiedSelection:selection,sourceObject:obj,messages:[messages[P]]};
  if(H===9) x.requestCanonicalRuntime=true;
  if(H===1)x.sessionRoot=os.tmpdir();
  if(H===0||H===1||H===9){
   const q=qualifyC69ExperimentalPreview(x);realC69++;
   if(q.active!==false)throw Error('C69_FALSE_ACTIVE');
   if(q.local_samehash_verified===true)realC69DiskReopens++;
   observe('C69',q.status,q.first_unclosed_edge||'HOST_SOURCE_ORIGIN_UNATTESTED',i);
  }else if(H>=2&&H<=4){
   const q=runC70ExperimentalComputePreview(x);
   if(q.active!==false)throw Error('C70_FALSE_ACTIVE');
   if(q.executed_repository_kernel===true)realC70++;
   observe('C70',q.status,q.first_unclosed_edge||'HOST_SOURCE_ORIGIN_UNATTESTED',i);
  }else{
   const q=routeC71HostDraft(x);
   if(q.active!==false)throw Error('C71_FALSE_ACTIVE');
   if(q.executed_repository_kernel===true)realC71++;
   if(q.status!=='EXPERIMENTAL_HOST_DRAFT'){
    observe('C71',q.status,q.first_unclosed_edge||'C71',i);continue;
   }
   const p=buildC73ProjectCapsule({selection,experimentalResult:q});
   realC73++;
   if(p.active!==false||p.native_delivery_attested!==false||
     p.surface_b_links.length!==0){leakedDocx++;throw Error('C73_FALSE_NATIVE_DELIVERY');}
   observe('C73',p.status,p.first_unclosed_edge,i);
  }
 }catch(err){fail(err,i);}
}
const elapsedMs=Math.round(performance.now()-start);
const M=lastNoveltyIndex+1,tail=COUNT-M;
const result={
 schema:'ikant-le-c76-faro-100k-actual-node-retries/v1',
 method:'FARO - Falsificazione Avversariale del Routing e dell Origine',
 committed_head:HEAD,node:process.version,runner:'GITHUB_ACTIONS_REAL_NODE_NOT_NATIVE_CHATGPT',
 workload:'100000 ACTUAL IN-PROCESS BOOTSTRAP FUNCTION INVOCATIONS ON 100000 UNIQUE FIVE-AXIS CARTESIAN TUPLES',
 attempts,dimensions:{host_route:10,blob_identity:10,mode_choice:10,terms_presentation:10,consent_text:10},
 cartesian_tuples:10**5,unique_tuple_permutation:true,
 real_stage_invocations:{c69:realC69,c69_disk_reopen:realC69DiskReopens,c70_kernel:realC70,c71_kernel:realC71,c73_capsule:realC73,canonical_owner_entry_denials:realCanonicalCalls},
 unique_status_classes:coverage.size,
 first_class_discovery:[...firstNovelty],
 class_counts:Object.fromEntries([...statusCounts].sort()),
 roots:Object.fromEntries([...rootClasses].sort()),
 saturation:{M,last_novelty_attempt: M,tail_no_new_semantic_class:tail,threshold:13000,
  met_within_declared_classifier:tail>=13000,
  universal_computational_completeness_claimed:false},
 elapsed_ms:elapsedMs,fail_mismatches:failMismatch,exception_examples:exceptionExamples,
 native_chat_sessions_created:0,chrome_host_hook_attested:false,
 full_executable_closure_origin_attested_in_chatgpt:false,
 canonical_active_attested:false,host_docx_download_delivered:false,
 user_value_95pct_proven:false,authority:0
};
const formatted=JSON.stringify(result,null,2)+'\n';
const dest=process.env.FARO_JSON_OUT;
if(dest)fs.writeFileSync(dest,formatted);
process.stdout.write(JSON.stringify({
 attempts,elapsed_ms:elapsedMs,stages:result.real_stage_invocations,
 unique_status_classes:coverage.size,saturation:result.saturation,
 mismatches:failMismatch,exceptions:exceptionExamples,output:dest||'STDOUT_ONLY'
})+'\n');
if(failMismatch||invalidActive||leakedDocx||tail<13000||
 !realC70||!realC71||!realC73||!realCanonicalCalls||realC69DiskReopens===0)
 process.exitCode=1;
