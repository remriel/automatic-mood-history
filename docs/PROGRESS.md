# Automatic Mood History — execution state

Current objective: publish the verified 1.5.0 performance release. The user will test the journal backlog themselves; do not start/resume live analysis.

Progress: 90% [##################--] toward verified publication and delivery.

- [x] Implement compact evidence, low GPT-OSS reasoning, normally one request and at most one correction per chunk.
- [x] Add bounded quota-aware workers, token reservations, server-pause enforcement and bounded nonsensitive telemetry.
- [x] Retain validated pending chunks by exact fingerprint migration; preserve settings, source scope, existing results, cancellation and recoverable storage.
- [x] Drain productive Resume pending batches without artificial gaps and add Stop analysis.
- [x] Benchmark against 1.4.1: synthetic 10-chunk batch 65.03s to 4.92s (92.4% reduction); small-entry median 5.60s to 1.27s (77.3%).
- [x] Pass all 57 score constraints across 54 synthetic regression evaluations, zero unsupported scores and no HTTP 429; retain initial failures transparently.
- [x] Run full functional/syntax, responsive layout and privacy suites; finalize release notes/README/changelog and continuity documents.
- [ ] Commit/push performance branch, create/attach PR and require final-head green CI.
- [ ] Merge the checked head; verify main CI, automatic 1.5.0 release, downloaded runtime digests and official source-bound attestations.
- [ ] Deliver verified runtime package and both current continuity files; preserve private data/settings and leave journal testing to the user.

Implementation: src/groq-runtime.js and src/main.js; scripts/build.js bundles the runtime. Prompt compact-evidence-prompt-v6, engine/text pipeline unchanged. Maximum five concurrent requests subject to quota, maximum two provider calls per chunk. Existing per-batch character limit and provider pauses remain. Serial durable commits; one checkpoint per result. Whole-chunk review is an explicit model acknowledgment, expanded to internal passage outcomes with exact evidence validation.

Verification: npm test, npm run test:layout, npm run audit:release and git diff --check passed before final publication. Dashboard request estimate/copy now reflects two calls; the measured analysis runtime is unchanged. Original full measured source/bundle hashes and a separate exact analysis-runtime fingerprint are retained in the reports. CI will rerun all suites on the final commit. Native private backlog has not been verified with 1.5.0 and is not claimed complete.

Publication baseline: released/installed 1.4.1, main 14098ed08b9eccc63fe351376cea59a7649de25e, PR #6, main CI 38952971283 and release 38952971308 successful, asset digests and source-bound provenance verified. Performance branch: perf/compact-groq-analysis. 1.5.0 is not yet claimed published here.

Private state: earlier backup contains 198 source hashes plus runtime/data/generated history. Latest automatic/startup settings were both off; user changed chart preferences during work, so never restore old settings. Native 1.4.1 user-started scan was canceled with its normal epoch guard and checkpoints preserved. No provider calls through the filesystem fallback. Keep private paths, notes, credentials, raw provider bodies and screenshots outside Git.

Blockers: none. Pending remote journal work is now user testing, not a publication prerequisite.

Exact ordered next steps:
1. Run the final local gates after dashboard-copy and documentation changes.
2. Commit/push the branch; create and attach the PR; check CI on that exact head.
3. Merge with a checked-head lease and wait for main/release workflow success.
4. Download the published three runtime assets; verify version, digests and official source-bound provenance.
5. Deliver the release link, installable package, PROJECT_STATE.md and PROGRESS.md. Do not start journal analysis.
