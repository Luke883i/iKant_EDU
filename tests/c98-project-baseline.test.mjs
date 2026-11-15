import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {observeC98ProjectCapabilities,ownerEdges} from '../host/c98-project-boundary-observer.mjs';

const root=new URL('../',import.meta.url);
const load=p=>readFileSync(new URL(p,root),'utf8');
const policy=JSON.parse(load('contracts/c98-project-2object-baseline.json'));
const base={sourceHead:'a'.repeat(40),callableGithubConnector:true,termsBytesActuallyRead:true,nodeOwnerActuallyCallable:true};

test('only two owned objects, 3 MD, no installed MCP or native control claim',()=>{
 assert.deepEqual(policy.objects_owned,['GITHUB_REPOSITORY','CHATGPT_EDU_PROJECT']);
 assert.equal(policy.strict_semantics.only_uploaded_project_guides_required,3);
 assert.equal(policy.strict_semantics.user_sees_iKant_until_optout_guaranteed_by_PP,false);
 assert.equal(policy.strict_semantics.repoSHA_authenticates_ref_origin,false);
 assert.equal(policy.acceptance.zero_node_github_network_without_verified_capability,true);
 assert.deepEqual(policy.acceptance.preaccept_allowed_repo_paths,
  ['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
});

test('project instructions and exactly three guides preserve admission and no DNS/network retries',()=>{
 const names=['iKant_GATE.md','iKant_ENGINE.md','iKant_UI_shell.md'];
 for(const f of names)assert.ok(existsSync(new URL('project-baseline/PROJECT_FILES/'+f,root)));
 for(const f of names){const s=load('project-baseline/PROJECT_FILES/'+f);
  assert.ok(s.includes('AUTHORITY=0'),f);
  assert.ok(!s.includes('https://tuo-server.example/mcp'),f);
 }
 const prompt=load('project-baseline/PROJECT_PROMPT.txt');
 for(const s of ['I ACCEPT','CANONICAL','EXPERIMENTAL','TERMS.md','FIRST_UNCLOSED_EDGE','DIAGNOSTIC_ONLY',
  'git','curl','wget','No','MCP'])assert.ok(prompt.includes(s),s);
 const gate=load('project-baseline/PROJECT_FILES/iKant_GATE.md');
 for(const p of policy.acceptance.preaccept_allowed_repo_paths)assert.ok(gate.includes(p),p);
 assert.ok(load('project-baseline/PROJECT_FILES/iKant_ENGINE.md').includes('NO THIRD RESOURCE'));
});

test('diagnostic only even when host capability flags falsely claim real owner',()=>{
 const r=observeC98ProjectCapabilities(base);
 assert.equal(r.status,'C98_DIAGNOSTIC_ONLY');
 assert.equal(r.surface_a_exact_utf8,null);
 assert.equal(r.active,false);
 assert.equal(r.native_chat_delivery_attested,false);
 assert.equal(r.owner_executed,false);
 assert.equal(r.first_unclosed_edge,'SAME_INPUT_C81_C84_OR_C59_OWNER_READBACK');
 assert.equal(ownerEdges.length,7);
});

test('C98 negative observer rejects missing capabilities and getter/prototype smuggling',()=>{
 for(const [x,edge] of [
 [{...base,callableGithubConnector:false},'ACTUALLY_CALLABLE_GITHUB_CONNECTOR'],
 [{...base,sourceHead:'fiction'},'FROZEN_GITHUB_HEAD_READBACK'],
 [{...base,termsBytesActuallyRead:false},'FIVE_SOURCE_FILES_AND_FULL_TERMS_READBACK'],
 [{...base,nodeOwnerActuallyCallable:false},'CURRENT_HUMAN_INPUT_TO_REAL_SOURCE_BOUND_NODE_OWNER'],
 [{...base,ownerReceipt:'fake'},'PROJECT_HOST_CAPABILITY_DATA_UNVERIFIED'],
 ])assert.equal(observeC98ProjectCapabilities(x).first_unclosed_edge,edge);
 let traps=0;
 const g={...base};Object.defineProperty(g,'nodeOwnerActuallyCallable',{get(){traps++;return true;},enumerable:true});
 assert.equal(observeC98ProjectCapabilities(g).status,'C98_DIAGNOSTIC_ONLY');
 assert.equal(traps,0);
 assert.equal(observeC98ProjectCapabilities(Object.assign(Object.create({fake:true}),base)).status,'C98_DIAGNOSTIC_ONLY');
});
