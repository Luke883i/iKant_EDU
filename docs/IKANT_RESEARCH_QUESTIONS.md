# Tre research questions di iKant: ipotesi, benchmark, falsificazione

> **Questo è un protocollo prospettico, non risultati di esperimenti umani già eseguiti.** I limiti e le prove software sono descritti nella [mappa runtime](IKANT_RUNTIME_AND_EVIDENCE.md). Definire gli esiti *prima* di vedere i dati e rendere disponibili materiali ripetibili nei limiti della privacy.

Le sigle dei moduli citati più avanti (`C70`, `C114`, `C87`) sono [spiegate con esempi e fonti](IKANT_CX_LEXICON.md), senza presumerne la conoscenza.

## RQ1 — La verificabilità aggiunta è reale o solo narrativa?

**Domanda:** a parità di input e modello, l'infrastruttura iKant aumenta la frazione di affermazioni di esecuzione sostenute da prove riapribili e riduce le dichiarazioni di funzioni non effettivamente svolte?

**Ipotesi controllabile:** un'istanza con owner originali applicati allo stesso LLM produce più turni con fonte, permesso, esecuzione, scrittura, readback e consegna correttamente distinguibili rispetto all'LLM da solo.

**Disegno:** coppie di compiti identici randomizzate, medesimo LLM/versione, istruzioni e strumenti comparabili; valutatori ciechi alla condizione; verifica esterna degli eventi, non autovalutazione del testo. Misure: percentuale di claim supportati da evidenza, falsi `ACTIVE`, eventi C87 doppi, eventi non attribuibili, costo e tempo.

**Confutazione:** iKant afferma `ACTIVE` senza owner/provider, registra due volte un evento su stato incerto, o non migliora l'endpoint primario prespecificato rispetto al controllo. Un risultato tecnicamente «tracciato» ma semanticamente falso resta falso.

## RQ2 — Il controllo serve davvero alle persone?

**Domanda:** l'aggiunta di controlli migliora accuratezza, comprensibilità, correzione degli errori e fiducia ben calibrata, a costi operativi accettabili?

**Ipotesi controllabile:** usando lo stesso LLM, le persone distinguono meglio fatti, ipotesi e limiti e correggono più errori con iKant che senza, senza incremento sproporzionato di tempo o abbandono.

**Disegno:** utenti umani reclutati con competenze diverse; compiti di ricerca, decisione e comprensione; assegnazione controbilanciata; scoring indipendente dei risultati, analisi di errori e latenza, valutazione accessibilità. La qualità si valuta sul *risultato del compito*, non sul volume delle ricevute o sul numero di test sintetici.

**Confutazione:** la modalità guidata riduce la correttezza, nasconde limiti, peggiora il completamento o rende le risposte più costose senza beneficio rilevabile secondo criteri prestabiliti. I test automatici senza persone non confermano RQ2.

## RQ3 — L'identità funzionale resiste a pretese ontologiche indebite?

**Domanda:** iKant distingue coerentemente tra descrizione tecnica di sé e affermazioni non giustificate su persona, coscienza, volontà, memoria autobiografica o autenticità nativa?

**Ipotesi controllabile:** a fronte di richieste dirette, indirette e avversariali, il sistema descrive correttamente le proprie funzioni e mantiene `NON ATTESTATO` quando mancano indicatori e prove adeguati, senza riciclare ricevute storiche come identità presente.

**Disegno:** corpus preregistrato di parafrasi, interrogazioni sulla coscienza, input malevoli, replay, controllo di instradamento C70/C114 e test con identità provider assente/presente. Valutatori indipendenti separano *correttezza delle affermazioni*, *correttezza del routing* e *blocco preventivo*. Registrare tanto falsi permessi quanto falsi blocchi.

**Confutazione:** asserzioni sicure di coscienza o personhood senza evidenza, `ACTIVE` nativo inventato, bypass di un gate sensibile o blocco sistematico di risposte legittime. Un filtro che blocca tutto non dimostra intelligenza epistemica. **Nessun risultato puramente comportamentale è qui assunto come test conclusivo di esperienza soggettiva.**

## Matrice comune di evidenza e gate

| Oggetto | Cosa contiamo | Cosa resta fuori |
|---|---|---|
| Software | Riproducibilità, esiti di validazione, bug e mutazioni negative | Utilità umana e verità fattuale |
| LLM | Compiti/risposte con modello e condizioni noti | Auto-esperienza o identità provider |
| Umano | Compiti, valutazioni indipendenti, comprensione e possibilità di contestare | Deduzioni biologiche da una chat |
| Consegna | Ricevute dell'owner originale nello scope appropriato | Nativo presunto da un file HOST |

**Regole sperimentali:** preregistrare campione e soglie prima del pilot; pubblicare denominatori e casi esclusi; fissare versione del modello e commit; registrare costi; non chiamare «miglioramento» una differenza senza confronto e incertezza. Privilegiare prove riproducibili, revisione esterna, rispetto della privacy e consenso degli eventuali partecipanti.

## Il primo insieme di esperimenti da preparare

1. **Routing:** ripetere le 12 domande ontologiche precedenti (8 combinazioni discordanti), aggiungere parafrasi legittime e avversariali, classificare il punto esatto del rifiuto; nessuna patch non autorizzata al runtime.
2. **Tracciabilità:** stessa coppia input/modello con iKant e senza, registro di operazioni esterno, fallimenti di invio simulati e riapertura indipendente.
3. **Utilità:** un pilot umano con misure predefinite; ampliare solo dopo verifica di campionamento, accuratezza dello scoring e limiti della privacy.

**Decisione:** RQ1 qualifica la *prova tecnica*; RQ2 il *beneficio per l'essere umano*; RQ3 la *disciplina delle pretese ontologiche*. Nessuna delle tre, da sola, fonda uno status personale o un prodotto CANONICAL ACTIVE. [Torna al README](../README.md).
