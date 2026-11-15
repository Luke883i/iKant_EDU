import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const J=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const T=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const H=x=>crypto.createHash('sha256').update(x).digest('hex');
const contract=J('contracts/physical-runtime-closure-v1.json');
const campaign=J('artifacts/qualification/c52-physical-closure-10m.json');
const lattice=J('artifacts/qualification/c52-physical-closure-lattice.json');
const source={physical:T('src/physical-runtime-closure.mjs'),cohost:T('src/cohost-coldstart-qualification.mjs'),native:T('src/native-transcript-participant.mjs'),runtime:T('src/session-local-service.mjs'),c51:T('src/supersystem-runtime-conformance.mjs'),tests:T('tests/c52-physical-runtime-closure.test.mjs'),c51workflow:T('.github/workflows/c51-supersystem-runtime.yml')};
const mechanisms=[...contract.entities.map(x=>x.id),...contract.laws.map(x=>x.id)],expected=['E0','E1','E2','E3','E4','E5','E6','L0','L1','L2','L3','L4'];
const checks={
 ontology_exact:JSON.stringify(mechanisms)===JSON.stringify(expected)&&contract.closure_formula==='E0 & E1 & E2 & E3 & E4 & E5 & E6 & L0 & L1 & L2 & L3 & L4',
 atom_count:campaign.primitive_facts?.length===45,
 bundle_lineage:contract.analysis_bundle_sha256==='3ff0c254600504fe06fba110095b73d1f9967a61534bc83e89c24b3cf7d7a646',
 saturation:campaign.cases===10000000&&campaign.families===64&&campaign.candidate_oracle_mismatches===0&&campaign.unsafe_promotions===0&&campaign.false_rejects===0&&campaign.all_single_deletion_mutants_killed===true&&campaign.status==='PASS',
 lattice:lattice.architecture_count===4096&&lattice.valid_architectures===1&&lattice.minimum_cost===12&&lattice.minimum_count===1&&lattice.unique_minimum===true&&Object.values(lattice.deletion_mutants||{}).every(x=>x.mismatch>0),
 e0_fix:source.c51.includes("hostBootstrapBindingReceipt?.result_class==='OWNER_NEXT'?'CONFORMANT':'INTEGRATION_IMPEDIMENT'"),
 e1_runtime:source.runtime.includes('RUNTIME_EXECUTION_RECEIPT_SCHEMA')&&source.runtime.includes('issueRuntimeExecutionReceipt')&&source.runtime.includes('owner_executed:true'),
 e2_attestation:source.physical.includes('COHOST_RELATION_ATTESTATION_SCHEMA')&&source.physical.includes('issueCohostRelationAttestation')&&source.physical.includes('raw_status_is_proof:false'),
 e3_runtime_guard:source.runtime.includes('HOST_ROUTE_INTERPOSITION_RECEIPT_SCHEMA')&&source.runtime.includes('runPhysicalClosureLimitedTurn')&&source.runtime.includes('physical route blocked:'),
 e4_lease:source.native.includes('validateNativeParticipantLease')&&source.native.includes("scheduler!=='PERSISTENT'"),
 e5_grant:source.physical.includes("NATIVE_TURN_GRANT_SCHEMA='ikant-native-turn-grant/v1'")&&source.physical.includes('validateNativeTurnGrantReceipt'),
 e6_delivery:source.physical.includes("NATIVE_DELIVERY_READBACK_SCHEMA=NATIVE_DELIVERY_RECEIPT_SCHEMA")&&source.physical.includes('validateNativeDeliveryReceipt')&&!source.physical.includes("NATIVE_DELIVERY_READBACK_SCHEMA='ikant-native-delivery-readback/v2'")&&source.physical.includes('turn_grant_receipt_sha256')&&source.physical.includes('runtime_turn_receipt_sha256'),
 l0_no_raw_status:source.physical.includes('cohostEvidence=null')&&!source.physical.includes('cohostStatus=null')&&!source.physical.includes('nativeStatus=null'),
 l1_cross_binding:source.physical.includes('validateCrossBinding')&&source.physical.includes('runtime_instance')&&source.physical.includes('grant_ref')&&source.physical.includes('runtime_output'),
 l2_fail_closed:source.physical.includes("state:'INTEGRATION_IMPEDIMENT'")&&source.physical.includes("state:'NOT_READY'")&&source.physical.includes("state:'SESSION_ROUTE_BLOCKED'")&&source.physical.includes("state:'COHOST_RELATION_ONLY'")&&source.physical.includes("state:'NATIVE_TRANSCRIPT_ACTOR_E2E'"),
 l3_surrogate:contract.laws.some(x=>x.id==='L3'&&x.name==='SurrogateRejection'),
 l4_orthogonal:source.physical.includes('full_runtime_required:false')&&source.physical.includes('control_ownership_required:false')&&source.physical.includes('canonical_product_required:false')&&source.physical.includes('legacy_active_required:false'),
 persistence:source.physical.includes('validatePhysicalClosurePersistenceWitness')&&source.tests.includes('persistence witness requires same lease and a fresh later grant/delivery'),
 c51_ci_clean:source.c51workflow.includes('contents: read')&&!source.c51workflow.includes('git push'),
 tests:source.tests.includes('blocks bypass before executing the turn')&&source.tests.includes('closes E0-E6 only from underlying proof receipts')&&source.tests.includes('valid INTEGRATION_IMPEDIMENT receipt laundering')
};
const missing=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
const body={schema:'ikant-le-c52-analysis-bundle-coverage/v1',analysis_bundle_sha256:contract.analysis_bundle_sha256,mechanisms:expected,checks,covered:Object.values(checks).filter(Boolean).length,total:Object.keys(checks).length,missing,status:missing.length?'FAIL':'PASS',authority:0};
const out={...body,receipt_sha256:H(Buffer.from(JSON.stringify(body)))};
const outPath=process.argv[2]||'artifacts/qualification/c52-bundle-coverage.json';fs.writeFileSync(path.join(ROOT,outPath),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));if(missing.length)process.exit(1);
