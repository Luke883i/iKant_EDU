# C135 — il nuovo ragionamento arriva al percorso EDU reale

**Per chi non è tecnico:** dopo l'avvio manuale, iKant può usare la nuova versione che distingue meglio una domanda sull'essere umano da una domanda sul software. L'utente continua ad avere **un solo ingresso**. Per scegliere la versione sperimentale occorre richiedere esplicitamente `C134_COMPOSITE`; senza questa selezione il vecchio percorso continua a funzionare.

## Che cosa è stato collegato realmente

Il file fornito viene letto e confrontato due volte dallo **stesso file fisico** (C127). Il programma ricostruisce l'ambiente storico C107/C124, verifica e installa nella sua copia privata tutti i quattro file C134, e solo dopo importa la nuova sorgente cognitiva. Il quarto file C134 è un driver conservato e verificato nel pacchetto composito; la nuova coordinazione EDU impiega direttamente la nuova C107, C83 e C114. Non dichiariamo che il quarto driver sia stato invocato.

Una domanda segue **elaborazione originale (C70) → 12 controlli strutturali (C126) → interprete consultivo (C133) → modello linguistico HOST → controllo C134/C114 → unico writer originale (C107/C87) → seconda lettura Node indipendente → invio controllato (C125)**.

Il visualizzatore C125 ammette una ricevuta **C135 esplicita**; non la spaccia per la vecchia ricevuta PR119. Gli hash attestano quali byte hanno viaggiato, non che il modello abbia compreso meglio.

## Definition of Done sfidante

| Gate | Prova positiva | Falsificazione obbligatoria |
|---|---|---|
| Origine | Cache C127 con inode e due letture; C107 + tre blob C124 storici inalterati; quattro blob C134 esatti | File sostituito, symlink o blob diverso: nessun turno |
| Interpretazione | C70 produce piano sul medesimo input; C126 qualifica 12/12 prima del linguaggio | Piano o ACK manomessi: zero append C87 |
| Libertà cognitiva | Domanda sull'essere umano può produrre risposta utile e riletta | Claim falsi su coscienza e accesso nativo: NO_VOICE |
| Persistenza | Un solo evento originale C87; seconda riapertura separata; stessi input, epoch, nonce, voce e SHA | Replay, concorrenza e dispose: zero doppia scrittura |
| Visualizzazione | Un solo invio host C125 con i byte riletti e ricevuta C135 non falsificata | Non mascherare C135 da PR119, nessuna promessa di hook |
| Compatibilità | L'ingresso C129 storico resta selezionato per impostazione predefinita | Nessun `cognitiveEpoch` sconosciuto, nessun fallback silenzioso |
| Rilascio | CI su commit della PR e successivo commit di merge separati | Non promuovere un candidato a release senza qualifica |

## Riuso del patrimonio («gold»)

Conserviamo **C72** per Termini/selezione, **C107/C124/C127** per byte verificati, **C70/C126** per elaborazione e canali, **C133** per suggerimento sul soggetto, **C114/C134** per controlli sulle affermazioni, **C87** come unico writer e **C125** come unica uscita controllata. Nessun modulo storico viene ripinnato in segreto. C135 aggiunge soltanto la coordinazione esatta della nuova sorgente e un formato di ricevuta distinto.

## Limiti

- Questa è una dimostrazione di integrazione **EDU sperimentale**, non prova nativa ChatGPT o attivazione CANONICAL.
- Il C134 sorgente è un *composito verificato*, **non** un commit Git indipendente né un nuovo carrier canonico.
- Il testo di prova deterministico non equivale a un confronto cieco fra modelli linguistici.
- Sono mantenuti il limite dell'incertezza e l'obbligo di rispondere con il massimo sforzo consentito, senza asserzioni false.

## Reticolo ricalcolato

**C135 EDU** (presente nella PR) e **C136 CANONICAL** (futuro, originale proprietario) avanzano indipendentemente. **C137** misura il beneficio con almeno 300 coppie per percorso sullo stesso modello, revisori ciechi, sicurezza, latenza e costo. **C138** decide la pubblicazione EDU dal commit effettivo di `main`; la pubblicazione CANONICAL richiede anche la prova nativa separata. Il contratto completo è in `contracts/c134-convergence-lattice.json`.

### Comandi

`node --test tests/c135-cognitive-edu-owner.test.mjs tests/edu-c129-manual-entry.test.mjs tests/edu-c125-ui-shell.test.mjs tests/c134-cognitive-epoch.test.mjs`

`npm run runtime-root:verify` e `npm run check`.

In caso di mancata prova il programma arresta il turno o pubblica uno stato di blocco, senza inventare una voce.
