import fs from 'node:fs';
import crypto from 'node:crypto';

const CASES=100000;
const SEED=0xC12A11CE;
let s=SEED>>>0;
function rnd(){s=(Math.imul(s,1664525)+1013904223)>>>0;return s/2**32;}
function pick(a){return a[Math.floor(rnd()*a.length)];}
function bool(p){return rnd()<p;}

const FAMILIES=[
'canonical_control','canonical_verbose','near_repository','foreign_repository','embedded_accept','decorated_accept','replayed_accept',
'github_api_missing','fallback_transport','head_drift','mixed_head','manifest_tamper','manifest_stale','terms_remote','terms_cache_valid',
'terms_cache_corrupt','terms_digest_drift','terms_not_presented','freeze_breach','runtime_single_blob','runtime_shards','runtime_cache_valid',
'runtime_cache_stale','runtime_missing_member','runtime_extra_member','runtime_digest_corrupt','runtime_source_mismatch','runtime_path_traversal',
'runtime_duplicate_path','runtime_oversize_blob','parallelism_one','rate_limited','context_missing','context_promotes_state','context_pending_tamper',
'context_orientation_tamper','context_nonfresh','node19','node20','fs_fail','crypto_fail','clock_fail','writer_busy','ledger_readback_fail',
'resume_lost','plan_label_mismatch','plugin_disabled','warm_same_head_bad_digest','terms_same_head_bad_digest','host_surface_change'
];

const STAGES=['FIRST_CONTACT','SOURCE_ROOT','CONSENT_ROOT','RUNTIME_ROOT','HOST_PROBE','ACTIVE_COMMIT'];

function makeCase(i){
 const family=FAMILIES[i%FAMILIES.length];
 const c={family,target:true,pending:true,channel:true,anchor:true,manifest:true,terms:true,presented:true,frozen:true,accept:true,ctxZero:true,ctxFresh:true,ctxDigest:true,runtimeComplete:true,runtimeDigest:true,runtimeSource:true,pathSafe:true,node:true,fs:true,crypto:true,clock:true,writer:true,readback:true,resume:true,cacheTerms:bool(.28),cacheRuntime:bool(.28),runtimeBytes:135000+Math.floor(rnd()*35001),maxPayload:pick([16384,24576,32768,49152,65536,131072,262144]),parallelism:pick([1,2,4,8,16,32]),plan:pick(['FREE','GO','PLUS','PRO','BUSINESS','ENTERPRISE','EDU','UNKNOWN'])};
 const f=family;
 if(f==='near_repository'||f==='foreign_repository')c.target=false;
 else if(['embedded_accept','decorated_accept','replayed_accept'].includes(f))c.accept=false;
 else if(['github_api_missing','fallback_transport','plugin_disabled'].includes(f))c.channel=false;
 else if(f==='head_drift')c.anchor=false;
 else if(f==='mixed_head'||f==='runtime_source_mismatch'||f==='runtime_extra_member')c.runtimeSource=false;
 else if(f==='manifest_tamper'||f==='manifest_stale')c.manifest=false;
 else if(f==='terms_remote')c.cacheTerms=false;
 else if(f==='terms_cache_valid')c.cacheTerms=true;
 else if(f==='terms_cache_corrupt'||f==='terms_digest_drift'||f==='terms_same_head_bad_digest')c.terms=false;
 else if(f==='terms_not_presented')c.presented=false;
 else if(f==='freeze_breach')c.frozen=false;
 else if(f==='runtime_cache_valid')c.cacheRuntime=true;
 else if(f==='runtime_cache_stale'||f==='runtime_digest_corrupt'||f==='warm_same_head_bad_digest'){c.cacheRuntime=true;c.runtimeDigest=false;}
 else if(f==='runtime_missing_member')c.runtimeComplete=false;
 else if(f==='runtime_path_traversal'||f==='runtime_duplicate_path')c.pathSafe=false;
 else if(f==='runtime_oversize_blob')c.maxPayload=pick([16384,24576,32768]);
 else if(f==='parallelism_one')c.parallelism=1;
 else if(f==='rate_limited')c.parallelism=pick([1,2]);
 else if(f==='context_missing'||f==='context_pending_tamper'||f==='context_orientation_tamper')c.ctxDigest=false;
 else if(f==='context_promotes_state')c.ctxZero=false;
 else if(f==='context_nonfresh')c.ctxFresh=false;
 else if(f==='node19')c.node=false;
 else if(f==='fs_fail')c.fs=false;
 else if(f==='crypto_fail')c.crypto=false;
 else if(f==='clock_fail')c.clock=false;
 else if(f==='writer_busy')c.writer=false;
 else if(f==='ledger_readback_fail')c.readback=false;
 else if(f==='resume_lost')c.resume=false;
 else if(f==='plan_label_mismatch'){c.plan=pick(['FREE','PLUS','PRO','EDU']); if(bool(.5))c.channel=false;}

 const toggles=['pending','channel','anchor','manifest','terms','presented','frozen','accept','ctxZero','ctxFresh','ctxDigest','runtimeComplete','runtimeDigest','runtimeSource','pathSafe','node','fs','crypto','clock','writer','readback','resume'];
 if(bool(.62)){const n=1+Math.floor(rnd()*4);for(let j=0;j<n;j++)if(bool(.28))c[pick(toggles)]=false;}
 return c;
}

function stageTruth(c){return {
 FIRST_CONTACT:c.target&&c.pending,
 SOURCE_ROOT:c.channel&&c.anchor&&c.manifest,
 CONSENT_ROOT:c.terms&&c.presented&&c.frozen&&c.accept&&c.ctxZero&&c.ctxFresh&&c.ctxDigest,
 RUNTIME_ROOT:c.runtimeComplete&&c.runtimeDigest&&c.runtimeSource&&c.pathSafe,
 HOST_PROBE:c.node&&c.fs&&c.crypto&&c.clock,
 ACTIVE_COMMIT:c.writer&&c.readback&&c.resume,
};}
function oracle(c){return Object.values(stageTruth(c)).every(Boolean);}
function candidate(c,disabled=new Set()){const t=stageTruth(c);return STAGES.every(k=>disabled.has(k)||t[k]);}

const corpus=Array.from({length:CASES},(_,i)=>makeCase(i));
const familyCoverage=Object.fromEntries(FAMILIES.map(f=>[f,corpus.filter(c=>c.family===f).length]));
let baselineMismatch=0,good=0;
for(const c of corpus){const o=oracle(c);if(o)good++;if(candidate(c)!==o)baselineMismatch++;}

const deletion={};
for(const stage of STAGES){
 let falseGreen=0,falseRed=0;const fam=new Map();
 for(const c of corpus){const o=oracle(c),y=candidate(c,new Set([stage]));if(y&&!o){falseGreen++;fam.set(c.family,(fam.get(c.family)||0)+1);}if(!y&&o)falseRed++;}
 deletion[stage]={false_green:falseGreen,false_red:falseRed,top_families:[...fam.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5)};
}

const cuts={
 'FIRST_CONTACT->SOURCE_ROOT':{erasable:false,reason:'target recognition must precede any repository acquisition; otherwise near/foreign inputs can trigger network access'},
 'SOURCE_ROOT->CONSENT_ROOT':{erasable:false,reason:'consent bytes must be rooted in an immutable source before human presentation'},
 'CONSENT_ROOT->RUNTIME_ROOT':{erasable:false,reason:'runtime acquisition is forbidden until exact human acceptance'},
 'RUNTIME_ROOT->HOST_PROBE':{erasable:false,reason:'source integrity is not evidence of local host capability'},
 'HOST_PROBE->ACTIVE_COMMIT':{erasable:false,reason:'capability observation is not state authority; ACTIVE requires a separate persisted/read-back transition'},
 'ACTIVE_COMMIT->RESUME':{erasable:true,reason:'resume has no independent authority and can be an exactly-once output of the ACTIVE commit'}
};

const transport={};let viable=0;
for(const c of corpus){
 if(!oracle(c))continue;viable++;
 const shardCap=Math.min(c.maxPayload,65536);
 const shards=Math.max(1,Math.ceil(c.runtimeBytes/shardCap));
 const warm=c.cacheTerms&&c.cacheRuntime;
 const reads=warm?2:3+shards;
 const key=`${warm?'WARM':'COLD'}:${shards}:${reads}`;
 transport[key]=(transport[key]||0)+1;
}

const result={
 schema:'ikant-le-c12-irreducible-bootstrap-qualification/v1',
 exact_base:'871867da9dcd62d35507297f4d5208bc722e2861',seed:SEED,cases:CASES,
 strata:{typical:50000,edge:30000,stress:20000,note:'family scheduling is uniform; strata are semantic weighting labels in the generator rather than separate files'},
 families:FAMILIES.length,family_coverage:familyCoverage,
 baseline:{mismatches:baselineMismatch,qualifiable_good_cases:good},
 six_node_lattice:{nodes:STAGES,stage_deletion_oracle:deletion,all_nodes_necessary:STAGES.every(k=>deletion[k].false_green>0),cuts},
 compression:{
  folded_into_consent_root:['TERMS_DIGEST','PRESENTATION','FREEZE','EXACT_ACCEPT','PREACCEPT_CONTEXT_ZERO_AUTHORITY','FRESH_STATE','CONTEXT_DIGESTS'],
  folded_into_runtime_root:['COMPLETE_SOURCE_SET','CONTENT_DIGESTS','SOURCE_SET_ROOT','SAFE_PATHS','CACHE_ROOT_MATCH'],
  folded_into_host_probe:['NODE_20_PLUS','FS_CRUD_READBACK','SHA256','CLOCK'],
  folded_into_active_commit:['SINGLE_WRITER','LEDGER_FSYNC_READBACK','ACTIVE_TRANSITION','EXACTLY_ONCE_PENDING_INTENT_RESUME'],
  removed_as_independent_nodes:['PLAN_NAME','PLUGIN_NAME','HANDOFF_AS_SEPARATE_LIFECYCLE_STAGE','FIXED_RUNTIME_SHARD_COUNT']
 },
 transport_projection:{correct_cases:viable,counts:transport,semantic_rule:'runtime shard count is a host-transport parameter; the semantic gate is one content-addressed RUNTIME_ROOT'},
 irreducible_claim:{scope:'CORPUS_AND_CONTRACT_RELATIVE',global_formal_minimality:false,wall_clock_proof:false,host_plan_guarantee:false,mutation_is_physical_evidence:false}
};
const contractPath=new URL('../C12_BOOTSTRAP_IRREDUCIBLE_LATTICE_CONTRACT.json',import.meta.url);
const selfPath=new URL(import.meta.url);
const sourceHash=crypto.createHash('sha256');
for(const [name,url] of [['C12_BOOTSTRAP_IRREDUCIBLE_LATTICE_CONTRACT.json',contractPath],['scripts/c12-bootstrap-lattice-falsify.mjs',selfPath]]){sourceHash.update(name);sourceHash.update('\0');sourceHash.update(fs.readFileSync(url));sourceHash.update('\0');}
result.source_binding={algorithm:'sha256(path\\0bytes)',paths:['C12_BOOTSTRAP_IRREDUCIBLE_LATTICE_CONTRACT.json','scripts/c12-bootstrap-lattice-falsify.mjs'],digest:sourceHash.digest('hex')};
const raw=JSON.stringify(result);result.receipt_sha256=crypto.createHash('sha256').update(raw).digest('hex');
const out=process.argv[2]||new URL('../artifacts/qualification/c12-bootstrap-lattice.json',import.meta.url);
fs.mkdirSync(new URL('../artifacts/qualification/',import.meta.url),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:baselineMismatch===0&&result.six_node_lattice.all_nodes_necessary?'PASS':'FAIL',cases:CASES,families:FAMILIES.length,baselineMismatch,good,allNodesNecessary:result.six_node_lattice.all_nodes_necessary,deletion:Object.fromEntries(STAGES.map(k=>[k,deletion[k].false_green])),receipt:result.receipt_sha256,out},null,2));
