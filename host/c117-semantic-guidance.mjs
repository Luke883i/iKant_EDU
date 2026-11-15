/** C117 PRE-PR — bounded, model-agnostic semantic steering instructions.
 * Original C70 output is the only routing input. This guide is a downstream
 * interpretation by host adapter, NOT another cognition owner or truth oracle.
 * It makes the intended influence on host generation explicit and testable.
 */
import crypto from 'node:crypto';
const sha=x=>crypto.createHash('sha256').update(Buffer.from(x,'utf8')).digest('hex');
const modes=Object.freeze({
 DIRECT_IDENTITY:Object.freeze({id:'IDENTITY_WITH_UNCERTAINTY',instruction:'Distinguish replaceable host language engine, the verified iKant method, and unverified subjective experience. Use original C114 exact format when that original route requires it.'}),
 CRITIQUE:Object.freeze({id:'CRITIQUE_WITH_LIMITS',instruction:'Answer the central critique first using specific arguments; distinguish verified facts, reasonable hypotheses, strongest counterexample and uncertainties. Explain what would change the conclusion. Never claim an unexecuted action.'}),
 PRACTICAL_REVIEW:Object.freeze({id:'PRACTICAL_REVIEW_WITH_TRADEOFFS',instruction:'Offer a bounded practical answer first: steps, expected benefits, tradeoffs, counterexamples and verification of uncertain assumptions. Never invent a tool result.'}),
 HORIZON_BLOCK:Object.freeze({id:'HORIZON_UNVERIFIED',instruction:'Do not invent future facts or tool receipts. When safe, give bounded scenarios or hypotheses labeled as such, with discriminating evidence that would falsify them; identify the first open evidence gap.'}),
 SYNTHESIS_REPAIR:Object.freeze({id:'SYNTHESIS_WITH_UNCERTAINTY',instruction:'Synthesize concrete evidence into a useful answer, distinguishing observed facts from inference and assumptions; include a serious alternative explanation and the evidence that would decide.'})
});
const DEFAULT=Object.freeze({id:'DIRECT_RELEVANT_ANSWER',instruction:'Make a relevant good-faith attempt at the precise human question with concrete reasoning when permitted. Mark uncertainty, test a possible counterexample, and name missing evidence without turning UNKNOWN into a generic non-answer. Do not invent provenance, provider identity or ACTIVE state.'});
const limited=s=>typeof s==='string'&&s.length<=100&&/^[A-Za-z0-9_]+$/.test(s);
export function compileC117SemanticGuide(plan){
 if(!plan||plan.schema!=='ikant-le-c107-c70-before-language/v1'||
   !/^[0-9a-f]{64}$/.test(plan.input_sha256||'')||
   !/^[0-9a-f]{64}$/.test(plan.c70_output_sha256||'')||
   !limited(plan.central_mode)||!limited(plan.method)||!limited(plan.response_family)||
   typeof plan.resource_gap!=='boolean'||!Number.isSafeInteger(plan.cognitive_window_length)||
   plan.cognitive_window_length<1||plan.cognitive_window_length>5)throw new TypeError('invalid original C70 plan');
 const chosen=plan.method==='DIRECT_IDENTITY'?modes.DIRECT_IDENTITY:
   modes[plan.central_mode]||DEFAULT;
 const plan_sha256=sha(JSON.stringify(plan));
 return Object.freeze({schema:'ikant-le-c117-semantic-guide/v1',
  source:'ORIGINAL_C70_BEFORE_HOST_GENERATION',plan_sha256,
  original_c70_output_sha256:plan.c70_output_sha256,
  response_family:plan.response_family,route_id:chosen.id,instruction:chosen.instruction,
  mandatory_original_c114_when_applicable:plan.method==='DIRECT_IDENTITY',
  generated_text_semantically_certified:false,authority:0});
}
export function c117PlanDigest(plan){return compileC117SemanticGuide(plan).plan_sha256;}
/** Offline counterfactual only: no C87, no host model provider and no claims of
 * general model causal efficacy. Same fixed input; vary only plan guidance.
 * `generateFixture` must be a deterministic, explicitly labeled test double.
 */
export function evaluateC117ControlledCounterfactual({plan,input,generateFixture}={}){
 if(typeof input!=='string'||!input.trim()||typeof generateFixture!=='function')
  throw new TypeError('fixture and input required');
 const guide=compileC117SemanticGuide(plan);
 if(sha(input)!==plan.input_sha256)throw new TypeError('input does not bind to plan');
 const withPlan=generateFixture({input,guide});
 const withoutPlan=generateFixture({input,guide:null});
 if(typeof withPlan!=='string'||typeof withoutPlan!=='string')throw new TypeError('fixture did not return text');
 return Object.freeze({schema:'ikant-le-c117-controlled-counterfactual/v1',
  status:'CONTROLLED_FIXTURE_ONLY_NOT_REAL_MODEL_SEMANTIC_PROOF',
  input_sha256:sha(input),plan_sha256:guide.plan_sha256,
  conditioned_output_sha256:sha(withPlan),control_output_sha256:sha(withoutPlan),
  output_bytes_differ:withPlan!==withoutPlan,real_host_model_tested:false,
  independent_human_semantic_review:false,native_chat_hook_attested:false,
  semantics_generalized:false,authority:0});
}
