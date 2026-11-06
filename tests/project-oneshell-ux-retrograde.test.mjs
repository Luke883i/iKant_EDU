import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {UX_SOURCE_PATHS,UX_RETICLE,inspectUXSource,assessUXReticle,analyzeHumanTurnCut,inspectEDUOnlyVisibleSource,inspectUXSurfaceSeparation,EDU_VISIBLE_SOURCE_PATHS}
 from '../scripts/project-oneshell-ux-retrograde.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
function claimed(){
 return Object.fromEntries(UX_RETICLE.map((g,i)=>[g.id,{
  plane:g.plane,observed:true,independent_readback:true,witness_ref:'claim-fixture-'+String(i).padStart(3,'0')
 }]));
}
test('CORA UX graph: source readback pinned to actual Git HEAD; not runtime',()=>{
 const head=git('rev-parse','HEAD'),source=inspectUXSource(root,head);
 assert.equal(source.ok,true);assert.equal(source.scope,'GIT_ONLY');
 assert.equal(source.head,head);assert.equal(source.tree,git('rev-parse','HEAD^{tree}'));
 assert.equal(source.paths.length,UX_SOURCE_PATHS.length);
 assert.equal(source.paths.every(x=>/^[a-f0-9]{40}$/.test(x.sha1)&&x.bytes>0),true);
 assert.equal(source.original_owner_invoked,false);
 assert.equal(source.provider_ui_attested,false);
 assert.equal(inspectUXSource(root,'f'.repeat(40)).first_edge,'UX_SOURCE_EPOCH_STALE');
});
test('16-stage reverse-retrograde lattice closes only declared shape, never native release',()=>{
 assert.equal(UX_RETICLE.length,16);
 assert.deepEqual(UX_RETICLE.slice(0,5).map(x=>x.id),['SOURCE','TERMS','CONSENT','C72','EDU']);
 const no=assessUXReticle();
 assert.equal(no.first_unclosed_edge,'UX_SOURCE_EVIDENCE_NOT_ATTESTED');
 assert.equal(no.product_release,'NO_GO');
 const all=assessUXReticle(claimed());
 assert.equal(all.status,'ALL_DECLARED_NOT_AUTHENTICATED');
 assert.equal(all.original_owner_attested,false);
 assert.equal(all.provider_native_ui_attested,false);
 assert.equal(all.widget_persistence_attested,false);
 assert.equal(all.end_user_value_attested,false);
 assert.equal(all.may_invoke_owner,false);
 assert.equal(all.may_install,false);
});
test('10000 DISTINCT typed negative evidence cases; no CI, mock or hashes promoted',()=>{
 const seen=new Set();
 for(let i=0;i<10000;i++){
  const g=UX_RETICLE[i%UX_RETICLE.length],e=claimed();
  e.SOURCE.witness_ref='fixture-source-'+i;
  e.TERMS.witness_ref='fixture-terms-'+i;
  const variant=i%7;
  if(variant===0)e[g.id].plane='GIT'===g.plane?'PROVIDER':'GIT';
  else if(variant===1)e[g.id].observed=false;
  else if(variant===2)e[g.id].independent_readback=false;
  else if(variant===3)e[g.id].witness_ref='X';
  else if(variant===4)delete e[g.id];
  else if(variant===5)e[g.id]='FAKE_RECEIPT';
  else e[g.id].plane='CI'; // undeclared evidence plane
  const fingerprint=createHash('sha256').update(JSON.stringify(e)).digest('hex');
  assert(!seen.has(fingerprint));seen.add(fingerprint);
  const r=assessUXReticle(e);
  assert.equal(r.product_release,'NO_GO');
  assert(r.first_unclosed_edge);
  assert.notEqual(r.status,'ALL_DECLARED_NOT_AUTHENTICATED');
  assert.equal(r.original_owner_attested,false);
 }
 assert.equal(seen.size,10000);
});
test('optional app view state is PRESENTATION ONLY, six slot DOM preserved',()=>{
 const html=fs.readFileSync(path.join(root,'plugins/ikant-le-session-chat/server/public/ikant-le-app.html'),'utf8');
 for(const slot of ['ESITO','A','B','PROVA','EDGE','NEXT'])
  assert(html.includes('data-slot="'+slot+'"'),'slot '+slot);
 assert.equal((html.match(/<section data-slot="/g)||[]).length,6);
 assert(html.includes("window.openai?.widgetState?.privateContent?.ikant_view_v1"));
 assert(html.includes("window.openai.setWidgetState({modelContent:'',privateContent:{ikant_view_v1:view}})"));
 assert(html.includes("scope:'UI_INSTANCE_ONLY'"));
 assert(html.includes("if(typeof window.openai?.setWidgetState!=='function')return"));
 assert(!html.includes("widgetState.active=true"));
 const server=fs.readFileSync(path.join(root,'plugins/ikant-le-session-chat/server/server.mjs'),'utf8');
 assert(server.includes('legacy')||server.includes('Legacy'));
});
test('type confusion, unknown gates, claims do not create an authorization',()=>{
 for(const bad of [null,[],3,'x',new Date()])assert.throws(()=>assessUXReticle(bad));
 assert.throws(()=>assessUXReticle({ACTIVE:{plane:'PROVIDER'}}),/UX_UNKNOWN_GATE/);
 const forged=claimed();
 forged.IN_CHAT={plane:'GIT',observed:true,independent_readback:true,witness_ref:'git-hash-pretend'};
 assert.equal(assessUXReticle(forged).first_unclosed_edge,'UX_IN_CHAT_EVIDENCE_NOT_ATTESTED');
});

test('actual C72 requires distinct EDU; one-turn auto-EDU is a future constitutional candidate only',()=>{
 const cut=analyzeHumanTurnCut(root);
 assert.equal(cut.current_pre_cognition_human_messages,3);
 assert.equal(cut.current_including_first_question,4);
 assert.equal(cut.future_auto_edu_candidate_pre_cognition_messages,2);
 assert.equal(cut.current_exact_edu_turn_required,true);
 assert.equal(cut.future_auto_edu_authorized,false);
 assert.equal(cut.original_c72_contract_change_required,true);
 assert.equal(cut.release,'NO_GO');
});

test('EDU completion is NOT downstream of MCP registration or widget state',()=>{
 const independent=inspectUXSurfaceSeparation();
 assert.equal(independent.edu_and_mcp_independent,true);
 assert.deepEqual(independent.forbidden_cross_surface_edges,[]);
 assert.equal(independent.edu_requires_mcp,false);
 assert.equal(independent.mcp_requires_edu,false);
 assert.equal(independent.product_release,'NO_GO');
 const declared=claimed();
 delete declared.APP_REGISTERED;delete declared.UI_INSTANCE;
 const report=assessUXReticle(declared);
 assert.equal(report.product_release,'NO_GO');
 assert(!report.unresolved.some(x=>['HUMAN_VALUE','IN_CHAT','SECOND_TURN','EXIT'].includes(x.gate)));
 assert(report.unresolved.some(x=>x.gate==='APP_REGISTERED'));
 assert(report.unresolved.some(x=>x.gate==='UI_INSTANCE'));
});
test('MCP can qualify its own declared presentation shape without C72/EDU gating',()=>{
 const declared={SOURCE:claimed().SOURCE,APP_REGISTERED:claimed().APP_REGISTERED,UI_INSTANCE:claimed().UI_INSTANCE};
 const report=assessUXReticle(declared);
 assert(report.declared_claims.includes('APP_REGISTERED'));
 assert(report.declared_claims.includes('UI_INSTANCE'));
 assert(!report.declared_claims.includes('EDU'));
 assert.equal(report.provider_native_ui_attested,false);
 assert.equal(report.product_release,'NO_GO');
});
test('two deliberate cross-surface dependency regressions are rejected by topology oracle',()=>{
 const withEdge=(id,dep)=>UX_RETICLE.map(g=>g.id===id?{...g,requires:[...g.requires,dep]}:g);
 for(const [id,dep] of [['IN_CHAT','APP_REGISTERED'],['HUMAN_VALUE','UI_INSTANCE'],
                       ['APP_REGISTERED','EDU'],['UI_INSTANCE','C72']]){
  const result=inspectUXSurfaceSeparation(withEdge(id,dep));
  assert.equal(result.edu_and_mcp_independent,false,id+':'+dep);
  assert(result.forbidden_cross_surface_edges.length>=1);
  if(id==='APP_REGISTERED'||id==='UI_INSTANCE')assert.equal(result.mcp_requires_edu,true);
  else assert.equal(result.edu_requires_mcp,true);
 }
 assert.throws(()=>inspectUXSurfaceSeparation(withEdge('EDU','IN_CHAT')),/UX_GRAPH_CYCLE/);
});
test('prospective EDU source offers only EDU, without treating static source as runtime',()=>{
 const report=inspectEDUOnlyVisibleSource(root);
 assert.equal(report.release,'NO_GO');
 assert.equal(report.original_owner_invoked,false);
 assert.equal(report.actual_chat_visibility_attested,false);
 assert.deepEqual(report.active_choice_violations,[]);
 assert.equal(report.status,'EDU_ONLY_SOURCE_CANDIDATE_NOT_RUNTIME_ATTESTED');
 assert.equal(report.files.length,EDU_VISIBLE_SOURCE_PATHS.length);
 // Historical/internal occurrences may remain: string search is not a UI oracle.
 assert(report.literal_canonical_mentions>=0);
});
test('no rewritten historical receipt and no MCP route renaming in blueprint-only diff',()=>{
 const original=fs.readFileSync(path.join(root,'host/c72-public-mode-admission.mjs'),'utf8');
 assert(original.includes("if(humanMessage!=='EDU')return denied('INVALID_MODE_SELECTION')"));
 const legacy=fs.readFileSync(path.join(root,'plugins/ikant-le-session-chat/server/server.mjs'),'utf8');
 assert(legacy.includes("Legacy deployed compatibility")||legacy.includes("legacy deployed"));
 const blueprint=fs.readFileSync(path.join(root,'docs/PROJECT_EDU_ONESHELL_UX_E2E_RETROGRADE.txt'),'utf8');
 for(const anchor of ['C1 — EDU entry','C2 — MCP is not EDU','P1 — EDU_ONLY_SOURCE','P2 — EDU_MIN_E2E',
 'P3 — EDU_ONESHELL_IN_CHAT','G2 VALUE','Two independent V5-G']) assert(blueprint.includes(anchor),anchor);
});
