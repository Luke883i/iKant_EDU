import test from 'node:test';
import assert from 'node:assert/strict';
import {makeC135AcknowledgedDraft} from '../host/project-oneshell-language-ack.mjs';
const h=x=>x.repeat(64);
const task={schema:'ikant-edu-v2-language-task/v1',plan:{input_sha256:h('a')},guidance:{plan_sha256:h('b')},channels:{channel_sha256:h('c')},required_ack:{input_sha256:h('a'),ack_plan_sha256:h('b'),ack_c124_channel_sha256:h('c')}};
test('task advertises explicit required acknowledgements, successful draft binds all three',()=>{
 const r=makeC135AcknowledgedDraft(task,'Risposta owner candidate');
 assert.deepEqual(Object.keys(r).sort(),['ack_c124_channel_sha256','ack_plan_sha256','input_sha256','text']);
 assert.equal(r.ack_c124_channel_sha256,task.channels.channel_sha256);
 assert.equal(r.text,'Risposta owner candidate');
 assert.equal(Object.isFrozen(r),true);
});
test('fail closed on absent, swapped or stale fields, and hostile proxy',()=>{
 const mismatches=[{...task,required_ack:undefined},{...task,required_ack:{...task.required_ack,ack_c124_channel_sha256:h('d')}},
  {...task,channels:{...task.channels,channel_sha256:h('d')}},
  {...task,required_ack:{...task.required_ack,ack_plan_sha256:h('d')}},
  {...task,required_ack:{...task.required_ack,input_sha256:undefined}},
  {...task,required_ack:{...task.required_ack,extra:'x'}},
  {...task,schema:'forged'},new Proxy({}, {get(){throw Error('unsafe')}})];
 for(const invalid of mismatches)assert.throws(()=>makeC135AcknowledgedDraft(invalid,'Test'));
 assert.throws(()=>makeC135AcknowledgedDraft(task,' '));
});
