# P0 — Due blocchi di avvio: glifo Host e ammissione C72/v2 (PR168)

**Fatti osservati.** Una nuova chat ha mostrato `ORIENTATION`, poi su `I ACCEPT` ha cercato il gateway nel catalogo dei tool, non lo ha trovato ed è rimasta in `C72_OWNER_UNRESOLVED_NOT_ABSENT`. La superficie OneShell, inoltre, talvolta è stata scritta direttamente dall'Host senza il glifo già verificato dalle PR #155 e #166.

**Non è provato** che il gateway originale manchi. Una discovery vuota non certifica né assenza dell'owner né assenza di Node. La PR #167 aveva aggiunto `host/project-c72-postaccept-reentry.mjs` dopo consenso, ma il prompt portabile non prescriveva di tentare il reingresso prima di fermarsi.

## Gold recuperato

PR #155: identità visuale Host. PR #158: fonte pinnata, Node loader, ZIP sorgente esclusivamente post-EDU e ponte definitivamente assente. PR #159: prima frase di ogni nuova chat è soltanto orientamento. PR #161–164: six-slot, gerarchia A/B, EXIT a due turni, badge derivato, `required_ack`. PR #165: preaccept fisso HEAD + cinque letture, gateway C72 preinstallato soltanto. PR #166: hash ufficiale SVG `b6dc3f6e...` e `HEADER_LEFT_OF_TITLE`. PR #167: fallback originale post-consenso con witness degli SHA Git.

## Soluzione minima riutilizzabile

1. `planC72HostRecovery`: la discovery vuota apre la verifica Host di Node e trasporto, non un compito tecnico per l'utente. Dopo un nuovo messaggio esatto `I ACCEPT`, con Terms mostrati e prova delle cinque letture, un percorso verificato può chiamare l'owner C72 originale attraverso il reingresso della PR #167. Mancanza attestata/UNKNOWN → STOP tipizzato senza retry, voce o ricevuta inventata.
2. `emitVerifiedHostOneShell`: la via d'emissione HTML controllata dal repository ammette **esattamente un** SVG con hash canonico prima del titolo, sei slot validati byte-exact e nessun avatar/UI nativo dichiarato. L'adapter `presentOneShellHostOnly` usa questo confine. In testo puro, `TEXT_FALLBACK_NO_SVG` dichiara che non c'è un logo verificato.
3. `project/session-chat/PROMPT.txt`: l'Host deve provare il recupero originale post-accept prima dello STOP, mantenere i gate umani distinti, non chiedere al profano di «verificare il gateway» e usare l'emittente del repository. Il prompt resta portabile, HEAD-agnostic e sotto **8.000 byte UTF-8**, con margine anche per l'header pinned nei test storici.

## Reticolo semantico minimo e falsificazione

`HEAD → cinque blob → Terms link → nuovo I ACCEPT → capacità Host verificata → C72 originale + ricevuta → nuovo EDU → sorgente verificata → C135 → emissione Host SVG verified`.

Il test `tests/project-c72-host-recovery-emission-p0.test.mjs` esegue 1.000 casi (10 formulazioni umane × 10 condizioni C72/Node/API × 10 scenari visivi), con serializzazione JSONL, SHA-256 e ricevuta rilette. I casi attraversano **codice Node reale e renderer originale**, non sono meri esempi testuali; non equivalgono a 1.000 vere sessioni native ChatGPT. La regressione valuta anche `Scelgo EDU` rispetto a `EDU`, `I ACCEPT\n`, HTML injection, SVG esattamente una volta, assenza di fake A ed errori typed.

## Confine di risultato e criterio reale di rilascio

**Risolto nel codice repository**: percorso di recupero post-consenso qualificabile, azioni espresse in lingua umana, richiamo all'owner originale, emissione HTML con glifo verificato o STOP. **Non risolto dal solo codice**: imposizione del renderer a tutte le risposte prodotte direttamente da ChatGPT, installazione del gateway nel provider, continuità dei witness tra chat, avatar nativo e origine verificata dei messaggi umani. Il provider deve esporre e far utilizzare l'adapter: `PRODUCT_NO_GO` finché prove indipendenti non attestano questa integrazione.

La PR non trasferisce accettazioni C72, ledger, istanze C135 o SOURCE_LOCK dopo merge. Test CI verdi qualificano il software, non registrano un'identità ChatGPT.
