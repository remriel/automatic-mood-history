# Progress — stop repeated recovery scans (2026-11-15)

Objective: recover already-computed Automatic Mood History results without repeating 927 per-date writes or provider analysis, reduce Obsidian scan/render load, and preserve edited monthly notes.

Progress: 95% toward a verified, publishable 1.9.3 candidate. Code, release metadata, regression tests, local checks, and draft GitHub PR are complete; PR CI and publication remain.

- [x] Read installed data and monthly exports without modifying the live vault; identify 927 pending writes, 920 monthly records, and one edited November note.
- [x] Batch pending monthly recovery, preserve edits, and show export conflicts.
- [x] Cache unchanged source metadata with event invalidation and daily content verification; avoid repeated dashboard redraws during scans.
- [x] Stop ordinary scans from upgrading saved fallback scores when no provider retry is pending.
- [x] Verify two live snapshots in memory: the first restored 927 records; the later snapshot cleared the remaining 15 pending writes and yielded 928 total records. Both ended with 0 pending writes, 63 provider retries, 1 edited export warning, 2 JSON saves and 0 provider calls.
- [x] Pass functional, mobile runtime, privacy, desktop layout, Android and iPhone layout suites.
- [x] Sync candidate branch to GitHub and open draft PR #29.
- [ ] Pass PR CI.
- [ ] Publish release and verify remote assets if approved.

Current blocker: the native installed plugin still runs version 1.9.2. It recovered most pending entries by itself during this session but continues retrying the edited monthly export. No live-vault recovery has been performed by this code.

Next steps: (1) wait for PR #29 CI and review its final diff; (2) publish and install only after the release impact is reviewed; (3) restart Obsidian and verify the live backlog clears while keeping the edited monthly note.

---

# Progress — monthly-history recovery, release 1.9.2 (2026-11-15)

Objective: recover saved history from compact monthly exports without replacing newer JSON records or dropping records on refresh.

Progress: 100% toward a verified, published release. [Automatic Mood History 1.9.2](https://github.com/remriel/automatic-mood-history/releases/tag/1.9.2)

- [x] Add JSON-authoritative startup recovery and manual restore for partial loss.
- [x] Preserve existing date-and-basis records and monthly Markdown; make restore analysis/provider-free.
- [x] Reject hash-authorized monthly refreshes that would drop records from a recovery block.
- [x] Prepare 1.9.2 metadata, release notes, changelog, README and persistence protocol updates.
- [x] Pass targeted compact-history regression and full local functional, mobile runtime, privacy, desktop layout and mobile layout checks.
- [x] GitHub CI 43737370306 and release workflow 43737370380 passed for commit `3a9af8b`. Verified the release tag, all four asset digests, source parity, the offline model, and the build attestation.

Native Obsidian and real-vault restoration remain unverified. Next, update to 1.9.2 and reload Obsidian. If needed, use the dashboard or command palette restore after the monthly notes have synced.

---

# Progress — release verification (2026-11-15)

Published 1.9.1: https://github.com/remriel/automatic-mood-history/releases/tag/1.9.1. Release workflow succeeded; all downloaded asset SHA-256 digests and plugin source parity verified.

Progress: 100% toward this verified fix release.

Full npm test, mobile runtime, release privacy audit, desktop layout and mobile Chromium/WebKit layout suites passed. The privacy audit found no sensitive files or private artifacts.

Implementation: Failed Groq retries preserve unchanged complete saved scores from all analyzers. Changed insufficient-evidence settings trigger reevaluation even with Groq enabled. The remote duplicate wisdom filename cleanup was preserved.

## RESUME HERE

No required release steps remain. Native Obsidian and live Groq calls were not tested; no personal vault was modified. This is a verified fix set, not a guarantee that no undiscovered bugs remain.

---

# Progress — release verification (2026-11-15)

Release candidate 1.9.1 verified locally; publication and remote asset verification remain.

Progress: 90% toward this verified fix release.

Full npm test, mobile runtime, release privacy audit, desktop layout and mobile Chromium/WebKit layout suites passed. The privacy audit found no sensitive files or private artifacts.

Implementation: Failed Groq retries preserve unchanged complete saved scores from all analyzers. Changed insufficient-evidence settings trigger reevaluation even with Groq enabled. The remote duplicate wisdom filename cleanup was preserved.

## RESUME HERE

Push the reviewed commit, run the existing release workflow, monitor CI, then download and verify every release asset. Do not mark publication complete until verified.

---

# Progress — 1.9.1 release candidate (2026-11-14)

Objective: preserve unchanged complete scores after failed Groq retries and recheck previously insufficient notes when `minimumCharacters` is lowered.

Progress: 65% — source/tests are being verified; version metadata and release documentation are prepared; release verification/publication remain.

- [x] Set manifest, package, both root lockfile fields, and `versions.json` to 1.9.1; retain minimum Obsidian 1.5.0.
- [x] Add changelog entry and `docs/RELEASE_NOTES_1.9.1.md` for both fixes.
- [ ] Complete runtime verification; primary/verification agents are running the regression checks.
- [ ] Review the final diff and confirm release metadata consistency.
- [ ] Run authorized release workflow and verify the release assets.

GitHub confirms 1.9.0 is already published. The candidate/prepublication instructions in the historical 1.9.0 section below are superseded; they are retained as a record of the earlier handoff state. Native Obsidian and live Groq remain unverified. Next in order: finish runtime checks, review results and diff, then continue with authorized release verification/publication. This metadata task did not run tests/build or publish.

---

# Progress — 1.9.0 release candidate (historical handoff; 2026-11-14)

Objective: add an offline Morning Pages word-list fallback for Groq-offline/failure cases, improve dashboard range refresh and composition periods, and prepare a verified 1.9.0 release.

Progress: 90% — implementation, local release commit/tags, release notes, and functional/mobile checks are complete; remote state review, CI, release asset verification, and publication remain.

- [x] Confirm original release version was 1.8.5 in `HEAD`; set `manifest.json`, `package.json`, `package-lock.json`, and `versions.json` to 1.9.0 while retaining minimum Obsidian 1.5.0.
- [x] Bundle the Morning Pages default feelings/topics matcher and MIT license; keep fallback scores labeled and low confidence, preserve unchanged Groq and older local scores, and retain Groq retry backoff.
- [x] Add the 180-day range, preserve applied preset/custom selection across redraws, retain temporarily detached dashboards until unload, and draw neutral placeholders for all empty composition periods.
- [x] Update README reliability guidance, `CHANGELOG.md`, and required `docs/RELEASE_NOTES_1.9.0.md`; record that task wording “Grok” was interpreted as the plugin's existing Groq provider.
- [x] `npm run build` passed on the final source (306976-byte `main.js`); `npm test` exited 0 after using cached `moment@2.31.0`.
- [x] Primary-agent run of `npm run test:mobile` passed. The release commit and local `v1.9.0` and `1.9.0` tags are at HEAD.
- [x] Final staged privacy scan passed over 106 files with `sensitiveFiles=[]` and `privateArtifacts=[]`; the `npm run audit:release` wrapper itself remains blocked by sandbox `spawnSync git` `EPERM`.
- [ ] Remote state review, main push, workflow/asset verification, and publication remain.
- [ ] Local browser layout check remains unverified: Playwright is not installed or cached; `/opt/meta-chromium/chrome` startup exits 13 with `Hatch WebGL domain policy is required for browser startup`. Native Obsidian and live Groq remain unverified.

Release tag constraint: Obsidian requires the GitHub release tag to equal manifest version exactly, `1.9.0`. The release workflow also rejects a pushed `v1.9.0` tag and runs on any tag; keep the requested v-prefixed alias local. See [Obsidian release docs](https://docs.obsidian.md/plugins/releasing/submit-plugin) and the ordered workspace [release steps](../../RELEASE_STEPS.md). A push to `main` changing `manifest.json` also triggers the workflow and can publish automatically.

`npm run audit:release` could not run locally because its child `spawnSync git` received sandbox `EPERM`; the primary agent's equivalent final staged-file scan passed for 106 files with no sensitive files or private artifacts. The local dependency cache lacked Playwright, so browser layout checks were not run; available Chromium startup also requires the unavailable WebGL domain policy.

Next, in order: (1) inspect remote `main`, remote tag `1.9.0`, and any existing GitHub release, confirming targets and reconciling any existing release; (2) push `main` only so the manifest-triggered workflow creates the numeric tag and release (do not separately push either local tag); (3) monitor the release workflow through completion; (4) verify the release uses tag `1.9.0`, contains the expected notes and actual assets `main.js`, `manifest.json`, `styles.css`, and `moodring-model.bin`, and confirm asset digests, source parity, model validation and attestation; (5) report publication only after these checks pass. Do not claim browser, native Obsidian, or live Groq verification from local tests.

---

# Progress — centered controls and moving-average removal (2026-11-14)

Objective: streamline the dashboard top, center controls and summary cards, and remove moving averages entirely.

Progress: 100% — version 1.8.5 is published and verified.

- [x] Center summary-card rows, toolbar buttons, range controls and series controls.
- [x] Match button size to range buttons and preserve touch targets.
- [x] Remove moving-average controls, explanations, calculations, paths, markers and readout values.
- [x] Verify desktop/mobile layouts and chart interaction tests.
- [x] Publish 1.8.5; verify PR CI, release workflow, asset digests, source parity, model and main.js attestation.

Next: no release work remains. Native theme behavior remains unverified; do not open Obsidian or alter the user's vault unless requested.

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
