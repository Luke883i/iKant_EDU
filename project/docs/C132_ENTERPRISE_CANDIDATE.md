# iKant — ENTERPRISE_CANDIDATE, qualificazione incrementale

**Stato:** `ENTERPRISE_CANDIDATE / SHADOW_COGNITION`, non release enterprise, non CANONICAL ACTIVE, non miglioramento generalizzato del modello linguistico dimostrato. La sorgente ufficiale resta il commit di `main` dopo il merge e la qualifica separata della release. Questo rapporto deve essere aggiornato alla lettura del commit reale, non ereditato da un candidato pre-merge.

## Proposta in linguaggio semplice

Il software oggi conserva molte prove ma può classificare male una domanda e bloccare una risposta legittima. L'obiettivo è usare le prove **per liberare ragionamenti utili**, non per moltiplicare divieti. Nessuna qualità del linguaggio viene dedotta dai soli hash.

## Punti di attenzione prioritari, sempre attivi (P0)

| P0 | Per l'utente | Anti-rischio nel codice | Prova negativa |
|---|---|---|---|
| P0-A Comunicazione facile | Cosa posso fare? Cosa non è provato? | `scripts/c132-zero-gates.mjs`: README con utilità, limiti e guida | Messaggio pubblico senza spiegazione -> FAIL |
| P0-B Complessità | Un solo prodotto, non dieci percorsi | Catalogo vincolato a `main`, selezione di un'architettura valida | PR come release o ingresso concorrente -> FAIL |
| P0-C Integrità non è intelligenza | SHA e registri non attestano qualità della risposta | Rifiuto di flag di efficacia o CANONICAL ACTIVE non dimostrati | `external_model_cognitive_uplift_attested:true` -> FAIL |
| P0-D Coerenza nel tempo | README, versione e catalogo devono parlare della stessa versione | Contratti prodotto e release controllati congiuntamente | Promozione del candidato a release senza prova -> FAIL |

I controlli P0 sono software locale, non una garanzia di intercettare ogni testo dell'interfaccia ChatGPT.

## Gold: livelli e denominatori non intercambiabili

1. **Archeologico:** PR e blob reperibili, anche se non integrati. Una PR non è necessariamente una funzionalità live.
2. **Inventariale:** 100% dei file tracciati enumerabili con hash/ruolo di massima; non prova valore semantico.
3. **Curato:** componenti con owner, decisione e rischio espliciti nel registro gold. Al merge #129 erano 38 su 986 file, non il 3,85% della funzionalità o dell'intelligenza.
4. **Eseguibile:** owner chiamabili e test ripetibili su sorgente esatta; distinto dal livello curato.
5. **Integrato:** attraversamento effettivo e verificato delle dipendenze, con input, nonce e medesimo hash. Non deducibile dal numero dei test.
6. **Cognitivo:** classificazione rispetto a oracolo predefinito, risposta utile da modello reale, confronto cieco, errori e costi; tre strumenti diversi.
7. **Prodotto:** distribuzione dal commit effettivo di `main`, avvio accessibile, rapporto qualità-prezzo, release esplicita.

**Semantic lossless significa**: ogni file e decisione precedente resta indirizzabile; cambiamenti e scarti hanno una mappa; non equivale alla pretesa non verificabile che ogni significato storico sia stato valutato o conservato senza trasformazioni.

## Sfida della sequenza precedente

Sono confrontate 10 sequenze alternative e 100 combinazioni finite di tre decisioni (`4 ingressi × 5 approcci cognitivi × 5 forme di prova`). Sono alternative ingegneristiche esplicite, NON cento inferenze di un LLM. `node scripts/c132-decision-lattice.mjs --json` produce la selezione e i motivi di esclusione. La sequenza ammessa in questa matrice è:

**P0 -> inventario gold -> prototipo cognitivo verificato in parallelo -> migrazione completa dell'owner su nuova epoch -> prove dello stesso commit -> scelta separata di release.**

L'ordine rifiutato più rischioso è `release prima dei dati` o `modifica silenziosa della sorgente pinnata`. Ingresso canonico: nessuna scorciatoia da pacchetto EDU a hook nativo; se il trasporto canonico fallisce, il fallback manuale potrà essere introdotto solo da un owner originale che registri al massimo tre fallimenti distinti, tratti in modo fail-closed gli esiti incerti e preservi i requisiti nativi.

## Definizione di completamento: reticolo e checklist

| Nodo | Dipende da | Contratto / misura | Esito di questa slice |
|---|---|---|---|
| D0 — fonte | commit di main | file verificabili e storico immutato | PR candidata; integrare e qualificare |
| D1 — P0 | D0 | 4/4 guard, 0 false promozioni nei test negativi | Prototipo testato |
| D2 — gold | D0 | tutti i blob identificati; curati separati da non curati; 0 decisioni senza owner | Misurabile localmente |
| D3 — alternative | D1 | 100 configurazioni, 10 sequenze, vincoli espliciti, scelta deterministica | Test software |
| D4 — classificazione | D1, D3 | human/software/mixed; negazione/citazione; corpus etichettato, errori e regressioni riportati | **SHADOW** dimostrabile, NON owner produttivo |
| D5 — owner cognitivo | D4 | nuova source epoch, manifest e pin, stesso input, C70/C114/C87 e readback end-to-end | NON CHIUSO |
| D6 — ingresso CANONICAL | D0, D5 | 3 fallimenti veri massimi, prova nativa preservata, nessuna doppia scrittura | NON CHIUSO |
| D7 — efficacia LLM | D5 | ≥300 coppie stesso modello/input per rotta, reviewer ciechi, baseline, sicurezza, latenza, costi, fallimenti | NON CHIUSO |
| D8 — release | D1–D7 secondo tier | tutte le CI richieste sul medesimo SHA, bundle doppia build e release esplicita | NON CHIUSO |

**La DoD di questa PR** è una slice di strumenti P0, scelta architetturale, censimento e prototipo cognitivo shadow; non basta a dichiarare la DoD enterprise né una V1 canonica. Il vantaggio cognitivo dimostrato è soltanto nella piccola funzione di classificazione sui casi previsti, non nella qualità globale del ragionamento.

## Criteri di falsificazione

- Nessuna frase «non sono cosciente» può diventare prova positiva di coscienza; nessuna frase citata può attivare un falso blocco senza un'affermazione positiva dell'HOST.
- Una domanda sull'essere umano non diventa auto-ontologia del software perché contiene «ontologia».
- Stringhe fuori forma, input troppo lunghi e caratteri di controllo devono fallire.
- Mai promuovere flag di prova dal solo caller o un test double a ricevuta del provider reale.
- Aumento di accuratezza locale del classificatore non attesta guadagno LLM né autorizza bypass di C114.
- Cambio di un pin storico senza nuova epoch fallisce prima dell'esecuzione.
- Ogni workflow cancellato richiede migrazione dichiarata, non un silenzioso indebolimento di CI.

**Comandi di prova:** `node --test tests/c132-enterprise-candidate.test.mjs`, `node scripts/c132-zero-gates.mjs`, `node scripts/c132-decision-lattice.mjs --json`, `node scripts/c132-gold-dashboard.mjs` (ultimo richiede registro gold e git-tree completo).

## Misura riproducibile del miglioramento circoscritto

Il corpus fisso di **20 domande etichettate** in `scripts/c132-cognitive-benchmark.mjs` confronta lo stesso input con C82 originale e con il classificatore C132, senza generare testo tramite LLM. Nella misura locale: **5 instradamenti impropri di domande non-software al percorso SELF_ONTOLOGY in C82, contro 0 al percorso software nel prototipo C132**; 20/20 categorie del soggetto e 6/6 domande software riconosciute nella matrice scelta. Questa è una prova del codice su un corpus dichiarato, **non** una stima su richieste future, né un miglioramento dimostrato della qualità di risposta. Il test automatizzato rifiuta regressioni su questo corpus.
