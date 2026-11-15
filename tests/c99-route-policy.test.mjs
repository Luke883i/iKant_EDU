import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gateC99ExperimentalEntry,gateC99SourceHandoff,readC99SelectionFields} from '../host/c99-route-policy.mjs';
import {preflightC98ChatGPTOffline} from '../host/c98-chatgpt-offline-boundary.mjs';
import {executeC98ExistingC84} from '../host/c98-existing-c84-entry.mjs';
const h='a'.repeat(40),s={selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'};
const b={sourceHead:h,selection:s,humanInput:'salve'};
const cb=()=>{throw Error('CALLBACK_MUST_NOT_EXECUTE')};
test('C99 source contract contains only existing owners, all host proof layers and safe negative routes',()=>{
 const c=JSON.parse(fs.readFileSync(new URL('../contracts/c99-canonical-runtime-paths.json',import.meta.url)));
 assert.equal(c.authority,0);
 assert.equal(c.routes.EXPERIMENTAL.owner,'host/c84-experimental-transport.mjs#executeC84ExperimentalTurn');
 assert.deepEqual(c.routes.PREACCEPT.allowed_repo_paths,['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
 assert.equal(c.routes.CANONICAL.may_fallback_to_experimental,false);
 assert.equal(c.negative_capabilities.callback_shape_authenticates_host,false);
 assert.equal(c.host_gates_independent.length,8);
});
test('No carrier, two carriers and requested Node DNS are negative, with stable C98 public statuses',()=>{
 for(const [x,edge] of [
 [b,'HOST_CONNECTOR_TO_NODE_BYTE_CALLBACK_UNAVAILABLE_NO_NODE_DNS_RETRY'],
 [{...b,readC77Member:cb,readC77Archive:cb},'AMBIGUOUS_HOST_CARRIER_SELECT_ONE'],
 [{...b,readC77Archive:cb,nodeGithubNetworkRequested:true},'CHATGPT_NODE_GITHUB_NETWORK_FORBIDDEN'],
 [{...b,selection:{...s,selected_mode:'CANONICAL'}},'C72_OR_SOURCE_CURRENT_INPUT_REQUIRED'],
 [{...b,sourceHead:'not-a-SHA'},'C72_OR_SOURCE_CURRENT_INPUT_REQUIRED'],
 ]){
  assert.equal(gateC99ExperimentalEntry(x).first_unclosed_edge,edge);
  assert.equal(preflightC98ChatGPTOffline(x).first_unclosed_edge,edge);
 }
});
test('Callback shape is never host authentication or owner execution',()=>{
 const p=preflightC98ChatGPTOffline({...b,readC77Archive:cb});
 assert.equal(p.status,'C98_CALLBACK_SHAPE_READY_NOT_HOST_AUTHENTICATED');
 assert.equal(p.host_connector_origin_attested,false);
 const g=gateC99ExperimentalEntry({...b,readC77Archive:cb});
 assert.equal(g.callback_shape_only,true);
 assert.equal(g.owner_executed,false);
});
test('Own-value descriptor rejects getter selection without executing getter',async()=>{
 let called=0;const bad={status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'};
 Object.defineProperty(bad,'selected_mode',{get(){called++;return 'EXPERIMENTAL'},enumerable:true});
 assert.equal(readC99SelectionFields(bad).selected_mode,undefined);
 const x={...b,selection:bad,readC77Archive:cb};
 assert.equal(preflightC98ChatGPTOffline(x).status,'C98_CHATGPT_OFFLINE_STOP');
 assert.equal((await executeC98ExistingC84(x)).owner_executed,false);
 assert.equal(called,0);
});
test('C81 source proof is only a shape hint until original C81 actually validates git objects',async()=>{
 assert.equal(gateC99SourceHandoff({sourceHead:h,manifestSha256:'b'.repeat(64),sourceProof:{commitBase64:'x',treeObjects:[]}}).status,'C99_STOP');
 const probe=gateC99SourceHandoff({sourceHead:h,manifestSha256:'b'.repeat(64),sourceProof:{commitBase64:'x',treeObjects:[{}]}});
 assert.equal(probe.status,'C99_C81_PROOF_SHAPE_ONLY_NOT_VERIFIED');
 assert.equal(probe.owner_executed,false);
 assert.equal(probe.source_origin_attested,false);
 let calls=0;
 const r=await executeC98ExistingC84({...b,manifestSha256:'b'.repeat(64),readC77Archive:()=>{calls++;throw Error('NOT_AUTHORIZED')},sourceProof:{commitBase64:'x',treeObjects:[]}});
 assert.equal(r.first_unclosed_edge,'C81_VERIFIED_SOURCE_PROOF_REQUIRED');
 assert.equal(calls,0);
});
test('Owner never runs on malformed UTF8 or long current input',()=>{
 for(const humanInput of ['', 'a'.repeat(601), '\ud800']){
  const r=gateC99ExperimentalEntry({...b,humanInput,readC77Archive:cb});
  assert.equal(r.status,'C99_STOP');
 }
});
