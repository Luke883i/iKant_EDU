#!/usr/bin/env node
/** 10^4 semantic state combinations, not 10k model calls or human experiments. */
import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {initialState} from '../src/state.mjs';
import {buildSessionShell} from '../src/session-shell.mjs';
import {projectSessionCapsule,verifySessionCapsule,renderSessionCapsule} from '../host/project-session-capsule.mjs';
const H=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const source={head:'a'.repeat(40),tree:'b'.repeat(40)};
const states=['DISCOVERED','TERMS_PRESENTED','ACCEPTED','PROBED','BLOCKED_INTEGRITY','SESSION_NONCONFORMING','ADMISSION_EPOCH_UNRECOVERABLE','EXITED','ACTIVE_WITHOUT_READBACK','ACTIVE_WITH_READBACK'];
const backlogs=[0,1,2,3,4,5,8,13,21,34];
const mutations=[],seen=new Set();let failures=0;
for(let s=0;s<10;s++)for(let host=0;host<10;host++)for(let debt=0;debt<10;debt++)for(let backlog=0;backlog<10;backlog++){
 const state=initialState();state.status=states[s];state.accepted=s>=2;state.admission.terms_presented=s>=1;
 if(s===8||s===9){state.status='ACTIVE';state.bootstrap.terminal=s===9?'ACTIVE':'UNVERIFIED';}
 const events=Array.from({length:backlogs[backlog]},(_,i)=>({kind:'TURN',detail:{artifact:`backlog-${i}.docx`}}));
 const shell=buildSessionShell({state,events,surfaceText:''});
 const c=projectSessionCapsule({shell,source,host:{node:`20.${host}.0`,native_ui:true,cross_session_persistence:true},ledgerTip:String(debt).repeat(64),epoch:`epoch-${debt}`});
 const text=renderSessionCapsule(c,{evidenceHref:'sandbox:/verified.json'});
 const ok=verifySessionCapsule(c)&&JSON.stringify(c.payload.original_session_shell)===JSON.stringify(shell)&&
  c.axes.backlog.artifacts.length===backlogs[backlog]&&c.axes.host.native_ui.status==='UNKNOWN'&&
  c.active===false&&c.voice==='NO_VOICE'&&c.coverage.global_semantic_equivalence_attested===false&&
  text.includes('NO_VOICE')&&text.length<1600;
 const bad=structuredClone(c);bad.axes.backlog.artifacts.push('invented.docx');
 const rejected=!verifySessionCapsule(bad);
 const signature=H({s,host,debt,backlog,capsule:c.evidence_sha256});seen.add(signature);
 if(!ok||!rejected)failures++;
 mutations.push({case:mutations.length,dimensions:{state:states[s],host_node_minor:host,epoch_and_ledger_variant:debt,backlog_documents:backlogs[backlog]},signature,pass:ok&&rejected});
}
// Architecture eligibility is a declared engineering decision matrix, not an empirical UX score.
const candidates=[
 {id:'PROMPT_ONLY',bundle:false,owner_execution:false,recoverable:false,new_writer:false,external_service:false},
 {id:'BUNDLE_PROMPT',bundle:true,owner_execution:true,recoverable:true,new_writer:false,external_service:false},
 {id:'REPO_OWNER_PROJECTION',bundle:false,owner_execution:true,recoverable:true,new_writer:false,external_service:false},
 {id:'MCP_UI_SERVICE',bundle:false,owner_execution:true,recoverable:true,new_writer:false,external_service:true},
 {id:'SECOND_SESSION_LEDGER',bundle:false,owner_execution:true,recoverable:true,new_writer:true,external_service:false}
].map(c=>({...c,eligible:!c.bundle&&c.owner_execution&&c.recoverable&&!c.new_writer,
 additional_deployment_cost:c.external_service?1:0}));
const eligible=candidates.filter(c=>c.eligible).sort((a,b)=>a.additional_deployment_cost-b.additional_deployment_cost);
const result={schema:'ikant-le-project-semantic-selection/v1',seed:'EXHAUSTIVE_10x10x10x10',
 cases:mutations.length,unique_cases:seen.size,semantic_dimensions:['runtime_lifecycle','observed_host_version','epoch_ledger_binding','backlog_cardinality'],
 mutation_trace_sha256:H(mutations),failures,candidates,selected:eligible[0].id,
 optimality_scope:'MINIMUM_ADDITIONAL_DEPLOYMENT_AMONG_FIVE_DECLARED_ARCHITECTURES_UNDER_AVAILABLE_GITHUB_API_AND_NODE',
 human_ux_tested:false,real_model_efficacy_tested:false,native_ui_tested:false,
 global_semantic_lossless_attested:false,authority:0};
if(mutations.length!==10000||seen.size!==10000||failures||eligible[0].id!=='REPO_OWNER_PROJECTION')throw Error('PROJECT_10K_QUALIFICATION_FAILED');
const out=process.argv[2]||'artifacts/qualification/project-session-selection-10k.json';
fs.mkdirSync(new URL('../artifacts/qualification/',import.meta.url),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(out.replace(/\.json$/,'.jsonl'),mutations.map(x=>JSON.stringify(x)).join('\n')+'\n');
fs.writeFileSync(out.replace(/\.json$/,'.jsonl.gz'),gzipSync(Buffer.from(mutations.map(x=>JSON.stringify(x)).join('\n')+'\n'),{level:9}));
console.log(JSON.stringify(result));
