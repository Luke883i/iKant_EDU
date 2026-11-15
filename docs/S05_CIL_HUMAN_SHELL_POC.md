# S05 · Shell leggibile, sicura e verificabile — riflessione 1/3

**Tipo:** proposta di proiezione HOST, non un owner, non un componente nativo installato.
**Source lock:** verificare `main` contro il commit scelto prima di ogni esecuzione; il codice sottostante prevale sulla guida.

## Il problema, detto semplicemente

Il contratto di OneShell ha sei caselle tecniche indispensabili (`ESITO | A | B | PROVA | EDGE | NEXT`), ma l'utente non dovrebbe essere costretto a conoscerne le sigle. Una vista può **tradurre i titoli**, senza riscrivere i valori, spostare A o inventare evidenze. La distinzione fra la voce originale di iKant e l'osservazione tecnica HOST resta rigida.

| Slot immutabile | Titolo business leggibile | Icona archetipica (token Lucide) | Autorità |
|---|---|---|---|
| ESITO | Risultato | `target` | solo fatto tecnico attestato |
| A | La risposta di iKant | `message-square-text` | byte originali soltanto dopo S03/C87/C125, altrimenti `NO_VOICE` |
| B | Controlli operativi | `settings-2` | telemetria HOST, non una seconda risposta |
| PROVA | Evidenze | `file-check-2` | digest di integrità non equivale a documento riaperto |
| EDGE | Punto aperto | `shield-alert` | primo vincolo non dimostrato |
| NEXT | Prossima azione | `arrow-right` | una sola azione autorizzata, altrimenti STOP |

## Perché solo questo minimo di CIL

La libreria allegata `CIL_chat_v1.zip` fornisce una *grammatica di richieste*, non un'API renderer. È stata verificata senza copiarla nel repo (sorgente e licenza di distribuzione non attestate):

- `intent=explain_relation`, `availability={VIZ:no,IUI:yes}` → oggetto **`IUI.TEXT`**, `eligible_not_render_verified`;
- sei nodi `IUI.TEXT` e **cinque** archi `co_present`, tutti validi secondo `validate_composition`;
- nessun `VIZ`, `DAT`, `BLK`, form, pulsante o widget state, nessuna `live_cross_surface_binding`;
- cinque archi sono una richiesta di compresenza **non una garanzia di layout**. La proiezione Markdown è il fallback deterministico, i token iconici sono solo indicazioni grafiche.

Questa è una scelta minimale di **un tipo di oggetto, una relazione, sei etichette esistenti**. Nessuna nuova fonte di verità.

## PoC reale riproducibile

Con Node.js 20+ su un checkout verificato:

```sh
node scripts/s05-shell-poc.mjs
node --test tests/s05-cil-human-shell.test.mjs tests/s03-host-slides.test.mjs tests/s03-owner-bound-presentation.test.mjs
```

La CLI mostra sei intestazioni con glifi accessibili e `NO_VOICE`, perché non ha C87 stesso-turno. Il percorso alternativo `projectS05CILShell({ownerTurn,originalC125Text})` **riusa** `projectS03CompletedEduTurn` e conserva `original_voice_utf8` byte-per-byte per una ricevuta EDU locale coerente, ma **non** può autenticare da sé la provenienza del chiamante o la consegna nativa. Un'istanza HOST deve verificare fisicamente la sorgente e il readback prima di usarla come voce.

## Potenzialità, limiti e mitigazioni

**Potenzialità:** lettura gerarchica umana senza perdere sei ruoli; icone che aiutano la scansione; fallback senza JavaScript, stato, pulsanti o backend; test con snapshot e seed riproducibili.

**Limiti:** rendering Intelligent UI non deterministico; nessuna UI nativa persistente; una stringa firmata non prova che il browser l'abbia mostrata; Markdown del contenuto A può avere propria formattazione. Nessuna prestazione cognitiva o beneficio per utenti reali è misurato.

**Mitigazioni:** A invariato, `NO_VOICE` sul blocco, titolo+slot per screen reader, nessun colore come unica semantica, nessun tasto privo di callback, sei sezioni sempre presenti, nessuna promozione ad `ACTIVE`; byte e ricevute restano conservati nei loro owner e non nella vista.

## Gate DoD (riflessione 1/3)

- [x] CIL ZIP integro, test originali 14/14 e composizione minima validata.
- [x] Riuso reale S03, nessuna nuova scrittura, nessuna modifica a C87 o C125.
- [x] PoC CLI replicabile e test negativo su tamper, proxy e metadata; ordine esatto dei sei slot.
- [ ] 10.000 mutazioni semanticamente distinte e seed preregistrato: **riflessione 2/3**, non proclamare già eseguite.
- [ ] Test di leggibilità con persone, accessibilità nel client, provider identity e consegna nativa: **non attestati**.
- [ ] Qualificazione GitHub del commit PR e controllo di non regressione, più review umana: necessari prima di merge.

**Ambito prossimo:** prima di estendere la UI, la riflessione 2/3 selezionerà 10.000 perturbazioni distribuite fra voce originale, eventuale doppio writer, tipo di ricezione, evidenze, routing dei sei slot, leggibilità, injection e assenza delle feature CIL; confronterà i falsi positivi con un oracolo indipendente. Non sostituire questi casi sintetici con test reali di persone.

[Canone originario a sei slide](../project/oneshell-v7/03_SLIDES.md) · [Slide EDU storica](../project/edu-oneshell/SLIDE.md) · [Contratto S03](../contracts/s03-host-slides.json).
