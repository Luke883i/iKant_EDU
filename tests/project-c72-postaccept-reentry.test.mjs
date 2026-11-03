import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reenterC72V2PostAccept,classifyC72OwnerEvidence} from '../host/project-c72-postaccept-reentry.mjs';
import {validateC72V2Accepted,validateC72V2Orientation,selectC72V2Mode,validateC72V2ModeSelection} from '../host/c72-public-mode-admission.mjs';
import {oneShellFrame,renderOneShell} from '../host/project-oneshell-edu.mjs';
import {renderOneShellVisualHtml,createOneShellVisualModel,verifyOneShellVisualEquivalence} from '../host/project-oneshell-visual.mjs';
const git=(...args)=>execFileSync('git',args,{cwd:new URL('../',import.meta.url),encoding:'utf8'}).trim();
const H=git('rev-parse','HEAD');
const paths=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const doc=path=>{const content=readFileSync(new URL('../'+path,import.meta.url),'utf8');const bytes=Buffer.from(content);const sha=createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');assert.equal(sha,git('rev-parse','HEAD:'+path));return{path,source_head:H,content,blob_sha1:sha}};
const docs=paths.map(doc), prior={pinned_blob_shas:Object.fromEntries(docs.map(d=>[d.path,d.blob_sha1])),source_head:H,terms_link:`https://github.com/Luke883i/iKant_EDU/blob/${H}/TERMS.md`,host_link_displayed:true,distinct_human_message_observed:true};
const base=()=>({sourceHead:H,liveHead:H,humanMessage:'I ACCEPT',priorTurnEvidence:prior,documents:docs});
test('postaccept original C72 owner only: linked receipts, introduction, EDU selection',()=>{
 const a=reenterC72V2PostAccept(base());assert.equal(a.ok,true,JSON.stringify(a));
 assert(validateC72V2Accepted(a.accepted));assert(validateC72V2Orientation(a.introduction,a.accepted));
 assert.equal(a.introduction.text.length>100,true);assert.equal(a.terms_body_presented,false);assert.equal(a.terms_read_attested,false);
 assert.equal(a.native_event_attested,false);assert.equal(a.preinstalled_gateway_attested,false);
 const selection=selectC72V2Mode({accepted:a.accepted,orientation:a.introduction,humanMessage:'EDU'});
 assert(validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead:H}));assert.equal(selection.active,false);
});
test('negative postaccept inputs fail before owner and never issue a receipt',()=>{
 const variants=[
  {humanMessage:'I ACCEPT\n'}, {humanMessage:'EDU'},{liveHead:'0'.repeat(40)},
  {priorTurnEvidence:{...prior,host_link_displayed:false}},
  {priorTurnEvidence:{...prior,distinct_human_message_observed:false}},
  {priorTurnEvidence:{...prior,terms_link:'https://wrong.invalid/terms'}},
  {documents:[...docs].reverse()},
  {documents:docs.map((d,i)=>i===4?{...d,content:d.content+'?'}:d)},
  {documents:docs.map((d,i)=>i===3?{...d,source_head:'0'.repeat(40)}:d)},
  {documents:docs.slice(0,4)},
  {priorTurnEvidence:{...prior,pinned_blob_shas:{...prior.pinned_blob_shas,'TERMS.md':'0'.repeat(40)}}}
 ];
 for(const change of variants){const r=reenterC72V2PostAccept({...base(),...change});assert.equal(r.ok,false,JSON.stringify(change));assert.equal(r.original_owner_invoked,false);assert.equal(r.introduction,null);}
});
test('10k deterministic cross product: unobserved owner and visual brand are fail-closed',()=>{
 const discoveries=['UNKNOWN','EMPTY','FOUND','UNKNOWN','EMPTY','FOUND','UNKNOWN','EMPTY','FOUND','EMPTY'];
 const callabilities=['UNKNOWN','CALLABLE','UNAVAILABLE_VERIFIED','UNKNOWN','CALLABLE','UNKNOWN','UNAVAILABLE_VERIFIED','CALLABLE','UNKNOWN','UNKNOWN'];
 const outcomes=['NOT_INVOKED','SUCCEEDED','FAILED','UNKNOWN','NOT_INVOKED','SUCCEEDED','UNKNOWN','FAILED','NOT_INVOKED','NOT_INVOKED'];
 const receipts=['UNOBSERVED','VALID','INVALID','UNOBSERVED','VALID','INVALID','VALID','UNOBSERVED','INVALID','VALID'];
 const discoveryContexts=['UNPROBED','CATALOG_EMPTY','OWNER_NAMED','CATALOG_TIMED_OUT','EMPTY_BY_FILTER','OWNER_ALIAS_MATCH','PLUGIN_OMITTED','REPO_ONLY','OWNER_ADVERTISED','CAPABILITY_ONLY'];
 const callableContexts=['EXECUTOR_UNKNOWN','OWNER_LOADED','MODULE_ABSENT_PROVED','BRIDGE_UNMEASURED','NODE_READY','EXECUTION_NOT_TESTED','MODULE_INCOMPATIBLE','CALLBACK_READY','VERSION_UNCHECKED','TOOL_NAME_MISSING'];
 const outcomeContexts=['BEFORE_ACCEPT','ORIGINAL_RECEIPT','OWNER_THROW','TOOL_TIMEOUT','AFTER_TERMS','OWNER_LINKED_INTRO','UNKNOWN_TRANSPORT','CRYPTO_FAILURE','FIRST_MESSAGE','CATALOG_FALLBACK'];
 const receiptContexts=['NO_RECEIPT','VALID_LINK_OFFER','WRONG_DIGEST','NOT_READ_BACK','VALID_ACCEPTANCE','WRONG_HEAD','VALID_INTRO','UNRETURNED','TAMPERED','VALID_SELECTION'];
 const trace=[],schema=new Set(),gold=createHash('sha256').update(readFileSync(new URL('../assets/brand/ikant-light.svg',import.meta.url))).digest('hex');
 for(let i=0;i<10000;i++){
  const a=i%10,b=Math.floor(i/10)%10,c=Math.floor(i/100)%10,d=Math.floor(i/1000)%10;
  const evidence={discovery:discoveries[a],callability:callabilities[b],outcome:outcomes[c],receipt:receipts[d]};
  const edge=classifyC72OwnerEvidence(evidence);schema.add(edge);
  assert.notEqual(edge,'C72_DIAGNOSTIC_EVIDENCE_INVALID');
  if(evidence.discovery==='EMPTY'&&evidence.callability==='UNKNOWN'&&evidence.outcome==='NOT_INVOKED')assert.equal(edge,'C72_OWNER_UNRESOLVED_NOT_ABSENT');
  if(edge==='C72_OWNER_UNAVAILABLE_VERIFIED')assert.equal(evidence.callability,'UNAVAILABLE_VERIFIED');
  if(edge==='C72_OWNER_RECEIPT_VERIFIED')assert.equal(evidence.outcome,'SUCCEEDED');
  const f=oneShellFrame({esito:'TEST_HOST',b:'Host diagnostic '+i,prova:'SHA '+gold,edge,next:'STOP'});
  const model=createOneShellVisualModel(f),html=renderOneShellVisualHtml(f);
  const check=verifyOneShellVisualEquivalence(model,f);
  assert.equal(check.byte_exact,true);assert.equal(model.brand.asset_sha256,gold);
  assert.equal(html.match(/class="ikant-brand-mark"/g)?.length,1);
  assert(html.indexOf('ikant-brand-mark')<html.indexOf('<strong>iKant · OneShell</strong>'));
  assert.equal(html.match(/data-slot=/g).length,6);assert.equal(f.slots.A,'NO_VOICE');
  assert.equal(html.includes('<button'),false);assert.equal(model.brand.native_registered,false);
  if(i%1000===0)assert.equal(renderOneShell(f).includes('NO_VOICE'),true);
  trace.push(JSON.stringify({index:i,axes:[a,b,c,d],contexts:[discoveryContexts[a],callableContexts[b],outcomeContexts[c],receiptContexts[d]],discovery:evidence.discovery,callability:evidence.callability,outcome:evidence.outcome,receipt:evidence.receipt,edge,oneshell_brand_sha256:model.brand.asset_sha256,six_slots:6,voice:'NO_VOICE',registered:false}));
 }
 assert.equal(trace.length,10000);assert(schema.has('C72_OWNER_UNRESOLVED_NOT_ABSENT'));
 const bytes=trace.join('\n')+'\n';
 const signature=createHash('sha256').update(bytes).digest('hex');
 const dest=process.env.IKANT_C72_BRAND_TRACE_DIR;
 if(dest){mkdirSync(dest,{recursive:true});const file=join(dest,'c72-brand-semantic-10000.jsonl');
  writeFileSync(file,bytes,{flag:'wx'});assert.equal(readFileSync(file,'utf8'),bytes);
  const receipt={schema:'ikant-host-c72-brand-semantic-10k/v1',cases:trace.length,sha256:signature,
   dimensions:['discovery','callability','outcome','receipt'],native_observations:0,owner_replaced:false,brand_source_verified:true};
  const r=join(dest,'RECEIPT.json');writeFileSync(r,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  assert.deepEqual(JSON.parse(readFileSync(r,'utf8')),receipt);}

 assert.match(signature,/^[a-f0-9]{64}$/);
 console.log('C72_BRAND_10K_TRACE_SHA256='+signature+' distinct_indices='+new Set(trace.map(x=>JSON.parse(x).index)).size);
});
