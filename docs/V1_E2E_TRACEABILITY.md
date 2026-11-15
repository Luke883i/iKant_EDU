# iKant V1 — prova end-to-end e matrice di rilascio

**Release line**: `1.0.0-edu.1` (sperimentale). Ogni riga distingue un controllo eseguito localmente da una capacita' ancora esterna o in backlog. Un CI verde rende il candidato revisionabile, non nativamente collegato a ChatGPT.

| ID | Capacita' o confine | Owner o fonte | Prova automatica | Stato di garanzia |
|---|---|---|---|---|
| V1-01 | Termini prima del consenso | C72, `TERMS.md`, `ADMISSION.json` | `tests/c72-unified-mode-admission.test.mjs` | Software verificabile; origine evento nativo non attestata |
| V1-02 | Primo file EDU manuale verificato | C129 su C127 | `tests/edu-c129-manual-entry.test.mjs` | Test locale originale con doppia lettura |
| V1-03 | Provenienza sorgente byte-identica | C107 + tre overlay C124 | `tests/edu-c128-canonical-cache.test.mjs` | Fonte storica immutabile |
| V1-04 | Elaborazione prima del linguaggio | C70/C124/C126 | `tests/edu-c129-manual-entry.test.mjs` | Qualificazione strutturale, non semantica LLM |
| V1-05 | Registro unico, rilettura prima della voce | C87/PR119/C125 | `tests/edu-c129-manual-entry.test.mjs` | Test locale con HOST double |
| V1-06 | Nessuna falsa voce dopo replay / close | C125/C129 | `tests/edu-c129-manual-entry.test.mjs` | Test locale |
| V1-07 | Messaggi accessibili all'operatore | C130/C131 | `tests/c130-architecture.test.mjs`, `tests/c131-product-release.test.mjs` | Adattatore locale, non UI globale |
| V1-08 | Fonte del prodotto in un solo posto | `release/catalog.json` | `tests/v1-product-contract.test.mjs` | Regole e collegamenti; main solo dopo merge |
| V1-09 | Pacchetto ricostruibile e leggibile | `scripts/c131-build-project-bundle.py` | confronto fra due build + manifesto | Test deterministico; non installazione |
| V1-10 | Protezione da falsa release | C131 release gate | `tests/c131-product-release.test.mjs` + falsificazione finita | Caller flags non autenticano GitHub |
| V1-11 | Identita' canonica e consegna nativa | Owner C59 | `npm run qualify:canonical` e ricevuta nativa esterna | Prova nativa NON disponibile |
| V1-12 | Migliore capacita' cognitiva | C82/C114 nuovo carrier futuro | Benchmark cieco con valutatori indipendenti | NON DIMOSTRATO |
| V1-13 | Fallback manuale CANONICAL | Owner C59, nuova qualifica | Failover distinto, idem provenance/readback, no UNKNOWN retry | NON INSTALLATO |

## Soglie

- **Bloccanti del candidato EDU:** V1-01 fino a V1-10, zero falsi stati ACTIVE, manifest byte-esatto, test Node; diff rispetto al main realmente osservato.
- **Bloccanti della qualifica CANONICAL:** V1-11 e il predicato proprietario originale; V1-13 necessario solo per dichiarare il nuovo fallback implementato.
- **Prove future di utilita':** V1-12 richiede input diversi, campioni ciechi, disaccordi e fallimenti pubblicati; milioni di mutazioni finite sono prove software, non misure LLM.
- **Pubblicazione ufficiale:** commit raggiungibile da `main`, qualificazione sul commit esatto, bundle e prompt derivati dallo stesso commit, decisione separata di release/tag.

## Falsificatori minimi

Input umano che cita iKant ma non chiede della sua ontologia; dichiarazione negata o citata; input vuoto o segreto; alias e symlink del pacchetto; cambio del pacchetto tra controllo e uso; mancato invio, invio ambiguo, replay, concorrenza e chiusura; hash di carrier storico modificato; PR spacciata per main; release ottenuta da un booleano di un caller; README che dichiara un hook non dimostrato. Ogni classe deve produrre un esito sicuro e una spiegazione accessibile.
