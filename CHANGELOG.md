# Changelog

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
