/** HOST transport helper for the original C135 acknowledgement. No writer, model or admission authority. */
import {isProxy} from 'node:util/types';
const H64=/^[0-9a-f]{64}$/u;
const keys=['ack_c124_channel_sha256','ack_plan_sha256','input_sha256'];
export function makeC135AcknowledgedDraft(task,text){
 if(!task||typeof task!=='object'||isProxy(task)||Array.isArray(task)||
  task.schema!=='ikant-edu-v2-language-task/v1'||
  task.required_ack?.constructor!==Object||isProxy(task.required_ack)||
  task.channels?.channel_sha256!==task.required_ack.ack_c124_channel_sha256||
  task.plan?.input_sha256!==task.required_ack.input_sha256||
  task.guidance?.plan_sha256!==task.required_ack.ack_plan_sha256||
  Object.keys(task.required_ack).sort().join(',')!==keys.join(',')||
  keys.some(k=>!H64.test(task.required_ack[k]||'')))throw Error('S02_REQUIRED_ACK_CONTRACT_INVALID');
 if(typeof text!=='string'||!text.trim()||Buffer.byteLength(text,'utf8')>16000)
  throw Error('S02_HOST_CANDIDATE_INVALID');
 return Object.freeze({text,...task.required_ack});
}
