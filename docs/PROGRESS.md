# Progress — 1.7.3 range-aware summaries (2026-11-11)

**Objective:** update the average-score tiles to reflect the selected chart range and publish 1.7.3. The Days scored tile also follows the range so its count matches the averages.

**Progress: 100%** — version 1.7.3 is published and the installed plugin files are verified.

- [x] Add all seven ranges and default the chart to 14 days in 1.7.2.
- [x] Update the average and Days scored tiles as the range changes in 1.7.3; preserve full history.
- [x] Pass local desktop and Android/iPhone layout checks; pass main CI and release workflow.
- [x] Publish [1.7.3](https://github.com/remriel/automatic-mood-history/releases/tag/1.7.3); tag points to merge `73245bdfa2a0ba5bf83dadb84efb72fa3ca0fa61`.
- [x] Verify installed version 1.7.3 and all three plugin files against the release assets.

**Current state:** [1.7.3](https://github.com/remriel/automatic-mood-history/releases/tag/1.7.3) is published from PR #17 merge `73245bdfa2a0ba5bf83dadb84efb72fa3ca0fa61`. Its four release assets are available. The average tiles and Days scored count use the selected range; history remains full.

**Verification:** main CI [43092864719](https://github.com/remriel/automatic-mood-history/actions/runs/43092864719) and [release workflow 43092864700](https://github.com/remriel/automatic-mood-history/actions/runs/43092864700) passed, along with local build/check and desktop/mobile layout tests. Native Obsidian and physical-device behavior remain unverified.

**Blockers:** none for the requested work.

**Exact next steps:** none required. Native Obsidian interaction and physical-device rendering remain optional follow-up checks.

---

## Previous progress — solid-line chart release (2026-11-10)

**Objective:** make the four trend plots clearer and more sophisticated, use solid lines for each, and publish a verified release.

**Progress: 100%** — version 1.7.1 is published and its release assets are verified against the merged source.

- [x] Identify the live repository, current chart and existing release workflow.
- [x] Improve the trend plots, selected-day presentation, and missing-score handling without changing stored data.
- [x] Verify solid traces, calendar spacing, accessibility, responsive layouts, and existing functionality with synthetic records.
- [x] Publish [1.7.1](https://github.com/remriel/automatic-mood-history/releases/tag/1.7.1), verify the release/tag and compare the three plugin files with their merged source blobs; validate the optional model.

**Current state:** PR #15 merged as `fdb536a6536a01abb642ab4a48727d0f36c6842b`, the release tag points to that commit, and all four assets are published. The chart uses solid lines, labeled selected values, density-aware points, and a path break for an explicitly missing score; saved series visibility and transient window/day selection are preserved.

**Verification:** local functional/mobile-runtime tests and a narrow synthetic browser preview passed. [PR CI](https://github.com/remriel/automatic-mood-history/actions/runs/42982248734), [main CI](https://github.com/remriel/automatic-mood-history/actions/runs/42982845268), and [release checks](https://github.com/remriel/automatic-mood-history/actions/runs/42982845506) passed, including browser emulation and the privacy audit. The release workflow produced attestations, but local Sigstore verification could not initialize; file-to-source blob comparison passed.

**Remaining checks:** native Obsidian and physical-device testing have not been performed. Next, install 1.7.1 in a separate test vault, inspect sparse/dense histories on desktop and phones, and gather feedback on gap interpretation and the separate-plot layout.

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
