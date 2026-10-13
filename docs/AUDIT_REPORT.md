# Audit report — Automatic Mood History 1.2.8

Date: 2026-10-13. Baseline: `493f53c`. Branch: `fix/audit-reliability-handoff`.

## Outcome

The baseline functional/layout tests passed but missed asynchronous scope and file-ownership races. This patch fixes verified failures, adds 17 regression cases, improves local scoring throughput without changing results, and repairs release-notes selection. No live notes or provider requests were used. The plugin version remains 1.2.8; this is a review branch, not a new production release.

## Fixed findings

| Priority | Finding and trigger | Change and evidence |
| --- | --- | --- |
| P1 | Folder exclusions or note paths change during awaited reads; previously gathered private text can still reach the provider. | Guard settings around reads, validate original file paths/eligibility, and cancel stale analysis. Baseline regressions reproduced extra reads and a provider invocation. |
| P1 | Turning Groq off during an invalid/length-limited response still permits format/completion retries. | Check consent and the analysis guard before every retry; discard obsolete successful results. Baseline made 3 or 4 requests when only the original request was authorized by current settings. |
| P1 | Entry ownership checked before an await is later followed by unconditional modification. | Use `vault.process` with an ownership check on the current content. A synthetic concurrent replacement now survives. Creation collisions fail without modification. |
| P2 | A change event or active-note command for a date with no eligible sources overwrites saved history with an insufficient record. | Preserve the saved result on zero files, while still writing insufficient results for eligible empty notes. |
| P2 | A repeated separator in an exclusion (`Journal//Private`) misses the actual folder. | Normalize repeated separators before matching; regression verifies the exclusion. |
| P2 | Release body is fixed to 1.2.8 even on future versions. | Derive the notes filename from manifest version and fail if it is missing/empty. Actual future release execution remains untested. |

Background work also checks current automatic-analysis settings when it reaches the queue; model/scope changes and unload cancel obsolete date results without recording misleading provider failures.

## Optimization

`localSentiment` previously compiled and scanned overlapping terms repeatedly across score dimensions and emotion labels. The patch compiles the fixed patterns once and memoizes term counts within one call, retaining no source text afterward.

`node scripts/benchmark-local.js 493f53c` matched complete result objects across 512 seeded synthetic cases. On local Windows/Node 24.19.0, seven alternating rounds of 40 analyses at 60,000 characters yielded median 229ms baseline and 172ms updated, about 1.33x throughput (25% less elapsed time). Runtime noise and the synthetic corpus limit generalization; the benchmark is reproducible and does not assert a brittle timing threshold.

## Remaining findings / planned work

| Priority | Evidence in source | Required next work |
| --- | --- | --- |
| P1 | `analyzeDateNow` writes entry Markdown before plugin JSON; JSON failure rolls back only memory. | Crash/failure recovery across both artifacts, with fault-injection tests; preserve user edits during recovery. |
| P1 | `analyzeAllNow` executes final support-file/save work after an unload break; connection checks bypass the date queue. | Complete lifecycle cancellation and serialize shared provider state. |
| P1 | `onload` merges arbitrary saved shapes; `outputFolder` assumes a string; `resolveEntryPath` only checks a prefix. Invalid include rules are silently discarded. | Validate storage shapes and vault-relative paths, surface invalid rules without widening consent, test corrupt/synced data. |
| P2 | Skip logic compares only `contentHash` and date basis; local topic/model/prompt semantics are not included. | Define and persist an analysis fingerprint with explicit provider-cost/reanalysis behavior. |
| P2 | Full-vault enumeration per date and repeated folder normalization; periodic reconciliation rereads everything. | Introduce a bounded per-scan date index, then measure before considering long-lived text caches. |
| P2 | Legacy and current groups use the same date key. | Design a versioned coexistence migration; never silently replace historical sources. |
| P2 investigation | Provider summary/drivers/confidence become Markdown strings; limits differ by field. | Test native link/embed behavior and enforce safe serialization/size limits as warranted. No exploit or native data exposure is claimed here. |
| P3 | Value-based guards do not detect away-and-back settings mutations; cancellations are not clearly reported in manual-run notices. | Consider monotonic analysis epochs and an explicit skipped/cancelled status. |

## Verification and boundaries

- Baseline: `npm ci`, `npm test`, privacy audit, and full existing Playwright matrix passed.
- Seven newly added initial cases failed against baseline, then passed after fixes.
- Updated: `npm test` including 17 new cases passed; full `npm run test:layout` passed.
- `npm run audit:release` passed; `npm audit --json` reported zero known vulnerabilities.
- `git diff --check` passed. Benchmark parity passed.
- GitHub CI status and PR publication are recorded in `PROGRESS.md`.
- Native Obsidian, cloud filesystem behavior, real provider behavior/quota, future release publication, and personal extensions remain outside this verification. Already-sent requests cannot be recalled after opt-out.

## Recommended next action

Review this patch as a bounded reliability change, then execute `SOL_6_1_PLAN.md` in order. Do not equate a passing synthetic suite with a release-ready native installation.
