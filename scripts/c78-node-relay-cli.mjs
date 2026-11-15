import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {C78HostRelay,c78HostStop} from '../host/c78-host-relay.mjs';
const MAX_INPUT_BYTES=2_500_000;
let relay=null;
try{
 const buf=fs.readFileSync(0);
 if(buf.length>MAX_INPUT_BYTES)throw Error('C78_TRANSFER_OVERSIZE');
 const request=JSON.parse(buf.toString('utf8'));
 if(!request||request.schema!=='ikant-le-c78-opaque-host-transfer/v1'||
    request.authority!==0||!Array.isArray(request.files)||
    request.files.length>50)throw Error('C78_TRANSFER_SCHEMA_INVALID');
 const allowed=['schema','authority','selection','source_head','expected_manifest_sha256',
    'manifest_base64','files','human_input','host_candidate'];
 if(Object.keys(request).some(k=>!allowed.includes(k)))
  throw Error('C78_TRANSFER_UNRECOGNIZED_PROPERTY');
 relay=new C78HostRelay({
  selection:request.selection,sourceHead:request.source_head,
  expectedManifestSha256:request.expected_manifest_sha256,
  manifestBase64:request.manifest_base64
 });
 for(const item of request.files){
  if(!item||Object.keys(item).some(k=>!['filePath','contentBase64','sourceBlobSha1'].includes(k)))
   throw Error('C78_FILE_PACKET_INVALID');
  relay.stageFile(item);
 }
 const receipt=relay.finalize();
 const result=relay.dispatch({humanInput:request.human_input,
   ...(request.host_candidate!==undefined?{hostCandidate:request.host_candidate}:{})});
 process.stdout.write(JSON.stringify({...result,materialization_receipt_sha256:receipt.manifest_sha256,
   materialization_staged_files:receipt.staged_files})+'\n');
 if(result.status!=='C78_NODE_RESPONSE_READY_HOST_DELIVERY_PENDING')process.exitCode=2;
}catch(error){
 process.stdout.write(JSON.stringify(c78HostStop('C78_TRANSFER_OR_EXECUTION',
   error instanceof Error?error.message:String(error)))+'\n');
 process.exitCode=2;
}finally{relay?.close();}
