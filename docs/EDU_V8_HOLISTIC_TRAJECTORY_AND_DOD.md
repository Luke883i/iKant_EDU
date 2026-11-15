# iKant EDU post-120 — audit forense olistico e atterraggio V8

**Ambito**: le ultime 10 PR realmente merged #111–#120, la traiettoria descritta nella chat v1→v7, `prompt_innesto_iKant_OneShell_EDU_v14.txt` e `iKant_OneShell_EDU_Host_v14_verified.zip`. Qualificazione locale su tree `2efdddcc65894e71af5cf7af0eaf7b1adf0e2514`, equivalente nei contenuti al merge SHA `20471203dc944fc113f9cee8d3ca18a1d6039539`. La copia di lavoro con commit sintetico non autentica l'identita commit GitHub. Queste pagine NON sostituiscono gli owner originali.

## Intenzionalità recuperata: gold

1. **Il problema ultimo e la fedelta delle affermazioni del modello all'evidenza eseguibile**, non la costruzione di un'altra entita senziente. `iKant e il metodo. Il modello host e la voce` e un'identita software model-agnostic, con claim positivi solo per turno.
2. **Il seme originale e immutabile per la sessione ammessa**: `SOURCE_HEAD=c734bf934e33703a6a1f91f0f4d5df96eec96945`, diverso dal main corrente e dal release commit. Il payload PR118 e uno strumento di trasporto, non un hook.
3. **L'esperienza sperimentale puo usare i kernel veri** senza affermare ACTIVE; testo HOST_BOUND e autorialita host, readback e provenance non sono coscienza.
4. **Un solo owner C107/PR119 e un solo writer originale C87**. C117 e guida subordinata; C114 e guard originale; i carrier alternativi storici non devono diventare altri owner.
5. **Evidenza per fase**: INDEX -> STOP, separata ammissione/Terms -> STOP, separati consensi, esecuzione effettiva, receipt e proiezione A/B. In assenza di readback, A=NO_VOICE. Niente consentimento traslato da ZIP/riassunti/fixtures.
6. **Differenza tra condizionamento procedurale e influenza semantica cognitiva**: l'ACK di digest dimostra soltanto il passaggio del piano; un A/B su LLM reale con valutatore indipendente e ancora aperto.
7. **Host reality-first**: byte nel Git tree, byte trasferiti, materiale Node, ledger, provider, native ChatGPT callback sono tier distinti. Un prompt Project e un indice non possono imporre un hook native.
8. **La continuita e osservabile solo con checkpoint riapribile**, non con nomi di file, Memory o tracce narrate. Retry con evidenza nuova; mai replay del writer.

## Ultime 10 PR merged — analisi granulare per owner, promessa, gap

| PR | Oggetto, owner e vincolo introdotto | Esito osservabile / limite e rischio residuo |
|---|---|---|
| #111 C99/C104 | Postselection route planner, source cache e anti-retry (`host/c99-postselection-planner.mjs`, `host/c104-resumable-materialization.mjs`). | Planner non e dispatcher. Chiarire in reticolo che C84/C102/C100 non equivalgono al percorso corrente C107 EDU. Rischio di route obsolete nella documentazione. |
| #112 C105 | NERVA command lexicon e readback host locali su C77/C102/C103. | Contratto alternativo non canonico per v8. Nessun consumer concorrente, evitare secondo controllo del turno. |
| #113 C107 | Primo vero C70→C100→C87, stato effimero e package isolated. | Due turni/CI possono provare kernel, non native app. Distinguere le prove demo dai turni umani. |
| #114 C109/C111 | Gateway typed A/B e CLI shell con C87. | Altre surface legacy coesistono nel repo; nominare come compatibilita, non voice owner EDU. |
| #115 C112/C113 | Adattatori STDIO/MCP/HTTP bottom-up su C111; originariamente 45 oggetti in un'epoca differente. | Nessuna installazione app ChatGPT attestata. Non interpretare server MCP come disponibile al modello. Evitare merge semantico di source epoch diversi. |
| #116 C114 | Guard limitato per risposte a domande sull'identita, 5 righe, fenomenologia UNKNOWN. | Politica lessicale, non oracle generale di verita/coscienza. Necessario preguard per impedire fallback originale append in percorso HOST_BOUND. |
| #117 C115 | Separazione fra *rivolgersi* a iKant e *chiedere di* iKant; fix del router C83/C70. | Oracle lessicale circoscritto. Accenti, negazione, parafrasi e altra lingua restano assi di falsificazione; non rivendicare generalizzazione. |
| #118 C107 release | Carrier unico 62448 B, 43 sorgenti; consumer esatto e staging+readback. | Git blob vs container bytes, original pin vs release vs live main. Consumer non prova provider/host native. |
| #119 EDU | `createLocalCohostAdapter` usa consumer e C107 + C87 unico, consenso separato, Surface A/B HOST. | `HOST_TEXT_WITNESSED` e una dichiarazione dell'host, non attestazione d'identita nativa; dire esplicitamente quando sono fixture. |
| #120 C117 guided | Piano C70 pre-linguaggio, ACK digest, preguard originale C114, readback in processo indipendente. | **Gap riprodotto**: 2 `runGuidedTurn` concorrenti nella stessa istanza attraversano entrambi il callback, possono appendere due eventi con lo stesso contesto. Nessuna lane in-flight. ACK e protocollo, non comprensione LLM. |

## Audit multiastrazione — reticolo di domini

- **Source provenance**: Git commit, tree, carrier digest, decompressione, 43 membri, readback. Baseline R01–R04 via PR118; non duplicare.
- **Admission/governance**: Terms verbatim, C72 selection, host draft separate opt-in; restituzione HOST/NO_VOICE su mancanza. Nessun override dal Project prompt.
- **Cognitive orchestration**: C70 realmente prima della generazione, C117 route, C114 preguard, PR119/C107 C100 C87. Guard non prova che LLM capisca la guida.
- **Temporal/event integrity**: nonce, context window, replay, readback, C87 unico. **Race V8** chiusa per un singolo adapter guided; PR119 runTurn sincrono resta owner originale.
- **Host output**: il testo della Surface A rimane byte-identico, claim `HOST_BOUND` solo dopo owner/readback. Il checker V8 e una condizione necessaria, non un origin attestor.
- **Project UX**: INDEX e una fase di sola indicizzazione e STOP. Il prompt e esterno allo ZIP; l'indice locale puo scadere; il nome del modello e variabile.
- **Adversarial/falsification**: `1M` su lattice host-runtime, `1M` su lattice prompt/bundle, `10k` originali astratti + `200` alterazioni fisiche; test del modello reale assenti. Gli oracles sono indipendenti come implementazione di confronto ma condividono l'interpretazione contrattuale.
- **Integration/deployment**: nessun native ChatGPT per-turno accertato; plugin/connector/Node devono essere disponibili e invocati davvero in ogni turno; nessuna CI puo supplirvi.

## Falsificazione e prodotto cartesiano computabile

Universo delimitato: 18 condizioni binarie runtime (`2^18=262144` combinazioni di idoneita); 18 condizioni binarie INDEX (`2^18=262144`); cinque livelli di prove (file, Git, staged, runtime, native); quattro fasi; tre origini A. Il prodotto cartesiano complessivo astratto e enorme e non copre linguaggio umano illimitato: usiamo quindi una selezione seeded di un milione di scenari per lattice, 20 famiglie ciascuno, con almeno una mutazione obbligatoria nei 18 gate, second fault per copertura pairwise 153/153. Prova della funzione, non prova universale del linguaggio.

- Runtime: `seed 0x2026c120`, 1,000,000 scenari, 100,000 pattern eleggibili, 900,000 rifiutati; 0 divergenze; 153/153 coppie negative. Oracle bitvector separato su 18 gate + ACTIVE/provider/native false. **No 1M C70/LLM calls.**
- Host Project: `seed 0x2026c121`, 1,000,000 scenari, 100,000 INDEX idonei, 900,000 negati; 0 divergenze; 153/153 coppie negative. Oracle bitvector indipendente e `A=NO_VOICE`, NEXT STOP. **No 1M real ChatGPT Project turn.**
- ZIP v14 reale: 10,000 state mutants + 200 fisici: tutti rilevati, dopo correzione di test per campo `stato merged` che non deve accettare un'altra menzione della parola.
- Regressione originale Node: eseguire suite C107/C114/C115/PR119/PR120; campione cognitivo C70 della v7 (1,000) separato.

## DoD reticolare — chiusure e bordi esterni

| Unit | Owner e metrica | Stato |
|---|---|---|
| D01 | Main SHA e tree osservati dal connettore | OBSERVED |
| D02 | Ultime 10 PR merged metadata e file inventory | OBSERVED |
| D03 | PR118 single carrier digest/source pin invariati | LOCAL_TESTED |
| D04 | PR119 owner riusato; nessun secondo C87 | LOCAL_TESTED |
| D05 | C70 prima della porta lingua, ACK match | LOCAL_TESTED |
| D06 | Preflight C114 in guarded route, 0 append su denial | LOCAL_TESTED |
| D07 | Un solo guided turn in-flight; secondo rifiutato prima della porta | FIX_V8_LOCAL_TESTED |
| D08 | Dispose mentre lingua sospesa: nessun append | FIX_V8_LOCAL_TESTED |
| D09 | La lane si sblocca dopo errore/turno | FIX_V8_LOCAL_TESTED |
| D10 | `HOST_BOUND` e A esatta dopo C87 independent reopen | LOCAL_TESTED |
| D11 | Caller flags non autenticano provider/hook | POLICY_TESTED |
| D12 | Lattice evidenza 1M, seed+oracle+log | TESTED_POLICY_ONLY |
| D13 | Lattice INDEX 1M, seed+oracle+log | TESTED_POLICY_ONLY |
| D14 | ZIP 10k + 200 verification, manifest/graph 46/104 | TESTED_STRUCTURAL |
| D15 | Prompt esterno, no duplicato nello ZIP | LOCAL_ARTIFACT_TESTED |
| D16 | Multi-turn su modello host reale, A/B randomizzato | OPEN_EXTERNAL |
| D17 | Callback per-turno nativo ChatGPT Project | OPEN_EXTERNAL |
| D18 | Provider identity and network authenticated | OPEN_EXTERNAL |
| D19 | Persistenza cross-chat di C87 e checkpoint | OPEN_EXTERNAL |
| D20 | App deployment/Project settings install | OPEN_HUMAN |
| D21 | Native identity/event replay safety | OPEN_EXTERNAL |
| D22 | CANONICAL ACTIVE e DOCX same-turn readback | OUT_OF_SCOPE |
| D23 | CI remota GitHub su nuova PR e mergiabilita | REQUIRE_REMOTE_WITNESS |
| D24 | Effetto causale semantico generalizzato reale | OPEN_INDEPENDENT_A_B |

## Caveat di architettura e pulizia futura

1. Il veto v8 per concorrenza e **fail-closed** per la singola istanza guided; non e una coda durabile ne un consenso originale nuovo. Un input concorrente non diventa un evento C87.
2. `dispose` durante la chiamata lingua mette `closed=true` e impedisce successivo append. Non autorizza a cancellare un ledger persistente attivo in altre istanze.
3. Il gate V8 di disclosure riceve evidenza normalizzata; un caller puo inventare un envelope: il suo `eligible` e **solo una conformita di schema**, non un timbro d'origine. I segni da C87 devono essere verificati dall'owner come gia avviene nel wrapper.
4. Quando C87 ha gia scritto e la verifica post-append fallisce, il writer non si puo annullare: non fare retry cieco, conservare ledger e riaprire.
5. `HOST_TEXT_WITNESSED` e una proprieta dichiarata dall'adattatore, non prova indipendente del consenso nel client ChatGPT.
6. Gaps C83/C115 linguistici richiedono nuovi test original-source-epoch prima di cambiare il pacchetto C107; non infilare correzioni lexical di altro owner dentro il carrier congelato.
7. Prompt v15 fa INDEX/STOP; non e un command dispatcher permanente. Vedi file Project esterno per le sole istruzioni di future fasi, subordinate ai Termini.
8. Il numero finito di combinazioni su flags non esaurisce i possibili modelli, contesti, lingue, provider o superfici di attacco: un'affermazione di 'audit completo universale' non sarebbe difendibile.
