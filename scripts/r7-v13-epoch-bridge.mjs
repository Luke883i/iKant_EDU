/** R7 V13: exact source-epoch bridge, read-only. No authority or release approval. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const HISTORIC='c9a1179283958a7ffb30d1ad8c08af69d34fff0c';
export const V11='30b8021e1f6659acd79cc96d3bc106a1742697e4';
const TREE='9b6b80d7fe2f8536b9ce8633e09810fc87b81c28';
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8',timeout:30000}).trim();
const clean=p=>typeof p==='string'&&p.length>0&&!p.startsWith('/')&&!p.includes('\\')&&
 p.split('/').every(x=>x!==''&&x!=='.'&&x!=='..');
const NO=edge=>Object.freeze({ok:false,edge,authority:0,product_go:false});
export function mapR7SourcePath(oldPath,plan){
 if(!clean(oldPath))return null;
 const p=plan;
 if(p?.schema!=='ikant-r7-v11-seven-root-contract/v1'||
  p.v10_parent!==HISTORIC||p.v10_tree!==TREE||p.product_go!==false)return null;
 const first=oldPath.split('/')[0];
 const current=Object.hasOwn(p.moved_root_files||{},oldPath)?p.moved_root_files[oldPath]:
  Object.hasOwn(p.moved_roots||{},first)?p.moved_roots[first]+oldPath.slice(first.length):oldPath;
 return clean(current)?current:null;
}
/** A blob identity and a renamed path are different propositions. */
export function reopenR7SourceEpoch(oldPath,{newPath=null}={}){
 try{
  if(!clean(oldPath))return NO('UNSAFE_HISTORICAL_PATH');
  const p=JSON.parse(git('show',V11+':contracts/r7-v11-seven-root-contract.json'));
  const actual=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/r7-v11-seven-root-contract.json'),'utf8'));
  if(JSON.stringify(p)!==JSON.stringify(actual)||git('rev-parse',HISTORIC+'^{tree}')!==TREE||
     git('merge-base','--is-ancestor',V11,'HEAD')!=='' /* returns empty on success */)
   return NO('EPOCH_LINEAGE_INVALID');
  const expected=mapR7SourcePath(oldPath,p);
  if(!expected||newPath!==null&&newPath!==expected)return NO('PATH_MAPPING_MISMATCH');
  let historic,current;
  try{historic=git('rev-parse',HISTORIC+':'+oldPath);}catch{return NO('HISTORIC_BLOB_NOT_PRESENT');}
  try{current=git('rev-parse','HEAD:'+expected);}catch{return NO('CURRENT_MAPPED_BLOB_MISSING');}
  if(!/^[a-f0-9]{40}$/.test(historic)||!/^[a-f0-9]{40}$/.test(current))return NO('GIT_BLOB_SHA_INVALID');
  if(git('cat-file','-t',historic)!=='blob'||git('cat-file','-t',current)!=='blob')return NO('NOT_GIT_BLOBS');
  return Object.freeze({ok:true,old_path:oldPath,current_path:expected,historical_blob:historic,
   candidate_blob:current,byte_identical:historic===current,
   status:historic===current?'MOVED_OR_UNCHANGED_BYTE_EXACT':'PROSPECTIVE_CHANGED_SOURCE_REVIEW_REQUIRED',
   approval:'NOT_ATTESTED',native_equivalence:'NOT_ATTESTED',authority:0,product_go:false});
 }catch{return NO('EPOCH_GIT_SOURCE_UNREADABLE');}
}
