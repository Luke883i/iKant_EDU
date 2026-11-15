import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
import {C107_FILES} from '../scripts/c107-pack.mjs';
import {C124_OVERLAY_GIT_BLOBS} from '../host/c124-source-overlay.mjs';
const sha=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const originals={
 'host/c69-capability-first-preview.mjs':'8576e096f169b0eab4a4b5e39d3a5c1794455199',
 'host/c100-cohost-experimental.mjs':'56ddddd553f5df7aa3a7e72ee1e56dd8b8560d6f',
 'host/c107-experimental-turn.mjs':'1cc601d461800b4dc796bc34078fac6a5074ace7',
 'src/c70-experimental-compute-preview.mjs':'372da2db8c519037b6c8d2e9a349294e6e428aee'
};
test('S02 EDU/v2 migration must not mutate 4 frozen C77/C124/legacy C107 source blobs',()=>{
 for(const [file,blob] of Object.entries(originals)){
  assert.equal(sha(readFileSync(new URL('../'+file,import.meta.url))),blob,file);
  assert.ok(C107_FILES.includes(file));
 }
 assert.equal(C124_OVERLAY_GIT_BLOBS['host/c107-experimental-turn.mjs'],originals['host/c107-experimental-turn.mjs']);
 assert.equal(C124_OVERLAY_GIT_BLOBS['src/c70-experimental-compute-preview.mjs'],originals['src/c70-experimental-compute-preview.mjs']);
});
test('versioned EDU only added explicit modules to the original package',()=>{
 for(const path of ['host/c107-edu-v2-turn.mjs','host/c69-edu-v2-preview.mjs',
 'host/c100-edu-v2-draft.mjs','src/c70-edu-v2-compute-preview.mjs',
 'host/c72-public-mode-admission.mjs','contracts/c72-public-mode-admission-v2.json'])
  assert.ok(C107_FILES.includes(path),path);
 assert.equal(new Set(C107_FILES).size,C107_FILES.length);
});
