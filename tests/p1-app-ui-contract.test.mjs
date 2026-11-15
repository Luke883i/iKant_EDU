import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../plugins/ikant-le-session-chat/server/public/ikant-le-app.html',import.meta.url),'utf8');
const server=fs.readFileSync(new URL('../plugins/ikant-le-session-chat/server/server.mjs',import.meta.url),'utf8');
const prompt=fs.readFileSync(new URL('../project/oneshell-v7/PROMPT_TEMPLATE.txt',import.meta.url),'utf8');
const builder=fs.readFileSync(new URL('../scripts/p2-build-oneshell-release.py',import.meta.url),'utf8');
test('one visible app root has exactly six shell slots and no detached UI',()=>{
 assert.equal((app.match(/<main id="shell"/g)||[]).length,1);
 assert.deepEqual([...app.matchAll(/<section data-slot="([A-Z]+)"/g)].map(x=>x[1]),['ESITO','A','B','PROVA','EDGE','NEXT']);
 assert.ok(app.indexOf('id="accept"')>app.indexOf('data-slot="NEXT"'));
 assert.ok(app.indexOf('id="composer"')>app.indexOf('data-slot="NEXT"'));
 assert.ok(app.indexOf('id="artifacts"')>app.indexOf('data-slot="PROVA"'));
 assert.ok(app.includes('aria-live="polite"'));
});
test('browser projection never promotes unverified human voice',()=>{
 assert.ok(app.includes("voice.textContent='NO_VOICE'"));
 assert.ok(app.includes('v.voice_attested===true'));
 assert.ok(app.includes('original voice digest mismatch'));
 assert.ok(app.includes('v.source_host_shell_sha256===shell.sha256'));
 assert.ok(app.includes('v.host_frame_receipt_sha256===f.receipt_sha256'));
 assert.ok(!app.includes('innerHTML'));
 assert.ok(app.indexOf('artifacts.classList.remove')<app.indexOf('out.textContent=shell.text'));
 assert.ok(server.includes('projectP1AppExclusiveShell({result:x,frame:x.host_frame})'));
 assert.ok(server.includes('validateHostConsumptionFrame(x?.host_frame)'));
});
test('project prompt + zip refer to app while preserving native non-installation truth',()=>{
 assert.ok(prompt.includes('SHELL ONLY:'));
 assert.ok(prompt.includes('not an installed UI'));
 assert.ok(builder.includes("add('adapter_source/host/p1-app-exclusive-shell.mjs','host/p1-app-exclusive-shell.mjs')"));
 assert.ok(builder.includes('PINNED_COMMIT_OBJECT.raw'));
});

test('PR candidate package is source-bound to actual PR head, never transient merge SHA',()=>{
 const workflow=fs.readFileSync(new URL('../.github/workflows/p1-p7-oneshell-release.yml',import.meta.url),'utf8');
 assert.ok(workflow.includes('ref: ${{ github.event.pull_request.head.sha || github.sha }}'));
 assert.ok(workflow.includes('ikant-oneshell-v7-candidate-${{ github.event.pull_request.head.sha || github.sha }}'));
 assert.ok(!workflow.includes('ikant-oneshell-v7-candidate-${{ github.sha }}'));
});
