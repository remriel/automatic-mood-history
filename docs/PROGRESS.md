# Progress — centered controls and moving-average removal (2026-11-14)

Objective: streamline the dashboard top, center controls and summary cards, and remove moving averages entirely.

Progress: 70% — implementation and focused centering checks complete; full verification and publication remain.

- [x] Center summary-card rows, toolbar buttons, range controls and series controls.
- [x] Match button size to range buttons and preserve touch targets.
- [x] Remove moving-average controls, explanations, calculations, paths, markers and readout values.
- [ ] Verify desktop/mobile layouts and chart interaction tests.
- [ ] Publish 1.8.5 and verify the workflow and assets.

Next: run full checks, review the diff, open and merge a PR after CI, and verify the release. Do not open Obsidian or alter the user's vault.

---

# Progress — smaller summary cards (2026-11-14)

Objective: make the five mood summary cards 30% smaller and publish.

Progress: 60% — CSS and release metadata prepared; layout checks and publication remain.

- [x] Reduce card widths, padding, spacing and score type.
- [ ] Pass desktop and mobile layout checks.
- [ ] Publish version 1.8.4 and verify the release.

Next: run responsive checks, push a PR, pass CI, merge, and verify the release workflow. Do not open Obsidian or change the user's vault.

---

# Progress — pastel composition, alignment and monthly default (2026-11-14)

Objective: give composition emotions distinct pastel colors, align the chart cells, default to monthly notes, and publish.

Progress: 75% — pastel palette, monthly default, and Morning Pages-style chart implemented; final checks and release remain.

- [x] Provide ten distinct pastel colors with priority for anxiety, frustration and sadness; preserve text details.
- [x] Default to monthly output when no preference is saved; preserve saved choices and legacy pending-write recovery.
- [x] Pass color separation, storage recovery, functional and mobile runtime tests; inspect synthetic light and dark previews.
- [x] Match the referenced Morning Pages stacked composition chart and keep the global top ten fixed across date ranges.
- [ ] Verify desktop/mobile chart, date-range behavior and full tests.
- [ ] Publish the release and verify workflow and assets.

Next: finish full desktop/mobile and recovery checks; prepare versioned release, then publish and verify. Do not open Obsidian or modify the user's vault.

---

# Progress — settings proportions and safety fixes (2026-11-13)

Objective: fix settings proportions, resolve reproducible related bugs, and publish a new release.

Progress: 100% — release 1.8.2 is published and verified.

- [x] Reproduce and fix the very tall narrow settings rows and rebalance desktop columns.
- [x] Add responsive measurements, 200% text and touch-target checks.
- [x] Preserve pre-existing edits in daily exports/reanalysis and use recoverable daily export commits.
- [x] Fix null lookup in compact modes and multiple underscore-date ambiguity.
- [x] Pass functional, recovery, parsing, mobile runtime and privacy tests.
- [x] Pass desktop and Android/iPhone layout checks, PR CI 43561343929, main CI 43561612059, and release workflow 43561612069.
- [x] Verify all four published asset digests, plugin asset/source parity, model validation and main.js attestation.

Next: no publication work remains. Native Obsidian and the user's theme were not tested; the user requested publication only. Do not open Obsidian or change the user's vault without a new instruction.

---

# Progress — settings UI width, daily export restoration and date ambiguity (2026-11-13)

Objective: make settings UI fill available modal width, restore daily entry notes when switching to daily output, and detect underscore-separated ambiguous dates.

Progress: 100% — release 1.8.1 published and verified.

- [x] Expand settings tab to full modal width and stack multi-line folder scopes.
- [x] Restore daily entry notes when switching output back to daily mode.
- [x] Recognize underscore-separated multi-date filenames as ambiguous.
- [x] Pass functional, layout, mobile runtime, and release audit suites.
- [x] Merge PR #24 as 92a637314cf12c85b5cbaf646d655f4ca6c6ea9b and pass main CI and release workflow 43537767503.
- [x] Verify tag 1.8.1, all four asset digests, and byte-for-byte git blob parity for manifest.json, styles.css, and main.js.

Next: reload Obsidian to check the wider settings tab in native UI. No reanalysis is required for existing records.

---

# Progress — compact history and import dates (2026-11-13)

Objective: reduce daily-entry clutter without losing history, and group imported dated notes correctly.

Progress: 100% — release 1.8.0 published and verified; native app testing remains unverified.

- [x] Separate daily/monthly/dashboard-only output while retaining checkpointed recovery.
- [x] Add lossless monthly exports, edit protection and dashboard evidence/source links.
- [x] Recognize import counters, dates in titles and explicit numeric-date conventions.
- [x] Pass functional suite, mobile runtime, privacy audit and desktop layouts before integration.
- [x] Integrate the completed 1.7.8 chart release in an isolated worktree.
- [x] Verify rebased desktop layout and original mobile layout runs.
- [x] Synchronize the feature branch/PR and pass CI on the final commit.
- [x] Merge PR #23 as 9a29437ff8be6c5c00e121404c0627df8d407eb3 and pass main CI and release workflow 43535412561.
- [x] Verify tag 1.8.0, all four asset digests, and byte-for-byte git blob parity for manifest.json, styles.css, and main.js.

Next: reload Obsidian and test native interaction if desired. No reanalysis is required for existing records.

---

# Progress — release 1.7.8 (2026-11-13)

Objective: publish the range-relative moving average, stable emotion colors, theme-resistant legend matching, and visual refinements.

Progress: 100% — 1.7.8 is published and installed; native Obsidian interaction remains unverified.

- [x] Implement range-relative moving averages and stable, theme-resistant emotion colors.
- [x] Update version metadata, release notes, changelog and README.
- [x] Pass local functional, privacy, desktop and Android/iPhone layout tests; verify all range presets and computed legend/segment colors under a theme override.
- [x] Merge PR #22 as 861c30f00e03c02fd1410373e318ed29a5e73b47 and pass PR CI 43533163455 and main CI 43533197803.
- [x] Publish 1.7.8 via successful release workflow 43533197782 and verify the tag and all four asset digests.
- [x] Verify installed main.js, styles.css and manifest.json match the official release byte-for-byte.

Next: reload Obsidian and visually check the plugin with the user's theme if desired. No reanalysis is required for these display changes.

---

# Top seven composition and moving averages ? 1.7.7

**Objective:** Display only the seven most common emotions in Composition over time and add moving averages to trend charts.

**Progress: 100% ? stable release published and verified.**

- [x] Rank the seven most frequent emotions in the selected date range without a combined category.
- [x] Normalize period percentages against displayed emotions; explain blank periods.
- [x] Add toggleable seven-calendar-day moving averages to all four trend plots and selected-day readout.
- [x] Test date boundaries, missing scores, selected-range limits, toggle/series visibility, custom reranking and unchanged records.
- [x] Pass functional, mobile runtime, desktop layout and privacy checks; fix average markers to keep raw score selectors distinct.
- [x] Finish mobile layout checks.
- [x] Publish and verify stable release 1.7.7.

**Current state:** Existing records and personal installed plugin remain untouched. The shared AI Brain vault was unavailable at both configured paths.

**Exact next steps:** Review final diff; merge and publish 1.7.7; verify workflow and release assets; update handoff.

Completed: https://github.com/remriel/automatic-mood-history/releases/tag/1.7.7
PR #21 merge/source: 1e6a94ea446630acbf2c61a781219634c8a8c970. CI 43528117906 and Release 43528117968 passed. All four asset digests match downloads; plugin file contents match source after line-ending normalization. main.js release-workflow attestation verification exited 0. Latest stable is 1.7.7.

Next: no publication work remains. Native Obsidian testing is the user?s next step; no reanalysis is needed.
