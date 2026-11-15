import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
/** Measures local real fixture bytes; does NOT call GitHub or measure host latency. */
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const fixture=new URL('../tests/fixtures/c77-historical-head-66f074b3.zip',import.meta.url);
const archive=fs.readFileSync(fixture);
const head='66f074b34f34455b3c4188703d83ad71316baa06';
const start=performance.now();
const read=validateC94C77Archive(archive,{sourceHead:head});
if(read.status!=='C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN')throw Error(read.first_unclosed_edge);
const files=read.manifest.files;
const normalized=files.reduce((n,f)=>n+read.content.get(f.path).length,0);
const receipts=files.map(f=>({path:f.path,bytes:f.bytes,sha256:f.sha256,
 byte_sha256_actual:sha(read.content.get(f.path))}));
if(receipts.some(f=>f.sha256!==f.byte_sha256_actual))throw Error('REAL_MEMBER_SHA_MISMATCH');
const out={schema:'ikant-le-c98-real-fixture-capsule-cost/v1',
 origin:'LOCAL_REAL_HISTORICAL_ACTIONS_ZIP_NOT_CURRENT_HEAD',
 source_head:head,archive_sha256:sha(archive),archive_bytes:archive.length,
 manifest_sha256:read.manifest_sha256,member_count:files.length,
 unique_member_bytes:normalized,
 archive_read_callbacks_if_installed:1,
 member_read_callbacks_if_installed:files.length,
 callback_count_reduction_factor:files.length,
 zip_vs_manifest_member_bytes_ratio:Number((archive.length/normalized).toFixed(4)),
 local_archive_validation_ms:Number((performance.now()-start).toFixed(3)),
 node_to_github_network_attempts_by_this_script:0,
 actual_host_binary_callback_calls:0,
 actual_new_chat_runtime_executions:0,
 host_download_eligibility:'UNATTESTED',native_delivery_attested:false,
 field_h95_attested:false,active:false,
 first_unclosed_edge:'INSTALLED_AUTHORIZED_HOST_ARTIFACT_BYTES_TO_NODE'};
console.log(JSON.stringify(out,null,2));
