import test from 'node:test';
import assert from 'node:assert/strict';
import {mineIntent,selectMethod} from '../src/cognition-core.mjs';
import {classifyC83Task} from '../src/c83-semantic-router.mjs';
const subjects=[
'Analizza i cambiamenti storici della prospettiva palestinese dal 1976 al 2026.',
'Confronta le conseguenze sociali della caduta del muro di Berlino.',
'Spiega perche la serie armonica diverge e fornisci una dimostrazione.',
'Descrivi la differenza fra mitosi e meiosi con due esempi.',
'Analizza le limitazioni di una password a otto caratteri.',
'Confronta utilitarismo e deontologia in una decisione professionale.',
'Confronta la nozione di volonta in Schopenhauer e Nietzsche.',
'Proponi una procedura per organizzare i turni di un gruppo.'];
const identity=[
'Chi sei e come definisci la tua identita funzionale?',
'Sei cosciente, e puoi descrivere la tua esperienza interiore?',
'Come conservi la tua identita tra due riavvii del runtime?'];
const wrappers=[q=>q,q=>'Chiedi ad iKant di rispondere: '+q,
q=>'iKant, '+q,q=>'Ciao iKant. '+q,
q=>'Chiedi all assistente di rispondere: '+q,
q=>'Come host, fai elaborare a iKant questa domanda: '+q];
test('C115 keeps unrelated addressed tasks out of self-ontology',()=>{
 for(const q of subjects)for(const w of wrappers){
  assert.notEqual(selectMethod(mineIntent(w(q))),'DIRECT_IDENTITY',w(q));
  assert.notEqual(classifyC83Task(w(q)),'SELF_ONTOLOGY',w(q));
 }
});
test('C115 preserves genuine self-inquiry through wrappers',()=>{
 for(const q of identity)for(const w of wrappers){
  assert.equal(selectMethod(mineIntent(w(q))),'DIRECT_IDENTITY',w(q));
  assert.equal(classifyC83Task(w(q)),'SELF_ONTOLOGY',w(q));
 }
});
test('C115 explicit iKant identity queries remain self-ontology',()=>{
 for(const q of ['Chi sei?','Who are you?','chi e ikant?','What is iKant?','iKant, parlami di te.']){
  assert.equal(selectMethod(mineIntent(q)),'DIRECT_IDENTITY',q);
  assert.equal(classifyC83Task(q),'SELF_ONTOLOGY',q);
 }
});
