import test from 'node:test';import assert from 'node:assert/strict';import {inspectS08Claims} from './pilot/s08-canonical-boundary.mjs';
test('S08 even six caller-asserted booleans do not create native event or ACTIVE',()=>{
 const a=Object.fromEntries(['NATIVE_PROVIDER_EVENT_IDENTITY','PINNED_SOURCE_MATCH','C59_ORIGINAL_COMPOSITION','DURABLE_SINGLE_WRITER_READBACK','SAME_TURN_DOCX_WRITE_READBACK','REQUIRED_PRESENTATION_RECEIPT'].map(x=>[x,true]));
 const r=inspectS08Claims(a);assert.equal(r.supplied_check_count,6);assert.equal(r.canonical_active,false);assert.equal(r.owner_issued_native_proof,false);
});
