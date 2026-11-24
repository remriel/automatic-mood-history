# Current state — 2.1.1 explorer padding reduction and UI polish (2026-11-24)

Owner: the primary agent; no subagents. After `2.1.0` was published, the user requested reducing padding in "Explore a recorded day", polishing the UI, and publishing a release.

`styles.css` tightens `.auto-mood-explorer` outer padding (`24px` → `14px 16px`, `16px` → `12px` under `30rem`), header bottom margin (`28px` → `14px`) and gap (`20px` → `14px`), readout card padding (`10px` → `8px 10px`, `min-height: 73px` → `60px`, `gap: 8px` → `4px`), and emotions bar spacing (`margin: 14px auto 0` → `10px auto 0`, `padding: 10px 12px` → `8px 10px`). It also scales `.auto-mood-explorer-header h4` to `clamp(1.05rem, 2.2cqi, 1.45rem)`, aligns the left accent bar to `7px`, softens subtitle color to `#e8e7dc`, and adds a subtle hover state on `.auto-mood-explorer-picker` while keeping `min-height: 48px` (so the inner `<select>` keeps a `44px` touch target inside its `2px` border) and `gap: 10px` on `.auto-mood-day-readout`.

## RESUME HERE

`2.1.1` is verified locally (`npm test`, `npm run test:mobile`, `npm run audit:release`, `npm run test:layout`, `npm run test:mobile-layout`). Next: merge to `main` so `.github/workflows/release.yml` publishes tag `2.1.1`.

---

# Current state — 2.1.0 selected-day emotions and compact cards (2026-11-23)

Owner: the primary Codex agent; no subagents. After 2.0.0 was published, the user requested that Explore a Recorded Day show the emotions for the selected day and that its cards be 30% smaller. Desktop is the priority; preserve readable, unclipped text and responsive behavior. The follow-up is targeted as 2.1.0 so the published 2.0.0 tag and assets remain immutable.

`src/main.js` builds the explorer and its `updateReadout` from the selected scored record. The 2.1.0 candidate renders that record's saved emotions in a wrapping section below the five metric cards, with stable chart-matching color swatches, a missing-emotions message, and no stale section in an empty range. The labels are inserted as text and do not change stored data. On a 1440px synthetic desktop pane, cards measured 171×94px versus 245×130px in 2.0.0, approximately 30% narrower and 27% shorter. Narrower panes reflow, with icons hidden only at the tightest five-column widths to protect whole labels. `tests/layout.test.js` covers date and chart selection, missing emotions, empty ranges, range-wide top-ten independence, and unchanged records; `tests/card-layout.test.js` and `tests/card-readability.js` check dimensions and text bounds.

## RESUME HERE

[2.1.0 is published](https://github.com/remriel/automatic-mood-history/releases/tag/2.1.0) at `6569a6fc65acca7a77914d9bbfb6f61a2d286dc4`. GitHub CI 45240947411 and the first release attempt caught `Connection` wrapping in a Linux font; PR #36 fixed the responsive spacing. Its full Linux CI 45241827926 passed, and the merged commit has the identical tree; main CI 45242250891 also passed. At the user's request for speed, the redundant tag-triggered release workflow 45242313274 was canceled before publication and the tested commit's three files were published directly. Downloads match the tag's Git blobs and GitHub SHA-256 digests. Native Obsidian remains untested. No release work remains; update and inspect in the user's desktop theme.

---

# Current state — 2.0.0 summary-card readability (2026-11-23)

Owner: the primary Codex agent; do not use subagents. The user wants polished cards with no cut-off summary text and explicitly requested major release **2.0.0**. Desktop is the priority; mobile is secondary. The 1.9.13 stable release and current `main` are the starting point.

The dashboard is an Obsidian plugin using `src/main.js`, the generated `main.js`, and `styles.css`. The 1.9.13 summary cards forced five columns at every width with only 4px horizontal padding. The 2.0.0 candidate keeps five equal, full-width cards on a wide desktop, adds breathing room, and reflows to balanced three-, two-, or one-column rows using font-relative container thresholds. Recorded-day cards and the date picker also reflow when text grows. The established colorful style, saved data, and scoring remain unchanged. `tests/card-readability.js` measures actual text fragments within card padding and detects words broken across lines; `tests/card-layout.test.js` covers desktop and enlarged text, and `tests/mobile-layout.test.js` checks responsive rows on Chromium and WebKit.

The release workflow runs full tests on a `main` push that changes `manifest.json`, then publishes the tag matching the manifest. Do not push a separate tag while that workflow is creating it. Release requires matching metadata and a release-notes file, followed by workflow and asset verification. Native Obsidian/theme behavior is not yet verified.

## RESUME HERE

[2.0.0 is published](https://github.com/remriel/automatic-mood-history/releases/tag/2.0.0) from merge commit `0226191e1ae624d2b454ce6c4ce6b03876f19102`. GitHub Release run 45238402106 and main CI run 45238401839 passed functional, mobile runtime, privacy, desktop browser, and mobile browser checks. The three downloaded files match both GitHub's SHA-256 digests and the release commit; all three attestation verifications returned success. The redundant PR CI run 45237610903 was still installing browser dependencies at verification time. Native Obsidian and the user's theme remain untested. No release work remains; the user can update the installed plugin and check their normal desktop pane and zoom.

---

# 1.9.10 composition chart

The dashboard ranks up to ten emotion labels from the scored records in the active preset or custom date range. Archived records outside the trend do not contribute to the ranking. A day contributes once per label. Ties use alphabetical order, and each period is normalized by its displayed label count. Gray periods and the text details distinguish the absence of scored records from the absence of displayed labels.

`src/main.js` owns ranking, grouping, and SVG rendering. The same range-local ranking supplies Common Emotions and Composition over time. The fixed color map covers GoEmotions and common earlier labels. Custom labels use a deterministic SHA-256-derived hue, saturation, and lightness so their colors survive changes to the visible set. The previous ten-slot palette reassigned colors when labels entered or left the chart. Labels with closely related meanings can still have similar colors. Exact counts and shares remain available in Period details.

The change applies to saved records at display time and needs no schema migration or reanalysis. Coverage includes presets, custom ranges, live redraws, archive exclusion, normalized percentages, theme overrides, and desktop and mobile layouts.

## RESUME HERE

[1.9.10](https://github.com/remriel/automatic-mood-history/releases/tag/1.9.10) is the latest stable release from commit `6b2bbdb76daa0bf0eeb9565c48f356c71daa7e89`. [CI](https://github.com/remriel/automatic-mood-history/actions/runs/44616465724) and the [release workflow](https://github.com/remriel/automatic-mood-history/actions/runs/44616465428) passed the functional, mobile runtime, privacy, desktop browser, and mobile browser checks. The three downloaded plugin files matched the published SHA-256 digests and Git blobs at the tag. No release work remains. Native Obsidian remains untested.

---

# Verified release 1.9.7

100% complete. Published https://github.com/remriel/automatic-mood-history/releases/tag/1.9.7 and verified SHA-256 digests of main.js, manifest.json and styles.css after installation in Remy. Browser checks passed. Native device responsiveness remains unmeasured. RESUME HERE for the next release.

# 1.9.6 dashboard update

Trend presets use binary search for the date boundary. History reuses a month formatter and avoids a redundant sort. Month counts, dashboard typography and the primary analysis action are easier to scan.

Local functional tests passed. Release verification is recorded in the release workflow.

# Project state — 1.9.5 published (2026-11-17)

The 1.9.5 candidate reduces dashboard DOM creation and repeated filename parsing. `src/main.js` groups the day-by-day history into collapsed month panels and builds day cards only when a panel is opened. Month summaries retain chronological record counts; expanded cards keep the existing details and source links. `detectFilenameDate` caches results in a bounded 20,000-entry map keyed by filename, Daily Notes format, numeric date order, and Moment locale. The fast path skips built-in date-format attempts only for titles with no Unicode numeric characters, preserving localized digits; a configured Daily Notes format is still attempted. Opening an existing dashboard skips `ensureSupportFiles`.

No record scoring or note content changes are intended. Release [1.9.5](https://github.com/remriel/automatic-mood-history/releases/tag/1.9.5) is published from commit `944d14172ace23092a2cd3e383b8564ae1bcd703`. CI [44156399770](https://github.com/remriel/automatic-mood-history/actions/runs/44156399770) and Release [44156401933](https://github.com/remriel/automatic-mood-history/actions/runs/44156401933) passed all required tests and publishing. All three release assets match GitHub's SHA-256 digests and match local generated files after normalizing Windows line endings.

Relevant files: `src/main.js`, generated `main.js`, `styles.css`, layout fixtures in `tests/`, `versions.json`, and `docs/RELEASE_NOTES_1.9.5.md`. The first workflow run failed because an existing layout assertion expected lazily rendered cards while the new month panels were collapsed; the fixture now opens the relevant month panels. The subsequent CI and release workflows passed. Native Obsidian performance remains unmeasured; the user plans to test the release in their vault. No personal vault was changed.

## RESUME HERE (1.9.5)

No release work remains. The user-owned follow-up is to install/reload 1.9.5 in Obsidian and check month expansion, source links, and responsiveness in their vault. Do not present native performance as verified before that check.

---

# Project state ? composition bar spacing (1.9.4)

Composition daily bars use the existing 180-day width rule: 70% of each calendar period, capped at 30 SVG units. Empty and scored periods use the same geometry. Source: `src/main.js`; range and browser coverage: `tests/dashboard-ranges.test.js`, `tests/layout.test.js`. No scoring or saved history changes.

## RESUME HERE

Version 1.9.4 is published at https://github.com/remriel/automatic-mood-history/releases/tag/1.9.4. Release workflow 43969862378 and CI 43969862437 passed; all three downloaded assets match GitHub SHA-256 digests and release commit bytes. Local functional, mobile runtime, desktop/mobile layout and privacy checks also passed. Native Obsidian and the user?s theme remain unverified. No vault changes were made.

---

# Project state — 1.9.3 scope update: fallback, chart, and range (2026-11-15)

The user confirmed that Morning Pages Analytics' bundled word-list matcher is the fallback and requested removal of Moodring. Version 1.9.3 removes the Moodring runtime, model loader, setting, comparison display, build source, CI training, release asset, and dedicated model tests. Existing historical `moodring` record fields are preserved as inert data so removal does not erase past saved metadata; the obsolete `enableMoodring` setting is no longer loaded. Groq scoring and Morning Pages fallback remain separate primary analyzers. The build output no longer contains Moodring code.

The user also requested no gaps between Composition bars at shorter ranges. Daily periods (7–90 days) now use the full calendar slot; weekly and longer-period widths retain their previous geometry. `tests/dashboard-ranges.test.js` checks adjacent columns for every short preset; desktop layout tests verify the rendered width and alignment.

Dashboard settings add a default opening range. `null` means Last used, which reopens the last selected preset or valid custom date interval saved in `runtime.lastDashboardRange`; a numeric preset overrides that choice only when a new dashboard opens. Existing open dashboards keep their selection. New installs fall back to 14 days until a range is chosen. Historical saved scores and source notes are not reanalyzed by these display settings. Relevant code: `src/main.js`, `scripts/build.js`, `tests/dashboard-ranges.test.js`, `tests/settings-validation.test.js`, workflows and README. PR #29 merged as `da4e9e354745fc3e4768f083c40e44a44a983c15`; release [1.9.3 is published](https://github.com/remriel/automatic-mood-history/releases/tag/1.9.3).

## RESUME HERE (1.9.3)

Functional, mobile runtime, privacy, desktop, Android and iPhone layout checks passed. Release workflow 43751524498 succeeded. Downloaded asset hashes match GitHub's digests; the bundle contains Morning Pages fallback code with no Moodring implementation or model. Native installation and live vault recovery remain unverified.

---

# Project state — 1.9.3 recovery and scan candidate (2026-11-15)

The current task addresses Obsidian lag and a recovery backlog after the user reported that scores already existed. Read-only inspection of the installed `Remy/.obsidian/plugins/automatic-mood-history/data.json` found **0 committed records, 927 pending writes and 927 storage retries**. The monthly output folder had **920 parseable recovery records**. Most pending writes already contained Groq results. The 2026-11 monthly export had a valid recovery block but a personal addition; its file hash differed from the last generated hash. The live vault was not changed during diagnosis.

Version 1.9.3 candidate changes `src/main.js` to restore monthly notes before replaying pending writes, write each month once, and save the journal in two batched transactions. An edited monthly note remains untouched; its pending results are published to JSON with `runtime.monthlyExportConflicts` and a dashboard warning. Ordinary scans no longer upgrade complete fallback scores without an existing pending retry or an explicit retry action. Automatic passes attempt at most five provider retries at a time. Each record can store a source metadata revision; unchanged records skip source reads until an event, metadata change, or 24-hour content verification. A scan redraws the dashboard at completion and yields between groups. The existing safety checks for source scope, provider consent, edited exports, and interrupted commits remain.

An in-memory replay of the first observed stored JSON and monthly files recovered **927 committed records, 0 pending writes, 63 provider retry entries, 1 preserved edited monthly export, 2 JSON saves, and 0 provider calls**. While the session continued, Obsidian independently advanced its live file to 927 committed records and 15 pending writes; a fresh in-memory replay cleared those writes to 0, with 928 total records, 63 provider retries, one edited export conflict, two JSON saves, and no provider call. The live file itself was not changed by this work. `tests/recovery-performance.test.js` checks the batched restore, edit protection, unchanged source skipping, daily verification, and five-retry bound. Functional, mobile runtime, release privacy, desktop layout, and Android/iPhone layout suites passed locally. Draft [PR #29](https://github.com/remriel/automatic-mood-history/pull/29) contains the candidate; GitHub CI [43748145896](https://github.com/remriel/automatic-mood-history/actions/runs/43748145896) passed on the code commit `be2a337`.

## RESUME HERE (1.9.3)

PR #29 is mergeable and its code commit passed CI. Review release impact before publishing 1.9.3 or installing it into the personal vault. The installed 1.9.2 bundle and live vault data are unchanged, so the user will need an updated plugin build and restart to observe the fix. The edited November monthly note should be kept; the dashboard will warn that its export needs manual resolution.

---

# Project state — monthly-history recovery, 1.9.2 published (2026-11-15)

Commit `3a9af8b` adds startup and manual restoration from monthly recovery blocks. Plugin JSON remains authoritative. When JSON loads successfully with no records, startup imports valid monthly records before pending-write recovery, output setup, and automatic analysis. The empty dashboard and command palette support manual recovery for partial loss. Restoration adds only missing date-and-basis identities, preserves existing records and monthly Markdown, and makes no provider call. A monthly refresh now rejects a remembered hash if the recovery block still contains records absent from current JSON.

The synthetic regression demonstrated restoration of an open dashboard with missing JSON records. GitHub CI 43737370306 and release run 43737370380 passed functional, mobile runtime, desktop and mobile browser layout, and privacy checks. All four downloaded asset digests, plugin source parity, the offline model, and the main.js attestation were verified. Native Obsidian and real-vault restoration remain untested.

## RESUME HERE (1.9.2)

Update to [1.9.2](https://github.com/remriel/automatic-mood-history/releases/tag/1.9.2) and restart Obsidian. Use the manual restore after sync if history is still missing. For an intentional reset, move monthly exports outside the configured history folder before deleting `data.json` so startup cannot restore them.

---

# Project state — release verification (2026-11-15)

Published 1.9.1: https://github.com/remriel/automatic-mood-history/releases/tag/1.9.1. Release workflow succeeded; all downloaded asset SHA-256 digests and plugin source parity verified.

Full npm test, mobile runtime, release privacy audit, desktop layout and mobile Chromium/WebKit layout suites passed. The privacy audit found no sensitive files or private artifacts.

Implementation: Failed Groq retries preserve unchanged complete saved scores from all analyzers. Changed insufficient-evidence settings trigger reevaluation even with Groq enabled. The remote duplicate wisdom filename cleanup was preserved.

## RESUME HERE

No required release steps remain. Native Obsidian and live Groq calls were not tested; no personal vault was modified. This is a verified fix set, not a guarantee that no undiscovered bugs remain.

---

# Project state — release verification (2026-11-15)

Release candidate 1.9.1 verified locally; publication and remote asset verification remain.

Full npm test, mobile runtime, release privacy audit, desktop layout and mobile Chromium/WebKit layout suites passed. The privacy audit found no sensitive files or private artifacts.

Implementation: Failed Groq retries preserve unchanged complete saved scores from all analyzers. Changed insufficient-evidence settings trigger reevaluation even with Groq enabled. The remote duplicate wisdom filename cleanup was preserved.

## RESUME HERE

Push the reviewed commit, run the existing release workflow, monitor CI, then download and verify every release asset. Do not mark publication complete until verified.

---

# Project state — 1.9.1 candidate (2026-11-14)

The current release candidate is 1.9.1. GitHub confirms that 1.9.0 was published; the later 1.9.0 candidate/prepublication notes below record the earlier handoff state and their publication steps are superseded. The 1.9.1 metadata targets manifest, package, both root lockfile fields, and `versions.json`, with minimum Obsidian version 1.5.0.

This follow-up fixes two recovery cases: failed Groq retries preserve unchanged complete scores from any analyzer, and lowering `minimumCharacters` reevaluates notes previously marked insufficient even when Groq is enabled. The primary/verification agents are still running runtime checks. Native Obsidian behavior and live Groq requests remain unverified.

## RESUME HERE (1.9.1)

Finish runtime verification, reconcile its results with the final diff, then continue with authorized release verification/publication. Release notes and changelog are prepared; do not treat 1.9.1 as verified or published yet.

---

# Project state — 1.9.0 candidate (historical handoff; 2026-11-14)

The repository was at version 1.8.5 before this release commit; metadata now targets 1.9.0 in `manifest.json`, `package.json`, both root version fields in `package-lock.json`, and `versions.json` (minimum Obsidian version remains 1.5.0). The local release commit and both local tags, `v1.9.0` and `1.9.0`, point to HEAD. Nothing has been pushed or published.

This candidate bundles Morning Pages Analytics' built-in English feelings/topics lists and matcher with its MIT license. When Groq is disabled or cannot score new or changed writing, the plugin stores a low-confidence `morning-pages-fallback` result and leaves the Groq retry/backoff state intact. The fallback uses built-in lists only; it does not inherit another plugin's custom lists, reason about negation, quotations, or speaker attribution, and defaults neutral or low when no words match. Existing Groq, `local`, and `local-fallback` scores for unchanged text remain preserved when Groq is disabled or analyzer settings change. Existing Morning Pages fallback and insufficient-evidence records can be recalculated when relevant local scoring settings change. Changed text can receive the current fallback while Groq is paused, and a later permitted retry can replace it with Groq.

Dashboard changes add a 180-day trend window, retain a dashboard's selected preset or applied custom range through redraws, and keep a renderer registered until its Obsidian Component unloads even if its element is temporarily detached. Newly opened dashboards still default to 14 days. Composition creates all periods in the selected date interval and displays neutral gray columns when no top-ten emotion is present; period details distinguish no scored records from scored records with no displayed emotion.

The original task used the word “Grok”; this was interpreted as Groq because Groq is the configured provider in the plugin. No xAI Grok integration was added. See [release notes](RELEASE_NOTES_1.9.0.md).

## Verification and constraints

- `npm run build` passed on the final source and generated `main.js` (306976 bytes).
- `npm test` passed on the final source after `moment@2.31.0` was made available from the local npm cache. A normal dependency install was unavailable offline; Playwright is not installed locally.
- The primary agent reports `npm run test:mobile` passed after updating mobile expectations and Groq-backoff recovery coverage.
- `npm run audit:release` could not execute because the sandbox rejects the script's `spawnSync git` call with `EPERM`. The primary agent's equivalent final staged-file scan passed: 106 files, `sensitiveFiles=[]`, `privateArtifacts=[]`.
- Local `npm run test:layout` cannot start because Playwright is not installed or cached. `/opt/meta-chromium/chrome` exists, but startup exits 13 with `Hatch WebGL domain policy is required for browser startup`. Browser layout, native Obsidian behavior, and a live Groq request remain unverified. Functional tests use synthetic notes and stubbed provider responses.

## Release handoff

The release workflow requires `docs/RELEASE_NOTES_1.9.0.md`; it now exists. The workflow runs for every tag and for a `main` push that changes `manifest.json`, installs Playwright browsers, runs the complete functional/mobile/layout/privacy checks, trains `moodring-model.bin`, and attaches it with `main.js`, `manifest.json`, and `styles.css`.

Obsidian's [release documentation](https://docs.obsidian.md/plugins/releasing/submit-plugin) says the release tag must exactly match the manifest version (`1.9.0`, without a `v` prefix). The release workflow enforces the same exact equality, so a pushed `v1.9.0` tag will run and then fail its version check. Both requested local tags exist at HEAD, but publication should follow the workspace [release steps](../../RELEASE_STEPS.md): first inspect remote branch/tag/release state and confirm targets; then push `main` only, letting the manifest-triggered workflow create the numeric release tag. Do not separately push `1.9.0` because it can race with that workflow, and do not push `v1.9.0`. Monitor the workflow and verify the remote release, release notes, and all four actual assets (`main.js`, `manifest.json`, `styles.css`, and workflow-generated `moodring-model.bin`) by digest and source parity; verify the optional model and attestation before calling publication complete.

## RESUME HERE

Local release commit and both tags (`v1.9.0` and `1.9.0`) are at HEAD. Next, inspect remote `main`, the numeric remote tag, and any existing GitHub release; reconcile rather than overwrite if any already exist. Push `main` only and let its manifest change trigger the release workflow. Monitor CI, then verify the numeric release notes and actual assets, their digests/source parity, and model/attestation. Do not push either tag separately. Browser layout checks could not run locally; native Obsidian and live Groq remain unverified.

---

# Project state — centered dashboard, no moving averages (2026-11-14)

Version 1.8.5 centers toolbar actions, summary-card rows (including wrapped rows), range controls and series controls. Dashboard buttons match the compact range-button typography, padding and height, with 44px minimum on coarse pointers. Narrow cards retain legible CONNECTION labels. User explicitly requested complete removal of moving averages: toggle, explanation, calculations, dashed paths, markers and readout values were removed. Range-relative summary averages and recorded-score trend lines remain.

Relevant files: `styles.css`, `src/main.js`, `tests/centered-controls.test.js` and `tests/layout.test.js`; the build generates `main.js`. No vault data, analysis settings or saved scores are changed. Native Obsidian is not opened per prior user direction.

## RESUME HERE

Version 1.8.5 is published from merge `dae32b739f5ee248b233e8fcefec1811ad4aa669`, PR #28. PR CI 43635377759 and release workflow 43635605474 passed. All four release asset digests match the downloads; plugin assets match source, the model validated and main.js attestation verified. Native Obsidian was not opened. No vault or saved scores were modified.

---

# Project state — compact summary cards (2026-11-14)

Version 1.8.4 reduces the five dashboard summary cards about 30%: 102px columns on desktop and 84px in narrow panes, with proportionally smaller padding, spacing and score text. Labels wrap at enlarged text sizes. The change is CSS-only; saved records, calculations and chart behavior are unchanged. Source: `styles.css`; verification: desktop and mobile layout suites. Do not open Obsidian or modify the user's vault.

## RESUME HERE

Run layout checks, publish 1.8.4 through CI, and verify the release. Native Obsidian remains unverified.

---

# Project state — pastel emotion composition and monthly default (2026-11-14)

User requests distinct pastel composition colors, especially anxiety, frustration and sadness; monthly notes as the settings default; aligned composition columns; and publication. They then specified the Morning Pages Analytics composition chart as the visual reference. The chart selects up to ten most common labels across all saved scored history including older/legacy records and keeps them stable across ranges. `compositionColors` uses ten perceptually separated pastel slots with priority for the named emotions, collision resolution for arbitrary labels, and stable assignments while the same set remains. Percentages count displayed labels only and the accessible period details disclose exact values.

Monthly output is the default for settings without a saved choice; existing explicit daily/monthly/none choices remain intact. A saved legacy pending write without an explicit setting temporarily retains its original output mode for recovery. Exporting existing saved history still requires the Export months control. No personal vault or native Obsidian UI is being modified or opened.

## RESUME HERE

Match the installed Morning Pages Analytics chart: fixed-height percentage-sized stacked bars with 0/50/100 guides, calendar-proportional aligned columns, daily/weekly/long-range bins, a compact color key and textual period details. The bar geometry was implemented from the read-only reference plugin source; it uses this plugin's own saved mood records, not Morning Pages data. Finish desktop/mobile checks and publish version 1.8.3. Do not open Obsidian or modify the user's vault. Files: `src/main.js`, `styles.css`, `tests/composition-colors.test.js`, `tests/compact-history.test.js`, `tests/layout.test.js`, `tests/mobile-layout.test.js` and `README.md`.

---

# Project state — settings proportions and safe entry writes (2026-11-13)

Version 1.8.2 fixes a 1.8.1 flex regression: 260px and 320px horizontal flex bases became fixed heights when settings rows stacked. Stacked info/controls now use content-sized flex, and desktop controls use a bounded 320px column while descriptions use the remaining width. `tests/settings-proportions.test.js` measures content heights, desktop ratios, folder editor width and touch targets at 280–1200px and 200% text.

Storage audit found that daily re-export and a normal reanalysis could overwrite an owned entry edited before processing began. `prepareRecord` now keeps committed objects detached and accepts existing content only if it matches prior or projected generated text; other files are retained and a recovered entry is written. `exportDailyHistory` now uses the pending-write journal for each record. Monthly/dashboard-only operations avoid calling Obsidian's file lookup with null. Filename parsing now detects multiple underscore-formatted date tokens in one title as ambiguous. Synthetic regression tests cover these paths, including interruption and replay; no real vault data was modified.

## RESUME HERE

Version 1.8.2 is published from merge `39e4e310cb27e1999d3c79123a7e2c9f13fbdc14` (PR #25). PR CI 43561343929, main CI 43561612059, and release workflow 43561612069 passed. The four published asset digests match downloaded files; `main.js`, `manifest.json`, and `styles.css` also match source blobs, the optional model passed validation, and `main.js` attestation verification succeeded. User requested publication only: no Obsidian launch, installation, or migration was performed. Native settings behavior remains unverified; test in the user's theme only if requested.

---

# Project state — settings UI width and daily export restoration (2026-11-13)

Version 1.8.1 expands the settings tab to the full available modal pane width, preventing narrow constrained columns on wide displays. Folder allow/exclude textareas span the full card width as responsive stacked editors. Switching output back to Daily notes exports daily entry notes for saved records. Underscore title separators are treated as date token boundaries to detect ambiguous multi-date filenames.

## RESUME HERE

Version 1.8.1 is published from merge 92a637314cf12c85b5cbaf646d655f4ca6c6ea9b. PR CI 43537461964, main CI 43537767511 and release workflow 43537767503 passed. All four release assets (`main.js`, `manifest.json`, `styles.css`, `moodring-model.bin`) were verified: git object hashes match byte-for-byte with published assets, and the offline Moodring model passed validation tests. Reload Obsidian to inspect the wider settings tab. The prior 1.8.0 state below is historical.

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

RESUME HERE, 2026-11-17: Version 1.9.5 already recognizes descriptive filename dates and duplicate suffixes. getCreationDateForFile applies folder filters before filename detection and uses local creation day for undated files. Current-basis saved records matched the audited vault.



## 1.9.8 audit

RESUME HERE: Future cache verification timestamps could bypass the daily content check after clock rollback or sync. Revalidate immediately when cache age is negative. Overlarge Retry-After values could throw during rate-limit handling. Fall back to the standard pause for unrepresentable deadlines.
RESUME HERE - https://github.com/remriel/automatic-mood-history/releases/tag/1.9.8 is published and verified. Native-device smoke testing remains outside the verified coverage.

RESUME HERE 2026-11-19. Detected-date snapshots with changed source membership are visible with provenance; archived creation-date scores stay separate. Monthly export may extend an exact canonical subset. Edited Markdown remains protected.

RESUME HERE 1.9.9. Categorical no-evidence narratives precede scored-field validation. Edited monthly exports preserve the file and allow immediate JSON commits. Live verification confirmed nine successful recoveries.

RESUME HERE: Stable 1.9.9 published. README screenshots were captured inside Obsidian using the installed plugin renderer with fictional records.

## RESUME HERE - 1.9.11 metric grid

The dashboard uses five equal CSS Grid columns with 12px gaps at every pane width. Cards stretch to the dashboard content edges. At widths up to 360px, values use a smaller font to fit the narrower tracks. The mobile fixture verifies card geometry in Chromium and WebKit.

RESUME HERE: Stable 1.9.11 is published from 3b1843f9455a6c2c4c88da1108b44fa9a8cd132d. Release CI and all three asset checks passed. Labels can wrap in narrow panes. Native Obsidian was outside the verified coverage. The shared AI Brain vault was unavailable at the configured paths.

## RESUME HERE - 1.9.12 recorded-day explorer

The recorded-day panel lives inside renderTrendChart. Its native date dropdown uses the existing selected index and redraw path shared with the chart and slider. Options rebuild only when the visible record set changes. The readout has five CSS Grid cards, then reflows to three, two and one column by pane width. Icons use the Obsidian icon API. The reference image was absent, so the written specification guided the design.

RESUME HERE: Stable 1.9.12 is published at https://github.com/remriel/automatic-mood-history/releases/tag/1.9.12 from 23a61f704ccd0e6d21638dd645a45a514e57f96f. Release workflow and asset checks passed. The browser fixture did not render native Obsidian icons. The shared AI Brain vault was unavailable at the configured paths.

## RESUME HERE - 1.9.13 recorded-day reference

The supplied reference calls for a yellow date card, charcoal metric cards with colored stripes and icons, a yellow outlined date selector, and an olive square-edged panel. The user explicitly removed the slider. The native select and chart share the existing selected-record redraw path. The picker shows a fixed prompt while the selected date appears in the first card. Finish verification and publication.

RESUME HERE: Stable 1.9.13 is published from commit 77b34c5ed08129df38d21a8c391273ebe11a8d9c. The reference design uses a yellow date card and no slider. Date selection stays synchronized between the native dropdown and chart. Local desktop, Android and iPhone browser tests and the release workflow passed. All three assets matched their GitHub digests and tagged source. The shared AI Brain vault was unavailable.
