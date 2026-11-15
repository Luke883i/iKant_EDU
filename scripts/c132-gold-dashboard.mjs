/** Multi-denominator gold census: inventory != semantic review != quality. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
export function goldC132Snapshot({treePaths,curated}={}){
 const all=treePaths||execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
 const gold=curated||load('contracts/v1-gold-ownership.json').gold;
 const set=new Set(all),curatedPaths=new Set(gold.map(x=>x.path));
 if(set.size!==all.length||curatedPaths.size!==gold.length)throw Error('duplicate path');
 const missing=gold.filter(x=>!set.has(x.path)).map(x=>x.path);
 const decisions={};for(const x of gold)decisions[x.decision]=(decisions[x.decision]||0)+1;
 const denominator={
  tracked_git_files:all.length,
  inventoriable_files:all.length,
  explicitly_curated_components:gold.length,
  uncurated_files:all.length-gold.length,
  mapped_gold_pct:Number((100*gold.length/all.length).toFixed(2))
 };
 return {schema:'ikant-c132-gold-multilayer/v1',status:missing.length?'FAIL':'PASS',
  denominator,missing_curated_paths:missing,dispositions:decisions,
  layers:{historical_trace:'GIT_REACHABLE',file_inventory:'TRACKED_ONLY',
   owner_qualification:'CURATED_PATH_LIST_ONLY',runtime_integration:'NOT_INFERRED',
   cognitive_gain:'NOT_INFERRED',native_attestation:'NOT_INFERRED',
   release:'SEPARATE_RECEIPT_REQUIRED'},
  no_semantic_loss_claim:'ALL_PATHS_PRESERVED_BUT_UNREVIEWED_ARE_NOT_CERTIFIED'};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(goldC132Snapshot()));
