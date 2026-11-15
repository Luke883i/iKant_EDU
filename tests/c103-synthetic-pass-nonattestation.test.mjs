import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {verifyC103HostAdapterWitness} from '../host/c103-host-adapter-conformance.mjs';
const head='a05846cb58af8a6509299008674beb582020e318';
const h=x=>crypto.createHash('sha256').update(x).digest('hex');
test('C103 structural PASS on synthetic coherent receipt is NOT a runtime call',()=>{
 const offer=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
 const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const orientation=presentC72Introduction(accepted);
 const selection=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
 const raw='Prova di audit',voice='Stringa fabbricata per dimostrare soltanto la forma';
 const request={sourceHead:head,selection,humanInput:raw,optIn:true};
 const nonce='c103-synthetic-counterexample-001',hash='b'.repeat(64);
 const receipt={schema:'ikant-le-c102-soft-host-bridge/v1',status:'C102_ORIGINAL_C101_C87_LOCAL_READBACK',
 source_head:head,input_sha256:h(raw),output_sha256:h(voice),voice_utf8:voice,
 voice_source:'C70_REPOSITORY_FALLBACK',c70_status:'EXPERIMENTAL_COMPUTE_PREVIEW',
 c71_status:'EXPERIMENTAL_HOST_DRAFT',c100_status:'C100_MODEL_DRAFT_UNATTESTED_NOT_OWNER',
 ledger_status:'C87_LOCAL_DURABLE_READBACK_NOT_NATIVE_SESSION',ledger_entries:1,
 ledger_event_sha256:hash,actual_local_c101_c87_invoked:true,source_origin_attested:false,
 cognitive_cross_turn_continuity_attested:false,persistent:false,native_event_attested:false,
 native_delivery_attested:false,active:false,authority:0};
 const inspection={schema:'ikant-le-c102-inspection/v1',status:'C102_LEDGER_REOPENED',
 count:1,last_hash:hash,source_origin_attested:false,native_session_persistence_attested:false,
 active:false,authority:0,latest_state:{schema:'ikant-le-c102-observation/v1',nonce,
 c101_status:'C101_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED',
 c70_status:receipt.c70_status,c71_status:receipt.c71_status,c100_status:receipt.c100_status,
 voice_source:receipt.voice_source,active:false,native_host_dispatch_attested:false,
 cognitive_cross_turn_continuity_attested:false}};
 const v=verifyC103HostAdapterWitness({request,nonce,receipt,inspection});
 assert.equal(v.status,'C103_ENVELOPE_CONFORMANT_NOT_HOST_ATTESTED');
 assert.equal(v.host_runtime_execution_attested,false);
 assert.equal(v.native_delivery_attested,false);
 // There was no C102 invocation, no ledger file, no physical host receipt.
});
