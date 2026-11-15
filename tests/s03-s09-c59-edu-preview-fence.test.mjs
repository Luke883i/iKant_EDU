import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';
const root=new URL('..',import.meta.url).pathname;
test('C59 census permits ONLY bounded preview C70 EDU/v2 and rejects any canonical issuer',()=>{
 const x=JSON.parse(readFileSync(new URL('../contracts/session-chat-executable-surface-registry.json',import.meta.url),'utf8'));
 assert.ok(x.discovery.excluded_experimental_non_activation_files.includes('src/c70-edu-v2-compute-preview.mjs'));
 const s=readFileSync(new URL('../src/c70-edu-v2-compute-preview.mjs',import.meta.url),'utf8');
 for(const m of ['active:false','canonical_runtime:false','owner_receipt_issued:false'])assert.ok(s.includes(m),m);
 assert.doesNotMatch(s,/export\s+(?:async\s+)?function\s+(?:runCanonicalSessionChat|canonicalActiveReadback|issueCanonicalSessionChatComposition)\b/);
 const r=spawnSync(process.execPath,['scripts/c59-executable-surface-audit.mjs'],{cwd:root,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);const j=JSON.parse(r.stdout);
 assert.equal(j.status,'PASS');assert.equal(j.activation_related_files,25);
 assert.equal(j.canonical_active_issuer_count,1);
});
