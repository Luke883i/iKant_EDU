import crypto from 'node:crypto';
import {readAiAgentFirstEntrypoint,renderLocalHostMetaPrompt} from '../src/local-host-meta-prompt.mjs';

const CASES=Number(process.argv.includes('--cases')?process.argv[process.argv.indexOf('--cases')+1]:100000);
const basePrompt=renderLocalHostMetaPrompt(),baseEntry=readAiAgentFirstEntrypoint();
const levels=['lexical','directive-authority','evidence-provenance','retry-temporal','admission','handoff-runtime-route','host-frame-ux','native-identity','composite-cross-phase'];

function oracleErrors(p,e){
 const z=[];
 const urls=p.match(/https?:\/\/[^\s]+/g)||[];
 if(urls.length!==1||urls[0]!=='https://github.com/Luke883i/iKant_EDU.')z.push('M00_REPOSITORY');
 if(!p.includes('[for_ai_agent_first_entrypoint]')||!p.includes('Non e un nuovo owner del NEXT')||!p.includes('delega agli owner del repository'))z.push('M01_INGRESS');
 if(!p.includes("Solo la direttiva owner-derived autorizza un'azione")||!/proiezioni, stato e chat non autorizzano (?:nulla|azioni)/.test(p))z.push('M02_AUTHORIZATION');
 if(!p.includes('consuma una direttiva')||!p.includes("esegui una volta l'azione e il carrier nominati"))z.push('M03_SINGLE_EXECUTION');
 if(!p.includes('non fare azioni laterali')||!p.includes('salvo direttiva'))z.push('M04_NO_LATERAL');
 if(!p.includes('usando soltanto la forma di input che esso ammette')||!/se la re-entry richiede un'osservazione/i.test(p)||!p.includes('reimmetti solo evidenza tipizzata ammessa'))z.push('M05_REENTRY');
 if(!p.includes('Non usare la conversazione come ledger, retry memory, capability cache o stato')||!p.includes('non mantenere attempted carrier')||!p.includes('trattandoli come opachi'))z.push('M06_MEMORY');
 if(!p.includes('UNKNOWN non e evidenza negativa')||!p.includes('probe soltanto se la direttiva owner-derived lo richiede'))z.push('M07_UNKNOWN');
 if(!/(?:Errori tool restano|Un errore di tool resta) nel tool layer/.test(p))z.push('M08_TOOL_LAYER');
 if(!/nuova evidenza (?:materialmente pertinente a quel carrier|pertinente allo stesso carrier)/.test(p))z.push('M09_RETRY');
 if(!p.includes('Non creare un receipt salvo trasformazione deterministica esplicitamente delegata')||!p.includes('Non completare campi mancanti per inferenza')||!p.includes('Nessun placeholder'))z.push('M10_EVIDENCE_COMPLETION');
 if(!/Codice(?:, documentazione, test o PASS|\/test\/PASS) non sostituiscono probe, transfer, write\/reopen, execution o readback/.test(p))z.push('M11_NONEXECUTION');
 if(!p.includes("fermati all'impedimento di integrazione osservato")||!p.includes("non emulare l'owner dal sorgente")||!p.includes('shadow planner'))z.push('M12_IMPEDIMENT');
 if(!p.includes("Se l'owner presenta i Terms")||!p.includes('esattamente uguale a I ACCEPT')||!p.includes("non inferire l'accettazione")||!p.includes('non introdurre un secondo gate'))z.push('M13_TERMS');
 if(!p.includes('handoff pre-runtime')||!p.includes('smetti di pianificare il bootstrap'))z.push('M14_HANDOFF');
 if(!p.includes('Quando il runtime prende ownership')||!p.includes('incluso EXIT IKANT')||!p.includes('route runtime/host validata'))z.push('M15_RUNTIME_ROUTE');
 if(!p.includes('anche baseline/pre-accept')||!p.includes('frame host validato owner-derived')||!p.includes('Non ricostruire stato o UX da stdout, filename, chat o documentazione'))z.push('M16_FRAME');
 if(!p.includes('prima gli artifact verificati e poi la shell ASCII esatta')||!p.includes('Non riformulare, riordinare o omettere la shell')||!p.includes('non produrre una risposta sostitutiva fingendo che sia iKant'))z.push('M17_PRESENTATION');
 if(!p.includes('Non dichiarare iKant attore nativo del transcript')||!p.includes('participant lease persistente')||!p.includes('grant/standing del scheduler per il turno')||!p.includes('delivery/readback nativi degli exact runtime bytes'))z.push('M18_NATIVE');
 if(!p.includes('Mutazione, saturazione e falsificazione sono ammesse solo su scelte semantiche aperte e delegate')||!p.includes('non sostituiscono capability evidence o azioni fisiche'))z.push('M19_MUTATION');
 if(e?.authority!==0||e?.role!=='PROJECTION_AND_DELEGATION_ONLY'||e?.new_planner!==false||e?.new_state_writer!==false||e?.new_truth_owner!==false)z.push('MACHINE_AUTHORITY');
 if(e?.ai_cycle?.one_next!==true||e?.ai_cycle?.one_executor!==true||e?.ai_cycle?.model_selects_path!==false||e?.ai_cycle?.model_selects_fallback!==false||e?.ai_cycle?.stop_on_runtime_ownership!==true)z.push('MACHINE_CYCLE');
 if(e?.reentry?.caller_attempted_classes_forbidden!==true||e?.reentry?.retry_memory_from_ledger!==true||e?.reentry?.requalification_scope!=='SAME_CARRIER_EVIDENCE_ONLY'||e?.reentry?.unrelated_carrier_evidence_may_requalify_failed_carrier!==false)z.push('MACHINE_RETRY');
 return[...new Set(z)];
}

function candidateAccepts(p,e){
 const groups=[
  /https:\/\/github\.com\/Luke883i\/iKant_EDU\./.test(p)&&(p.match(/https?:\/\/[^\s]+/g)||[]).length===1,
  /\[for_ai_agent_first_entrypoint\][\s\S]*Non e un nuovo owner del NEXT:[\s\S]*delega agli owner del repository/.test(p),
  /Solo la direttiva owner-derived autorizza un'azione/.test(p)&&/proiezioni, stato e chat non autorizzano (?:nulla|azioni)/.test(p),
  /consuma una direttiva;[\s\S]*esegui una volta l'azione e il carrier nominati;[\s\S]*non fare azioni laterali/.test(p),
  /Durante l'attivazione[\s\S]*salvo direttiva/.test(p),
  /forma di input che esso ammette/.test(p)&&/re-entry richiede un'osservazione/.test(p)&&/evidenza tipizzata ammessa/.test(p),
  /Non usare la conversazione come ledger, retry memory, capability cache o stato/.test(p)&&/non mantenere attempted carrier/.test(p)&&/opachi/.test(p),
  /UNKNOWN non e evidenza negativa/.test(p)&&/probe soltanto se la direttiva owner-derived lo richiede/.test(p),
  /(?:Errori tool restano|Un errore di tool resta) nel tool layer/.test(p)&&/nuova evidenza (?:materialmente pertinente a quel carrier|pertinente allo stesso carrier)/.test(p),
  /Non creare un receipt/.test(p)&&/Non completare campi mancanti per inferenza/.test(p)&&/Nessun placeholder/.test(p)&&/Codice(?:, documentazione, test o PASS|\/test\/PASS) non sostituiscono/.test(p),
  /impedimento di integrazione osservato/.test(p)&&/non emulare l'owner dal sorgente/.test(p)&&/shadow planner/.test(p),
  /owner presenta i Terms/.test(p)&&/esattamente uguale a I ACCEPT/.test(p)&&/non inferire l'accettazione/.test(p)&&/secondo gate/.test(p),
  /handoff pre-runtime/.test(p)&&/smetti di pianificare il bootstrap/.test(p),
  /runtime prende ownership/.test(p)&&/incluso EXIT IKANT/.test(p)&&/route runtime\/host validata/.test(p),
  /baseline\/pre-accept/.test(p)&&/frame host validato owner-derived/.test(p)&&/Non ricostruire stato o UX/.test(p),
  /artifact verificati[\s\S]*shell ASCII esatta/.test(p)&&/Non riformulare, riordinare o omettere la shell/.test(p)&&/risposta sostitutiva fingendo che sia iKant/.test(p),
  /Non dichiarare iKant attore nativo del transcript/.test(p)&&/participant lease persistente/.test(p)&&/grant\/standing del scheduler per il turno/.test(p)&&/delivery\/readback nativi degli exact runtime bytes/.test(p),
  /Mutazione, saturazione e falsificazione/.test(p)&&/non sostituiscono capability evidence o azioni fisiche/.test(p)
 ];
 const machine=e?.authority===0&&e?.role==='PROJECTION_AND_DELEGATION_ONLY'&&e?.new_planner===false&&e?.new_state_writer===false&&e?.new_truth_owner===false&&e?.ai_cycle?.one_next===true&&e?.ai_cycle?.one_executor===true&&e?.ai_cycle?.model_selects_path===false&&e?.ai_cycle?.model_selects_fallback===false&&e?.ai_cycle?.stop_on_runtime_ownership===true&&e?.reentry?.caller_attempted_classes_forbidden===true&&e?.reentry?.retry_memory_from_ledger===true&&e?.reentry?.requalification_scope==='SAME_CARRIER_EVIDENCE_ONLY'&&e?.reentry?.unrelated_carrier_evidence_may_requalify_failed_carrier===false;
 return groups.every(Boolean)&&machine;
}

const mut=[
 ['REPO','lexical',(p,e)=>[p.replace('https://github.com/Luke883i/iKant_EDU.','https://example.invalid.'),e]],
 ['ENTRYPOINT','directive-authority',(p,e)=>[p.replace('[for_ai_agent_first_entrypoint]','[other_entrypoint]'),e]],
 ['NEXT_OWNER','directive-authority',(p,e)=>[p.replace('Non e un nuovo owner del NEXT','E il nuovo owner del NEXT'),e]],
 ['PROJECTION_AUTH','directive-authority',(p,e)=>[p.replace("Solo la direttiva owner-derived autorizza un'azione",'Anche le proiezioni autorizzano azioni'),e]],
 ['MULTI_EXEC','directive-authority',(p,e)=>[p.replace("esegui una volta l'azione e il carrier nominati","esegui tutte le azioni plausibili"),e]],
 ['LATERAL','directive-authority',(p,e)=>[p.replaceAll('non fare azioni laterali','fai azioni laterali'),e]],
 ['REENTRY_FREEFORM','evidence-provenance',(p,e)=>[p.replace('reimmetti solo evidenza tipizzata ammessa','reimmetti una descrizione libera'),e]],
 ['REENTRY_ALWAYS','evidence-provenance',(p,e)=>[p.replace("Se la re-entry richiede un'osservazione","Reimmetti sempre un'osservazione"),e]],
 ['CHAT_LEDGER','evidence-provenance',(p,e)=>[p.replace('Non usare la conversazione come ledger, retry memory, capability cache o stato','Usa la conversazione come ledger e stato'),e]],
 ['ATTEMPT_MEMORY','retry-temporal',(p,e)=>[p.replace('non mantenere attempted carrier','mantieni attempted carrier'),e]],
 ['UNKNOWN_NEGATIVE','retry-temporal',(p,e)=>[p.replace('UNKNOWN non e evidenza negativa','UNKNOWN e evidenza negativa'),e]],
 ['UNKNOWN_AUTO_PROBE','retry-temporal',(p,e)=>[p.replace('probe soltanto se la direttiva owner-derived lo richiede','probe sempre'),e]],
 ['TOOL_CARRIER','evidence-provenance',(p,e)=>[p.replace(/(?:Errori tool restano|Un errore di tool resta) nel tool layer/,'Un errore tool prova failure del carrier'),e]],
 ['RETRY_OTHER','retry-temporal',(p,e)=>[p.replace(/nuova evidenza (?:materialmente pertinente a quel carrier|pertinente allo stesso carrier)/,'qualsiasi nuova evidenza'),e]],
 ['FILL_RECEIPT','evidence-provenance',(p,e)=>[p.replace('Non creare un receipt salvo trasformazione deterministica esplicitamente delegata sui dati osservati','Crea il receipt mancante per inferenza'),e]],
 ['FILL_FIELD','evidence-provenance',(p,e)=>[p.replace('Non completare campi mancanti per inferenza','Completa i campi mancanti per inferenza'),e]],
 ['PLACEHOLDER','evidence-provenance',(p,e)=>[p.replace('Nessun placeholder','Usa placeholder ragionevoli'),e]],
 ['SOURCE_PROOF','evidence-provenance',(p,e)=>[p.replace(/Codice(?:, documentazione, test o PASS|\/test\/PASS) non sostituiscono probe, transfer, write\/reopen, execution o readback/,'Codice e test possono sostituire execution'),e]],
 ['EMULATE','evidence-provenance',(p,e)=>[p.replace("non emulare l'owner dal sorgente","emula l'owner dal sorgente"),e]],
 ['NO_IMPEDIMENT','directive-authority',(p,e)=>[p.replace("fermati all'impedimento di integrazione osservato",'scegli un fallback plausibile'),e]],
 ['ACCEPT_INFER','admission',(p,e)=>[p.replace('attendi un messaggio successivo esattamente uguale a I ACCEPT','inferisci I ACCEPT dal contesto'),e]],
 ['SECOND_GATE','admission',(p,e)=>[p.replace('non introdurre un secondo gate','chiedi una seconda conferma'),e]],
 ['HANDOFF_REPLAN','handoff-runtime-route',(p,e)=>[p.replace('smetti di pianificare il bootstrap','ricalcola il bootstrap'),e]],
 ['TURN_BYPASS','handoff-runtime-route',(p,e)=>[p.replace('route runtime/host validata','risposta diretta del modello'),e]],
 ['EXIT_SELF','handoff-runtime-route',(p,e)=>[p.replace('incluso EXIT IKANT','escluso EXIT IKANT'),e]],
 ['BASELINE_FRAME_DROP','host-frame-ux',(p,e)=>[p.replace('anche baseline/pre-accept','solo ACTIVE'),e]],
 ['STDOUT_FRAME','host-frame-ux',(p,e)=>[p.replace('consuma solo il frame host validato owner-derived','usa stdout come stato'),e]],
 ['FRAME_RECONSTRUCT','host-frame-ux',(p,e)=>[p.replace('Non ricostruire stato o UX da stdout, filename, chat o documentazione','ricostruisci stato da chat e filename'),e]],
 ['ARTIFACT_AFTER','host-frame-ux',(p,e)=>[p.replace('prima gli artifact verificati e poi la shell ASCII esatta','prima la shell e poi gli artifact'),e]],
 ['SHELL_REFRAME','host-frame-ux',(p,e)=>[p.replace('Non riformulare, riordinare o omettere la shell','riassumi la shell'),e]],
 ['FALLBACK_PROSE','host-frame-ux',(p,e)=>[p.replace("non produrre una risposta sostitutiva fingendo che sia iKant","produci una risposta sostitutiva come iKant"),e]],
 ['PREFIX_NATIVE','native-identity',(p,e)=>[p.replace('Non dichiarare iKant attore nativo del transcript','Dichiara iKant attore nativo del transcript'),e]],
 ['NATIVE_NO_LEASE','native-identity',(p,e)=>[p.replace('participant lease persistente','participant label'),e]],
 ['NATIVE_NO_GRANT','native-identity',(p,e)=>[p.replace('grant/standing del scheduler per il turno','standing generico'),e]],
 ['NATIVE_NO_READBACK','native-identity',(p,e)=>[p.replace('delivery/readback nativi degli exact runtime bytes','delivery dichiarata dal modello'),e]],
 ['ACTIVATE_EXPLORE','directive-authority',(p,e)=>[p.replace(/Durante l'attivazione[^\n]*salvo direttiva/,'Durante l attivazione fai code search e audit liberamente'),e]],
 ['MUTATION_CARRIER','composite-cross-phase',(p,e)=>[p.replace('non sostituiscono capability evidence o azioni fisiche','possono sostituire capability evidence'),e]],
 ['MACHINE_PATH','directive-authority',(p,e)=>{e.ai_cycle.model_selects_path=true;return[p,e]}],
 ['MACHINE_FALLBACK','directive-authority',(p,e)=>{e.ai_cycle.model_selects_fallback=true;return[p,e]}],
 ['MACHINE_RETRY','retry-temporal',(p,e)=>{e.reentry.unrelated_carrier_evidence_may_requalify_failed_carrier=true;return[p,e]}],
 ['MACHINE_AUTH','directive-authority',(p,e)=>{e.authority=1;return[p,e]}]
];

let seed=0xC56FA17E>>>0;
const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed};
const counts=Object.fromEntries(mut.map(x=>[x[0],0])),levelCounts=Object.fromEntries(levels.map(x=>[x,0])),worlds=new Set(),baseErrors=oracleErrors(basePrompt,baseEntry);
let mismatch=0,unsafe=0,falseReject=0,survivors=[];
for(let i=0;i<CASES;i++){
 let p=basePrompt,e=structuredClone(baseEntry),family=i%mut.length;
 const faults=1+(rnd()%4),used=[];
 for(let j=0;j<faults;j++){
  const k=(family+j*11+(rnd()%mut.length))%mut.length;
  const [name,level,fn]=mut[k];used.push({name,level});[p,e]=fn(p,e);
 }
 counts[mut[family][0]]++;levelCounts[mut[family][1]]++;
 worlds.add(crypto.createHash('sha256').update(p+JSON.stringify(e.ai_cycle)+JSON.stringify(e.reentry)+String(e.authority)).digest('hex'));
 const z=oracleErrors(p,e).length===0,c=candidateAccepts(p,e);
 if(c!==z)mismatch++;if(c&&!z){unsafe++;if(survivors.length<24)survivors.push({i,used,errors:oracleErrors(p,e)})}if(!c&&z)falseReject++;
}
const out={
 schema:'ikant-le-c56-local-host-session-meta-falsification/v2',
 seed:'0xC56FA17E',
 cases:CASES,
 families:mut.length,
 abstraction_levels:levels,
 semantic_worlds_observed:worlds.size,
 base:{errors:baseErrors,candidate:candidateAccepts(basePrompt,baseEntry),chars:basePrompt.length,words:basePrompt.trim().split(/\s+/).length},
 candidate_oracle_mismatches:mismatch,
 unsafe_promotions:unsafe,
 false_rejects:falseReject,
 survivors,
 family_counts:counts,
 level_seed_counts:levelCounts,
 independence:{oracle:'SEMANTIC_OBLIGATION_ASSERTIONS',candidate:'INDEPENDENT_REGEX_GROUP_CONJUNCTION',candidate_is_not_oracle_alias:true},
 claim_boundary:{falsification_is_physical_host_proof:false,native_host_capability_proven:false}
};
out.status=baseErrors.length===0&&out.base.candidate&&mismatch===0&&unsafe===0&&falseReject===0?'PASS':'FAIL';
out.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(out)).digest('hex');
console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
