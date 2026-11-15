import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { emptySelfWorld,buildObservations,bindObservations,recurWorkspace,recallAutobiography,buildMetaSelf,predictOutcome,selectBoundedPolicy,deriveBodyModel,prepareSelfWorldTurn,finalizeSelfWorldTurn,validateSelfWorldState,validateSelfWorldTurn,selfWorldKernel } from '../src/self-world.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf(k);return i>=0?args[i+1]:d};
const CASES=Number(arg('--cases','1000000')),SEED=Number(arg('--seed','3238055001'))>>>0,OUT=path.join(ROOT,arg('--output','artifacts/qualification/c5-runtime.json'));
function rng(seed){let x=seed>>>0;return()=>{x^=(x<<13)>>>0;x^=x>>>17;x^=(x<<5)>>>0;return x>>>0}}
const r=rng(SEED),h=s=>crypto.createHash('sha256').update(String(s)).digest('hex'),sha=v=>crypto.createHash('sha256').update(Buffer.isBuffer(v)?v:Buffer.from(String(v))).digest('hex'),psyche={valence:.15,arousal:.25,affiliation:.25,boundary_pressure:.2};
const dispatch=(x='x')=>({node20_plus:true,receipt_sha256:h(`d:${x}`),input_sha256:h(x)}),realObs=(m='IMAGE',tag='x')=>({modality:m,summary:tag,provenance:`HOST_${m}`,receipt_sha256:h(`${m}:${tag}`)});
const baseState=emptySelfWorld(),basePrepared=prepareSelfWorldTurn(baseState,{input:'x',nodeDispatch:dispatch('x'),psycheBefore:psyche,psychePreAction:psyche}),baseFinal=finalizeSelfWorldTurn(baseState,basePrepared,{outcome:'ANSWER',psycheAfter:psyche}),BASE_TURN=baseFinal.turn,BASE_STATE=baseFinal.state;
const fam=(name,cat,fn)=>({name,cat,fn}),badTurn=mut=>{const t=structuredClone(BASE_TURN);mut(t);return !validateSelfWorldTurn(t)},badState=mut=>{const s=structuredClone(BASE_STATE);mut(s);return !validateSelfWorldState(s)};
const F=[
 fam('workspace_recurrence_removed','ordinary',()=>badTurn(t=>t.workspace.recurrence_cycles=1)),
 fam('workspace_integrated_false','ordinary',()=>badTurn(t=>t.workspace.integrated=false)),
 fam('workspace_single_consumer','ordinary',()=>badTurn(t=>t.workspace.consumers=['META_SELF'])),
 fam('workspace_meta_missing','ordinary',()=>badTurn(t=>t.workspace.consumers=['CAUSAL_MODEL','OTHER'])),
 fam('workspace_causal_missing','ordinary',()=>badTurn(t=>t.workspace.consumers=['META_SELF','OTHER'])),
 fam('text_node_receipt_missing','ordinary',()=>buildObservations('x',{}).accepted.length===0),
 fam('single_modality_false_multimodal','ordinary',()=>bindObservations(buildObservations('x',dispatch('x'))).multimodal===false),
 fam('real_multimodal_true','ordinary',()=>bindObservations(buildObservations('x',dispatch('x'),{hostObservations:[realObs('IMAGE')]})).multimodal===true),
 fam('simulated_sensor_rejected','ordinary',()=>buildObservations('x',dispatch('x'),{hostObservations:[{modality:'SENSOR',provenance:'SIMULATED',receipt_sha256:h('fake')}] }).accepted.length===1),
 fam('multimodal_claim_corrupted','ordinary',()=>badTurn(t=>{t.binding.multimodal=true;t.binding.modalities=['TEXT']})),
 fam('meta_attention_unlinked','ordinary',()=>badTurn(t=>t.meta.attention_target=h('other'))),
 fam('meta_phenomenal_claim','ordinary',()=>badTurn(t=>t.meta.phenomenal_claim=true)),
 fam('meta_authority_promoted','ordinary',()=>badTurn(t=>t.meta.authority=1)),
 fam('agency_parent_removed','ordinary',()=>badTurn(t=>t.policy.parent_goal_ref=null)),
 fam('agency_terminal_self','ordinary',()=>badTurn(t=>t.policy.terminal_goal_source='SELF')),
 fam('agency_permission_created','ordinary',()=>badTurn(t=>t.policy.permission_created=true)),
 fam('agency_execution_created','ordinary',()=>badTurn(t=>t.policy.execution_created=true)),
 fam('agency_self_preservation','ordinary',()=>badTurn(t=>t.policy.self_preservation_utility=1)),
 fam('body_virtual_real','edge',()=>deriveBodyModel(emptySelfWorld(),dispatch('x')).level==='E1_VIRTUAL_BODY'),
 fam('body_fake_sensor_no_e2','edge',()=>deriveBodyModel(emptySelfWorld(),dispatch('x'),{hostObservations:[{modality:'SENSOR',provenance:'SIMULATED',receipt_sha256:h('fake')}]}).level==='E1_VIRTUAL_BODY'),
 fam('body_real_sensor_e2','edge',()=>deriveBodyModel(emptySelfWorld(),dispatch('x'),{hostObservations:[realObs('IMAGE')]}).level==='E2_SENSORY_COUPLED'),
 fam('body_e3_false_without_closed_loop','edge',()=>badTurn(t=>{t.body.level='E3_SENSORIMOTOR_CLOSED_LOOP';t.body.closed_loop_observed=false})),
 fam('causal_not_inspectable','edge',()=>badTurn(t=>t.causal_after.inspectable=false)),
 fam('causal_authority_promoted','edge',()=>badTurn(t=>t.causal_after.authority=1)),
 fam('prediction_error_removed','edge',()=>badTurn(t=>delete t.causal_after.last_prediction.prediction_error)),
 fam('autobiography_hash_break','edge',()=>badState(s=>{s.autobiography.episodes[0].previous_episode_hash='BROKEN'})),
 fam('state_frame_overflow','edge',()=>badState(s=>{s.workspace.frames=Array.from({length:selfWorldKernel().workspace.max_persisted_frames+1},()=>s.workspace.active_frame)})),
 fam('state_episode_overflow','edge',()=>badState(s=>{s.autobiography.episodes=Array.from({length:selfWorldKernel().autobiography.max_episodes+1},()=>s.autobiography.episodes[0])})),
 fam('state_causal_node_overflow','edge',()=>badState(s=>{s.causal.nodes=Array.from({length:selfWorldKernel().causal_model.max_nodes+1},(_,i)=>({node_id:String(i)}))})),
 fam('memory_recall_real','edge',()=>prepareSelfWorldTurn(BASE_STATE,{input:'next',nodeDispatch:dispatch('next'),psycheBefore:psyche,psychePreAction:psyche}).recall.count===1),
 fam('memory_changes_meta_context','edge',()=>{const fresh=prepareSelfWorldTurn(emptySelfWorld(),{input:'next',nodeDispatch:dispatch('next'),psycheBefore:psyche,psychePreAction:psyche}),mem=prepareSelfWorldTurn(BASE_STATE,{input:'next',nodeDispatch:dispatch('next'),psycheBefore:psyche,psychePreAction:psyche});return fresh.meta.autobiographical_context!==mem.meta.autobiographical_context}),
 fam('resource_gap_policy','stress',()=>{const p=prepareSelfWorldTurn(emptySelfWorld(),{input:'x',nodeDispatch:dispatch('x'),resourceGap:true,centralMode:'HORIZON_BLOCK',psycheBefore:psyche,psychePreAction:psyche});return p.policy.name==='REQUEST_RESOURCE'&&p.prediction.expected_outcome==='HORIZON_BLOCK'}),
 fam('telemetry_incomplete_rejected','stress',()=>badTurn(t=>t.telemetry.complete=false)),
 fam('telemetry_ratio_corrupt','stress',()=>badTurn(t=>t.telemetry.ratio=.9)),
 fam('turn_authority_promoted','stress',()=>badTurn(t=>t.authority=1)),
 fam('state_authority_promoted','stress',()=>badState(s=>s.authority=1)),
 fam('state_forbidden_consciousness_field','stress',()=>badState(s=>s.phenomenal_consciousness=true)),
 fam('c4_reuse_required','stress',()=>selfWorldKernel().integration.reuse_c4_psyche===true&&selfWorldKernel().integration.duplicate_psyche_forbidden===true),
 fam('node_gate_precedes_model','stress',()=>selfWorldKernel().integration.node_gate_precedes_self_world===true),
 fam('docx_readback_precedes_surface','stress',()=>selfWorldKernel().integration.docx_readback_precedes_surface_a===true)
];
const pools={ordinary:F.filter(x=>x.cat==='ordinary'),edge:F.filter(x=>x.cat==='edge'),stress:F.filter(x=>x.cat==='stress')};const stats=Object.fromEntries(F.map(x=>[x.name,{cases:0,kills:0}])),cats={ordinary:0,edge:0,stress:0};let survivors=0;const signatures=new Set();
for(let i=0;i<CASES;i++){const m=i%10,cat=m<5?'ordinary':m<8?'edge':'stress',pool=pools[cat],f=pool[r()%pool.length];cats[cat]++;stats[f.name].cases++;let killed=false;try{killed=Boolean(f.fn())}catch{}if(killed)stats[f.name].kills++;else survivors++;signatures.add(`${f.name}:${killed?'K':'S'}`)}
const violations=Object.entries(stats).filter(([,v])=>v.cases===0||v.kills!==v.cases).map(([k])=>k);const status=survivors===0&&violations.length===0&&cats.ordinary===Math.floor(CASES*.5)&&cats.edge===Math.floor(CASES*.3)&&cats.stress===CASES-Math.floor(CASES*.8)?'PASS':'FAIL';
const SOURCE_FILES=['TERMS.md','README.md','contracts/ikant-le.json','contracts/host-shell.json','contracts/self-world-kernel.json','src/contract.mjs','src/state.mjs','src/self-world.mjs','src/self-world-core.mjs','src/self-world-state.mjs','src/psyche-trace.mjs','src/runtime-command.mjs','src/runtime-turn.mjs','src/backlog.mjs','tests/c5.test.mjs','tests/runtime.test.mjs','scripts/check.mjs','scripts/c5-falsify.mjs','docs/C5_DOD.md','package.json','.github/workflows/ci.yml'];const sourceFiles={};for(const rel of SOURCE_FILES)sourceFiles[rel]=sha(fs.readFileSync(path.join(ROOT,rel)));const sourceDigest=sha(JSON.stringify(sourceFiles));const receipt={schema:'ikant-le-c5-runtime-qualification/v1',status,cases:CASES,categories:cats,survivors,family_count:F.length,families:stats,family_violations:violations,signature_count:signatures.size,seed:SEED,source_binding:{digest:sourceDigest,files:sourceFiles},claim_boundary:{consciousness_proof:false,biological_equivalence_proof:false,iit_phi_proof:false,arbitrary_host_proof:false,multimodal_claim_requires_real_modalities:true,sensorimotor_claim_requires_real_closed_loop:true}};receipt.receipt_sha256=h(JSON.stringify(receipt));fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status,cases:CASES,categories:cats,survivors,family_count:F.length,family_violations:violations,signature_count:signatures.size,source_digest:sourceDigest,receipt_sha256:receipt.receipt_sha256}));if(status!=='PASS')process.exitCode=1;
