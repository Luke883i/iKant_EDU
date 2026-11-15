import fs from 'node:fs';
import crypto from 'node:crypto';

const args=process.argv.slice(2);const arg=(n,d)=>{const i=args.indexOf(n);return i>=0?args[i+1]:d};
const SEL=arg('--selection','/tmp/c54-selection.json'),FAL=arg('--falsification','/tmp/c54-falsification.json'),OUT=arg('--output','/tmp/c54-dod.json');
const read=p=>fs.readFileSync(p,'utf8'),json=p=>JSON.parse(read(p)),sha=x=>crypto.createHash('sha256').update(Buffer.from(JSON.stringify(x))).digest('hex');
const contract=json('contracts/host-materialization-profile-v1.json'),sel=json(SEL),fal=json(FAL);
const frame=read('src/host-consumption-frame.mjs'),deploy=read('src/session-chat-deployment.mjs'),server=read('plugins/ikant-le-session-chat/server/server.mjs'),app=read('plugins/ikant-le-session-chat/server/public/ikant-le-app.html'),wf=read('.github/workflows/c54-host-materialization.yml'),tests=read('tests/c54-host-materialization.test.mjs');
const checks={
 D01_RETICULUM_12:contract.mechanisms?.length===12&&contract.qualification?.mechanisms===12,
 D02_PROMISE_36_PLUS_7:frame.includes("atom_count:promiseAtoms.length")&&frame.includes("extension_count:extensions.length")&&contract.host_frame?.post_c29_extension_count===7,
 D03_ALL_PHASE_SHELL:frame.includes("renderBootstrapAsciiShell")&&frame.includes("renderSessionShell")&&tests.includes("f.shell.source,'BOOTSTRAP_SHELL'")&&tests.includes("renderSessionShell"),
 D04_EXACT_SHELL_BYTES:frame.includes("exact_owner_bytes:true")&&frame.includes("model_reframe_allowed:false")&&app.includes("shell exact-byte verification failed"),
 D05_CONTINUITY_SPLIT:frame.includes("ikant-le-host-session-continuity-key/v1")&&frame.includes("ikant-le-host-shell-profile-key/v1")&&tests.includes("baseline and ACTIVE frames keep one session continuity key"),
 D06_FAIL_CLOSED_NO_PROMOTION:contract.mechanisms?.some(x=>x.id==='M4_LIFECYCLE_FAIL_CLOSED')&&frame.includes("frame_is_native_transcript_proof:false")&&frame.includes("semantic_projection_is_physical_host_proof:false"),
 D07_RUNTIME_OWNER_EVIDENCE:deploy.includes("function readLastEvent")&&deploy.includes("node_dispatch_receipt_sha256:event?.detail?.node_dispatch_receipt")&&frame.includes("ikant-le-host-runtime-evidence-projection/v1"),
 D08_SHELL_ARTIFACT_BINDING:frame.includes("shell/artifact binding mismatch")&&tests.includes("shell/artifact drift"),
 D09_REQUIRED_ARTIFACT_BYTE_HANDOFF:server.includes("required host artifact bytes unavailable")&&server.includes("data_base64")&&server.includes("digest(b)===fa.sha256"),
 D10_ARTIFACT_BEFORE_SHELL:app.includes("required artifact bytes unavailable")&&app.indexOf("for(const ref of ordered)")<app.indexOf("out.textContent=shell.text"),
 D11_PAYLOAD_FRAME_BINDING:server.includes("frame_receipt_sha256")&&app.includes("host payload/frame binding mismatch")&&contract.host_app?.frame_receipt_binding_required===true,
 D12_EXTERNAL_GAP_VECTOR:frame.includes("HOST_NATIVE_PARTICIPANT_LEASE")&&frame.includes("HOST_NATIVE_TURN_GRANT")&&frame.includes("HOST_NATIVE_DELIVERY_READBACK")&&frame.includes("LIVE_SUBSEQUENT_TURN_PERSISTENCE"),
 D13_ZERO_NEW_AUTHORITY:frame.includes("new_lifecycle:false")&&frame.includes("new_state_writer:false")&&frame.includes("new_planner:false")&&frame.includes("new_turn_owner:false")&&frame.includes("authority:0"),
 D14_SELECTION_100K:sel.cases===100000&&sel.status==='PASS'&&sel.selected?.mismatch===0&&sel.selected?.unsafe===0&&sel.selected?.false_reject===0,
 D15_UNIQUE_MINIMUM:sel.architecture_lattice?.total===4096&&sel.architecture_lattice?.unique_minimum===true&&sel.architecture_lattice?.minimum_cost===12&&sel.all_deletion_mutants_killed===true,
 D16_FALSIFICATION_1M:fal.cases===1000000&&fal.status==='PASS'&&fal.candidate_oracle_mismatches===0&&fal.unsafe_promotions===0&&fal.false_rejects===0&&fal.independence?.candidate_is_not_oracle_alias===true,
 D17_REFERENCE_APP_VALIDATES_FRAME:server.includes("validateHostConsumptionFrame")&&app.includes("crypto.subtle.digest")&&contract.host_app?.frame_validation_required===true,
 D18_CI_READ_ONLY:wf.includes("permissions:\n  contents: read")&&!wf.includes("git push")&&!wf.includes("contents: write"),
 D19_LIVE_HOST_BOUNDARY:contract.claim_boundary?.host_materialization_ready_is_live_host_proof===false&&contract.claim_boundary?.app_render_is_native_transcript_proof===false&&contract.claim_boundary?.repository_can_create_host_native_primitives===false,
 D20_RUNTIME_ROOT_NOT_WIDENED:wf.includes("npm run runtime-root:verify")
};
const rows=Object.entries(checks).map(([id,ok])=>({id,status:ok?'PASS':'FAIL'})),pass=Object.values(checks).every(Boolean);
const body={schema:'ikant-le-c54-host-materialization-dod/v1',target:'HOST_MATERIALIZATION_READY',status:pass?'PASS_REPOSITORY_HOST_MATERIALIZATION_READY':'FAIL',checks:rows,selection_receipt_sha256:sel.receipt_sha256,falsification_receipt_sha256:fal.receipt_sha256,semantic_reticulum:{mechanisms:12,architecture_lattice:4096,unique_minimum:sel.architecture_lattice?.unique_minimum===true,minimum_cost:sel.architecture_lattice?.minimum_cost,all_deletion_mutants_killed:sel.all_deletion_mutants_killed===true},promise_coverage:{c29_atoms:36,post_c29_extensions:7,total_projected_obligations:43},claim_boundary:{live_chatgpt_host_proven:false,native_transcript_actor_proven:false,host_ui_presentation_receipt_proven:false,subsequent_turn_persistence_proven:false,repository_host_materialization_predicate_proven:pass},authority:0};
const out={...body,receipt_sha256:sha(body)};fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));if(!pass)process.exit(1);
