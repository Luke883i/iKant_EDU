# R7/V13 · importazione semantica nella PR #249 — procedura corretta

**Questo documento sostituisce la prima procedura cherry-pick**: il solo cherry-pick produce una tree V13 identica ma fallisce 28 test storici V5-B/CORA sul nuovo DAG. Il difetto è stato falsificato. Una seconda-parent provenance edge è necessaria alle attestazioni storiche correnti.

## Grafo Git canonico proposto

```text
GitHub main @ 8cb80d2
     |
  PR #249 staging HEAD ------ first parent ------+
                                                  MERGE -> EXACT V13 tree
V10 synthetic root -> 35 V13 semantic commits ---+
                            second parent (evidence-only)
```

La V10 synthetic root non è il vero passato di GitHub main. Il nuovo merge dichiara questa provenienza in modo esplicito, senza spacciare le attestazioni per approvazione. I 35 commit originali rimangono immutati e non sono duplicati dal cherry-pick.

## Esecuzione in clone pulito

1. Clonare `Luke883i/iKant_EDU` da GitHub e fare checkout della branch `refactor/r7-v13-semantic-transplant-gated-20261115`, dopo aver confermato `main@8cb80d2`. Configurare Git user.name e user.email.
2. Estrarre dal bundle V13 originale il file `V13/source/v13_source.git.bundle` e copiarlo fuori dal checkout.
3. Copiare lo script `scripts/r7-v13-pr-transplant.py` fuori dal checkout, per non dipendere dalla sua successiva rimozione.
4. Eseguire: `python3 /tmp/r7-v13-pr-transplant.py --repo . --bundle /tmp/v13_source.git.bundle --receipt /tmp/r7-v13-import.json`
5. Verificare il merge SHA e la tree `07f135d6d54ff69b78cc9e7215daa0bdafa9f84c`, poi creare un worktree temporaneo per lo SHA `refs/r7-v13/imported`. **Non usare checkout shallow**: `actions/checkout` deve usare `fetch-depth: 0` nei workflow che verificano epoche storiche.
6. Eseguire sulla HEAD candidata `git fsck --full`, tutti gli smoke e `npm test`, CORA snapshot/verify/process-run/verify-process. Trattare DEBT_BLOCKED come blocco, anche se il replay è verificato.
7. Se tutti i test source-level sono verdi, effettuare push senza force: `git push origin refs/r7-v13/imported:refs/heads/refactor/r7-v13-semantic-transplant-gated-20261115`. La PR resta draft finché remote CI e review owner non attestano la HEAD esatta.

## Verifiche osservate (locale, non sulla branch remota)

- 35/35 commit del bundle originali e tree V13 esatta.
- Con 35 cherry-pick senza parent di provenienza: 28 FAIL su 1.547 test.
- Con source-parent merge: 57/57 test mirati storici PASS.
- Shallow clone depth 1: 3/22 test storici FAIL; full clone: 22/22 PASS.
- `CORA process-run full`: DEBT_BLOCKED, non PASS.
- GitHub PR #249 attuale: staging; non contiene V13.

## DoD

P ∧ S ∧ L ∧ I ∧ O ∧ Q. La preservation strutturale e il source readback locali non surrogano consumer esterni, CI remota, review owner o provider native proof. `GLOBAL_DOD=HOLD`, `PRODUCT_GO=false`. Non procedere al merge della PR fino a prova esterna e revisione.
