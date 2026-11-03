# PR215 · Workflow epoch audit — Host candidate

This is an engineering candidate, not original owner or provider evidence.

## Observed pre-change
PR #215 at 63684a612cfd8fa55987419fb98f4bdc901b0cab: 59 GitHub Actions runs, 50 failing and 9 succeeding. Most failures share npm test/check and pre-rename source identity discrepancies, not 50 independent defects. Fix the C42 hardcoded LE repository and C59 generated ROM document. Do not edit the ikant-le schema family merely because it contains LE.

## Retired workflow runners
c21-local-session-fastboot.yml was a noisy PR-writing diagnostic duplicate: ci.yml still executes npm test, c25-executor-data-plane.yml still includes falsify:c21 in qualify:canonical. c98-project-3md.yml and c98-phase2-source-exact.yml are covered by c98-host-bound-prepr.yml across tests, scripts and path triggers. c107-one-carrier-release.yml was a write-permission publisher to frozen historical prepr/v8; new automated releases must use a separately reviewed release procedure. c107-carrier-consumption.yml continues to verify the unchanged carrier digest and consumer.

The original 87-path retention baseline is retained in contracts/v1-workflow-retention.json. Explicit superseded_workflows entries document each exception; tests fail on any missing workflow without such a mapping, or absent successor/test path. Historical source and tests remain in Git.

## Preserve and repair
Keep C72 admission/physical staging, C135/C87/C125/S03 boundaries, C42/C43/C58/C59, C63, V5B, source integrity, OneShell and original negative coverage. Current pre-rename tests requiring NOT_READY_FOR_RENAME are historical fixtures, not a current MAIN_POST acceptance condition. Separate native runtime/provider proof and human H95 remain UNKNOWN. Two independent V5-G engineering reviews plus a human decision required before merge.
