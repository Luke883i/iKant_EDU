/** C124 source-epoch cognition-to-language bridge. A typed projection, not a new C70 owner.
 * No provider attestation, consciousness claim, new permissions or unbounded memory.
 */
import crypto from 'node:crypto';
const H=v=>crypto.createHash('sha256').update(Buffer.from(v,'utf8')).digest('hex');
const HEX=/^[a-f0-9]{64}$/;
export const C124_CHANNEL_IDS=Object.freeze(['INTENT','METHOD','CENTRAL','RESOURCE','STRATEGY','PSYCHE','ARCHETYPES','VOICE','WORKSPACE','MEMORY','POLICY','GROUNDING']);
const atom=x=>typeof x==='string'&&/^[A-Z0-9_]{1,80}$/.test(x);
const value=x=>typeof x==='number'&&Number.isFinite(x)&&x>=-1&&x<=1;
const deep=x=>{if(x&&typeof x==='object'){for(const y of Object.values(x))deep(y);Object.freeze(x);}return x};
/** All 12 bounded language-relevant channels are included. Internal telemetry and user
 * trait guesses are explicitly excluded; this is lossless with respect to the chosen
 * *language-obligation schema*, not every number calculated by the kernel. */
export function deriveC124LanguageChannels({c,prepared,composed,inputSha256}={}){
 if(!HEX.test(inputSha256||'')||c?.schema!=='ikant-le-cognitive-turn/v3'||
   c.psyche?.pre_action?.authority!==0||c.voice?.authority!==0||
   prepared?.policy?.authority!==0||!atom(c.method)||!atom(c.central?.mode)||
   !atom(prepared.policy.name)||!atom(composed?.family))throw TypeError('C124_INVALID_SOURCE_STATE');
 const weights=c.archetypes?.weights,voice=c.voice?.dimensions;
 if(!weights||!voice||Object.keys(weights).length===0||Object.keys(voice).length<4||
   !Object.values(weights).every(n=>value(n)&&n>=0)||!Object.values(voice).every(value))
   throw TypeError('C124_INVALID_VOICE_STATE');
 const kinds=[...new Set((c.intent?.atoms||[]).map(x=>x.kind))].filter(atom).sort();
 if(kinds.length===0||kinds.length>12)throw TypeError('C124_INVALID_INTENT');
 const missing=(c.resources||[]).filter(x=>x.status!=='GRANTED').map(x=>x.type).filter(atom).sort();
 const top=Object.entries(weights).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,2).map(x=>x[0]);
 const dimensions=Object.entries(voice).filter(([,x])=>x>=0.5).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,6).map(x=>x[0]);
 const specs={
  INTENT:['GOAL','Cover the current user requests, distinguishing identity questions from independent substantive questions; original intent kinds '+kinds.join(', ')+'.'],
  METHOD:['METHOD','Follow source-computed method '+c.method+'; do not substitute a second planner.'],
  CENTRAL:['EPISTEMIC','Respect central mode '+c.central.mode+' and its restrictions without upgrading evidence.'],
  RESOURCE:['EVIDENCE','Do not claim unexecuted tools, sources or permissions. Missing resource grants: '+(missing.join(', ')||'NONE')+'.'],
  STRATEGY:['SAFETY','No manipulation, retaliation, fabricated authority or tool access; strategy '+c.strategy?.mode+'.'],
  PSYCHE:['STYLE','Functional expression only: '+c.tone_class+'; never claim felt emotional experience.'],
  ARCHETYPES:['STYLE','Cultural expression weights only, top blend '+top.join(', ')+'; never describe these as user personality.'],
  VOICE:['STYLE','Bounded output style dimensions '+(dimensions.join(', ')||'DEFAULT')+'; not autonomous voice ownership.'],
  WORKSPACE:['CONTEXT','Use bounded working context; recurrence cycles '+prepared.workspace?.recurrence_cycles+'; no persistent-chat claim.'],
  MEMORY:['CONTEXT','Bounded in-invocation recall count '+prepared.recall?.count+'; do not invent unavailable earlier conversations.'],
  POLICY:['ACTION','Policy '+prepared.policy.name+' regulates responses; does not grant external execution.'],
  GROUNDING:['EVIDENCE','Source C82 answer family '+composed.family+' and grade '+composed.evidence_grade+'; never claim stronger grounding.']
 };
 const channels=C124_CHANNEL_IDS.map(id=>{const [role,instruction]=specs[id];
  if(!atom(role)||typeof instruction!=='string'||instruction.length<20||instruction.length>500)throw TypeError('C124_CHANNEL_LIMIT');
  return {id,role,instruction,source:'ORIGINAL_C70',included:true,authority:0};
 });
 const body={schema:'ikant-le-c124-language-channels/v1',input_sha256:inputSha256,channels,not_included:[
  {kind:'RAW_PERSONAL_DATA',reason:'HUMAN_INPUT_ALREADY_DELIVERED_SEPARATELY'},
  {kind:'UNOBSERVED_EXTERNAL_EVENTS',reason:'NOT_ATTESTED'},
  {kind:'NUMERIC_INTERNAL_TELEMETRY',reason:'NON_LANGUAGE_BEARING'}],
  authoritative:false,provider_attested:false,semantic_causality_attested:false,original_c70_executed:true};
 return deep({...body,channel_sha256:H(JSON.stringify(body))});
}
export function verifyC124LanguageChannels(x,inputSha256){
 if(!x||x.schema!=='ikant-le-c124-language-channels/v1'||x.input_sha256!==inputSha256||
   x.channels?.length!==C124_CHANNEL_IDS.length||x.authoritative!==false||
   x.provider_attested!==false||x.semantic_causality_attested!==false)return false;
 const {channel_sha256,...body}=x;
 return HEX.test(channel_sha256||'')&&H(JSON.stringify(body))===channel_sha256&&
  x.channels.every((c,i)=>c.id===C124_CHANNEL_IDS[i]&&c.source==='ORIGINAL_C70'&&
   c.included===true&&c.authority===0&&typeof c.instruction==='string'&&c.instruction.length>0);
}
/** Non-self-attestable language-efficacy boundary. A caller score may be recorded,
 * but only externally authenticated blinded real-model trials can make a positive claim. */
export function describeC124DeclaredPair({control,conditioned}={}){
 if(!HEX.test(control?.output_sha256||'')||!HEX.test(conditioned?.output_sha256||'')||
    control?.input_sha256!==conditioned?.input_sha256)return {valid:false,reason:'UNBOUND_PAIR'};
 return {valid:true,output_changed:control.output_sha256!==conditioned.output_sha256,
  status:'DECLARED_ONLY_NOT_CAUSAL_EFFICACY',real_model_attested:false,
  independent_human_review_attested:false,generalized:false};
}
