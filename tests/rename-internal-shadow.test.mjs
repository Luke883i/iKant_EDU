import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SHADOW_MUTATIONS,SHADOW_TESTS} from '../scripts/rename-internal-shadow.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('shadow source is read-only to main and always denies administrative GO',()=>{
 const s=read('scripts/rename-internal-shadow.mjs');
 assert(s.includes("rename_go:false"));
 assert(s.includes("admin_rename_performed:false"));
 assert(s.includes("owner_invoked:false"));
 assert(s.includes("provider_equivalence_attested:false"));
 assert(s.includes("external_consumers_closed:false"));
 assert(s.includes("git',['worktree','add','--detach'"));
 assert(s.includes("git',['worktree','remove','--force'"));
 assert(!s.includes("'push','origin'"));
 assert(!s.includes("'reset','--hard'"));
});
test('all identity-bearing original boundaries and root generator are targeted',()=>{
 for(const p of ['BOOTSTRAP.json','ADMISSION.json','contracts/orientation-capsule.json',
  'src/first-contact.mjs','src/admission.mjs','src/runtime-root-verified.mjs',
  'host/c72-public-mode-admission.mjs','host/project-c72-coldstart-seed.mjs',
  'project/session-chat/PROMPT.txt','scripts/project-oneshell-source-pin-audit.mjs'])
  assert(SHADOW_MUTATIONS.includes(p),p);
 for(const p of SHADOW_TESTS)assert(fs.existsSync(new URL('../'+p,import.meta.url)));
 const bootstrap=JSON.parse(read('BOOTSTRAP.json'));
 assert.equal(bootstrap.canonical_repository,'Luke883i/iKant_LE');
 assert(bootstrap.post_accept_fastboot.runtime_root.members.some(x=>x.path==='src/first-contact.mjs'));
});
