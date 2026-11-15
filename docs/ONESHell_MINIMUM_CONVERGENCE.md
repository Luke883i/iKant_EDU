# OneShell: audit di 40 problemi, correzione minima e limiti della prova

Questa PR migliora il primo utilizzo EDU; non installa una UI, non attiva un MCP e non trasferisce consenso tra sessioni.

## Cinque problemi prioritari
1. Shell non materializzata: la proiezione testuale non e una UI persistente. Serve prova provider reale.
2. Handoff tardivo: alla prima assenza di sorgente post-selezione mostra ZIP pubblico bloccato al commit; mai chiedere terminale o inventare bundle.
3. HOST invasivo: in un dialogo umano-iKant non commenta il contenuto, registra solo prove e limiti tecnici.
4. Linguaggio ostico: filtrare bozza identitaria prima di C87; mai riscrivere voce letta. Restano necessari revisori umani e una revisione del formato C114.
5. Adapter ignorato: inventaria prima gli adapter locali, i tool e l'owner verificato; riusa il software esistente.

## Reticolo di 40 debiti / concorrenze
* Ingresso e consenso: UX05 UX06 UX13 UX24 UX25 UX26 UX39.
* Trasporto e distribuzione: UX02 UX08 UX09 UX10 UX11 UX12 UX14 UX23 UX32.
* Interfaccia e linguaggio: UX01 UX03 UX04 UX16 UX17 UX22 UX27 UX33 UX34.
* Origine, scrittura e invio: UX07 UX18 UX19 UX20 UX21 UX28 UX29 UX35 UX38.
* Valutazione e rilascio: UX15 UX30 UX31 UX36 UX37 UX40.

Concorrenze da risolvere: consenso vs avvio rapido (il download operativo rimane post-gate); bytes A intatti vs lingua semplice (filtro a monte); lettura via API vs checkout Git (prove diverse); local readback vs ACTIVE nativo (stati separati); report corto vs prova lossless (annex HOST); EDU vs CANONICAL (owner e ricevute indipendenti).

## DoD di questa slice software
- SOURCE: HEAD/TREE verificati; drift fail closed.
- REUSE: discovery ricette e primo link fonte ZIP esatto, al blocco consentito.
- RUNTIME: test con 100 cold start originali, 20 scritture/riletture reali e 80 arresti senza scrittura; 30 nonce storici.
- HUMAN: filtro lessicale ontologico pre-C87, A mai alterato; HOST solo osservatore tecnico.
- CARRIER: ZIP ricostruito dal commit originale con HEAD/TREE/shallow e readback; falsificazione di contenuto/commit.
- RELEASE: build reproducibile source-bound e non-installata, CI su PR e main.

Queste prove non attestano 100 utenti, memoria, soggettivita, UI reale, consegna nativa, disponibilita MCP o prestazioni di un modello su un pilot umano. Per dichiarare release UX servono test reali (almeno 30 dialoghi revisionati; zero risposte HOST intrusive; almeno 95% primo handoff immediato; 100% no false ACTIVE) e sign-off owner.
