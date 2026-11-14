# Project state — settings UI width and daily export restoration (2026-11-13)

Version 1.8.1 expands the settings tab to the full available modal pane width, preventing narrow constrained columns on wide displays. Folder allow/exclude textareas span the full card width as responsive stacked editors. Switching output back to Daily notes exports daily entry notes for saved records. Underscore title separators are treated as date token boundaries to detect ambiguous multi-date filenames.

## RESUME HERE

Preparing 1.8.1 release. Manifest, package.json, versions.json, changelog, and release notes updated. All test suites pass.

---

# Project state — compact history and import dates (2026-11-13)

Version 1.8.0 candidate builds on 1.7.8. `entryOutput` selects daily (compatibility default), monthly, or none. JSON remains authoritative; pending writes retain their original mode. Monthly exports contain readable entries and lossless recovery blocks, preserve distinct date-basis identities, and reject manual edits using atomic full-document/hash checks. Daily detail cards expose evidence and original source links without requiring daily files. Bases remains daily-only. Existing entries are never removed by the plugin.

`detectFilenameDate` recognizes numeric dates independently of Moment, duplicate suffixes, dates in titles, common written-month formats and configured Daily Notes formats. `numericDateOrder` resolves only competing interpretations of one numeric token; multiple distinct dates remain ambiguous. Scope exclusions still win. Changing date convention invalidates in-flight source groups. Existing history is retained and regrouping requires analysis, not copying mixed scores.

Relevant code: `src/main.js` (mode-aware persistence, exporter, parser, settings and dashboard), `src/sentiment-core.js` (`buildMonthlyMarkdown`), `tests/compact-history.test.js`, `tests/import-dates.test.js`, layout fixture/tests, and `docs/PERSISTENCE_PROTOCOL.md`.

Constraints: no automatic restore UI for monthly recovery blocks; no cross-device transactional merge; hidden plugin data sync must be verified separately. Unrecognized filenames still use creation timestamps; body/frontmatter dates and arbitrary languages are not inferred. Private migration reports, vault data and backups must remain outside this public repository. Preserve orphaned/edited daily notes separately when archiving a real vault.

## RESUME HERE

Version 1.8.0 is published from merge 9a29437ff8be6c5c00e121404c0627df8d407eb3. PR CI 43534712452, main CI 43535412471 and release workflow 43535412561 passed. All four release assets (`main.js`, `manifest.json`, `styles.css`, `moodring-model.bin`) were verified: git object hashes match byte-for-byte with published assets, and the offline Moodring model passed validation tests. Reload and test in native Obsidian if desired; native app interaction remains unverified. The prior 1.7.8 state below is historical.

---

# Project state — range-relative averages and emotion colors (2026-11-13)

Trend averages use one fifth of the selected calendar span, rounded to days with a two-day minimum. Custom ranges use their inclusive boundaries; All uses the full recorded span. Missing scores are excluded and two observations are required. Emotion composition uses stable label-based colors, with deterministic fallback for other labels. Chart surfaces and legend were refined. Source is src/main.js; build output is main.js; styles are in styles.css.

## RESUME HERE

Version 1.7.8 is published from merge 861c30f00e03c02fd1410373e318ed29a5e73b47. The composition chart applies matching inline colors to legend and SVG segments to resist theme overrides; regression tests compare computed colors and verify stability across reranking. PR CI 43533163455, main CI 43533197803 and release workflow 43533197782 passed. All four release asset digests match GitHub; installed plugin files match the published assets byte-for-byte. Reload and visually inspect in native Obsidian if desired; native interaction remains unverified. The prior 1.7.7 state below is historical.

---

# Project state — range-aware summaries (2026-11-11)

Automatic Mood History is a local-first Obsidian plugin for desktop and mobile. `src/main.js` owns dashboard rendering; `scripts/build.js` bundles it with the analysis modules into tracked `main.js`; `styles.css` supplies the dashboard styling. The public repository must never contain private vault records or credentials.

## 1.7.3 range-aware summaries (published)

- Explicit user follow-up: make the summary averages reflect the selected trend range and publish 1.7.3.
- Implementation behavior: the Days scored tile follows the selected range too; history remains unfiltered. Treat the Days scored tile behavior as an implementation extension of the explicit average request.
- Version [1.7.3](https://github.com/remriel/automatic-mood-history/releases/tag/1.7.3) is published from PR #17 merge `73245bdfa2a0ba5bf83dadb84efb72fa3ca0fa61`. Main CI [43092864719](https://github.com/remriel/automatic-mood-history/actions/runs/43092864719) and release workflow [43092864700](https://github.com/remriel/automatic-mood-history/actions/runs/43092864700) passed; local build/check and desktop/mobile layouts also passed.
- 1.7.2 installation observation: the version changed to 1.7.2 during a pre-replacement check, without a change made by this task. Its files matched the official 1.7.2 assets at that check. Do not infer who performed the update.
- Relevant files: src/main.js, main.js, tests/layout.test.js, tests/mobile-layout.test.js, manifest.json, package.json, package-lock.json, versions.json, README.md, CHANGELOG.md, and docs/RELEASE_NOTES_1.7.3.md.

## RESUME HERE

The installed Remy plugin is on 1.7.3. Its manifest and stylesheet match the release assets byte-for-byte; its bundle matches with the existing `/* nosourcemap */` suffix. All release asset SHA-256 values matched GitHub. No vault file was modified by the installation check, and `data.json` and mood entries were not read. Native Obsidian interaction remains unverified.

---

## 1.7.2 chart-window update (published; previous release)

- Explicit user request: add 7-, 14-, and 60-day trend windows, default to 14 days, and publish 1.7.2.
- Inherited chart design: preserve the existing 30-day, 90-day, 365-day, and all-history choices; fixed windows remain inclusive through the latest scored date. Version 1.7.3 makes summary cards follow these ranges too.
- [Version 1.7.2](https://github.com/remriel/automatic-mood-history/releases/tag/1.7.2) is published from PR #16 merge `d6565cf9d2c07cebfb8eb6079b44ab2c6bac22fc`, with four release assets. PR CI 43090961133, main CI 43091108921, and release workflow 43091109134 passed. Local desktop/mobile layout checks passed, including mobile layout after the 45px touch-target fix. Minimum supported Obsidian version remains 1.5.0.
- Relevant files: src/main.js, main.js, tests/layout.test.js, tests/mobile-layout.test.js, manifest.json, package.json, package-lock.json, versions.json, README.md, CHANGELOG.md, and docs/RELEASE_NOTES_1.7.2.md.

---

## 1.7.1 chart changes (published)

- Four aligned SVG plots use solid, separately labeled traces and matching legend swatches. The controls precede the chart, remain keyboard/touch accessible, and retain saved visibility.
- Recorded scores retain calendar spacing. An explicit missing metric value breaks that metric's path; a span between recorded dates is still a connection, not an estimate for days without records. All valid points remain present; their radius shrinks in dense plots.
- A guide and emphasized point identify the selected date; each lane displays the selected score. The slider/readout, date windows and saved-series behavior remain unchanged. Distinct labels and separate lanes avoid relying on color alone.
- Relevant files: `renderTrendChart` in `src/main.js`, the generated `main.js`, `styles.css`, `tests/layout.test.js`, `tests/mobile-layout.test.js`, and `docs/RELEASE_NOTES_1.7.1.md`.
- Functional, mobile runtime, privacy, desktop layout, Android Chromium/iPhone WebKit emulation and Moodring model checks passed in [PR CI](https://github.com/remriel/automatic-mood-history/actions/runs/42982248734), [main CI](https://github.com/remriel/automatic-mood-history/actions/runs/42982845268), and the [release workflow](https://github.com/remriel/automatic-mood-history/actions/runs/42982845506). A narrow synthetic browser preview was also inspected. Native Obsidian and physical devices remain unverified.
- This Windows sandbox denied Node child-process creation, so the full local Playwright runner and Node-based release audit could not run; CI ran them successfully. Release workflow attestation succeeded, but local `gh attestation verify` could not initialize a Sigstore verifier, so independent cryptographic verification was not established.

## 1.7.1 resume point (historical)

Version [1.7.1](https://github.com/remriel/automatic-mood-history/releases/tag/1.7.1) is published from merge/tag `fdb536a6536a01abb642ab4a48727d0f36c6842b`. All four assets were downloaded; `main.js`, `manifest.json`, and `styles.css` matched the corresponding Git blobs, and the optional Moodring model passed its validator. Next, inspect the released plugin in an isolated Obsidian test vault and on physical phones; use real user feedback to assess gap interpretation and whether a combined comparison mode is desirable.

---

# Previous project state (2026-11-04)

Automatic Mood History is an Obsidian plugin for desktop and mobile. `src/main.js` owns dashboard rendering, lifecycle, records, and settings; `src/sentiment-core.js` and `src/moodring-core.js` implement analysis; `scripts/build.js` creates the tracked `main.js`. `styles.css` supplies the dashboard styling. Tests use synthetic records only.

## Trend chart decisions

- Version 1.7.0 uses four separately labeled, aligned plots with shared time positions and a new average-intensity summary card. Hiding a series collapses its plot; the readout still shows all scores.
- Version 1.7.0 plots creation-date complete records with actual calendar spacing. Lines join recorded points and are not estimates for missing days. Legacy and insufficient-evidence records remain excluded as before.
- Time windows are inclusive rolling 30, 90, and 365 calendar days ending at the latest scored date, plus all history. They only filter the chart; summary cards and history are unchanged. Window and selected day are transient; series visibility remains saved.
- The chart and slider select the nearest recorded date and show all scores. Series use distinct colors and line patterns; legend buttons preserve existing persistence and save-failure rollback. Slider, labels, readout and controls support keyboard, touch, resizing and light/dark layouts.
- Relevant code: `renderTrendChart`, `installChartSeriesControls`, `updateChartSeriesVisibility` in `src/main.js`; CSS at the end of `styles.css`; `tests/layout.test.js` and `tests/mobile-layout.test.js`.
- Avoid treating connected lines as estimates, filtering the underlying records, or using private vaults for QA. Physical devices and native Obsidian were not tested for this change.

## 1.7.0 resume point (historical)

Version 1.7.0 is published at https://github.com/remriel/automatic-mood-history/releases/tag/1.7.0 from merge commit `6ea69593aabfd56ed4b13af2bb5e4673bc6cf831`. Release and main CI passed; the three plugin assets match source blobs and main.js provenance verified. Read `docs/PROGRESS.md`, inspect Git and current release/CI before continuing. The release workflow is triggered by a `manifest.json` change on main, runs tests, trains the optional Moodring model, attests and publishes four assets. Next, verify native Obsidian and physical devices with a test vault.

---

## Historical project state (stale; preserved for context)

# Automatic Mood History — project state

## Active follow-up (2026-10-13)

Release candidate follows audit/follow-up head `26c7777dce67be52206bf1176d5ab7f7323a627c`; public main is still 1.2.8 until PR #1 merges. Candidate version 1.2.9 is prepared separately with release notes/changelog. All native tests use the isolated `work/native-qa/profile` and synthetic vault; no installed personal plugin is touched.

- `runtime.pendingWrites`: version 1 prepared analysis results. JSON is committed authority; persist preparation, apply entry with content-hash comparison, commit record and clear retry/journal in one serialized save. See `PERSISTENCE_PROTOCOL.md`. Recovery needs no provider call once preparation survives restart. Edited owned notes receive a separate recovered entry; user edits remain intact.
- `storageQueue` captures detached snapshots at dispatch and publishes record commits inside the queue. Previous record objects are never mutated before saving. Obsidian APIs provide neither cross-file transactions nor abort/fsync guarantees; rejected writes may already have completed and replay is idempotent.
- `analysisEpoch` tracks analysis-relevant settings through a Proxy. Guards capture both epoch and values, including queued work. Startup-only background authorization is explicit (`startup: true`); continuous events/recovery require `autoAnalyze`. Sample checks share `analysisQueue`, preserving newer pauses. Cancellation counts are included in manual scan results.
- Storage validation accepts boolean opt-ins only as actual true, bounds numbers, checks date/record/pending metadata and visibility arrays. Invalid loaded folder settings block analysis with a visible message; invalid UI edits retain the prior effective scope. Settings-save errors pause analysis and retain restrictive consent in memory. Unreadable plugin JSON is never overwritten with defaults.
- `vaultPath`/`assertOutputPath` confine output writes, reject absolute/traversal/configuration/trash paths, normalize Windows/repeated separators, and recheck prepared/stored entry paths. Output folder is now repairable in settings.
- Added focused `storage-recovery`, `lifecycle-cancellation`, and `settings-validation` tests plus shared `reliability-fixture`. Six restart boundaries, edited-note recovery, save serialization, unload at six await boundaries, away-and-back settings, queued sample rate limiting, startup-only authorization, corrupt settings and path confinement pass.

RESUME HERE: PR #1 contains P1 persistence/lifecycle/settings, fingerprint/index, additive history identity and safe narrative serialization. Its latest CI run 38487327796 passed. Candidate 1.2.9 version/note/changelog are being prepared; run release checks, push, verify CI, merge PR #1, and wait for the version-triggered release workflow. Read current PROGRESS for exact release status.

Fingerprint/discovery follow-up: results include analysisFingerprint v1 with source hash, date basis, text/scorer/prompt/model versions, thresholds and local topic. Changed local semantics refresh on the next scan; unchanged remote semantics require an explicit force command. Old records without fingerprints retain provenance and skip unchanged sources. Per-scan indexing stores file references/paths, never text; guards recheck paths, file identity, eligibility and stat metadata around reads/requests. Scope rules cache only normalized paths and invalidate with the settings epoch. Synthetic three-round medians against e01f1ed: 1,000 notes/100 dates, 101 -> 1 enumerations, 162 -> 45ms; 10,000 notes/365 dates, 366 -> 1 enumerations, 6,016 -> 797ms. Reads remain 1,000/10,000 respectively, with exact source/hash parity. This measures discovery/gathering, not network time.

History schema 2 is additive: existing date keys remain; second-basis collisions use created:<date> or legacy:<date>. recordKey routes scans, active commands, pending writes and retries; ownership checks include date basis. No legacy record is promoted or replaced by a current group. Original paths/labels/links are retained; rollback uses a saved pre-upgrade JSON snapshot while archiving schema 2 additions. See HISTORY_IDENTITY.md and history-identity.test.js for collision interruption/restart and rollback evidence. Version 1 cannot losslessly represent collisions; do not downgrade and analyze schema 2 data.

## Current architecture

Audit date: 2026-10-13. Public repository: https://github.com/remriel/automatic-mood-history.
Audit baseline was `493f53c` (release 1.2.8). The follow-up candidate versions the completed reliability changes as 1.2.9. No release claim is final until the GitHub release workflow and assets are verified.

- Desktop Obsidian CommonJS plugin; `scripts/build.js` bundles `src/sentiment-core.js` and `src/main.js` into tracked `main.js` without a production dependency bundler.
- `src/main.js`: lifecycle, settings, source discovery, serialized per-date analysis, optional Groq calls, pending-date recovery, generated Markdown, and dashboard.
- `src/sentiment-core.js`: frontmatter/text cleanup, deduplication, SHA-256, deterministic English lexicon scoring, provider normalization, and Markdown serialization.
- Notes group by local calendar date of `TFile.stat.ctime`. Folder names, filenames, aliases, and frontmatter dates do not define the date. Include/exclude folder rules shipped in 1.2.8; exclusions win, `/` means root-level notes. Output and trash folders always stay excluded.
- Schema 2 history identity uses date basis plus date, retaining legacy source paths and separating same-date creation-date groups. Legacy recovery never scores a partial source set. See `HISTORY_IDENTITY.md`.
- Groq is disabled by default. Manual-only operation is the default. Only `GROQ_API_KEY` is read from the process environment; never save it. Groq-enabled analysis is provider-only, preserving saved results on errors. Local scoring is available when Groq is disabled.
- Strict structured output falls back to JSON object mode and plain JSON. Completion exhaustion gets one larger retry. Invalid output does not become a neutral score. Provider error bodies are never persisted.
- Date operations share `analysisQueue`. Pending dates keep safe categories and backoff in plugin data; automatic recovery polls every minute with five-minute reconciliation.
- Generated notes carry ownership fields. Conflicting unowned paths select a suffix. Dashboard migration changes only an exact embed in an owned dashboard using `vault.process`.
- Charts show four series with saved visibility, accessible toggle state, narrow-pane container layout, and observer cleanup.

## Decisions and rationale

1. Treat settings/scope changes during asynchronous work as cancellation, not provider failure. `analysisGuard` captures analysis-relevant settings; `gatherFiles` guards reads and retains a transient validator of original paths and eligibility. `analyzeWithGroq` checks before each request/retry and `analyzeDateNow` checks before accepting a result. Already dispatched requests cannot be recalled.
2. Preserve saved history when a date has no eligible files. This matches full scans, which do not discover that date. A still-eligible note with empty text continues to yield `insufficient`.
3. Recheck entry ownership inside `vault.process` immediately before replacing text. A conflicting create fails safely. Keep failures retryable rather than overwrite user content.
4. Collapse repeated separators in folder rules so `Journal//Private` cannot accidentally miss `Journal/Private`.
5. Precompile fixed lexicon expressions and count each distinct term once per local analysis. Cache only fixed regexes globally; do not retain note text or per-note counts. Preserve existing scores and emotion ordering.
6. Resolve release notes from the manifest version and verify the file is nonempty in the release workflow. Native install and provider account tests stay separate.

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

## 1.2.9 audit resume point (historical)

Read this file, `docs/PROGRESS.md`, `docs/AUDIT_REPORT.md`, and `docs/SOL_6_1_PLAN.md`, then inspect Git status/diff and the actual code. The audit fixes are on `fix/audit-reliability-handoff`; do not redo them. Start the follow-up with persistence recovery, lifecycle completion, and settings/path validation as ordered in the Sol 6.1 plan. Preserve existing records, provider consent, legacy routing, and private installed extensions. Merge/release/native-install status must be verified from GitHub and the progress file; do not infer publication from the unchanged manifest version.

Audit publication: PR #1 is open at https://github.com/remriel/automatic-mood-history/pull/1. Final implementation commit 74e251c833447ee842d94d0f3d924da9ff913989 passed GitHub CI run 38485124172 (Node 20 functional/privacy/layout). Later completion edits are documentation-only. No merge, new release, or native installation has occurred.


## Automatic filename date detection ? in progress

- Worktree `feat/automatic-date-detection` is based on upstream 1.7.3. The earlier 1.2.8 checkout has a pre-existing modified bundle; do not overwrite it.
- Morning Pages 0.5.4 uses strict Moment parsing of the configured Daily Notes format plus 12 preset filename formats and skips dates with multiple interpretations. Mood History now uses the same presets, examines basenames at any included folder depth, and falls back to creation timestamps for undated names. Folder exclusions, output/trash exclusions, and legacy record handling remain in place.
- IMPORTANT: Existing creation-date records can remain stale or be recalculated with a partial source set after regrouping. The existing `created-at-local-date` basis and entry identity cannot accurately describe this change. Design and test an explicit non-destructive migration, including rename/deletion and old-date records, before installing or publishing. Never silently delete user records. Installed personal 1.7.3 bundle has private extensions and must not be replaced by the public build.
- `tests/timestamp-grouping.test.js` includes synthetic preset, ambiguity, custom Daily Notes format and fallback tests. `npm test`, `npm run test:mobile`, and `npm run audit:release` passed. No native installation or actual-vault migration was attempted.

## RESUME HERE ? date detection

Review the current diff, then implement a safe, explicit migration and correct record provenance/display. Update all user-facing descriptions, test collisions, missing sources, rename/delete and restart recovery. Integrate into the personal installed plugin without overwriting its private extensions or data, validate in a separate test vault, and synchronize the finished work to GitHub. The requested AI Brain paths were unavailable in this session.
`n## Prerelease decision`nPublish 1.7.4-beta.1 for separate-vault testing only. Release workflow now marks hyphenated versions as prereleases. Preserve migration blocker; do not promote this build to stable.
`nRESUME HERE: 1.7.4-beta.1 is published with three plugin assets at tag commit 5e24cec. Stable readiness remains blocked by historical migration; installation was not performed.


## Stable date migration ? 1.7.4
The migration blocker is resolved additively. New groups use detected-note-date and detected: collision keys; old created-at-local-date records and generated Markdown remain intact. partitionHistory excludes previous grouping and changed source membership from current charts and exposes them in a collapsed history section. Pending historical writes recover under their original identity; historical retry requests are retired on load. No old scores are copied to new dates. New test date-migration.test.js covers split/collision, failures, restart, rename/delete/exclusions and chart membership. Existing suites were updated to exercise current scope. Local functional/mobile/privacy and desktop/mobile browser layout checks passed. User will test native Obsidian; no installation performed.

RESUME HERE: publish and verify stable 1.7.4. Earlier prerelease blocker sections are historical.


## RESUME HERE ? 1.7.4 complete
Stable 1.7.4 is published and latest, from PR #18 merge 5e6603aa7dc7ae4f9080654d3d1b1c05d1b184ee. Main CI 43514868611 and Release 43514868482 succeeded. Four release asset digests match downloads; source text for three plugin files matches after line-ending normalization. main.js release-workflow attestation verification exited 0. User elected to test native Obsidian; installed personal plugin/data were not changed. Publication is complete. Earlier incomplete migration and prerelease notes are historical.


## Custom trend range ? 1.7.5
renderTrendChart includes Custom, a date form, inclusive string-date filtering and explicit empty state. Custom ranges update the same summary callback as presets. Invalid/reversed dates retain the applied selection. Presets hide the form and restore their own window. Selection remains transient, like existing presets; no new saved settings or records. styles.css wraps touch-sized date controls. tests/layout.test.js covers inclusive bounds, invalid input, empty results and preset restoration.
RESUME HERE: finish release checks, merge and verify 1.7.5 publication.


RESUME HERE ? custom range complete: stable 1.7.5 is published/latest from PR #19 merge 19c090ad00c745e63263642ed1abca2aadf5168f. CI 43521121047 and Release 43521121003 succeeded. Four downloaded assets match published SHA-256 digests, three plugin files match normalized source, and main.js release-workflow attestation verified with exit 0. No publication work remains. Custom selection remains transient and user will test native Obsidian.


## 1.7.6 range emotions/composition
Summary callback now disposes/clears/rebuilds an emotion host for selected records. Common Emotions counts match the range. renderEmotionComposition shows top eight labels + an independent Other symbol, uses unique labels per record and normalized percentages within adaptive calendar bins (at most 16). Empty bins remain blank; accessible Period details provide counts/percentages. Shares describe recorded labels, not intensity. Its resize observer lives in chartObservers and is disposed on range switch/refresh/unload. RESUME HERE: finish checks and publish 1.7.6.


RESUME HERE ? 1.7.6 complete: range-filtered Common Emotions and Composition over time published at https://github.com/remriel/automatic-mood-history/releases/tag/1.7.6. Source merge 4d8df335d62959b33626a2c029ff86bbc6e00c40 (PR #20). CI 43525218693 and Release 43525218747 passed. Four asset digests/source parity and main.js attestation verified. Native testing remains with user. No reanalysis is needed for this display-only update.


## Composition top seven ? 1.7.7 in progress

- `renderEmotionComposition` ranks the seven most common distinct-per-record labels across the selected range; remaining labels are excluded from the graph and its per-period denominator. A period containing none of the selected labels stays blank and says ?No top-seven emotions recorded.? Ties are sorted by label as before.
- There is no synthetic catch-all category. Chart legend, bars, titles and Period details use the actual displayed labels only. The explanation makes the denominator explicit.
- `tests/layout.test.js` exercises more than seven labels, the exclusion/denominator, blank periods, custom-range reranking and record preservation. The full functional, mobile runtime, desktop/mobile layout and privacy checks passed.
- Shared AI Brain was unavailable at both configured paths in this session. Do not replace the personal installed bundle and its private extensions with the public bundle.

## RESUME HERE ? top seven

Finish layout checks and review the diff, then publish and verify stable 1.7.7. This is a display-only change and requires no reanalysis.


## 1.7.7 moving average and top-seven update in progress

- `trailingMovingAverage` computes each series from available scores in the current and previous six calendar days within the displayed range. It ignores missing scores and emits a point only on scored dates with at least two scores in the window. A sliding window keeps calculation linear in records.
- `renderTrendChart` draws toggleable dashed average paths and hollow diamond path markers. Marker paths use a separate class from raw score circles; existing chart interactions and raw-score counts remain intact. The readout includes the selected date's average. Defaults to on; range and toggle selections are transient.
- Composition displays only the top seven emotions within the selected range. Period percentages use only those displayed labels; periods containing none are blank and identified in details. Existing records and the personal installed bundle are untouched.
- Regression tests cover inclusive date boundaries, null values, custom range boundaries, one-score windows, toggle/series hiding, date readout, top-seven ranking and no mutation. Functional/mobile runtime and desktop/mobile layout checks pass; the privacy audit also passes.

## RESUME HERE ? 1.7.7 combined update

Finish mobile verification, review and publish the release at the user's explicit request, then verify CI and asset hashes. No reanalysis is necessary. The shared AI Brain vault was unavailable at both configured paths.


## RESUME HERE ? 1.7.7 complete
Stable 1.7.7 is published/latest: https://github.com/remriel/automatic-mood-history/releases/tag/1.7.7, source PR #21 merge 1e6a94ea446630acbf2c61a781219634c8a8c970. CI 43528117906 and Release 43528117968 passed. Four downloaded assets match GitHub digests, three plugin source files match after line-ending normalization, and main.js release-workflow attestation verified. Top-seven composition and toggleable seven-day moving averages require no reanalysis. User will test native Obsidian. AI Brain vault was unavailable. No publication work remains.
