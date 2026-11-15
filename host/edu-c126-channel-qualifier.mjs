/** C126: independently constrain the C124 *language envelope* before HOST callback.
 * Validation is necessary but not a model compliance, source-authenticity, or semantic
 * effectiveness proof. No new C70 planner, C87 writer or native ChatGPT dispatcher.
 */
import {createHash} from 'node:crypto';
import {isProxy} from 'node:util/types';

const HEX64=/^[a-f0-9]{64}$/;
const SHA=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const IDS=Object.freeze(['INTENT','METHOD','CENTRAL','RESOURCE','STRATEGY','PSYCHE','ARCHETYPES','VOICE','WORKSPACE','MEMORY','POLICY','GROUNDING']);
const ROLES=Object.freeze(['GOAL','METHOD','EPISTEMIC','EVIDENCE','SAFETY','STYLE','STYLE','STYLE','CONTEXT','CONTEXT','ACTION','EVIDENCE']);
const PREFIX=Object.freeze([
 'Cover the current user requests, distinguishing identity questions',
 'Follow source-computed method ',
 'Respect central mode ',
 'Do not claim unexecuted tools, sources or permissions.',
 'No manipulation, retaliation, fabricated authority or tool access;',
 'Functional expression only: ',
 'Cultural expression weights only, top blend ',
 'Bounded output style dimensions ',
 'Use bounded working context; recurrence cycles ',
 'Bounded in-invocation recall count ',
 'Policy ',
 'Source C82 answer family '
]);
const EXCLUDED=Object.freeze([
 ['RAW_PERSONAL_DATA','HUMAN_INPUT_ALREADY_DELIVERED_SEPARATELY'],
 ['UNOBSERVED_EXTERNAL_EVENTS','NOT_ATTESTED'],
 ['NUMERIC_INTERNAL_TELEMETRY','NON_LANGUAGE_BEARING']
]);
const plain=o=>o&&typeof o==='object'&&!isProxy(o)&&!Array.isArray(o)&&
 (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
const clean=o=>{if(!plain(o))return false;const ds=Object.getOwnPropertyDescriptors(o);
 return Reflect.ownKeys(ds).every(k=>typeof k==='string'&&k!=='__proto__'&&k!=='constructor'&&
 k!=='prototype'&&Object.hasOwn(ds[k],'value'));};
const exact=(o,keys)=>clean(o)&&Reflect.ownKeys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const arr=(a,n)=>Array.isArray(a)&&!isProxy(a)&&a.length===n&&
 Reflect.ownKeys(a).length===n+1&&Array.from({length:n},(_,i)=>i).every(i=>Object.hasOwn(a,i)&&
 Object.hasOwn(Object.getOwnPropertyDescriptors(a)[i],'value'));
const line=s=>typeof s==='string'&&s.length>=20&&s.length<=500&&
 Buffer.from(s,'utf8').toString('utf8')===s&&
 !/[\u0000-\u001f\u007f\u0085\u2028\u2029\u202a-\u202e\u2066-\u2069]/u.test(s);
const fail=edge=>Object.freeze({ok:false,first_edge:edge,authority:0,causal_efficacy_attested:false});

export function qualifyC126Channels(capsule,{inputSha256,channelSha256}={}){
 try{
  if(!HEX64.test(inputSha256||'')||!HEX64.test(channelSha256||''))return fail('C126_BOUNDARY_MISSING');
  if(!exact(capsule,['schema','input_sha256','channels','not_included','authoritative',
   'provider_attested','semantic_causality_attested','original_c70_executed','channel_sha256']))return fail('C126_ENVELOPE_SHAPE');
  if(capsule.schema!=='ikant-le-c124-language-channels/v1'||
   capsule.input_sha256!==inputSha256||capsule.channel_sha256!==channelSha256||
   capsule.authoritative!==false||capsule.provider_attested!==false||
   capsule.semantic_causality_attested!==false||capsule.original_c70_executed!==true)
   return fail('C126_ENVELOPE_PROVENANCE_FLAGS');
  if(!arr(capsule.channels,12)||!arr(capsule.not_included,3))return fail('C126_ARRAY_CARDINALITY');
  for(let i=0;i<12;i++){
   const c=capsule.channels[i];
   if(!exact(c,['id','role','instruction','source','included','authority'])||
    c.id!==IDS[i]||c.role!==ROLES[i]||c.source!=='ORIGINAL_C70'||
    c.included!==true||c.authority!==0||!line(c.instruction)||
    !c.instruction.startsWith(PREFIX[i]))return fail('C126_CHANNEL_'+IDS[i]+'_INVALID');
  }
  for(let i=0;i<3;i++){
   const n=capsule.not_included[i];
   if(!exact(n,['kind','reason'])||n.kind!==EXCLUDED[i][0]||n.reason!==EXCLUDED[i][1])
    return fail('C126_EXCLUSION_SCOPE_DRIFT');
  }
  const {channel_sha256,...body}=capsule;
  if(SHA(JSON.stringify(body))!==channelSha256)return fail('C126_CHANNEL_HASH_DRIFT');
  return Object.freeze({ok:true,status:'C126_STRUCTURAL_CONVEYANCE_ONLY',
   channels:12,channel_sha256:channelSha256,input_sha256:inputSha256,
   language_obligation_coverage:'12_OF_12_VALIDATED',authority:0,
   causal_efficacy_attested:false,provider_origin_attested:false,
   native_chatgpt_hook_attested:false});
 }catch{return fail('C126_UNTRUSTED_CHANNEL_ENVELOPE');}
}
