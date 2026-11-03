# Migrazione E2E del repository: iKant_LE → iKant_EDU

**Documento di strategia, non ricevuta di rename.** Baseline GitHub: `Luke883i/iKant_LE/main` a `1de5b51a2578e31547e4ef98e7d35d55926d05a3`, TREE `b5bcce4efcaca9209217002ad4900f2f72950a77`, repository ID GitHub `1371330383`. Il rename amministrativo **non è stato eseguito**. La decisione sul nome appartiene al proprietario del repository; Host authority=0.

## Scopo, modello 2DiM e strategia selezionata

L'oggetto da migrare è **un solo repository GitHub** con i suoi consumer tecnici, i Project ChatGPT e le evidenze originali. `2DiM` è usato qui come **analisi a due dimensioni** (definizione di lavoro, non framework scientifico esterno):

- **D1 – Identità software e disponibilità:** GitHub repository ID, HEAD/TREE/blob, referenze esatte, source manifest, action/workflow, plugin, deployment, Pages, package, link Terms, generatori.
- **D2 – Autorità, eventi e continuità epistemica:** C72 come owner dell'ammissione, C135, C87, C125/S03; ledger/ack/readback, consenso umano distinto, OneShell, provider e installazione ChatGPT Project. Un redirect D1 non prova D2.

Matrice decisionale:

| Approccio | D1 | D2 | Reversibilità | Decisione |
|---|---|---|---|---|
| Rinomina immediata e affidamento ai redirect | FAIL potenziale | FAIL | incerta | SCARTATO |
| Due nomi canonici simultanei, per sempre | non deterministico | viola owner/source lock | incerta | SCARTATO |
| Preparazione verificata → click amministrativo singolo → riqualifica post-rename | verificabile per fasi | nessuna traslazione delle ricevute | esplicita | **SELEZIONATO** |

La funzione di scelta è **lessicografica**: prima zero violazioni di autorità/receipt, poi integrità Git, quindi compatibilità consumer e impatto sul prodotto. Non barattare sicurezza C72 con comodità dei redirect.

## Audit iniziale e falsificatore concreto

Dal repository verificato risultano almeno questi bind **esatti**: `ADMISSION.json.repository`, `BOOTSTRAP.json.canonical_repository`, `contracts/orientation-capsule.json`, `src/first-contact.mjs`, `src/admission.mjs`, `src/runtime-root-verified.mjs`, `host/c72-public-mode-admission.mjs`, `host/project-c72-postaccept-reentry.mjs`, `host/project-c72-coldstart-seed.mjs`, `host/project-c72-negative-entry.mjs`, `scripts/build-project-oneshell-prompt.mjs`, `scripts/project-oneshell-source-pin-audit.mjs`, `release/catalog.json` e `plugins/ikant-le-session-chat/plugin.json`. La ricerca indicizzata rileva circa 150 file con il vecchio nome, inclusi molti test e documenti storici: la sua copertura **non** prova la chiusura dinamica o esterna.

I link Git e web sono normalmente reindirizzati da GitHub; **GitHub Actions e reusable workflows non seguono i redirect**. Qualsiasi caller esterno `uses: Luke883i/iKant_LE/...` deve essere trovato e corretto oppure resta gate aperto. Le GitHub Pages e le integrazioni con URL hardcoded richiedono verifica autonoma. Documentazione: https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository e https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations.

## DoD reticolare: partire dall'effetto, risalire alle precondizioni

`RG` (globale): lo stesso repository e la stessa catena di autorità originale funzionano sotto il nuovo nome senza trapiantare ricevute, falsificare eventi, interrompere consumer critici o installare un secondo prompt canonico.

`RG ← I1…I6`: I1 identità Git, I2 C72 e owner, I3 repository e consumer esterni, I4 test e reviewer, I5 cutover amministrativo, I6 prova post-cutover/continuità. I sei nodi intermedi dipendono da 26 nodi locali `L01…L26` nel contratto `contracts/repository-rename-2dim.json`.

**Regola formale:** ogni nodo `PASS` richiede riscontro proprio; un PASS CI non soddisfa automaticamente un nodo OWNER o PROVIDER. Per `RG` serve congiunzione di tutti gli intermedi; `UNKNOWN` obbligatorio blocca solo l'effetto che lo richiede.

## Checkpoint 0 — baseline immutabile (READ-ONLY)

☐ Verificare un'unica HEAD `main`, TREE completo non troncato e SHA dei file bootstrap/owner; registrare anche GitHub repository **ID=1371330383**, owner e stato delle PR.

☐ Congelare manifest dei consumer critici, immagini/plugin, URL Terms, source-lock e regole branch. Ricercare staticamente `iKant_LE`, `Luke883i/iKant_LE`, `raw.githubusercontent.com` e `api.github.com`; distinguere _operativo_, _test_, _storico_, _esterno sconosciuto_.

☐ Individuare workflow interni, action e reusable workflow chiamati da altri repository, Pages, deployment, secret, webhook/OAuth, package GitHub, release, cache, remotes e IDE/connector. Gli endpoint admin non leggibili restano `UNKNOWN`, non `PASS`.

## Checkpoint 1 — PR di PREPARAZIONE, mantenendo ancora iKant_LE canonico

☐ Consolidare l'identità repository in **un unico contratto originale** usato da tutti i consumer; introdurre lettura di `repository.id` **da un evento GitHub autenticato**. Il solo modello non può costruire tale attestazione.

☐ Predisporre la switch di fase `OLD_CANONICAL → ADMIN_RENAME → NEW_CANONICAL` senza consentire due owner o due nomi canonici simultanei. Prima del click resta vero `iKant_LE`; `iKant_EDU` è solo destinazione programmata.

☐ Riqualificare **gli originali** C72: link Terms, offer/acceptance/reentry, coldstart/transit e allineamento al source lock; C135/C87/C125/S03 rimangono unici e non devono essere clonati per il rename.

☐ Aggiornare generatori prompt V5-A, catalogo, manifest, source-pin audit, consumer di primo contatto, script, test, brand, plugin e build. Preservare snapshot storici; non fare sostituzione indiscriminata nei permalink alle PR.

☐ Riqualificare i test della stessa HEAD su nomi, fork omonimi, typo, Terms con host avverso, HEAD/TREE diversi, vecchi receipt, owner dubbio, replay, plugin/app e permessi.

☐ Per ogni mutazione del codice originale, verificare impatto sui blob C72/C114/C141 con eventuali source-lock storici; **nessun repin implicito**. Applicare change governance V5-B e review V5-G separata.

## Checkpoint 2 — preflight amministrativo (GO/NO-GO)

☐ Due ingegneri indipendenti approvano il report e test; un responsabile umano con permesso `admin` autorizza in modo esplicito l'operazione.

☐ Tutti i workflow/check **richiesti** sono verdi e letti dall'API/provider, non dedotti dal nome YAML. Il caricamento di prompt ChatGPT Project attualmente installato è verificato o il percorso dipendente è bloccato.

☐ I caller action/workflow esterni sono migrati: GitHub non reindirizza tali invocazioni. Pages, webhook/OAuth, app GitHub, MCP, package e siti esterni hanno owner, finestra e prova operativa, oppure STOP.

☐ **Subito prima** del click: riaprire ID, full_name, HEAD, TREE, branch, fonte di Terms e permessi del repository; nessuna modifica concorrente. Annotare un solo `CUTOVER_ID` con fonte e readback; non un nuovo nonce C72.

**Se un prerequisito essenziale è UNKNOWN: NO-GO, nessun rename.** Un report locale non è la prova di questa condizione.

## Checkpoint 3 — rename singolo da GitHub Settings (azione umana)

L'owner originale del repository, con privilegi amministrativi, compie **una volta** `Settings → General → Repository name → iKant_EDU → Rename`. Non è un'azione di C72 né può essere inferita dal piano. Dopo un tentativo amministrativo di risultato incerto: solo inspect GitHub in lettura; non ripetere.

Il rename non va eseguito automaticamente in questa PR. Il vecchio nome non deve essere riutilizzato per un nuovo repository: invaliderebbe redirect e provenienza. L'azione può essere rinviata; non si creano alias canonici.

## Checkpoint 4 — riqualifica POST-RENAME

☐ Tramite GitHub leggere **nuovo** `Luke883i/iKant_EDU` e **ID=1371330383`; confrontare default branch, HEAD/TREE/blobs immediatamente pre-cutover. Un commit di preparazione post-rename può cambiare HEAD: allora deve essere verificato in una nuova epoch.

☐ Verificare README/BOOTSTRAP/ADMISSION/AGENTS/TERMS e link Terms **nuovo** con gli originali; stesso contenuto solo se il diff lo dimostra. Non riutilizzare le vecchie ricevute C72 come nuove.

☐ Eseguire workflow full suite, artefatti CI, upload/download, registry, plugin/MCP, Pages, action caller, OAuth, webhook, GitHub connector e Project Prompt. Controllare i redirect ordinari solo come compatibilità URL, non come identità originale.

☐ In **una nuova chat**: ORIENTATION con il nuovo nome, consenso esatto in turno successivo, C72 originale con receipt, selezione EDU distinta, sorgenti C135/C87/C125/S03 e OneShell same-turn. No `ACTIVE` dal solo CI.

☐ Registrare eventuali errori e aprire issue/PR di correzione. Non rinominare indietro automaticamente, non inventare retry dell'owner e non resettare ledger/sessioni per aggirare fence.

## Checkpoint 5 — chiusura, consumo ricorrente, rollback

**Successo tecnico** = ID invariato + HEAD/TREE attestati per epoch + consumer e CI provider verdi + cutover approvato e registrato.

**Successo iKant** = inoltre originale C72/EDU, C135/C87/C125/S03 e provider realmente osservati, readback indipendente, zero false-voice/false-ACTIVE. L'uno non implica l'altro.

**Metriche target**: 100% critical consumers classificati, 0 link Terms originali errati, 0 owner/receipt replay, 0 caller Actions irrisolti, 0 false ACTIVE, 100% required checks verdi, 10.000/10.000 negative mutations intercettate, 1.000/1.000 positivi conservati; 2 reviewer indipendenti e 1 approvazione admin. Le metriche software sintetiche **non** provano fornitori esterni o uso ricorrente.

**Rollback**: prima del click si può semplicemente cancellare la migrazione; dopo il click è una **nuova operazione admin** con controlli di collisione/redirect e nuova epoch, non una ripetizione automatica. Se risultato amministrativo ambiguo, leggere l'API GitHub per riconciliare stesso ID e nome. Se contenuti/owner ambigui, STOP senza replay.

## Altri vincoli e non-promesse

- Il rename **non** installa istruzioni ChatGPT Project, non attesta UI native, non prova persistenza, benefici del prodotto, coscienza artificiale o C72 valido in chat pregresse.
- Fonte Git verificata ≠ trasferimento locale ≠ ricevuta owner ≠ provider. Tenere prove separate.
- Il rapporto `scripts/repository-rename-2dim.mjs --both` è solo un readback tecnico. `DRYRUN_READY...` del simulatore **non autorizza** il click.
- Il gate V5-G resta separato: non sostituire i due ingegneri indipendenti e l'accettazione umana con una CI verde.
- Nessun rename effettivo, nessun repin e nessuna modifica degli owner in questa slice strategica.

**Decisione iniziale alla baseline:** `NOT_READY_FOR_RENAME` finché tutti gli step sopra non possiedono le rispettive prove.
