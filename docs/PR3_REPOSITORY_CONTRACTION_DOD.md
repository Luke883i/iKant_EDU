# PR3 — Repository Contraction, DoD del DoD

**Baseline reale**: `main@36646712e5f27fef337784e1a00b3849dfb38b48` (post merge PR2). Tree: `f3462a53ed65dab3d338b2aca84c7a0486dd0d1a`. Original 1.619 file tracked, 16 root.

## Risultato misurabile atteso
Un cut fisico, **non** uno shim: il blueprint storico `render.mcp-prepr.yaml` (Git blob `67ad97ad...`, 1.107 byte) passa a `docs/archive/prepr/render.mcp-prepr.yaml`, byte exact. Root **16 → 15**. Il Render standalone attuale `render.mcp-standalone.candidate.yaml` resta esattamente allo stesso percorso. Nessuna eliminazione del contenuto storico né modifica agli owner C72/C135/C87/C125.

## Audit PR2
PR #242 è merged su main con HEAD `953caf5f...` e CI 17/17 verde. Ricevute locali Node e policy MCP, non provider nativo; `M07/M08/T06` ancora aperti. Il percorso M2 shallow/V5-B e la correzione nested test runner sono now source-based; nessun test di PR2 prova in modo indipendente che ogni consumer root sia eliminabile.

## DoD del DoD: gerarchia
- **Astratto:** meno root/operazioni e stessa semantica; una riduzione numerica senza equivalenza dei consumer non è un successo.
- **Globale:** 64 obblighi originali invariati, 7 responsabilità PR3 uniche, intersezioni con i 22 gate cumulativi I9/I10, niente auto-PASS.
- **Intermedio:** inventario HEAD tracciata, grafo consumer (espliciti/euristici), unknown e external manual hold, cut fisico, archivio originale, single-owner, regression.
- **Locale:** root before/after, blob Git esatto, assenza alias, consumer live vecchio percorso = 0, storico originale invariato, test avversariali e CI HEAD.

## Consumers qualificati
Il builder `scripts/oneshell-v1-build.py` è pinnato all'HEAD storica `afb6f1cb...` e legge `git show HEAD:path`: la sua preimage storica resta disponibile in Git, **non** è un consumer della root nel working tree attuale. La guida del 20 ottobre, il piano V5-B e l'inventario originario sono snapshot storici, non un'istruzione per ricreare un alias. Il test del piano storico viene potenziato: conserva la prova che il cut era inizialmente HOLD, ma verifica anche il successore e il blob.

## Limiti / debiti
La nuova lettura source-only non dimostra che un utente Render abbia configurato manualmente un path arbitrario, né che ogni consumer dinamico sia noto. Queste possibilità restano `UNKNOWN` e richiedono review, non `PASS`. **15 file root restano**; il repository non è dichiarato universalmente minimale; la riduzione di uno slot è un cut locale e falsificabile. Nessuna modifica ai 116 workflow.

**Verdetto previsto:** `PR3_ROOT_CUT_SCOPED_PASS / UNKNOWN_EXTERNAL_HOLD / PRODUCT_GO=false`.
