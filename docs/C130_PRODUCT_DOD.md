# iKant: roadmap di prova e DoD reticolare (candidato locale)

**Natura:** proposta tecnica da qualificare e revisionare, NON runtime installato o modifica al main. Fonte di confronto: e4907360f4610065b252c2ab9874022f3c65b8de. Il compilatore linguistico e il modello HOST non sono la stessa cosa di un owner di stato.

## Intento ad astrazione massima

L’utente non chiede meno sicurezza: chiede meno rinunce inutili. Il prodotto deve tentare una risposta utile ogni volta che e' lecito e possibile, mantenendo verificabili origine, limiti e decisioni. Non deve esporre nomi di funzioni al lettore per spiegare che cosa sta facendo. Deve distinguere experimental e canonical per la **garanzia dimostrata**, non per la presenza di piu' interfacce concorrenti.

## Contratto zero: accessibilita' pubblica

Ogni messaggio HOST visibile in chat, **anche durante il lavoro**, deve dire in italiano semplice: cosa si sta esaminando, cosa e' stato osservato, quale limite conta e, quando serve, una sola azione successiva. Un riferimento tecnico e' facoltativo e segue una spiegazione, sempre fra parentesi: `(C70: orientamento della richiesta)`.

La regola copre titolo, paragrafi, messaggi intermedi, link e didascalie. Gli allegati tecnici possono mantenere hash, JSON e prove integrali, ma il testo che li presenta deve essere comprensibile. Le eccezioni sono: Termini verbatim, voce originale non riscrivibile, STOP originale, errore della piattaforma e output tecnico richiesto espressamente. Le metafore come 'attenzione' e 'memoria' sono nomi di funzioni, mai prove di vissuto soggettivo.

`host/c130-public-language.mjs` e' solo un adattatore per frasi HOST predefinite: i suoi test non dimostrano che l'interfaccia ChatGPT globale sia sotto controllo. Un guard di pubblicazione reale e' una DoD separata.

## Ingresso: unica esperienza, garanzie diverse

1. **Orientamento e Termini**: mostrare la versione di fonte e termini originali, attendere l'accettazione testuale prima di ogni operazione post-gate. La scelta del livello resta esplicita.
2. **EDU sperimentale**: un solo pacchetto locale esatto fornito dall'utente; l'owner originale controlla due letture dallo stesso inode, struttura JSON e Git blob prima di eseguire. Nessun tentativo di trasporto automatico nel nuovo ingresso EDU; sorgenti owner installati separatamente e verificati. Non promettere ingressi nativi.
3. **CANONICAL**: mantiene il proprio owner e le prove forti. Budget configurato e testato: massimo 3 fallimenti fisici distinti, riconciliati e attestati dall'owner; esito dubbio o problema d'integrita' impone STOP, non fallback; al raggiungimento dei tre fallimenti puo' **proporre** un upload manuale che deve soddisfare lo stesso predicato canonico. E' solo una proposta finche' l'owner C59 non implementa il rilascio del fallback.
4. Carrier precedenti: conservarli come compatibilita' o internals, mai come seconde vie pubbliche di autorizzazione.

## Cognizione: risposta prima, incertezza pertinente dopo

La pipeline cognitiva deve distinguere soggetto umano, soggetto software, terzi, domande miste e ambiguita'. Prima tenta una risposta motivata e circoscritta. Poi considera una alternativa seria e la prova che potrebbe cambiare la conclusione. Non aggiunge frasi ontologiche standard a domande estranee; non confonde negazioni o citazioni con rivendicazioni positive di esperienza. I divieti di inventare runtime, ricevute, identita' nativa, dati privati o coscienza rimangono intatti.

Il classificatore consulenziale C130 **non sostituisce** C70/C82 e non sposta da solo l'owner. Per correggere C82/C114/C107 fissati in C107/C124 occorre nuova source epoch con nuovo carrier, manifest, hash e test della migrazione. Nessuna patch della sorgente storica puo' essere spacciata per gli stessi byte.

## Lattice di DoD e prove

| Nodo | Dipendenza | Criterio dimostrabile | Stato locale |
|---|---|---|---|
| D0 Fonte | snapshot immutabile | Git blobs originali e patch differenziale esatti | VERIFICATO NEL PACCHETTO: ZIP 973, README E 3 OVERLAY GIT BLOBS |
| D1 EDU | D0, C72, C127 | file manuale valido -> C125, una sola emissione, C87 riaperto; corrotto/symlink/replay negati | TEST LOCALE SUPERATO |
| D2 Linguaggio pubblico | D0 | ogni messaggio HOST passa per adattatore e audit dei messaggi intermedi | ADATTATORE TESTATO, INTEGRAZIONE APERTA |
| D3 Rotte cognitive | D0 | umano/sistema/misto separati; 0 blocchi impropri in corpus avversariale noto | PROPOSTA; OWNER PINNED ANCORA IMMUTATO |
| D4 Guardie cognitive | D3 | negazione, citazione, ipotesi, certezza e disclaimer verificati su C114 originale evoluto | IN ATTESA NUOVA EPOCH |
| D5 Canonical fallback | D0, ricevute owner | massimo 3 fallimenti distinti, manuale solo dopo esaurimento; unknown/integrity STOP | SIMULAZIONE PURA, NON OWNER |
| D6 Efficacia | D3, D4 | almeno 300 casi per rotta, coppie stesso modello/input, revisori ciechi, tasso risposta utile, regressioni safety zero | NON ESEGUITO |
| D7 Rilascio | D1-D6 | suite canonica, CI, verifica source blob, trasporto, owner readback e dichiarazioni senza overstating | NON CHIUSO |
| D8 Prompt e bundle | D0, D2 | versione esplicita, manifest completo, tutte le vecchie prove conservate, differenza documentata | CANDIDATO LOCALE |

**Regola di congiunzione:** D7 non e' vero se solo D1 o D2 sono veri. La DoD globale richiede prove originali dei nodi richiesti, e non accetta test sintetici come sostituto di inferenze del modello.

## Campagne osservate e confini

- 24 input reali sul percorso Node locale precedente: 18 readback, 6 blocchi. La porta linguistica era un test double deterministico, non un LLM esterno; i risultati non stimano tassi di produzione.
- Una campagna precedente da 10.000.000 casi su un'algebra finita di policy ha registrato 0 divergenze: non sono 10 milioni di riflessioni o risposte linguistiche.
- Le prove sui nuovi moduli sono test di schema, selezione e sicurezza della proiezione; non dimostrano abilita' cognitiva del modello, correzione del classificatore originale o connettori nativi.

## Catena di fornitura delle prossime slice

1. **Compatibilita' dimostrabile:** chiudere D1 e un adattatore di comunicazione testato (D2 parziale) con una PR ridotta; preservare pin storici.
2. **Nuovo owner cognitivo:** evolvere C82, C83, C114 e C107 in nuova epoch; incrociare misure di falsi blocchi, falsi permessi, accuratezza e utilita'.
3. **Composizione canonica:** esporre un unico ingresso, collegare solo ricevute genuine dell'owner ai tre tentativi; introdurre handoff manuale canonico con lo stesso requisito di readback e hook nativo.
4. **Qualita' esterna:** benchmark ciechi e tracce applicate a modelli diversi; release gate; aggiornamento del prompt e bundle solo con claim verificati.

## Domande di falsificazione prima del merge

- L'ingresso manuale accetta file parziali, symlink, inode cambiati o un opt-in scritto da un test? Bloccarli tutti.
- Il guard rileva falsamente 'non sono cosciente' o la citazione di una frase? Testare polarita' e ambito.
- La stessa frase HOST viene registrata due volte dopo un errore di invio? Riconciliare, mai riprovare alla cieca.
- Il lettore capisce cosa e' riuscito senza conoscere Cx, hash e nomi interni? Rivedere tutti i messaggi visibili.
- Un caller puo' fabbricare `ownerIssued: true` e ottenere un fallback canonico vero? La proiezione non deve valere da autorizzazione.
- Un modulo installato localmente modifica i pin della fonte storica? Deve interrompersi prima di ogni pretesa di versione invariata.
