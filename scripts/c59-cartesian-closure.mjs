import fs from 'node:fs';
const S=JSON.parse(fs.readFileSync('contracts/bootstrap-composition-space.json','utf8'));
const names=Object.keys(S.axes);
const target=S.canonical_normalized_vector;
const values=names.map(n=>S.axes[n]);
const total=values.reduce((n,a)=>n*a.length,1);
const canonicalKey=JSON.stringify(target);
let rawCanonical=0,rejected=0,excludedAccepted=0;
const normalizedClasses=new Set(),acceptedVectors=[];
const axisUnsafe=Object.fromEntries(names.map(n=>[n,0]));

function walk(i,raw,norm,excludedAxes){
 if(i===names.length){
  const key=JSON.stringify(norm);
  const accepted=key===canonicalKey;
  if(accepted){
   rawCanonical++;
   normalizedClasses.add(key);
   if(acceptedVectors.length<32)acceptedVectors.push({...raw});
   if(excludedAxes.length)excludedAccepted++;
  }else rejected++;
  for(const axis of excludedAxes)axisUnsafe[axis]++;
  return;
 }
 const name=names[i];
 for(const row of values[i]){
  raw[name]=row.id;
  norm[name]=row.normalize;
  const ex=row.normalize==='EXCLUDED';
  walk(i+1,raw,norm,ex?[...excludedAxes,name]:excludedAxes);
 }
}
walk(0,{}, {}, []);

const aliasAxes={};
for(const name of names){
 const rows=S.axes[name];
 const groups={};
 for(const r of rows)if(r.normalize!=='EXCLUDED'){(groups[r.normalize]??=[]).push(r.id);}
 aliasAxes[name]=groups;
}
const expectedRaw=Object.entries(target).reduce((n,[axis,val])=>n*(aliasAxes[axis]?.[val]?.length||0),1);
const exclusionMutants=[];
for(const name of names){
 const canonicalVal=target[name];
 for(const row of S.axes[name].filter(r=>r.normalize==='EXCLUDED')){
  const otherAxesProduct=names.filter(x=>x!==name).reduce((n,axis)=>n*(aliasAxes[axis]?.[target[axis]]?.length||0),1);
  exclusionMutants.push({axis:name,value:row.id,unsafe_if_widened:otherAxesProduct,killed:otherAxesProduct>0});
 }
}
const out={
 schema:'ikant-le-c59-cartesian-closure/v1',
 axes:names.length,
 axis_cardinality:Object.fromEntries(names.map(n=>[n,S.axes[n].length])),
 raw_vectors:total,
 raw_canonical_alias_vectors:rawCanonical,
 expected_raw_alias_vectors:expectedRaw,
 normalized_canonical_classes:normalizedClasses.size,
 rejected_vectors:rejected,
 excluded_value_accepted:excludedAccepted,
 exclusion_mutants:exclusionMutants.length,
 all_exclusion_mutants_killed:exclusionMutants.every(x=>x.killed),
 exclusion_mutant_sample:exclusionMutants,
 canonical_alias_vectors:acceptedVectors,
 canonical_normalized_vector:target,
 status:rawCanonical===expectedRaw&&normalizedClasses.size===1&&rejected===total-rawCanonical&&excludedAccepted===0&&exclusionMutants.every(x=>x.killed)?'PASS':'FAIL'
};
console.log(JSON.stringify(out,null,2));
if(out.status!=='PASS')process.exitCode=1;
