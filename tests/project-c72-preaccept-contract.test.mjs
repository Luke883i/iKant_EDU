import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordCompletedPreacceptAccess,READ_ONLY_PREACCEPT_OVERREAD,
 HARD_PREACCEPT_BREACH} from '../src/admission.mjs';
import {initialState} from '../src/state.mjs';
const read=relative=>readFileSync(new URL('../'+relative,import.meta.url),'utf8');
test('single source of truth: no preaccept tree exception in prompt, contract or generator',()=>{
 const prompt=read('project/session-chat/PROMPT.txt');
 const matrix=JSON.parse(read('contracts/project-prompt-generation.json'));
 const generator=read('scripts/build-project-oneshell-prompt.mjs');
 const guard=JSON.parse(read('contracts/project-c72-preaccept-gate.json'));
 assert.equal(matrix.orientation_read_scope,'ONLY_HEAD_AND_FIVE_PINNED_DOCUMENTS_PREACCEPT_NO_TREE_OR_BLOBS');
 assert(generator.includes(matrix.orientation_read_scope));
 for(const word of ['A1 CLASSIFICA.','ZERO letture','NO TREE/storia/extra/script/gateway scaricato',
  'C72 originale UNA volta, ricevuta+introduzione INTEGRE','HARD senza owner'])assert(prompt.includes(word),word);
 assert(!prompt.includes('PROMPT_BLOB_TREE_METADATA_ALLOWED'));
 assert(prompt.indexOf('MACHINE_POST_ACCEPT=')>prompt.indexOf('A2 AGISCI.'));
 assert(prompt.indexOf('A2 AGISCI.')>prompt.indexOf('A1 CLASSIFICA.'));
 assert(prompt.includes('MACHINE_POST_ACCEPT=contracts/project-host-tool-grounding-abi.json (solo ora)'));
 assert(!prompt.includes('READ_MACHINE_CONTRACT_IN_ORIENTATION'));
 assert.equal(guard.gateway_can_prove_global_host_tool_exclusivity,false);
 assert.equal(guard.acceptance,'ORIGINAL_C72_V2_ONLY');
 assert.equal(Buffer.byteLength(prompt)+210<=8000,true);
});
test('incident class is conditional on verified sequence; not a natural-language assertion',()=>{
 const first=recordCompletedPreacceptAccess(initialState(),'LIST_TREE',{target:'t'});
 assert.equal(first.breach_class,READ_ONLY_PREACCEPT_OVERREAD);
 assert.equal(first.terminal,'REMEDIATION_REQUIRED');
 const second=recordCompletedPreacceptAccess(first.state,'READ_ARBITRARY_REPOSITORY_FILE',{target:'x'});
 assert.equal(second.breach_class,HARD_PREACCEPT_BREACH);
 assert.equal(second.terminal,'NEW_CHAT_REQUIRED');
});
