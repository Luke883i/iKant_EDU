# PR2 — DoD del DoD e audit post PR1

**Preimage upstream reale:** `4f2e778a1c64c7df5868ac22e431c62c44f2188a` (main dopo il merge della PR #241). PR1: 32/32 workflow sul commit sorgente della PR conclusi con successo, senza modifica di 116 workflow. Questo è un esito CI, **non** un certificato di prodotto.

## Audit PR1: regressioni chiuse e residui
- Corretto il falso significato di `RISPOSTA EDU VERIFICATA` e `VOCE_VERIFICATA`: significa turno tracciato, non contenuto vero.
- Project EDU e MCP_EXTERNAL hanno entrypoint, consenso, sessione, identita e deployment distinti.
- La review ha falsificato due difetti della catena: vecchio Git blob non presente in shallow clone (M2) e successione V5-B non coincidente con `source_main` del predecessore. Entrambi corretti e verificati dai workflow conclusi.
- Restano **aperti** il README storico non fisicamente compresso (R06), le vere risposte/provider ChatGPT, la persistenza MCP cross-restart e la validita multilingue del classificatore. PR2 non deve auto-dichiararli risolti.

## DoD astratto
Un DoD è una condizione **osservabile e falsificabile**, non una promessa, una voce nel registro o un hash scelto dall'autore. Richiede: soggetto, contesto, HEAD reale, operazione, oracolo, controprova, readback e limite epistemico.

## DoD globale
Il denominatore rimane **64 DoD**, partizionati senza duplicazioni tra Setup (5), PR1 (12), PR2 (19), PR3 (7), PR4 (4), PR5 (17). **99% su 64 significa 64/64 PASS effettivi**. La registrazione di 64 righe non equivale a nessun PASS runtime.

## DoD intermedio
Project (sei obbligazioni), MCP (sei), qualità software e runtime (sette). Ogni dominio richiede prove distinte: test di owner Node non sono attestazioni provider; policy OAuth locale non è server SDK avviato; hash dei log non è autenticazione indipendente.

## DoD locale e politica di evidenza
Il contratto [pr2-runtime-dod-of-dod](../contracts/pr2-runtime-dod-of-dod.v1.json) indirizza tutti i 19 DoD al test, owner e falsificatore. Le verifiche locali avranno:
1. `git rev-parse HEAD` e `HEAD^{tree}` letti dal checkout, nessuna etichetta autore dichiarata.
2. Esecuzione di test Node degli owner originali con exit code, numeratore e denominatore TAP, stdout/stderr conservati e SHA-256 calcolati.
3. Rilettura da file distinto del medesimo output, controllo digest e divieto di record mancanti o manomessi.
4. Mutazioni: SHA sostituito, PASS auto-dichiarato, stato provider falsificato, esclusione del log, omissione di un DoD e modifica del percorso devono declassificare.
5. Risultati `OPEN/BLOCKED` preservati per runtime HTTP MCP senza SDK, restart non osservato, invarianti multilingue fallite e ogni provider esterno.

**Risultato atteso:** `LOCAL_RUNTIME_EVIDENCE_SCOPED`, mai `PRODUCT_GO`. Se un caso non è stato esercitato, la chiusura deve riportarlo come `NOT_OBSERVED`, non come PASS.
