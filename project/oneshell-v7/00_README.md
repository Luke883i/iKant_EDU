# OneShell V7 — contenuto e responsabilità

Questa è una **capsula candidata Project**, costruita su un Git tree verificato, non il plugin installato, un ambiente Node, un owner canonico, una memoria di ChatGPT o un consenso.

**Solo tre supporti logici, due risorse nel Project:** (1) `main` originale di `Luke883i/iKant_LE` come fonte normativa e runtime; (2) `PROMPT_INNESCO.txt` incollato nelle istruzioni del Project; (3) *un unico* ZIP caricato nei file di progetto che contiene questo set di MD, il lock, gli snapshot e i sorgenti plugin originali. Il terzo elemento non è una terza autorità: è il trasporto della seconda risorsa del Project.

## Moduli locali, nomi senza ambiguità
- `01_PHASES.md`: gate e STOP di ammissione.
- `02_PROOFS.md`: source lock, autorità e owner.
- `03_SLIDES.md`: unica shell leggibile, schema A/B.
- `04_FILLER.md`: mini-prompt di riempimento HOST per slot.
- `05_ANNEX.md`: protocollo di conservazione e allegati quando la slide è insufficiente.
- `06_PLUGIN.md`: sorgenti plugin e procedura reale separata di deployment.
- `07_ROADMAP.md`: percorso di chiusura, prove e condizioni di fallimento.
- `MANIFEST.json` e `SOURCE_LOCK.json`: dati verificabili, non autorità.

Il file ZIP può non essere leggibile o montabile in una chat successiva. In quel caso non asserire di averlo verificato; A=`NO_VOICE`, FIRST_EDGE=`BUNDLE_NOT_READABLE`. Non risolvere silenziosamente drift rifissando `main`. Conserva prova storica ma non farla diventare stato corrente.

**Trasporto guidato:** lo ZIP Project include il sorgente `adapter_source/scripts/host-rehydrate-source-zip.py` e l'oggetto Git `PINNED_COMMIT_OBJECT.raw`, ma non contiene l'intero runtime, non installa Node/plugin, non autorizza bypass del consenso e non testimonia l'interfaccia nativa.
