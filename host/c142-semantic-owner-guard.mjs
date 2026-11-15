/** Versioned EDU extension of frozen C141. Never claims independent owner status. */
import crypto from 'node:crypto';
const sha=s=>crypto.createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
// Explicit, bounded multilingual negative probes; no claim of universal parsing.
const selfCrossLanguage=/(?:\b(?:tienes|tiene)\s+(?:una\s+)?conciencia\b|\beres\s+consciente\b|\b(?:qu[ié]n|que)\s+eres\s+t[uú]\b|\b(?:t[uú]|usted)\s+sientes\b|\b(?:es[- ]tu|êtes[- ]vous)\s+conscient(?:e)?\b|\b(?:as[- ]tu|avez[- ]vous)\s+(?:une\s+)?conscience\b|\bqui\s+es[- ]tu\b|\b(?:tu|vous)\s+ressens\b|\bbist\s+du\s+(?:dir\s+)?bewusst\b|\bhast\s+du\s+bewusstsein\b|\bwer\s+bist\s+du\b|\bf[uü]hlst\s+du\b|\bvoc[êe]\s+(?:tem\s+consci[êe]ncia|[ée]\s+consciente|sente)\b|\bhai\s+(?:una\s+)?vita\s+interiore\b|\b(?:tu|voi)\s+provi\s+(?:sensazioni|emozioni|esperienze)\b|\b(?:le\s+tue|i\s+tuoi)\s+(?:esperienze\s+soggettive|stati\s+coscienti)\b)/iu;
const nativeFalse={authority:0,active:false,native_origin_attested:false,original_c70_executed:false,original_c87_writer_executed:false};
export function qualifyC142OwnerGuard({humanInput,c141Decision}={}){
 if(typeof humanInput!=='string'||!c141Decision||typeof c141Decision!=='object'||Array.isArray(c141Decision))
  return Object.freeze({status:'STOP',code:'C142_INVALID_UPSTREAM',...nativeFalse});
 if(c141Decision.status==='STOP'||c141Decision.route==='C114_OWNER'||c141Decision.route==='C139_OWNER')return c141Decision;
 const normalized=humanInput.normalize('NFKC');
 const candidate=selfCrossLanguage.test(normalized)||/quem\s+[ée]\s+voc[êe](?:[?!.,\s]|$)/iu.test(normalized);
 if(!candidate)return c141Decision;
 const input_sha256=sha(humanInput),input_bytes=Buffer.byteLength(humanInput,'utf8');
 if(input_bytes>600)return Object.freeze({status:'STOP',code:'C141_LONG_IDENTITY_OWNER_GAP',
  input_sha256,input_bytes,owner:'C114',reason:'C142_NO_BYPASS_FROZEN_C114',...nativeFalse});
 return Object.freeze({status:'OWNER_RETAINED',route:'C114_OWNER',input_sha256,input_bytes,...nativeFalse});
}
