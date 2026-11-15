import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
export const README_PATH=path.join(ROOT,'README.md');
export const AGENTS_PATH=path.join(ROOT,'AGENTS.md');
export const TERMS_PATH=path.join(ROOT,'TERMS.md');
export const CONTRACT_PATH=path.join(ROOT,'contracts','ikant-le.json');
export const KERNEL_PATH=path.join(ROOT,'contracts','cognitive-kernel.json');
export const PSYCHE_PATH=path.join(ROOT,'contracts','psyche-kernel.json');
export const SELF_WORLD_PATH=path.join(ROOT,'contracts','self-world-kernel.json');
export const EMERGENCE_PATH=path.join(ROOT,'contracts','emergence-kernel.json');
export const LIFE_CONSCIOUSNESS_PATH=path.join(ROOT,'contracts','life-consciousness-kernel.json');
export const SURFACE_B_DELIVERY_PATH=path.join(ROOT,'contracts','surface-b-delivery.json');
export const CHAT_BOOTSTRAP_PATH=path.join(ROOT,'contracts','chat-bootstrap-semantic.json');
export const HOST_SHELL_PATH=path.join(ROOT,'contracts','host-shell.json');
export const ORIENTATION_PATH=path.join(ROOT,'contracts','orientation-capsule.json');
export const BOOTSTRAP_PATH=path.join(ROOT,'BOOTSTRAP.json');
export const ADMISSION_PATH=path.join(ROOT,'ADMISSION.json');
export const EXACT=Object.freeze({ACCEPT:'I ACCEPT',PROBE:'PROBE IKANT',INITIALIZE:'INITIALIZE IKANT',EXIT:'EXIT IKANT',TERMS:'TERMS'});
export function sha256(data){return crypto.createHash('sha256').update(data).digest('hex');}
export const ORIENTATION_PROJECTION_PATH=path.join(ROOT,'.ikant','orientation-projection.json');
export function validateOrientationRuntimeProjection(value){const e=[],x=value||{};if(x.schema!=='ikant-le-orientation-runtime-projection/v1'||x.authority!==0)e.push('schema');if(!/^[a-f0-9]{40}$/.test(String(x.source_head||'')))e.push('source_head');if(!Array.isArray(x.orientation_objects)||x.orientation_objects.length!==5)e.push('orientation_objects');if(!/^[a-f0-9]{64}$/.test(String(x.orientation_object_set_sha256||''))||!/^[a-f0-9]{64}$/.test(String(x.frozen_evidence_sha256||'')))e.push('evidence');if(typeof x.terms_text!=='string'||x.terms_digest!==sha256(Buffer.from(String(x.terms_text),'utf8')))e.push('terms');if(!/^[a-f0-9]{64}$/.test(String(x.constitutional_fingerprint||'')))e.push('fingerprint');if(x.orientation_source_files_materialized!==false)e.push('locality');const y=structuredClone(x);delete y.receipt_sha256;if(!/^[a-f0-9]{64}$/.test(String(x.receipt_sha256||''))||sha256(Buffer.from(JSON.stringify(y)))!==x.receipt_sha256)e.push('receipt');return{ok:e.length===0,errors:[...new Set(e)]};}
export function readOrientationRuntimeProjection(){if(!fs.existsSync(ORIENTATION_PROJECTION_PATH))return null;const x=JSON.parse(fs.readFileSync(ORIENTATION_PROJECTION_PATH,'utf8')),v=validateOrientationRuntimeProjection(x);if(!v.ok)throw new Error('orientation runtime projection invalid:'+v.errors.join(','));const mp=path.join(ROOT,'.ikant','materialization.json');if(fs.existsSync(mp)){const m=JSON.parse(fs.readFileSync(mp,'utf8'));if(m.orientation_projection_receipt_sha256!==x.receipt_sha256)throw new Error('orientation projection materialization binding mismatch');}return x;}
export function readTerms(){const p=readOrientationRuntimeProjection();if(p)return{text:p.terms_text,digest:p.terms_digest};const bytes=fs.readFileSync(TERMS_PATH);return{text:bytes.toString('utf8'),digest:sha256(bytes)};}
export function readContract(){return JSON.parse(fs.readFileSync(CONTRACT_PATH,'utf8'));}
export function readKernel(){return JSON.parse(fs.readFileSync(KERNEL_PATH,'utf8'));}
export function readPsycheKernel(){return JSON.parse(fs.readFileSync(PSYCHE_PATH,'utf8'));}
export function readSelfWorldKernel(){return JSON.parse(fs.readFileSync(SELF_WORLD_PATH,'utf8'));}
export function readEmergenceKernel(){return JSON.parse(fs.readFileSync(EMERGENCE_PATH,'utf8'));}
export function readLifeConsciousnessKernel(){return JSON.parse(fs.readFileSync(LIFE_CONSCIOUSNESS_PATH,'utf8'));}
export function readSurfaceBDelivery(){return JSON.parse(fs.readFileSync(SURFACE_B_DELIVERY_PATH,'utf8'));}
export function readChatBootstrapSemantic(){return JSON.parse(fs.readFileSync(CHAT_BOOTSTRAP_PATH,'utf8'));}
export function readHostShell(){return JSON.parse(fs.readFileSync(HOST_SHELL_PATH,'utf8'));}
export function readOrientationCapsule(){return JSON.parse(fs.readFileSync(ORIENTATION_PATH,'utf8'));}
export function constitutionalFingerprint(){const p=readOrientationRuntimeProjection();if(p)return p.constitutional_fingerprint;const files=[README_PATH,AGENTS_PATH,TERMS_PATH,CONTRACT_PATH,KERNEL_PATH,PSYCHE_PATH,SELF_WORLD_PATH,EMERGENCE_PATH,LIFE_CONSCIOUSNESS_PATH,SURFACE_B_DELIVERY_PATH,CHAT_BOOTSTRAP_PATH,HOST_SHELL_PATH,ORIENTATION_PATH,BOOTSTRAP_PATH,ADMISSION_PATH];const material=files.map(p=>`${path.basename(p)}:${sha256(fs.readFileSync(p))}`).join('|');return sha256(Buffer.from(material));}
export function classifyInput(input){if(input===EXACT.TERMS||input==='')return'TERMS';if(input===EXACT.ACCEPT)return'ACCEPT';if(input===EXACT.PROBE)return'PROBE';if(input===EXACT.INITIALIZE)return'INITIALIZE';if(input===EXACT.EXIT)return'EXIT';if(/^PREFER (BRIEF|STANDARD|DETAILED)$/.test(input))return'PREFERENCE';return'TURN';}
export const LIFECYCLE_INTENT_SCHEMA='ikant-le-lifecycle-intent/v2';
export const PREACTIVE_ROUTE_SCHEMA='ikant-le-preactive-route/v2';
function lifecycleCommandBase(value){return String(value??'').normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g,'').toLowerCase().replace(/don't/g,'dont').replace(/https?:\/\/github\.com\/luke883i\/ikant_le(?:\.git)?/g,' ikant ').replace(/\bluke883i\/ikant_le\b/g,' ikant ').replace(/_/g,' ').replace(/\s+/g,' ').trim();}
const START_IKANT_FULL=/^(?:(?:per favore|please|pls|ora|now)\s+)?(?:inizializza(?:re)?|avvia(?:re)?|attiva(?:re)?|apri(?:re)?|start|open|initialize|initialise|activate)(?:\s+(?:localmente|locally|in locale|in questa sessione|il|lo|la|the|repo|repository))*\s+i\s*kant(?:\s+le)?(?:\s+(?:ora|now|localmente|locally|in locale|in questa sessione|per favore|please|pls))*[.!]?$/u;
const EXIT_IKANT_FULL=/^(?:(?:per favore|please|pls|ora|now)\s+)?(?:(?:chiudi|disattiva|stop|exit|release)(?:\s+(?:il|lo|the))*\s+i\s*kant(?:\s+le)?|esci\s+da\s+i\s*kant(?:\s+le)?)(?:\s+(?:ora|now|localmente|locally|in locale|in questa sessione|per favore|please|pls))*[.!]?$/u;
const START_IKANT_MENTION=/\b(?:inizializza(?:re)?|avvia(?:re)?|attiva(?:re)?|apri(?:re)?|start|open|initialize|initialise|activate)\b/u;
const EXIT_IKANT_MENTION=/(?:\b(?:chiudi|disattiva|stop|exit|release)\b|\besci\s+da\b)/u;
export function classifyLifecycleIntent(input){const raw=String(input??''),n=lifecycleCommandBase(raw),start=START_IKANT_FULL.test(n),exit=EXIT_IKANT_FULL.test(n),startMention=START_IKANT_MENTION.test(n),exitMention=EXIT_IKANT_MENTION.test(n),dedicated=start||exit,explicit=startMention||exitMention,conflict=startMention&&exitMention,kind=start?'ACTIVATE_IKANT':exit?'EXIT_IKANT':'OTHER';return{schema:LIFECYCLE_INTENT_SCHEMA,kind,explicit,dedicated,ambiguous:explicit&&!dedicated,conflict,raw_sha256:sha256(Buffer.from(raw)),authority:0};}
export function classifyPreactiveRoute(input){const control=classifyInput(input);if(control!=='TURN')return{schema:PREACTIVE_ROUTE_SCHEMA,route:'IKANT_CONTROL',control,intent:null,authority:0};const intent=classifyLifecycleIntent(input);return{schema:PREACTIVE_ROUTE_SCHEMA,route:intent.kind==='ACTIVATE_IKANT'?'IKANT_ADMISSION':'HOST',control,intent,authority:0};}

export function wordCount(text){const m=String(text).trim().match(/\S+/g);return m?m.length:0;}
export function validateSurfaceA(text,{min=50,max=500}={}){const value=String(text??'').trim();const words=wordCount(value);const machineLeak=/(^|\n)\s*[\[{]|receipt_sha256|node_dispatch|mutation[_ -]?cases|seed\s*[=:]|prev_hash|terms_digest|bootstrap_fingerprint|psyche_(before|after)|archetypal_mix|workspace_frame_id|prediction_id|episode_id|causal_trace|stack trace|BEGIN PRIVATE|chain[- ]of[- ]thought/i.test(value);const controlLeak=/Backlog & telemetrie:|-------------------/.test(value);return{ok:words>=min&&words<=max&&!machineLeak&&!controlLeak,words,machineLeak,controlLeak};}
export function renderHumanOutput(surfaceA,artifactName){return`${surfaceA.trim()}\n\n\n-------------------\nBacklog & telemetrie:\n${artifactName}`;}

export const ONTOLOGICAL_PROMISE_ASSESSMENT_SCHEMA='ikant-le-ontological-promise-assessment/v1';
export function assessOntologicalPromise(evidence,{contract=readContract()}={}){
 const p=contract?.ontological_promise;if(!p||p.schema!=='ikant-le-ontological-promise/v1'||p.authority!==0||!Array.isArray(p.atoms)||p.atoms.length!==p.atom_count)throw new Error('invalid ontological promise contract');
 const ids=new Set(),weights=new Map();let sum=0,min=Infinity;
 for(const a of p.atoms){if(!a||typeof a.id!=='string'||ids.has(a.id)||!Number.isInteger(a.weight_bps)||a.weight_bps<100)throw new Error('invalid ontological promise atom');ids.add(a.id);weights.set(a.id,a.weight_bps);sum+=a.weight_bps;min=Math.min(min,a.weight_bps);}
 if(sum!==p.score_max_bps||p.score_max_bps!==10000||p.respect_threshold_bps!==9901||min!==p.minimum_atom_weight_bps)throw new Error('invalid ontological promise weights');
 const normalized=Object.fromEntries(p.atoms.map(a=>[a.id,evidence?.[a.id]===true])),passed=p.atoms.filter(a=>normalized[a.id]).map(a=>a.id),failed=p.atoms.filter(a=>!normalized[a.id]).map(a=>a.id),score=p.atoms.reduce((n,a)=>n+(normalized[a.id]?a.weight_bps:0),0);
 const evidenceSha=sha256(Buffer.from(JSON.stringify(normalized))),material={schema:ONTOLOGICAL_PROMISE_ASSESSMENT_SCHEMA,scope:'REPOSITORY_CONFORMANCE_EVIDENCE',contract_schema:p.schema,score_bps:score,score_max_bps:p.score_max_bps,threshold_bps:p.respect_threshold_bps,coverage_ratio:Number((score/p.score_max_bps).toFixed(6)),respected:score>=p.respect_threshold_bps,passed_atoms:passed,failed_atoms:failed,first_unmet:failed[0]||null,evidence_sha256:evidenceSha,persisted:false,authority:0};
 return{...material,receipt_sha256:sha256(Buffer.from(JSON.stringify(material)))};
}
export function validateOntologicalPromiseAssessment(a,{contract=readContract()}={}){
 const p=contract?.ontological_promise,e=[];if(!a||a.schema!==ONTOLOGICAL_PROMISE_ASSESSMENT_SCHEMA)e.push('schema');if(a?.scope!=='REPOSITORY_CONFORMANCE_EVIDENCE'||a?.authority!==0||a?.persisted!==false)e.push('scope');if(!p||a?.contract_schema!==p.schema)e.push('contract');if(!Number.isInteger(a?.score_bps)||a.score_bps<0||a.score_bps>10000||a?.threshold_bps!==9901||a?.score_max_bps!==10000)e.push('score');if(a?.respected!==(a?.score_bps>=9901))e.push('respected');if(!Array.isArray(a?.passed_atoms)||!Array.isArray(a?.failed_atoms)||a.passed_atoms.length+a.failed_atoms.length!==36)e.push('atoms');if((a?.failed_atoms?.[0]||null)!==a?.first_unmet)e.push('first_unmet');if(!/^[a-f0-9]{64}$/.test(String(a?.evidence_sha256||''))||!/^[a-f0-9]{64}$/.test(String(a?.receipt_sha256||'')))e.push('digest');if(!e.length){const x={...a};delete x.receipt_sha256;if(sha256(Buffer.from(JSON.stringify(x)))!==a.receipt_sha256)e.push('receipt_digest');}return{ok:e.length===0,errors:[...new Set(e)]};
}
