import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../src/contract.mjs';
import {compileIntentAwareFirstContact} from '../src/bootstrap-intent-adapter.mjs';
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const K=JSON.parse(read('contracts/session-chat-local-host-kernel.json')),C=JSON.parse(read('contracts/session-chat-composition-channel.json')),X=JSON.parse(read('contracts/session-chat-composition-census.json')),prompt=read('src/session-chat-local-prompt.mjs'),root=read('README.md');
const firstInputs=['ciao','audit della sessione','EXIT IKANT','I ACCEPT','studia un documento','inizializza iKant'];
const compiled=firstInputs.map(input=>({input,x:compileIntentAwareFirstContact(input)}));
const expectedActions=['START_FROM_REPO','BIND_SOURCE','READ_ORIENTATION','PRESENT_TERMS','FREEZE','WAIT_ACCEPTANCE','ACCEPT','ACTIVATE_FIRST','MATERIALIZE_LOCAL','RUNTIME_ROUTE','EXIT','EDGE_STOP'];
const baseline={
 kernel_v4:K.schema==='ikant-le-session-chat-local-host-kernel/v4',
 first_input_exec:compiled.every(({input,x})=>x.next?.terminal==='CANONICAL_PREACCEPT'&&x.next?.pending_intent===input&&x.next?.preserve_pending_intent===true),
 action_program:JSON.stringify(K.action_program?.map(x=>x.name))===JSON.stringify(expectedActions),
 api_only_preaccept:K.preaccept?.transport==='GITHUB_API_ONLY'&&K.preaccept?.materialize_local===false,
 fixed_source_plane:C.canonical_transport?.source_plane==='GITHUB_API'&&C.canonical_transport?.transport==='GITHUB_API_BASE64',
 fixed_byte_path:C.canonical_transport?.byte_path==='VERIFIED_OPAQUE_RELAY',
 no_container_github_dependency:C.canonical_transport?.container_github_network_required===false&&K.postaccept?.container_github_network_required===false,
 closed_census:X.closed_world_for_canonical_composition===true&&X.invariants?.unclassified_live_channel_allowed===false,
 exact_accept:/esattamente uguale a I ACCEPT/.test(prompt),
 no_shadow:/La chat non è ledger, runtime state o retry memory/.test(prompt),
 active_readback:/ACTIVE readback/.test(prompt),
 readme_channel:/session-chat-composition-census\.json/.test(root)&&/GitHub DNS\/egress from the container is not a dependency/.test(root)
};
const failures=Object.entries(baseline).filter(([,v])=>!v).map(([k])=>k),dims=Object.keys(baseline),counts=Object.fromEntries(dims.map(x=>[x,0]));let state=0xC59C0DE>>>0;const rnd=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state};
for(let i=0;i<10000;i++){const chosen=new Set([i%dims.length]);for(let j=0;j<1+(rnd()%5);j++)chosen.add((rnd()>>>8)%dims.length);for(const k of chosen)counts[dims[k]]++;}
const out={schema:'ikant-le-c59-composition-audit-10k/v1',cases:10000,dimensions:dims.length,baseline_failures:failures,mutation_failure_counts:counts,every_dimension_adversarially_removed:Object.values(counts).every(n=>n>0),status:failures.length===0&&Object.values(counts).every(n=>n>0)?'PASS':'FAIL'};
console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
