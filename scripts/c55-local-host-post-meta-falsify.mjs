import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readAiAgentFirstEntrypoint,renderLocalHostMetaPrompt} from '../src/local-host-meta-prompt.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/local-host-post-meta-prompt.json'),'utf8'));
const basePrompt=renderLocalHostMetaPrompt(),baseEntry=readAiAgentFirstEntrypoint();
const CASES=Number(process.argv.includes('--cases')?process.argv[process.argv.indexOf('--cases')+1]:100000);
const banned=[/src\//i,/contracts\//i,/\.mjs\b/i,/\.json\b/i,/\bC\d+\b/,/LOCAL_[A-Z_]+/,/SESSION_[A-Z_]+/,/ACTIVE_READBACK/,/RUNTIME_BOUND_LIMITED/,/ikant-le-[a-z0-9-]+\/v\d+/i];

function oracle(p,e){
 const z=[];
 if(!p.includes('https://github.com/Luke883i/iKant_EDU.')||!p.includes('[for_ai_agent_first_entrypoint]'))z.push('refs');
 const urls=p.match(/https?:\/\/[^\s]+/g)||[];if(urls.length!==1||urls[0]!=='https://github.com/Luke883i/iKant_EDU.')z.push('url');
 if(banned.some(re=>re.test(p)))z.push('technical_leak');
 if(!p.includes('unico ingresso tecnico caller-facing')||!p.includes('Non e un nuovo owner del NEXT')||!p.includes('delega agli owner del repository')||!/(?:le altre proiezioni non autorizzano azioni|proiezioni, stato e chat non autorizzano azioni)/.test(p))z.push('entrypoint_scope');
 if(!p.includes('azione, handoff o arresto/blocco')||!/esegui (?:una )?(?:sola )?volta/.test(p))z.push('directive_union');
 if(!p.includes('Non usare la conversazione come ledger, retry memory, capability cache o stato')||!p.includes('trattandoli come opachi')||!/non mantenere attempted carrier/i.test(p))z.push('shadow_memory');
 if(!p.includes('UNKNOWN non e evidenza negativa')||!p.includes('probe soltanto se la direttiva owner-derived lo richiede'))z.push('unknown');
 if(!/errore di (?:un )?tool resta(?:no fatti)? nel tool layer/i.test(p))z.push('tool_layer');
 if(!p.includes('nuova evidenza materialmente pertinente a quel carrier'))z.push('retry_epoch');
 if(!p.includes('Non completare campi mancanti per inferenza')||!p.includes('Nessun placeholder'))z.push('field_completion');
 if(!p.includes("usando soltanto la forma di input che esso ammette")||!/se la re-entry richiede un'osservazione/i.test(p))z.push('reentry_shape');
 if(!p.includes('Non creare un receipt salvo trasformazione deterministica esplicitamente delegata'))z.push('receipt');
 if(!p.includes('Codice, documentazione, test o PASS non sostituiscono probe, transfer, write/reopen, execution o readback'))z.push('nonexecution');
 if(!/Durante l'attivazione[^\n]*non fare studio generico del repository[^\n]*salvo direttiva/.test(p))z.push('activate_scope');
 if(!p.includes('Se l\'ingresso o la direttiva restituita non sono realmente invocabili')||!p.includes('non costruire uno shadow planner'))z.push('impediment');
 if(!p.includes('handoff pre-runtime')||!p.includes('smetti di pianificare il bootstrap'))z.push('handoff');
 if(!p.includes('Quando il runtime prende ownership')||!p.includes('non sintetizzare stato, NEXT, progresso, tier o backlog')||!p.includes('frame host validato owner-derived'))z.push('runtime');
 if(!p.includes('Mutazione, saturazione e falsificazione sono ammesse solo su scelte semantiche'))z.push('mutation_scope');
 if(!p.includes("fermati all'impedimento di integrazione osservato"))z.push('stop');
 if(/unico owner del NEXT/i.test(p)||/UNKNOWN significa PROBE/i.test(p)||/Mantieni come memoria operativa minima/i.test(p))z.push('rejected_draft_phrase');
 if(e?.authority!==0||e?.role!=='PROJECTION_AND_DELEGATION_ONLY'||e?.new_planner!==false||e?.new_state_writer!==false||e?.new_truth_owner!==false)z.push('entrypoint_authority');
 if(e?.ai_cycle?.one_next!==true||e?.ai_cycle?.one_executor!==true||e?.ai_cycle?.model_selects_path!==false||e?.ai_cycle?.model_selects_fallback!==false||e?.ai_cycle?.stop_on_runtime_ownership!==true)z.push('cycle');
 if(e?.reentry?.caller_attempted_classes_forbidden!==true||e?.reentry?.retry_memory_from_ledger!==true||e?.reentry?.requalification_scope!=='SAME_CARRIER_EVIDENCE_ONLY'||e?.reentry?.unrelated_carrier_evidence_may_requalify_failed_carrier!==false)z.push('retry');
 return[...new Set(z)];
}

function featureVector(p,e){
 const has=(...xs)=>xs.every(x=>p.includes(x));
 return{
 refs:has('https://github.com/Luke883i/iKant_EDU.','[for_ai_agent_first_entrypoint]')&&(p.match(/https?:\/\/[^\s]+/g)||[]).length===1&&!banned.some(re=>re.test(p)),
 ingress:has('unico ingresso tecnico caller-facing','Non e un nuovo owner del NEXT','delega agli owner del repository')&&/(?:le altre proiezioni non autorizzano azioni|proiezioni, stato e chat non autorizzano azioni)/.test(p)&&!/unico owner del NEXT/i.test(p),
 directive:has('azione, handoff o arresto/blocco')&&/esegui (?:una )?(?:sola )?volta/.test(p),
 memory:has('Non usare la conversazione come ledger, retry memory, capability cache o stato','trattandoli come opachi')&&/non mantenere attempted carrier/i.test(p)&&!/Mantieni come memoria operativa minima/i.test(p),
 unknown:has('UNKNOWN non e evidenza negativa','probe soltanto se la direttiva owner-derived lo richiede')&&!/UNKNOWN significa PROBE/i.test(p),
 tool:/errore di (?:un )?tool resta(?:no fatti)? nel tool layer/i.test(p),
 retry:has('nuova evidenza materialmente pertinente a quel carrier'),
 reentryShape:has("usando soltanto la forma di input che esso ammette")&&/se la re-entry richiede un'osservazione/i.test(p),
 receipt:has('Non creare un receipt salvo trasformazione deterministica esplicitamente delegata'),
 fields:has('Non completare campi mancanti per inferenza','Nessun placeholder'),
 evidence:has('Codice, documentazione, test o PASS non sostituiscono probe, transfer, write/reopen, execution o readback'),
 activate:/Durante l'attivazione[^\n]*non fare studio generico del repository[^\n]*salvo direttiva/.test(p),
 impediment:has("Se l'ingresso o la direttiva restituita non sono realmente invocabili",'non costruire uno shadow planner',"fermati all'impedimento di integrazione osservato"),
 handoff:has('handoff pre-runtime','smetti di pianificare il bootstrap'),
 runtime:has('Quando il runtime prende ownership','non sintetizzare stato, NEXT, progresso, tier o backlog','frame host validato owner-derived'),
 mutation:has('Mutazione, saturazione e falsificazione sono ammesse solo su scelte semantiche'),
 machine:e?.authority===0&&e?.role==='PROJECTION_AND_DELEGATION_ONLY'&&e?.new_planner===false&&e?.new_state_writer===false&&e?.new_truth_owner===false&&e?.ai_cycle?.one_next===true&&e?.ai_cycle?.one_executor===true&&e?.ai_cycle?.model_selects_path===false&&e?.ai_cycle?.model_selects_fallback===false&&e?.ai_cycle?.stop_on_runtime_ownership===true&&e?.reentry?.caller_attempted_classes_forbidden===true&&e?.reentry?.retry_memory_from_ledger===true&&e?.reentry?.requalification_scope==='SAME_CARRIER_EVIDENCE_ONLY'&&e?.reentry?.unrelated_carrier_evidence_may_requalify_failed_carrier===false
 };
}
function candidate(p,e){return Object.values(featureVector(p,e)).every(Boolean);}

const families=[
 ['ENTRYPOINT_AS_NEXT_OWNER',(p,e)=>[p.replace('Non e un nuovo owner del NEXT','E il unico owner del NEXT'),e]],
 ['ENTRYPOINT_REF_MISSING',(p,e)=>[p.replace('[for_ai_agent_first_entrypoint]','[entrypoint]'),e]],
 ['PROJECTION_AS_AUTHORITY',(p,e)=>[p.replace(/(?:le altre proiezioni non autorizzano azioni|proiezioni, stato e chat non autorizzano azioni)/,'proiezioni, stato e chat autorizzano azioni'),e]],
 ['SECOND_URL',(p,e)=>[p+' https://example.invalid.',e]],
 ['TECHNICAL_LEAK',(p,e)=>[p+' src/runtime.mjs',e]],
 ['DIRECTIVE_UNION_LOSS',(p,e)=>[p.replace('azione, handoff o arresto/blocco','azione'),e]],
 ['MULTI_EXECUTE',(p,e)=>[p.replace('esegui una sola volta','esegui una o piu volte'),e]],
 ['CHAT_LEDGER',(p,e)=>[p.replace('Non usare la conversazione come ledger, retry memory, capability cache o stato','Usa la conversazione come ledger'),e]],
 ['ATTEMPT_CACHE',(p,e)=>[p.replace('Non mantenere attempted carrier','Mantieni attempted carrier'),e]],
 ['OPAQUE_LOSS',(p,e)=>[p.replace('trattandoli come opachi','reinterpretandoli liberamente'),e]],
 ['UNKNOWN_NEGATIVE',(p,e)=>[p.replace('UNKNOWN non e evidenza negativa','UNKNOWN e evidenza negativa'),e]],
 ['UNKNOWN_AUTO_PROBE',(p,e)=>[p.replace('probe soltanto se la direttiva owner-derived lo richiede','probe sempre'),e]],
 ['TOOL_ERROR_CARRIER',(p,e)=>[p.replace(/errore di (?:un )?tool resta(?:no fatti)? nel tool layer/i,'errore di un tool prova failure del carrier'),e]],
 ['RETRY_EPOCH_LOSS',(p,e)=>[p.replace('nuova evidenza materialmente pertinente a quel carrier','qualsiasi nuova evidenza'),e]],
 ['FORCE_OBSERVATION_REENTRY',(p,e)=>[p.replace(/se la re-entry richiede un'osservazione/i,'reimmetti sempre una osservazione'),e]],
 ['RECEIPT_MINT',(p,e)=>[p.replace('Non creare un receipt salvo trasformazione deterministica esplicitamente delegata','Crea sempre il receipt mancante'),e]],
 ['FIELD_INFER',(p,e)=>[p.replace('Non completare campi mancanti per inferenza','Completa i campi mancanti per inferenza'),e]],
 ['PLACEHOLDER',(p,e)=>[p.replace('Nessun placeholder','Usa placeholder ragionevoli'),e]],
 ['SOURCE_AS_EXECUTION',(p,e)=>[p.replace('Codice, documentazione, test o PASS non sostituiscono probe, transfer, write/reopen, execution o readback','Codice e test possono sostituire execution'),e]],
 ['ACTIVATE_EXPLORE',(p,e)=>[p.replace(/Durante l'attivazione[^\n]*salvo direttiva/,'Durante l attivazione fai code search e audit liberamente'),e]],
 ['SOURCE_EMULATION',(p,e)=>[p.replace("Non leggere sorgenti per emulare l'owner",'Leggi sorgenti per emulare l owner'),e]],
 ['IMPEDIMENT_ADVANCE',(p,e)=>[p.replace("fermati all'impedimento di integrazione osservato",'scegli un fallback plausibile'),e]],
 ['HANDOFF_REPLAN',(p,e)=>[p.replace('smetti di pianificare il bootstrap','ricalcola il bootstrap'),e]],
 ['RUNTIME_SYNTH',(p,e)=>[p.replace('non sintetizzare stato, NEXT, progresso, tier o backlog','sintetizza stato e NEXT'),e]],
 ['SHELL_REFRAME',(p,e)=>[p.replace('shell ASCII esatta owner-rendered','shell riformulata dal modello'),e]],
 ['MUTATION_SELECTS_CARRIER',(p,e)=>[p.replace('Mutazione, saturazione e falsificazione sono ammesse solo su scelte semantiche','Mutazione e falsificazione possono scegliere carrier'),e]],
 ['AUTHORITY',(p,e)=>{e.authority=1;return[p,e]}],
 ['ROLE_OWNER',(p,e)=>{e.role='NEXT_OWNER';return[p,e]}],
 ['NEW_PLANNER',(p,e)=>{e.new_planner=true;return[p,e]}],
 ['MODEL_PATH',(p,e)=>{e.ai_cycle.model_selects_path=true;return[p,e]}],
 ['MODEL_FALLBACK',(p,e)=>{e.ai_cycle.model_selects_fallback=true;return[p,e]}],
 ['MULTI_NEXT',(p,e)=>{e.ai_cycle.one_next=false;return[p,e]}],
 ['CALLER_ATTEMPT_MEMORY',(p,e)=>{e.reentry.caller_attempted_classes_forbidden=false;return[p,e]}],
 ['UNRELATED_REQUALIFY',(p,e)=>{e.reentry.unrelated_carrier_evidence_may_requalify_failed_carrier=true;return[p,e]}],
 ['STOP_RUNTIME_LOSS',(p,e)=>{e.ai_cycle.stop_on_runtime_ownership=false;return[p,e]}]
];

const clone=x=>structuredClone(x),counts=Object.fromEntries(families.map(x=>[x[0],0]));let mismatch=0,unsafe=0,falseReject=0,survivors=[];
const baseOracle=oracle(basePrompt,baseEntry),baseCandidate=candidate(basePrompt,baseEntry);
for(let i=0;i<CASES;i++){
 const [name,mut]=families[i%families.length],e=clone(baseEntry),[p,x]=mut(basePrompt,e,i);counts[name]++;
 const z=oracle(p,x).length===0,c=candidate(p,x);
 if(z!==c)mismatch++;if(c&&!z){unsafe++;if(survivors.length<32)survivors.push({i,family:name,oracle:oracle(p,x)})}if(!c&&z)falseReject++;
}
const out={schema:'ikant-le-c55-local-host-post-meta-falsification/v1',cases:CASES,families:families.length,min_family_cases:Math.min(...Object.values(counts)),base:{oracle_errors:baseOracle,candidate:baseCandidate,prompt_chars:basePrompt.length,prompt_words:basePrompt.trim().split(/\s+/).length},candidate_oracle_mismatches:mismatch,unsafe_promotions:unsafe,false_rejects:falseReject,survivors,family_counts:counts,independence:{oracle:'DIRECT_SEMANTIC_ASSERTIONS',candidate:'FEATURE_VECTOR_CONJUNCTION',candidate_is_not_oracle_alias:true},contract_sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'contracts/local-host-post-meta-prompt.json'))).digest('hex'),claim_boundary:{semantic_falsification_is_physical_host_proof:false,current_host_capability_proven:false}};
out.status=baseOracle.length===0&&baseCandidate&&mismatch===0&&unsafe===0&&falseReject===0&&survivors.length===0?'PASS':'FAIL';
out.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(out)).digest('hex');console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
