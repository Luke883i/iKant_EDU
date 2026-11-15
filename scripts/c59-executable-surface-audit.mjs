import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const R=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/session-chat-executable-surface-registry.json'),'utf8'));
const B=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8'));
const C=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/session-chat-composition-channel.json'),'utf8'));
const activationRe=/(I ACCEPT|['"]ACTIVE['"]|RUNTIME_BOUND_LIMITED|HANDOFF_PRE_RUNTIME|LOCAL_DIRECT|VERIFIED_OPAQUE_RELAY|WARM_CACHE_EXACT|runCommand\s*\(|resumeActivation\s*\(|executePreRuntimeBootstrap\s*\(|executeCanonicalSessionChatBootstrap\s*\(|acceptDeployedSession\s*\(|acceptLocalLimitedSession\s*\(|issueCanonicalSessionChatComposition\s*\(|runCanonicalSessionChat\s*\(|materializeRuntimeRoot\s*\()/;

function walk(dir){
 const out=[];
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,ent.name);
  if(ent.isDirectory())out.push(...walk(p));
  else if(ent.isFile()&&p.endsWith('.mjs'))out.push(path.relative(ROOT,p).replaceAll('\\','/'));
 }
 return out;
}
const production=[...walk(path.join(ROOT,'src')),'ikant.mjs','scripts/session-chat-runtime-cli.mjs','plugins/ikant-le-session-chat/server/server.mjs'].sort();
const errors=[];
const experimental=R.discovery?.excluded_experimental_non_activation_files||[];
const exceptions=new Set(experimental);
if(exceptions.size!==experimental.length)errors.push('experimental_exclusion_duplicate');
for(const p of exceptions){
  if(!production.includes(p)) {errors.push('experimental_exclusion_not_in_production:'+p);continue;}
  const code=fs.readFileSync(path.join(ROOT,p),'utf8');
  // These are bounded host-owned computation/draft lanes. They cannot call the
  // canonical issuer or pretend to possess its native event or writer.
  if(!code.includes('active:false')||!code.includes('canonical_runtime:false')||
     !code.includes('owner_receipt_issued:false')||
     /(?:runCanonicalSessionChat|canonicalActiveReadback|issueCanonicalSessionChatComposition)\s*\(/.test(code))
    errors.push('experimental_exclusion_authority:'+p);
}
const discovered=production.filter(p=>!exceptions.has(p)&&activationRe.test(fs.readFileSync(path.join(ROOT,p),'utf8'))).sort();
const declared=[...(R.discovery?.activation_related_files||[])].sort();
if(JSON.stringify(discovered)!==JSON.stringify(declared))errors.push('activation_related_file_set');
if(C.qualification?.executable_activation_related_files!==discovered.length)errors.push('composition_registry_count_mismatch');
const issuers=(R.surfaces||[]).filter(x=>x.may_issue_canonical_active===true);const materializer=(R.surfaces||[]).find(x=>x.id==='PRE_RUNTIME_MATERIALIZER');
if(issuers.length!==1||issuers[0]?.ref!=='src/runtime-command.mjs#runCanonicalSessionChat')errors.push('canonical_issuer');if(materializer?.ref!=='src/runtime-root-verified.mjs#executeCanonicalSessionChatBootstrap'||materializer?.classification!=='CANONICAL_INTERNAL_EDGE')errors.push('canonical_materializer_registry');
const src=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const runtime=src('src/runtime-command.mjs'),semantic=src('src/bootstrap-semantic.mjs'),pre=src('src/runtime-root-verified.mjs'),entry=src('src/local-host-meta-prompt.mjs'),cli=src('ikant.mjs'),deployed=src('src/session-chat-deployment.mjs');
if(!semantic.includes("export function validateCanonicalCompositionHandoff")||!semantic.includes("CANONICAL_COMPOSITION_AUTHORITY='C59_CANONICAL'"))errors.push('shared_runtime_predicate');
if(!runtime.includes('export function runCanonicalSessionChat')||!runtime.includes('export function canonicalActiveReadback'))errors.push('canonical_runtime_entry');
if(!runtime.includes("Canonical SESSION_CHAT_LOCAL runtime route rejected legacy ACTIVE state."))errors.push('canonical_surface_legacy_fence');
if(!runtime.includes("Legacy activation resume is compatibility-only"))errors.push('resume_compatibility_fence');
if(!runtime.includes("postAcceptBootstrapEvidence?.compatibility_only!==true"))errors.push('raw_activation_compatibility_fence');
if(!pre.includes('export async function executeCanonicalSessionChatBootstrap')||!pre.includes("mod.runCanonicalSessionChat('I ACCEPT'"))errors.push('pre_runtime_to_runtime_edge');if(!pre.includes('export async function executeCanonicalColdBootstrap')||!pre.includes('export function issueCanonicalActivationExecutor')||!pre.includes('export function issueCanonicalRelayManifest'))errors.push('cold_producer_edge');const coldOwner=(R.surfaces||[]).find(x=>x.id==='C59_COMPOSITION_OWNER');if(coldOwner?.ref!=='src/runtime-root-verified.mjs#executeCanonicalColdBootstrap')errors.push('cold_producer_registry');
// C136 is a pre-runtime byte-recovery surface, not a second C59 ACTIVE issuer.
const c136Rows=(R.surfaces||[]).filter(x=>x.id==='C136_MANUAL_RECOVERY');
const c136Code=src('src/c136-canonical-recovery.mjs');
if(c136Rows.length!==1||
   c136Rows[0]?.ref!=='src/c136-canonical-recovery.mjs#materializeC136ManualCarrier'||
   c136Rows[0]?.classification!=='CANONICAL_PRE_RUNTIME_BYTE_ADAPTER'||
   c136Rows[0]?.may_issue_canonical_active!==false||
   !c136Code.includes('original_c59_handoff_authority_granted:false')||
   !c136Code.includes('canonical_active:false')||
   /export\s+(?:async\s+)?function\s+(?:runCanonicalSessionChat|canonicalActiveReadback|issueCanonicalSessionChatComposition)\b/.test(c136Code))
  errors.push('c136_byte_recovery_noncanonical_boundary');
if(!entry.includes('issueCanonicalCompositionHandoff(direct.handoff)')||!entry.includes('legacy_handoff:legacyHandoff'))errors.push('caller_owner_edge');
if(!cli.includes('--canonical-composition-handoff-file')||!cli.includes('--compatibility-activation'))errors.push('cli_fence');
if(!deployed.includes("composition_authority:'LEGACY_COMPATIBILITY',canonical_session_chat_local:false"))errors.push('deployed_legacy_label');
const members=new Set(B.post_accept_fastboot?.runtime_root?.members?.map(x=>x.path)||[]);
for(const p of ['src/bootstrap-semantic.mjs','src/runtime-command.mjs','src/runtime.mjs','src/state.mjs'])if(!members.has(p))errors.push('runtime_root_member:'+p);
const material={schema:'ikant-le-c59-executable-surface-audit/v1',production_files:production.length,activation_related_files:discovered.length,activation_related_file_set:discovered,canonical_active_issuer_count:issuers.length,canonical_active_issuer:issuers[0]?.ref||null,runtime_root_enforcement_members:['src/bootstrap-semantic.mjs','src/runtime-command.mjs','src/runtime.mjs','src/state.mjs'],errors,status:errors.length?'FAIL':'PASS'};
const receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(material)).digest('hex');
console.log(JSON.stringify({...material,receipt_sha256},null,2));
if(errors.length)process.exitCode=1;
