# R7/V13 · PR di trapianto semantico (draft, non merge-ready)

Questo documento è una **ricevuta di staging**, non un'attestazione di trapianto riuscito. Non promuovere a PASS i check non eseguiti.

## Origini fissate

- GitHub main: `8cb80d2230919220ac4b7a1cfcd80950d8467848`
- Tree main: `4cff62ed12f79390a059784bcbf9770788a3a4d1`
- V13 source: `86e20abb714fa4000352b61a0c0abf8795775318` (storia Git locale **sintetica**: non pushare come storia GitHub)
- V13 tree desiderata: `07f135d6d54ff69b78cc9e7215daa0bdafa9f84c`
- V13 source bundle: `V13/source/v13_source.git.bundle` dell'archivio `iKant_EDU_R7_V13_CAUSAL_CONTRACTION_CORA_20261115.zip`.

## Come completare il trapianto

1. Clonare il vero `Luke883i/iKant_EDU` e verificare `main` alla revisione fissata. Non utilizzare l'orphan V10 locale come parent di una PR.
2. Estrarre localmente `V13/source/v13_source.git.bundle` dall'archivio V13; lavorare su un clone pulito, con Git e Python 3.11+.
3. `git fetch origin refactor/r7-v13-semantic-transplant-gated-20261115` e posizionarsi su tale branch. Configurare localmente user.name / user.email per i nuovi commit.
4. Eseguire **da percorso esterno al checkout** una copia di `scripts/r7-v13-pr-transplant.py` con `--repo . --bundle /percorso/v13_source.git.bundle --draft --receipt /tmp/r7-v13-transplant.json`. Lo script ritira i due file di staging, verifica che la tree ritorni esattamente uguale a main, riapplica 35 commit semantici uno alla volta, controlla la tree dopo ciascun commit e rifiuta divergenze.
5. Eseguire `git fsck --full`, `npm run runtime-root:verify`, `npm run check:mcp`, `npm run check`, `npm run qualify:project-session`, `npm run qualify:v1:product` e `npm test`. Non riutilizzare prove di un'altra SHA.
6. Solo dopo replay e test, effettuare push **fast-forward** sulla stessa branch: `git push origin HEAD:refs/heads/refactor/r7-v13-semantic-transplant-gated-20261115`. Non usare force push.
7. Attendere la CI remota sul nuovo commit e la revisione indipendente degli owner; tenere la PR draft finché i gate non sono chiusi.

## Reticolo DoD (AND non compensatorio)

- P: provenienza originale e registri governance storici integri.
- S: sette directory / nove file radice e tree Git verificata.
- L: mapping univoco 1.630→1.630, permessi Git invariati e rollback.
- I: grafo dei consumer statici qualificato; consumer esterni/dinamici classificati UNKNOWN finché non verificati.
- O: review indipendente delle quattro modifiche sensibili alle autorità di Project EDU/MCP.
- Q: `npm test`, smoke native, CORA `process-run` con report valido e CI su **stessa** SHA.
- A0 = P AND S AND L AND I AND O AND Q. A0 HOLD finché un gate è aperto.

## Prove antecedenti (NON prove CI della PR)

V13 locale: 1545 PASS, 0 FAIL, 2 SKIP su 1547 test; tree esatta riprodotta in due percorsi. CORA `snapshot` e `verify-ledger` PASS scoped; `process-run` restituisce `DEBT_BLOCKED`. Owner review, CI remota ed equivalenza nativa provider/MCP restano non attestate.

**Stato attuale della PR di staging:** NOT_TRANSPLANTED / ABSTRACT_DOD_HOLD / PRODUCT_GO=false. Il file sarà rimosso dal trapianto definitivo: la prova finale è il contenuto della tree V13 e le nuove ricevute GitHub, non questa autodichiarazione.
