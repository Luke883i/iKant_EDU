/** Build one exact distributable experimental C107+C124 Project cache. 
 * This is a packaging utility; do not run on first-contact or before C72.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PIN} from '../host/c107-carrier-consumer.mjs';
import {C124_OVERLAY_GIT_BLOBS} from '../host/c124-source-overlay.mjs';
import {buildC127SourceCache,inspectC127SourceCache} from '../host/edu-c127-source-transport.mjs';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=process.argv[2]||'';
if(!output||!path.isAbsolute(output)||fs.existsSync(output)){
 console.error('Usage: node scripts/c127-build-project-cache.mjs /absolute/nonexisting/output.json');
 process.exit(2);
}
const carrierBytes=fs.readFileSync(path.join(base,PIN.name));
const c124OverlayBytes=Object.fromEntries(Object.keys(C124_OVERLAY_GIT_BLOBS).map(p=>[p,fs.readFileSync(path.join(base,p))]));
const built=buildC127SourceCache({carrierBytes,c124OverlayBytes});
if(!built.ok){console.error(built.first_edge);process.exit(3);}
fs.writeFileSync(output,built.bytes,{flag:'wx',mode:0o600});
const reread=fs.readFileSync(output),receipt=inspectC127SourceCache(reread);
if(!reread.equals(built.bytes)||!receipt.ok||receipt.cache_sha256!==built.sha256){fs.rmSync(output,{force:true});process.exit(4)}
console.log(JSON.stringify({status:'C127_LOCAL_PACKAGE_BUILT_AND_REOPENED',sha256:built.sha256,bytes:reread.length,source_epoch:receipt.source_head,active:false}));
