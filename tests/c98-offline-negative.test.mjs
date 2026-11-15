import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {preflightC98ChatGPTOffline,C98_CHATGPT_NODE_NETWORK_DENIAL as POLICY}
 from '../host/c98-chatgpt-offline-boundary.mjs';
import {executeC98ExistingC84} from '../host/c98-existing-c84-entry.mjs';
const head='a'.repeat(40), selection={status:'EXPERIMENTAL_SELECTED_NOT_RUNNING',selected_mode:'EXPERIMENTAL'};
const base={humanInput:'Una richiesta corrente',sourceHead:head,selection};
test('ChatGPT Node GitHub DNS/HTTPS/clone/direct ZIP are explicitly prohibited by default',()=>{
 assert.equal(POLICY.github_dns_attested,false);
 for(const k of ['node_github_https_allowed','node_git_clone_allowed','node_direct_zip_allowed',
 'node_curl_wget_allowed','raw_github_download_in_node_allowed'])assert.equal(POLICY[k],false);
});
test('no installed host bytes callback stops before requiring source proof or invoking any DNS',async()=>{
 const d=preflightC98ChatGPTOffline(base);
 assert.equal(d.first_unclosed_edge,'HOST_CONNECTOR_TO_NODE_BYTE_CALLBACK_UNAVAILABLE_NO_NODE_DNS_RETRY');
 const r=await executeC98ExistingC84(base);
 assert.equal(r.status,'C98_STOP');
 assert.equal(r.first_unclosed_edge,'HOST_CONNECTOR_NODE_CALLBACK_NOT_INSTALLED');
});
test('explicit direct Node GitHub network proposal is rejected even with callback',async()=>{
 const q={...base,readC77Archive:async()=>{throw Error('SHOULD_NOT_CALL');},nodeGithubNetworkRequested:true};
 const d=preflightC98ChatGPTOffline(q);
 assert.equal(d.first_unclosed_edge,'CHATGPT_NODE_GITHUB_NETWORK_FORBIDDEN');
 const r=await executeC98ExistingC84(q);
 assert.equal(r.first_unclosed_edge,'CHATGPT_NODE_GITHUB_NETWORK_FORBIDDEN');
});
test('a callback has no authenticated GitHub provenance and does not bypass source proof',async()=>{
 let calls=0;const q={...base,readC77Archive:async()=>{calls++;throw Error('PHANTOM');}};
 const d=preflightC98ChatGPTOffline(q);
 assert.equal(d.status,'C98_CALLBACK_SHAPE_READY_NOT_HOST_AUTHENTICATED');
 assert.equal(d.host_connector_origin_attested,false);
 const r=await executeC98ExistingC84(q);
 assert.equal(r.first_unclosed_edge,'C81_VERIFIED_SOURCE_PROOF_REQUIRED');
 assert.equal(calls,0);
});
test('C98 ChatGPT entry never imports Node GitHub HTTPS, DNS, curl, wget or subprocess network',()=>{
 for(const path of ['../host/c98-chatgpt-offline-boundary.mjs',
  '../host/c98-existing-c84-entry.mjs','../host/c98-c82-connector-port.mjs',
  '../host/c98-archive-c82-port.mjs']){
  const s=fs.readFileSync(new URL(path,import.meta.url),'utf8');
  assert.doesNotMatch(s,/\b(?:import|require)\s*(?:\(|\s+).*?['"](?:node:)?(?:https|http|dns|net|child_process)['"]/);
  assert.doesNotMatch(s,/\b(?:execFile|execSync|spawn|spawnSync|fetch)\s*\(/);
 }
});
