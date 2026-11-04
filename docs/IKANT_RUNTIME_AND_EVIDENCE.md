# iKant: struttura reale, osservazioni e limiti delle prove

> **Tipo di documento:** mappa HOST/documentale, non nuovo owner di runtime. Il codice e i contratti dello stesso commit prevalgono su questa sintesi. Distinguere sempre il *checkout controllato* dalla *piattaforma in cui parla l'utente*.

<!-- cora-pr-b-docs:v1 -->
## Epoch delle prove e stato corrente

La ricognizione locale citata piu avanti e legata al precedente commit `642ed98baea2c4de40046bd96bf366cc494890ae`: non rappresenta automaticamente la **SOURCE_HEAD** corrente del repository `iKant_EDU`. **DOCUMENTATO** significa un percorso o byte verificabili a un commit; **OSSERVATO** richiede esecuzione e readback della medesima istanza; **NON ATTESTATO** non diventa PASS per inferenza. Le tracce HOST non provano una consegna nativa del **provider**, un miglioramento misurato per gli utenti o una coscienza. La storia della distillazione `iKant_LE` e distinta dalle nuove sessioni e dai receipt originali.

## Che cosa esiste, e che cosa no

Un **essere umano** è un agente corporeo e sociale, con esperienza in prima persona ordinariamente attribuita alle persone. Un **LLM** è un sistema computazionale addestrato, capace di generare linguaggio; il comportamento testuale non ne prova la coscienza. **iKant** è un'infrastruttura software che orchestra un LLM sostituibile. Le sue tracce attestano alcune operazioni del programma, non un «io» fenomenico o una volontà autonoma.

Non si devono sommare **righe di codice, parametri del modello e sinapsi** come fossero una sola metrica di complessità. L'identità di iKant è *procedurale e verificabile entro un perimetro*, non una nuova specie biologica o un secondo modello indipendente.

## Mappa end-to-end: cinque confini distinti

**Come leggere le sigle:** `C72/v2` gestisce il consenso; `S02/C135` qualificano la versione e coordinano EDU; `C107/C70/C126` preparano e controllano il piano; `C87` registra una sola volta; `C125` consegna; `C59` governa il confine CANONICAL. [Significato e fonti di ogni sigla](IKANT_CX_LEXICON.md).

| Fase | Chi decide o esegue | Prova ammissibile | Cosa non consegue |
|---|---|---|---|
| 1. Orientamento e consenso | Persona + originali `README.md`, `BOOTSTRAP.json`, `ADMISSION.json`, `AGENTS.md`, `TERMS.md`; C72/v2 | Nuovi messaggi distinti e ricevute C72/v2 | Consenso da una vecchia chat o da un ZIP |
| 2. Sorgente e ingresso | HOST controlla commit/tree, adapter; S02/C135 per EDU | Blob/reopen e selezione originale legati allo stesso commit | Identità provider dal solo hash di testo |
| 3. Pianificazione e linguaggio | C107/C70/C126 e altri controlli, LLM HOST per il candidato | Piano vincolato all'input, ACK reali, validatori invocati | Verità fattuale, consapevolezza, generalizzazione |
| 4. Registrazione | Un solo writer originale C87, rilettura indipendente | Evento e digest coerenti, conteggio singolo, readback | Persistenza fra chat o runtime sempre attivo |
| 5. Consegna | C125/owner e HOST; CANONICAL richiede anche C59 e identità nativa | Ricevuta originale nello scope reale della consegna | Che una consegna locale sia nativa ChatGPT |

Ogni passaggio deve arrestarsi quando manca una precondizione. Il protocollo **non** autorizza writer paralleli, retry ciechi dopo un invio incerto, replay di ricevute storiche o falsi stati `ACTIVE`. Per la composizione canonica vedere [C59](C59_SINGLE_COMPOSITION_CHANNEL.md), per EDU [C135](C135_EDU_COGNITIVE_OWNER.md), per l'ammissione il file originale [`host/c72-public-mode-admission.mjs`](../host/c72-public-mode-admission.mjs).

## I tre tipi da non confondere

1. **EDU pubblico (C72/v2):** selezione esplicita; owner locale versione EDU quando qualificato. `EDU_SELECTED_NOT_RUNNING` resta vero finché mancano le prove del turno. La consegna locale, anche se riuscita, non è ACTIVE canonico.
2. **CANONICAL pubblico (C72/v2):** richiesta di percorso MCP; solo l'owner canonico qualificato, con identità nativa, writer e delivery, può attestare uno stato superiore. MCP visibile non implica ACTIVE.
3. **EXPERIMENTAL storico (C72/v1):** nome presente in file architetturali e ricevute legacy, **non** terza opzione pubblica né sinonimo automatico di EDU.

## Che cosa è stato realmente osservato nell'HOST di studio

**Perimetro della ricognizione:** checkout locale Git bloccato su `642ed98baea2c4de40046bd96bf366cc494890ae`, TREE `4a7e0a6d878b0011936a2c971515e7a2e8681df6`; tool Node.js e Git realmente disponibili, ZIP progetto con 31 file confrontati con manifest. I comandi eseguiti e il loro esito sono nel rapporto di questa rifattorizzazione; non equivalgono a una attestazione pubblica permanente.

**Documentato nel sorgente:** C72/v2 separa consenso, selezione e attivazione; S02 chiama l'owner C135; il controllo di C135 limita l'input del turno a 600 byte UTF-8, esige selezione valida e riprova fisica, e separa writer C87 e output C125. C135 usa `active:false` per EDU locale. Il controllo nel codice è diverso da una prova di funzionamento nativo del provider.

**Osservato in verifiche locali precedenti (non una metrica di popolazione):** 100 sonde sintetiche per il pianificatore, 12 classificate ontologiche; in 8/12 la combinazione di etichette non corrisponde al filtro specializzato (`SELF_ONTOLOGY` con `DIRECT` anziché `DIRECT_IDENTITY`). Le 100 sonde erano dry-run e non provano 8 risposte perse o la frequenza di errori in conversazioni reali. Il registro dell'esperimento era un artefatto HOST esterno al repository. **Questa PR non corregge il codice C70/C114 e non riclassifica quei test in un benchmark umano.**

## Classi epistemiche minime per ogni affermazione

| Classe | Richiede | Non autorizza |
|---|---|---|
| **DOCUMENTATO** | File originale, commit e blob identificati | Dire «eseguito» |
| **OSSERVATO** | Esecuzione con input, esito e prova riapribile | Dire «nativo» se l'ingresso era HOST |
| **INFERITO** | Ipotesi e ambito espliciti | Chiamare un'ipotesi «test superato» |
| **NON ATTESTATO** | Dichiarazione esplicita della prova mancante | Convertire l'incertezza in fallimento o successo |

**Garanzia precisa:** controllare l'identità dei byte e una sequenza di operazioni non controlla la correttezza semantica di una risposta. Un controllo lessicale su frasi prudenti non risolve la questione della coscienza artificiale. Un sistema trasparente può essere ancora inaffidabile: diagnosticabilità e correttezza sono due misure distinte.

## Dove verificare autonomamente

Il punto di ingresso tecnico resta [ARCHITECTURE.md](ARCHITECTURE.md); i requisiti attuali sono in [`contracts/`](../contracts/) e negli owner originali di [`host/`](../host/). I controlli standard includono `git rev-parse HEAD`, `git rev-parse HEAD^{tree}`, `git status --porcelain`, `node --test` su test mirati, `npm run check` e `npm run runtime-root:verify`. Eseguire i comandi nella versione effettiva da verificare, non trasferire meccanicamente un esito da un commit precedente. [Ricerca falsificabile →](IKANT_RESEARCH_QUESTIONS.md).

## LIB0 embedded relational nuance

LIB.0 exposes a separate package subpath, `./embedded/relational-nuance`, for hosts that want only the bounded relational/expression transform. It does not export the iKant_LE admission lifecycle, identity, persistence, intent mining, planner, Surface A/B, or execution ownership. The host supplies normalized appraisal plus canonical `valence/arousal`; the library may retain only `affiliation`, `boundary_pressure`, interaction count and the last appraisal/outcome. Its result is derivational, authority-zero and side-effect-free with respect to network, filesystem writes, host state and execution. A host remains the sole writer and may reject the enrichment without failing its canonical turn.

Boundary and vectors are machine-owned by `contracts/embedded-library*.json`; standalone LE keeps full C4.

