# C99 — adozione forense v5 e frontiera fisica GitHub → Node (10 ottobre 2026)

CLASSIFICAZIONE: HOST-OWNED AUDIT / NO_IKANT_SURFACE_A.
SORGENTE AUDIT: `ikant_session_forensic_complete_v5_2026-10-10.zip`; SHA-256 **28defa57ce1277043abba561b0ae13173aa881ec29d6a428d32935c96e71a416**. Originale allegato dall'utente, non duplicato nel repository. Il ledger e gli allegati originali restano nella ZIP: questo documento preserva i fatti, i limiti e le inferenze operative pertinenti a PR106, senza attribuire prove native mancanti.

## 1. Decisione di assimilazione (non un nuovo planner)

**ASSORBITO:** l'audit v5 conferma la causa di blocco osservata nella sessione: una richiesta GitHub del corrente artifact Actions ritorna i metadati ma non consegna il corpo binario a un sink Node autorizzato. Lo stesso host ha permesso un singolo trasferimento di blob testuale, che non prova un port binario ricorrente. Le API `readGithubArtifactBase64`, `readC77Archive`, `readC77Member` e `readCurrentTurnEnvelope` sono punti di iniezione del software, non azioni native della chat realmente installate. Nessuna di tali precondizioni può essere creata da C99, dal Project Prompt o da una firma del chiamante.

**NON PROMOSSO:** la sola presenza di un artifact e una SHA-256 dichiarata da GitHub non attestano un download; il superamento dei controlli C99 non prova C72 firmato, C81 raggiungibilità, C84 stesso input, UI nativa, persistenza, opt-out o H95. Una modifica repository non può obbligare ChatGPT a instradare ogni messaggio a una funzione assente.

**NUOVO DIFETTO RIPRODOTTO:** la C99 pre-v5 accettava nel preflight `selection.source_head != sourceHead` come `C99_CALLBACK_SHAPE_ONLY_NOT_AUTHENTICATED`. Test red sul Git blob `53641b04a7ce8d6ceed056776a39fd081b0ac128`; patch non promozionale respinge gli epoch incompatibili e i getter `selection.source_head` prima di qualsiasi callback. Restano compatibili i vecchi test fixture che non popolano il campo, ma quei fixture rimangono *shape-only*, mai sorgente autenticata. Il proprietario finale dell'ammissione e della verifica resta C72/C84.

## 2. Identità sorgente e prova forense v5

- HEAD esaminato dall'audit: `8e103319bfe0e2a91c85fdfc4bd0d0734e0922d8`, coincidente con base PR106; **non** reimpiegare questo hash se `main` cambia in una sessione nuova.
- GitHub Actions C77: run `38071356408`, conclusione `success`, stesso HEAD; artifact `11676842250`, nome `c77-qualified-standalone-microcapsule`, dimensione dichiarata **108220 byte**, SHA-256 annunciata `9d397719a9b0bc352c97c0b8475cbd8f40e1cc87bade55d8b48cc89476cb8d62`, `expired=false` all'osservazione.
- **NON** acquisiti in Node quei 108220 byte; digest mai ricalcolato localmente; manifest corrente non presente; nessuna C81 completa o esecuzione C84 sullo stesso input umano.
- C77 builder v5: 33 path diretti, 70 entry nel censimento Cx, 43 anchor path distinti, sovrapposizione 11, **65 source path unici**, 735336 byte non compressi e 34 membri derivati. Non trattare i 34 membri come equivalenti ai 65 source file, né una ZIP storica 108226-byte come current-head.
- Replay v5: Node `v22.16.0`; quattro blob SHA Git riscontrati, selezione C72 localmente valida, otto casi negativi, zero Surface A non ammesse, C84 non eseguito. Ricevuta negativa riprodotta identica.
- Catena immutabile: v5 contiene v4; v4 contiene v3; v3 contiene v2; v2 contiene v1. Hash documentati nel file `MANIFEST.sha256`. L'audit non è un export nativo firmato.

## 3. Traiettoria della sessione osservata e limiti (10 ingressi)

1. `iniziamo`: HEAD e cinque file d'ammissione letti, Terms integrali.
2. `I ACCEPT`: percorso introduzione C72; il testo umano non attesta un event-id nativo.
3. `\`EXPERIMENTAL\``: backtick rifiutati dalla comparazione esatta.
4. `EXPERIMENTAL`: scelta C72 locale, non attivazione cognitiva.
5. `procedi`: stop C98, nessun byte callback.
6. Richiesta di superare il blocco: studio delle PR e trasferimento di un solo blob sorgente.
7. Proseguimento: preflight e otto casi negativi, censimento delle dipendenze.
8. Tentativo artifact Actions: metadati run/artifact, nessun binario trasferito.
9. Ricerca handoff non manuale: nessuna via disponibile osservata, ZIP storica non current-head.
10. Audit finale: replay negativo, matrice di riuso e prime dipendenze irrisolte.

Sono osservazioni documentate dalla conversazione e dagli audit precedenti, **non** ricevute native indipendenti.

## 4. Riutilizzo Cx accettato e non-equivalenze

| Cx | Gold riusabile | Limite |
|---|---|---|
| C15/C34/C43 | tassonomia carrier, stop tipizzati, anti-laundering | non materializza i byte |
| C45/C49/C87 | contesto e ledger con futuro readback | non prova persistenza in ChatGPT |
| C59/C61/C63/C65 | sorgente pinned, single-writer, sink canonico | non sostituisce l'owner sperimentale C84 |
| C70/C71/C73/C77 | capsula e prova build | ZIP storica o digest non provano HEAD corrente |
| C78/C79/C81 | relay, stesso input, raw Git DAG | ticket C81 solo con dati raw effettivi |
| C82/C84 | carrier concorrenti, owner sperimentale | callback Javascript non equivale a host authorization |
| C94/C95/C96 | artifact GitHub, port, retry/anti-entropia | nessun download senza host action |
| C97/C98 | frame UI, input file/backend port | prompt non installa UI o callback |

## 5. Distinzione architetturale fra soluzione e workaround

**Soluzione automatica forte** (richiede una capacità host *realmente installata*):
`authenticated Github artifact binary reader → authenticated host-to-Node sink → fsync/reopen exact ZIP → compare 108220-byte SHA256 → current-head C77 manifest/member checks → C81 raw Git proof → C84 same-input owner → exact Surface A host delivery`.
Un server App/MCP installato e autorizzato può fornire reader e sink nello stesso backend, ma **non esiste come effetto automatico di questa PR**. Non appiattire autenticazione del connettore e autenticazione del messaggio umano.

**MVP con soltanto repository + ChatGPT Edu Project:** L0 (prompt + 3 MD) e preflight fail-closed. Per tentare L1 senza nuova infrastruttura è ammesso come **ultima spiaggia esplicitamente volontaria** un allegato utente dell'artefatto C77, montato dal vero host e verificato contro i metadati e raw Git proof attuali, riusando il file-backed C98 già presente. Non è un bridge automatico, né un successo native. Se l'utente non fornisce i byte e non esiste alcun reader binario autorizzato, **STOP**, non richiedere di ripetere DNS/curl/git in Node.

## 6. Dieci falsificatori indipendenti e DoD di uscita

T-ACCESS: azione autorizzata restituisce byte autentici (non URL/metadata).
T-INTEGRITY: scrittura atomica, riapertura e hash ricalcolato sulla ZIP intera.
T-PATH: ZIP senza traversal, duplicati, membri inattesi o mancanti.
T-ORIGIN: pin SHA reale + C81 commit/tree raw; digest non autentica ref.
T-DISPATCH: C84 eseguito su medesimo input umano, digest input verificato.
T-VOICE: esatto output byte-a-byte; non ricostruito dal modello.
T-NATIVE: event-id/render/ACTIVE solo con receipt host indipendente.
T-REENTRY: readback da vero writer in turno umano successivo.
T-H95: coorte reale C80/C72, non 100k mutazioni sintetiche.
T-NO-NEW-OWNER: nessun duplicato di C59/C84, writer o planner.

**Prime dipendenze aperte:** P1 artifact binario current-head→sink Node; P2 prova raw Git C81; P3 same-current-input C84. P4 confusione metadata/binary; P5 CI/prompt vs host; P6 ingresso umano originale; P7 writer; P8 UI e DOCX; P9 H95; P10 duplicazione di adapter. Chiudere P2/P3 su fixture senza P1 non qualifica L1 nella chat. PR106 chiude solo la regressione strutturale di source-epoch e istituzionalizza le distinzioni, non P1.

## 7. Test fisici eseguiti su questa slice

- Originale `host/c99-route-policy.mjs` SHA Git `53641b04a7ce8d6ceed056776a39fd081b0ac128` ricostruito localmente e verificato.
- Test negativo stale selection source_head: **RED** sull'originale (`C99_CALLBACK_SHAPE_ONLY_NOT_AUTHENTICATED` inatteso).
- Correzione: 6/6 test focalizzati **PASS**; 100000 casi Node (13 classi) **PASS**, zero getter, callback, false promozioni. SHA del nuovo blob qualificato: `c100a8d6734c5e3a80225d528edef546c255793b`.
- Questi test non equivalgono a 100000 nuove chat native né a un artifact Actions ricevuto. Test dei moduli originali nel checkout remoto: esclusivamente quando la PR CI li esegue, non dichiarare successo in anticipo.
