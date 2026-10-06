# Changelog

## 1.2.4 — 2026-10-06

- Make Groq-enabled analysis provider-only; failures and pauses leave records pending instead of generating new local-fallback scores.
- Include every saved legacy-date record in Groq scans and analyze it from its original saved notes while preserving its legacy date.
- Keep existing records unchanged when Groq fails and clearly report groups still pending.

## 1.2.3 — 2026-10-05

- Retry saved legacy local-fallback entries instead of limiting recovery to current creation-date groups.
- Read each legacy entry's original saved source notes and retain its legacy date basis and stored entry path.
- Add a focused Retry fallback entries command/button so successful Groq results need not be rerun.
- Distinguish Groq connectivity from cached fallback history awaiting reanalysis.
- Preserve existing results when sources are missing/empty or Groq retries fail; honor new provider pauses.
- Add focused legacy-recovery and responsive-button regressions.

## 1.2.2 — 2026-10-03

- Remove horizontal scrolling from the dashboard: replace the wide daily table with wrapping, source-linked history cards.
- Fit trend charts to the actual Obsidian pane, keep readable labels, and redraw automatically on pane resize.
- Use pane-width container queries for controls, statistics, emotion bars, and plugin settings, including long text.
- Replace only the exact Base embed in plugin-owned dashboards with an optional link; preserve all other writing and the Base itself.
- Add narrow-pane, enlarged-text, dense-history, empty-state, interaction, observer-cleanup, and safe-migration regressions.
- Include the previously staged 1.2.1 Groq recovery fixes below.

## 1.2.1 — 2026-10-03

- Remove the JSON-schema field rejected by Groq strict output and use supported GPT-OSS reasoning settings.
- Retry completion-limit exhaustion with a larger response budget and reject incomplete analysis objects.
- Fix explicit retries, honor provider Retry-After, serialize date analysis, and retry unchanged local results when Groq can recover.
- Report the current scan's results, distinguish intentional local analysis from provider fallback, and avoid saving provider response bodies.
- Add a sample-text Groq connection check and a dark-mode status panel.

## 1.2.0 — 2026-10-02

- Group every Markdown note by the local calendar day of Obsidian's file-creation timestamp, across all folders and filenames.
- Reanalyze changed notes within their creation-date group and exclude generated history and trash files.
- Preserve records from previous filename/frontmatter date grouping and label them as legacy.
- Remove the obsolete Daily-folder scope settings and explain timestamp grouping in the dashboard and methodology.

## 1.1.2 — 2026-10-02

- Prevent startup load failures when Obsidian has not indexed existing output folders yet.
- Defer generated-file setup until the vault layout is ready and safely handle confirmed folder-creation races.

## 1.1.1 — 2026-10-02

- Improve dark-mode contrast and adapt surfaces, borders, and chart grids to the active Obsidian theme.
- Make Groq opt-in and off by default; pin key lookup to GROQ_API_KEY.
- Default to manual, local analysis and limit dated-note discovery to the configured Daily folder.
- Add an explicit setting for including date-named notes and date aliases outside that folder.
- Protect unrelated notes at generated entry paths with an ownership marker and a conflict-safe filename.
- Migrate the older reviewed-backfill source label and replace private-derived test data with synthetic fixtures.

## 1.1.0 — 2026-10-01

- Add automatic analysis for created, edited, renamed, and deleted dated notes.
- Add Groq structured-output analysis with JSON-mode and plain-JSON recovery.
- Add deterministic, clearly labeled local fallback analysis.
- Add native Obsidian mood-entry notes, Base table, and trend dashboard.
- Add mood, energy, connection, intensity, emotions, confidence, and provenance.
- Add source hashing and duplicate-date consolidation.
- Add a complete dark theme, responsive layout, sticky table navigation, keyboard focus states, and non-color chart line patterns.
- Delay vault event registration until Obsidian's layout is ready.
- Bundle the complete runtime into one release `main.js`.
