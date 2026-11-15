import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {renderSessionChatLocalPromptDocument} from '../src/session-chat-local-prompt.mjs';
test('C84 generated prompt parity and C72 mode scope',()=>{
 assert.equal(fs.readFileSync(new URL('../docs/SESSION_CHAT_LOCAL_PROMPT.md',import.meta.url),'utf8'),renderSessionChatLocalPromptDocument());
 assert.match(renderSessionChatLocalPromptDocument(),/AZIONE 210 C72_MODE_GATE/);
});
test('C84 historical census, overlapping tags, transport-only canonicalization',()=>{
 const stdout=execFileSync(process.execPath,[new URL('../scripts/c84-host-composition-qualify.mjs',import.meta.url).pathname],{encoding:'utf8'});
 const receipt=JSON.parse(stdout);
 assert.equal(receipt.status,'REPOSITORY_POLICY_CONCORDANCE_NOT_HOST_RUNTIME_PROOF');
 assert.equal(receipt.merged_count,85);
 assert.equal(receipt.native_host_sessions_tested,0);
});
