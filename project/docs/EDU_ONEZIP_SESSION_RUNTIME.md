# EDU OneZIP in una sessione ChatGPT Project

**Intento.** Si incolla una sola istruzione di Project. Il primo messaggio, anche se sembra consenso, apre soltanto l'orientamento. A seguire: consenso espresso, una proposta di ZIP al massimo quando i byte non sono disponibili, introduzione originale, selezione EDU in turno distinto e una domanda. Un allegato non è consenso, non è un runtime e non conferisce proprietà.

## Fabbisogno minimo e limiti

1. Chat reale con GitHub verificabile, Python con directory privata ricontrollabile e Node ≥20, più un nonce inviato e riletto nello stesso processo fra due chiamate del tool. Non serve un processo vivo fra due messaggi umani. Se manca uno di questi requisiti non chiedere lo ZIP.
2. Dopo consenso osservato, congelare l'HEAD vista, leggere TREE e pin indipendenti: bootstrap `scripts/project-edu-onezip-ingress.py` più i tre helper elencati da `--help`/codice. Verificare l'identità del bootstrap prima di eseguirlo. L'unico file utente è lo ZIP GitHub di quel commit, senza rinomina o estrazione manuale. Non serve un clone o un'installazione Node da parte dell'utente.
3. Eseguire il bootstrap con `--archive ZIP --head HEAD --tree TREE --helper-pins ZIP_TREE_SHA1 MANUAL_PLAN_SHA1 NODE_LOADER_SHA1 --private-root ROOT`. Stagia solo la chiusura del manifest; non importa codice prima dei pin. La TREE è ricalcolata dallo ZIP e non equivale a un elenco indipendente di entry API.
4. Riutilizzare i gate C72 e i wrapper [OneZIP](EDU_ONEZIP_POSTACCEPT_FIELD_ROUTE.md); nei turni e nella riapertura della vista impostare `continuity: "SESSION_LOCAL"`. Nel primo turno breve provare una domanda che rientri nel perimetro C70. C135 instrada verso gli owner applicabili, non invoca indiscriminatamente tutti i Cx. La risposta Host non è automaticamente voce iKant; gli owner originali fanno verifica, scrittura, rilettura, cattura e proiezione.
5. I processi successivi riaprono il medesimo C87 con indice/hash e ricevute nello stesso spazio privato, senza copiare il diario in ogni risposta. `action:"REOPEN_VIEW"` nella stessa sessione legge soltanto la vista verificata, anche se il worker precedente è terminato. Conservare la directory privata per la durata della chat. Non mostrare path, task o ricevute complete come testo di A.
6. Due riprese distinte: riapertura dati/vista testuale sullo stesso filesystem e pannello grafico nativo. Il primo ha prove locali. Il secondo non è conseguenza del prompt o del filesystem: resta aperto finché un utente non verifica resa, riapertura e aggiornamento nella stessa chat del Project. Non esiste preservazione promessa tra chat o dopo sparizione del filesystem. La variante portabile resta storica, separata e limitata a 256 KiB.

**Nomi:** C72 Accoglienza e consenso; C135 Regia del turno; C70 Piano della risposta; C114 Identità senza finzioni; C139 Dubbio esplicito; C140 Domande aperte; C141/C142 Controllo dei conflitti; C87 Diario verificabile; C125/S03 Risposta e ricevuta. I nomi sono presentazione, non permessi.

## Rete DoD

| ID | Dipendenze | Prova o primo ostacolo |
|---|---|---|
| G0 | G1 + G2 + G3 + G4 + G5 + F1 + F2 | EDU nel Project con passaggio unico, turni originali e vista persistente nel perimetro concordato. HOLD fino a prova di campo. |
| G1 | nessuna | Frozen HEAD, cinque documenti prima del consenso, orientamento senza effetti. Guardia 7x3 e regressioni di ammissione; niente installazione attestata. |
| G2 | G1 | Un solo ZIP, tre helper verificati e loader originale. Fixture della chiusura completa di 193 file; secondo ingresso respinto. CI riesegue sullo ZIP dell'esatto HEAD. |
| G3 | G2 | Originali C72/C135/C87/C125/S03; due processi, una voce e una scrittura osservabile per turno; test fisico con input e lingua di prova. |
| G4 | G3 | Stesso ledger, indice 1 → 2, hash diverso, vista riletta identica, nonce non ripetibile e tentativo pendente blocca. Nessuna attività nativa o grafica dedotta. |
| G5 | G2 + G3 + G4 | Mutazioni pre-seed su modello con oracolo indipendente; regressioni fisiche separate; censimento file e candidati senza rimozioni e senza toccare MCP. |
| F1 | G1 + G2 + G3 | Project reale: si osservano preflight, singolo allegato, due messaggi umani e testo esatto della risposta iKant da runtime. Non eseguito. |
| F2 | F1 + G4 | Si chiude e riapre la stessa chat; resa grafica osservata, stato verificato e nuovo turno consecutivo. Non eseguito. |

**Esito incerto:** un tentativo senza ricevuta o con readback incoerente è STOP, non prova di mancato effetto. Mai ripetere un turno con un nuovo nonce per aggirare la riconciliazione. Il guadagno cognitivo, la verità fattuale, il pannello gestito da ChatGPT, i suoi tempi, la parità con il locale e CANONICAL non sono attestati. La prova di campo deve misurare anche tempo primo avvio e latenza turni, distinguendo trasporto, owner e host.

**Ritiro:** inventario su main `888a5878a30864e6db7813b3d8b236cde46cce40`; i candidati sono solo descrizioni di superfici sostituite e senza consumatori operativi conosciuti nel perimetro verificato. Non promuovere “nessuna prova” a “nessun uso”. Conservare pin e ricevute storiche. Nessun file rimosso. MCP è indipendente, non modificato né provato end-user da questa PR.

## Decisione prodotto CORA post-PR253 (senza nuova autorità)

Percorso più breve che conserva la semantica: **orientamento** al primo messaggio → **I ACCEPT** umano in messaggio successivo → preflight e massimo **un solo ZIP** del commit pinnato, solo se necessario → C72 con introduzione originale → **EDU** umano in nuovo messaggio → C72 selection → **prima domanda** → C135/lingua nello stesso processo → C87/S03/C125 → `oneshell_utf8` serializzato dallo stesso renderer originale → seconda domanda in nuovo worker e `REOPEN_VIEW` dal medesimo ledger. La sorgente non puo essere repinnata implicitamente. Non si richiede un secondo I ACCEPT e un allegato non lo sostituisce.

**UX for dummies:** OneShell mantiene rigorosamente sei slot. Il testo dei metadati puo essere breve, ma il campo A non viene troncato, riassunto o riscritto dall'Host. Una risposta breve va richiesta prima all'owner C70, non prodotta falsificando C125 dopo il commit. Approfondimenti possono essere allegati solo con byte/digest e rilettura verificati; in assenza di tali prove, conservare la versione integra e dichiarare il limite. Il bundle, il filesystem e i test non sono la UI nativa ChatGPT.

**Legacy:** `scripts/project-edu-retirement-census.mjs` assegna una classificazione a *ogni file della HEAD* e conserva lo storico main verificato. `LEGACY_CANDIDATE_UNKNOWN_CONSUMERS_REVIEW_REQUIRED` non equivale a unused, rimozione autorizzata o prova di non dipendenza: import dinamici, script esterni, deploy e consumatori MCP richiedono controlli indipendenti. Le tre candidate documentali con SHA storici rimangono una sottoclasse identificata, senza cancellazione.

**Falsificatori di campo aperti:** test nativo in un Project con prompt effettivamente installato; un messaggio umano orientamento, un successivo I ACCEPT, successiva scelta EDU, due domande distinte; consegna visibile dei sei slot con A byte-identica; sessione riaperta e aggiornamento stato visibile; misura cold-start, tempo per allegato e latenza del turno. Test locale, CI e registri auto-dichiarati non chiudono questi fogli AND.
