# Progress — release 1.7.8 (2026-11-13)

Objective: publish the range-relative moving average, stable emotion colors, theme-resistant legend matching, and visual refinements.

Progress: 95% — local functional, privacy, desktop, Android and iPhone checks passed; final preset checks and publication remain.

- [x] Implement range-relative moving averages and stable, theme-resistant emotion colors.
- [x] Update version metadata, release notes, changelog and README.
- [x] Pass functional, privacy, desktop, Android and iPhone checks, including a rendered color regression.
- [ ] Confirm final preset checks and GitHub CI.
- [ ] Merge the reviewed branch and verify the public release and assets.
- [ ] Verify the installed plugin against the released files.

Next: run release checks, publish 1.7.8 through the repository workflow, verify release assets and installed files, and record outcomes.

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
