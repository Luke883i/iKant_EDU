/** Pure Host prompt shape/anchor gate. Does not interpret LLM intent or certify runtime. */
export const LAW_IDS=Object.freeze(['AUTORITÀ','CAPACITÀ','SOURCE_LOCK','GATE UMANI','PROVA','UNICITÀ','ONE SHELL']);
export const ACTION_IDS=Object.freeze(['CLASSIFICA','AGISCI','VERIFICA O FERMA']);
const words=[
 ['Host≠iKant','C72','C135','C87','C125/S03','≠ owner/ricevuta/runtime'],
 ['realmente invocabili QUI','GitHub via connettore/API disponibile','non presupporre HTTPS','STOP_UNBOUND','UNKNOWN≠assente','MACHINE_CAPS={GITHUB_SOURCE,NODE_EXEC,HOST_TOOL_ARGUMENT_COURIER}','CARRIERS={HOST_TOOL_ARG_RELAY>SAME_NODE_CALLBACKS>HOST_SOURCE_PACKET>NODE_GITHUB_HTTPS}','JSON≠binding'],
 ['Luke883i/iKant_LE/main','SHA-1+permalink','Congela HEAD/witness','STOP_SOURCE_LOCK_STALE'],
 ['PRIMO messaggio','ORIENTATION','HOST_ENGINEERING','I ACCEPT⇒C72','EDU⇒selezione','Ogni scelta legacy⇒STOP','EXIT IKANT','CONFERMO EXIT IKANT','ANNULLA EXIT IKANT'],
 ['Avanza ⇔','evento umano distinto','effetto osservato','readback indipendente','ricevuta owner','non certificano origine'],
 ['UNKNOWN⇒STOP senza retry','POST-ACCEPT','mai consenso/stato/receipt','C87/checkpoint'],
 ['ESITO | A | B | PROVA | EDGE | NEXT','NO_VOICE','owner-bound','Host:','@Host','SEMANTIC_RETENTION_NOT_ATTESTED'],
 ['ORIENTATION','GitHub tool disponibile','SOLO HEAD','README.md, BOOTSTRAP.json, ADMISSION.json, AGENTS.md, TERMS.md','cinque SHA in PROVA','ZERO letture','NO TREE','gateway scaricato','STOP'],
 ['I ACCEPT autentico','GOLD_FIRST','MACHINE_POST_ACCEPT=contracts/project-host-tool-grounding-abi.json','probe fisico obbligatorio','No ricerche web o LZ77 improvvisati','GitHub connector→argomento tool→file privato/Node','PROJECT_EDU_E15','sourcePacket (8 blob)','transitSourcePacket (carrier)','10/10','9/9','C72 originale UNA volta','INTEGRE','Dopo EDU distinto','project/session-chat/PROMPT.txt','C135/C87/C125/S03'],
 ['original required_ack','stesso turno','NEGATIVE={TOOL_GUESSED,TWO_TOOLS_AUTO_BRIDGE,UNOBSERVED_TRANSFER,SELF_SIGNED_SHA,OWNER_UNKNOWN,FAKE_RECEIPT}','piano≠esecuzione','C72_SOURCE_BRIDGE_UNBOUND','INSTALLED_PROMPT_EQUIVALENCE_UNKNOWN','STOP_PROMPT_HEAD_PREFLIGHT','STOP_PROJECT_PROMPT_STALE_INSTALLATION','PR merged','POST-MERGE','EXPLICIT_REPIN_REQUIRES_FRESH_C72']
];
const fail=code=>{throw Error('PROMPT_7X3_'+code)};
export function assertSevenThreePrompt(raw){
 if(typeof raw!=='string'||!raw.endsWith('\n')||raw.includes('\0')||
   Buffer.byteLength(raw,'utf8')+210>8000)fail('BYTE_LIMIT_OR_UTF8');
 const lines=raw.trimEnd().split('\n').filter(x=>x.trim().length);
 if(lines.length!==13||lines[0]!=='iKant EDU · OneShell | HOST authority=0 | 7 leggi · 3 azioni'||
   !lines[1].startsWith('COSTITUZIONE ')||
   lines[9]!=='AZIONI (esegui, non raccontare)')fail('STRUCTURE');
 const main=[];
 for(let i=0;i<10;i++){
  const index=i<7?i+2:i+3;
  const prefix=i<7?'L'+(i+1)+' '+LAW_IDS[i]+'.':'A'+(i-6)+' '+ACTION_IDS[i-7]+'.';
  if(!lines[index].startsWith(prefix))fail('ORDER_'+i);
  for(const word of words[i])if(!lines[index].includes(word))fail('REQUIRED_'+i+':'+word);
  if(/\b(?:IGNORA_LEGGI|BYPASS_GATE|SKIP_OWNER|FAKE_PASS)\b/u.test(lines[index]))fail('OVERRIDE_'+i);
  main.push(lines[index]);
 }
 if(main.some(x=>x.length>1000))fail('UNBOUNDED_LINE');
 return Object.freeze({laws:7,actions:3,bytes:Buffer.byteLength(raw,'utf8'),
   owner_source:'BOOTSTRAP',format:'EXACT_7X3',provider_installed:false,runtime_attested:false});
}
