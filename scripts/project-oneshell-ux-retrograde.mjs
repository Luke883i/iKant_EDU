/** CORA-style, read-only, non-authoritative OneShell E2E UX qualification.
 * An asserted witness is NEVER a native receipt. No owner invocation, install or writer. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const sha1=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const hex40=/^[0-9a-f]{40}$/;
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',timeout:20000,maxBuffer:8_000_000}).trim();
const gitBytes=(root,path)=>execFileSync('git',['show','HEAD:'+path],{cwd:root,timeout:20000,maxBuffer:8_000_000});
export const UX_SOURCE_PATHS=Object.freeze([
 'BOOTSTRAP.json','project/session-chat/PROMPT.txt','contracts/ikant-le.json',
 'contracts/c72-product-value-promise.json','contracts/project-oneshell-inchat-presentation.json',
 'contracts/project-oneshell-visual-v2.json','host/c72-public-mode-admission.mjs',
 'host/c135-edu-v2-owner.mjs','host/project-oneshell-continuous.mjs',
 'host/project-oneshell-chat-presentation.mjs','host/project-oneshell-visual.mjs',
 'plugins/ikant-le-session-chat/server/server.mjs',
 'plugins/ikant-le-session-chat/server/public/ikant-le-app.html'
]);
const rows=[
 ['SOURCE','GIT',[],'Pinned HEAD/TREE and critical original paths, including prompt and plugin'],
 ['TERMS','GIT',['SOURCE'],'First-turn five-document witness and pinned Terms link'],
 ['CONSENT','OWNER',['TERMS'],'Distinct exact human I ACCEPT, no retroactive consent'],
 ['C72','OWNER',['CONSENT'],'Original C72 ACCEPTED+introduction reopened; no replay'],
 ['EDU','OWNER',['C72'],'Later distinct EDU selection reopened; not ACTIVE'],
 ['EXECUTABLE','LOCAL',['EDU'],'Verified runtime source closure, original loader, installed-prompt check'],
 ['COGNITION','OWNER',['EXECUTABLE'],'C135 with bound language input and permitted guard'],
 ['LEDGER','OWNER',['COGNITION'],'Exactly one C87 writer and independent ledger readback'],
 ['VOICE','OWNER',['LEDGER'],'C125/S03 same-turn original bytes and qualified ACK'],
 ['SIX_SLOTS','LOCAL',['VOICE'],'Original OneShell frame, A exact, B technical, no forged status'],
 ['IN_CHAT','PROVIDER',['SIX_SLOTS'],'Actual six-slot output seen in ChatGPT, or explicit text fallback'],
 ['APP_REGISTERED','PROVIDER',['SOURCE'],'Independent MCP app registration, authentication and UI resource; not downstream of EDU'],
 ['UI_INSTANCE','PROVIDER',['APP_REGISTERED'],'MCP widget-only ephemeral view state, independent of original EDU ledger'],
 ['SECOND_TURN','OWNER',['LEDGER','IN_CHAT'],'Second distinct C135 turn, same ledger or verified C87 recovery, no duplicate send'],
 ['EXIT','OWNER',['SECOND_TURN'],'EXIT warning and separate human confirmation/cancellation with original readback'],
 ['HUMAN_VALUE','VALUE_USER',['EXIT','IN_CHAT'],'EDU independent holdout and C72 value promise; never requires MCP view state']
];
export const UX_RETICLE=Object.freeze(rows.map(([id,plane,requires,meaning])=>Object.freeze({id,plane,requires:Object.freeze(requires),meaning})));
const validPlanes=new Set(['GIT','LOCAL','OWNER','PROVIDER','VALUE_USER']);
if(UX_RETICLE.some((n,i)=>n.requires.some(p=>!rows.slice(0,i).some(e=>e[0]===p))))throw Error('UX_DAG_NOT_TOPOLOGICAL');
/** Git witness is real source-only evidence; no assertion about current Project installation. */
export function inspectUXSource(root='.',expectedHead=null){
 const head=git(root,'rev-parse','HEAD'),tree=git(root,'rev-parse','HEAD^{tree}');
 if(!hex40.test(head)||!hex40.test(tree))throw Error('UX_HEAD_OR_TREE_INVALID');
 if(expectedHead!==null&&head!==expectedHead)return Object.freeze({ok:false,first_edge:'UX_SOURCE_EPOCH_STALE',head,tree});
 const blobs=[];
 for(const path of UX_SOURCE_PATHS){
  const bytes=gitBytes(root,path),sha=git(root,'rev-parse','HEAD:'+path);
  if(!hex40.test(sha)||sha1(bytes)!==sha)throw Error('UX_SOURCE_BLOB_DRIFT:'+path);
  blobs.push(Object.freeze({path,sha1:sha,bytes:bytes.length}));
 }
 return Object.freeze({ok:true,scope:'GIT_ONLY',head,tree,paths:Object.freeze(blobs),
  original_owner_invoked:false,provider_ui_attested:false,product_release:false});
}
/** Records are declared evidence, not authenticated by this evaluator.
 * Do not use model completion to enable an effect or assert ACTIVE. */
export function assessUXReticle(declared={}){
 if(declared===null||typeof declared!=='object'||Array.isArray(declared)||
    Object.getPrototypeOf(declared)!==Object.prototype)throw Error('UX_INPUT_INVALID');
 const known=new Set(UX_RETICLE.map(g=>g.id)),unrecognized=Object.keys(declared).filter(k=>!known.has(k));
 if(unrecognized.length)throw Error('UX_UNKNOWN_GATE:'+unrecognized[0]);
 const closed=new Set(),edges=[],claims=[];
 for(const g of UX_RETICLE){
  const e=declared[g.id];
  const dependency=g.requires.find(x=>!closed.has(x));
  if(dependency){edges.push({gate:g.id,edge:'UX_DEPENDENCY_UNCLOSED:'+dependency});continue;}
  const shape=e&&typeof e==='object'&&!Array.isArray(e)&&Object.getPrototypeOf(e)===Object.prototype;
  const consistent=shape&&e.plane===g.plane&&validPlanes.has(e.plane)&&e.observed===true&&
   e.independent_readback===true&&typeof e.witness_ref==='string'&&e.witness_ref.length>=12;
  if(!consistent){edges.push({gate:g.id,edge:'UX_'+g.id+'_EVIDENCE_NOT_ATTESTED'});continue;}
  closed.add(g.id);claims.push(g.id);
 }
 const first=edges[0]?.edge||null;
 return Object.freeze({schema:'ikant-host-ux-retrograde-report/v1',authority:0,
  status:edges.length?'MODEL_UNCLOSED':'ALL_DECLARED_NOT_AUTHENTICATED',
  declared_claims:Object.freeze(claims),first_unclosed_edge:first,
  unresolved:Object.freeze(edges),gate_count:UX_RETICLE.length,
  original_owner_attested:false,provider_native_ui_attested:false,
  widget_persistence_attested:false,end_user_value_attested:false,
  product_release:'NO_GO',may_invoke_owner:false,may_install:false,
  caution:'Callers can fabricate evidence records: only independent native readback can establish actual gates.'});
}

/** Analyze only the source-defined human-turn lower bound; never relax C72. */
export function analyzeHumanTurnCut(root='.'){
 const c72=gitBytes(root,'host/c72-public-mode-admission.mjs').toString('utf8');
 if(!c72.includes("if(humanMessage!=='EDU')return denied('INVALID_MODE_SELECTION')"))
  throw Error('UX_C72_MODE_OWNER_SEMANTICS_CHANGED_REQUALIFY');
 return Object.freeze({
  current_pre_cognition_human_messages:3,
  current_including_first_question:4,
  future_auto_edu_candidate_pre_cognition_messages:2,
  future_auto_edu_candidate_including_question:3,
  current_exact_edu_turn_required:true,
  future_auto_edu_authorized:false,
  original_c72_contract_change_required:true,
  original_terms_disclosure_and_independent_review_required:true,
  release:'NO_GO'
 });
}

/** Bounded source-visible inventory. Literal occurrences != actual rendered choice,
 * but a nonzero source count blocks claims that the EDU UX has already been cleaned. */
export const EDU_VISIBLE_SOURCE_PATHS=Object.freeze([
 'README.md','AGENTS.md','TERMS.md','ADMISSION.json','contracts/c72-public-mode-admission-v2.json',
 'host/c72-public-mode-admission.mjs','host/project-oneshell-phases.mjs',
 'project/session-chat/PROMPT.txt','project/edu-oneshell/PROMPT_INNESCO.txt'
]);
export function inspectEDUOnlyVisibleSource(root='.'){
 const findings=EDU_VISIBLE_SOURCE_PATHS.map(path=>{
  const body=gitBytes(root,path).toString('utf8');
  return Object.freeze({path,literal_canonical_mentions:[...body.matchAll(/\bCANONICAL\b/gu)].length});
 });
 const asJson=path=>JSON.parse(gitBytes(root,path).toString('utf8'));
 const modes=asJson('contracts/c72-public-mode-admission-v2.json').mode_choices;
 const onboarding=asJson('ADMISSION.json').default_onboarding.modes;
 const bootstrap=asJson('BOOTSTRAP.json').user_onboarding_c72.mode_choices;
 const texts=Object.fromEntries([
  'README.md','AGENTS.md','TERMS.md','project/session-chat/PROMPT.txt','project/edu-oneshell/PROMPT_INNESCO.txt',
  'host/c72-public-mode-admission.mjs','host/project-oneshell-phases.mjs'
 ].map(path=>[path,gitBytes(root,path).toString('utf8')]));
 const onlyEdu=v=>Array.isArray(v)&&v.length===1&&v[0]==='EDU';
 const violations=[];
 if(!texts['README.md'].includes('una sola selezione successiva al consenso: EDU')||
    texts['README.md'].includes('esattamente due opzioni, EDU e CANONICAL'))
  violations.push('README_DUAL_MODE_ONBOARDING');
 if(!texts['AGENTS.md'].includes('one later exact `EDU` message only')||
    texts['AGENTS.md'].includes('wait for explicit `EDU` or `CANONICAL`'))
  violations.push('AGENTS_DUAL_MODE_ONBOARDING');
 for(const [label,v] of [['C72_CONTRACT',modes],['ADMISSION',onboarding],['BOOTSTRAP',bootstrap]])
  if(!onlyEdu(v))violations.push('DUAL_MODE_SOURCE:'+label);
 if(/\bCANONICAL\b/u.test(texts['TERMS.md']))violations.push('TERMS_LEGACY_MODE_VISIBLE');
 if(/\bCANONICAL\b/u.test(texts['project/session-chat/PROMPT.txt']))
  violations.push('PROMPT_LEGACY_MODE_VISIBLE');
 if(/\bCANONICAL\b/u.test(texts['project/edu-oneshell/PROMPT_INNESCO.txt']))
  violations.push('DISTRIBUTION_LEGACY_MODE_VISIBLE');
 if(!texts['host/c72-public-mode-admission.mjs'].includes("allowed_modes:['EDU']")||
    !texts['host/c72-public-mode-admission.mjs'].includes("mode_options:['EDU']")||
    !texts['host/c72-public-mode-admission.mjs'].includes("if(humanMessage!=='EDU')return denied('INVALID_MODE_SELECTION')"))
  violations.push('C72_OWNER_DUAL_SELECTION_OR_UNKNOWN');
 if(texts['host/project-oneshell-phases.mjs'].includes('AWAIT_EDU_OR_CANONICAL')||
    !texts['host/project-oneshell-phases.mjs'].includes("next:'AWAIT_EDU'"))
  violations.push('ONE_SHELL_LEGACY_CHOICE_VISIBLE');
 return Object.freeze({schema:'ikant-host-edu-visible-source-census/v2',authority:0,
  scope:'SOURCE_ONLY_NOT_OWNER_EFFECT_OR_NATIVE_RENDER',
  literal_canonical_mentions:findings.reduce((n,f)=>n+f.literal_canonical_mentions,0),
  active_choice_violations:Object.freeze(violations),
  files:Object.freeze(findings),
  status:violations.length?'EDU_ONLY_UX_NOT_IMPLEMENTED':'EDU_ONLY_SOURCE_CANDIDATE_NOT_RUNTIME_ATTESTED',
  original_owner_invoked:false,actual_chat_visibility_attested:false,release:'NO_GO'});
}
/** Two assurance lanes share source integrity, never each other's owner,
 * consent, widget requirement, native receipt or product value metric.
 * Structural check only: cannot validate field execution. */
export function inspectUXSurfaceSeparation(graph=UX_RETICLE){
 if(!Array.isArray(graph))throw Error('UX_GRAPH_INVALID');
 const seen=new Set(),byId=new Map();
 for(const n of graph){
  if(!n||typeof n.id!=='string'||seen.has(n.id)||!Array.isArray(n.requires))
   throw Error('UX_GRAPH_BAD_NODE');
  seen.add(n.id);byId.set(n.id,n);
 }
 const parents=(id,visited=new Set())=>{
  if(visited.has(id))throw Error('UX_GRAPH_CYCLE');
  const node=byId.get(id);if(!node)throw Error('UX_GRAPH_MISSING_NODE:'+id);
  const next=new Set(visited);next.add(id);const result=new Set();
  for(const dep of node.requires){result.add(dep);for(const a of parents(dep,next))result.add(a);}
  return result;
 };
 const eduTerminals=['IN_CHAT','HUMAN_VALUE'];
 const mcpTerminals=['APP_REGISTERED','UI_INSTANCE'];
 const eduOnly=new Set(['TERMS','CONSENT','C72','EDU','EXECUTABLE','COGNITION','LEDGER','VOICE','SIX_SLOTS','IN_CHAT','SECOND_TURN','EXIT','HUMAN_VALUE']);
 const mcpOnly=new Set(mcpTerminals);
 const breaches=[];
 for(const id of eduTerminals){for(const a of parents(id))if(mcpOnly.has(a))breaches.push('EDU_DEPENDS_ON_MCP:'+a);}
 for(const id of mcpTerminals){for(const a of parents(id))if(eduOnly.has(a))breaches.push('MCP_DEPENDS_ON_EDU:'+a);}
 return Object.freeze({schema:'ikant-host-ux-surface-separation/v1',authority:0,
  edu_and_mcp_independent:breaches.length===0,forbidden_cross_surface_edges:Object.freeze(breaches),
  shared_invariant:'SOURCE_ONLY',
  edu_requires_mcp:breaches.some(x=>x.startsWith('EDU_DEPENDS_ON_MCP:')),
  mcp_requires_edu:breaches.some(x=>x.startsWith('MCP_DEPENDS_ON_EDU:')),
  authenticated_provider_or_owner:false,product_release:'NO_GO'});
}
