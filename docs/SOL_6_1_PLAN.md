# Sol 6.1 execution plan

## Mission and starting point

Continue the Automatic Mood History audit on top of `fix/audit-reliability-handoff`, based on public release 1.2.8 (`493f53c`). Keep this a local-first, privacy-preserving Obsidian plugin. The audit already repaired scope/consent races, atomic entry ownership checks, empty-scope preservation, separator normalization, release-note selection, and local lexicon hot paths. Do not reimplement those changes.

Work alone: no subagents unless the user explicitly authorizes them. The user-provided AGENTS instructions require durable `docs/PROJECT_STATE.md` and current `docs/PROGRESS.md`. Do not touch a personal installed plugin or its data as part of repository work. The public and private builds may contain different features.

## 0. Establish the actual starting state

1. Read applicable AGENTS instructions, `PROJECT_STATE.md`, `PROGRESS.md`, and `AUDIT_REPORT.md`.
2. Inspect `git status`, `git diff`, the PR, and CI. Use the audit branch or its merged successor; preserve unrelated work.
3. Run `npm ci`, `npm test`, `npm run test:layout`, and `npm run audit:release` once. Investigate any mismatch before implementation.
4. Keep source edits in `src/`; regenerate tracked `main.js` with `npm run build`.

Acceptance: identify exact base SHA, clean/dirty state, and trustworthy baseline in the progress file.

## 1. P1 — recover consistent record/entry state after storage failures

Files: `src/main.js` (`analyzeDateNow`, `savePluginData`, `clearDatePending`, `writeEntryNote`), `tests/automatic-recovery.test.js`, new focused storage tests.

Problem: entry Markdown is committed before `saveData`. A JSON failure restores the previous in-memory record but leaves the new Markdown behind. Date-basis promotion also mutates the previous object before saving. Two independent artifacts cannot be made atomic by swapping write order alone.

Implementation:

1. Add fault-injection reproductions for failure before/after note write, before/after JSON save, and restart at each boundary.
2. Design a small versioned durable pending-write record or equivalent recoverable protocol. Specify the authoritative committed record and how interrupted work resumes idempotently.
3. Serialize shared JSON writes or otherwise prove older snapshots cannot overwrite newer settings/runtime state.
4. Preserve ownership checks and never undo a user's concurrent note edits. Keep old valid results visible until a replacement is durable.
5. Avoid sending notes to Groq again merely to recover an already obtained valid result, if safe persisted result recovery can do the job.

Acceptance: failure/restart at every write boundary converges to consistent state, preserves user content, does not suppress necessary retries with an unsaved hash, and does not duplicate provider requests unnecessarily. Existing provider-only and legacy tests still pass.

## 2. P1 — finish lifecycle and shared-provider cancellation

Files: `src/main.js` (`onload`, `analyzeDate`, `analyzeAllNow`, `checkGroqConnection`, `analyzeWithGroq`, automatic timers), lifecycle/provider tests.

Implementation:

1. Reproduce unload during layout-ready, source reads, provider responses, entry writes, scan finalization, and sample checks using deferred promises.
2. Stop scheduling/starting writes after unload. Account for writes already dispatched; do not claim abortability the Obsidian API lacks.
3. Put sample connection checks behind the same provider coordination boundary as date requests; ensure sample success cannot erase a newer rate-limit pause.
4. Carry one cancellation/epoch policy across settings changes, automatic opt-out, model changes, scope changes, and unload, including away-and-back changes.
5. Preserve separate startup-only and continuous automatic modes. Add cancellation counts/notices for manual scans so skipped work is not presented as a successful complete run.

Acceptance: no newly dispatched provider calls or writes after cancellation, no stuck queue/scan flags, no deadlocks, no stale provider status overwrites, and explicit tests for startup-only preferences.

## 3. P1 — validate persisted settings and paths without widening access

Files: `src/main.js` (`onload`, folder normalization, `outputFolder`, `resolveEntryPath`, settings handlers), settings/path tests.

Implementation:

1. Validate top-level objects, record shapes, pending date metadata, boolean settings, numeric bounds, and chart visibility arrays.
2. Define a canonical vault-relative output-path validator; reject traversal/dot segments, malformed paths, and unsafe empty output roots. Revalidate stored entry paths before writes.
3. Do not silently convert invalid include input into an unrestricted empty allowlist. Preserve the last valid effective scope or disable analysis with an actionable validation message.
4. Make setting-save failure behavior explicit and conservative. Never re-enable remote consent because rollback is convenient; keep the most restrictive effective consent until resolved.
5. Cover Windows separators, repeated separators, root rules, corrupt JSON shapes, and sync-loaded legacy data.

Acceptance: malformed storage does not crash plugin registration, no write can escape the allowed output directory, invalid scope input cannot widen reads, and API keys remain environment-only.

## 4. P2 — define analysis cache invalidation

Files: gathering/hash and skip logic in `src/main.js`, core/legacy tests, README.

Implementation:

1. Introduce an explicit analysis fingerprint that includes relevant source hash, analyzer/scorer version, model/prompt version where applicable, thresholds, and local topic semantics.
2. Decide and document whether changing model or prompt marks records stale for the next authorized scan or requires explicit reanalysis. Do not automatically generate unexpected remote spending.
3. Migrate old records conservatively without inventing provenance or discarding valid historical results.
4. Verify that unchanged equivalent inputs avoid redundant requests while changed semantics can be intentionally reanalyzed.

Acceptance: model/scorer/topic/threshold changes have documented, tested behavior; legacy records and manual-only defaults remain intact.

## 5. P2 — optimize whole-vault discovery with measured evidence

Files: `getAllDates`, `filesForDate`, `getAnalysisTargets`, `gatherDate`, automatic reconciliation; synthetic benchmark script.

Implementation:

1. Measure scans with synthetic 1,000/10,000-note datasets across many dates. Record enumeration count, read count, and elapsed time separately from provider time.
2. Build one per-scan date-to-files index and normalize folder rules once per scope generation. Keep individual active-note analysis correct outside a scan.
3. Recheck eligibility immediately before reads and requests so a cached index never bypasses the new cancellation guards. Invalidate/rebuild on relevant scope changes and test renames/deletes during scans.
4. Bound memory and keep text out of long-lived caches. Only consider incremental content caching after the simpler index improvement is measured.

Acceptance: full-vault discovery becomes approximately O(notes + dates) instead of O(notes x dates), retains exact source sets, and passes all privacy/cancellation tests. Report measured before/after results without claiming network-latency improvements.

## 6. P2 — resolve history identity and untrusted Markdown questions

These are two separate changes and should be separate reviewable commits/PRs.

A. Legacy/current date coexistence: create collision fixtures, define versioned record identities and migration, preserve original source paths, entry paths, date labels, and dashboard links. Require reversible migration/recovery evidence before changing storage identity.

B. Provider narrative serialization: inspect summary/drivers/confidence output with synthetic Markdown links, remote images, embeds, HTML, multiline list content, and very large strings in native Obsidian. Bound strings and render as safe text where the intended product behavior is plain narrative. Do not label this a confirmed exploit without native evidence. Also review image-only Markdown/frontmatter edge cases and the mismatch between prompt-aware reasoning and the intentionally simple local lexicon.

Acceptance: historical groups coexist without data loss; provider text cannot introduce unintended active content under the documented rendering policy; valid narratives remain readable.

## 7. Verify, publish a reviewable result, and prepare release separately

1. Run `npm test`, `npm run test:layout`, `npm run audit:release`, `npm audit`, and `git diff --check` after meaningful changes; add targeted fault/scale tests from each phase.
2. Verify native Obsidian with a disposable synthetic vault: fresh install, upgrade, narrow/dark panes, filter changes while running, ownership collision, cloud-read simulation, reload, pending recovery, and all chart controls.
3. If a live provider check is part of the authorized follow-up, use fictional sample text only and record model/API behavior without saving secrets or response bodies from real notes.
4. Update durable state and current progress with exact test evidence, limitations, SHA, and next steps. Push completed work and open/update the corresponding PR; wait for required CI.
5. For a separately chosen release milestone, update manifest/package/lockfile/versions/changelog and add matching versioned release notes together. Verify release workflow, assets, hashes, and source-bound attestations. Do not install over a private personalized build without its separate integration requirements.

Acceptance: reviewable GitHub changes with passing CI and truthful native/provider evidence boundaries; no fabricated release or installation claims.

## Suggested prompt to give Sol 6.1

> Continue https://github.com/remriel/automatic-mood-history from the audit PR/branch `fix/audit-reliability-handoff`. Read the repository instructions and docs/PROJECT_STATE.md, docs/PROGRESS.md, docs/AUDIT_REPORT.md, and docs/SOL_6_1_PLAN.md, then reconcile them with Git and tests. Do not use subagents. Carry out the plan in order, beginning with failure-safe persistence, complete lifecycle cancellation, and fail-closed settings/path validation. Preserve provider opt-in, saved history, legacy source routing, and private installed extensions. Use synthetic fixtures, maintain the two continuity documents, and synchronize completed repository work to GitHub with passing CI. Treat native installation and production release as distinct milestones and accurately report what has actually been verified.
