/** Source-bound C142 trace. It does NOT convert 34 proof references into 34 fixes. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const gitBlobHash=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
export function qualifyC142(candidate=null){
 const c=candidate??JSON.parse(fs.readFileSync(path.join(root,'contracts/c142-34issue-evidence.json'),'utf8'));
 const p=JSON.parse(fs.readFileSync(path.join(root,c.original_c141_qualification_file),'utf8'));
 const atomBytes=fs.readFileSync(path.join(root,c.original_atoms_file));
 const atom=JSON.parse(atomBytes);
 const expected=new Set([...p.issue_coverage.fixed_bounded_tested,...p.issue_coverage.mitigated_not_closed,...p.issue_coverage.baseline_preserved_not_newly_fixed]);
 const excluded=new Set(p.issue_coverage.requires_external_proof);
 const refs=c.evidence_refs,ids=Object.keys(refs),violations=[];
 if(c.schema!=='ikant-le-c142-34issue-source-trace/v2') violations.push('INVALID_CONTRACT');
 if(gitBlobHash(atomBytes)!==c.original_atoms_git_blob_sha1)violations.push('C141_ATOM_DRIFT');
 if(atom.atoms.length!==48||new Set(atom.atoms.map(x=>x.id)).size!==48)violations.push('ATOM_SET_DRIFT');
 for(const id of ids){
  if(!expected.has(id))violations.push('DUPLICATE_OR_UNKNOWN:'+id);
  const value=refs[id];
  if(!Array.isArray(value)||value.length!==3){violations.push('INVALID_REFERENCE:'+id);continue}
  const [file,anchor,proofKind]=value;
  const f=typeof file==='string'?path.resolve(root,file):'';
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.readFileSync(f,'utf8').includes(anchor)) violations.push('SOURCE_REF_MISSING:'+id);
  if(!['EXPLICIT_NEGATIVE_OR_RUNTIME_PROBE','INDIRECT_BASELINE_OR_HOST_GUARD'].includes(proofKind)) violations.push('INVALID_PROOF_KIND:'+id);
 }
 if(ids.length!==34||ids.some(id=>excluded.has(id))||[...expected].some(id=>!Object.hasOwn(refs,id)))violations.push('NOT_34_EXACT');
 for(const [field,target] of [['fix_bounded',p.issue_coverage.fixed_bounded_tested],['mitigated_open',p.issue_coverage.mitigated_not_closed],['baseline_retained',p.issue_coverage.baseline_preserved_not_newly_fixed],['excluded_external',p.issue_coverage.requires_external_proof]])
  if(!Array.isArray(c[field])||c[field].length!==target.length||new Set(c[field]).size!==target.length||c[field].some(id=>!target.includes(id)))violations.push('FALSE_FIX_OR_CATEGORY:'+field);
 if(c.source_epoch.runtime_admission_carried_over!==false||c.product_go!==false||c.native_chat_persistence!==false)violations.push('FAKE_AUTHORITY');
 return Object.freeze({schema:'ikant-c142-34-issue-audit/v2',status:violations.length?'DENIED':'SOURCE_TRACE_COVERED_NOT_ISSUE_CLOSED',
  scoped:ids.length,source_anchors_found:ids.length-violations.filter(x=>x.startsWith('SOURCE_REF_MISSING:')).length,
  fixed_bounded:c.fix_bounded.length,mitigated_open:c.mitigated_open.length,baseline_retained:c.baseline_retained.length,external_excluded:c.excluded_external.length,
  violations,active:false,native_event_attested:false,universal_semantics_attested:false});
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const x=qualifyC142();process.stdout.write(JSON.stringify(x)+'\n');if(x.violations.length)process.exitCode=1;
}
