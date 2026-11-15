#!/usr/bin/env node
/** Rename S01-S03 immutable source-plane readback. Software proof only, never admin GO. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const v=JSON.parse(read('contracts/repository-rename-s01-s03-dod.json'));
const b=JSON.parse(read('BOOTSTRAP.json'));
const a=JSON.parse(read('ADMISSION.json'));
const o=JSON.parse(read('contracts/orientation-capsule.json'));
const tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const checks=[
 ['SOURCE_NAME_OLD',b.canonical_repository===v.old_repository],
 ['ADMISSION_MATCHES',a.repository===b.canonical_repository],
 ['ORIENTATION_MATCHES',o.canonical_repository==='https://github.com/'+b.canonical_repository],
 ['C72_SOURCE_BINDING',read('host/c72-public-mode-admission.mjs').includes('c72LinkedTermsURL(sourceHead)')],
 ['REENTRY_OWNER_LINKED',read('host/project-c72-postaccept-reentry.mjs').includes('c72LinkedTermsURL(sourceHead)')],
 ['PREACCEPT_GATE_BOUND',read('host/project-c72-preaccept-gate.mjs').includes('c72SourceRepository()')],
 ['PROMPT_MAIN_DYNAMIC',read('scripts/build-project-oneshell-prompt.mjs').includes("promptRepository+'/git/ref/heads/main'")],
 ['SOURCE_AUDIT_OLD',read('scripts/project-oneshell-source-pin-audit.mjs').includes("rename.repo_name_from")],
 ['ROOT_MIGRATION_STILL_OPEN',v.s01.open.some(x=>x.edge==='S01_FIRST_CONTACT_RUNTIME_ROOT_FROZEN')],
 ['EXTERNAL_IS_OPEN',v.s03.rename_gate==='BLOCKED'&&v.s03.external_owner_closure==='UNKNOWN'],
 ['HUMAN_OWNER_NOT_CLAIMED',v.owner_event_invoked===false],
 ['NO_ADMIN_EFFECT',v.admin_rename_performed===false]
];
const errors=checks.filter(([n,ok])=>!ok).map(([n])=>n);
const report={schema:'ikant-rename-s01-s03-source-readback/v1',head,tree,
 checks:checks.map(([name,ok])=>({name,pass:ok})),errors,
 s01:'PARTIAL_PREPARE_ONLY',s02:'CI_TESTS_SEPARATE',s03:'EXTERNAL_CLOSURE_OPEN',
 first_unclosed_edge:'S01_COLDSEED_PREACCEPT_WITNESS_OLD_LITERAL',
 rename_ready:false,owner_invoked:false,product_active:false,
 classification:errors.length?'INVALID_SOURCE_PREPARATION':'PREPARATION_VERIFIED_NO_GO'};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(errors.length)process.exitCode=1;
