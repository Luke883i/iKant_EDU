import crypto from 'node:crypto';
import {validateC94C77Archive} from './c94-zip-c77.mjs';
import {makeC98C82Carrier,isC98PlainDataRecord} from './c98-c82-connector-port.mjs';

const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const HEX64=/^[a-f0-9]{64}$/;
const fail=code=>Object.assign(new Error('C98_ARCHIVE_'+code),{code:'C98_ARCHIVE_'+code});
const canonical=x=>typeof x==='string'&&x.length>0&&x.length<=7_000_000&&x.length%4===0&&
 /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(x)&&
 Buffer.from(x,'base64').toString('base64')===x;
const exact=(o,keys)=>isC98PlainDataRecord(o)&&
 Object.keys(o).sort().join(',')===keys.slice().sort().join(',');
/**
 * One host-supplied archive read becomes N source-bound C82 getFile callbacks.
 * Uses existing C94 archive and C98 member validators; no file writes, network,
 * provider installation, GitHub-ref provenance, extra planner or lifecycle.
 * The host must unwrap the *actual C77 ZIP* (or deliver the expected Actions ZIP)
 * through a genuinely registered callback; callback names do not prove origin.
 */
export function makeC98ArchiveC82Carrier({sourceHead,manifest,manifestBase64,
 manifestSha256,readC77Archive,carrierName='HOST_C77_ARCHIVE'}={}){
 if(typeof readC77Archive!=='function')throw fail('REAL_CALLBACK_REQUIRED');
 let archivePromise=null,attempted=0,archiveVerified=false;
 async function oneArchive(){
  if(!archivePromise){
   archivePromise=(async()=>{
    attempted++;
    const envelope=await readC77Archive(Object.freeze({sourceHead,manifestSha256}));
    if(!exact(envelope,['sourceHead','manifestSha256','artifactSha256','archiveBase64'])||
      envelope.sourceHead!==sourceHead||envelope.manifestSha256!==manifestSha256||
      !HEX64.test(envelope.artifactSha256||'')||!canonical(envelope.archiveBase64))
      throw fail('ENVELOPE');
    const archive=Buffer.from(envelope.archiveBase64,'base64');
    if(archive.length>5_000_000||hash(archive)!==envelope.artifactSha256)
      throw fail('ARCHIVE_SHA256');
    const checked=validateC94C77Archive(archive,{sourceHead});
    if(checked.status!=='C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN'||
      checked.manifest_sha256!==manifestSha256||checked.artifact_sha256!==envelope.artifactSha256||
      !checked.content.get('c77-manifest.json')?.equals(Buffer.from(manifestBase64,'base64')))
      throw fail('C77_SOURCE_OR_MANIFEST');
    archiveVerified=true;
    return checked;
   })();
  }
  return archivePromise;
 }
 const bound=makeC98C82Carrier({sourceHead,manifest,manifestBase64,
  manifestSha256,carrierName,readC77Member:async({path,sourceHead:head,manifestSha256:mh})=>{
   const checked=await oneArchive();
   const bytes=checked.content.get(path);
   if(!bytes)throw fail('MEMBER_MISSING');
   return {path,sourceHead:head,manifestSha256:mh,contentBase64:bytes.toString('base64')};
  }});
 return Object.freeze({...bound,
  archiveStatistics:()=>Object.freeze({archive_callbacks_started:attempted,
   archive_source_bytes_verified:archiveVerified,host_origin_attested:false,
   native_event_attested:false,owner_executed:false,active:false})});
}
