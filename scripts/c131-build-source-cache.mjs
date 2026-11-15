/** Build an exact C128 cache from pinned repository sources without mutating them. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PIN} from '../host/c107-carrier-consumer.mjs';
import {C124_OVERLAY_GIT_BLOBS} from '../host/c124-source-overlay.mjs';
import {buildC127SourceCache,loadC127SourceCache} from '../host/edu-c127-source-transport.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=process.argv[2];
if(!output||!path.isAbsolute(output)||fs.existsSync(output))throw Error('new absolute output required');
const r=buildC127SourceCache({carrierBytes:fs.readFileSync(path.join(root,PIN.name)),
 c124OverlayBytes:Object.fromEntries(Object.keys(C124_OVERLAY_GIT_BLOBS).map(p=>[p,fs.readFileSync(path.join(root,p))]))});
if(!r.ok)throw Error('source cache rejected: '+r.first_edge);
fs.writeFileSync(output,r.bytes,{flag:'wx',mode:0o600});
const actual=loadC127SourceCache(output);
if(!actual.ok||!actual.single_inode_readback_verified||actual.cache_sha256!==r.sha256)throw Error('C128 original readback failed');
process.stdout.write(JSON.stringify({ok:true,bytes:r.bytes.length,sha256:r.sha256})+'\n');
