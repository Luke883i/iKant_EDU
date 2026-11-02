/**
 * C141 PRE-PR LOCAL SHADOW ONLY. No writes, no owner/session/callback activation.
 * C107/C114/C139/C140/C87/C125 remain unchanged. C132 is evidence, not owner.
 * A safe decision here is not a runtime grant; C135 must qualify integration.
 */
import crypto from 'node:crypto';
const hash = x => crypto.createHash('sha256').update(Buffer.from(x,'utf8')).digest('hex');
const utf8 = s => typeof s === 'string' && s.length > 0 && s.trim().length > 0 && Buffer.from(s,'utf8').toString('utf8') === s;
const stop = (code,extra={}) => Object.freeze({status:'STOP',code,authority:0,active:false,original_c70_executed:false,...extra});
const self = /(?:\b(?:chi|cosa)\s+sei\b|\bhai\s+(?:una\s+)?coscienz[ae]\b|\bsei\s+(?:davvero\s+)?coscient[ei]\b|\bare\s+you\s+(?:conscious|sentient)\b|\btu\s+come\s+software\b|\b(?:mia|tua)\s+esistenza\b|\btua\s+(?:coscienza|identit[aà]|esperienza)\b|\b(?:tu|iKant|ChatGPT)\s+(?:sei|provi|senti)\b|\byour\s+(?:identity|consciousness|experience)\b|\bwhat\s+are\s+you\b|\bdo\s+you\s+(?:feel|experience)\b)/iu;
const notOwner = {authority:0,active:false,native_origin_attested:false,original_c70_executed:false,original_c87_writer_executed:false};

export function arbitrateC141({humanInput,c107Family='UNCLASSIFIED',c132Route='UNCLASSIFIED',c139Qualified=false,openScope=false,physicalLimitBytes=12000}={}){
 if(!utf8(humanInput) || !Number.isSafeInteger(physicalLimitBytes) || physicalLimitBytes<600 || physicalLimitBytes>262144 || typeof openScope!=='boolean' || typeof c139Qualified!=='boolean')return stop('C141_INVALID_INPUT_OR_CAPABILITY');
 const size=Buffer.byteLength(humanInput,'utf8');
 const identity=self.test(humanInput.normalize('NFKC'));
 if(identity){
   if(size>600)return stop('C141_LONG_IDENTITY_OWNER_GAP',{input_sha256:hash(humanInput),input_bytes:size,owner:'C114',reason:'NO_BYPASS_OR_FAKE_C70'});
   return Object.freeze({status:'OWNER_RETAINED',route:'C114_OWNER',...notOwner,input_sha256:hash(humanInput),input_bytes:size});
 }
 if(c139Qualified)return Object.freeze({status:'OWNER_RETAINED',route:'C139_OWNER',...notOwner,input_sha256:hash(humanInput),input_bytes:size});
 if(size>physicalLimitBytes)return stop('C141_EXACT_INPUT_REQUIRES_BUDGET_NEGOTIATION',{input_sha256:hash(humanInput),input_bytes:size,physicalLimitBytes});
 const conflict=c107Family==='SELF_ONTOLOGY' && c132Route==='GENERAL_ONTOLOGY';
 // Shadow C132 never grants runtime authority by itself. An explicit opt-in is independent.
 if(conflict && !openScope)return stop('C141_GENERAL_CONFLICT_OWNER_REVIEW',{input_sha256:hash(humanInput),input_bytes:size,shadow:'C132_GENERAL_ONTOLOGY',owner:'C135'});
 if(size>600 || openScope)return Object.freeze({status:'SHADOW_CANDIDATE',route:'C140_OPEN_EDU_CANDIDATE',...notOwner,input_sha256:hash(humanInput),input_bytes:size,c132_authority:false,topic_whitelist:false});
 return Object.freeze({status:'OWNER_RETAINED',route:'C107_OWNER',...notOwner,input_sha256:hash(humanInput),input_bytes:size});
}

// Pure transport research: content is returned temporarily to caller, never persisted in evidence.
export function planC141Fragments(input,{fragmentBytes=4096,maxFragments=64,maxTotalBytes=262144}={}){
 if(!utf8(input) || !Number.isSafeInteger(fragmentBytes)||fragmentBytes<4||fragmentBytes>32768||!Number.isSafeInteger(maxFragments)||maxFragments<1||maxFragments>128||!Number.isSafeInteger(maxTotalBytes)||maxTotalBytes<600||maxTotalBytes>262144)return stop('C141_FRAGMENT_CAPABILITY_INVALID');
 const total=Buffer.byteLength(input,'utf8');
 if(total>maxTotalBytes)return stop('C141_PHYSICAL_RESOURCE_DENIAL',{input_bytes:total,limit_bytes:maxTotalBytes,input_sha256:hash(input)});
 const chunks=[];
 let buf='',bytes=0;
 for(const c of input){
   const size=Buffer.byteLength(c,'utf8');
   if(size>fragmentBytes)return stop('C141_FRAGMENT_ATOMIC_CODEPOINT');
   if(buf&&bytes+size>fragmentBytes){chunks.push(buf);buf='';bytes=0;}
   buf+=c;bytes+=size;
 }
 if(buf)chunks.push(buf);
 if(chunks.length>maxFragments)return stop('C141_FRAGMENT_COUNT_DENIAL',{chunks:chunks.length,maxFragments,input_sha256:hash(input)});
 return Object.freeze({status:'FRAGMENTED_NOT_EXECUTED',schema:'ikant-c141-shadow-input/v1',content_sha256:hash(input),input_bytes:total,chunk_count:chunks.length,chunk_sha256:chunks.map(hash),chunks,original_c70_executed:false,semantic_continuity_attested:false,...notOwner});
}
export function rejoinC141Fragments(plan){
 if(!plan||plan.schema!=='ikant-c141-shadow-input/v1'||!Array.isArray(plan.chunks)||!Array.isArray(plan.chunk_sha256)||plan.chunks.length!==plan.chunk_sha256.length)return stop('C141_NOT_VALID_FRAGMENT_PLAN');
 if(plan.chunks.some((s,i)=>!utf8(s)||hash(s)!==plan.chunk_sha256[i]))return stop('C141_CHUNK_HASH_MISMATCH');
 const restored=plan.chunks.join('');
 if(hash(restored)!==plan.content_sha256||Buffer.byteLength(restored,'utf8')!==plan.input_bytes)return stop('C141_FULL_INPUT_MISMATCH');
 return Object.freeze({status:'BYTE_EXACT_REJOIN_NOT_SEMANTIC_PROOF',input_sha256:hash(restored),input_bytes:plan.input_bytes,original_c70_executed:false,semantic_continuity_attested:false});
}
export function c141EpistemicDisclosure({answer,independentEvaluator=false}={}){
 if(typeof answer!=='string'||!answer.trim())return stop('C141_EMPTY_ANSWER');
 const sections={evidence:/\b(?:evidenz[ae]|osservazion[ei]|data|evidence)\b/iu.test(answer),inference:/\b(?:inferenza|ipotesi|inference|hypothesis)\b/iu.test(answer),uncertainty:/\b(?:incert\w*|unknown|non attestat[oa]|uncertain)\b/iu.test(answer),falsifier:/\b(?:falsific|controesempio|counterexample|falsif)\b/iu.test(answer)};
 return Object.freeze({status:'HEURISTIC_ONLY',sections,formal_markers_present:Object.values(sections).every(Boolean),semantic_correctness:'NOT_ATTESTED',independent_evaluation_attested:independentEvaluator===true? 'NEEDS_EVIDENCE':'NO',authority:0});
}
