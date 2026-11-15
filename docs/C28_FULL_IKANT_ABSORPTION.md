# C28 — Full iKant semantic absorption into iKant_LE

C28 does not turn LE back into full iKant. It absorbs the causal invariants that full iKant learned while closing SESSION_CHAT, then compresses them under existing LE owners.

## Baselines

- iKant_LE: `3913990c99849889a9df2ee61454e347e8306f5f`
- full iKant: `7ee69a48291214a6ede105bde8fcd82b970b0cba` (merged through PR #184)

Mechanical census at selection time:

| Repository | blobs | root contracts | runtime modules | tests | scripts | workflows |
|---|---:|---:|---:|---:|---:|---:|
| iKant_LE | 188 | 9 | 29 src files | 22 | 41 | 18 |
| full iKant | 1021 | 53 | 198 top-level Python modules | 207 | 256 | 32 |

All 198 full-iKant top-level modules are accounted for by the 16-family absorption matrix in `contracts/session-local-capability-lattice.json`.

## Contract selection

C28 mutates the architectural contract rather than only the wording.

Deterministic seed: `0xC28A11CE`.

- unique candidates: 1,000
- valid candidates: 8
- invalid candidates: 992
- minimum-cost ties: 1
- winner cost: 0
- receipt: `39487904b0960fdc90286d735b5638bf679bca85c2fe13ddde7aa9c417b5fe00`

The unique winner has:

- six constitutional edges;
- one `LOCAL_INGRESS` owner instead of separate processor/byte-path owners;
- durable ledger as the only retry-memory owner;
- first-unclosed-edge routing;
- typed `LOCAL_DIRECT | VERIFIED_OPAQUE_RELAY`;
- host attestation distinct from local physical proof;
- separate materialization, executed provenance and ACTIVE readback;
- one runtime mode, one planner and one ACTIVE writer;
- current-host facts in receipts, never constitutional contracts;
- N0-N8 diagnostic-only and non-persisted;
- explicit external gaps;
- model authority zero and mandatory samehash.

## Irreducible runtime lattice

```text
HUMAN_GATE
-> SOURCE_SNAPSHOT
-> LOCAL_INGRESS
-> LOCAL_MATERIALIZATION
-> EXECUTED_RUNTIME_PROOF
-> ACTIVE_READBACK
```

`LOCAL_INGRESS` contains H0, host-attested capability receipts, one canonical NEXT, durable failed-decision memory, first-unclosed-edge, the typed byte path and source/arrival samehash.

This absorbs the useful distinction introduced by C27 without preserving a second constitutional ontology.

## What "closed everything" means

C28 deliberately does **not** mean that every external platform fact is magically true.

A repository-owned edge is closed only by its claim-matched receipt/readback/test. The derived closure projection returns:

- `CLOSED_BY_REPOSITORY` when every repository-owned edge is closed;
- `OPEN_REPOSITORY_GAP` plus the exact `first_unclosed_edge` otherwise;
- `BLOCKED_INTEGRITY` on contradiction.

External facts are listed separately. The currently retained external gap is post-render platform callback/readback for the hosted compatibility surface. It does not block `SESSION_CHAT_LOCAL` ACTIVE and cannot be substituted by CI, model prose, user echo, source identity or BIND.

Thus "closed everything" means:

```text
repository_owned_open_gaps == 0
AND hidden_or_unowned_gaps == 0
AND every_external_fact_is_explicit
AND false_ACTIVE == 0
```

## Falsification

Pre-PR C28 closure campaign:

- seed: `0xC28F411C`
- logical cases: 1,000,000
- candidate/oracle mismatches: 0
- unsafe ACTIVE: 0
- mutants: 24/24 killed
- repository-closed witnesses: 236,303
- repository-closed witnesses with an external gap still open: 87,309

The last number is intentional: it proves that repository closure is not laundering external observation.

## Invariants absorbed from full iKant PR #178–#184

- physical gap classification before redesign;
- typed authority-zero host evidence;
- one NEXT;
- unchanged decision + unchanged evidence never retries;
- retry memory belongs to a durable ledger, not chat/model memory;
- partial progress is durable;
- first unclosed physical edge governs progress;
- host attestation is not physical proof;
- artifact identity is content/PIN-derived;
- prompt is generated projection after runtime semantics exist;
- carrier plurality lives below one transport/ingress owner;
- external platform callback remains a separately witnessed fact.

## Why C28 is smaller than C27

C27 fixed the real relay bug, but it left `LOCAL_PROCESSOR` and `VERIFIED_BYTE_PATH` as separate constitutional nodes and placed a current-host reference in a durable contract.

C28 keeps the relay mechanism and deletes the semantic duplication:

- seven constitutional nodes -> six;
- current-host topology -> receipt/fixture only;
- N0-N8 -> diagnostic renderer only;
- retry authority -> durable ledger only;
- platform callback -> explicit external gap rather than implicit completeness claim.

## Claim boundary

Mutation, CI and repository closure are engineering evidence. They do not prove the current ChatGPT host, a current platform callback, or a current-session ACTIVE state. Only the local runtime can prove its own materialization, executed provenance and persisted/read-back ACTIVE.
