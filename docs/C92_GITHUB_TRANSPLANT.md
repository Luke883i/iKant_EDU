# C92 — GitHub transplant and qualification boundary

Source: C92 local pre-PR package, originally produced against `main@5fa8a7adb82e3a18cf0cde2a4c3202ddd93a388c` (PR #96 merged).
This remote PR is a fresh five-commit semantic Git ancestry **parented to that actual GitHub main**, not the disconnected local pre-PR bundle history.

The source blobs in `host/`, `scripts/`, `tests/`, `contracts/`, `docs/` and the qualification artifacts are byte-exact transplants from the local package. The package's root `README.md` and `BASE_LOCK.json` are deliberately excluded: they describe a local-only pre-PR and must not overwrite the repository's maintained README or misrepresent live ancestry.

Local reproducibility on Node.js 22: `node --test tests/c92-boundary.test.mjs` => **9/9 pass**; `node scripts/c92-falsify.mjs 100000` => **100000 cases, 25 structural mutation classes, 0 unexpected accepts**. Historical initial campaign: 2000 unexpected accepts out of 25000 before hardening. The test evidence is **not** an actual remote-provider result, independent semantic entailment, C90/C91 positive integration, native chat delivery, full C29 conformance or C72 H95.

**OPEN FIRST EDGE:** `REAL_PROVIDER_CONFIGURATION_MISSING` (no authorized provider credentials in the witnessed local environment; DNS connectivity was not demonstrated). Do not promote fixture-mode checks into `C92_EXPERIMENTAL_OWNER_ACCEPTED_SURFACE_A_STAGED_NOT_NATIVE_DELIVERED`. To qualify the complete real chain, externally provision real provider credentials, execute a real frozen-source same-input C90/C91 dispatch plus two HTTPS model calls, verify separate reviewer and Node checker receipts, and reopen the byte-identical experimental Surface A.

Authority: zero. No ACTIVE/canonical DOCX/persistence or native-delivery claims. Draft PR; no automatic merge.
