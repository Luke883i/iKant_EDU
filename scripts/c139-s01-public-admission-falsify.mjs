/** Deterministic 1m policy lattice; NOT a million runtime executions.
 * 20-bit unique indices; compare separate strict oracle, reject missing evidence.
 */
const N=1_000_000, MASK=(1<<20)-1;
const bit=(i,n)=>Boolean((i>>n)&1);
let strictEd=0,strictCanon=0,naiveFalse=0,mismatches=0,unsafe=0;
for(let z=0;z<N;z++){
 // Permuted index (odd multiplier modulo 2^20) => one million unique vectors.
 const i=(z*1664525+1013904223)&MASK;
 const [source,offer,terms,accept,orientation,selection,edu,canon,producer,node,nonce,writer,reopen,mcp,auth,nativeEvent,delivery,docx,owner,notReplay]=
  Array.from({length:20},(_,n)=>bit(i,n));
 const publicReady=source&&offer&&terms&&accept&&orientation&&selection;
 const eduReady=publicReady&&edu&&producer&&node&&nonce&&writer&&reopen&&notReplay;
 const canonicalReady=publicReady&&canon&&mcp&&auth&&nativeEvent&&writer&&reopen&&delivery&&docx&&owner&&notReplay;
 const oracleEdu=[0,1,2,3,4,5,6,8,9,10,11,12,19].every(n=>bit(i,n));
 const oracleCanonical=[0,1,2,3,4,5,7,11,12,13,14,15,16,17,18,19].every(n=>bit(i,n));
 if(eduReady!==oracleEdu||canonicalReady!==oracleCanonical)mismatches++;
 if(eduReady)strictEd++;if(canonicalReady)strictCanon++;
 const naive=(edu||canon)&&selection&&(mcp||node);
 if(naive&&!eduReady&&!canonicalReady)naiveFalse++;
 if((!nativeEvent||!auth||!mcp||!owner||!docx||!delivery)&&canonicalReady)unsafe++;
}
const out={schema:'ikant-le-s01-policy-falsification/v1',cases:N,unique_inputs:N,
 modelling:'20-bit deterministic policy vectors; not real host/Node execution',
 strict_edu_ready:strictEd,strict_canonical_ready:strictCanon,
 naive_false_positive:naiveFalse,oracle_mismatches:mismatches,unsafe_canonical_promotions:unsafe};
console.log(JSON.stringify(out));
if(mismatches||unsafe||!naiveFalse)process.exitCode=1;
