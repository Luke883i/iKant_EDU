# V5-C · Minimum EDU product and bootstrap | HOST engineering, authority 0

## COSA — DoD in derivazione retrograda
L'esito globale non e' un test CI: una persona esterna deve poter compiere **in turni umani distinti** ORIENTATION, I ACCEPT e EDU; il cold seed C72 deve produrre ricevute originali e riapribili, il post-EDU loader deve verificare HEAD/TREE/blobs per l'intero manifest, e un turno originale C135 deve passare da un solo writer C87 con readback indipendente alla presentazione C125/S03 same-turn, senza retry ambiguo.

Il contratto machine-readable e' in `contracts/project-v5c-edu-minimum-dod.json`: **G → I1-I6 → L01-L20**. Ogni DoD locale indica la proprieta' originale. La mancanza di una ricevuta owner/provider blocca SOLO la qualifica dipendente, non l'intero lavoro di ingegneria.

## COME — Slice minima e reticolare
- Conservare intatti C72, C135, C87, C125 e S03: niente nuovi owner, carrier o writer.
- Derivare il source kit dal codice originale C72 (8 file + transit + cold seed) e il manifest completo da `project-session-source.json`; non considerare sufficiente un inventario parziale.
- Riutilizzare `.github/workflows/project-session-repo-first.yml`: test originali e verifiche dei sorgenti, policy negative, 100k mutazioni deterministiche, profiling di due processi originali. Nessun nuovo workflow.
- Rendere estensibile il change register V5-B mediante una singola dichiarazione per slice in `governance/changes/` e bloccare aggiunte non registrate, con review sempre richiesta.
- Misurare **durate wall-clock dei processi di test originali in GitHub Actions**. Non sono misure di latenza del primo turno ChatGPT, del trasporto host→Node né di un consenso autentico.
- Separare source/tree SHA, readback locale, ricevute owner, evento provider. Un hash Git non e' un attestato nativo.
- Su esito di send/write/owner UNKNOWN: solo reopen/reconcile read-only, nessun replay; il modello e i test non inventano nonce o altre directory.

## Evidenze e responsabilita'
Il profiler misura realmente test originali con `spawnSync` e registra codice uscita, SHA-256 dello stdout, Node, HEAD e millisecondi; la campagna 100k falsifica una **policy tipizzata**, non interpreta 100k parafrasi LLM. I test originali sono fixture eseguibili, non ricevute di origine umana/provider. Il contratto CI non dichiara `ACTIVE`, equivalenza del prompt installato, persistenza provider o guadagno cognitivo.

## Stato DoD, aggiornato alla PR
- **L01/L03 e prove meccaniche**: possono essere verificate da Git/tree, CI e source loader sul commit della PR.
- **L04-L14 evento reale e readback originale**: non attestati da questa PR; richiedono esecuzione owner-bound in una sessione idonea e lettura indipendente.
- **L15 timing CI**: attestabile per il processo di test; latenza bootstrap utente ancora UNKNOWN.
- **L16-L17 recovery**: regressioni originali e simulazioni verificabili, continuita' ChatGPT reale UNKNOWN.
- **L18-L20 nonpromozione**: dimostrabile per le policy CI, non come promessa del provider.
- **G**: OPEN fino a prove originali e reviewer indipendente.

## PR e rollback
PR in Draft, nessun merge automatico. Il rollback ripristina solo l'implementazione Host V5-C e la piccola estensione del registro V5-B. Nessuna ricevuta originale, installazione o fonte runtime viene modificata.
