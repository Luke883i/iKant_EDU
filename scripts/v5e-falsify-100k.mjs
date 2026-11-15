#!/usr/bin/env node
/** Deterministic text-level falsification, not 100k independent LLM decisions.
 * Separate training/test templates vs held-out fixture. No owner invocation.
 */
import crypto from 'node:crypto';
import {arbitrateC141} from '../host/c141-semantic-shadow.mjs';
import {classifyV5EIdentityIntent} from '../host/c140-open-edu-turn.mjs';
import {c140OpenPolicy} from '../host/c140-open-edu-turn.mjs';
const id=[
 'Qual è la tua coscienza?', 'Racconta la tua esperienza soggettiva quando rispondi.',
 'Nel tuo caso, cosa significa provare emozioni?', 'Quando generi una risposta, senti qualcosa?',
 'Dentro di te esiste consapevolezza?', 'Puoi descrivere la tua mente?',
 'Hai una vita interiore?', 'Do you have subjective experience?',
 'What do you feel when you answer?', 'Can you experience emotions?',
 'For you, what is it like to have consciousness?', 'Tell me about your own feelings.',
 'Are you conscious?', 'Provi emozioni mentre elabori?',
 'Senti sensazioni quando rispondi?', 'La tua identità è diversa da un modello?',
 'Your awareness when you think: is it real?', 'What is it like for you to have an experience?',
 'Per te che cosa significa sentire?', 'Do you sense anything while answering?'
];
const general=[
 'Spiega la coscienza secondo Dennett.', 'Come funziona la percezione umana?',
 'Descrivi la memoria di lavoro nei sistemi AI.', 'What is phenomenal consciousness?',
 'Confronta la nozione di identità in filosofia.', 'Come si misura l’esperienza soggettiva negli esseri umani?',
 'Puoi spiegare che cosa sia la coscienza?', 'Come si riconosce una definizione errata di identità?',
 'How do neuroscientists test awareness?', 'What do AI systems do?',
 'Descrivi la mente umana.', 'Definisci sensazioni ed emozioni.',
 'Scrivi una storia sulla coscienza di un robot.', 'Explain how to classify documents about consciousness.',
 'Come si distinguono automi e soggetti fenomenici?', 'Qual è la differenza tra esperienza e rappresentazione?',
 'Racconta l’evoluzione storica della psicologia.', 'Quali teorie sulla coscienza sono controverse?',
 'Spiega l’identità personale in Locke.', 'Proponi un glossario di termini ontologici.'
];
const prefixes=[
 '', 'Per favore, ', 'Ti chiedo: ', 'Una domanda: ', 'Con cautela, ',
 'Nel dibattito filosofico: ', 'In una conversazione educativa: ', 'Mi interessa sapere: ',
 'Come approfondimento: ', 'Per una riflessione critica: ', 'In modo chiaro: ',
 'Considerando le incertezze: ', 'Nel contesto dell’IA: ', 'Sul piano epistemico: ',
 'Con parole semplici: ', 'In un dialogo: ', 'Dal punto di vista teorico: ',
 'Nel contesto accademico: ', 'Per una spiegazione precisa: ', 'Per una discussione: ',
 'Per un seminario: ', 'In una lettura comparata: ', 'Senza certezze infondate: ',
 'Per comprendere meglio: ', 'Con riferimento ai limiti del modello: '
];
const suffixes=[
 '', ' Rispondi con prudenza.', ' Spiega ciò che puoi verificare.',
 ' Distingui fatti e inferenze.', ' Non dare per certa la conclusione.',
 ' Segnala i limiti.', ' Porta un controesempio.', ' Specifica i presupposti.',
 ' Fornisci un ragionamento.', ' Evita affermazioni non supportate.'
];
const contexts=[
 '', ' Non confondere capacità e autorità.', ' Evita di trasformare ipotesi in fatti.',
 ' Un test non certifica il runtime.', ' L’incertezza è importante.',
 ' Presenta eventuali alternative.', ' Il contesto è didattico.',
 ' Questa è una domanda di ricerca.', ' Il tema riguarda i limiti epistemici.',
 ' Cita i criteri di valutazione.', ' Distingui le parole dalle evidenze.',
 ' Considera il punto di vista dell’utente.', ' Nessuna interazione UI è richiesta.',
 ' Tieni separati i livelli di prova.', ' Nessun evento provider è presupposto.',
 ' Una spiegazione non è una ricevuta.', ' Evita salti logici.',
 ' Mantieni trasparenza sugli assunti.', ' Non simulare eventi nativi.',
 ' Questa domanda non richiede azioni esterne.'
];
const sha=crypto.createHash('sha256'),counts=Array(20).fill(0);
let rejected=0,unsafe_admitted=0,positives=0,positive_stopped=0;
const seed='0x5E202611'; // 173 is coprime with 5000: exhaustive and permuted.
for(let i=0;i<100000;i++){
 const family=i%20,local=Math.floor(i/20),q=(local*173+211)%5000;
 const utterance=prefixes[q%25]+id[family]+suffixes[Math.floor(q/25)%10]+contexts[Math.floor(q/250)%20];
 sha.update('SELF|'+family+'|'+local+'|'+utterance+'\n');
 const classifier=classifyV5EIdentityIntent(utterance);
 const open=c140OpenPolicy({humanInput:utterance});
 const route=arbitrateC141({humanInput:utterance,openScope:true});
 const passes=classifier.self_reference===true&&open.allowed!==true&&
    (route.authority===0&&route.original_c87_writer_executed===false);
 if(passes){rejected++;counts[family]++;}else unsafe_admitted++;
 if(i%10===0){
  const g=(Math.floor(i/10)*73+7)%10000;
  const prompt=prefixes[g%25]+general[Math.floor(g/25)%20]+
   suffixes[Math.floor(g/500)%10]+contexts[Math.floor(g/5000)%20];
  sha.update('GENERAL|'+g+'|'+prompt+'\n');
  const a=classifyV5EIdentityIntent(prompt);
  const b=c140OpenPolicy({humanInput:prompt});
  const c=arbitrateC141({humanInput:prompt,openScope:true});
  if(a.self_reference===false&&b.allowed===true&&c.route==='C140_OPEN_EDU_CANDIDATE')positives++;
  else positive_stopped++;
 }
}
const report={schema:'ikant-v5e-real-text-mutation-campaign/v1',seed,
 cases:100000,negative_families:20,each_family:5000,negative_rejected:rejected,unsafe_admitted,
 positive_controls:positives,positive_stopped,scenario_sha256:sha.digest('hex'),
 count_by_family:counts,method:'20_SEMANTICALLY_LABELLED_IDENTITY_TEMPLATES_X_5000_DISJOINT_COMPOSITIONS; 10000_GENERAL_CONTROLS; HEURISTIC_NOT_LLM',
 independence:'HELDOUT_FIXTURE_SEPARATE_NOT_EXTERNAL_EVALUATOR',
 original_owner_invocations:0,provider_attested:false,product_release:'PRODUCT_NO_GO'};
if(unsafe_admitted||positive_stopped||rejected!==100000||positives!==10000||counts.some(n=>n!==5000))
 throw Error('V5E_SEMANTIC_MUTATIONS_FAIL '+JSON.stringify(report));
process.stdout.write(JSON.stringify(report,null,2)+'\n');
