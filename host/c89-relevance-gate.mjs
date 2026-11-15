import crypto from 'node:crypto';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const H64=/^[a-f0-9]{64}$/;const H40=/^[a-f0-9]{40}$/;
const stopped=edge=>({status:'C89_STOP',first_unclosed_edge:edge,
  relevance_field_h95_attested:false,independent_holdout_attested:false,
  active:false,native_delivery_attested:false});
const boundaryMatch=(text,phrase)=>{
 const quote=phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp('(?:^|[^\\p{L}\\p{N}])'+quote+'(?=$|[^\\p{L}\\p{N}])','iu').test(text);
};
/** Input/voice bytes stay runtime-owned. Rubric is an externally pinned evaluation aid,
 * not a response-author or evidence of an independent reviewer. */
export function evaluateC89BoundedRelevance({casePacket,expectedCaseSha256,
  sourceHead,currentHumanInput,runtimeVoice,expectedVoiceSha256}={}){
 if(!H64.test(expectedCaseSha256||'')||!H40.test(sourceHead||'')||
  !H64.test(expectedVoiceSha256||'')||typeof currentHumanInput!=='string'||
  typeof runtimeVoice!=='string'||Buffer.byteLength(runtimeVoice,'utf8')>32000||
  !runtimeVoice.trim()||Buffer.from(runtimeVoice).toString('utf8')!==runtimeVoice)
  return stopped('C89_UNBOUND_INPUT_OR_VOICE');
 if(!casePacket||typeof casePacket!=='object'||Array.isArray(casePacket)||
  sha(JSON.stringify(casePacket))!==expectedCaseSha256||
  casePacket.schema!=='ikant-le-c89-bounded-rubric/v1'||
  casePacket.source_head!==sourceHead||casePacket.input_sha256!==sha(currentHumanInput)||
  !Array.isArray(casePacket.required_phrases)||casePacket.required_phrases.length<1||
  casePacket.required_phrases.length>20||!Array.isArray(casePacket.forbidden_phrases)||
  casePacket.forbidden_phrases.length>20||
  ![...casePacket.required_phrases,...casePacket.forbidden_phrases].every(x=>
   typeof x==='string'&&x.length>0&&x.length<150)||
  casePacket.active!==false||casePacket.independent_holdout_attested!==false||
  new Set(casePacket.required_phrases.map(x=>x.toLowerCase())).size!==casePacket.required_phrases.length||
  new Set(casePacket.forbidden_phrases.map(x=>x.toLowerCase())).size!==casePacket.forbidden_phrases.length||
  casePacket.required_phrases.some(x=>casePacket.forbidden_phrases.some(y=>x.toLowerCase()===y.toLowerCase())))
  return stopped('C89_CASE_PIN_OR_RUBRIC');
 if(sha(runtimeVoice)!==expectedVoiceSha256)return stopped('C89_VOICE_BYTE_DRIFT');
 const missing=casePacket.required_phrases.filter(x=>!boundaryMatch(runtimeVoice,x));
 const prohibited=casePacket.forbidden_phrases.filter(x=>boundaryMatch(runtimeVoice,x));
 const accepted=missing.length===0&&prohibited.length===0;
 return {status:accepted?'C89_BOUNDED_RUBRIC_PASS_NOT_H95':'C89_BOUNDED_RUBRIC_REJECT',
  rubric_sha256:expectedCaseSha256,input_sha256:sha(currentHumanInput),
  voice_sha256:expectedVoiceSha256,requirements:casePacket.required_phrases.length,
  matched_requirements:casePacket.required_phrases.length-missing.length,
  missing_phrases:missing,forbidden_found:prohibited,
  response_rewritten:false,independent_holdout_attested:false,
  relevance_field_h95_attested:false,native_delivery_attested:false,active:false};
}
