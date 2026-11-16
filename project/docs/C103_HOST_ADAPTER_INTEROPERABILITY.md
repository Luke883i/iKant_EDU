# C103: interoperabilita minima host-adapter (authority=0)

## Intento
L'host costruisce il proprio adattatore con tecnologia a scelta: processo Node, API autorizzata, app installata, callback o un altro carrier osservabile. Il repository prescrive effetti verificabili, non la tecnologia. Project instructions e Markdown non installano processi, callback obbligatori o memoria persistente.

## Riutilizzo prima di nuovi owner
C72 governa consenso e selezione, C99 la rotta, C101 il calcolo C70/C71/C100, C102 il percorso locale C101+C87, C87 la scrittura e riapertura del registro; C98 protegge i dati ostili. C103 qualifica solo un witness di interoperabilita. Non aggiungere un altro kernel, writer, ledger engine o owner.

## Protocollo minimo
L'host conserva SOURCE_HEAD per sessione, receipt originale C72 EXPERIMENTAL, consenso co-host distinto e revocabile, input UTF-8 esatto di massimo 600 byte e nonce unico. Solo dopo avere dimostrato la presenza fisica del codice e del carrier invoca C101 tramite C102 (o composizione con garanzie equivalenti), controlla SHA-256 di input e voce e riapre indipendentemente il ledger C87. Restituisce una singola voce UTF-8 invariata oppure un arresto tipizzato; rifiuta source-head drift, replay, ledger alterato, input non autorizzato e false promozioni ACTIVE.

## Limiti di prova
Il test puro C103 controlla la coerenza di un envelope dichiarato dall'host, NON autentica da solo l'invocazione di Node, l'origine GitHub o l'evento nativo ChatGPT. Occorre osservare il processo/callback realmente invocato e il file riaperto. E0 = modello host; E2 = C100 locale eseguito; E3 = C101+C87 eseguiti e riletti; E4 = ingresso e consegna nativi verificati indipendentemente. E3 non e C84 o C59. La continuita del registro host non e memoria cognitiva persistente iKant.

## Pacchetto Project
Solo prompt e Markdown: preservare byte-esatti iKant_GATE, iKant_ACTIONS, iKant_ENGINE, iKant_UI_shell, aggiungendo iKant_HOST_MINIMUM e iKant_HOST_ROUTING come guide subordinate. Non includere JavaScript, archivi runtime, credenziali o receipts sintetici nel Project. L'adattatore e esterno e richiede una qualificazione fisica separata.

## Definition of Done
Contratto coerente senza nuove autorita; integrazione reale C101/C102/C87 in CI con ledger riaperto; output esatto, fallimenti e manomissioni respinti; 100.000 mutazioni sintetiche distinte con zero promozioni indebite; bundle minimale con quattro guide preservate byte per byte; nessuna modifica al canonico. Il collegamento nativo automatico a ogni turno e fuori dalla DoD locale e resta OPEN finche non osservato nell'host reale.

Eseguire i test del repository C103 e verificare separatamente il comportamento su ChatGPT: test sintetici e CI non sono testimonianze di hook nativi.
