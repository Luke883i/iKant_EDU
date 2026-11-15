#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {C107_FILES} from './c107-pack.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const boot=JSON.parse(fs.readFileSync(path.join(root,'BOOTSTRAP.json'),'utf8'));
const roots=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md','stile_comunicativo.md',
 'host/c72-public-mode-admission.mjs','contracts/c72-public-mode-admission-v2.json',
 'host/project-host-negative-rail.mjs','host/project-c72-negative-entry.mjs',
 'contracts/project-host-negative-rail.json','contracts/project-c72-negative-entry.json',
 'host/s02-edu-versioned-consumer.mjs','host/c135-edu-v2-owner.mjs','host/c125-exclusive-shell.mjs',
 'host/project-session-capsule.mjs','host/project-oneshell-edu.mjs','host/project-oneshell-continuous.mjs','host/project-oneshell-focus-session.mjs','host/project-oneshell-chat-presentation.mjs','host/project-oneshell-autopilot.mjs','host/project-c72-preaccept-gate.mjs','host/project-c72-postaccept-reentry.mjs','host/project-c72-host-recovery.mjs','host/project-c72-capability-port.mjs','host/project-c72-physical-ingress.mjs','host/project-c72-e16-unified-ingress.mjs','host/project-c72-coldstart-seed.mjs','host/project-c72-receipt-transit.mjs','host/project-c72-transport-frontier.mjs','scripts/project-c72-partial-source-kit.mjs','scripts/project-c72-verified-staging.mjs','scripts/project-c72-cold-mode-cli.mjs','scripts/project-c72-receipt-reopen-cli.mjs','host/project-oneshell-emission.mjs','host/project-oneshell-compact.mjs','host/project-oneshell-continuity.mjs','host/project-oneshell-visual.mjs','host/project-oneshell-host-boundary.mjs','host/project-oneshell-language-ack.mjs','host/project-oneshell-phases.mjs',
 'host/p1-postmode-source-handoff.mjs','scripts/project-manual-source.py',
 'scripts/project-session.mjs','scripts/project-repo-loader.mjs','scripts/project-c72-portable-cli.mjs','scripts/project-c72-staged-ingress-cli.mjs',
 'contracts/project-session-capsule.json','contracts/project-c72-receipt-transit.json','contracts/project-oneshell-irred-e15.json','contracts/project-host-followthrough.json','contracts/project-host-capability-port.json','contracts/project-oneshell-compact-continuity.json','contracts/project-oneshell-visual-v2.json','contracts/project-oneshell-do-d.json','contracts/project-oneshell-focus-app.json','contracts/project-oneshell-inchat-presentation.json','contracts/project-c72-preaccept-gate.json','contracts/project-oneshell-host-scope.json','contracts/project-oneshell-semantic-slides.json',
 'docs/PROJECT_EDU_E16_UNIFIED_INGRESS.md','docs/PROJECT_SESSION_REPO_FIRST.md','docs/ONESHELL_POSTACCEPT_RAIL_AUDIT_E9.md','docs/ONESHELL_E12_FOCUS_APP_POST182.md',
 'host/project-oneshell-postaccept-rail.mjs','contracts/project-oneshell-cx-humanist.json','docs/EDU_ONEZIP_POSTACCEPT_FIELD_ROUTE.md','contracts/project-edu-onezip-field-route.json',
 'scripts/project-edu-zip-tree.py','scripts/project-edu-onezip-admission.mjs',
 'scripts/project-edu-language-stdio.mjs','scripts/project-edu-onezip-session.mjs','scripts/project-oneshell-continuous-cli.mjs',
 boot.post_accept_fastboot.runtime_root.loader.path,...boot.post_accept_fastboot.remote_paths,
 ...boot.post_accept_fastboot.runtime_root.members.map(x=>x.path),...C107_FILES];
const seen=new Set(),missing=new Set();
function visit(p){
 if(seen.has(p))return;seen.add(p);const f=path.join(root,p);
 if(!fs.existsSync(f)){missing.add(p);return;}
 if(!fs.statSync(f).isFile()){seen.delete(p);return;}
 if(!p.endsWith('.mjs'))return;
 const text=fs.readFileSync(f,'utf8');
 for(const m of text.matchAll(/(?:from\s*|import\s*\(|new URL\s*\()\s*['"]([^'"]+)['"]/g))if(m[1].startsWith('.'))visit(path.posix.normalize(path.posix.join(path.posix.dirname(p),m[1])));
 for(const m of text.matchAll(/['"]((?:contracts|host|src)\/[^'"]+\.(?:json|mjs))['"]/g))if(fs.existsSync(path.join(root,m[1])))visit(m[1]);
 for(const m of text.matchAll(/path\.join\(ROOT,\s*['"]contracts['"],\s*['"]([^'"]+)['"]/g))visit('contracts/'+m[1]);
}
roots.forEach(visit);
if(missing.size){console.error(JSON.stringify({missing:[...missing].sort()}));process.exit(1);}
const result={schema:'ikant-le-project-session-source/v1',authority:0,scope:'REPOSITORY_NAMED_EXECUTION_CLOSURE_NOT_FULL_CHECKOUT',paths:[...seen].filter(x=>x!=='contracts/project-session-source.json').sort(),bundle_required:false};
const target=path.join(root,'contracts/project-session-source.json'),bytes=JSON.stringify(result,null,2)+'\n';
if(process.argv[2]==='verify'){if(fs.readFileSync(target,'utf8')!==bytes)throw Error('PROJECT_SOURCE_MANIFEST_STALE');}
else fs.writeFileSync(target,bytes);
console.log(JSON.stringify({status:'PASS',paths:result.paths.length}));
