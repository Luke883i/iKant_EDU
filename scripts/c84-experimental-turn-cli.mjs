import fs from 'node:fs';
import crypto from 'node:crypto';
import {executeC84ExperimentalTurn} from '../host/c84-experimental-transport.mjs';

const MAX_STDIN=10_000_000,MAX_FILES_PER_PROVIDER=50;
const stop=edge=>({schema:'ikant-le-c84-experimental-turn/v1',status:'C84_STOP',
 first_unclosed_edge:edge,authority:0,active:false,canonical_runtime:false,
 persistent:false,source_origin_attested:false,native_event_attested:false,
 native_chat_delivery_attested:false,owner_receipt_issued:false});
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).sort().join(',')===keys.slice().sort().join(',');
function unpackSinglePackage(q){
 if(!exact(q,['schema','selection','humanInput','packageBase64','expectedPackageSha256'])||
  typeof q.packageBase64!=='string'||q.packageBase64.length>9_000_000||
  q.packageBase64.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(q.packageBase64)||
  !/^[a-f0-9]{64}$/.test(String(q.expectedPackageSha256)))
  throw Error('C84_PACKAGE_TURN_ENVELOPE');
 const raw=Buffer.from(q.packageBase64,'base64');
 if(raw.toString('base64')!==q.packageBase64||
  crypto.createHash('sha256').update(raw).digest('hex')!==q.expectedPackageSha256)
  throw Error('C84_PACKAGE_SHA256_MISMATCH');
 const p=JSON.parse(raw.toString('utf8'));
 if(!exact(p,['schema','sourceHead','expectedManifestSha256','manifestBase64',
   'sourceProof','files','active','source_origin_attested',
   'native_chat_delivery_attested','authority'])||
  p.schema!=='ikant-le-c84-single-source-package/v1'||
  p.active!==false||p.source_origin_attested!==false||
  p.native_chat_delivery_attested!==false||p.authority!==0||
  !Array.isArray(p.files)||p.files.length<20||p.files.length>50)
  throw Error('C84_PACKAGE_SOURCE_ENVELOPE');
 return {schema:'ikant-le-c84-host-transferred-turn/v1',selection:q.selection,
  humanInput:q.humanInput,sourceHead:p.sourceHead,
  expectedManifestSha256:p.expectedManifestSha256,
  manifestBase64:p.manifestBase64,sourceProof:p.sourceProof,
  carriers:[{name:'SINGLE_C84_PACKAGE',files:p.files}]};
}
function decodeEnvelope(raw){
 if(raw.length>MAX_STDIN)throw Error('C84_CLI_STDIN_LIMIT');
 let q=JSON.parse(raw.toString('utf8'));
 if(q?.schema==='ikant-le-c84-single-package-turn/v1')q=unpackSinglePackage(q);
 const required=['schema','selection','sourceHead','expectedManifestSha256',
  'manifestBase64','sourceProof','carriers','humanInput'];
 const optional=['parallelism','carrierTimeoutMs'];
 if(!q||typeof q!=='object'||Array.isArray(q)||
  required.some(k=>!Object.hasOwn(q,k))||
  Object.keys(q).some(k=>![...required,...optional].includes(k))||
  q.schema!=='ikant-le-c84-host-transferred-turn/v1'||
  !Array.isArray(q.carriers)||!q.carriers.length||q.carriers.length>6)
  throw Error('C84_CLI_ENVELOPE');
 const names=new Set();
 const carriers=q.carriers.map(item=>{
  if(!exact(item,['name','files'])||typeof item.name!=='string'||
   !/^[A-Z0-9_]{2,48}$/.test(item.name)||names.has(item.name)||
   !Array.isArray(item.files)||item.files.length>MAX_FILES_PER_PROVIDER)
   throw Error('C84_CLI_CARRIER_ENVELOPE');
  names.add(item.name);
  const files=new Map();
  for(const entry of item.files){
   if(!exact(entry,['path','contentBase64'])||
    typeof entry.path!=='string'||entry.path.length>180||
    typeof entry.contentBase64!=='string'||entry.contentBase64.length>1_400_000||
    files.has(entry.path))throw Error('C84_CLI_FILE_ENVELOPE');
   files.set(entry.path,entry.contentBase64);
  }
  return {name:item.name,getFile:async path=>{
   if(!files.has(path))throw Error('C84_CARRIER_FILE_MISSING');
   return {contentBase64:files.get(path)};
  }};
 });
 return {selection:q.selection,sourceHead:q.sourceHead,
  expectedManifestSha256:q.expectedManifestSha256,
  manifestBase64:q.manifestBase64,sourceProof:q.sourceProof,
  humanInput:q.humanInput,carriers,
  parallelism:q.parallelism??4,carrierTimeoutMs:q.carrierTimeoutMs??5000};
}
let result;
try{
 const request=decodeEnvelope(fs.readFileSync(0));
 result=await executeC84ExperimentalTurn(request);
}catch{result=stop('C84_CLI_INPUT_OR_EXECUTION');}
process.stdout.write(JSON.stringify(result)+'\n');
if(result.status!=='C84_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED')
 process.exitCode=2;
