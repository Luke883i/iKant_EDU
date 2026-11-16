# Dashboard iKant — guida alla versione e al percorso

Questa pagina descrive **che cosa significa lo stato**. Lo stato reale e' quello restituito dagli owner e dalla CI della versione richiesta, non quello dedotto dalla pagina.

| Elemento | Base precedente (#128) | V1 sperimentale proposta | Prova necessaria |
|---|---|---|---|
| Un prodotto leggibile | README tecnico, contratti distribuiti | Guida, catalogo, schede brevi | Link funzionanti, controllo di accessibilita' |
| Avvio sperimentale | Cache e owner verificabili | Un solo ingresso manuale, senza carrier automatici | File esatto, un solo invio, doppia rilettura |
| Avvio canonico | Un owner con requisiti forti | Ripiego manuale solo come proposta | Ricevute reali dell'owner, nessuna attivazione falsa |
| Qualita' cognitiva | Tracce software verificabili | Guida piu' esplorativa, distinzione soggetti | Prove con modelli veri e revisione indipendente |
| Consegna | Allegati dipendenti dalla sessione | Pacchetto ricostruibile dal commit di main | Due build uguali e manifest verificato |

## Pulsanti concettuali per decidere

**VEDI IL PRODOTTO** -> [Guida di ingresso](START_HERE.md) e [posizionamento](PRODUCT_POSITIONING.md).

**VERIFICA LE PROVE** -> [DoD e limiti](C130_PRODUCT_DOD.md), [catalogo delle sorgenti](../release/catalog.json).

**CONTROLLA LA VERSIONE** -> individua il commit di `main` sul repository, poi leggi release e rapporto CI riferiti allo stesso commit.

**DECIDI IL RILASCIO** -> una PR candidata propone il nuovo prodotto; soltanto il merge validato e la pubblicazione della release ne creano la distribuzione ufficiale.

## Principio di comunicazione

Per impostazione predefinita, tutti i messaggi scritti dal modello HOST — intermedi e conclusivi — devono essere comprensibili senza competenze IT. I dettagli specialistici devono essere accessibili su richiesta, senza sparire dalle prove. Questo e' un contratto del programma, non una prova di poter intercettare ogni messaggio della piattaforma.

## Vista versione 1

La linea `1.0.0-edu.1` e' una versione **sperimentale** e rimane candidata fino a merge, prove sul commit effettivo di `main` e decisione separata di rilascio. [Decisori e alternative](V1_PRODUCT_DECISIONS.md) · [Prove verificabili](V1_E2E_TRACEABILITY.md). Le righe sopra non certificano miglioramenti cognitivi del modello o ingresso nativo.

**GOLD E MIGRAZIONE:** [inventario dei componenti e decisioni di riuso](V1_GOLD_MIGRATION.md). Il censimento completo si produce con `node scripts/v1-gold-census.mjs`; non sostituisce la revisione semantica di ogni singolo file.

## Prossima qualificazione

La [roadmap ENTERPRISE_CANDIDATE](C132_ENTERPRISE_CANDIDATE.md) distingue il patrimonio storico da componenti qualificati e risultati cognitivi reali. Il nuovo classificatore e' ancora un esperimento isolato: non sostituisce il proprietario delle risposte e non prova una superiorita' del modello linguistico.
