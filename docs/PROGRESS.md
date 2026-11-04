# Progress — trend chart release (2026-11-04)

**Objective:** improve chart legibility and publish a release.

**Progress: 100%** — version 1.7.0 is published and verified.

- [x] Separate all four scores into aligned, labeled plots; add average intensity.
- [x] Add calendar spacing, time windows and accessible recorded-day exploration.
- [x] Test functional regressions, mobile runtime, desktop layouts, Android Chromium and iPhone WebKit touch/layout emulation, and release privacy. `npm audit` found zero advisories.
- [x] Merge [PR #14](https://github.com/remriel/automatic-mood-history/pull/14), pass GitHub CI and publish [1.7.0](https://github.com/remriel/automatic-mood-history/releases/tag/1.7.0).
- [x] Verify release/tag commit `6ea69593aabfd56ed4b13af2bb5e4673bc6cf831`, all four assets, source blob parity for the three plugin files and the main.js GitHub provenance attestation.

Release workflow: https://github.com/remriel/automatic-mood-history/actions/runs/41935793660. Both main CI and release workflows succeeded. No personal vault, native Obsidian installation or physical mobile device was tested.

**Next steps:** install the release in a test vault and inspect real history on physical devices; collect feedback on readability, date windows and gap interpretation.
