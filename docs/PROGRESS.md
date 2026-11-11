# Progress — solid-line chart release (2026-11-10)

**Objective:** make the four trend plots clearer and more sophisticated, use solid lines for each, and publish a verified release.

**Progress: 60%** — chart changes and release metadata prepared; CI and publication remain.

- [x] Identify the live repository, current chart and existing release workflow.
- [x] Improve the trend plots, selected-day presentation, and missing-score handling without changing stored data.
- [ ] Verify solid traces, calendar spacing, accessibility, responsive layouts, and existing functionality with synthetic records. Functional and mobile runtime tests pass locally; GitHub CI must run the browser and release-audit checks.
- [ ] Prepare versioned release notes, publish through the existing workflow, and verify the release and assets.

**Current state:** changes based on `main` at `34a6a120`; published baseline is 1.7.0. Version 1.7.1 is prepared locally. The chart uses solid lines, labeled selected values, density-aware points, and a path break for an explicitly missing score; saved series visibility and transient window/day selection are preserved. A narrow synthetic browser preview was inspected.

**Blockers:** Node child-process creation is denied in this Windows sandbox, so Playwright and the Node-based privacy audit cannot run locally. GitHub CI can run the unchanged release checks. Native Obsidian and physical-device verification have not been performed.

**Next steps:** rebuild the final bundle; commit and push a branch; open a PR and wait for functional, browser, privacy and model CI; resolve any failures; merge to trigger the release; verify the release, tag and assets; update this handoff.

---

# Prior progress — trend chart release (2026-11-04)

**Objective:** improve chart legibility and publish a release.

**Progress: 100%** — version 1.7.0 is published and verified.

- [x] Separate all four scores into aligned, labeled plots; add average intensity.
- [x] Add calendar spacing, time windows and accessible recorded-day exploration.
- [x] Test functional regressions, mobile runtime, desktop layouts, Android Chromium and iPhone WebKit touch/layout emulation, and release privacy. `npm audit` found zero advisories.
- [x] Merge [PR #14](https://github.com/remriel/automatic-mood-history/pull/14), pass GitHub CI and publish [1.7.0](https://github.com/remriel/automatic-mood-history/releases/tag/1.7.0).
- [x] Verify release/tag commit `6ea69593aabfd56ed4b13af2bb5e4673bc6cf831`, all four assets, source blob parity for the three plugin files and the main.js GitHub provenance attestation.

Release workflow: https://github.com/remriel/automatic-mood-history/actions/runs/41935793660. Both main CI and release workflows succeeded. No personal vault, native Obsidian installation or physical mobile device was tested.

**Next steps:** install the release in a test vault and inspect real history on physical devices; collect feedback on readability, date windows and gap interpretation.
