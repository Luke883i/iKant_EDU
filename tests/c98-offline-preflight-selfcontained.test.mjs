import test from 'node:test';
import assert from 'node:assert/strict';
import {C98_CHATGPT_NODE_NETWORK_DENIAL,preflightC98ChatGPTOffline} from '../host/c98-chatgpt-offline-boundary.mjs';
const sourceHead='a'.repeat(40);
const selection={selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'};
const input={sourceHead,selection,humanInput:'Prova corrente'};
test('C98 forbids known-offline Node GitHub network without probing',()=>{
 assert.equal(C98_CHATGPT_NODE_NETWORK_DENIAL.node_github_https_allowed,false);
 assert.equal(C98_CHATGPT_NODE_NETWORK_DENIAL.node_git_clone_allowed,false);
 assert.equal(C98_CHATGPT_NODE_NETWORK_DENIAL.node_curl_wget_allowed,false);
 const r=preflightC98ChatGPTOffline({...input,nodeGithubNetworkRequested:true,readC77Archive:()=>{throw Error('must not be called');}});
 assert.equal(r.first_unclosed_edge,'CHATGPT_NODE_GITHUB_NETWORK_FORBIDDEN');
 assert.equal(r.active,false);
});
test('C98 does not invent an installed carrier',()=>{
 const r=preflightC98ChatGPTOffline(input);
 assert.equal(r.first_unclosed_edge,'HOST_CONNECTOR_TO_NODE_BYTE_CALLBACK_UNAVAILABLE_NO_NODE_DNS_RETRY');
 assert.equal(r.host_connector_origin_attested,false);
 assert.equal(r.active,false);
});
test('C98 rejects carrier ambiguity and never promotes callback shape to trust',()=>{
 const both=preflightC98ChatGPTOffline({...input,readC77Member:()=>{},readC77Archive:()=>{}});
 assert.equal(both.first_unclosed_edge,'AMBIGUOUS_HOST_CARRIER_SELECT_ONE');
 const one=preflightC98ChatGPTOffline({...input,readC77Archive:()=>{}});
 assert.equal(one.status,'C98_CALLBACK_SHAPE_READY_NOT_HOST_AUTHENTICATED');
 assert.equal(one.host_connector_origin_attested,false);
 assert.equal(one.active,false);
});
