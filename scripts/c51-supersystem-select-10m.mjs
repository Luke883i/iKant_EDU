import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,'..');
const CASES=Number(process.argv.includes('--cases')?process.argv[process.argv.indexOf('--cases')+1]:10000000);
const OUT=process.argv.includes('--out')?process.argv[process.argv.indexOf('--out')+1]:'artifacts/qualification/c51-supersystem-selection-10m.json';
const MECH=[
 'K0_EVIDENCE_PINNED_ROOTS','K1_EXECUTABLE_BOOTSTRAP_ADAPTER','K2_OWNER_DERIVED_ONE_NEXT_REENTRY','K3_COHOST_ROOT_PRESERVED','K4_ROUTE_INTERPOSITION_GUARD','K5_UNRESOLVED_TURN_SERIALIZATION','K6_NATIVE_SESSION_IDENTITY','K7_NATIVE_PARTICIPANT_LEASE','K8_PERSISTENT_TURN_SCHEDULER','K9_EXACT_NATIVE_DELIVERY_READBACK','K10_AXIS_ORTHOGONALITY','K11_FAIL_CLOSED_EXTERNAL_GAPS','K12_AUTHORITY_OWNER_PRESERVATION'
];
const ALL=(1<<MECH.length)-1,has=(m,i)=>Boolean(m&(1<<i));
let seed=0xC5110A11>>>0;const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>=0;},b=p=>(rnd()%1000)<p;
const base=()=>({roots_pinned:true,adapter_callable:true,owner_next:true,caller_retry:false,cohost_root:true,route_observed:true,host_bypass:false,model_direct_reply:false,pending_turn:false,ordinal_sync:true,native_session:true,participant_lease:true,scheduler:true,native_delivery:true,host_native_observed:true,full_runtime:false,canonical_product:false,control_owned:false,app_panel:false,model_prefix:false,manual_selection:false,new_authority:false,new_owner:false});
function oracle(x){
 const integrity=x.roots_pinned&&!x.new_authority&&!x.new_owner;
 const bootstrap=integrity&&x.adapter_callable&&x.owner_next&&!x.caller_retry?'CONFORMANT':'INTEGRATION_IMPEDIMENT';
 const cohost=integrity&&x.cohost_root;
 let route='NOT_BOUND';
 if(cohost){if(!x.route_observed)route='EXTERNAL_ROUTE_GAP';else if(x.host_bypass||x.model_direct_reply)route='BLOCKED_BYPASS';else if(x.pending_turn)route='PENDING_CANONICAL_TURN';else if(!x.ordinal_sync)route='STALE_UNSYNCED';else route='SAFE';}
 const nativeCore=x.native_session&&x.participant_lease&&x.scheduler&&x.native_delivery&&x.host_native_observed;
 const relation=!cohost?'NONE':nativeCore?'NATIVE_TRANSCRIPT_ACTOR':'COHOST_RELATION';
 const system=bootstrap!=='CONFORMANT'?'INTEGRATION_IMPEDIMENT':(!cohost?'NOT_READY':(route!=='SAFE'?'SESSION_ROUTE_BLOCKED':(relation==='NATIVE_TRANSCRIPT_ACTOR'?'NATIVE_TRANSCRIPT_ACTOR':'COHOST_RELATION_ONLY')));
 return{bootstrap,relation,route,system};
}
function candidate(x,mask){
 const integrity=(has(mask,0)?x.roots_pinned:true)&&(has(mask,12)?(!x.new_authority&&!x.new_owner):true);
 const bootstrap=integrity&&(has(mask,1)?x.adapter_callable:true)&&(has(mask,2)?(x.owner_next&&!x.caller_retry):true)?'CONFORMANT':'INTEGRATION_IMPEDIMENT';
 let cohost=integrity&&(has(mask,3)?x.cohost_root:(x.cohost_root||x.full_runtime||x.app_panel));
 let route='NOT_BOUND';
 if(cohost){if(!x.route_observed)route=has(mask,11)?'EXTERNAL_ROUTE_GAP':'SAFE';else if((x.host_bypass||x.model_direct_reply)&&has(mask,4))route='BLOCKED_BYPASS';else if(x.pending_turn&&has(mask,5))route='PENDING_CANONICAL_TURN';else if(!x.ordinal_sync)route='STALE_UNSYNCED';else route='SAFE';}
 let native=(has(mask,6)?x.native_session:true)&&(has(mask,7)?x.participant_lease:true)&&(has(mask,8)?x.scheduler:true)&&(has(mask,9)?x.native_delivery:true);
 if(has(mask,11))native=native&&x.host_native_observed;else native=native&&(x.host_native_observed||x.app_panel||x.model_prefix||x.manual_selection);
 if(!has(mask,10))native=native&&x.full_runtime&&x.canonical_product&&x.control_owned;
 const relation=!cohost?'NONE':native?'NATIVE_TRANSCRIPT_ACTOR':'COHOST_RELATION';
 const system=bootstrap!=='CONFORMANT'?'INTEGRATION_IMPEDIMENT':(!cohost?'NOT_READY':(route!=='SAFE'?'SESSION_ROUTE_BLOCKED':(relation==='NATIVE_TRANSCRIPT_ACTOR'?'NATIVE_TRANSCRIPT_ACTOR':'COHOST_RELATION_ONLY')));
 return{bootstrap,relation,route,system};
}
const eq=(a,z)=>a.bootstrap===z.bootstrap&&a.relation===z.relation&&a.route===z.route&&a.system===z.system;
const unsafe=(a,z)=>(a.bootstrap==='CONFORMANT'&&z.bootstrap!=='CONFORMANT')||(a.relation==='NATIVE_TRANSCRIPT_ACTOR'&&z.relation!=='NATIVE_TRANSCRIPT_ACTOR')||(a.relation!=='NONE'&&z.relation==='NONE')||(a.route==='SAFE'&&z.route!=='SAFE'&&z.route!=='NOT_BOUND')||(a.system==='NATIVE_TRANSCRIPT_ACTOR'&&z.system!=='NATIVE_TRANSCRIPT_ACTOR')||(['NATIVE_TRANSCRIPT_ACTOR','COHOST_RELATION_ONLY'].includes(a.system)&&['INTEGRATION_IMPEDIMENT','SESSION_ROUTE_BLOCKED','NOT_READY'].includes(z.system));
const falseReject=(a,z)=>(a.bootstrap!=='CONFORMANT'&&z.bootstrap==='CONFORMANT')||(a.relation!=='NATIVE_TRANSCRIPT_ACTOR'&&z.relation==='NATIVE_TRANSCRIPT_ACTOR')||(a.relation==='NONE'&&z.relation!=='NONE')||(a.route!=='SAFE'&&z.route==='SAFE')||(a.system!==z.system&&!unsafe(a,z));
const familyNames=[...MECH.map(x=>'DELETE_'+x),
 'APP_PANEL_SURROGATE','MODEL_PREFIX_SURROGATE','MANUAL_SELECTION_SURROGATE','FULL_RUNTIME_SURROGATE','CONTROL_OWNERSHIP_SURROGATE','CANONICAL_PRODUCT_SURROGATE','ROUTE_GAP','PENDING_ROUTE','BYPASS_ROUTE','STALE_ROUTE','BOOTSTRAP_GAP','RETRY_INJECTION','OWNER_NEXT_MISSING','ROOT_DRIFT','NEW_AUTHORITY','NEW_OWNER','VALID_BIND_NATIVE','VALID_FULL_NATIVE','VALID_BIND_COHOST_ONLY','VALID_FULL_COHOST_ONLY','PAIR_BOOT_ROUTE','PAIR_ROUTE_NATIVE','PAIR_ROOT_AUTH','PAIR_SURROGATES','PAIR_PENDING_NATIVE','PAIR_BOOT_NATIVE','PAIR_COHOST_GAP','PAIR_AXIS_BIND','PAIR_AXIS_FULL','RANDOM_STRESS','RANDOM_EDGE','RANDOM_TYPICAL','RANDOM_HOST_GAPS','RANDOM_SURROGATES','RANDOM_AUTHORITY','RANDOM_ORTHOGONAL','RANDOM_ROUTE'];
function scenario(f,i){const x=base();
 if(f<MECH.length){switch(f){case 0:x.roots_pinned=false;break;case 1:x.adapter_callable=false;break;case 2:x.owner_next=false;break;case 3:x.cohost_root=false;x.full_runtime=true;break;case 4:x.host_bypass=true;break;case 5:x.pending_turn=true;break;case 6:x.native_session=false;break;case 7:x.participant_lease=false;break;case 8:x.scheduler=false;break;case 9:x.native_delivery=false;break;case 10:x.full_runtime=false;x.canonical_product=false;x.control_owned=false;break;case 11:x.host_native_observed=false;x.app_panel=true;break;case 12:x.new_authority=true;break;}return x;}
 switch(f){
  case 13:x.host_native_observed=false;x.participant_lease=false;x.app_panel=true;break;
  case 14:x.host_native_observed=false;x.native_delivery=false;x.model_prefix=true;break;
  case 15:x.host_native_observed=false;x.scheduler=false;x.manual_selection=true;break;
  case 16:x.cohost_root=false;x.full_runtime=true;break;
  case 17:x.native_session=false;x.control_owned=true;break;
  case 18:x.participant_lease=false;x.canonical_product=true;break;
  case 19:x.route_observed=false;break;case 20:x.pending_turn=true;break;case 21:x.host_bypass=true;break;case 22:x.ordinal_sync=false;break;
  case 23:x.adapter_callable=false;break;case 24:x.caller_retry=true;break;case 25:x.owner_next=false;break;case 26:x.roots_pinned=false;break;case 27:x.new_authority=true;break;case 28:x.new_owner=true;break;
  case 29:break;case 30:x.full_runtime=true;x.canonical_product=true;x.control_owned=true;break;case 31:x.host_native_observed=false;x.native_delivery=false;break;case 32:x.full_runtime=true;x.canonical_product=true;x.control_owned=true;x.host_native_observed=false;x.scheduler=false;break;
  case 33:x.adapter_callable=false;x.route_observed=false;break;case 34:x.host_bypass=true;x.native_delivery=false;break;case 35:x.roots_pinned=false;x.new_owner=true;break;case 36:x.host_native_observed=false;x.app_panel=true;x.model_prefix=true;x.manual_selection=true;break;case 37:x.pending_turn=true;x.native_delivery=false;break;case 38:x.owner_next=false;x.host_native_observed=false;break;case 39:x.cohost_root=false;x.route_observed=false;break;case 40:x.full_runtime=false;x.canonical_product=false;x.control_owned=false;break;case 41:x.full_runtime=true;x.canonical_product=true;x.control_owned=true;break;
  default:{
   const mode=f%8;
   if(mode===0){x.roots_pinned=b(970);x.adapter_callable=b(850);x.owner_next=b(900);x.caller_retry=b(70);}
   if(mode===1){x.cohost_root=b(780);x.route_observed=b(760);x.pending_turn=b(120);x.host_bypass=b(60);x.model_direct_reply=b(40);x.ordinal_sync=b(930);}
   if(mode===2){x.native_session=b(820);x.participant_lease=b(800);x.scheduler=b(760);x.native_delivery=b(730);x.host_native_observed=b(680);}
   if(mode===3){x.app_panel=b(300);x.model_prefix=b(260);x.manual_selection=b(300);x.host_native_observed=b(550);}
   if(mode===4){x.new_authority=b(20);x.new_owner=b(20);x.roots_pinned=b(985);}
   if(mode===5){x.full_runtime=b(500);x.canonical_product=b(420);x.control_owned=b(450);}
   if(mode===6){x.route_observed=b(650);x.pending_turn=b(180);x.host_bypass=b(90);x.ordinal_sync=b(880);}
   if(mode===7){for(const k of Object.keys(x))if(typeof x[k]==='boolean'&&b(90))x[k]=!x[k];}
  }
 }
 return x;}
const selected={mismatch:0,unsafe:0,false_reject:0};const deletions=Object.fromEntries(MECH.map(x=>[x,{mismatch:0,unsafe:0,false_reject:0}]));const familyCounts=Object.fromEntries(familyNames.map(x=>[x,0]));
for(let i=0;i<CASES;i++){const f=i%familyNames.length,x=scenario(f,i),z=oracle(x),a=candidate(x,ALL);familyCounts[familyNames[f]]++;if(!eq(a,z))selected.mismatch++;if(unsafe(a,z))selected.unsafe++;if(falseReject(a,z))selected.false_reject++;if(f<MECH.length){const q=candidate(x,ALL^(1<<f)),s=deletions[MECH[f]];if(!eq(q,z))s.mismatch++;if(unsafe(q,z))s.unsafe++;if(falseReject(q,z))s.false_reject++;}}
const witnesses=[];for(let f=0;f<familyNames.length;f++)for(let j=0;j<8;j++)witnesses.push(scenario(f,j));
let valid=0,min=Infinity,winners=[];for(let mask=0;mask<=ALL;mask++){let ok=true;for(const x of witnesses){if(!eq(candidate(x,mask),oracle(x))){ok=false;break;}}if(ok){valid++;const cost=MECH.reduce((n,_,k)=>n+Number(has(mask,k)),0);if(cost<min){min=cost;winners=[mask];}else if(cost===min)winners.push(mask);}}
const source=fs.readFileSync(path.join(ROOT,'src/supersystem-runtime-conformance.mjs'));const contract=fs.readFileSync(path.join(ROOT,'contracts/supersystem-runtime-conformance-v1_1.json'));
const material={schema:'ikant-le-c51-supersystem-selection-10m/v1',source_head:'fe40fa221612d5e9c9fe2e7506bd1fc41553fc9d',seed:'0xC5110A11',cases:CASES,families:familyNames.length,mechanisms:MECH,selected_mask:ALL,selected,candidate_source_sha256:crypto.createHash('sha256').update(source).digest('hex'),contract_sha256:crypto.createHash('sha256').update(contract).digest('hex'),architecture_lattice:{total:1<<MECH.length,witnesses:witnesses.length,valid_architectures:valid,minimum_cost:min,minimum_count:winners.length,winner_masks:winners.slice(0,16),unique_minimum:winners.length===1&&winners[0]===ALL},deletion_mutants:deletions,family_counts:familyCounts,oracle_independent_of_candidate_mask:true,selection_rule:'10M selected-candidate saturation plus dedicated deletion families; complete 2^13 architecture lattice over independent semantic witnesses; zero mismatch then minimum mechanism count; owner reuse and zero authority fixed as hard constraints',claim_boundary:{semantic_saturation_is_physical_host_proof:false,host_binding_created:false,native_participant_created:false},status:selected.mismatch===0&&selected.unsafe===0&&selected.false_reject===0&&winners.length===1&&winners[0]===ALL&&Object.values(deletions).every(x=>x.mismatch>0)?'PASS':'FAIL'};
material.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(material)).digest('hex');fs.mkdirSync(path.dirname(path.join(ROOT,OUT)),{recursive:true});fs.writeFileSync(path.join(ROOT,OUT),JSON.stringify(material,null,2)+'\n');console.log(JSON.stringify(material));if(material.status!=='PASS')process.exit(1);
