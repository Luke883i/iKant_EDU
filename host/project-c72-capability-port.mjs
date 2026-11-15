/**
 * C72 Host port (authority=0): implements a *choice of physical transport
 * shape*, not a GitHub connector, provider hook, C72 owner or runtime.
 * Caller must actually move bytes into Node. Neither shape authenticates
 * the native user event or GitHub-origin event on its own.
 */
const ORDER=Object.freeze(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
const H40=/^[0-9a-f]{40}$/u;
const stop=edge=>Object.freeze({ok:false,edge,native_event_attested:false,source_origin_attested:false});
export function bindC72Transport({sourceHead,readMain,readPinnedDocument,sourcePacket}={}){
 if(!H40.test(sourceHead||''))return stop('C72_HOST_PORT_HEAD_INVALID');
 const hasPacket=sourcePacket!==undefined&&sourcePacket!==null;
 const hasCallback=readMain!==undefined||readPinnedDocument!==undefined;
 if(hasPacket&&hasCallback)return stop('C72_HOST_PORT_AMBIGUOUS');
 if(!hasPacket){
  if(typeof readMain!=='function'||typeof readPinnedDocument!=='function')
   return stop('C72_SOURCE_BRIDGE_UNBOUND');
  return Object.freeze({ok:true,kind:'HOST_CALLBACKS',readMain,readPinnedDocument,
   source_origin_attested:false,native_event_attested:false});
 }
 const p=sourcePacket;
 if(!p||typeof p!=='object'||Array.isArray(p)||
  p.schema!=='ikant-host-c72-source-packet/v1'||
  p.source_head!==sourceHead||!H40.test(p.live_head||'')||
  p.carrier_kind!=='HOST_OPAQUE_TRANSFER'||p.source_origin_attested!==false||
  p.native_event_attested!==false||!Array.isArray(p.documents)||
  p.documents.length!==ORDER.length)return stop('C72_HOST_PACKET_INVALID');
 let total=0;
 const docs=new Map();
 for(let i=0;i<ORDER.length;i++){
  const d=p.documents[i];
  if(!d||typeof d!=='object'||Array.isArray(d)||d.path!==ORDER[i]||
   d.source_head!==sourceHead||!H40.test(d.blob_sha1||'')||
   typeof d.content!=='string')return stop('C72_HOST_PACKET_INVALID');
  const size=Buffer.byteLength(d.content,'utf8');
  total+=size;
  if(size<1||size>256000||total>550000||docs.has(d.path))
   return stop('C72_HOST_PACKET_BOUNDS_INVALID');
  docs.set(d.path,Object.freeze({path:d.path,source_head:d.source_head,
   blob_sha1:d.blob_sha1,content:d.content}));
 }
 // These are local closures over bytes actually supplied to this process,
 // NOT native connector callbacks. C72 reentry recomputes every Git SHA-1.
 return Object.freeze({ok:true,kind:'HOST_SOURCE_PACKET',
  readMain:async()=>p.live_head,
  readPinnedDocument:async path=>docs.get(path)||null,
  source_origin_attested:false,native_event_attested:false});
}
