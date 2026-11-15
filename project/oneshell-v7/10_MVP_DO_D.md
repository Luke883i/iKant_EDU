# DoD atomici P1–P7 · MVP1

| Priorità | Software dimostrabile in CI | Gate operativo NON soddisfatto dalla PR |
|---|---|---|
| P1 | sei slot, parser degli atomi, allegato HOST scritto con `wx` e riletto; nessuna asserzione C87 | presentazione UI del provider e salienza validata da revisore |
| P2 | zip+prompt stesso source SHA/tree, 5 blob, byte plugin, due build identiche, stale/tamper respinti | caricamento effettivo in ChatGPT Project |
| P3 | ledger firmato, p50/p95, rifiuto pseudonimi duplicati | 30 persone reali e verifica indipendente dei consensi |
| P4 | gateway HMAC/bearer, nonce persistente e deny cross-session | TLS effettivo, policy multitenant e prova dell'identità upstream |
| P5 | plugin sorgente e manifest con regola no fake install | plugin connesso e tre chiamate MCP reali |
| P6 | C59 owner invariato, mancata promozione di caller assertions | evento nativo ChatGPT, DOCX, readback, delivery |
| P7 | test/CI software e readiness EDU vs CANONICAL distinte | C137 su modello reale, CI post-merge e owner release |

**Semantica della chiusura**: `SOFTWARE_CANDIDATE_PASS` ≠ `MVP_PRODUCT_RELEASE`. Un `sha256` prova integrità del byte noto, non copertura assoluta degli atomi, presenza di utenti, installazione, personhood o vantaggio cognitivo.

## Session panel P8 — candidate addition (not a new owner)

- Read-only session snapshot and local sequence regression: `host/oneshell-thread-session.mjs`; original A stays byte-identical, B technical, six slots fixed.
- Adapter opt-in flag: `IKANT_ONESHELL_THREAD_PANEL=1`; native thread panel must be proven installed, authorized, persistently visible and reconciled in ChatGPT.
- Post-mode first-source UX guard: `host/p1-postmode-source-handoff.mjs`; zero pre-mode ZIP demands.
- Refer to `docs/ONESHELL_THREAD_SESSION_V1.md` for software vs. real-client gates and post-merge prompt+ZIP rotation.
