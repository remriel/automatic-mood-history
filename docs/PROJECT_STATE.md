# Automatic Mood History — project state

## Current baseline and architecture

Audit date: 2026-10-13. Public repository: https://github.com/remriel/automatic-mood-history.
The audited main baseline is `493f53c` (release 1.2.8). Earlier handoff documents stopped at 1.2.7 and were stale. Manifest and package remain 1.2.8; these audit changes do not publish a new release.

- Desktop Obsidian CommonJS plugin; `scripts/build.js` bundles `src/sentiment-core.js` and `src/main.js` into tracked `main.js` without a production dependency bundler.
- `src/main.js`: lifecycle, settings, source discovery, serialized per-date analysis, optional Groq calls, pending-date recovery, generated Markdown, and dashboard.
- `src/sentiment-core.js`: frontmatter/text cleanup, deduplication, SHA-256, deterministic English lexicon scoring, provider normalization, and Markdown serialization.
- Notes group by local calendar date of `TFile.stat.ctime`. Folder names, filenames, aliases, and frontmatter dates do not define the date. Include/exclude folder rules shipped in 1.2.8; exclusions win, `/` means root-level notes. Output and trash folders always stay excluded.
- `records` is keyed only by date. Legacy records retain saved source paths and `legacy-note-date`; current records use `created-at-local-date`. Legacy recovery never scores a partial source set.
- Groq is disabled by default. Manual-only operation is the default. Only `GROQ_API_KEY` is read from the process environment; never save it. Groq-enabled analysis is provider-only, preserving saved results on errors. Local scoring is available when Groq is disabled.
- Strict structured output falls back to JSON object mode and plain JSON. Completion exhaustion gets one larger retry. Invalid output does not become a neutral score. Provider error bodies are never persisted.
- Date operations share `analysisQueue`. Pending dates keep safe categories and backoff in plugin data; automatic recovery polls every minute with five-minute reconciliation.
- Generated notes carry ownership fields. Conflicting unowned paths select a suffix. Dashboard migration changes only an exact embed in an owned dashboard using `vault.process`.
- Charts show four series with saved visibility, accessible toggle state, narrow-pane container layout, and observer cleanup.

## Decisions and rationale from this audit

1. Treat settings/scope changes during asynchronous work as cancellation, not provider failure. `analysisGuard` captures analysis-relevant settings; `gatherFiles` guards reads and retains a transient validator of original paths and eligibility. `analyzeWithGroq` checks before each request/retry and `analyzeDateNow` checks before accepting a result. Already dispatched requests cannot be recalled.
2. Preserve saved history when a date has no eligible files. This matches full scans, which do not discover that date. A still-eligible note with empty text continues to yield `insufficient`.
3. Recheck entry ownership inside `vault.process` immediately before replacing text. A conflicting create fails safely. Keep failures retryable rather than overwrite user content.
4. Collapse repeated separators in folder rules so `Journal//Private` cannot accidentally miss `Journal/Private`.
5. Precompile fixed lexicon expressions and count each distinct term once per local analysis. Cache only fixed regexes globally; do not retain note text or per-note counts. Preserve existing scores and emotion ordering.
6. Resolve release notes from the manifest version and verify the file is nonempty before release. No version bump, tag, merge, or personal-vault installation is part of this audit.

## Important constraints / failed approaches not to repeat

- Never delegate to subagents unless explicitly requested. Use synthetic fixtures only.
- The public plugin and a previously described personal installed plugin intentionally differ. Never overwrite private installed extensions or plugin data using this public bundle without a separate integration task.
- Do not copy surrounding workspaces, vault notes, generated history, credentials, private paths, or native screenshots into this public repository.
- Do not restore provider fallbacks in Groq-enabled mode, editable environment-variable names, or automatic opt-in defaults.
- Groq strict schemas previously rejected `uniqueItems`; GPT-OSS requests use low reasoning and omit unsupported `reasoning_format`.
- Preserve source-read isolation: one unreadable note blocks its whole date, not other dates. Never score a partial legacy set.
- Do not solve layout overflow by hiding content or fixed chart minimum widths. Use actual pane bounds, 200% text, and long-content checks.
- Startup folder existence must account for adapter/index races. `ensureFolder` accepts a creation race only after confirming a folder exists.
- Mocked browser tests are not native Obsidian tests. No live Groq calls or private-vault inspection were performed in this audit.

## Relevant files and verification

- `tests/audit-regressions.test.js`: 17 cases covering exclusion normalization, read/request cancellation, rename races, background opt-out, empty-date preservation, empty-note behavior, ownership races, successful writes, and create collisions. Seven initial cases failed against baseline before fixes.
- Existing tests cover lifecycle, timestamp grouping, folder scope, provider retries, legacy recovery, pending dates, and dashboard migration.
- `tests/layout.test.js` and `tests/layout-fixture.js`: bundled renderer and CSS under Playwright, light/dark 240–1440px panes, large text, 365 days, controls, links, and cleanup.
- `scripts/benchmark-local.js`: seeded 512-sample exact parity against Git baseline plus seven alternating timing rounds. Local Node 24.19.0 result: median 229ms -> 172ms for 40 analyses of 60,000 characters (1.33x throughput). This is a microbenchmark, not whole-vault performance.
- `scripts/audit-release.js`: repository privacy checks. `npm audit` reported zero known dependency vulnerabilities in this audit; this is not a security certification.
- `.github/workflows/ci.yml`: Node 20 functional, privacy, and browser checks. `.github/workflows/release.yml`: same checks, version matching, asset attestation, release publication.
- `docs/AUDIT_REPORT.md`: findings, residual risks, evidence boundaries.
- `docs/SOL_6_1_PLAN.md`: ordered implementation tasks with acceptance criteria.

## Known remaining issues and architectural questions

- Record JSON and generated Markdown are separate writes; a failed `saveData` can leave a newer Markdown entry than the rolled-back in-memory record. Ownership safety is improved; cross-file transactionality is not solved.
- Unchanged-source skipping does not fingerprint model/scorer/prompt settings or the local topic field. Decide explicit reanalysis semantics before adding cache invalidation that may spend provider quota.
- `getAllDates` and per-date `filesForDate` repeatedly enumerate the full vault; normalized folder rules also repeat per file. Large-vault discovery is O(notes x dates), and reconciliation rereads unchanged source text.
- Lifecycle cleanup is incomplete: `analyzeAllNow` still prepares/saves support files after a loop stopped by unload. Sample connection checks do not share the complete date-analysis guard/queue.
- Persisted settings/record shapes and output/entry paths lack comprehensive validation. Invalid include rules with dot segments are dropped; a wholly invalid allowlist may become an unrestricted empty allowlist. Needs fail-closed UX/schema design.
- Raw provider narrative strings become Markdown; assess links/embeds, size bounds, and safe text serialization with native Obsidian behavior before defining impact.
- Legacy/current groups with the same date compete for one record key. Existing legacy-source priority must be preserved until an explicit migration is designed.
- Value snapshots cannot detect settings that change away and back between awaits. An epoch counter across all mutation paths is a future hardening option.

## RESUME HERE

Read this file, `docs/PROGRESS.md`, `docs/AUDIT_REPORT.md`, and `docs/SOL_6_1_PLAN.md`, then inspect Git status/diff and the actual code. The audit fixes are on `fix/audit-reliability-handoff`; do not redo them. Start the follow-up with persistence recovery, lifecycle completion, and settings/path validation as ordered in the Sol 6.1 plan. Preserve existing records, provider consent, legacy routing, and private installed extensions. Merge/release/native-install status must be verified from GitHub and the progress file; do not infer publication from the unchanged manifest version.

Audit publication: PR #1 is open at https://github.com/remriel/automatic-mood-history/pull/1. Final implementation commit 74e251c833447ee842d94d0f3d924da9ff913989 passed GitHub CI run 38485124172 (Node 20 functional/privacy/layout). Later completion edits are documentation-only. No merge, new release, or native installation has occurred.
