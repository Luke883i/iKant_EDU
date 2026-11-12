# Avviare iKant: Project EDU, audit locale e servizio MCP esterno

Questa guida distingue **la preparazione dei file** dall'**esecuzione del codice** e dall'**integrazione nativa**. Non chiedere segreti in chat. Prima di usare un pacchetto registrare il commit di `main` da cui proviene; la sua identità non può essere dedotta dal titolo dello ZIP.

<!-- cora-pr-b-docs:v1 -->
Questa è una guida di documentazione HOST: il canone è il sorgente `project/session-chat/PROMPT.txt`, mentre l'installazione delle istruzioni nel Project non è attestata da questa pagina. `ORIENTATION`, `I ACCEPT` ed `EDU` sono eventi distinti; una chat precedente non trasferisce le ricevute. Un file Project o un clone non rendono il provider operativo.

## Percorso A — Capire e sperimentare in un ChatGPT Project (EDU consigliata)

1. Per configurare un Project, verifica il prompt canonico `project/session-chat/PROMPT.txt` del commit sorgente. Bundle, manifest e istruzioni di installazione sono opzionali: quando richiesti da un carrier realmente disponibile, devono corrispondere al medesimo SOURCE_HEAD e TREE. Non sono prerequisiti per ORIENTATION su GitHub e non attestano un adapter installato.
2. Inserisci il prompt verificato nelle istruzioni del Project. Carica file supplementari solo se necessari e controllati. I documenti storici `00_ROUTE.md`–`07_RELEASE.md`, quando presenti, sono proiezioni HOST e non sostituiscono il canone. I file in chat non vengono eseguiti automaticamente.
3. Apri una **nuova chat** nel Project. Il primo turno umano, ad esempio `iniziamo`, consente soltanto **ORIENTATION**: HEAD e cinque originali GitHub sono consultati nell'ordine del canone, con link ai Terms, senza fingere lettura o comprensione umana. Solo in un successivo messaggio esatto `I ACCEPT` si può tentare C72; dopo la rilettura delle ricevute originali, in un ulteriore turno esatto `EDU` si seleziona la modalità. `avvia iKant` non è più un prerequisito tecnico e non puo sostituire il consenso.
4. Non caricare un secondo archivio per abitudine. Se un componente richiede byte locali, prima verifica l'identità **SOURCE_HEAD** e il TREE dello stesso commit del repository corrente `Luke883i/iKant_EDU`, poi usa soltanto un trasporto realmente disponibile con SHA-1 Git e rilettura indipendente. Un vecchio ZIP `iKant_LE` rimane materiale storico, non il carrier predefinito, e non trasferisce consensi o ricevute. Il file caricato non dimostra esecuzione.
5. L'HOST verifica l'originale, individua l'owner EDU realmente disponibile, esegue il percorso autorizzato e dichiara `NO_VOICE` se mancano writer, rilettura o output. Il formato a sei aree può essere una convenzione per turno: **non** promette una UI o una memoria permanente.

**Nota:** `PROMPT_INNESCO.md`, `INSTALLAZIONE.md` e `MANIFEST.json` del bundle OneShell allegato sono *proiezioni HOST*. Non sono automaticamente file presenti nella radice del repository e non sostituiscono `TERMS.md`, C72/v2 o gli owner originali. Non usare una vecchia selezione come nuovo consenso.

Per chi non conosce le sigle: `C72/v2` è il controllo di consenso, non l’installazione; [glossario tecnico illustrato](IKANT_CX_LEXICON.md).

## Percorso B — Audit ed esecuzione da checkout Git verificato

Prerequisiti: Git, **Node.js 20+**, Python 3, permessi locali appropriati. Un esempio riproducibile di audit è:

```bash
git clone https://github.com/Luke883i/iKant_EDU.git
cd iKant_EDU
git rev-parse HEAD
git rev-parse HEAD^{tree}
git status --porcelain
node --version
npm test
npm run check
npm run runtime-root:verify
```

**Prima di eseguire** verifica che HEAD coincida con il commit intenzionalmente scelto e che non vi siano modifiche locali inattese; confronta eventuali manifest e blob Git. Se stai lavorando su un commit preciso, esegui un `git checkout` di quel commit prima dei test e riconosci che non sarà necessariamente il `main` attuale. Gli esiti riportano sempre il commit effettivamente eseguito.

I test controllano il *repository*, non provano un LLM online, i benefici su utenti o una chiamata nativa ChatGPT. Per il collegamento EDU documentato: [`host/c135-edu-v2-owner.mjs`](../host/c135-edu-v2-owner.mjs), [`host/s02-edu-versioned-consumer.mjs`](../host/s02-edu-versioned-consumer.mjs), [specifica C135](C135_EDU_COGNITIVE_OWNER.md).

## Percorso C — App MCP esterna, indipendente dal Project EDU

Il servizio in `plugins/ikant-le-session-chat/server/server.mjs` non e una modalita C72/v2, non e la composizione storica C59 CANONICAL e **non installa da solo il client ChatGPT**. E un server Node compatibile con il profilo legacy deployed C20 e, in configurazione `standalone`, richiede OAuth con scope `ikant:connect`/`ikant:write`, deployment HTTPS, Identity Provider e disco persistente. Il codice o il template MCP sono candidati; non costituiscono una prova di server pubblico o di connessione ChatGPT.

Per iniziare, consultare il [manuale del plugin](../plugins/ikant-le-session-chat/README.md), il [runbook del deployment](MCP_STANDALONE_RENDER_RUNBOOK.txt) e la [matrice dei due prodotti](I10_TWO_PRODUCTS.md). I controlli statici e gli IdP sintetici non provano un IdP reale. Un esito di scrittura sconosciuto implica STOP e riconciliazione in sola lettura, senza retry automatico.

## Percorso D — C59 CANONICAL e archeologia storica, non installazione MCP

C59 `SESSION_CHAT_LOCAL` e un'architettura storica distinta: il suo percorso originale richiede fonte, carrier, evento nativo, writer e readback qualificati. La presenza del servizio MCP **non** attesta queste condizioni, non seleziona CANONICAL e non autorizza `ACTIVE`. [Identita dei percorsi](I10_TWO_PRODUCTS.md) e [contratto C59](C59_SINGLE_COMPOSITION_CHANNEL.md).

## Come orientarsi in caso di dubbi

[Inizio accessibile](START_HERE.md) → [mappa delle prove](IKANT_RUNTIME_AND_EVIDENCE.md) → [ricerca confutabile](IKANT_RESEARCH_QUESTIONS.md) → [contratti macchina](../contracts/) → [catalogo release](../release/catalog.json). Una PR proposta e un archivio scaricato non costituiscono una nuova versione rilasciata.
