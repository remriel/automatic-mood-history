# Automatic Mood History — execution state

Current objective: deliver a verified 1.5.1 recovery update for dates left partially assessed by invalid Groq output. Do not run private journal analysis.

Progress: 85% [#################---] toward a published, user-testable 1.5.1 release.

- [x] Reconcile repository, 1.5.0 release and CI with stale handoff text.
- [x] Fix unique spacing/typography quote recovery, trimmed offsets, post-normalization score checks and invalid-output classification.
- [x] Show safe per-chunk validation codes on the dashboard; preserve completed chunks and provider quota pauses.
- [x] Respect reported daily request count for three workers and remove quadratic passage lookup.
- [x] Add focused regressions, bump to 1.5.1, update release notes and collect new live synthetic evidence.
- [x] Pass local npm test, browser layout, release audit and diff checks.
- [ ] Push branch, open a PR, require final-head green CI and merge/release if verified.
- [ ] Verify published 1.5.1 assets and source-bound attestations; deliver runtime and continuity files.

Findings: the reported 18/19 and 9/10 lines each leave one chunk pending with reason output. This can mean malformed or incomplete JSON, unmatched quote, conflicting score/evidence, or an output cap. The line alone does not show the exact code, and this checkout has no matching private runtime. The new dashboard displays safe codes. A concrete bug allowed quotes with surrounding spaces to pass initial validation, then disappear during normalization; a supported score could be cached without its anchor. Unique whitespace/quote typography repair and the post-normalization check address that path. The exact private failure remains unverified.

Verification: npm test, npm run test:layout, npm run audit:release and git diff --check pass. Live synthetic Groq report docs/GROQ_VALIDATION_1.5.1.json: 54/54 successful evaluations, 55/57 required scores passed, zero unsupported scores, no HTTP 429; the second-person and temporal mood constraints each missed once in three repetitions. Every required constraint passed in at least two of three repeats. Current 10-chunk worker run: 4.20s, ten calls, peak concurrency five, no 429; reused 1.4.1 baseline: 65.03s. These are regression inputs, not private journal or clinical validation.

Current implementation: source and bundled main.js updated on branch fix/output-recovery-diagnostics. Version metadata is 1.5.1. Existing saved chunks retain their v6 fingerprint because the provider prompt/schema did not change. No private source, credentials or provider bodies are in Git.

Blockers: no local implementation blocker. GitHub publication and private-date retry remain outstanding.

Exact ordered next steps:
1. Commit/push the branch and create the PR.
2. Require green CI on the exact PR head, then merge and verify main/release workflows.
3. Verify 1.5.1 asset digests and source-bound attestation; package the three runtime assets.
4. Give the user the release and these two files. Ask the user to retry the two dates; inspect only safe codes if one remains pending. Do not start the private analysis here.
