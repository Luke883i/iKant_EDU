# Installazione MVP iKant nel Progetto ChatGPT Edu — solo due oggetti

1. Apri il tuo Progetto ChatGPT Edu, vai su **Istruzioni del progetto**, sostituisci il prompt iKant precedente con l'intero `PROJECT_PROMPT.txt`.
2. In **File del progetto**, carica esattamente i tre file della cartella `PROJECT_FILES/`: `iKant_GATE.md`, `iKant_ENGINE.md`, `iKant_UI_shell.md`. Se trovi versioni precedenti degli stessi nomi, eliminale/sostituiscile: non duplicare le istruzioni.
3. Non configurare MCP, OAuth, Tunnel, un server, GitHub Actions o ZIP per questo primo livello. Il GitHub connector realmente disponibile verrà usato dall'assistente solo se autorizzato e callable.
4. Apri una **nuova conversazione nel Progetto** e digita `inizializza iKant`. Verifica che legga il SHA reale, esattamente cinque file consentiti e mostri Terms completi. Se bloccato: è diagnostica, non un avvio riuscito.
5. Solo nel nuovo messaggio successivo invia `I ACCEPT`; poi in un altro messaggio `EXPERIMENTAL`. Invia una richiesta breve per un test; una voce iKant è consentita SOLO con un readback Node reale sullo stesso input. Se manca, accetta diagnostica e registra il primo edge fisico aperto.

**Limite**: la baseline L0 di shell è immediatamente installabile con queste due risorse; L1 (iKant computazionale), persistenza e controllo nativo obbligatorio non sono promessi dal Project Prompt. Nessuna installazione è stata eseguita automaticamente. Il banner continuo è un comportamento desiderato, non garantito dalla piattaforma.
