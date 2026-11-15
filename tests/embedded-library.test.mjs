import test from 'node:test';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {appraiseInteraction,psycheKernel} from '../src/psyche.mjs';
import {initialRelationalState,projectRelationalNuance,settleRelationalNuance,validateRelationalState,validateNuanceEnvelope,embeddedLibraryContract} from '../src/embedded/relational-nuance.mjs';

test('LIB.0 leaves standalone psyche API intact',()=>{
  const a=appraiseInteraction('grazie, ottimo lavoro');
  assert.equal(a.schema,'ikant-le-appraisal/v1');
  assert.equal(psycheKernel().schema,'ikant-le-psyche-kernel/v1');
});

test('embedded profile persists relational state only',()=>{
  const before=initialRelationalState();
  const env=projectRelationalNuance({previous:before,event:{appraisal_class:'COOPERATIVE',target:'TASK',confidence:.9,interaction:'COOPERATIVE'},canonicalAffect:{valence:.42,arousal:.31},central:{mode:'REFLECTIVE_SYNTHESIS',interaction:'COOPERATIVE'}});
  assert.equal(validateNuanceEnvelope(env),true);
  const next=settleRelationalNuance(env,{outcome:'ANSWER'});
  assert.equal(validateRelationalState(next),true);
  assert.equal('valence' in next,false);
  assert.equal('arousal' in next,false);
  assert.equal(next.authority,0);
  assert.notEqual(next.affiliation,before.affiliation);
});

test('raw prompt and authority widening fail closed',()=>{
  assert.throws(()=>projectRelationalNuance({event:{appraisal_class:'NEUTRAL',target:'UNKNOWN',confidence:.7,raw_text:'hello'},canonicalAffect:{valence:0,arousal:.2}}),/RAW_TEXT_FORBIDDEN/);
  const env=projectRelationalNuance({event:{appraisal_class:'NEUTRAL',target:'UNKNOWN',confidence:.7},canonicalAffect:{valence:0,arousal:.2}});
  const bad=structuredClone(env);bad.effects.execution=true;
  assert.equal(validateNuanceEnvelope(bad),false);
});

test('high-risk central modes force trickster zero',()=>{
  for(const mode of ['CRITIQUE','PRACTICAL_REVIEW','HORIZON_BLOCK']){
    const env=projectRelationalNuance({event:{appraisal_class:'HOSTILITY_SELF',target:'SELF',confidence:1},canonicalAffect:{valence:-.4,arousal:.7},central:{mode,interaction:'ADVERSARIAL_INPUT'}});
    assert.equal(env.archetypes.weights.TRICKSTER,0);
    assert.equal(validateNuanceEnvelope(env,{mode}),true);
  }
});

test('embedded contract owns no runtime surface',()=>{
  const c=embeddedLibraryContract();
  for(const k of ['network','filesystem_write','state_write','process_spawn','admission','identity','surface','planner','execution'])assert.equal(c.side_effects[k],false);
  assert.equal(c.authority,0);
  assert.equal(c.transient_host_inputs.raw_prompt_allowed,false);
  assert.deepEqual(c.persistent_state.fields,['affiliation','boundary_pressure','interaction_count','last_appraisal_class','last_runtime_outcome','authority']);
});

test('committed conformance vectors reproduce exactly',()=>{
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const corpus=JSON.parse(fs.readFileSync(path.join(root,'contracts','embedded-library-vectors.json'),'utf8'));
  assert.equal(corpus.schema,'ikant-le-embedded-library-vectors/v1');
  for(const v of corpus.vectors){const env=projectRelationalNuance(v.input);const next=settleRelationalNuance(env,{outcome:v.input.outcome});const digest=crypto.createHash('sha256').update(JSON.stringify(env)).digest('hex');assert.equal(digest,v.expected.envelope_sha256,v.id);assert.deepEqual(next,v.expected.next_state,v.id);assert.equal(env.affect_label,v.expected.affect_label,v.id);assert.equal(env.expression_class,v.expected.expression_class,v.id);assert.equal(env.archetypes.dominant,v.expected.dominant_archetype,v.id);assert.equal(env.archetypes.weights.TRICKSTER,v.expected.trickster,v.id);assert.deepEqual(env.voice_delta,v.expected.voice_delta,v.id);}
});
