# Project Progress

## Current objective — create the Automatic Mood History community-listing icon

**Progress: 90% - icon artwork is generated and pushed to GitHub; community-listing upload remains.**

- [x] Reconcile this repo's instructions, state, and Git status.
- [x] Confirm the community-directory icon is managed in listing settings, not `manifest.json`.
- [x] Generate a square aubergine/coral heart-sun and timeline icon.
- [x] Save the same 1254×1254 PNG under `assets/community-icon.png` and task outputs.
- [x] Update `audit:release` to allow this one explicitly public directory icon while retaining the image/private-artifact scan for other files.
- [x] Run `npm run audit:release` and `git diff --check`; it permits only this intentional public image while still scanning other images/private files.
- [x] Commit and push the icon asset and audit allowlist on `codex/community-icon-automatic-mood-history` (`4d1fa0e`).
- [ ] Upload it through the Community directory **Edit listing** form if the signed-in editor is accessible.

This icon is a directory-listing asset and stays outside the three-file plugin release bundle. Icon image: a heart-sun in an emotional arc of timestamp nodes.

Published: https://github.com/remriel/automatic-mood-history/releases/tag/1.2.4

- Main CI run `37504613977` passed for commit `f450e84`.
- Release workflow `37504844245` passed; it ran tests, release audit, layout checks, tag/version validation, asset attestation, and GitHub release creation.
- The release body contains the 1.2.4 notes and includes `main.js`, `manifest.json`, and `styles.css`.
- `gh attestation verify` succeeded for all three downloaded release assets using `.github/workflows/release.yml` as the expected signer workflow.
- A convenience zip containing those exact downloaded release assets is in the task outputs. The installed plugin directory was left unchanged during final sync because Obsidian was running.

The directory's Edit listing icon update is still pending. Browser capture failed twice while trying to inspect Edge (`FrameArrived timed out: timed out waiting on channel`, then `window capture timed out: timed out waiting on channel`), so no listing UI change was made.

## Completed 1.2.2 layout milestone

- [x] Read continuity, inspect Git changes, locate public source and live 1.2.1 installation.
- [x] Reproduce chart/table overflow and identify the embedded Base and window-only breakpoint problems.
- [x] Implement pane-responsive charts, history cards, controls/settings, and safe dashboard migration.
- [x] Pass core/provider/migration regressions and browser layout tests; inspect screenshots.
- [x] Back up/install without replacing data; verify native startup/layout and preserved record dates/settings.
- [x] Synchronize GitHub and publish 1.2.2 through the existing tagged-release workflow.

The source started with uncommitted 1.2.1 Groq recovery work below. Preserve it; 1.2.2 includes those fixes instead of resetting the dirty tree. The live installed version is 1.2.1, not the stale 1.2.0 in the previous snapshot. No private-note analysis is required. See `docs/LAYOUT_QA.md` for coverage.

Verified before the user switched to Build Once & Publish: `npm test` and `npm run test:layout` passed core/startup/timestamp/provider/migration tests and light/dark 240–1440px panes, 200% enlargement, long content, dense/empty/insufficient/one-day history, controls, SVG bounds, and observer cleanup. Wide and 390px fictional-data screenshots were reviewed. Source/installed release files matched. No further validation was performed after the workflow change.

Release: https://github.com/remriel/automatic-mood-history/releases/tag/1.2.2
Tag commit: `c11f60292e87729130bee48ffb4d84c8acf6b058`. Release workflow `37178543489` completed successfully and published the three assets. Post-publication hash downloads, browser checks, and further test passes were intentionally skipped at the user's request.

Native 1.2.2 started successfully and rendered the new cards in the user's theme. The installer replaced only the three release code files and proved `data.json` unchanged at copy time. Settings and all record dates are preserved. The user explicitly ran analysis during native verification; retain the updated results, not the backup's older analysis. Prior-scope records stay unchanged. Native screenshots/backups are private. The app was subsequently closed; the full narrow-pane matrix is browser-fixture evidence, not a claim of native measurements at every width.

## Previous staged 1.2.1 work (preserved)

- [x] Reconcile source, Git state, installed provider diagnostics, and current settings.
- [x] Identify the rejected schema field, incomplete-output handling, broken manual retry, and stale failure notices.
- [x] Repair provider requests, output validation, retry state, and local-analysis labels.
- [x] Add focused provider recovery regressions and pass the required build/test suite.
- [x] Install while preserving data and preferences; verify a live Groq response and Obsidian startup (included in 1.2.2).
- [x] Capture the dashboard in dark mode.
- [x] Publish 1.2.2, superseding staged 1.2.1; the existing release workflow succeeded.

The earlier provider failure was HTTP 400 rejection of `uniqueItems`, followed by unusable fallback output. The staged repair is preserved and included in 1.2.2; current installation is 1.2.2.

The 1.2.1 source removes the rejected constraint, supplies schema instructions before the user text, uses low GPT-OSS reasoning without returned reasoning, and retries completion-limit exhaustion once with a larger budget. It validates required result fields, keeps valid unchanged Groq records on a failed retry, serializes date analysis, honors Retry-After, and reports per-run results. A sample-text connection check and visible provider status are implemented. `npm test` passed all existing tests and the new provider recovery suite.

## Completed 1.2.0 milestone

- [x] Replace Daily-folder, filename, and frontmatter date discovery with all-vault Markdown grouping by Obsidian creation timestamp.
- [x] Exclude generated history and trash notes; keep created-date grouping stable when notes are renamed.
- [x] Preserve previous records with a visible legacy date basis.
- [x] Remove obsolete Daily-folder settings and update dashboard, methodology, privacy, and README text.
- [x] Add tests for all folders, timestamp dates overriding titles/frontmatter, exclusions, note grouping, and legacy record preservation.
- [x] Pass the full local test suite and bundle build.
- [x] Install `1.2.0` without replacing `data.json`; verify a fresh Obsidian launch, timestamp-grouped scan, and legacy-record preservation.
- [x] Push to GitHub, confirm CI, tag `1.2.0`, and verify release assets.

## Current implementation state

The public repository is `https://github.com/remriel/automatic-mood-history`; release `1.2.4` is published at https://github.com/remriel/automatic-mood-history/releases/tag/1.2.4. Tag commit: `f450e84dcf85f3b46a0d861ce52a3a821eec0d1e`. Main CI `37504613977` and Release workflow `37504844245` passed. Earlier milestone evidence below is historical.

## Current blockers

None for the requested release. The final manifest and stylesheet have not been copied to the open local Obsidian process; its vault data was left untouched. If the user wants those exact files locally, wait until Obsidian is closed, back up the three plugin code files, copy from the downloaded release assets, and confirm `data.json` remains unchanged.

## Verification performed

- `npm test`, `npm run audit:release`, and `npm run test:layout` passed locally before release.
- Main CI run `37504613977` and tag release workflow `37504844245` both passed.
- The GitHub release contains the 1.2.4 release notes plus `main.js`, `manifest.json`, and `styles.css`.
- `gh attestation verify` succeeded for the exact downloaded release assets, with `.github/workflows/release.yml` enforced as the signer.
- The convenience zip in `outputs/` was assembled from those downloaded, verified GitHub release assets.
- Official Obsidian API declarations define `TFile.stat.ctime` as a millisecond creation timestamp.
- The new timestamp regression test confirms that folder, filename, and frontmatter dates do not override `ctime`; notes from multiple folders are combined, while generated output, trash, non-Markdown files, and timestamp-less notes are skipped.
- The regression test verifies that unchanged legacy analysis is relabeled without rewriting its generated entry or discarding its result.
- `npm test` passed: bundle build, syntax checks, core tests, bundle-load test, startup regression, timestamp grouping, and Groq fallback.
- A fresh Obsidian launch reports runtime version `1.2.0 / loaded`; the live scan grouped all Markdown notes from the Obsidian API by `ctime`, retained prior records as legacy, and reported no plugin errors.
- GitHub CI run `37059163020` and release workflow `37059296342` passed. The published `main.js`, `manifest.json`, and `styles.css` hashes match the source build and installed files.

## Exact next steps

1. No implementation or publication work remains for release 1.2.4.
2. If requested, sync the final release files into the local Obsidian plugin folder after Obsidian is closed, preserving `data.json`.
3. The user can run **Automatic Mood History: Analyze changed notes** to send eligible saved legacy entries to Groq.
