# Come è stata scelta la nuova struttura documentale

**Scope:** 100 *contratti editoriali* sintetici, NON 100 progetti indipendenti, utenti intervistati o esperimenti cognitivi. L'unica fonte dei vincoli runtime è il repository originale. Il selettore è un aiuto **HOST authority-zero**: non aggiunge un owner, non può modificare il comportamento di iKant e non promuove una PR a release.

Sono state enumerate **100 combinazioni**: cinque ordini di lettura per pubblici diversi × cinque progressioni della storia × quattro politiche sulle pretese/prove. La rubrica pesa rispettivamente **30 + 30 + 40 punti** al massimo. La politica che autorizzerebbe dichiarazioni `ACTIVE` non verificate è **esclusa** a priori. A parità di punteggio si usa l'ID lessicograficamente minore.

**Contratto selezionato:** `DOC001` (100/100 punti nella **rubrica**, non nella qualità del prodotto): **persona → ricercatore → ingegnere**, **problema → funzionamento → prove → rilascio**, **quattro classi epistemiche esplicite**. Resta una scelta di design valutabile da utenti reali, non il miglior documento possibile in senso universale.

**Test di falsificazione:** 100 mutazioni del testo (rimozione/sostituzione di un'ancora semantica obbligatoria per volta), che devono fallire; controllo di collegamenti `docs/` inesistenti, di due affermazioni false di `ACTIVE`/coscienza, di C72/v1 vs v2 e della progressione di lettura. Risultato ottenibile con:

```bash
node scripts/readme-contract-select.mjs
node --test tests/readme-editorial-contract.test.mjs
```

**Limite metodologico importante:** queste mutazioni mostrano che il *controllo editoriale intercetta ciò per cui è stato scritto*, non provano la conservazione integrale di ogni significato né accessibilità reale. La revisione da parte di persone con profili diversi e i benchmark RQ1–RQ3 restano gate separati. [Protocollo di ricerca](IKANT_RESEARCH_QUESTIONS.md) · [Mappa runtime](IKANT_RUNTIME_AND_EVIDENCE.md).
