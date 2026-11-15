# C57 — Scope-safe host binding

C57 keeps the valid finding from the original PR #66 but removes its reference-app coupling.

The repository-internal `for_ai_agent_first_entrypoint` is a repository symbol, not evidence that a same-named host tool exists. The reference SESSION_CHAT app currently exposes `ikant_le_open` to the model and keeps acceptance/turns app-only, but that implementation detail is only a witness that satisfies the abstract binding rule; it is not the universal identity of local-host activation.

C57 adds four authority-zero host-adapter closures and no runtime owner:

1. **iKant task scope fence** — bootstrap/runtime stop, blocker and retry semantics apply only to the iKant-owned task. Host audit, repository engineering and artifact work do not inherit an iKant stop merely because they occur in the same chat.
2. **callable host binding attestation** — an iKant task can use only a binding physically observed or validly attested as callable in the current host. Repository symbols, tool names, docs, tests and app presence are not callability proof.
3. **causal continuation fence** — a consumed directive/observation remains bound to the same session, source, edge and causal epoch. Stale or cross-epoch callbacks cannot reopen an edge or become changed-evidence retry authority.
4. **scoped NO_SUBSTITUTE** — failure of the iKant route forbids impersonating iKant; it does not embargo independent host work.

Existing owners remain unchanged: C40/C41 own retry/NEXT semantics, the existing runtime route owns runtime turns, and C54/session-shell own iKant presentation. C57 does not create a global task planner, second ledger, second runtime route or second presentation owner.

The prompt stays host-neutral: it does not name `ikant_le_open`. Integration tests verify instead that the current reference app is one concrete implementation of the abstract callable-binding contract.
