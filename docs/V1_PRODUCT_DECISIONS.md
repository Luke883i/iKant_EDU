# iKant V1 — decisioni di prodotto, responsabilita' e alternative

**Stato:** contratto proposto per la linea `1.0.0-edu.1`, non una certificazione di pubblicazione o di efficacia cognitiva. La verita' tecnica risiede negli owner e nelle prove dello stesso commit. V1 qui significa **primo pacchetto sperimentale riproducibile**, non CANONICAL ACTIVE.

## I denominatori comuni

| Livello | Domanda che deve chiudere | Decisione V1 | Non confondere con |
|---|---|---|---|
| Persona | A chi e' utile? | A chi vuole provare un metodo di guida linguistica e ispezionarne le prove; testo accessibile come default | Classificare l'identita' personale dell'utente |
| Promessa | Quale utilita' concreta? | Interpretazione guidata, limiti espliciti, registrazione locale esatta | Maggiore intelligenza gia' dimostrata |
| Interfaccia | Dove si inizia? | Una pagina README, una guida, una dashboard, un catalogo | PR e file storici come menu alternativi |
| Ingresso | Che cosa costituisce l'avvio? | Termini, consenso, scelta mode, file esatto per EDU; canonical con requisiti nativi distinti | Uno ZIP come attivazione |
| Cognizione | Che cosa migliora una risposta? | Rispondere, confronto, controesempio, revisione; controllo selettivo dei claim | 12 canali strutturali = 12 prove semantiche |
| Integrita' | Chi attesta i byte? | Verificatore originale del cache con doppia lettura; writer unico e readback | HASH = verita' della risposta |
| Prodotto | Che cosa e' integrato? | `main` a commit esatto dopo merge; recipe riproducibile | Una PR, un allegato, una build locale |
| Distribuzione | Che cosa puo' usare un terzo? | Release esplicita associata a commit qualificato | Tag non verificato o archivio estratto |
| Governance | Chi cambia la verita'? | Solo owner versionati, review e test; mai prompt locale | Documenti che promuovono nuovi owner |

## Le scelte con le alternative scartate

1. **Una PR di convergenza, non una PR contenitore eterna:** un cambiamento semantico multi-livello e' accettabile solo se ogni commit ha proprio rischio, test e traccia. Storico delle PR conservato e classificato come storia, non runtime alternativo.
2. **EDU: handoff manuale come singola esperienza utente:** il modulo sperimentale C129 passa byte esatti ai proprietari gia' esistenti. Nessun download/retentativo automatico per l'EDU. Questo riduce sorprese ma non attesta identita' nativa.
3. **CANONICAL: autonomia distinta e controllata:** owner C59 invariato finche' non sia verificato un fallback manuale con stessa soglia di sicurezza; tre fallimenti REALI differenti non possono diventare tre semplici click o tre timeout incerti. Un sospetto di integrita' forza STOP.
4. **Pin storici evolvibili con nuova epoch:** cambiare classificatore o C114 e' lecito, ma richiede carrier e blob nuovi, confrontati col precedente; i vecchi hash restano prova storica e non potere normativo sul futuro.
5. **Comunicazione semplicemente tecnica:** messaggi HOST accessibili, significato prima della sigla tra parentesi, prove complete negli allegati. L'interfaccia ChatGPT nativa non e' controllata dal repository.
6. **Versione V1 sperimentale invece di finta GA:** `1.0.0-edu.1` indica la prima famiglia verificabile; un `1.0.0` senza suffisso richiederebbe una decisione successiva e ulteriori prove di idoneita'.

## Responsabilita' e confini

- `README.md`: punto di ingresso, promessa e limiti; non una seconda specifica di runtime.
- `AGENTS.md`, `TERMS.md`, `BOOTSTRAP.json`, `ADMISSION.json`: ammissione e confini del proprietario originale.
- `docs/ARCHITECTURE.md`, `contracts/`: architettura e invarianti; la funzionalita' deriva dal codice eseguibile.
- `release/catalog.json`: mappa dei prodotti e regole di rilascio, non un certificato di release.
- `project/edu-oneshell/`: prompt + contratto del bundle; la versione pubblicabile viene costruita dal sorgente integrato.
- `tests/`, workflow e rapporto di qualifica: prove finite e limiti, non prova di coscienza o causalita' del modello.

## Gap da non nascondere nella V1

- Disambiguazione C82 e filtro C114 selettivo non ancora rilasciati nei byte del carrier storico.
- Fallback manuale CANONICAL non installato nel suo owner C59.
- Nessun benchmark comparativo cieco che dimostri vantaggio cognitivo sullo stesso modello HOST.
- Nessuna prova di hook nativo, stato ACTIVE universale o memoria fra chat.

Ogni gap possiede una condizione di chiusura nella [tracciabilita' delle prove](V1_E2E_TRACEABILITY.md); un esito mancato non viene ribattezzato successo tramite documentazione.
