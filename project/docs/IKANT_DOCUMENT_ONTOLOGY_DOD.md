# Ontologia documentale e Definition of Done (DoD)

**Scopo:** rendere comprensibile l'intero reticolo Markdown, da `README.md` fino ai documenti di contratto, storia e integrazione. Questo testo è una guida HOST a **autorità zero**: non cambia contratti, codice, consenso o stato runtime. [Atlante di TUTTI i Markdown](IKANT_DOCUMENT_ATLAS.md).

## Prima domanda: che cos'è davvero iKant?

iKant è una **infrastruttura sperimentale di orchestrazione, controllo e prove** attorno a un modello linguistico (LLM) sostituibile; non è un secondo modello, una persona o una coscienza accertata. L'umano mantiene giudizio e autorizzazione. L'LLM produce candidate linguistiche. Gli owner iKant possono controllare e registrare operazioni **soltanto quando realmente eseguiti**. La traccia certifica il percorso in misura circoscritta; non la verità semantica, la persistenza fra chat o l'integrazione nativa.

**Analogia neuroscientifica limitata:** termini come *attenzione*, *workspace*, *self-world*, *valenza* e *memoria* aiutano a modellare funzioni; **non** dimostrano omologia di tessuto, neuroni, sinapsi, esperienza vissuta, intenzionalità intrinseca o coscienza fenomenica. Un modello computazionale di una funzione non equivale al fenomeno biologico. L'analogia va delimitata per costrutto, metodo di misura, controesempio e alternativa; nessun conteggio di righe di codice è comparabile con il numero di sinapsi.

## Gerarchia interpretativa, distinta dall'autorità normativa

| Livello | Tipo | Domanda del lettore | Minimo atteso | Non autorizza |
|---|---|---|---|---|
| **L0** | README root | Che cosa è, a chi serve, come proseguo? | definizione comprensibile, limiti, tre percorsi, consenso, link | attivazione |
| **L1** | guida per lettori | Quale problema risolve, con quale esempio? | caso pratico, pubblico, termini tradotti, prossima pagina | efficacia empirica |
| **L2** | architettura, ricerca, governance | Come funziona e come lo confuto? | mappa E2E, owner, fonte, prova, RQ e falsificatori | verità ontologica |
| **L3** | Cx, procedure e audit | Come lo riproduco e falsifico? | schema/versione, input, precondizione, exit/error, test e link al codice | disponibilità in produzione |
| **L4** | storico, PREPR, Project, plugin | Che cosa è ancora vigente? | data/profilo, autorità, incompatibilità, percorso corrente | promozione da legacy a C72/v2 |

I livelli ordinano **la lettura**, non la precedenza giuridica/tecnica: **safety, owner originale, contratti e fonte vincolata prevalgono**. Un documento L0 non modifica il runtime L3. Per le abbreviazioni Cx: [dizionario completo](IKANT_CX_LEXICON.md).

## Contenuti minimi ontologici per ogni documento

La revisione riguarda **ogni file Markdown** del checkout: non si richiede di ripetere l'intera ontologia in ogni pagina. Si richiede di classificarne ruolo, pubblico e rapporto con le pretese ontologiche. Minimi: **(1)** titolo e scopo; **(2)** livello e stato corrente/storico; **(3)** pubblico e prerequisiti; **(4)** almeno un collegamento entrante nell'atlante; **(5)** fonte/owner reale o dichiarazione `HOST/advisory`; **(6)** ciò che supporta e non supporta; **(7)** quando tratta AI, mente, sé o neuroscienze, distinguere analogia funzionale, evidenza comportamentale, substrato biologico e fenomenologia `UNKNOWN`; **(8)** stato di review e prossima prova. Per L3 si aggiungono versione di schema, test negativi e un falsificatore; per L4 un avviso di non normatività.

**Gap emersi nell'AS-IS:** ampia letteratura Cx non introdotta progressivamente al pubblico; numerose pagine senza link in uscita; documenti storici accanto a contratti correnti; assenza di un censimento navigabile esaustivo e di una policy DoD comune. La soluzione **non** è inventare una nuova gerarchia di owner, ma rendere visibili percorsi e lacune attraverso l'atlante generato.

## DoD e criteri di confutazione

- [x] Inventario di **tutti** i Markdown del checkout, compresi documenti root, Cx e storici, ricostruibile senza API esterne.
- [x] Classificazione univoca L0–L4 e URL dal README alla guida e da questa all'atlante.
- [x] Glossario Cx contestuale; non presumere che l'ingegnere conosca sigle e tracciati.
- [x] Distinzione esplicita fra **coscienza**, analogia neurale e stati funzionali computazionali.
- [x] Audit automatico di titoli, indizi di limiti, link locali rotti, nodi non raggiunti prima dell'atlante.
- [x] Test negativo: atlante manomesso deve fallire; inventario incompleto deve fallire.
- [ ] Review **umana** di ogni documento, con pubblico e owner identificati: **DEBITO**.
- [ ] Studio di comprensione con lettori non tecnici, intermedi e ingegneri nuovi: **NON ATTESTATO**.
- [ ] Benchmark di utilità del prodotto rispetto allo stesso LLM senza iKant: **NON ATTESTATO**.

### Misure e soglie

| Scala | Proxies automatici | Soglia di accettazione | Evidenza ulteriore richiesta |
|---|---|---|---|
| **Globale** | copertura inventario Markdown, accessibilità attraverso atlas, nessuna omissione | 100% documenti censiti; nessun documento senza livello | utenti riescono a ricostruire il quadro senza aiuto |
| **Intermedia** | presenza dei quattro percorsi (persona, ricerca, ingegneria, installazione), glossario e collegamenti | 4/4 percorsi con link locali risolti | task di navigazione con tempi/errori confrontati a baseline |
| **Locale** | singola scheda con titolo, stato, fonte/owner, limiti, analogia delimitata e test quando rilevante | 100% schede classificate; le mancanze sono **debito esplicito**, non PASS | doppia revisione del contenuto per ambiti critici |

**I proxy non dimostrano comprensione.** Il test umano prospettico è controbilanciato (prima/dopo o varianti randomizzate): far individuare a ogni profilo il significato di iKant, EDU/CANONICAL, C87, una prova e un limite; misurare esattezza di 5 risposte, tempo, false sicurezze e tasso di abbandono. Confutazione della pretesa divulgativa: risultati non superiori alla precedente documentazione o maggiori false convinzioni di coscienza/ACTIVE. Non scegliere soglie post-hoc.

## Checklist per la review di una pagina

- [ ] Riesco a dire **perché esiste** prima di incontrare sigle?
- [ ] Ogni prima sigla Cx ha definizione immediata e link all'owner?
- [ ] La pagina separa DOCUMENTATO / OSSERVATO / INFERITO / NON ATTESTATO?
- [ ] Una persona può distinguere LLM, infrastruttura iKant e umano?
- [ ] Le analogie neuro-cognitive sono marcate come **modelli**, non identità o prove biologiche?
- [ ] Il falsificatore più semplice è esplicito?
- [ ] I link esistono e il documento è raggiungibile dall'atlante?
- [ ] È chiaro cosa manca per il prossimo gate (umano, tecnico o scientifico)?

Vedi [ricerca falsificabile](IKANT_RESEARCH_QUESTIONS.md), [prove runtime E2E](IKANT_RUNTIME_AND_EVIDENCE.md) e [configurazione](IKANT_LOCAL_SETUP.md). Nessun audit documentale può creare una ricevuta C87 o C125.
