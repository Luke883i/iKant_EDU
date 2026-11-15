import test from 'node:test';import assert from 'node:assert/strict';
import {qualifyHumanFacingIdentity} from '../host/p1-public-language-guard.mjs';
test('identity jargon denied before C87, with no text rewriting',()=>{
 assert.equal(qualifyHumanFacingIdentity({method:'DIRECT_IDENTITY',text:'Sono software, non posso dimostrare esperienza soggettiva.'}).ok,true);
 for(const text of ['Sono C70.','Il mio readback funziona.','Uso un kernel.','Sono HOST_BOUND.'])
  assert.equal(qualifyHumanFacingIdentity({method:'DIRECT_IDENTITY',text}).ok,false,text);
 assert.equal(qualifyHumanFacingIdentity({method:'PRACTICAL_REVIEW',text:'C70'}).ok,true);
});

test('iKant DIRECT_IDENTITY may not call itself the HOST language model',()=>{
 for(const text of ['Identita funzionale: Sono GPT-6, un modello.','Sono ChatGPT.',
  'I am GPT-6', 'Sono un modello linguistico addestrato dall HOST.']){
  const r=qualifyHumanFacingIdentity({method:'DIRECT_IDENTITY',text});
  assert.equal(r.ok,false,text);assert.equal(r.reason,'IKANT_HOST_MODEL_IDENTITY_CONFUSION');
 }
 assert.equal(qualifyHumanFacingIdentity({method:'RETRIEVE',text:'Sono GPT-6.'}).ok,false);
 assert.equal(qualifyHumanFacingIdentity({method:'DIRECT_IDENTITY',
  text:'Sono iKant, runtime conversazionale con un modello HOST sostituibile.'}).ok,true);
});
