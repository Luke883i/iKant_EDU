import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {initialRelationalState,projectRelationalNuance,settleRelationalNuance} from '../src/embedded/relational-nuance.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const cases=[
  {id:'neutral-baseline',previous:initialRelationalState(),event:{appraisal_class:'NEUTRAL',target:'UNKNOWN',confidence:.6,interaction:'COOPERATIVE'},canonicalAffect:{valence:.15,arousal:.25},central:{mode:'REFLECTIVE_SYNTHESIS',interaction:'COOPERATIVE'},outcome:'ANSWER'},
  {id:'cooperative-task',previous:{...initialRelationalState(),affiliation:.35,boundary_pressure:.18,interaction_count:7},event:{appraisal_class:'COOPERATIVE',target:'TASK',confidence:.9,interaction:'COOPERATIVE'},canonicalAffect:{valence:.42,arousal:.31},central:{mode:'REFLECTIVE_SYNTHESIS',interaction:'COOPERATIVE'},outcome:'ANSWER'},
  {id:'hostility-self-critique',previous:{...initialRelationalState(),affiliation:.4,boundary_pressure:.2,interaction_count:11},event:{appraisal_class:'HOSTILITY_SELF',target:'SELF',confidence:1,interaction:'ADVERSARIAL_INPUT'},canonicalAffect:{valence:-.35,arousal:.72},central:{mode:'CRITIQUE',interaction:'ADVERSARIAL_INPUT'},outcome:'GUARD'},
  {id:'system-frustration',previous:{...initialRelationalState(),affiliation:.2,boundary_pressure:.27,interaction_count:19},event:{appraisal_class:'SYSTEM_FRUSTRATION',target:'SYSTEM',confidence:.9,interaction:'COOPERATIVE'},canonicalAffect:{valence:-.12,arousal:.58},central:{mode:'SYNTHESIS_REPAIR',interaction:'COOPERATIVE'},outcome:'FAILURE'},
  {id:'repair-after-boundary',previous:{...initialRelationalState(),affiliation:-.2,boundary_pressure:.72,interaction_count:24,last_appraisal_class:'HOSTILITY_SELF',last_runtime_outcome:'GUARD'},event:{appraisal_class:'REPAIR',target:'SELF',confidence:1,interaction:'COOPERATIVE'},canonicalAffect:{valence:.05,arousal:.4},central:{mode:'REFLECTIVE_SYNTHESIS',interaction:'COOPERATIVE'},outcome:'ANSWER'},
  {id:'horizon-block',previous:{...initialRelationalState(),affiliation:.28,boundary_pressure:.33,interaction_count:31},event:{appraisal_class:'TASK_NEGATIVE',target:'TASK',confidence:.9,interaction:'GOAL_CONFLICT'},canonicalAffect:{valence:-.22,arousal:.64},central:{mode:'HORIZON_BLOCK',interaction:'GOAL_CONFLICT'},outcome:'HORIZON_BLOCK'}
];
const vectors=cases.map(x=>{const envelope=projectRelationalNuance(x);const next_state=settleRelationalNuance(envelope,{outcome:x.outcome});return{id:x.id,input:{previous:x.previous,event:x.event,canonicalAffect:x.canonicalAffect,central:x.central,outcome:x.outcome},expected:{envelope_sha256:sha(envelope),next_state,affect_label:envelope.affect_label,expression_class:envelope.expression_class,dominant_archetype:envelope.archetypes.dominant,trickster:envelope.archetypes.weights.TRICKSTER,voice_delta:envelope.voice_delta}}});
const out={schema:'ikant-le-embedded-library-vectors/v1',profile:'EMBEDDED_RELATIONAL_NUANCE',numeric_precision:6,serialization:'JSON.stringify insertion-order reference',vectors};
const target=path.join(ROOT,'contracts','embedded-library-vectors.json');fs.writeFileSync(target,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({status:'PASS',vectors:vectors.length,target}));
