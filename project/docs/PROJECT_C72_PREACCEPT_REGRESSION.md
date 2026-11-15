# C72 pre-consent regression: bounded source access and original receipts

## Incident and epistemic scope

Observed user report from a newly installed portable prompt at HEAD
`05a389339d96cc82324ed95a5f756ed1828e8d29`:

- First-contact Host explicitly reported consulting Git TREE and other files
  **before** the five canonical orientation files and Terms.
- On a separate exact `I ACCEPT`, Host showed an introduction reconstructed from
  the C72 source, but **not** an executed/validated C72 original owner receipt.
- Host inferred `HARD_PREACCEPT_BREACH` and said to open a new chat. That
  terminal is justified only by original admission state/trace showing a hard
  action or continued prohibited access, **not merely by a summary written by Host**.

The report is evidence of what was displayed to the user, not a transcript of
actual tool calls. Therefore the precise tool order, number of accesses and
original admission receipt are **NOT_ATTESTED** here. Reading a prohibited TREE
once is classified `READ_ONLY_PREACCEPT_OVERREAD`, potentially remediable;
continued prohibited reads escalate to `HARD_PREACCEPT_BREACH` under
`src/admission.mjs`. Never retroactively erase an incident.

## Root cause and semantic repairs

The portable prompt already forbade pre-consent Tree API, but an untrusted Host
can still make direct calls outside that text. In addition the generation
contract misleadingly said `PROMPT_BLOB_TREE_METADATA_ALLOWED` before consent.
The repair:

1. Make the contract state `ONLY_HEAD_AND_FIVE_PINNED_DOCUMENTS_PREACCEPT_NO_TREE_OR_BLOBS`;
   pin this exact token in the original generator and test it.
2. Front-load an explicit negative first-operation rule in the portable prompt.
   Its physical UTF-8 length, **including the pinned HEAD/TREE prefix**, remains
   at most 8,000 bytes; preserve original owner details in repository contracts.
3. Provide a separately **preinstalled-only** Host-side wrapper
   `host/project-c72-preaccept-gate.mjs` to allow HEAD once, five pinned direct
   files in order, blob SHA verification, Terms link display claim and freeze.
   A fresh exact human `I ACCEPT` calls `acceptC72V2LinkedTerms` and
   `presentC72V2Introduction` from the original owner, without model recreation.
   A missing owner or missing document never yields acceptance.
4. Use tests against out-of-order, mutated bytes, duplicate orientation,
   extra tool actions and acceptance before Terms presentation.

**Crucial limitation:** The gateway can only constrain the callbacks routed
through it, not arbitrary GitHub/Host tools chosen outside it, and a Project
text prompt does not install it. A truly enforced guarantee requires tool
permissions/router preinstalled at the Host boundary. The available software
qualifies the guarded path, **not** provider-wide tool exclusivity or provenance.

## UI and fail-closed acceptance

A clean orientation surfaces only a compact OneShell with a status badge,
HEAD SHA, five immutable links, Terms link and exactly one human next action
(`I ACCEPT`). During `AWAITING_ACCEPTANCE`, do **zero** repository reads.

On acceptance, only an original C72 receipt authorizes the unchanged full
C72 introduction and subsequent mode choice. If the owner is unavailable,
display `NO_VOICE` and `C72_OWNER_UNAVAILABLE` without reconstructing its
introduction. If a preaccept overread is observed, preserve the incident, stop,
classify using original source-level admission evidence and do not declare
HARD unless supported. An owner-denied session cannot be rescued narratively.

## Definition of Done and falsifiers

| Gate | Requirement | Falsifier |
|---|---|---|
| C72-01 | HEAD once + five direct pinned paths in order | seventh or out-of-order delegated call |
| C72-02 | Blob identities verified before Terms | mutated content accepted |
| C72-03 | No additional preaccept repo calls after Terms | post-freeze delegate invoked |
| C72-04 | Acceptance requires a fresh exact user message | embedded I ACCEPT is accepted |
| C72-05 | Original owner supplies introduction | Host reconstruction passes validator |
| C72-06 | First read-only overread distinguished from continued access | first LIST_TREE always HARD |
| C72-07 | Generator contract and prompt agree on preaccept scope | TREE metadata allowed in contract |
| C72-08 | Portable and pinned prompt remain within 8k | either output >8k chars or bytes |
| C72-09 | No writer, no authority elevation or auto SOURCE_LOCK repin | receipt claims provider attestation |
| C72-10 | Global Host tool exclusivity remains unproven | local test declared product-ready |

Local tests include 10,000 denied requests and the original source-bound C72
acceptance and introduction APIs. These are deterministic engineering tests,
not independent ChatGPT UX or human-origin tests. `PRODUCT_NO_GO` remains.
