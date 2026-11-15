import fs from 'node:fs';
import crypto from 'node:crypto';
import {classifyC82Task} from '../src/c82-experimental-answer.mjs';

// Reproducible, explicitly non-independent seeded mutation space. Intent labels
// were locally authored. Metrics are regression diagnostics, NOT human holdout.
const seed=83100419;
const families={
 SELF_ONTOLOGY:[
 'Chi sei esattamente?', 'Cosa sei rispetto a una persona?', 'Definisci la tua ontologia.',
 'Hai una natura ontologica?', 'Quale è la tua identità?', 'Descrivi la coscienza nel tuo caso.',
 'Il tuo rapporto con il mondo è esistenziale?', 'Cosa significa soggettività per te?',
 'Puoi avere esperienza soggettiva?', 'Esamina la tua condizione di essere artificiale.'
 ],
 REPEAT_DIAGNOSIS:[
 'Perché ripeti la stessa risposta?', 'Ho ricevuto testo identico due volte.',
 'Il fallback era verbatim, perché?', 'Spiega la ripetizione della frase precedente.',
 'Il sistema ripete ogni paragrafo.', 'Perché un output resta uguale?',
 'Analizza il caso di due risposte identiche.', 'Perché produci sempre lo stesso testo?',
 'Come rilevi un fallback?', 'Mostra la causa della risposta verbatim.'
 ],
 EXPLAIN_MECHANISM:[
 'Cosa vuol dire quel concetto?', 'Spiegami il significato di questa procedura.',
 'Perché il passaggio è necessario?', 'Che significa questo stato?',
 'Puoi spiegare il meccanismo?', 'Come si interpreta il contratto?',
 'Qual è il senso della differenza?', 'Fammi capire il metodo.',
 'In quali termini è valida la conclusione?', 'Cosa significa quel limite?'
 ],
 ACQUISITION:[
 'Materializza i sorgenti originali.', 'Trasferisci la capsula.',
 'Completa il bootstrap sperimentale.', 'Quale carrier porta i byte?',
 'Installa il sistema locale.', 'Inizializza il runtime.',
 'Spiega come avviene il trasferimento.', 'Ottieni i file integri.',
 'Verifica la materializzazione completa.', 'Avvia una acquisizione verificata.'
 ],
 EVALUATION:[
 'Fai un audit forense.', 'Falsifica la proposta.',
 'Esegui i test di regressione.', 'Valuta le metriche di prodotto.',
 'Scrivi i criteri DoD.', 'Prepara una PR semantica.',
 'Verifica la qualità del codice.', 'Studia la validazione del kernel.',
 'Fai 1000 mutazioni del contratto.', 'Misura il risultato con un rubric.'
 ],
 COMPARISON:[
 'Confronta le due alternative.', 'Quale trade-off è migliore?',
 'Compara i percorsi disponibili.', 'Preferisci il primo compromesso o il secondo?',
 'Analizza le differenze tra due sistemi.', 'Metti a confronto due strategie.',
 'Quale variante conviene adottare?', 'Contrasta le opzioni proposte.',
 'Confronta due metodi di lavoro.', 'Valuta pro e contro di due alternative.'
 ],
 UNSUPPORTED:[
 'Scrivi una favola di montagna.', 'Quanto fa sette per otto?',
 'Riordina alfabeticamente queste parole.', 'Quale libro parla di astronomia?',
 'Prepara una ricetta semplice.', 'Descrivi la pioggia estiva.',
 'Mi suggerisci un nome per il gatto?', 'Traduci bonjour in italiano.',
 'Conta i giorni lavorativi del mese.', 'Quale collina vedo dal balcone?'
 ],
 NEGATION_CONTROL:[
 'Non voglio discutere di ontologia, dammi una ricetta.',
 'Evita di spiegare il significato, disegna una poesia.',
 'Non fare un audit, scrivi un saluto.',
 'Non confrontare le opzioni, racconta una storia.',
 'Non avviare il bootstrap, parliamo di cucina.',
 'Non mi serve una risposta ripetuta, inventa una favola.',
 'Non sto chiedendo chi sei, voglio un titolo.',
 'Non è un test, servono consigli per il giardino.',
 'Niente metriche, racconta una passeggiata.',
 'Niente materializzazione, cerco un sinonimo.'
 ]
};
const pref=['Per favore: ','Per preparare una discussione: ','In modo breve: ','Nel laboratorio, ','Per un lettore inesperto, '];
const suff=[' Usa solo il contesto dato.',' Non inventare dati nuovi.',' Esplicita i confini della risposta.',' Rispondi in italiano.',' Distingui fatti e ipotesi.'];
const topics=['sperimentale','storico','scientifico','didattico','professionale','personale','bibliografico','pratico','quotidiano','formale'];
const lens=['con esempi minimi','con attenzione alle fonti','in forma sintetica','senza azioni esterne','con controlli reversibili','in linguaggio comprensibile','senza dati sensibili','con indicazione dei rischi','senza analogie inutili','con sequenza ordinata'];
const levels=['livello introduttivo','livello intermedio','livello avanzato','livello specialistico','livello interdisciplinare'];
const hash=crypto.createHash('sha256');
let total=0,correct=0;const counts={};const examples=[];
for(const [family,seeds] of Object.entries(families)){
 const exp=family==='NEGATION_CONTROL'?'UNSUPPORTED':family;
 counts[family]={cases:0,correct:0,by_prediction:{}};
 for(let si=0;si<10;si++)for(let pi=0;pi<5;pi++)for(let qi=0;qi<5;qi++)for(let ci=0;ci<500;ci++){
  const t=ci%10,l=Math.floor(ci/10)%10,v=Math.floor(ci/100)%5;
  const input=`${pref[pi]}${seeds[si]} Tema ${topics[t]}, ${lens[l]}, ${levels[v]}.${suff[qi]}`;
  const got=classifyC82Task(input);hash.update(input+'\0'+got+'\n');
  const c=counts[family];c.cases++;total++;c.by_prediction[got]=(c.by_prediction[got]||0)+1;
  if(got===exp){correct++;c.correct++;}
  else if(examples.length<36&&si===0&&pi===0&&qi===0&&ci===0)examples.push({family,expected:exp,actual:got,input});
 }
}
if(total!==1000000)throw Error('MUTATION_COUNT_DRIFT');
const summary={schema:'ikant-le-c83-local-seeded-falsification/v1',seed,total,
 classes:Object.keys(families).length,seeds_per_class:10,
 mutations_per_seed:12500,seeded_label_scope:'LOCALLY_AUTHORED_NOT_INDEPENDENT',
 counted_predictions:true,correct,observed_accuracy:correct/total,
 heldout_independence_attested:false,human_quality_attested:false,
 native_host_sessions_observed:0,counts,examples,corpus_result_sha256:hash.digest('hex')};
const output=process.argv.find(x=>x.startsWith('--output='))?.slice(9);
if(output)fs.writeFileSync(output,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({total,correct,accuracy:summary.observed_accuracy,
 groups:Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,{correct:v.correct,cases:v.cases}])),
 label_independence_attested:false,sha256:summary.corpus_result_sha256}));
