# Automatic Mood History — Project State

## Architecture

- This is an Obsidian desktop community plugin. `scripts/build.js` bundles `src/sentiment-core.js` and `src/main.js` into the self-contained `main.js` loaded by Obsidian.
- `src/main.js` owns plugin lifecycle, date discovery, source events, settings, optional Groq requests, generated files, and the dashboard renderer.
- Provider responses are parsed and validated before normalization. GPT-OSS uses low reasoning and a 4096-token budget, with one 8192-token retry on completion-limit exhaustion. Date analyses share a serialized queue; a forced scan clears a previous provider pause once, while a new rate limit pauses its remaining requests.
- `runtime.lastGroqIssue` stores a safe failure category and retry timestamp. Provider error bodies are not logged or saved. Connection checks send fictional sample text and update connection status without creating mood records.
- Intentional local analysis uses `analysisSource: local`; provider fallback uses `local-fallback` with a per-record provider issue. Unchanged fallback records are retried after the provider pause expires. Valid unchanged Groq results survive a failed manual retry.
- `src/sentiment-core.js` owns text cleanup, duplicate paragraph removal, SHA-256 hashing, local lexicon scoring, result validation, and generated entry Markdown.
- The analysis scope is every Markdown note in the vault. Each note is assigned to the local calendar day of Obsidian's `TFile.stat.ctime`; folder, filename, frontmatter dates, aliases, and later edits do not set that day.
- Generated files under the configured `Mood History/` output folder and notes in `.trash/` are excluded. Notes without a valid creation timestamp are skipped.
- Startup analysis, automatic note-change analysis, and Groq requests are off by default. Local scoring runs when a user requests analysis. Groq requires the settings opt-in and reads only `GROQ_API_KEY` from the Obsidian process environment.
- No API key value is stored. The user-selected environment-variable setting from version 1.1.0 is ignored and omitted from saved settings.
- Generated files live under `Mood History/` by default. Entries contain an ownership marker. If a date path belongs to another note, the plugin picks a conflict-safe name and stores that path so dashboard links remain correct.
- Existing records from prior filename/frontmatter grouping are retained with `dateBasis: legacy-note-date`; new or verified groups use `dateBasis: created-at-local-date`.
- Mood scores are text-based inferences, not diagnoses or objective facts. Groq receives cleaned note text only after opt-in; file paths remain local.
- Dark-mode styles use Obsidian theme colors for surfaces, text, and borders, with vivid series colors and a low-contrast decorative grid.

## Design decisions and rationale

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
- The release workflow validates that the pushed tag equals the manifest version and attaches `main.js`, `manifest.json`, and `styles.css`.
- The source folder initially had no Git metadata or remote. It is now the public repository `https://github.com/remriel/automatic-mood-history`; all-note timestamp commit `5fd02b1c836245c3ce0a2e2190b18b7c41934e7e` is tagged `1.2.0`.

## Failed approaches not to repeat

- Fixed chart/table minimum widths and window-width media queries cannot fit narrow Obsidian split panes. Overflow hiding is not a fix: verify descendant bounds and scroll metrics, with large text and long unbroken content.
- Do not send `uniqueItems` to Groq strict structured output, or send GPT-OSS the unsupported `reasoning_format` parameter.
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

- Release `1.2.0` is published and installed locally. A fresh Obsidian launch reports `loaded`; the live scan grouped notes by creation timestamp, preserved old records with the legacy marker, and had no plugin errors. Downloaded release files match the source build and installed files by SHA-256.
- Native 1.2.2 startup and day-card rendering have been inspected in the user's dark theme. Browser fixture checks cover the detailed 240–1440px narrow-pane/large-text matrix; native screenshots and user data are not published.
- CI run `37059163020` and release workflow `37059296342` passed for 1.2.0.
- The Groq service and configured model can change independently of this plugin; local analysis remains available.

## RESUME HERE

1.2.2 is complete, installed, and published: https://github.com/remriel/automatic-mood-history/releases/tag/1.2.2. Tag commit `c11f60292e87729130bee48ffb4d84c8acf6b058`; release workflow `37178543489` succeeded. The user switched to Build Once & Publish after the successful local build/checks, so additional post-publication verification was intentionally skipped. Manual acceptance is now theirs; do not continue test/polish loops without a new request. Preserve the user's new manual-analysis results and existing preferences. Native screenshots/backups remain private.

The public repository is `https://github.com/remriel/automatic-mood-history`; release `1.2.0` is published and installed. It groups every Markdown note by the local date of Obsidian's creation timestamp, preserves previous-scope entries as legacy, and removes the Daily-folder scope. Local tests, fresh Obsidian startup, CI, release workflow, and asset hashes passed. The live dark-theme appearance has not been visually inspected. Do not add vault records or personal settings to this public repository.
