# C134 - Prima vera evoluzione della sorgente cognitiva

**Per chi usa iKant:** abbiamo preparato una nuova versione del programma che non confonde automaticamente l'identità umana con l'identità del software. Una domanda umana può ricevere una risposta argomentata; una domanda esplicita sull'identità di iKant mantiene la disclosure rigorosa.

**Garanzia fondamentale:** i quattro file modificati sono conservati come **sorgente composita separata** sotto `tests/fixtures/epochs/c134-epoch/overlays/`, con hash Git precedenti e nuovi, SHA-256 e manifesto. I moduli storici C107/C124 rimangono intatti. L'identificatore composito NON è un commit GitHub, NON autentica l'intero repository e non conferisce CANONICAL ACTIVE.

## Differenze in quattro livelli

| Modulo | Evoluzione | Prova |
|---|---|---|
| C83 | domanda sull'essere umano -> spiegazione, non auto-ontologia software | stessa domanda, classificazione vecchia/nuova |
| C114 | dichiarazioni positive non supportate respinte anche fuori dall'auto-descrizione; negazioni/citazioni considerate | prove positive e negative |
| C107 | sceglie la policy in base al soggetto; mantiene **unico writer C87** | turn originale, lettura indipendente e replay negato |
| EDU/C70 | controllo del nuovo testo prima del writer nella versione composita | test del modulo isolato; promozione EDU **non** ancora effettuata |

## Checklist e DoD

- C134.1: manifesto con quattro blob vecchi/nuovi esatti, identificatore composito verificato.
- C134.2: solo staging in copia isolata, niente modifica del cache storico.
- C134.3: domanda di ontologia umana con risposta concreta, stesso input/nonce, C87 letto e hash output corretto.
- C134.4: software self: disclosure C114 originale, false affermazioni respinte.
- C134.5: negativi su symlink, base vecchia alterata, replay, file mancanti, claims falsi.
- C134.6: regressione CI dello stesso commit; non solo test locali.

**Cosa non è ancora dimostrato:** la nuova source epoch non è installata nel percorso C129 normalmente usato, non è un nuovo C107 carrier firmato e non certifica maggiore qualità delle risposte di un vero LLM. Le domande software possono ancora essere bloccate per formato quando giustificato.

## Reticolo aggiornato

**C134** sorgente candidata e falsificazione -> **C135** integrazione della nuova sorgente nel proprietario EDU con cache verificata e una voce effettivamente riletta -> **C136** ripiego manuale nel proprietario CANONICAL dopo fallimenti reali distinti -> **C137** benchmark cieco stesso modello/input, qualità, sicurezza, costo, latenza -> **C138** catalogo, prompt, bundle e rilascio per tier su SHA identico.

La qualifica EDU può precedere CANONICAL se sono dichiarate chiaramente le garanzie distinte. Nessun test strutturale equivale a una prova di qualità cognitiva.

## Rivalutazione del reticolo: due percorsi in parallelo

Il precedente elenco C134 -> C135 -> C136 -> C137 -> C138 era eccessivamente sequenziale. La nuova dipendenza verificabile e':

- P0 (accessibilita, complessita, prova non scambiata per cognizione, coerenza) vale in ogni nodo.
- **C134 -> C135 EDU -> C137 valutazione LLM -> C138 rilascio EDU**.
- **C127 storico -> C136 ripiego CANONICAL** puo procedere in parallelo a C135, senza aspettare il nuovo modello cognitivo.
- **C138 rilascio CANONICAL** richiede C136, qualifica linguistica pertinente e prove native originali, non una simulazione EDU.

Il grafo aggiornato, le metriche e le checklist per ogni nodo si trovano in `contracts/c134-convergence-lattice.json`; il test controlla che nessun nodo di rilascio sia raggiungibile tramite scorciatoie. Il budget di tre tentativi si applica a fallimenti macchina reali e distinti: risultato incerto => STOP, non handoff.
