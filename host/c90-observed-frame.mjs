import crypto from 'node:crypto';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/;
const stop=edge=>({schema:'ikant-le-c90-observed-frame/v2',status:'C90_FRAME_STOP',
 first_unclosed_edge:edge,active:false,native_ui_delivery_attested:false});
export function projectC90ObservedFrame(x){
 if(x?.status!=='C90_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED'||
  x.runtime_executed!==true||x.mode!=='EXPERIMENTAL'||x.active!==false||
  x.native_chat_delivery_attested!==false||x.host_origin_attested!==false||
  x.inter_turn_persistence_attested!==false||x.git_reachability_attested!==true||
  x.first_unclosed_edge!=='HOST_NATIVE_CHAT_SURFACE_A_DELIVERY'||
  !H40.test(x.source_head||'')||
  ![x.input_sha256,x.output_sha256,x.manifest_sha256,x.package_sha256].every(v=>H64.test(v||''))||
  typeof x.voice_exact!=='string'||!x.voice_exact.trim()||
  sha(x.voice_exact)!==x.output_sha256||
  !Number.isInteger(x.staged_files)||x.staged_files<20||x.staged_files>50||
  !Array.isArray(x.qualified_carriers)||x.qualified_carriers.length<1)
  return stop('C90_RUNTIME_OBSERVABLE_FIELDS');
 const debug={mode:'EXPERIMENTAL',source_head:x.source_head,
  input_sha256:x.input_sha256,output_sha256:x.output_sha256,
  source_manifest_sha256:x.manifest_sha256,source_package_sha256:x.package_sha256,
  staged_files:x.staged_files,git_object_reachability_verified:true,
  github_ref_origin_attested:false,native_delivery_attested:false,active:false};
 const backlog={schema:'ikant-le-c90-diagnostic-backlog/v2',
  kind:'EXPERIMENTAL_NOT_CANONICAL',canonical_backlog:false,canonical_docx_count:0,
  sections:[
   {title:'Causal execution',facts:['Current human input digest: '+x.input_sha256,
     'Runtime-computed voice digest: '+x.output_sha256]},
   {title:'Source',facts:['Source head: '+x.source_head,
     'Manifest: '+x.manifest_sha256,'Origin of GitHub ref: NOT_ATTESTED']},
   {title:'Host delivery',facts:['C84/C86 Node path executed, ChatGPT native UI not observed.',
     'No canonical ACTIVE or same-turn DOCX claim.']},
   {title:'Unknowns',facts:['Canonical 35-section backlog: NOT_EXECUTED',
     'Cross-turn authenticated memory: UNKNOWN','Phenomenology: UNKNOWN','Independent H95: NOT_MEASURED']}
  ]};
 const telemetry={schema:'ikant-le-c90-telemetry/v2',source:'C90_IN_PROCESS_RECEIPT',
  observed:{runtime_executed:true,staged_files:x.staged_files,input_sha256:x.input_sha256,
   output_sha256:x.output_sha256},
  unknown:['HOST_NATIVE_EVENT_ID','GITHUB_REF_ORIGIN','CANONICAL_OWNER_WRITE',
   'NATIVE_FILE_PRESENTATION','CROSS_TURN_PERSISTENCE','H95'],private_reasoning_included:false};
 const body={schema:'ikant-le-c90-observed-frame/v2',status:'C90_FRAME_PROJECTED_RECEIPT_SHAPE_ONLY',
  sections_order:['TECHNICAL_HEADER','SURFACE_A_EXACT','DEBUG','BACKLOG','TELEMETRY','EVIDENCE_INDEX'],
  technical_header:{product:'iKant',mode:'EXPERIMENTAL',status:'RUNTIME_NODE_COMPUTED_NOT_NATIVE_PRESENTED',head:x.source_head},
  surface_a_exact:x.voice_exact,debug,backlog,telemetry,active:false,native_ui_delivery_attested:false,
  provenance:'RECEIPT_SHAPE_ONLY_UNLESS_RETURNED_BY_EXECUTEC90HOSTRELEASE'};
 return {...body,frame_sha256:sha(JSON.stringify(body))};
}
/** Rendering a shape-valid frame alone DOES NOT prove its creation by C84. */
export function renderC90HostText(frame){
 if(frame?.schema!=='ikant-le-c90-observed-frame/v2'||
  frame.status!=='C90_FRAME_PROJECTED_RECEIPT_SHAPE_ONLY'||
  !H64.test(frame.frame_sha256||''))return stop('C90_FRAME_SHAPE');
 const {frame_sha256,...body}=frame;
 if(sha(JSON.stringify(body))!==frame_sha256)return stop('C90_FRAME_BYTES_TAMPERED');
 const h=frame.technical_header;
 const text='iKant | '+h.mode+' | '+h.status+' | HEAD '+h.head+'\n\n'+frame.surface_a_exact+
  '\n\nDEBUG (HOST-OWNED)\n'+JSON.stringify(frame.debug)+
  '\n\nBACKLOG EXPERIMENTAL / NONCANONICO\n'+
  frame.backlog.sections.map(s=>s.title+': '+s.facts.join(' ; ')).join('\n')+
  '\n\nTELEMETRIA\n'+JSON.stringify(frame.telemetry)+
  '\n\nEVIDENZE: complete JSON/GZIP only after real host write and reopen.';
 return {status:'C90_HOST_TEXT_READY_NOT_CHAT_DELIVERED',text,voice_exact:frame.surface_a_exact,
  native_chat_delivery_attested:false,active:false};
}
