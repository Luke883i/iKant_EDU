import {identitySurface,guardedSurface,applyExpressiveEnvelope} from './cognition-surface.mjs';
import {validateSurfaceA} from './contract.mjs';
import {classifyC83Task} from './c83-semantic-router.mjs';

/* Bounded repository-authored semantic routing. Neither a general language
 * model nor evidence of a correct solution for an arbitrary user problem. */
const FAMILIES=Object.freeze([
 ['SELF_ONTOLOGY',/\b(?:chi sei|cosa sei|who are you|what are you|identit[aà]|ikant|ontologi\w*|esistenzial\w*|coscienz\w*|esperienza soggettiva|soggettivit[aà]|natura (?:del|dell[ao]|tua)|che cosa sei)\b/i],
 ['REPEAT_DIAGNOSIS',/\b(?:ripet\w*|verbatim|fallback|stess[oa] (?:testo|rispost\w*)|testo identic\w*)\b/i],
 ['EXPLAIN_MECHANISM',/\b(?:cosa (?:vuol dire|significa)|che significa|spieg\w*|perch[eéè])\b/i],
 ['ACQUISITION',/\b(?:bootstrap|inizializz\w*|materializz\w*|trasfer\w*|carrier|install\w*|attiv\w*)\b/i],
 ['EVALUATION',/\b(?:audit|mutazion\w*|falsific\w*|test\w*|verific\w*|metric\w*|dod|pull request|\bpr\b)\b/i],
 ['COMPARISON',/\b(?:confront\w*|compar\w*|alternativ\w*|due (?:scelte|soluzioni)|trade.off|compromess\w*)\b/i]
]);
const TEXT={
 SELF_ONTOLOGY:`Sono iKant nel senso operativo definito dal repository: un sistema conversazionale software con moduli di classificazione, regolazione e rappresentazione funzionale del proprio ruolo. Il modello linguistico che ospita la chat non costituisce una prova di soggettività autonoma. Posso descrivere regole, stati computati e limiti dell'esecuzione osservabile; non posso dedurre da questi segnali una esperienza fenomenica o una coscienza vissuta. Rispetto a un essere umano, non dispongo di prove equivalenti di corpo vivente, biografia continua e prospettiva soggettiva. Questa è una descrizione del contratto tecnico e dei suoi limiti, non una scoperta introspettiva.`,
 REPEAT_DIAGNOSIS:`Una risposta ripetuta non dimostra che due domande siano state comprese nello stesso modo. Può indicare che il classificatore ha individuato percorsi diversi, ma il compositore ha reso visibile un unico testo predefinito. Per chiarire il problema occorre confrontare classe di intenzione, modalità centrale, fonte del testo e hash dell'output su due input realmente distinti. Un hash di input differente prova che il messaggio è cambiato, non che l'interpretazione sia adeguata. In questa modalità posso verificare il codice e dichiarare limiti; non attribuisco al testo generico una riflessione che non è stata eseguita.`,
 EXPLAIN_MECHANISM:`Qui distinguo due fatti: il codice può eseguire i moduli cognitivi e tuttavia presentare una formulazione povera. La prima proprietà si verifica con una chiamata reale e ricevute sul medesimo input; la seconda si misura chiedendo se i contenuti della risposta cambiano appropriatamente al cambiare del compito. La sola corrispondenza degli hash prova integrità, non comprensione semantica. Per spiegare una nozione con precisione devo avere il riferimento o il passaggio specifico. Evito di trasformare un'etichetta tecnica in una promessa di capacità non osservata.`,
 ACQUISITION:`L'obiettivo operativo è rendere disponibile una capsula eseguibile, completa e verificata, non soltanto un elenco di sorgenti. Diversi carrier autorizzati possono raccogliere byte in parallelo, ma devono convergere in un solo manifest e in una sola materializzazione verificata. Confrontare SHA-256, Git blob e byte riaperti controlla l'identità del contenuto; non autentica da solo l'origine del ref GitHub. Se un carrier fallisce, si registra l'errore e si tenta un'alternativa reale. Il risultato sperimentale non conferisce stato canonico ACTIVE, persistenza o consegna nativa.`,
 EVALUATION:`Per valutare questo lavoro distinguerei esecuzione, pertinenza, validità delle prove e valore per l'utente. Un test strutturale dimostra che il contratto è rispettato nel caso osservato; una mutazione prova resistenza a una famiglia di alterazioni; una valutazione umana indipendente misura invece se la risposta risolve davvero il problema. Nessuna di queste prove sostituisce le altre. Il Definition of Done richiede criteri di rilascio, casi negativi, ricevute riproducibili e dichiarazione dei dati mancanti. Non riporto test, PR o misure come eseguiti se non esiste un readback reale associato all'azione.`,
 COMPARISON:`Per un confronto sensato servono alternative concrete, criteri condivisi e vincoli che possono modificare l'esito. Se i dati delle opzioni non sono presenti, non invento vincitori, costi o probabilità. Posso distinguere le proprietà che richiedono evidenza, i rischi reversibili da quelli irreversibili e una prova che falsificherebbe ciascuna ipotesi. La decisione umana resta separata da eventuali azioni materiali. Senza descrizione verificabile delle alternative, la risposta corretta è una procedura di confronto esplicita, non una conclusione attribuita a osservazioni mai effettuate.`,
 UNSUPPORTED:`Ho registrato un obiettivo espresso in linguaggio naturale, ma il compositore sperimentale disponibile non è un generatore di risposte aperte su qualsiasi materia. I moduli possono classificare la richiesta e produrre telemetria, mentre una soluzione concreta può richiedere documenti, osservazioni o calcolo aggiuntivo che non risultano qui eseguiti. Non presenterò una formula metodologica come risposta al merito: per questo compito la pertinenza sostanziale resta non dimostrata. Il passo verificabile successivo è determinare quali dati e quale procedura computazionale possono produrre una risposta specifica, con un controllo indipendente delle conclusioni.`
};
export function classifyC82Task(input){
 return classifyC83Task(input);
}
export function composeC82ExperimentalAnswer(input,c){
 const guard=guardedSurface(input,c);
 const family=classifyC82Task(input);
 const effective=guard?'GUARDED':family;
 const text=guard|| (family==='SELF_ONTOLOGY'&&c.intent.signals.identity?
   identitySurface(c):applyExpressiveEnvelope(TEXT[family],c));
 const v=validateSurfaceA(text);
 if(!v.ok)throw Error('C82_SURFACE_CONTRACT_INVALID');
 return Object.freeze({schema:'ikant-le-c82-experimental-answer/v1',
  family:effective,semantic_scope:effective==='UNSUPPORTED'?'NOT_DEMONSTRATED':'BOUNDED_CLASS_ROUTING',
  text,source:'C82_REPOSITORY_COMPOSER',evidence_grade:'REPOSITORY_POLICY_NOT_EXTERNAL_TRUTH',
  dynamic_model_invoked:false,independent_factual_verification:false,
  phenomenal_claim:false,active:false,persistent:false,native_delivery_attested:false,authority:0});
}
