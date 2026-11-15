# C81 supplemental patch: runtime-only projector + UI device

## Findings from the attached UX-SHELL/1.0
- Three compulsory panels visually compete with a single Surface A.
- 50–200-word limit can silently alter a genuine C78/C79 output digest.
- "native UI" can be misread as a sticky overlay installable via Markdown.
- A source-consistent shape-valid C79 packet can be forged by the model; no self-SHA is native event provenance.
- A README or UI file is not an executable ingress interceptor: Projects alone cannot make every native user event dispatch.
- Pre-accept terms and mode-choice messages cannot be outputs of the not-yet-running cognitive runtime. These are explicit host-owned protocol gates.

## Minimum executable integration in PR #90
- Add `host/c81-runtime-projection.mjs`: accepts C81 Git reachability readback and a C79 same-input voice packet (downstream of actual C78 child Node execution) and returns **only** the runtime's exact text. Any missing condition yields `runtime_computed_answer:null` with a typed failure; no model-authored iKant fallback.
- Add `iKant_UI_shell.md`: minimal declarative *device*, one compact header at the beginning of each assistant reply, and exact Surface A only. Metadata and proven artifacts remain outside its text. It is not a persistent native overlay.
- Add `docs/C81_PROJECT_RUNTIME_PROJECTOR.txt`: first-contact Terms gate, single I ACCEPT, later mode, per-message real Node routing, no unverified answers, actual host-tools-only semantics.
- Add `tests/c81-runtime-projection-100k.test.mjs` + workflow: one actual C77/C78/C79 Node turn followed by 100,000 actual calls to the runtime projection gate over the exact 10^5 Cartesian design vectors, class counts and counterexamples, Node 20/22. This is **not 100,000 browser sessions or 100,000 Node child launches**.
- Preserve existing C81 Git proof, C80 signed field witness, C59 owner and canonical shell untouched.

## Design domain, five axes, ten choices each
SOURCE_READBACK x RUNTIME_PACKET x CURRENT_INPUT x UI_PLACEMENT x FALLBACK_POLICY. The only allowed combination under the stated hard safety constraints is [0,0,0,0,0]; it is a constrained optimum **within this predefined grid**, not a scientific estimate of host reliability or an exhaustive search of every possible prompt. Report executed calls, 1 eligible, 99,999 denied, actual novelty tail; never invent saturation thresholds.

## Hard DoD
- Actual C78 child process launches C70/C71/C73 and produces the real C79 packet.
- 100,000 deterministic distinct combinations are executed by Node; no unapproved combination is rendered as iKant; no false ACTIVE, persistence or host delivery.
- Unmodified C81 Git proofs and C80 field evaluations; Node 20/22, npm check and root verification green.
- Real-host acceptance separate: authenticated pinned main event, C77 bytes physically transferred, real CURRENT native user event identified, C78 executed *for each* actual message, C81 Surface A shown in normal ChatGPT response and witnessed. A genuine floating persistent native UI would require a real installed UI app; a Project Markdown cannot supply one.

## C81-7 runtime authorship negative control
A cryptographically self-consistent C79 packet may carry the C71 `HOST_CANDIDATE_BOUNDED` source. That means host-supplied/model-composed prose rather than the C70 repository-generated fallback/guard. The projection gate therefore rejects it even when every hash matches; the 100k grid contains that adversarial class and an explicit recomputed-checksum regression. This is a *runtime text authorship* check, not a native host execution signature.
