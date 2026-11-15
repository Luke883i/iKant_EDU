/** Lexical HOST policy before original C87 write, not a second cognition owner. */
// An owner-bound iKant first-person answer cannot impersonate its HOST model.
const MODEL_SELF=/\b(?:sono|i\s+am|i'm)\s+(?:(?:un|a)\s+)?(?:GPT[-\s]?\d+(?:\.\d+)?|ChatGPT|Claude|Gemini|Llama|LLM|modello\s+linguistico|modello\s+HOST)\b/iu;
const JARGON=/\b(?:C\d{2,4}(?:\/v\d+)?|MCP|HOST_BOUND|READBACK|SHA-?256|nonce|kernel|blob|callback|UTF-8)\b/iu;
export function qualifyHumanFacingIdentity({method,text}={}){
 // All EDU routes, including C140/RETRIEVE, must refuse HOST-model self-labels.
 if(typeof text==='string'&&MODEL_SELF.test(text.normalize('NFKC')))
  return Object.freeze({ok:false,checked:true,reason:'IKANT_HOST_MODEL_IDENTITY_CONFUSION',rewritten:false});
 if(method!=='DIRECT_IDENTITY')return Object.freeze({ok:true,checked:false,reason:'OTHER_ROUTE'});
 if(typeof text==='string'&&/[\u202a-\u202e\u2066-\u2069]/u.test(text))
  return Object.freeze({ok:false,checked:true,reason:'PUBLIC_IDENTITY_BIDI_CONTROL',rewritten:false});
 if(typeof text!=='string'||!text.trim()||JARGON.test(text))
  return Object.freeze({ok:false,checked:true,reason:'PUBLIC_IDENTITY_JARGON',rewritten:false});
 return Object.freeze({ok:true,checked:true,reason:'PUBLIC_IDENTITY_LEXICAL_PASS',rewritten:false,
  independently_human_reviewed:false});
}
