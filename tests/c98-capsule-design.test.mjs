import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
const c=JSON.parse(fs.readFileSync(new URL('../contracts/c98-offline-capsule-strategy.json',import.meta.url),'utf8'));
test('documented source strategy forbids direct Node GitHub network and automatic ZIP upload',()=>{
 assert.equal(c.chatgpt_session_node.direct_node_github_https,'FORBIDDEN');
 assert.equal(c.chatgpt_session_node.git_clone_or_fetch_from_node,'FORBIDDEN');
 assert.equal(c.chatgpt_session_node.automatic_retries_of_same_unsupported_network,'FORBIDDEN');
 assert.equal(c.production_options.find(x=>x.id==='HEAD_EXACT_CI_ACTIONS_ARTIFACT').recommended,true);
 assert.equal(c.production_options.find(x=>x.id==='REPO_TRACKED_SELF_HEAD_ZIP').recommended,false);
 assert.equal(c.production_options.find(x=>x.id==='HUMAN_MANUAL_ZIP').scope,'EXPLICIT_LAST_RESORT_ON_USER_SELECTION');
});
test('real historical C77 ZIP validates 34 source-bound members without repository network',()=>{
 const bin=fs.readFileSync(new URL('./fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
 const r=validateC94C77Archive(bin,{sourceHead:'66f074b34f34455b3c4188703d83ad71316baa06'});
 assert.equal(r.status,'C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN');
 assert.equal(r.files,34);assert.equal(r.cx_anchors,70);
 assert.equal(r.source_origin_attested,false);
});
test('cost script uses real historical ZIP but emits zero physical host claims',()=>{
 const proc=spawnSync(process.execPath,['scripts/c98-capsule-cost-real.mjs'],{encoding:'utf8',timeout:20000});
 assert.equal(proc.status,0,proc.stderr);
 const r=JSON.parse(proc.stdout);
 assert.equal(r.member_count,34);assert.equal(r.archive_read_callbacks_if_installed,1);
 assert.equal(r.member_read_callbacks_if_installed,34);
 assert.equal(r.actual_host_binary_callback_calls,0);
 assert.equal(r.actual_new_chat_runtime_executions,0);
 assert.equal(r.node_to_github_network_attempts_by_this_script,0);
});
