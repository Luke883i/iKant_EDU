import {gateC99ExperimentalEntry} from './c99-route-policy.mjs';
/**
 * C98.12 CHATGPT_SESSION_NODE: NEGATIVE HOST CAPABILITY CONTRACT.
 * The ChatGPT session Node/container has no attested GitHub DNS/HTTPS route.
 * NEVER attempt `https://api.github.com`, raw.githubusercontent.com, git
 * clone/fetch, curl, wget, direct ZIP, or an implicit C94 HTTPS fallback from
 * this process. Repeating a DNS failure is not discovery or convergence.
 * Only an actually installed host connector/host-file callback may supply bytes.
 * A callback's JavaScript type is NOT evidence of connector authorization.
 * This module never calls DNS, HTTPS, a shell, provider or native renderer.
 * Different application hosts can implement independent, separately attested
 * transports: this project-local policy MUST NOT silently authorize them.
 */
export const C98_CHATGPT_NODE_NETWORK_DENIAL=Object.freeze({
 environment:'CHATGPT_SESSION_NODE',
 github_dns_attested:false,
 node_github_https_allowed:false,
 node_git_clone_allowed:false,
 node_direct_zip_allowed:false,
 node_curl_wget_allowed:false,
 raw_github_download_in_node_allowed:false,
 host_connector_byte_callback_required:true,
 host_download_attempts_authorized_by_this_module:0,
 manual_handoff_automatic:false,
});
const diagnostic=(edge)=>Object.freeze({schema:'ikant-le-c98-chatgpt-offline-boundary/v1',
 status:'C98_CHATGPT_OFFLINE_STOP',first_unclosed_edge:edge,
 environment:'CHATGPT_SESSION_NODE',node_github_network_permitted:false,
 host_connector_origin_attested:false,host_byte_transfer_attested:false,
 active:false,authority:0});
/** C99 is authoritative for the STRUCTURAL gate. C84/C81 still own execution. */
export function preflightC98ChatGPTOffline(args={}){
 const gate=gateC99ExperimentalEntry(args);
 if(gate.status!=='C99_CALLBACK_SHAPE_ONLY_NOT_AUTHENTICATED')
   return diagnostic(gate.first_unclosed_edge);
 return Object.freeze({schema:'ikant-le-c98-chatgpt-offline-boundary/v1',
  status:'C98_CALLBACK_SHAPE_READY_NOT_HOST_AUTHENTICATED',
  first_unclosed_edge:'C81_SOURCE_GIT_OBJECT_BYTES_REQUIRED',
  node_github_network_permitted:false,host_connector_origin_attested:false,
  host_byte_transfer_attested:false,active:false,authority:0});
}
