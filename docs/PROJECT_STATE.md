# Automatic Mood History — Project State

## Architecture

- This is an Obsidian desktop community plugin. `scripts/build.js` bundles `src/sentiment-core.js` and `src/main.js` into the self-contained `main.js` loaded by Obsidian.
- `src/main.js` owns plugin lifecycle, date discovery, source events, settings, optional Groq requests, generated files, and the dashboard renderer.
- Provider responses are parsed and validated before normalization. GPT-OSS uses low reasoning and a 4096-token budget, with one 8192-token retry on completion-limit exhaustion. Date analyses share a serialized queue; a forced scan clears a previous provider pause once, while a new rate limit pauses its remaining requests.
- Groq-enabled mode is provider-only: valid Groq responses are saved; provider errors or pauses preserve existing records and leave new work pending. Local scoring is used only while Groq is disabled. Existing `local-fallback` records are historical results eligible for recovery, not a path new Groq-enabled scans use.
- `runtime.lastGroqIssue` stores a safe failure category and retry timestamp. Provider error bodies are not logged or saved. Connection checks send fictional sample text and update connection status without creating mood records.
- Intentional local analysis uses `analysisSource: local`; older provider fallback results use `local-fallback`. Unchanged local and fallback records are retried with Groq after a provider pause expires. Valid saved results survive failed retries.
- `src/sentiment-core.js` owns text cleanup, duplicate paragraph removal, SHA-256 hashing, local lexicon scoring, result validation, and generated entry Markdown.
- The analysis scope is every Markdown note in the vault. Each note is assigned to the local calendar day of Obsidian's `TFile.stat.ctime`; folder, filename, frontmatter dates, aliases, and later edits do not set that day.
- Generated files under the configured `Mood History/` output folder and notes in `.trash/` are excluded. Notes without a valid creation timestamp are skipped.
- Startup analysis, automatic note-change analysis, and Groq requests are off by default. Local scoring runs when a user requests analysis. Groq requires the settings opt-in and reads only `GROQ_API_KEY` from the Obsidian process environment.
- No API key value is stored. The user-selected environment-variable setting from version 1.1.0 is ignored and omitted from saved settings.
- Tagged releases attach version-specific notes and use GitHub Actions to attest the built `main.js`, `manifest.json`, and `styles.css` assets.
- Generated files live under `Mood History/` by default. Entries contain an ownership marker. If a date path belongs to another note, the plugin picks a conflict-safe name and stores that path so dashboard links remain correct.
- Existing records from prior filename/frontmatter grouping are retained with `dateBasis: legacy-note-date`; new or verified groups use `dateBasis: created-at-local-date`.
- Mood scores are text-based inferences, not diagnoses or objective facts. Groq receives cleaned note text only after opt-in; file paths remain local.
- Dark-mode styles use Obsidian theme colors for surfaces, text, and borders, with vivid series colors and a low-contrast decorative grid.

## Design decisions and rationale

- 1.2.3 started legacy fallback discovery. 1.2.4 includes every legacy-date record in Groq scans, regardless of its prior analyzer, and `gatherLegacyDate()` reads its exact saved source paths. The original legacy date basis and entry path are retained. Failed or paused requests preserve existing results and leave the group pending; no new local-fallback scores are written while Groq is enabled.
- No-horizontal-scroll layout in 1.2.2 uses pane container queries, intrinsically shrinkable grids, full-width history cards, and a ResizeObserver-redrawn SVG with CSS-pixel-sized labels. It does not hide/clamp overflowing content or discard chart points. Chart observers are disposed on refresh and unload.
- A dashboard's native Base embed independently caused overflow. New dashboards link to it instead. `upgradeDashboardLayout()` atomically replaces only the exact embed in an owned dashboard, checking ownership again during processing and retaining other writing; native Base tables remain separate optional views.
- The source started this task with uncommitted 1.2.1 provider recovery changes. Preserve those changes and include them in 1.2.2; do not reset the working tree to published 1.2.0.
- Preserve daily-note source text. The plugin reads notes and writes only its own history, methodology, Base, and dashboard files.
- Keep local analysis usable without an API key or network access.
- Require two deliberate choices for remote analysis: enable Groq and run analysis or enable automatic analysis.
- Group all Markdown notes by creation timestamp, not folder or note title, because the user's intended day is when the note was made.
- Preserve earlier records and label their old date basis instead of deleting or silently presenting them as timestamp-based.
- Validate and label analyzer provenance. Empty or image-only days stay `insufficient`.
- Treat generated history as sensitive. Exclude `data.json`, `.obsidian/`, and `Mood History/` from Git.
- Use synthetic test fixtures only. The public repository must not contain note excerpts, generated mood entries, vault backups, absolute vault paths, or credentials.

## Important discoveries and constraints

- The recurring 1.2.0 Groq error is a strict-schema HTTP 400: `uniqueItems` on the emotions array is rejected. Local validation already deduplicates emotions, so that field is unnecessary in the remote schema.
- GPT-OSS supports `reasoning_effort: low` and `include_reasoning: false`; Groq's reasoning documentation says `reasoning_format` is unsupported for GPT-OSS. Completion-limit exhaustion must be handled separately from missing or malformed JSON.
- The outer manual-retry flag previously bypassed only one cooldown check; the provider method still refused the request. A sticky previous error also produced failure notices on no-op scans, and the local scorer always claimed Groq was unavailable even when intentionally disabled.

- Version 1.1.0 documentation promised opt-in Groq and bounded folder scope, but code defaults could scan on startup, analyze on note edits, and call Groq when the key existed. Version 1.1.1 aligns behavior with the privacy documentation.
- Version 1.1.0 exposed an editable environment-variable name. This is now pinned to `GROQ_API_KEY` so synced plugin data cannot select another process secret.
- An earlier test fixture contained a real-looking backfill date and derived mood values. It has been replaced with synthetic data.
- A fresh 1.1.1 launch logged `Plugin failure: automatic-mood-history Error: Folder already exists.` The failure came from support-folder creation during `onload`. Version 1.1.2 moves setup after Obsidian's layout-ready event, checks adapter state, and accepts only confirmed existing folders after a creation race.
- The user's corrected scope is all notes created on a day, using Obsidian creation timestamps. Version 1.2.0 implements local-day grouping from `TFile.stat.ctime`, no longer uses filenames/frontmatter/aliases/folder scope, and preserves old records as legacy.
- The previous Groq-enabled path silently wrote local fallback scores after provider errors and for remaining targets after a pause. A passing sample connection check did not make earlier saved fallbacks update. Also, only legacy fallback records had been added to the staged recovery; legacy records with other analyzer labels were not selected.
- Legacy records have saved `sourcePaths`. Recovery must read that complete saved set and retain the legacy date, rather than grouping the same notes by current creation date or substituting notes from another group. Current user vault metadata confirmed saved paths for the applicable legacy records; do not copy the record data or private note text into this public repository.
- The release workflow validates that the pushed tag equals the manifest version and attaches `main.js`, `manifest.json`, and `styles.css`.
- 1.2.4 fixes the release audit findings: the manifest description no longer says "Obsidian", the GitHub release body comes from `docs/RELEASE_NOTES_1.2.4.md`, and `actions/attest@v4` signs provenance for each release asset. CSS score colors and reduced-motion rules use scoped selector specificity; the `text-decoration-thickness` override was removed.
- The source folder initially had no Git metadata or remote. It is now the public repository `https://github.com/remriel/automatic-mood-history`; all-note timestamp commit `5fd02b1c836245c3ce0a2e2190b18b7c41934e7e` is tagged `1.2.0`.

## Failed approaches not to repeat

- Fixed chart/table minimum widths and window-width media queries cannot fit narrow Obsidian split panes. Overflow hiding is not a fix: verify descendant bounds and scroll metrics, with large text and long unbroken content.
- Do not send `uniqueItems` to Groq strict structured output, or send GPT-OSS the unsupported `reasoning_format` parameter.
- Paid Groq usage does not guarantee every request succeeds; the provider still enforces account/model rate limits and can return HTTP 429. Provider-only mode must leave affected groups pending rather than fill them with local estimates.
- Do not apply a fixed 15-minute pause to every provider error or use a saved error as evidence that the current scan failed.

- Do not publish the surrounding vault-work folder or its project notes. Publish only this sanitized plugin directory.
- Do not use the projectless workspace path ending in the reserved Windows name `con`; use the actual plugin checkout folder.
- Do not restore the old editable environment-variable setting or enable remote analysis for a fresh install by default.

## Relevant files

- `tests/layout-fixture.js`, `tests/layout.test.js` — actual bundled renderer/CSS with fictional data and an Obsidian DOM adapter, width/interaction/cleanup regressions; Playwright is development-only.
- `tests/dashboard-migration.test.js` — owned embed migration, idempotence, and concurrent/unowned writing protection.
- `docs/LAYOUT_QA.md` — acceptance inventory and native versus synthetic evidence boundaries.
- `src/main.js` — plugin settings, scoped date discovery, opt-in Groq, conflict-safe entry writer, and dashboard links.
- `src/sentiment-core.js` — local analysis and entry rendering.
- `tests/groq-recovery.test.js` — strict-schema compatibility, completion exhaustion, partial-object rejection, forced retry, rate-limit headers, current-run notices, local provenance, privacy, result preservation, serialized requests, and connection checks.
- `styles.css` — light styles and Obsidian-aware dark theme.
- `manifest.json`, `versions.json`, `CHANGELOG.md` — plugin versioning.
- `.github/workflows/ci.yml`, `.github/workflows/release.yml` — repository CI and tagged release.
- `README.md`, `PRIVACY.md`, `SECURITY.md` — user guidance and disclosure.

## Known limitations and unresolved items

- Release `1.2.5` is published with version-specific notes, three attached assets, and verified build-provenance attestations. Main CI and the tagged release workflow both passed.
- The local plugin already had version `1.2.4` from the earlier installation, but final `manifest.json` and `styles.css` release-audit fixes were not copied while Obsidian was running. Its `data.json` was not changed. If a future request asks to sync the exact release files locally, close Obsidian first.
- The current user vault has legacy-date records with saved source paths, and Groq is enabled. Older local-fallback results still require a run of **Analyze changed notes** after Obsidian restarts.
- Native 1.2.2 startup and day-card rendering have been inspected in the user's dark theme. Browser fixture checks cover the detailed 240–1440px narrow-pane/large-text matrix; native screenshots and user data are not published.
- CI run `37059163020` and release workflow `37059296342` passed for 1.2.0.
- The Groq service and configured model can change independently of this plugin; local analysis remains available.

## Intensity chart — 1.2.5

- Regular chart series now include intensityScore, using saved values on the same 1–5 scale. Missing scores are omitted using the existing finite-value filter.
- Light theme intensity is #7041c4; dark theme is #be9aff. Its dash-dot pattern is distinct from mood, energy, and connection, including the legend swatch.
- Data-series attributes identify traces and marks for regression checks. Accessible description and SVG title name all four series.
- The build script import matcher accepts CRLF and LF, fixing Windows source checkouts.
- Release notes live in docs/RELEASE_NOTES_1.2.5.md and are selected by the release workflow.
- All local tests and release privacy audit pass. Only sanitized plugin source and synthetic test data belong in this repository.

## RESUME HERE

Automatic Mood History 1.2.5 is published at https://github.com/remriel/automatic-mood-history/releases/tag/1.2.5. Release tag/source commit: a2eb6b39a87c6016a5455a385643acd037acc303. Main CI 37657910548 and Release workflow 37658046595 passed. All three downloaded release assets passed gh attestation verify with .github/workflows/release.yml enforced as the signer. Published asset SHA-256 values match the downloads. Local core, provider, privacy, and responsive layout checks passed. The public trend chart includes Mood, Energy, Connection, and Intensity with existing saved scores; no analysis rerun is required.

No implementation or publication work remains. Keep private archive code and results outside this repository. The installed personal plugin retains private archive support and has its intensity chart update verified locally. Future release work must preserve its saved data and private features.

## 1.2.6 reliability update (in progress)

- Groq strict mode can return HTTP 400 json_validate_failed; JSON modes can return complete responses with emotion labels outside the old enumeration. A closed emotion list rejected otherwise valid analyses. Provider labels now use bounded Unicode text validation; scores, required fields, and provenance remain strict.
- One cloud-only source read previously aborted a whole scan. Source failures now preserve that date and permit other dates to proceed, without scoring a partial source set.
- runtime.pendingDates persists safe failure category, attempts, retryAt, and legacy source routing. One-minute polling retries pending dates with exponential backoff up to an hour, and five-minute reconciliation catches missed events. Automatic mode catches up at startup; manual-only defaults stay unchanged.
- Output/request failures are scoped to dates; global authentication, rate limits, connection/service failures, and missing models still pause provider work. Successful dates cannot erase other pending dates.
- New tests: tests/automatic-recovery.test.js covers labels, safe errors, failed-source isolation, persistent recovery, backoff, opt-out, unload, storage rollback, and rate limits.
- Public source and personal installed bundles intentionally differ. Preserve personal extensions and data in future local installs; publish only this sanitized repository.

## RESUME HERE — current
1.2.6 implementation and synthetic verification are complete. Finish local integration, final diff review, CI, tag, release, and attestation verification. Earlier 1.2.5 completion sections describe the previous release.

## Verified release completion

1.2.6 is published: https://github.com/remriel/automatic-mood-history/releases/tag/1.2.6

Source/tag commit: 9d0f0a34437ecf3666ad2a3b44bae7af89e401d9. Main CI 38106375258 and Release 38106451316 both passed. All three downloaded assets match GitHub SHA-256 digests. Their attestations passed verification against this repository's release workflow, exact source commit, and refs/tags/1.2.6.

Core, provider, lifecycle, timestamp grouping, legacy recovery, automatic retry, privacy audit, and responsive layout checks passed. Native integration confirmed recovered date groups, matching source hashes, enabled automatic operation, event debounce processing, and preservation of personal extensions and saved history.

## RESUME HERE — completed 1.2.6
The release is complete and verified. No further implementation or publication remains. Preserve the per-date pending queue, provider-only behavior, opt-in defaults, private installed extensions, and source notes in future changes.
