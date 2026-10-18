# Changelog

## Unreleased

- Fix: an unreachable Groq endpoint is reported as a connection failure, pauses the provider with the normal backoff, and is no longer retried as invalid model output or shown as a model problem.
- Privacy: cleaned analysis text removes wikilink targets and inline `#tags` before hashing or transmission; an explicit `[[note|alias]]` alias is kept as plain text. The text pipeline moves to `markdown-text-v3`, so local records refresh and Groq-enabled groups are re-analyzed on the next authorized scan.
- Fix: a note that opens with a `---` horizontal rule keeps its text instead of having it stripped as YAML frontmatter.

## 1.5.5 — 2026-10-18

- Add optional offline trained Moodring classifier for text-only emotion comparisons, with clear abstention and source limits.
- Preserve all Groq scoring, consent and caches while enriching unchanged dates without remote reanalysis.
- Validate model inputs, bound saved metadata, document provenance and provide reproducible model release asset.

## 1.5.4 — 2026-10-18

- Add GoEmotions-guided Groq interpretation with contextual and attribution safeguards.
- Integrate offline VADER 1.1.3 for local mood polarity, preserving the existing auxiliary scores and low confidence.
- Version caches, bundle the Apache-2.0 notice, document limitations and add regressions.

## 1.5.3 — 2026-10-16

- Exempt dates when the assessment explicitly reports no emotional evidence or no text for analysis: no mood, energy, connection or intensity score, chart points, averages or emotion counts.
- Reclassify existing saved records without another Groq request and refresh generated entry files through the recoverable writer.
- Preserve low-confidence but valid emotional assessments. Add classification, Groq, history and chart regressions.


## 1.5.2 — 2026-10-16

- Revert the plugin implementation to the 1.2.9 release, removing all functional changes from 1.3.0–1.5.1.
- Keep the existing plugin identity; update release metadata to 1.5.2 and retain prior changelog entries.
- Warn that data and pending-job compatibility with later versions needs verification. See `docs/RELEASE_NOTES_1.5.2.md`.

## 1.5.1 — 2026-10-16

- Repair unique source quotations when Groq changes only spacing or typography; preserve exact source text in saved evidence.
- Fix trimmed quotation offsets and reject supported scores if normalized evidence disappears.
- Treat malformed analysis as a date-specific output issue, keep diagnostic codes visible on the dashboard, and preserve other completed chunks.
- Respect remaining daily requests when selecting three workers; remove a quadratic passage lookup during source preparation.

## 1.5.0 — 2026-10-16

- Replace verbose Groq chunk output with compact grounded evidence and low GPT-OSS reasoning; normally one request, at most one necessary correction.
- Run independent chunks with up to five workers, reserve estimated tokens against reported quota and preserve server retry pauses.
- Reuse validated pending chunks after exact fingerprint verification; reduce checkpoint writes and dashboard redraws.
- Continue productive Resume pending batches immediately within the saved per-batch character cap; add Stop analysis and request/token/quota telemetry.
- Measure a 92.4% wall-time reduction on a synthetic 10-chunk batch and about 77% on the small-entry median against 1.4.1. Pass all 57 score checks across three regression runs with zero unsupported scores.
- Preserve prior records, source scope, provider consent, current settings, strict quotation validation and serialized recoverable commits.

## 1.4.1 — 2026-10-16

- Continue independent chunks after invalid provider output or a cooling chunk; preserve validated work and existing results.
- Keep ordinary character-budget continuation at a one-minute delay and track failure backoff per chunk.
- Add pending-only resume, live checkpoint counts and retry/continuation times; preserve provider-wide pauses and source/data caps.
- Cover 68-chunk recovery across reloads, storage failures, rate limits and cancellation with regression tests.

## 1.3.2 — 2026-10-15

- Retain emotionally charged commentary, second-person address and clipped material as explicitly labeled textual intensity without assigning personal mood, energy or connection from that material.
- Recover misplaced evidence containers in JSON fallback without altering claims; give format retries validation guidance.
- Leave contradictory numeric axes unscored while preserving other grounded evidence and explaining the omission.
- Review every empty assessment once, including wording outside local English rules, and retain validated emotion labels omitted from the top-level list.
- Use medium reasoning effort for supported GPT-OSS models; keep the selected model and existing request limits.
- Add synthetic regressions, persistence/history isolation and responsive textual-evidence checks.

## 1.3.1 — 2026-10-15

- Fix false emotional exclusions for reflective writing, indirect expression, blockquotes and prose mindmaps.
- Remove positive-proof lexical gating of provider interpretations while retaining source matching.
- Add one bounded empty-evidence recheck and focused recall regressions.

## 1.3.0 — 2026-10-15

- Replace global lexical frequency scoring with contextual, concept-based evidence and independent nullable score axes.
- Distinguish personally experienced affect from quoted/attributed/negated/hypothetical feelings and intellectual discussion.
- Preserve mixed emotions, activation/depletion coexistence, explicit temporal change and unresolved contradictions; detect selected sarcasm conservatively.
- Anchor explicit needs, situational associations and self-reported recurrence to source quotations; add local, scope-compatible historical comparisons.
- Validate new provider evidence and direction, cap confidence, and generate bounded explanations from supported signals.
- Surface evidence/context in Markdown and dashboard, including unscored entries; document sensitive quotation storage.
- Add challenge/public-journal benchmarks, counterfactuals, persistence/provider/history regressions and browser coverage. Preserve consent, recovery, compatibility and source indexing.

## 1.2.9 — 2026-10-13

- Recover staged analysis results across Markdown/JSON storage interruptions; serialize plugin data saves and preserve concurrent user edits.
- Complete lifecycle and epoch cancellation, coordinate provider sample checks, and report cancelled scan work.
- Validate persisted settings and vault paths; invalid scope input now fails closed.
- Fingerprint analyzer semantics and index vault discovery once per full scan.
- Preserve legacy and creation-date histories together with additive identities.
- Bound provider narrative text and prevent Markdown links, embeds, images and HTML from becoming active content.
- Verify functional, responsive layout, synthetic interruption/restart and native Obsidian behavior. See `docs/RELEASE_NOTES_1.2.9.md`.

## 1.2.8

Add vault-relative include/exclude folder rules with exclusions taking precedence. Continue to group source notes by local creation timestamp and preserve earlier history. See `docs/RELEASE_NOTES_1.2.8.md`.

## 1.2.7

Add persistent keyboard-accessible show/hide controls for Mood, Energy, Connection, and Intensity in the chart legend.

## 1.2.6

Fix Groq emotion-label rejection, isolate unreadable/invalid date groups, and persist automatic retries with backoff and startup catch-up. Preserve prior results, global rate limits, and opt-in defaults. See `docs/RELEASE_NOTES_1.2.6.md`.

## 1.2.5 — 2026-10-07

- Plot intensity alongside mood, energy, and connection on the trend chart using saved 1–5 scores.
- Add a purple intensity trace with a distinct dash-dot pattern, legend, tooltips, and accessible chart description.
- Verify missing scores, plotted values, light/dark themes, and responsive layouts.

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
