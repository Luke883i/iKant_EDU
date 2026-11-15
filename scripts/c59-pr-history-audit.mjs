import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {FASTBOOT_CARRIERS} from '../src/fastboot-convergence.mjs';
import {ACTIVATION_BYTE_PATHS} from '../src/bootstrap-semantic.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const L=read('contracts/bootstrap-channel-lineage.json');
const X=read('contracts/session-chat-composition-census.json');
const S=read('contracts/bootstrap-composition-space.json');

const errors=[];
const prs=L.prs||[], registry=L.registry||[];
const numbers=prs.map(x=>x.pr), expected=Array.from({length:68},(_,i)=>i+1);
if(JSON.stringify(numbers)!==JSON.stringify(expected))errors.push('pr_coverage');
if(new Set(numbers).size!==68)errors.push('pr_duplicate');
const closedExpected=new Set([24,27,34,36,42,43]);
for(const p of prs){
 const want=p.pr===68?'OPEN':closedExpected.has(p.pr)?'CLOSED_UNMERGED':'MERGED';
 if(p.state!==want)errors.push('pr_state:'+p.pr);
}
const reg=new Map(registry.map(x=>[x.id,x]));
const allowedClasses=new Set(['DEPRECATED_RECOVERY_ONLY','ABSORBED_INTERNAL','ABSORBED_CANONICAL_SOURCE','DEPRECATED_REMOVED','EXCLUDED_NONDEPENDENCY','LEGACY_ALIAS','ABSORBED_CANONICAL_CARRIER','EXCLUDED_NONCANONICAL','EXCLUDED_LAST_RESORT','EXCLUDED_REMEDIATION_OPTIMIZATION','DEPRECATED_SELECTOR_STATE','EXCLUDED_LEGACY_PROFILE','EXTERNAL_HOST_BINDING_ONLY','ABSORBED_CANONICAL_PROFILE','ABSORBED_EVIDENCE','ABSORBED_INTERNAL_EXECUTOR','DEPRECATED_PROJECTION','ABSORBED_CANONICAL_BYTE_PATH','EXCLUDED_AS_ACTIVATION_SUCCESS','POST_ACTIVATION_PRESENTATION','INGRESS_ADAPTER_ALIAS','DEPRECATED_OWNER_LOOP','DEPRECATED_RETRY_MECHANISM','ORTHOGONAL_POST_ACTIVATION','ORTHOGONAL_EXTERNAL_HOST_CAPABILITY','ORTHOGONAL_RUNTIME_ROUTE','ABSORBED_PROOF','ABSORBED_CANONICAL_INGRESS','CANONICAL_OWNER']);
for(const r of registry){
 if(!allowedClasses.has(r.class))errors.push('registry_class:'+r.id);
 if(r.normalizes_to&&!reg.has(r.normalizes_to)&&!['GITHUB_API_BASE64','HOST_FILE_BRIDGE','SESSION_CHAT_LOCAL_HOST_KERNEL'].includes(r.normalizes_to))errors.push('alias_target:'+r.id);
}
const referenced=new Set();
for(const p of prs)for(const a of p.channel_atoms||[]){referenced.add(a);if(!reg.has(a))errors.push('unregistered_atom:'+p.pr+':'+a);}
for(const r of registry)if(!referenced.has(r.id))errors.push('unreferenced_registry:'+r.id);

for(const c of FASTBOOT_CARRIERS)if(!reg.has(c))errors.push('live_carrier_unregistered:'+c);
for(const b of ACTIVATION_BYTE_PATHS)if(!reg.has(b))errors.push('live_byte_path_unregistered:'+b);

const liveChecks=[
 ['src/local-host-meta-prompt.mjs','for_ai_agent_first_entrypoint','FOR_AI_AGENT_FIRST_ENTRYPOINT'],
 ['src/local-host-meta-prompt.mjs','HUMAN_FILE_HANDOFF','HUMAN_FILE_HANDOFF'],
 ['plugins/ikant-le-session-chat/server/server.mjs','ikant_le_open','APP_BOUND_IKANT_LE_OPEN'],
 ['src/session-chat-deployment.mjs','SESSION_CHAT_DEPLOYED','SESSION_CHAT_DEPLOYED'],
 ['src/runtime-availability.mjs','RUNTIME_BOUND_LIMITED','RUNTIME_BOUND_LIMITED'],
 ['docs/LOCAL_HOST_META_PROMPT.md','iKant','LOCAL_HOST_META_PROMPT']
];
for(const [file,needle,id] of liveChecks){
 const text=fs.readFileSync(path.join(ROOT,file),'utf8');
 if(text.includes(needle)&&!reg.has(id))errors.push('live_surface_unregistered:'+id);
}
const censusIds=new Set((X.channels||[]).map(x=>x.id));
for(const c of FASTBOOT_CARRIERS)if(!censusIds.has(c))errors.push('live_carrier_uncensused:'+c);
for(const b of ACTIVATION_BYTE_PATHS)if(!censusIds.has(b))errors.push('live_byte_path_uncensused:'+b);

const axisPrs=new Set();
for(const rows of Object.values(S.axes||{}))for(const row of rows)for(const pr of row.prs||[])axisPrs.add(pr);
for(const pr of axisPrs)if(!numbers.includes(pr))errors.push('axis_pr_unknown:'+pr);

const counts={
 total_prs:prs.length,
 merged:prs.filter(x=>x.state==='MERGED').length,
 closed_unmerged:prs.filter(x=>x.state==='CLOSED_UNMERGED').length,
 open:prs.filter(x=>x.state==='OPEN').length,
 bootstrap_or_host_relevant:prs.filter(x=>(x.channel_atoms||[]).length>0).length,
 no_new_channel:prs.filter(x=>(x.channel_atoms||[]).length===0).length,
 registry_atoms:registry.length,
 referenced_registry_atoms:referenced.size,
 live_fastboot_carriers:FASTBOOT_CARRIERS.length,
 live_activation_byte_paths:ACTIVATION_BYTE_PATHS.length,
 cartesian_axes:Object.keys(S.axes||{}).length
};
const out={schema:'ikant-le-c59-pr1-68-history-audit/v1',counts,closed_unmerged_prs:[24,27,34,36,42,43],open_pr:68,unclassified:errors,status:errors.length?'FAIL':'PASS'};
console.log(JSON.stringify(out,null,2));
if(errors.length)process.exitCode=1;
