# Dizionario dei contratti iKant: capire Cx senza conoscere il progetto

**In breve:** `C59`, `C87`, `C135` ecc. sono **identificatori storici di contratti, moduli o passaggi di progetto**. Il numero non indica una versione del modello, un livello di intelligenza, né una funzione automaticamente installata. Per sapere che cosa *realmente* accade occorrono codice originale al commit corretto, condizioni d'ingresso, esecuzione e prove riapribili. Una pagina che cita un contratto **non lo esegue**.

**Come leggere una riga:** *Scopo* (perché esiste) → *dove verificare* (owner/contratto) → *limite* (che cosa NON garantisce). Il nome umano è una spiegazione documentale, non una nuova autorità o un alias ammesso dai validatori. Alcuni numeri sono storici: il loro significato dipende dal profilo e dall'epoca.

## A partire da una domanda concreta

Una persona scrive «Chi sei?». Per **EDU**, il sistema deve prima verificare il consenso (`C72/v2`), poi qualificare la versione e la sorgente (`S02`, `C135`), calcolare un piano e controllarne i vincoli (`C107`, `C70`, `C126`), eventualmente valutare una formula sull'ontologia (`C114`), registrare una sola risposta (`C87`), riaprirla e consegnarla (`C125`). **Ogni freccia è una possibile interruzione**; nessuna garantisce coscienza, accuratezza della frase o memoria tra chat. Per **CANONICAL** si aggiunge una prova nativa indipendente, non una scorciatoia dal percorso EDU (`C59`).

## Le sigle incontrate leggendo il README o la mappa E2E

| Sigla | Significato immediato e perché serve | Fonte originale o contratto | Cosa non dimostra |
|---|---|---|---|
| **C72/v2** | Ingresso pubblico: Termini, consenso nuovo `I ACCEPT`, poi scelta `EDU`/`CANONICAL` con ricevute distinte. | [`host/c72-public-mode-admission.mjs`](../host/c72-public-mode-admission.mjs), [`contracts/c72-public-mode-admission-v2.json`](../contracts/c72-public-mode-admission-v2.json) | Selezione ≠ sessione attiva, native identity o persistenza. |
| **C72/v1** | Ingresso storico che comprende `EXPERIMENTAL`: continua a comparire in test/contratti legacy. | [`host/c72-unified-mode-admission.mjs`](../host/c72-unified-mode-admission.mjs) | Ricevute v1 **non** diventano EDU/v2 per rinomina. |
| **S02** | Ponte di compatibilità tra selezione pubblica EDU/v2 e consumer/owner originale, con blocco in caso di sorgente o versione non qualificate. | [`host/s02-edu-versioned-consumer.mjs`](../host/s02-edu-versioned-consumer.mjs), [`contracts/s02-edu-consumer-bridge.json`](../contracts/s02-edu-consumer-bridge.json) | Un adattatore dichiarato non prova che il turno sia stato eseguito. |
| **C135** | Coordinatore del turno EDU/v2: qualifica checkout, orchestrazione, ricevute originali e rilettura; non è il modello linguistico. | [`host/c135-edu-v2-owner.mjs`](../host/c135-edu-v2-owner.mjs), [`docs/C135_EDU_COGNITIVE_OWNER.md`](C135_EDU_COGNITIVE_OWNER.md) | Un esito EDU locale non certifica `ACTIVE` canonico o connessione ChatGPT nativa. |
| **C107** | Passaggio del turno: collega input, piano, bozza del modello e verifiche nel perimetro EDU storico/compatibile. | [`host/c107-edu-v2-turn.mjs`](../host/c107-edu-v2-turn.mjs), [`host/c107-carrier-consumer.mjs`](../host/c107-carrier-consumer.mjs) | Una bozza o un pacchetto sorgente non sono già consegna. |
| **C70** | Calcolo di metodo/piano: decide *come* elaborare una richiesta con vincoli espliciti. | [`host/edu-c70-method-v7.mjs`](../host/edu-c70-method-v7.mjs), [`contracts/edu-c70-guided-v7.json`](../contracts/edu-c70-guided-v7.json) | Classificare bene una domanda non equivale ad aver risposto correttamente. |
| **C126** | Controllo dei canali del linguaggio prima della generazione HOST: verifica che il piano e l'involucro strutturale siano coerenti. | [`host/edu-c126-channel-qualifier.mjs`](../host/edu-c126-channel-qualifier.mjs), [`contracts/edu-c126-post125-release.json`](../contracts/edu-c126-post125-release.json) | Validazione strutturale ≠ revisione semantica indipendente. |
| **C114** | Filtro di forma e pretese su frasi riguardanti la natura di iKant; può rifiutare percorsi non conformi. | [`host/c114-ontology-language-policy.mjs`](../host/c114-ontology-language-policy.mjs), [`tests/c114-ontology-language.test.mjs`](../tests/c114-ontology-language.test.mjs) | Non è un test scientifico di coscienza; può bloccare richieste legittime per mismatch di routing. |
| **C139** | Percorso EDU/v2 candidato per domande epistemiche sul processo di risposta: separa osservazioni, architettura, inferenze e limiti senza modificare C114. | [`host/c139-epistemic-policy.mjs`](../host/c139-epistemic-policy.mjs), [`docs/C139_EDU_EPISTEMIC_ROUTE.md`](C139_EDU_EPISTEMIC_ROUTE.md), [`tests/c139-epistemic-edu-v2.test.mjs`](../tests/c139-epistemic-edu-v2.test.mjs) | Filtro lessicale e test sintetici non provano verità, introspezione, valutazione su modello reale né prodotto attivo. |
| **C87** | Registro originale a scrittura unica: associa input/turno e voce, controlla append e rilettura. | [`host/c87-durable-ledger.mjs`](../host/c87-durable-ledger.mjs), [`scripts/c87-falsify-100k.mjs`](../scripts/c87-falsify-100k.mjs) | Una hash chain non verifica la verità, né da sola prova consegna al provider. |
| **C125** | Porta di output: permette di attestare la consegna nel perimetro eseguito, distinguendo output locale e interfaccia nativa. | [`host/c125-output-port.mjs`](../host/c125-output-port.mjs), [`docs/EDU_C125_UI_DOD.md`](EDU_C125_UI_DOD.md) | Un invio HOST locale non autorizza un claim di integrazione nativa. |
| **S03** | Presentazione della risposta EDU: rende visibile la voce originale C125 con provenienza, verifica del turno e confini tra superficie iKant e Host. | [`host/s03-owner-bound-presentation.mjs`](../host/s03-owner-bound-presentation.mjs), [`host/project-oneshell-edu.mjs`](../host/project-oneshell-edu.mjs) | Una risposta localmente presentata non prova una UI persistente, autenticazione dell'evento ChatGPT o esperienza soggettiva. |
| **C59** | Confine di composizione CANONICAL: un solo owner per `SESSION_CHAT_LOCAL`, con fonte, evento nativo e readback. | [`docs/C59_SINGLE_COMPOSITION_CHANNEL.md`](C59_SINGLE_COMPOSITION_CHANNEL.md), [`tests/c59-single-composition.test.mjs`](../tests/c59-single-composition.test.mjs) | Plugin visibile, ZIP o MCP collegato **non** provano attivazione. |

## Sigle aggiuntive nella documentazione tecnica e storica

| Sigla | Significato immediato | Dove cercare la fonte |
|---|---|---|
| **C20** | Runtime di compatibilità per sessione/turn in un deployment esterno. | [Deployment](../src/session-chat-deployment.mjs), [server MCP](../plugins/ikant-le-session-chat/server/server.mjs). | Trasporto HTTP non significa C59 o identità nativa. |
| **C140** | Percorso EDU di risposta aperta candidato, sottoposto agli owner e ai budget qualificati. | [Owner C140](../host/c140-open-edu-turn.mjs), [contratto](C140_SEMANTIC_RUNTIME_PR.md). | Route presente ≠ C87 eseguito o prodotto live. |
| **C141** | Shadow: valuta strade alternative senza autorità di decisione o scrittura. | [Shadow](../host/c141-semantic-shadow.mjs). | Shadow ≠ owner del turno. |
| **C142** | Guardia semantica negativa e multilingue, vincolata a test bounded. | [Guard](../host/c142-semantic-owner-guard.mjs). | Guard = vincolo, non soluzione di tutte le issue. |
| **S01** | Ingresso umano pubblico con documenti orientativi e consenso distinto. | [Ammissione pubblica](S01_PUBLIC_EDU_CANONICAL_ADMISSION.md). | Consenso storico e citazioni non costituiscono un nuovo ingresso. |
| **C4** | Profilo funzionale di espressione/valenza, non emozioni vissute. | [Architettura](ARCHITECTURE.md), [`src/`](../src/) e [test](../tests/). |
| **C5** | Modello ricorrente «sé/mondo» del software: stati funzionali e continuità limitata. | [Architettura](ARCHITECTURE.md), [`tests/c5.test.mjs`](../tests/c5.test.mjs). |
| **C8** | Distinzione fra emergenza/operatività misurabile e fenomenologia non dimostrata. | [Architettura](ARCHITECTURE.md), [`tests/`](../tests/). |
| **C11** | Qualifica contrattuale di aspetti funzionali «alive/conscious» con gate, senza inferire coscienza fenomenica. | [Architettura](ARCHITECTURE.md), [`tests/`](../tests/). |
| **C30** | Livelli di attivazione/servizio: quali condizioni consentono una certa classe di stato. | [Architettura](ARCHITECTURE.md), [`scripts/c30-activation-service-select.mjs`](../scripts/c30-activation-service-select.mjs). |
| **C31** | Catena di provenienza e limiti della modalità `RUNTIME_BOUND_LIMITED`. | [Architettura](ARCHITECTURE.md), [`tests/c31-runtime-limited-supply-chain.test.mjs`](../tests/c31-runtime-limited-supply-chain.test.mjs). |
| **C32** | Cornice di presentazione deterministica e stati del turno, distinta dalla voce. | [Architettura](ARCHITECTURE.md), [`tests/c32-session-shell.test.mjs`](../tests/c32-session-shell.test.mjs). |
| **C124** | Confine storico delle sorgenti/canali nel collegamento EDU. | [C135 EDU](C135_EDU_COGNITIVE_OWNER.md), [`src/c124-channel-bridge.mjs`](../src/c124-channel-bridge.mjs). |
| **C127** | Trasporto/copia verificata di file in un ambiente EDU precedente. | [C135 EDU](C135_EDU_COGNITIVE_OWNER.md), [`host/`](../host/). |

**Nota su versioni:** lo stesso numero può essere menzionato in un percorso *storico* e in uno *attuale*. Non assumere che i contratti si convertano automaticamente fra profili: controllare nome file, schema, commit e owner effettivo.

## Micro-glossario per ingegneri nuovi

- **Owner:** componente originale autorizzato a decidere/scrivere una transizione; una pagina README o un wrapper HOST non ne diventa uno.
- **HOST:** ambiente che chiama strumenti e modello; la capacità dichiarata non implica che l'azione sia avvenuta.
- **Receipt:** dato di riscontro verificabile nel proprio ambito. Una firma/hash di integrità non autentica di per sé il mittente o il provider.
- **Source lock:** riferimento immutabile di commit/TREE; se `main` cambia, la verifica deve essere rifatta prima di nuove azioni.
- **Readback:** riapertura fisica indipendente di ciò che è stato scritto, non semplice fiducia nella stringa restituita dallo stesso writer.
- **Fail closed:** al primo requisito assente, bloccare anziché costruire ricevute surrogate o tentare retry ciechi.
- **ACTIVE:** stato del runtime canonical da provare con owner, writer, identità e consegna; non sinonimo di consenso o selezione della modalità.
- **Evidenza epistemica:** `DOCUMENTATO` = nel file; `OSSERVATO` = eseguito e riaperto; `INFERITO` = ipotesi; `NON ATTESTATO` = prova insufficiente.

## Come verificare senza dare nulla per scontato

Scegli una sigla, segui il link al codice/contratto e annota: versione del commit, precondizioni, cosa produce, quali fallimenti genera, dove sono i test negativi. **Esegui** solo gli owner consentiti e verifica le prove con una lettura indipendente; poi confronta la narrazione con quel comportamento. Se un link non esiste al commit selezionato, la documentazione deve essere corretta: non crearne la semantica per intuizione.

**Perché questa guida convince soltanto per gradi:** prima riconosce il problema reale (una risposta plausibile non è prova), poi mostra la catena controllabile, poi i suoi controesempi e infine domanda se ciò migliori i compiti umani. RQ1–RQ3 sono ancora [domande aperte e falsificabili](IKANT_RESEARCH_QUESTIONS.md), non traguardi dichiarati.

[Revisione post-edit](IKANT_CX_POST_EDIT_REVIEW.md) · [Inizio per chiunque](START_HERE.md) · [Percorso E2E](IKANT_RUNTIME_AND_EVIDENCE.md) · [README](../README.md)
