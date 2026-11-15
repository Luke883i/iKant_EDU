import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {isC98PlainDataRecord} from './c98-c82-connector-port.mjs';

// Host-mounted *file* byte transport. No network, no GitHub/API, no owner,
// no installer. Caller must already possess a host-authorized exact archive.
// A matching digest proves bytes only, never authenticated GitHub provenance.
const H40=/^[0-9a-f]{40}$/, H64=/^[0-9a-f]{64}$/;
const MAX=5_000_000;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const deny=c=>Object.assign(new Error(`C98_FILE_${c}`),{code:`C98_FILE_${c}`});
const within=(root,p)=>p.startsWith(root+path.sep)&&p!==root;
const regular=s=>s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size>0&&s.size<=MAX;

// Never discover filesystem paths by guessing Project filenames. Paths are
// explicitly supplied by an installed host, an authorized mounted upload, or
// user handoff; source-head and SHA must come from an independently verified
// manifest / receipt, not this callback's assertion.
export function makeC98LocalFileArchiveBridge({allowedRoot,archivePath,
 sourceHead,manifestSha256,archiveSha256}={}){
 if(typeof allowedRoot!=='string'||!path.isAbsolute(allowedRoot)||
  typeof archivePath!=='string'||!path.isAbsolute(archivePath)||
  !H40.test(sourceHead||'')||!H64.test(manifestSha256||'')||
  !H64.test(archiveSha256||''))throw deny('CONFIG_BOUNDS');
 const root=path.resolve(allowedRoot),file=path.resolve(archivePath);
 if(!within(root,file))throw deny('PATH_OUTSIDE_ROOT');
 let reads=0;
 const readC77Archive=async request=>{
  if(!isC98PlainDataRecord(request)||
     Object.keys(request).sort().join(',')!=='manifestSha256,sourceHead')
    throw deny('REQUEST_SHAPE');
  if(request.sourceHead!==sourceHead||request.manifestSha256!==manifestSha256)
   throw deny('REQUEST_EPOCH_DRIFT');
  // Reject symlink parents, symlink file and hardlinked file. Retain the fd
  // through two independent byte reads so path replacement cannot redirect IO.
  const rootStat=fs.lstatSync(root);
  if(!rootStat.isDirectory()||rootStat.isSymbolicLink())throw deny('ROOT_SYMLINK');
  let cur=root;
  for(const part of path.relative(root,file).split(path.sep)){
   cur=path.join(cur,part);
   if(fs.lstatSync(cur).isSymbolicLink())throw deny('SYMLINK_PATH');
  }
  const before=fs.lstatSync(file);
  if(!regular(before))throw deny('NOT_EXCLUSIVE_REGULAR_FILE');
  const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  let first,second;
  try{
   const st=fs.fstatSync(fd);
   if(!regular(st)||before.ino!==st.ino||before.dev!==st.dev||before.size!==st.size)
    throw deny('FILE_REPLACED');
   const read=()=>{
    const buf=Buffer.alloc(st.size);
    let pos=0;
    while(pos<buf.length){
     const count=fs.readSync(fd,buf,pos,buf.length-pos,pos);
     if(count<=0)throw deny('SHORT_READ');
     pos+=count;
    }
    return buf;
   };
   first=read();second=read();
   const end=fs.fstatSync(fd);
   if(!first.equals(second)||!regular(end)||st.ino!==end.ino||
      st.dev!==end.dev||st.size!==end.size||
      st.mtimeMs!==end.mtimeMs||st.ctimeMs!==end.ctimeMs)
     throw deny('FILE_CHANGED_DURING_READBACK');
  }finally{fs.closeSync(fd);}
  if(sha(first)!==archiveSha256)throw deny('ARCHIVE_SHA256_MISMATCH');
  reads++;
  return Object.freeze({sourceHead,manifestSha256,
   artifactSha256:archiveSha256,archiveBase64:first.toString('base64')});
 };
 return Object.freeze({readC77Archive,statistics:()=>Object.freeze({
  successful_file_reads:reads,byte_readback_verified:reads>0,
  github_ref_origin_attested:false,native_event_attested:false,
  node_network_attempts:0,owner_executed:false,active:false})});
}
