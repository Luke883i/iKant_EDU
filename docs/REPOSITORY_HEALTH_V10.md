# V10 - Minimal maintainability DoD for iKant_EDU

The goal is a repository that can be understood, changed, tested and restored. A target
of seven root directories is not a maintenance requirement. This source snapshot has
15 roots; do not relocate original product owners merely to reduce that number.

## Two products; two independent authorities

**PROJECT EDU** is entered through `project/session-chat/PROMPT.txt` and the
original owner chain C72, C135, C87 and C125/S03. A project prompt, Host plan,
source tree, test log or CI status does not itself establish provider delivery.

**MCP STANDALONE** is entered through `plugins/ikant-le-session-chat/` and the
server and plugin manifest. OAuth, transport and deployment remain scoped to MCP;
they cannot become owners or consent signals for Project EDU.

## HEALTH COMMAND

From a clean, complete Git checkout with Node 20+ and Python available for
optional original checks:

    npm run maintain:verify

This runs the six minimal source-maintenance gates (P/I/O/Q/L/R). P verifies
tracked index/HEAD/worktree bytes; I records legacy lexical debt and rejects any
new unresolved literal relative link; O pins original product owners; Q runs
four local smoke commands on the same HEAD; L checks this entrypoint; R requires
the source baseline tree to remain reachable for rollback. The script is read-only
and does not create a new runtime, writer, owner or workflow.

A missing, incomplete or nonzero native smoke must HOLD/FAIL. Never convert a
successful process exit without its required output into product evidence.

## The known debt is visible, not erased

The initial scanner sees 32 unresolved lexical links, mostly source literals in
fixtures, test generators and legacy code. The registry retains their exact
source Git blob SHA. Any new unresolved edge or change to the pinned source
containing an exception fails until deliberately reviewed. Dynamic callsites are
enumerated by the pre-existing `scripts/project-review-callsites.mjs`; whether
their targets can execute is UNKNOWN without runtime and external consumer tests.

The broad `npm test` suite is a distinct and much more expensive check; it is not
replaced by the four smoke commands. Native Project/ChatGPT behavior, independent
MCP deployment, provider responses, CI and external consumers remain UNKNOWN or
NOT_ATTESTED. `PRODUCT_GO=false` no matter how many local source gates pass.

## ROLLBACK / replay

The original verified Git tree is
`4cff62ed12f79390a059784bcbf9770788a3a4d1` (GitHub main
`8cb80d2230919220ac4b7a1cfcd80950d8467848`). The supplied main ZIP has
no original commit ancestry, so the local snapshot commit is synthetic and must
not be called the original main SHA. The V10 Git bundle includes this verified
source tree as an ancestor. Revert V10 commits normally or reconstruct that
source tree in an isolated checkout; never force-update a protected remote.

For a real checkout of main, apply the V10 patch to a fresh branch and re-run
`npm run maintain:verify`, the original broad test suite and CI. Do not promote
local smoke results into external delivery or production readiness.

## Change protocol

1. Read product surfaces, owner contracts and existing source-only audits.
2. Choose a small reversible cut, with explicit consumer risk and a source pin.
3. Require the same HEAD for source readback and native checks; record failures.
4. Revert any cut that breaks known consumers; leave uncertain consumers open.
5. Require separate, independent runtime or owner proof before claiming delivery.
