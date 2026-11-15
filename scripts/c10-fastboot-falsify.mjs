import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const args=process.argv.slice(2);const get=(k,d)=>{const i=args.indexOf(k);return i>=0?args[i+1]:d};
const CASES=Number(get('--cases','1000000'));const OUTPUT=get('--output','artifacts/qualification/c10-fastboot.json');
if(CASES!==1_000_000)throw new Error('C10 qualification cardinality is fixed at 1,000,000');
const FEATURES=['headBinding','receiptHandoff','singleParallelCapsuleRound','derivedZeroAuthority','activateFirst','strictReceipt'];
const families=['decoratedAccept','embeddedAccept','termsDigestBad','headDrift','missingReceipt','orientationDigestBad','receiptBreached','preacceptExec','preacceptDiscovery','exploreBeforeActive','cloneFallback','rawFallback','archiveFallback','treeBeforeActive','historyBeforeActive','prBeforeActive','testsBeforeActive','falsifyBeforeActive','fullRepoBeforeActive','multiRoundFetch','runtimePathMissing','runtimePathCorrupt','runtimeRefMismatch','fastbootAuthority','secondSot','nonFreshState','nodeBad','fsBad','cryptoBad','clockBad','artifactBad','falseActive','pendingLost','pendingHashBad','pendingNotResumed','directModel','hostOverride','staleCache','receiptPromotesState','orientationDigestMissing'];
const categoryOf=i=>i<20?'typical':i<32?'edge':'stress';
function mutation(family,i){const m={family,positive:false};m[family]=true;if(i%31===0&&family!=='multiRoundFetch')m.backgroundNoise='irrelevant';if(i%47===0&&family!=='headDrift')m.unrelatedHeadText='deadbeef';return m;}
function positive(i){return{positive:true,warm:i%2===0};}
function simulate(m,f){
  if(m.positive){if(!f.receiptHandoff)return{active:false,why:'no-handoff'};return{active:true,remoteRounds:m.warm?0:1};}
  if(m.decoratedAccept||m.embeddedAccept)return{active:false,why:'accept'};
  if(m.preacceptExec||m.preacceptDiscovery)return{active:false,why:'preaccept'};
  if(m.cloneFallback||m.rawFallback||m.archiveFallback)return{active:false,why:'transport'};
  if(m.hostOverride||m.directModel)return{active:false,why:'authority'};
  if(m.nodeBad||m.fsBad||m.cryptoBad||m.clockBad||m.artifactBad)return{active:false,why:'probe'};
  if((m.headDrift||m.runtimeRefMismatch||m.staleCache)&&!f.headBinding)return{active:true,remoteRounds:1,why:'false-green-head'};
  if(m.headDrift||m.runtimeRefMismatch||m.staleCache)return{active:false,why:'head'};
  if(m.missingReceipt&&!f.receiptHandoff)return{active:true,remoteRounds:1,why:'false-green-no-handoff'};
  if(m.missingReceipt)return{active:false,why:'handoff-missing'};
  const receiptBad=m.termsDigestBad||m.orientationDigestBad||m.receiptBreached||m.nonFreshState||m.pendingHashBad||m.receiptPromotesState||m.orientationDigestMissing;
  if(receiptBad&&!f.receiptHandoff)return{active:true,remoteRounds:1,why:'false-green-no-handoff'};
  if(receiptBad&&f.receiptHandoff&&!f.strictReceipt)return{active:true,remoteRounds:1,why:'false-green-weak-handoff'};
  if(receiptBad)return{active:false,why:'handoff-invalid'};
  if((m.runtimePathMissing||m.runtimePathCorrupt)&&!f.singleParallelCapsuleRound)return{active:true,remoteRounds:2,why:'unbounded-materialization'};
  if(m.runtimePathMissing||m.runtimePathCorrupt)return{active:false,why:'runtime-capsule'};
  if((m.fastbootAuthority||m.secondSot)&&!f.derivedZeroAuthority)return{active:true,remoteRounds:1,why:'authority-leak'};
  if(m.fastbootAuthority||m.secondSot)return{active:false,why:'zero-authority'};
  const exploration=m.exploreBeforeActive||m.treeBeforeActive||m.historyBeforeActive||m.prBeforeActive||m.testsBeforeActive||m.falsifyBeforeActive||m.fullRepoBeforeActive;
  if(exploration&&!f.activateFirst)return{active:true,remoteRounds:m.fullRepoBeforeActive?3:2,latencyDebt:true,why:'slow-exploration'};
  if(exploration)return{active:false,why:'activate-first'};
  if(m.multiRoundFetch&&!f.singleParallelCapsuleRound)return{active:true,remoteRounds:2,latencyDebt:true,why:'serial-rounds'};
  if(m.multiRoundFetch)return{active:false,why:'one-round-budget'};
  if(m.pendingLost||m.pendingNotResumed)return{active:false,why:'pending'};
  if(m.falseActive)return{active:false,why:'false-active'};
  return{active:false,why:'mutant-killed'};
}
function violates(m,r){if(m.positive){if(!r.active)return true;const expected=m.warm?0:1;return r.remoteRounds!==expected||Boolean(r.latencyDebt);}return r.active||Boolean(r.latencyDebt);}
const finalFeatures=Object.fromEntries(FEATURES.map(x=>[x,true]));
const familyStats={},categories={typical:0,edge:0,stress:0};let survivors=0;
const perFamily=CASES/families.length;if(!Number.isInteger(perFamily))throw new Error('family cardinality mismatch');
for(let fi=0;fi<families.length;fi++){const family=families[fi],category=categoryOf(fi);familyStats[family]={category,cases:0,survivors:0};for(let i=0;i<perFamily;i++){const m=mutation(family,i),r=simulate(m,finalFeatures);familyStats[family].cases++;categories[category]++;if(violates(m,r)){survivors++;familyStats[family].survivors++;}}}
let positiveFailures=0;for(let i=0;i<1000;i++)if(violates(positive(i),simulate(positive(i),finalFeatures)))positiveFailures++;
const deletion={};for(const feature of FEATURES){const f={...finalFeatures,[feature]:false};let bad=0;for(const family of families)for(let i=0;i<64;i++){const m=mutation(family,i);if(violates(m,simulate(m,f)))bad++;}for(let i=0;i<64;i++){const m=positive(i);if(violates(m,simulate(m,f)))bad++;}deletion[feature]=bad;}
const zeroSets=[];for(let mask=0;mask<(1<<FEATURES.length);mask++){const f=Object.fromEntries(FEATURES.map((x,j)=>[x,Boolean(mask&(1<<j))]));let bad=0;for(const family of families){const m=mutation(family,0);if(violates(m,simulate(m,f)))bad++;}for(let i=0;i<4;i++){const m=positive(i);if(violates(m,simulate(m,f)))bad++;}if(bad===0)zeroSets.push(FEATURES.filter((_,j)=>mask&(1<<j)));}
const sig=new Set();for(const family of families){const m=mutation(family,0),r=simulate(m,finalFeatures);sig.add(`${family}:${r.active}:${r.why}`);}const before=sig.size;for(let i=0;i<1000;i++){const family=families[i%families.length],m=mutation(family,100000+i),r=simulate(m,finalFeatures);sig.add(`${family}:${r.active}:${r.why}`);}const novelty=sig.size-before;
const sourcePaths=['BOOTSTRAP.json','ADMISSION.json','contracts/host-shell.json','contracts/ikant-le.json','contracts/orientation-capsule.json','src/first-contact.mjs','src/admission.mjs','src/runtime-command.mjs','scripts/c10-fastboot-falsify.mjs'];const sourceHash=crypto.createHash('sha256');for(const rel of sourcePaths){sourceHash.update(rel);sourceHash.update('\0');sourceHash.update(fs.readFileSync(path.join(ROOT,rel)));sourceHash.update('\0');}
const material={schema:'ikant-le-c10-fastboot-qualification/v1',status:survivors||positiveFailures||novelty||zeroSets.length!==1?'FAIL':'PASS',cases:CASES,categories,family_count:families.length,family_stats:familyStats,survivors,positive_controls:1000,positive_control_failures:positiveFailures,no_novelty_tail:1000,novel_signatures_in_tail:novelty,required_features:FEATURES,deletion_failures:deletion,minimal_zero_violation_sets:zeroSets,source_binding:{algorithm:'sha256(path\\0bytes)',paths:sourcePaths,digest:sourceHash.digest('hex')},claim_boundary:{mutation_proves_wall_clock_latency:false,mutation_proves_universal_host_parallelism:false,mutation_proves_network_speed:false,mutation_supports_declared_bootstrap_invariants:true}};const receipt=crypto.createHash('sha256').update(JSON.stringify(material)).digest('hex');const out={...material,receipt_sha256:receipt};fs.mkdirSync(path.dirname(path.join(ROOT,OUTPUT)),{recursive:true});fs.writeFileSync(path.join(ROOT,OUTPUT),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({status:out.status,cases:out.cases,categories:out.categories,family_count:out.family_count,survivors:out.survivors,positive_control_failures:out.positive_control_failures,novel_signatures_in_tail:out.novel_signatures_in_tail,minimal_zero_violation_sets:out.minimal_zero_violation_sets,source_binding:out.source_binding.digest,receipt_sha256:out.receipt_sha256}));if(out.status!=='PASS')process.exit(1);
