# Revisione post-edit: sigle, progressione umana e prove

**Perimetro:** questa review riguarda il README e i sei documenti introduttivi modificati dalla PR. Non certifica tutti i file storici del repository né la comprensione da parte di lettori reali. Il controllo è riproducibile, ma resta una verifica **documentale/strutturale**, non una prova di effetto cognitivo.

## Percorso di lettura e domanda che ciascuno deve saper risolvere

| Pubblico | Prima lettura | Domanda di controllo, risposta attesa |
|---|---|---|
| Chiunque | [Inizio senza gergo](START_HERE.md) | Perché un LLM fluido non basta? Perché testo plausibile ≠ prova. |
| Decisori e ricercatori | [Research questions](IKANT_RESEARCH_QUESTIONS.md) | Come si può smentire un miglioramento promesso? Con endpoint preregistrati e controlli. |
| Ingegneri nuovi al repo | [Cx in parole semplici](IKANT_CX_LEXICON.md), poi [mappa E2E](IKANT_RUNTIME_AND_EVIDENCE.md) | Dove sono owner, contratto, prova, confine nativo e primo blocco? Ogni sigla ha fonte e limite. |
| Chi installa | [Bootstrap](IKANT_LOCAL_SETUP.md) | Quale differenza fra file Project, Node, plugin e CANONICAL? Nessuna equivalenza automatica. |
| Reviewer di release | [Architettura](ARCHITECTURE.md), test e catalogo | Quali prove sono soltanto locali e cosa richiede un gate umano? |

## Regole di leggibilità, con falsificatori

1. **Prima menzione:** la sigla in README/ARCHITECTURE ha una spiegazione a fianco; gli altri documenti portano al dizionario. **Fallimento:** abbreviazione nuova non coperta.
2. **Significato non ambiguo:** ogni sigla ha lo scopo, fonte originale e ciò che non attesta. **Fallimento:** link rotto, fonte inesistente, alias C72/v1 → C72/v2.
3. **Niente overclaim:** `ACTIVE`, coscienza, persistenza e consegna nativa restano delimitati. **Fallimento:** un testo dichiara attivo un plugin solo perché nominato.
4. **Progressione umana:** problema → esempio → flusso → prova/limite → esperimento confutabile → decisione. **Fallimento:** una pagina richiede conoscenza di `C59` o `C87` prima di spiegarli.
5. **Sostenibilità:** le aggiunte non superano il budget costituzionale Markdown; il comportamento degli owner non cambia. **Fallimento:** `npm run check` o regressioni originali falliscono.

## Riproduzione

```bash
node --test tests/ikant-cx-postedit-review.test.mjs tests/readme-editorial-contract.test.mjs
node scripts/readme-contract-select.mjs
npm run check
npm run runtime-root:verify
```

Il test post-edit estrae le sigle Cx/S02 dai documenti di ingresso e richiede una definizione nel dizionario; controlla i link locali e usa due mutazioni negative (sigla spiegata cancellata; path sorgente rotto) per verificare il blocco. Le 100 mutazioni editoriali della selezione originale rimangono un controllo **separato** e non provano che ogni frase sia preservata semanticamente.

**Gate aperto:** una persona non tecnica, un revisore scientifico e un ingegnere non già coinvolto devono tentare la lettura completa, segnalare punti opachi ed eventualmente proporre correzioni. Il superamento automatico non sostituisce questo riscontro.
