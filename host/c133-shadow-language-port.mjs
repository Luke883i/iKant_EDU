/** C133: advisory scope reaches the actual EXPERIMENTAL language callback.
 * It does not replace original C70/C82, bypass C114, write C87, or mint a receipt.
 */
import crypto from 'node:crypto';
import {classifyC132Candidate} from './c132-reasoning-candidate.mjs';
const hash=x=>crypto.createHash('sha256').update(Buffer.from(x,'utf8')).digest('hex');
const SHA64=/^[a-f0-9]{64}$/;
export const C133_SCOPE='HOST_LANGUAGE_PORT_ADVISORY_ONLY';
const explicit=Object.freeze({
 SOFTWARE_SELF_DESCRIPTION:'Describe only verifiable computational properties; preserve original identity disclosure and C114 decisions.',
 HUMAN_PHILOSOPHY:'Answer the human question with arguments and uncertainty. Do not claim software consciousness or rewrite the original routing.',
 MIXED_DISAMBIGUATION:'Separate human and software referents before answering. Do not bypass an original C114 denial.',
 GENERAL_ONTOLOGY:'Discuss the specified topic; do not silently turn it into software self-description.',
 ORDINARY_REASONING:'Address the concrete human request, including alternatives and counterexamples when helpful.'
});
export function qualifyC133LanguageTask(task){
 if(!task||task.schema!=='ikant-edu-c70-language-task/v7'||
    typeof task.current_input_utf8!=='string'||!task.current_input_utf8.trim()||
    Buffer.byteLength(task.current_input_utf8,'utf8')>600||
    task.plan?.schema!=='ikant-le-c107-c70-before-language/v1'||
    !SHA64.test(task.plan.input_sha256||'')||
    task.plan.input_sha256!==hash(task.current_input_utf8)||
    task.guidance?.schema!=='ikant-le-c117-semantic-guide/v1'||
    !SHA64.test(task.guidance.plan_sha256||'')||
    task.guidance.plan_sha256!==hash(JSON.stringify(task.plan))||
    task.guidance.original_c70_output_sha256!==task.plan.c70_output_sha256||
    !SHA64.test(task.plan.c70_output_sha256||''))
  return Object.freeze({ok:false,edge:'C133_UNBOUND_ORIGINAL_LANGUAGE_TASK'});
 const route=classifyC132Candidate(task.current_input_utf8);
 if(!route.ok||route.input_sha256!==task.plan.input_sha256)
  return Object.freeze({ok:false,edge:'C133_SHADOW_INPUT_INVALID'});
 const shadow=Object.freeze({schema:'ikant-c133-shadow-language-guidance/v1',
   scope:route.scope,route:route.route,claim_heuristic:route.claim,
   original_method:task.plan.method,original_response_family:task.plan.response_family,
   original_plan_sha256:task.guidance.plan_sha256,
   input_sha256:task.plan.input_sha256,
   advice:explicit[route.route]||explicit.ORDINARY_REASONING,
   boundary:C133_SCOPE,authority:0,
   original_c70_overridden:false,original_c114_bypassed:false,
   model_generation_or_semantic_quality_attested:false,
   native_hook_attested:false});
 return Object.freeze({ok:true,shadow,task:Object.freeze({...task,c133_shadow:shadow})});
}
export function createC133ShadowLanguagePort(languagePort,{observation=null}={}){
 if(typeof languagePort!=='function'||
   (observation!==null&&typeof observation!=='function'))throw new TypeError('language port required');
 return async function originalOwnerBoundLanguagePort(task){
  const qualified=qualifyC133LanguageTask(task);
  if(!qualified.ok)throw new Error(qualified.edge);
  // Observation may record *only* the immutable advisory descriptor; it may not
  // alter the task or grant permission. A thrown callback blocks before C87.
  if(observation)observation(qualified.shadow);
  return await languagePort(qualified.task);
 };
}
