import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const ROOT=new URL('../',import.meta.url);
const fingerprint=b=>crypto.createHash('sha256').update(b).digest('hex');
const anchor={
 'host/c72-unified-mode-admission.mjs':['validateC72ModeSelection','ADMISSION','WIRED'],
 'host/c69-capability-first-preview.mjs':['issueC69ExperimentalOffer','SOURCE_SELF_CHECK','WIRED'],
 'src/cognition-core.mjs':['compileCognitiveTurn','COGNITION','INDIRECT_C70'],
 'src/psyche.mjs':['appraiseInteraction','PSYCHE','INDIRECT_C70'],
 'src/self-world-state.mjs':['prepareSelfWorldTurn','SELF_WORLD','INDIRECT_C70'],
 'src/runtime-dispatch.mjs':['nodeDispatchReceiptPure','NODE_DISPATCH','INDIRECT_C70'],
 'src/c70-experimental-compute-preview.mjs':['runC70ExperimentalComputePreview','COGNITIVE_EXECUTOR','INDIRECT_C71'],
 'src/c71-experimental-host-draft.mjs':['routeC71HostDraft','VOICE_GUARD','WIRED'],
 'src/c82-experimental-answer.mjs':['composeC82ExperimentalAnswer','ANSWER','INDIRECT_C70'],
 'src/c83-semantic-router.mjs':['classifyC83Task','TASK_ROUTER','INDIRECT_C82'],
 'host/c89-relevance-gate.mjs':['evaluateC89BoundedRelevance','BOUNDED_RUBRIC','WIRED_OPTIONAL'],
 'host/c98-c82-connector-port.mjs':['isC98JSONDataTree','UNTRUSTED_DATA_GUARD_ONLY','WIRED_GUARD'],
 'host/c100-cohost-experimental.mjs':['prepareC100CohostDraft','DRAFT_BINDING','WIRED'],
 'host/c101-local-cohost-machine.mjs':['executeC101LocalCohostMachine','EXPERIMENTAL_COMPOSITION','WIRED'],
 'host/c86-surface-a.mjs':['prepareC86Surface','C84_OWNER_ONLY','EXCLUDED'],
 'host/c87-durable-ledger.mjs':['appendC87Turn','DURABLE_WRITER','EXCLUDED'],
 'host/c91-language-delegation.mjs':['draftC91AfterOwner','OWNER_BOUND_LANGUAGE','EXCLUDED'],
 'host/c92-independent-check.mjs':['validateC92IndependentEnvelope','REQUIRES_REAL_REVIEWER','EXCLUDED'],
 'host/c95-host-connector-relay.mjs':['adaptC95HostConnector','C84_ARTIFACT_CARRIER','EXCLUDED'],
 'host/c98-existing-c84-entry.mjs':['executeC98ExistingC84','C84_ENTRY','EXCLUDED'],
 'host/c97-uiux-projection.mjs':['projectC97Diagnostic','VISUAL_DIAGNOSTIC','UI_GUIDANCE_ONLY'],
};
function walk(dir){
 const absolute=new URL(dir+'/',ROOT);
 return fs.readdirSync(absolute,{withFileTypes:true}).flatMap(e=>
  e.isDirectory()?walk(dir+'/'+e.name):e.isFile()&&e.name.endsWith('.mjs')?[dir+'/'+e.name]:[]).sort();
}
const files=[...walk('src'),...walk('host')].sort();
const rows=files.map(file=>{
 const bytes=fs.readFileSync(new URL(file,ROOT));
 const content=bytes.toString('utf8');
 const exports=[...content.matchAll(/^export\s+(?:(?:async|default)\s+)?(?:function|class|const|let)\s+([A-Za-z_$][\w$]*)/gm)].map(x=>x[1]).sort();
 const a=anchor[file];
 return {file,sha256:fingerprint(bytes),exports,
  role:a?.[1]||'NOT_EXPLICITLY_ADMITTED',
  routing:a?.[2]||'INVENTORIED_ONLY_NOT_WIRED',
  required_export:a?.[0]||null};
});
const missing=Object.keys(anchor).filter(p=>!rows.some(r=>r.file===p));
const missingExports=rows.filter(r=>r.required_export&&!r.exports.includes(r.required_export)).map(r=>r.file);
const admitted=rows.filter(r=>r.routing==='WIRED'||r.routing==='WIRED_OPTIONAL'||r.routing==='WIRED_GUARD'||r.routing.startsWith('INDIRECT_'));
const report={schema:'ikant-le-c101-executable-census/v1',source:'LOCAL_CHECKOUT_UNAUTHENTICATED_REF',
 files_total:files.length,src_files:files.filter(x=>x.startsWith('src/')).length,
 host_files:files.filter(x=>x.startsWith('host/')).length,admitted:admitted.length,
 source_content_sha256:fingerprint(Buffer.from(rows.map(r=>r.file+':'+r.sha256).join('\n'))),
 missing,missing_exports:missingExports,rows,github_origin_attested:false,
 per_turn_host_dispatch_attested:false,owner_promotion:false,
 qualified:missing.length===0&&missingExports.length===0};
process.stdout.write(JSON.stringify(report)+'\n');
if(!report.qualified)process.exitCode=2;
