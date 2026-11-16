# C105 NERVA — host-local nervous system (authority=0)

**NERVA** = **Nervatura Esecutiva di Raccordo Verificabile per Adattatori**.
It is an optional, explicitly installed **host adapter control plane**, **not** the iKant owner, an AI model, a new ledger writer, an automatic ChatGPT Project hook or a background daemon. It reuses C99, C104, C77, C101, C102, C87 and C103; it cannot grant permissions, provenance, native events, consciousness or persistent cognitive state.

## Human and machine language (NERVA/1)

| Command | Simple meaning | Existing operation | Effects |
|---|---|---|---|
| `GET STATE` | "A che punto siamo?" | `inspectC104` | Read only |
| `GET MISSING` | "Quali pezzi mancano?" | `inspectC104` | Read only |
| `GET NEXT` | "Qual è il prossimo lotto?" | `inspectC104` | Read only |
| `GET LEDGER` | "Cosa è stato verificato sul disco?" | `inspectC102Ledger` / C87 | Read only |
| `PUT BLOB` | "Verifica e salva questo oggetto sorgente" | `stageC104` | Exclusive write + reopen |
| `RUN TURN` | "Usa il vero iKant locale per questa domanda" | C99 plan, C104-C77 qualify, C102-C87 execute and reopen, C103 check | Real local runtime and observation append |

Syntax is **exact uppercase ASCII**, no punctuation, aliases, SQL expressions, pipe, shell command, arbitrary evaluation or interpolation. JSON holds typed source bytes/input; the user's arbitrary question is never parsed as a command. A sentence like `GET STATE; DELETE` is rejected, not split into actions. No unbounded interpretation of natural-language commands is made by Node.

### Frame / physical adapter

An authorized host chooses any carrier, builds its own exact source graph, and launches **Node >=20** from the repository checkout. After C72 admission / EXPERIMENTAL selection and distinct opt-in, it writes a private config with:
- `context`: sourceHead, original C72 selection, exact C104 source spec and SHA, absolute private cacheRoot.
- `ledgerFile`: absolute `.ikant-host/c102-soft-observations.jsonl`.
- `capsuleDir`: absolute C77-qualified local capsule; `manifestSha256`: original builder digest.

Run:

```sh
node scripts/c105-nerva-cli.mjs --config /ABS/config.json --ndjson
```

Input frames: `{"command":"GET NEXT"}`, or `{"command":"PUT BLOB","filePath":"README.md","contentBase64":"...","carrierId":"REAL_HOST_PORT"}`, or `{"command":"RUN TURN","nonce":"unique-host-nonce-001","request":{"sourceHead":"...","selection":{...},"humanInput":"...","optIn":true}}`.

**A GitHub result in an LLM tool response is not yet materialized source in Node.** The actual host must transfer bytes, observe write/readback, and independently verify the called process. No attempted chat 'autoinstall' is implied. If the source graph is incomplete, NERVA returns the exact next path batch; it never invents a 100% state. A cache at 100% still requires original C77 qualification and the per-input C102/C87/C103 path. A C103 structural PASS is not host provenance.

### DoD

- [x] Closed exact NERVA/1 lexicon wired to existing runtime owners, no new owner/writer.
- [x] C104 source status from real file readback, not model narration.
- [x] C77 actually invoked for the same current input **before** C102.
- [x] C102 physically invokes original C101 and C87; C87 reopened; C103 structural qualification.
- [x] Typed STOP for replay, opt-in absence, ledger tamper, invalid command, source incompleteness.
- [x] 1,000 synthetic command-language scenarios with measured reject/accept outcome and 0 syntax escapes (not human study).
- [ ] Actual host-installed ChatGPT native per-turn callback: **outside repository control, requires independent field evidence**.
- [ ] Actual host-native authenticated event/source provenance/delivery: **NOT_ATTESTED**.
- [ ] Conversational quality and downstream usefulness: requires real independent human testing.

Real local readback alone qualifies only **host-local evidence**, never canonical Surface A, C84 strict activation, E4 native delivery or ChatGPT persistent cognitive memory. The Project Markdown guides cannot register a callback or modify chat platform settings. Never repin a running chat's frozen SOURCE_HEAD because this implementation was merged later.
