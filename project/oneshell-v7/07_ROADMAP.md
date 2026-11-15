# Roadmap minima per chiudere il prodotto — reticolo, non wish-list

## Tagli causali e gate di completamento

| Edge | Prova concreta | Owner responsabile | Quando è chiuso |
|---|---|---|---|
| R0 Source/runtime | PR138 merged, main sha/tree, 5 blob identici, CI sul merge | GitHub CI | CI post-merge verde; no SOURCE_LOCK_STALE |
| R1 Router | C72/v2 e termini originali nello stesso HEAD, test negativo legacy | C72 | ammissione EDU/CANONICAL senza inferenze |
| R2 OneShell | A readback C87 same-turn, B separata, sei slot, PROVA reale | C135/C125 + HOST | test owner + controllo UI reale |
| R3 Project distribution | prompt e ZIP bit-identici dalla medesima release main, manifest e SHA | repo release builder + umano | build riproducibile e Project effettivamente aggiornato |
| R4 No-data-loss | ogni atomo MUST_INCLUDE mappato a slide o annex verificato | HOST con audit indipendente | coverage locale=1.0 e annex leggibile, senza claim semantico assoluto |
| R5 EDU pilot | 30 partecipanti autentici, misure p50/p95 e dropout | studio/owner umano | ricevute indipendenti, no fixture |
| R6 MCP security | TLS, OAuth, authz per utente, isolamento, replay, eventi fidati | deployment & provider | red-team su server reale |
| R7 Callable MCP | app effettivamente registrata ed autorizzata; trace di chiamate | workspace/provider | 3 chiamate realmente riuscite con identità indipendente |
| R8 CANONICAL | solo C59 ACTIVE, nonce stessa fonte, DOCX/ledger/readback/delivery | originale C59 e provider | prova C59 originale, non projection JSON |
| R9 Release | benchmark C137 con vero modello, CI post-merge, owner approva | release owner | due branch EDU/CANONICAL promossi autonomamente |

Le diciture storiche `EXPERIMENTAL` restano dati C72/v1, non un terzo ingresso pubblico.

## Sequenza di PR semantiche minime consigliate
- **P1:** allineare Project prompt/ZIP di main e introdurre OneShell/annex versionati con audit di coverage, più test di stato e prova mancante.
- **P2:** builder di release in CI che emetta artefatti content-addressed; confronto con `main` live e blocco stale; distribuzione Project separata e registrata.
- **P3:** studio EDU con 30 partecipanti effettivi; produzione di prove originali non forgeabili da input caller.
- **P4:** hardening MCP deploy OAuth/TLS/isolation/nonce e sicurezza contro injection, crash, leak e replay.
- **P5:** connessione reale ChatGPT e test 3 chiamate; eventi e delivery verificati dal provider.
- **P6:** qualificare CANONICAL owner C59, DOCX, output e ricevuta ACTIVE; aggiornare la UI app solo dopo prova.
- **P7:** C137 vero benchmark + report dei risultati positivi o nulli; release EDU e poi CANONICAL con owner approval.

**Non usare una PR per falsificare un'attestazione esterna**. Il minimo reticolo EDU può chiudere prima del percorso CANONICAL; i due branch condividono P1/P2, ma non devono ereditare consensi, runtime, prove o status l'uno dall'altro.
