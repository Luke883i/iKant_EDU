import crypto from 'node:crypto';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {verifyC103HostAdapterWitness} from '../host/c103-host-adapter-conformance.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const head='3bc929b55f5dedb9f0ed833e8d036558a5c13d53';
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const orientation=presentC72Introduction(accepted);
const sel=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
const input='Definisci una prova falsificabile',voice='Risposta locale di prova, non attestazione di esecuzione.',hash='b'.repeat(64);
const make=i=>{
 const nonce='c103-case-'+String(i).padStart(10,'0');
 const request={sourceHead:head,selection:structuredClone(sel),humanInput:input,optIn:true};
 const receipt={schema:'ikant-le-c102-soft-host-bridge/v1',status:'C102_ORIGINAL_C101_C87_LOCAL_READBACK',
 source_head:head,input_sha256:sha(input),output_sha256:sha(voice),voice_utf8:voice,voice_source:'C70_REPOSITORY_FALLBACK',
 c70_status:'EXPERIMENTAL_COMPUTE_PREVIEW',c71_status:'EXPERIMENTAL_HOST_DRAFT',
 c100_status:'C100_MODEL_DRAFT_UNATTESTED_NOT_OWNER',ledger_status:'C87_LOCAL_DURABLE_READBACK_NOT_NATIVE_SESSION',
 ledger_entries:1,ledger_event_sha256:hash,actual_local_c101_c87_invoked:true,source_origin_attested:false,
 cognitive_cross_turn_continuity_attested:false,persistent:false,native_event_attested:false,
 native_delivery_attested:false,active:false,authority:0};
 const inspection={schema:'ikant-le-c102-inspection/v1',status:'C102_LEDGER_REOPENED',
 count:1,last_hash:hash,source_origin_attested:false,native_session_persistence_attested:false,active:false,authority:0,
 latest_state:{schema:'ikant-le-c102-observation/v1',nonce,
 c101_status:'C101_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED',c70_status:receipt.c70_status,
 c71_status:receipt.c71_status,c100_status:receipt.c100_status,voice_source:receipt.voice_source,
 active:false,native_host_dispatch_attested:false,cognitive_cross_turn_continuity_attested:false}};
 return {request,nonce,receipt,inspection};
};
const axes=[
 ['request.optIn',false],['request.sourceHead','f'.repeat(40)],['request.humanInput','x'.repeat(601)],
 ['request.selection.status','INVALID'],['nonce','short'],['receipt.voice_utf8','modified'],
 ['receipt.input_sha256','0'.repeat(64)],['receipt.output_sha256','0'.repeat(64)],
 ['receipt.status','STOP'],['receipt.source_head','f'.repeat(40)],['receipt.c70_status','STOP'],
 ['receipt.c71_status','STOP'],['receipt.c100_status','STOP'],['receipt.actual_local_c101_c87_invoked',false],
 ['receipt.active',true],['receipt.native_delivery_attested',true],['receipt.native_event_attested',true],
 ['receipt.persistent',true],['receipt.source_origin_attested',true],['receipt.authority',1],
 ['receipt.ledger_entries',0],['receipt.ledger_event_sha256','a'.repeat(64)],['receipt.ledger_status','STOP'],
 ['receipt.cognitive_cross_turn_continuity_attested',true],['inspection.last_hash','a'.repeat(64)],
 ['inspection.count',2],['inspection.status','STOP'],['inspection.authority',1],
 ['inspection.latest_state.nonce','mismatch'],['inspection.latest_state.active',true],
 ['inspection.latest_state.c101_status','STOP'],['inspection.latest_state.c100_status','STOP'],
 ['inspection.latest_state.native_host_dispatch_attested',true],
 ['inspection.native_session_persistence_attested',true],['receipt.voice_utf8','']
];
let failed=0;const counts=Array(axes.length).fill(0),start=Date.now();
for(let i=0;i<100000;i++){
 const x=make(i),a=(i*37+11)%axes.length,[p,v]=axes[a],keys=p.split('.');
 let target=x;for(const k of keys.slice(0,-1))target=target[k];target[keys.at(-1)]=v;counts[a]++;
 if(verifyC103HostAdapterWitness(x).status!=='C103_STOP')failed++;
}
for(let i=100000;i<102500;i++)
 if(verifyC103HostAdapterWitness(make(i)).status!=='C103_ENVELOPE_CONFORMANT_NOT_HOST_ATTESTED')failed++;
const r={schema:'ikant-le-c103-falsification/v1',kind:'SYNTHETIC_NOT_LIVE_CHAT',
 negative_mutations:100000,positive_synthetic_controls:2500,axes:axes.length,axis_counts:counts,
 unexpected_survivors:failed,real_model_calls:0,native_chat_events:0,
 original_c101_runs_in_campaign:0,duration_ms:Date.now()-start,qualified:failed===0};
console.log(JSON.stringify(r));if(failed)process.exitCode=1;
