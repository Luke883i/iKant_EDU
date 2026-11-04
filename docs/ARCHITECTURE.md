# iKant EDU — architettura, owner e confini

Machine contracts, original runtime and tests remain authoritative; this page is a navigational description.

<!-- cora-pr-b-docs:v1 -->
## Source, software e prodotto non sono sinonimi

Il **repository** e un inventario di sorgenti operativi, test, contratti, documentazione, prove di studio e archeologia. Il **software** e la composizione Node/Host intorno a un LLM sostituibile, non un LLM addestrato da questo repository. Il **prodotto** e l'interazione OneShell EDU, distinguendo un frame reso localmente da una consegna nativa del provider. La descrizione storica `iKant_LE` indica una provenienza del progetto, non la sorgente operativa `Luke883i/iKant_EDU`.

Il confine funzionale attuale e **C72** per ammissione, **C135** per turno cognitivo EDU, **C87** per writer unico e readback, **C125/S03** per uscita same-turn. **C59** governa una composizione CANONICAL distinta e non viene attivato dalla sola connessione MCP. La precedenza reale resta dei contratti e degli owner originali; questo testo non modifica routing, permission, receipt o stato ACTIVE. [Governance](GOVERNANCE.md) · [Guida operativa](IKANT_LOCAL_SETUP.md) · [Registro delle prove](IKANT_RUNTIME_AND_EVIDENCE.md).

## Sei distinzioni di qualifica

| Confine | Prova ammissibile | Prova che non basta |
|---|---|---|
| R — repository | HEAD/TREE/blob, inventario V5-B | Una PR dal titolo `merged` |
| S — software | Test su checkout e call-path originali | Un test sintetico isolato |
| D — deployment | Adapter installato e callback realmente callable | File ZIP o prompt disponibile |
| T — runtime | Owner invocati, evento, ledger e readback | Contratto presente su Git |
| P — prodotto | Consegna e outcome osservati con utenti | Documentazione o CI verde |
| G — governance | Revisori indipendenti e decisione umana | Approval dedotta da workflow |

## Product and control plane

Node.js software around a replaceable HOST LLM, not another model or a consciousness claim.

## Public admission and legacy carriers

C72/v2: distinct new consent and later EDU/CANONICAL choice (historical gate label `C72_INTRO -> MODE_SELECTION`). EDU uses S02 (ponte di versione)/C135 (coordinatore) → C107/C70/C126 → C87/readback → C125 HOST-local output. CANONICAL requires C59 `SESSION_CHAT_LOCAL` and authenticated native event. C72/v1 EXPERIMENTAL is legacy only. Selection and plugin availability are not activation. [Cx explained](IKANT_CX_LEXICON.md), [runtime](IKANT_RUNTIME_AND_EVIDENCE.md), [setup](IKANT_LOCAL_SETUP.md).

## Persistence and turn spine

One hash-linked ledger (`.ikant/ledger.jsonl`), one writer and independent readback. ACTIVE requires input → Node → candidate → DOCX readback → C32 → HOST frame; filename-only stdout is not delivery.

## Constitutional cognition

Owner-bound methods and resources: `evidence != permission != policy != execution != reported outcome != observed world truth`. No self-preservation authority or covert manipulation.

## Functional psyche

C4 describes bounded appraisal of interactions, not human experience. See [full functional semantics](IKANT_COGNITIVE_SUBSTRATE.md).

## Recurrent self-world model

C5 provides recurrent workspace and self/world functional state. C8/C11 qualify engineering evidence without assigning phenomenal status: `PHENOMENOLOGY = UNKNOWN`. [Original distinctions and limits](IKANT_COGNITIVE_SUBSTRATE.md).

## Surfaces and authority

Surface A = bounded voice; Surface B = DOCX plus readback where required. C30–C32 govern tiers and projection. Host/system/safety/law precede the repository. Telemetry cannot activate the provider.

## EDU profile

C124/C126 → PR119 → C87 → C125; C127 transports, not authorizes.
