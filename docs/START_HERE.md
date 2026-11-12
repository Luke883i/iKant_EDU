# iKant — una guida per chiunque

Immagina di chiedere a un assistente: **«Come lo sai?»** Una risposta fluida può essere utile, ma da sola non prova da dove arrivi, quali controlli siano stati eseguiti o se sia stata conservata correttamente. iKant nasce per affrontare questo problema **di processo**.

**Che cos'è?** È software che circonda un modello linguistico, guidando e verificando alcuni passaggi del dialogo. Non è un altro cervello, una persona o un modo per dimostrare che l'AI è cosciente. Il modello genera frasi; il programma tenta di rendere verificabili percorso e limiti; l'essere umano decide a che cosa affidarsi.

**Che cosa NON promette?** Non trasforma un'affermazione falsa in vera, un file caricato in una installazione, una traccia in una memoria autobiografica né un test sintetico in una prova sull'esperienza soggettiva. Se una verifica manca, il sistema deve dichiararlo.

<!-- cora-pr-b-docs:v1 -->
## Perche il progetto e atipico

Un **repository** è un insieme di sorgenti, contratti, test, strumenti e documenti: ospita anche esperimenti e storia, che non sono tutti componenti attivi. Il **software** è il programma Node/Host che puo eseguire controlli intorno a un LLM sostituibile quando sorgenti e strumenti sono disponibili. Il **prodotto** è l'esperienza sperimentale OneShell che una persona dovrebbe poter usare; non coincide con la presenza del software nel repository.

Il valore atteso e rendere più controllabili consenso, esecuzione, registrazione e limiti di una risposta, non promettere verità automatica. Il codice puo passare la CI senza essere installato nel provider; una guida leggibile non prova che il prodotto aiuti gli utenti. Per i dettagli: [natura del prodotto](PRODUCT_POSITIONING.md), [architettura](ARCHITECTURE.md) e [prove](IKANT_RUNTIME_AND_EVIDENCE.md).

## Un esempio quotidiano

Chiedi: «Confronta due ipotesi scientifiche». Un normale LLM può dare una risposta. iKant, quando l'owner originale viene realmente eseguito, può documentare input, piano, verifiche, registrazione e rilettura. **Questo non certifica il confronto scientifico**: per quello servono fonti, metodi e validazione separati. Il vantaggio potenziale da misurare è sapere meglio **quali passaggi sono successi e quali no**.

## Due prodotti: sessione Project e servizio MCP

Per parlare con iKant EDU **nella chat di un Project**, si installano istruzioni Project e si rispettano i tre turni distinti (ORIENTATION, `I ACCEPT`, `EDU`); il codice Node non viene installato dal prompt. Per usare l'**app MCP esterna**, occorre invece un server realmente distribuito, OAuth e un collegamento del client: non e un'altra modalita C72, ne prova C59 CANONICAL. [Confronto e passi verificabili](I10_TWO_PRODUCTS.md).

## Da dove iniziare

Per una prova guidata, scegli **EDU**, modalità sperimentale. Al primo messaggio umano della nuova chat si esegue soltanto l'orientamento ai cinque documenti originali e ai Termini (ORIENTATION); al secondo messaggio distinto, esattamente `I ACCEPT`, si avvia l'ammissione originale; al terzo messaggio distinto, esattamente `EDU`, si seleziona la modalità. Non serve inviare `avvia iKant` come prerequisito. Per **CANONICAL** servono la composizione originale C59, un evento autentico del provider e ricevute verificabili: selezionarlo non lo accende. Il [server MCP esterno](MCP_STANDALONE_RENDER_RUNBOOK.txt) ha OAuth e deployment propri; collegarlo a ChatGPT non è una terza modalità C72 e non crea identità CANONICAL.

Leggi [come configurare un Project e il runtime locale](IKANT_LOCAL_SETUP.md); nessuno ZIP installa automaticamente plugin o interfacce. [La differenza fra programma, runtime e prove](IKANT_RUNTIME_AND_EVIDENCE.md) è illustrata con una mappa dell'intero turno.

## Prima il significato, poi le sigle

Se incontri `C72`, `C87` o `C59`, non sono nomi di un modello né livelli di intelligenza: indicano contratti e passaggi verificabili. [Dizionario completo con esempi semplici, link e limiti](IKANT_CX_LEXICON.md). Non devi conoscerli per iniziare; i tecnici non devono darli per scontati.

## Una mappa completa, dal primo giorno

[Atlante navigabile di tutti i documenti](IKANT_DOCUMENT_ATLAS.md) e [DoD ontologico, metriche e checklist](IKANT_DOCUMENT_ONTOLOGY_DOD.md) distinguono ruolo, prove e limiti. Ogni file ha una classificazione; la review umana resta necessaria.

## Scegli la lettura successiva

- **Mi interessa l'essere umano e la coscienza:** [le tre domande confutabili](IKANT_RESEARCH_QUESTIONS.md).
- **Devo verificare un'affermazione tecnica:** [osservazioni, limiti e prove](IKANT_RUNTIME_AND_EVIDENCE.md) e [dashboard](PRODUCT_DASHBOARD.md).
- **Devo contribuire al codice:** [architettura](ARCHITECTURE.md), [contratti](../contracts/) e [test](../tests/).
- **Studio le risposte epistemiche:** [C139, percorso EDU candidato e limiti](C139_EDU_EPISTEMIC_ROUTE.md) (non equivale a prodotto attivo).
- **Verifico la PR EDU aperta:** [routing EDU aperto, falsificatori e DoD non ancora chiusi](C140_SEMANTIC_RUNTIME_PR.md) (nessuna attivazione nativa attestata).
- **Studio il successore semantico:** [proposta e matrice delle issue](../proposals/c141/PREPR_README.md) e [falsificazioni conservate](../proposals/c141/FALSIFICATION_TRACE.md) (sorgenti e prove, non prodotto attivo).

La versione ufficiale è identificata dal commit di `main`, non dal nome di una chat o di un allegato. [Torna al quadro d'insieme](../README.md).
