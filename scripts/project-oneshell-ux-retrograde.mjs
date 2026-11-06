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
 ['APP_REGISTERED','PROVIDER',['IN_CHAT'],'Real MCP app registration, authenticated UI resource and rendering'],
 ['UI_INSTANCE','PROVIDER',['APP_REGISTERED'],'Widget view-state restored within same UI instance; never C87 state'],
 ['SECOND_TURN','OWNER',['LEDGER','IN_CHAT'],'Second distinct C135 turn, same ledger or verified C87 recovery, no duplicate send'],
 ['EXIT','OWNER',['SECOND_TURN'],'EXIT warning and separate human confirmation/cancellation with original readback'],
 ['HUMAN_VALUE','VALUE_USER',['EXIT','UI_INSTANCE'],'Independent host users/tasks and C72 value promise, not CI']
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
 if(!c72.includes("if(humanMessage!=='EDU'&&humanMessage!=='CANONICAL')"))
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
